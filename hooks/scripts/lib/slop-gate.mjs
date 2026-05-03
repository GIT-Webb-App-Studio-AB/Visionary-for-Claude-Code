// slop-gate.mjs — Sprint 08 Task 22.1
//
// Preventive slop-reject gate. Today (pre-Sprint 8) the capture-and-critique
// hook detects 26 slop patterns and sends them to the critic as
// `design_slop_flags`. The critic lowers the distinctiveness score and the
// loop continues. Output that hit 3 blocker-level patterns still gets
// generated, scored, and eventually shipped — maybe 10 % less generic on
// regen but still recognisable as AI-default.
//
// This module flips that: count slop hits BEFORE the critic is called.
// At or above the threshold, the hook skips the critic round entirely
// and forces a regen with pattern-specific negative prompts (22.2).
//
// Whitelist (22.3): styles can opt specific patterns out of the reject
// count. A brutalist style that uses default Tailwind blue ironically
// should not be blocked. Each whitelisted pattern still appears in the
// output's slop_detections array (for audit), it just doesn't count
// toward the reject threshold.
//
// Zero dependencies. Node 18+.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_REJECT_THRESHOLD = 2;

// ── Threshold resolution ────────────────────────────────────────────────────
// Reads VISIONARY_SLOP_REJECT_THRESHOLD from env; falls back to default.
// Setting it to a value > 26 (the pattern catalogue size) effectively
// disables the gate — useful for CI runs or debugging a divergent output.
export function resolveThreshold(env = process.env) {
  const raw = env.VISIONARY_SLOP_REJECT_THRESHOLD;
  if (raw == null || raw === '') return DEFAULT_REJECT_THRESHOLD;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_REJECT_THRESHOLD;
}

// ── Public: shouldReject ────────────────────────────────────────────────────
// Inputs:
//   slopFlags         — string[] from capture-and-critique's detector
//   styleWhitelist    — string[] OR undefined — pattern names the active
//                       style has explicitly permitted via allows_slop
//   threshold         — number; default from env
//
// Returns:
//   {
//     rejected: boolean,
//     blocking_count: <int>,          // hits that actually counted
//     whitelisted_count: <int>,       // hits that were skipped
//     blocking_patterns: string[],    // names of hits that counted
//     whitelisted_patterns: string[], // names of hits that were skipped
//     threshold_used: <int>,
//     reason: string | null,          // null when rejected=false
//   }
//
// No side-effects. Callers are responsible for trace emission and any
// downstream force-regen logic.
export function shouldReject({
  slopFlags,
  styleWhitelist,
  threshold,
} = {}) {
  const t = Number.isFinite(threshold) ? threshold : resolveThreshold();
  const flags = Array.isArray(slopFlags) ? slopFlags.filter((f) => typeof f === 'string') : [];
  const whitelist = normaliseWhitelist(styleWhitelist);

  const blocking_patterns = [];
  const whitelisted_patterns = [];
  for (const flag of flags) {
    if (matchesWhitelist(flag, whitelist)) {
      whitelisted_patterns.push(flag);
    } else {
      blocking_patterns.push(flag);
    }
  }

  const rejected = blocking_patterns.length >= t && t > 0;

  return {
    rejected,
    blocking_count: blocking_patterns.length,
    whitelisted_count: whitelisted_patterns.length,
    blocking_patterns,
    whitelisted_patterns,
    threshold_used: t,
    reason: rejected
      ? `${blocking_patterns.length} blocking slop patterns (>= ${t} threshold)`
      : null,
  };
}

// ── Whitelist normalisation ────────────────────────────────────────────────
// Styles declare `allows_slop` in frontmatter as an array of pattern names.
// Matching is case-insensitive and substring-based: a whitelist entry of
// "default tailwind blue" matches any flag that contains that phrase. This
// is intentional — flag names in the detector include extra context like
// "... detected" or "... as primary color" and brittle exact-match would
// force style authors to copy 80-character strings verbatim.
function normaliseWhitelist(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.toLowerCase().trim());
}

function matchesWhitelist(flag, whitelist) {
  if (!whitelist.length) return false;
  const lc = flag.toLowerCase();
  return whitelist.some((w) => lc.includes(w));
}

// ── Style frontmatter parsing ──────────────────────────────────────────────
// Style files use YAML frontmatter between ---...--- fences. We extract the
// allows_slop array via a small grep-style parser rather than pulling in a
// full YAML dep — the repo is deliberately zero-dep.
//
// Supported shapes:
//   allows_slop: [item1, item2]
//   allows_slop:
//     - "item one"
//     - "item two"
//
// Returns { patterns: string[], reason: string | null }.
export function parseStyleAllowsSlop(frontmatterText) {
  const out = { patterns: [], reason: null };
  if (typeof frontmatterText !== 'string') return out;

  // Inline array form
  const inline = frontmatterText.match(/^allows_slop:\s*\[([^\]]*)\]/m);
  if (inline) {
    out.patterns = splitArrayEntries(inline[1]);
  } else {
    // Multi-line list form
    const multi = frontmatterText.match(/^allows_slop:\s*\n((?:\s+-\s+.+\n?)+)/m);
    if (multi) {
      out.patterns = multi[1]
        .split('\n')
        .map((line) => line.replace(/^\s+-\s+/, '').trim())
        .map(stripQuotes)
        .filter(Boolean);
    }
  }

  const reason = frontmatterText.match(/^allows_slop_reason:\s*(.+)$/m);
  if (reason) out.reason = stripQuotes(reason[1].trim());

  return out;
}

// Mirrors parseStyleAllowsSlop. Frontmatter shape:
//   allows_structural:
//     hard_fail_skips: [duplicate-heading, footer-grid-collapse]
//     warning_skips: [mystery-text-node]
// Returns { hard_fail_skips: string[], warning_skips: string[] }.
export function parseStyleAllowsStructural(frontmatterText) {
  const out = { hard_fail_skips: [], warning_skips: [] };
  if (typeof frontmatterText !== 'string') return out;

  const blockMatch = frontmatterText.match(/^allows_structural:\s*\n((?:[ \t]+.*\n?)+)/m);
  if (!blockMatch) return out;
  const body = blockMatch[1];

  for (const subKey of ['hard_fail_skips', 'warning_skips']) {
    const inline = body.match(new RegExp(`^[ \\t]+${subKey}:\\s*\\[([^\\]]*)\\]`, 'm'));
    if (inline) {
      out[subKey] = splitArrayEntries(inline[1]);
      continue;
    }
    const multi = body.match(new RegExp(`^[ \\t]+${subKey}:\\s*\\n((?:[ \\t]+-[ \\t]+.+\\n?)+)`, 'm'));
    if (multi) {
      out[subKey] = multi[1]
        .split('\n')
        .map((line) => line.replace(/^[ \t]+-[ \t]+/, '').trim())
        .map(stripQuotes)
        .filter(Boolean);
    }
  }
  return out;
}

function splitArrayEntries(inner) {
  // Split on commas that aren't inside quoted strings. Small-enough input
  // that the naive tokeniser is fine — style frontmatter is never massive.
  const parts = [];
  let current = '';
  let quote = null;
  for (const ch of inner) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === ',') { if (current.trim()) parts.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts.map(stripQuotes).filter(Boolean);
}

function stripQuotes(s) {
  return s.replace(/^["']|["']$/g, '');
}

// ── Public: synthesiseRejectCritique ───────────────────────────────────────
// When the gate rejects, we need to return SOMETHING that looks like a
// critic-output so the round-budget accounting and loop-control logic
// stays consistent. This builder produces a schema-valid critique object
// with:
//   - All scoring dimensions null (no actual scoring happened)
//   - top_3_fixes entries for each blocking pattern (severity: blocker)
//   - convergence_signal: false (we want the loop to try again)
//   - A minimal prompt_hash echoing that this was gate-synthesised
//
// Consumers treat this the same as a real critic output: apply fixes
// in the next round, log, etc. The distinguishing field is
// `synthesised_by: "slop-gate"` so downstream can tell.
export function synthesiseRejectCritique({
  round,
  blocking_patterns,
  promptHash,
}) {
  const fixes = blocking_patterns.slice(0, 3).map((pattern) => ({
    dimension: inferDimensionFromPattern(pattern),
    severity: 'blocker',
    proposed_fix: `Eliminate slop pattern: "${pattern}". See docs/slop-directives for the avoid/consider guidance.`,
    evidence: {
      type: 'metric',
      value: `slop_pattern="${pattern.slice(0, 120)}"`,
    },
  }));
  // Schema requires numbers for 8 of 10 dimensions (craft_measurable and
  // content_resilience can be null). Since the gate short-circuits before
  // any real scoring happens, we emit 0 — it signals "this output is not
  // worth scoring, regenerate" AND it guarantees early-exit can't fire
  // (early-exit needs min(scores) >= 8.0). The craft + content dims stay
  // null because their numeric scorers never ran.
  return {
    round: Number.isInteger(round) ? round : 1,
    scores: {
      hierarchy:          0,
      layout:             0,
      typography:         0,
      contrast:           0,
      distinctiveness:    0,
      brief_conformance:  0,
      accessibility:      0,
      motion_readiness:   0,
      craft_measurable:   null,
      content_resilience: null,
    },
    confidence: {},
    top_3_fixes: fixes,
    convergence_signal: false,
    slop_detections: blocking_patterns.map((pattern, i) => ({ pattern_id: i + 1, severity: 'blocker' })),
    axe_violations_count: 0,
    numeric_scores: { enabled: false, notes: ['slop-gate synthesised critique — no numeric scoring performed'] },
    prompt_hash: typeof promptHash === 'string' && /^sha256:[0-9a-f]{16,64}$/.test(promptHash)
      ? promptHash
      : 'sha256:0000000000000000',
    synthesised_by: 'slop-gate',
  };
}

// ── Public: whitelist loading for a written file ───────────────────────────
// Reads the `.visionary-generated` marker at the top of the written file
// (same convention as harvest-git-signal.mjs uses) to get the active
// style id, then loads that style's .md via _index.json and parses its
// frontmatter for allows_slop. Any failure path returns an empty whitelist
// (conservative — gate still fires; style author can add a marker or
// frontmatter whitelist to relax).
//
// Returns { styleId, patterns, reason } so callers can log both what the
// whitelist contains AND why the style chose it.
const __slopGateFilename = fileURLToPath(import.meta.url);
const __slopGateRepoRoot = resolve(dirname(__slopGateFilename), '..', '..', '..');

export function loadActiveStyleWhitelist(filePath, { repoRoot } = {}) {
  const empty = {
    styleId: null,
    patterns: [],
    reason: null,
    structural: { hard_fail_skips: new Set(), warning_skips: new Set() },
  };
  if (!filePath || typeof filePath !== 'string' || !existsSync(filePath)) return empty;
  let head;
  try { head = readFileSync(filePath, 'utf8').slice(0, 2048); } catch { return empty; }
  // Same regex shape as harvest-git-signal.readMarker — a style: field inside the
  // .visionary-generated comment block.
  if (!head.includes('.visionary-generated')) return empty;
  const m = head.match(/\*\s*style\s*:\s*["']?([^"'\n\r]+?)["']?\s*(?:\n|\r|\*\/)/i);
  if (!m) return empty;
  const styleId = m[1].trim();

  // Resolve style file path from _index.json. We prefer the index over a
  // fs-walk because the index is pre-built and fast, and a missing entry
  // means the style id was either wrong or the index is stale — both
  // warrant a conservative empty-whitelist fallback.
  const root = repoRoot || __slopGateRepoRoot;
  const indexPath = join(root, 'skills', 'visionary', 'styles', '_index.json');
  if (!existsSync(indexPath)) return { ...empty, styleId };
  let indexEntries;
  try { indexEntries = JSON.parse(readFileSync(indexPath, 'utf8')); } catch { return { ...empty, styleId }; }
  const entry = Array.isArray(indexEntries)
    ? indexEntries.find((e) => e && e.id === styleId)
    : null;
  if (!entry || !entry.path) return { ...empty, styleId };
  const styleFile = join(root, entry.path);
  if (!existsSync(styleFile)) return { ...empty, styleId };
  let body;
  try { body = readFileSync(styleFile, 'utf8'); } catch { return { ...empty, styleId }; }
  const frontmatterMatch = body.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return { ...empty, styleId };
  const parsed = parseStyleAllowsSlop(frontmatterMatch[1]);
  const struct = parseStyleAllowsStructural(frontmatterMatch[1]);
  return {
    styleId,
    patterns: parsed.patterns,
    reason: parsed.reason,
    structural: {
      hard_fail_skips: new Set(struct.hard_fail_skips),
      warning_skips: new Set(struct.warning_skips),
    },
  };
}

// Pattern → dimension mapping. Coarse: each slop pattern points at the
// dimension most likely to own the fix. We err toward distinctiveness
// (aesthetic critic's territory) because that's where "this looks like
// every other AI landing page" lives.
function inferDimensionFromPattern(pattern) {
  const lc = pattern.toLowerCase();
  if (/contrast|low contrast/.test(lc))            return 'contrast';
  if (/typography|font|typeface|poppins|inter/.test(lc)) return 'typography';
  if (/layout|grid|padding|card|uniform/.test(lc)) return 'layout';
  if (/placeholder|kit|lorem/.test(lc))            return 'content_resilience';
  return 'distinctiveness';
}
