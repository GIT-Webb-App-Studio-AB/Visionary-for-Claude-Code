// taste-extractor.mjs — Sprint 05 Task 14.2.
//
// Extracts structured taste-facts from a user-turn string. Runs as a pure
// function inside the UserPromptSubmit hook — no I/O, no network, no side
// effects so it stays unit-testable.
//
// The sprint plan specifies a Haiku 4.5 call for rich semantic extraction.
// The plugin architecture doesn't expose a usable SDK surface today (same
// blocker Sprint 01/02 documented), so this module ships a heuristic path
// as the primary mode and keeps an `--llm` seam open for Sprint 06 to wire
// once the SDK adapter lands. The heuristic is deterministic and dep-free;
// the `--llm` mode is a stub that falls back to heuristic and emits a
// side-channel hint for future enrichment.
//
// Contract (matches sprint spec):
//   extractFactsFromTurn(userMessage, ctx, existingFactKeys)
//     → { facts: Fact[], upgrades: {key, evidenceDelta}[] }
//
//   - `facts` are new facts to append (their key is not in existingFactKeys).
//   - `upgrades` are evidence to append to an existing fact (dedup path).
//   - Both respect the taste-fact.schema.json shape — the caller only needs
//     to call appendFact / mutate existing fact to apply them.
//
// Heuristic design:
//   - Lowercased substring scan against curated pattern tables (reject/
//     approve phrases, style/pattern/color/typography keyword tables).
//   - Each match produces one fact candidate with confidence tuned to the
//     signal strength (explicit "hate" → 0.85, vague "meh" → 0.5).
//   - Only one fact per (target_type, target_value) per turn — the caller
//     deduplicates further against on-disk facts via existingFactKeys.
//
// Shipping note: this replaces update-taste.mjs's flat append-to-system.md
// logic. system.md is kept read-only as the legacy fallback (see
// scripts/migrate-system-md-to-facts.mjs).

import { ulid, nowIso, factKey } from './taste-io.mjs';

// ── Pattern tables ───────────────────────────────────────────────────────────
// These mirror update-taste.mjs's original lists but are promoted to named
// constants so the taste-extractor test suite can assert coverage. Keep in
// sync with any future additions — tests snapshot the counts.

// Strong-reject phrases carry higher confidence (0.85) than soft ones (0.6).
const STRONG_REJECT = [
  'ugly', 'hate this', 'hate it', 'too generic', 'looks like every',
  'start over', 'completely different', 'too corporate', 'basic',
  'like chatgpt', 'terrible', 'awful', 'garbage',
];
const SOFT_REJECT = [
  'try again', 'too playful', 'too dark', 'too minimal', 'boring', 'bland',
  'not quite', 'not what i wanted', 'hmm', 'meh', 'generic',
];

const STRONG_APPROVE = [
  'this is it', 'love this', 'perfect', 'exactly what i wanted',
  'yes exactly', 'nailed it', 'amazing',
];
const SOFT_APPROVE = [
  'keep that style', 'more like this', 'love the typography',
  'love the colors', 'love the motion', 'like this direction',
  'good direction', 'on the right track',
];

// Style-specific keyword hits — when a reject/approve signal is in the same
// turn as one of these, we upgrade the fact from a generic "pattern" to a
// specific target_type. The tables intentionally stay small; a richer
// taxonomy lives in skills/visionary/styles/_index.json and would be noisy
// to scan every turn.
const STYLE_KEYWORDS = {
  // target_type: style_id (exact match against _index.json id) — highest confidence
  style_id: [
    'fintech-trust', 'saas-b2b-dashboard', 'neobank', 'bauhaus', 'swiss-rationalism',
    'dieter-rams', 'art-deco', 'bloomberg-terminal', 'newspaper-broadsheet',
    'glassmorphism', 'neobrutalism', 'constructivism', 'bento-grid',
    'scandinavian-nordic', 'japanese-minimalism', 'zen-void',
    'y2k-futurism', 'vaporwave', 'synthwave', 'cyberpunk-neon',
    'terminal-cli', 'kinetic-type', 'big-bold-type',
  ],
  // target_type: pattern (free-text, lower confidence, no hard-block)
  pattern: [
    'glassmorphism', 'gradient text', 'gradient background', 'dark mode',
    'rounded everything', 'centered text', 'hero section', 'sidebar', 'kpi',
    'emoji icons', 'soft shadows',
  ],
  palette_tag: ['dark', 'light', 'neon', 'pastel', 'monochrome', 'warm', 'cool'],
  motion_tier: ['static', 'subtle', 'expressive', 'kinetic'],
  typography_family: ['inter', 'helvetica', 'arial', 'serif', 'mono', 'monospace', 'grotesque'],
  density_level: ['sparse', 'balanced', 'dense'],
};

// ── Confidence calibration ──────────────────────────────────────────────────
// Tunable constants — expose as named exports so test fixtures can assert on
// them. Changing these changes the promotion-threshold math in taste-aging.
export const CONFIDENCE = Object.freeze({
  STRONG_EXPLICIT: 0.85,
  SOFT_EXPLICIT: 0.55,
  GIT_DELETE: 0.75,
  GIT_HEAVY_EDIT: 0.6,
  GIT_KEPT: 0.4,  // positive but weaker — user didn't touch but that's passive
  PAIRWISE_PICK: 0.65,
});

// Upgrade step applied to existing-fact confidence when new evidence arrives.
// Bounded so repeated hits can't blow past 0.95 (leaves headroom for
// explicit user re-confirmation to hit 1.0 via /visionary-taste).
export const CONFIDENCE_UPGRADE = 0.08;
export const CONFIDENCE_MAX_VIA_UPGRADE = 0.95;

// ── Public entry point ──────────────────────────────────────────────────────
export function extractFactsFromTurn(userMessage, ctx = {}, existingFactKeys = new Set()) {
  if (typeof userMessage !== 'string' || !userMessage.trim()) {
    return { facts: [], upgrades: [] };
  }

  const lower = userMessage.toLowerCase();
  const quote = shortQuote(userMessage);
  const at = nowIso();

  // Step 1 — detect direction (reject vs approve). A turn can contain both;
  // mixed signals produce mixed facts (caller decides what to do with them).
  const direction = classifyDirection(lower);
  if (!direction.reject && !direction.approve) {
    return { facts: [], upgrades: [] };
  }

  // Step 2 — enumerate candidate (target_type, target_value) pairs from the
  // keyword tables. Only keywords actually present in the turn become facts.
  const targets = scanTargets(lower);

  // Step 3 — if no specific target was found but the turn has a strong reject
  // signal, fall back to a project-scoped "pattern" fact using a truncated
  // quote. This preserves the original update-taste.mjs behaviour (record
  // that SOMETHING was rejected even if we can't name the axis).
  if (targets.length === 0 && (direction.reject || direction.approve)) {
    targets.push({
      target_type: 'pattern',
      target_value: summarizePattern(quote),
      confidence: direction.reject ? direction.rejectConfidence : direction.approveConfidence,
    });
  }

  // Step 4 — materialize each target as a Fact or an upgrade to an existing
  // fact. Scope is project-level by default because most user feedback is
  // project-bound; global signals come from cross-project aggregation later.
  const out = { facts: [], upgrades: [] };
  for (const t of targets) {
    const dir = direction.reject && !direction.approve ? 'avoid'
              : direction.approve && !direction.reject ? 'prefer'
              : t.target_type === 'pattern' && direction.reject ? 'avoid' : 'prefer';
    const conf = dir === 'avoid'
      ? Math.max(t.confidence, direction.rejectConfidence)
      : Math.max(t.confidence, direction.approveConfidence);

    const fact = buildFact({
      scope: pickScope(t, ctx),
      direction: dir,
      target_type: t.target_type,
      target_value: t.target_value,
      evidenceKind: dir === 'avoid' ? 'explicit_rejection' : 'explicit_approval',
      quote,
      confidence: conf,
      at,
    });
    const key = factKey(fact);
    if (existingFactKeys.has(key)) {
      out.upgrades.push({
        key,
        evidenceDelta: { kind: fact.evidence[0].kind, quote_or_diff: quote, at },
      });
    } else {
      out.facts.push(fact);
    }
  }

  return dedupeFacts(out);
}

// ── Direction classifier ────────────────────────────────────────────────────
function classifyDirection(lower) {
  const reject = STRONG_REJECT.some((p) => lower.includes(p)) || SOFT_REJECT.some((p) => lower.includes(p));
  const approve = STRONG_APPROVE.some((p) => lower.includes(p)) || SOFT_APPROVE.some((p) => lower.includes(p));
  const rejectConfidence = STRONG_REJECT.some((p) => lower.includes(p))
    ? CONFIDENCE.STRONG_EXPLICIT : (reject ? CONFIDENCE.SOFT_EXPLICIT : 0);
  const approveConfidence = STRONG_APPROVE.some((p) => lower.includes(p))
    ? CONFIDENCE.STRONG_EXPLICIT : (approve ? CONFIDENCE.SOFT_EXPLICIT : 0);
  return { reject, approve, rejectConfidence, approveConfidence };
}

// ── Target scanner ──────────────────────────────────────────────────────────
function scanTargets(lower) {
  const out = [];
  for (const [target_type, keywords] of Object.entries(STYLE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        out.push({
          target_type,
          target_value: kw,
          confidence: target_type === 'style_id' ? CONFIDENCE.STRONG_EXPLICIT : CONFIDENCE.SOFT_EXPLICIT,
        });
      }
    }
  }
  return out;
}

// ── Scope selection ─────────────────────────────────────────────────────────
// style_id facts stay project-scoped by default (taste is largely
// project-bound). motion_tier / typography_family / density_level are
// closer to personal taste and default to global. Callers can override via
// ctx.forcedScope if they have more signal.
function pickScope(target, ctx) {
  if (ctx.forcedScope) return ctx.forcedScope;
  const globalPreferred = new Set(['motion_tier', 'typography_family', 'density_level', 'palette_tag']);
  const level = globalPreferred.has(target.target_type) ? 'global' : 'project';
  const key = level === 'global' ? '*' : (ctx.projectKey || 'unknown');
  return { level, key };
}

// ── Fact builder ────────────────────────────────────────────────────────────
function buildFact({ scope, direction, target_type, target_value, evidenceKind, quote, confidence, at }) {
  return {
    id: ulid(),
    scope,
    signal: { direction, target_type, target_value },
    evidence: [{ kind: evidenceKind, quote_or_diff: quote, at }],
    confidence,
    created_at: at,
    last_seen: at,
    flag: 'active',
  };
}

// ── Dedupe within-turn ──────────────────────────────────────────────────────
// A single turn can match the same keyword via both a style_id and a pattern
// keyword (e.g. "glassmorphism" is in both tables). We keep the highest-
// confidence version per factKey and drop the others. This runs BEFORE the
// caller checks existingFactKeys so the upgrade path also dedupes cleanly.
function dedupeFacts({ facts, upgrades }) {
  const byKey = new Map();
  for (const f of facts) {
    const k = factKey(f);
    const prev = byKey.get(k);
    if (!prev || f.confidence > prev.confidence) byKey.set(k, f);
  }
  return { facts: Array.from(byKey.values()), upgrades };
}

// ── Evidence-driven confidence upgrade ──────────────────────────────────────
// When extractor returns an `upgrade`, the caller loads the existing fact,
// appends the new evidence, bumps last_seen, and raises confidence by
// CONFIDENCE_UPGRADE (capped). This function encapsulates that mutation so
// the rules stay in one place.
export function applyUpgrade(existingFact, evidenceDelta) {
  const nextConfidence = Math.min(
    CONFIDENCE_MAX_VIA_UPGRADE,
    (existingFact.confidence || 0) + CONFIDENCE_UPGRADE,
  );
  return {
    ...existingFact,
    evidence: [...(existingFact.evidence || []), evidenceDelta],
    last_seen: evidenceDelta.at || nowIso(),
    confidence: nextConfidence,
    // A decayed fact reactivates on new evidence — see Task 14.3 rules.
    flag: existingFact.flag === 'decayed' ? 'active' : existingFact.flag,
  };
}

// ── Quote + pattern summarisers ─────────────────────────────────────────────
// quote_or_diff is capped at 240 chars by the schema; we truncate hard at 200
// to leave headroom for diff-summary prefixes downstream.
function shortQuote(s) {
  return s.slice(0, 200)
    .replace(/\s+/g, ' ')
    .replace(/[`*_#>[\]]/g, ' ')
    .replace(/"/g, "'")
    .trim();
}

function summarizePattern(quote) {
  // Collapse to a short phrase usable as a target_value (max ~80 chars for
  // readability in /visionary-taste show output). Falls back to the first
  // 6 tokens if no capitalised keyword jumps out.
  const tokens = quote.split(/\s+/).slice(0, 6);
  return tokens.join(' ').slice(0, 80) || 'unspecified-pattern';
}
