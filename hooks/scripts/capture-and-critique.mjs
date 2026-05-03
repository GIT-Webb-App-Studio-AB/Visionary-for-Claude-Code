#!/usr/bin/env node
// capture-and-critique.mjs
// PostToolUse hook for Write|Edit|MultiEdit.
// Reads JSON from stdin per official hooks spec (https://code.claude.com/docs/en/hooks).
// Emits additionalContext instructing Claude to capture a screenshot via Playwright MCP
// on the next turn, run deterministic slop-scan on the file, and invoke the visual-critic
// subagent with the screenshot + brief.
//
// Cross-platform (no xxd, md5sum, sed): Node 18+ only.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isBonEnabled,
  buildCandidateArtefactPaths,
  buildFanOutInstructions,
  computeVerifierPromptHash,
  concurrencyLimit,
  CANDIDATE_TIMEOUT_MS,
  BON_ROUND2_EXIT_CRAFT,
} from './lib/fork-candidate.mjs';
// Sprint 6 Task 17.4 + 18.3 + 19.2: RAG anchors, multi-agent critic, traces.
import { buildAnchors } from './lib/rag-anchors.mjs';
import { trace } from './lib/trace.mjs';
// Sprint 8 Task 22.1 + 22.2: preventive slop-reject gate + avoid-directives.
import {
  shouldReject,
  synthesiseRejectCritique,
  parseStyleAllowsSlop,
  loadActiveStyleWhitelist,
} from './lib/slop-gate.mjs';
import { buildDirectiveBlock } from './lib/slop-directives.mjs';
import {
  evaluate as evaluateStructural,
  buildStructuralDirectiveBlock,
  buildStructuralWarningsBlock,
} from './lib/structural-gate.mjs';
// Sprint 9 Task 24.10: Motion Scoring 2.0 — inject 6-sub-dim scores so critic
// can cite the exact sub-dim that drags motion_readiness down.
import { buildMotionContextBlock } from './lib/motion/inject.mjs';

const MAX_ROUNDS = 3;
const CONTEXT_CAP = 10_000;
// Debounce: when a file is written multiple times in rapid succession (e.g. MultiEdit
// followed by a quick formatter pass) we want ONE critique at the end, not one per
// write. Skip if we critiqued this file within the last DEBOUNCE_MS.
const DEBOUNCE_MS = 3_000;
// Hard opt-out: users can disable the hook entirely via env for noisy refactors
// or CI runs without editing hooks.json.
const DISABLE_ENV = process.env.VISIONARY_DISABLE_CRITIQUE;
// Sprint 6 Task 18.3: multi-critic mode. When enabled, the hook instructs
// Claude to invoke critic-craft AND critic-aesthetic in parallel and merge
// via hooks/scripts/lib/critic-merge.mjs instead of running the unified
// visual-critic. Default OFF during Sprint 6 rollout — behaviour change is
// material and we want to validate incrementally.
const MULTI_CRITIC = (() => {
  const v = process.env.VISIONARY_MULTI_CRITIC;
  return v === '1' || v === 'true' || v === 'TRUE';
})();

// ── Read stdin JSON ──────────────────────────────────────────────────────────
function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function parseInput(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Emit a result JSON and exit ──────────────────────────────────────────────
function emit(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

function silent() {
  process.exit(0);
}

// ── Main ─────────────────────────────────────────────────────────────────────
if (DISABLE_ENV && DISABLE_ENV !== '0' && DISABLE_ENV.toLowerCase() !== 'false') silent();

const input = parseInput(readStdin());
if (!input) silent();

const toolName = input.tool_name || '';
if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) silent();

const toolInput = input.tool_input || {};
const filePath = toolInput.file_path || toolInput.path || '';
if (!filePath) silent();

const ext = filePath.split('.').pop().toLowerCase();
if (!['tsx', 'jsx', 'vue', 'svelte', 'html'].includes(ext)) silent();

if (!existsSync(filePath)) silent();

// ── Round tracking (per-project cache) ───────────────────────────────────────
// Prefer CLAUDE_PLUGIN_DATA (durable across plugin updates, kept out of the
// user's repo) when Claude Code provides it; fall back to the project root so
// older harnesses keep working.
const cwd = input.cwd || process.cwd();
const pluginDataDir = process.env.CLAUDE_PLUGIN_DATA;
const cacheDir = pluginDataDir
  ? join(pluginDataDir, 'visionary-cache')
  : join(cwd, '.visionary-cache');
try { mkdirSync(cacheDir, { recursive: true }); } catch { /* ignore */ }

const fileHash = createHash('md5').update(filePath).digest('hex').slice(0, 10);
const roundFile = join(cacheDir, `critique-round-${fileHash}`);
const timestampFile = join(cacheDir, `critique-ts-${fileHash}`);

// Debounce: if we critiqued this file within the last DEBOUNCE_MS ms, skip.
// Effectively makes the hook async: rapid multi-edits collapse into ONE critique
// at the tail of the burst, instead of a noisy critique per Write.
if (existsSync(timestampFile)) {
  try {
    const last = parseInt(readFileSync(timestampFile, 'utf8').trim(), 10) || 0;
    if (Date.now() - last < DEBOUNCE_MS) silent();
  } catch { /* ignore */ }
}
try { writeFileSync(timestampFile, String(Date.now())); } catch { /* ignore */ }

let round = 1;
if (existsSync(roundFile)) {
  try { round = parseInt(readFileSync(roundFile, 'utf8').trim(), 10) || 1; } catch { /* ignore */ }
}

if (round > MAX_ROUNDS) {
  try { writeFileSync(roundFile, '1'); } catch { /* ignore */ }
  silent();
}

// Artefact paths — Claude writes the screenshot via MCP and the DOM / axe
// snapshots via browser_evaluate before invoking the numeric scorer CLI.
const screenshotPath  = join(tmpdir(), `visionary-screenshot-${fileHash}-${round}.png`);
const domSnapshotPath = join(tmpdir(), `visionary-dom-${fileHash}-${round}.json`);
const axeSnapshotPath = join(tmpdir(), `visionary-axe-${fileHash}-${round}.json`);
const numericOutPath  = join(tmpdir(), `visionary-numeric-${fileHash}-${round}.json`);

// Repo root — resolves the scorer CLI, schema, and calibration paths absolutely
// so the hook works regardless of Claude Code's cwd.
const hookDir  = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(hookDir, '..', '..');
const scorerCli        = join(repoRoot, 'benchmark', 'scorers', 'numeric-aesthetic-scorer.mjs');
const criticAgentPath  = join(repoRoot, 'agents', 'visual-critic.md');
const verifierAgentPath = join(repoRoot, 'agents', 'visual-verifier.md');
const critiqueSchemaPath = join(repoRoot, 'skills', 'visionary', 'schemas', 'critique-output.schema.json');
const calibrationPath  = join(repoRoot, 'skills', 'visionary', 'calibration.json');

// Sprint 07 Task 21.5 — content-resilience: three-render paths for p50 / p95 /
// empty DOM snapshots. Only used when visionary-kit.json is present in the
// project — otherwise the critic emits null for content_resilience.
const domP50Path    = join(tmpdir(), `visionary-dom-p50-${fileHash}-${round}.json`);
const domP95Path    = join(tmpdir(), `visionary-dom-p95-${fileHash}-${round}.json`);
const domEmptyPath  = join(tmpdir(), `visionary-dom-empty-${fileHash}-${round}.json`);
const resilienceOutPath = join(tmpdir(), `visionary-resilience-${fileHash}-${round}.json`);
const kitPath = join(cwd, 'visionary-kit.json');
const hasKit = existsSync(kitPath);
const resilienceScorerCli = join(repoRoot, 'benchmark', 'scorers', 'content-resilience-scorer.mjs');

// Per-file cache of the previous round's parsed critique JSON. The visual-
// critic writes it here at the end of each round so the NEXT round's hook
// invocation can decide whether to fan out (BoN requires top_3_fixes to
// re-implement; convergence_signal or empty fixes mean no fan-out).
const lastCritiquePath = join(cacheDir, `last-critique-${fileHash}.json`);

// Version-lock hash (Sprint 3 Task 9.4): hash of the critic system prompt +
// schema bytes. Emitted into additionalContext so the subagent echoes it back
// in the critique output; runtime calibration compares against the committed
// calibration.json to decide whether kalibrated scores can be applied.
function computePromptHash() {
  try {
    const criticBody = readFileSync(criticAgentPath, 'utf8');
    const schemaBody = readFileSync(critiqueSchemaPath, 'utf8');
    const h = createHash('sha256');
    h.update(criticBody);
    h.update('\n---schema---\n');
    h.update(schemaBody);
    return 'sha256:' + h.digest('hex').slice(0, 16);
  } catch {
    return 'sha256:unknown';
  }
}
const promptHash = computePromptHash();

// Load calibration.json if present and its prompt_hash matches ours. Anything
// else (missing, stale, corrupt) → run uncalibrated with a visible warning.
function loadCalibration() {
  if (!existsSync(calibrationPath)) {
    return { status: 'absent', data: null };
  }
  try {
    const data = JSON.parse(readFileSync(calibrationPath, 'utf8'));
    if (data.critic_prompt_hash && data.critic_prompt_hash !== promptHash) {
      return { status: 'stale', data };
    }
    return { status: 'fresh', data };
  } catch {
    return { status: 'corrupt', data: null };
  }
}
const calibration = loadCalibration();

// Sprint 4: verifier prompt-hash (separate from critic's — the verifier is
// selection, not scoring, so its hash doesn't invalidate calibration).
let verifierPromptHash = 'sha256:unknown';
try {
  verifierPromptHash = computeVerifierPromptHash(readFileSync(verifierAgentPath, 'utf8'));
} catch { /* verifier not on disk yet → BoN degrades to single-best-effort */ }

// Load the previous round's critique so Best-of-N can decide whether to
// fan out. Missing / corrupt → treat as absent (BoN remains off for round 1
// anyway, and round 2+ without a prior critique is a cache eviction we
// handle by falling back to sequential refine.)
function loadPreviousCritique() {
  if (!existsSync(lastCritiquePath)) return null;
  try {
    return JSON.parse(readFileSync(lastCritiquePath, 'utf8'));
  } catch {
    return null;
  }
}
const previousCritique = loadPreviousCritique();
const bonDecision = isBonEnabled({ env: process.env, round, previousCritique });

// Build per-candidate artefact paths ahead of time so both the fan-out
// instructions and the post-fanout metrics can reference the same set.
const candidatePaths = bonDecision.enabled
  ? buildCandidateArtefactPaths({ fileHash, round })
  : null;

// ── Deterministic slop pattern detection (patterns 1-20) ─────────────────────
let source = '';
try { source = readFileSync(filePath, 'utf8'); } catch { silent(); }

// Strip comments and string literals before scanning to kill false positives.
// Full AST parsing would require @babel/parser + postcss deps; this pre-pass
// catches the vast majority of "matches-inside-comment" cases (e.g. `text-cyan`
// matching a `// don't use text-cyan` comment) without introducing dependencies.
function sanitizeSource(src) {
  return src
    // JS/TS/CSS block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Line comments (only at start of line or after whitespace — avoids URLs)
    .replace(/(^|\s)\/\/[^\n]*/g, '$1')
    // Template-literal strings (preserve the `${...}` bits, drop the rest)
    .replace(/`([^`\\]|\\.)*`/g, (m) => m.replace(/[^`${}]/g, ' '));
}

// For className/class attribute scans we want the FULL source — class names
// are strings by definition — so keep both versions.
const clean = sanitizeSource(source);

const slopFlags = [];
const push = (flag, cond) => { if (cond) slopFlags.push(flag); };

// Use boundary-anchored regexes to avoid `disabled:text-cyan-500` matching
// when we meant the standalone utility.
push('Purple/violet gradient background detected',
  /\b(from|via|to)-(purple|violet)-\d{2,3}\b/.test(clean));
push('Cyan-on-dark color scheme detected',
  /\btext-cyan-\d{2,3}\b|#06B6D4\b/i.test(clean));
push('Left-border accent card pattern detected',
  /\bborder-l-4\b|border-left:\s*4px\s+solid/.test(clean));
push('Dark background with colored glow shadow detected',
  /\bbg-(gray|zinc|slate)-900\b[\s\S]{0,120}\bshadow-[a-z0-9]+/.test(clean));
push('Gradient text on heading or metric detected',
  /\bbg-clip-text\b[\s\S]{0,200}\btext-transparent\b[\s\S]{0,200}\bbg-gradient/.test(clean) ||
  /\btext-transparent\b[\s\S]{0,200}\bbg-gradient/.test(clean));

const hasLargeText = /\btext-(4xl|5xl|6xl)\b/.test(clean);
const hasSmallText = /\btext-(sm|xs)\b/.test(clean);
const hasGradient = /\bbg-gradient-/.test(clean);
push('Hero Metric Layout detected (large number + small label + gradient)',
  hasLargeText && hasSmallText && hasGradient);

const cardMatches = clean.match(/className="[^"]*\bcard\b/g) || [];
push('Repeated 3-across card grid detected', cardMatches.length >= 3);

// Inter detection — look for actual font declarations, not coincidental uses
const hasInter = /font-family:\s*["']?Inter\b|fontFamily:\s*["']?Inter\b|--font-[a-z-]*:\s*["']?Inter\b/i.test(clean);
const hasSecondary = /\b(Bricolage|Instrument|Plus Jakarta|DM Sans|Geist|Grotesk|Vela|Gentium|Cabinet)/i.test(clean);
push('Inter as sole typeface detected', hasInter && !hasSecondary);

push('Generic system/web font as sole typeface detected',
  /font-family:\s*["']?(Roboto|Arial|Open Sans)\b/i.test(clean) && !hasSecondary);

push('Default Tailwind blue #3B82F6 as primary color detected',
  /\bbg-blue-500\b|#3B82F6\b/i.test(clean));
push('Default Tailwind purple #6366F1 as primary color detected',
  /\bbg-indigo-500\b|#6366F1\b/i.test(clean));
push('Default Tailwind green #10B981 as accent detected',
  /\btext-emerald-500\b|#10B981\b/i.test(clean));

const radiusCount = (clean.match(/\brounded-(lg|md|xl)\b/g) || []).length;
const classNameCount = (clean.match(/\bclassName=/g) || []).length || 1;
push('Uniform border-radius on all elements detected', radiusCount >= classNameCount);

const shadowMdCount = (clean.match(/\bshadow-md\b/g) || []).length;
push('shadow-md applied uniformly to multiple cards detected', shadowMdCount >= 3);

push('Centered hero with gradient backdrop and floating cards detected',
  /\btext-center\b/.test(clean) && /\bbg-gradient-/.test(clean) && /\babsolute\b/.test(clean));

push('Three-column icon+heading+paragraph feature section detected',
  /<[A-Z][A-Za-z]*Icon\b|<Icon\b/.test(clean) && /<h3\b/.test(clean) &&
  /\bgrid-cols-3\b|grid-cols-\[repeat\(3/.test(clean));

push('Poppins + blue gradient combination detected',
  /\bPoppins\b/.test(clean) && /\b(from-blue|bg-blue)-\d{2,3}\b/.test(clean));

push('White card on light gray background (low contrast) detected',
  /\bbg-white\b/.test(clean) && /\bbg-(gray-50|gray-100|slate-50)\b/.test(clean));

const symPad = (clean.match(/\bp-(4|6|8)\b/g) || []).length;
const axisPad = (clean.match(/\b(px|py)-\d/g) || []).length;
push('Symmetric padding everywhere (no horizontal/vertical rhythm) detected',
  symPad >= 3 && axisPad === 0);

// Sprint 07 pattern #32 — placeholder names when a content kit is declared.
// A component that renders "Jane Doe" / "John Smith" / "Acme Corp" when the
// project has a visionary-kit.json is almost certainly using hard-coded
// strings instead of kit-derived props. The kit is there specifically so we
// don't have to ship "example.com" to production.
if (hasKit) {
  const placeholderRe = /\b(Jane Doe|John Doe|John Smith|Jane Smith|Acme\s+(Inc|Corp|LLC|Co)|Lorem ipsum)\b/i;
  push('Placeholder name detected in source despite visionary-kit.json present',
    placeholderRe.test(clean));
  const placeholderEmailRe = /\b[\w.-]+@(example\.com|test\.com|acme\.com)\b/i;
  push('Placeholder email domain detected in source despite visionary-kit.json present',
    placeholderEmailRe.test(clean));
}

// ── Increment round counter ──────────────────────────────────────────────────
try { writeFileSync(roundFile, String(round + 1)); } catch { /* ignore */ }

// ── Sprint 8 Task 22.1: pre-critic slop-reject gate ─────────────────────────
// Count blocking slop-hits BEFORE the critic is invoked. At/above the
// threshold we emit a regen-directive context instead of running critique,
// saving an LLM round and forcing the model to diverge with pattern-specific
// avoid guidance (22.2). Whitelist comes from the active style's
// allows_slop frontmatter (22.3) when the file carries a `.visionary-generated`
// marker; otherwise conservative empty whitelist.
const activeWhitelist = loadActiveStyleWhitelist(filePath, { repoRoot });
const gateDecision = shouldReject({
  slopFlags,
  styleWhitelist: activeWhitelist.patterns,
});

if (gateDecision.rejected) {
  // Emit trace events for audit (Task 22.4).
  try {
    trace.sync('slop_blocked', {
      blocking_patterns: gateDecision.blocking_patterns,
      blocking_count: gateDecision.blocking_count,
      whitelisted_count: gateDecision.whitelisted_count,
      threshold_used: gateDecision.threshold_used,
      style_id: activeWhitelist.styleId,
    }, {
      projectRoot: cwd,
      generationId: fileHash,
      round,
      emitter: 'slop-gate',
    });
  } catch { /* trace is best-effort */ }

  // Build a regen-directive context that replaces the critic-invocation
  // instructions with pattern-specific avoid/consider guidance.
  const directiveBlock = buildDirectiveBlock(gateDecision.blocking_patterns);
  const rejectContext = [
    `VISUAL CRITIQUE BLOCKED BY SLOP GATE — Round ${round}/${MAX_ROUNDS}`,
    '',
    `File written: ${filePath}`,
    `Active style: ${activeWhitelist.styleId || '(no .visionary-generated marker — gate used empty whitelist)'}`,
    `Gate threshold: ${gateDecision.threshold_used}  ·  hits: ${gateDecision.blocking_count} blocking, ${gateDecision.whitelisted_count} whitelisted`,
    '',
    'NEXT-TURN ACTIONS:',
    '1. Skip the normal critic+screenshot flow — this output is not worth scoring yet.',
    '2. Read the REGEN REQUIRED block below carefully.',
    '3. Rewrite the component to eliminate the flagged patterns. Do NOT regen a near-duplicate with cosmetic changes.',
    '4. When you rewrite, the PostToolUse hook will re-trigger automatically for another gate check.',
    '5. To override this gate (e.g. stylistic choice the whitelist missed): add the pattern to the style frontmatter `allows_slop` list and document why.',
    directiveBlock,
    '',
    'No critic output was produced this round. The round counter advanced as normal; if regens continue to hit the gate for 3 rounds, the loop terminates and user review is expected.',
  ].join('\n');
  emit({ additionalContext: rejectContext.slice(0, CONTEXT_CAP) });
}

// Emit a whitelist event separately when the gate passed BUT patterns were
// skipped via whitelist — useful for audit (22.4).
if (!gateDecision.rejected && gateDecision.whitelisted_count > 0) {
  try {
    trace.sync('slop_whitelisted', {
      whitelisted_patterns: gateDecision.whitelisted_patterns,
      whitelisted_count: gateDecision.whitelisted_count,
      style_id: activeWhitelist.styleId,
      reason: activeWhitelist.reason,
    }, {
      projectRoot: cwd,
      generationId: fileHash,
      round,
      emitter: 'slop-gate',
    });
  } catch { /* trace is best-effort */ }
}

// ── structural-gate: post-capture structural-integrity gate ─────────────────
// Reads the prior round's persisted DOM snapshot and runs the dispatcher.
// Round 1 has no prior snapshot → gate is a no-op and slop-gate + LLM-critic
// remain the sole defence.

const STRUCTURAL_DISABLED = (() => {
  const v = process.env.VISIONARY_ENABLE_STRUCTURAL_GATE;
  if (v === undefined) return false;
  if (v === '0' || v === 'false' || v.toLowerCase() === 'off') return true;
  return false;
})();

let structuralWarningsBlock = '';
if (!STRUCTURAL_DISABLED && existsSync(domSnapshotPath)) {
  let priorDom = null;
  try { priorDom = JSON.parse(readFileSync(domSnapshotPath, 'utf8')); }
  catch { /* corrupt snapshot — skip gate */ }

  if (priorDom && Array.isArray(priorDom.elements)) {
    const wlStructural = activeWhitelist?.structural || {
      hard_fail_skips: new Set(),
      warning_skips: new Set(),
    };
    const sgResult = evaluateStructural(priorDom, { width: 1200, height: 800 }, {
      styleWhitelist: wlStructural,
      styleId: activeWhitelist?.styleId,
    });

    if (sgResult.hard_fails.length > 0) {
      try {
        trace.sync('structural_blocked', {
          blocking_checks: [...new Set(sgResult.hard_fails.map(h => h.check_id))],
          blocking_count: sgResult.hard_fails.length,
          skipped_count: sgResult.skipped.length,
          style_id: activeWhitelist?.styleId || null,
        }, { projectRoot: cwd, generationId: fileHash, round, emitter: 'structural-gate' });
      } catch { /* trace is best-effort */ }

      const directive = buildStructuralDirectiveBlock(sgResult.hard_fails);
      const rejectContext = [
        `STRUCTURAL GATE BLOCKED REGEN — Round ${round}/${MAX_ROUNDS}`,
        '',
        `File written: ${filePath}`,
        `Active style: ${activeWhitelist?.styleId || '(no .visionary-generated marker — gate used empty whitelist)'}`,
        `Hard-fails: ${sgResult.hard_fails.length}  ·  warnings (suppressed this round): ${sgResult.warnings.length}  ·  skipped: ${sgResult.skipped.length}`,
        '',
        'NEXT-TURN ACTIONS:',
        '1. Skip the normal critic+screenshot flow — this output has structural defects that must be eliminated before scoring is meaningful.',
        '2. Read the STRUCTURAL DEFECTS block below carefully.',
        '3. Rewrite the component to fix every flagged defect. The hook will re-trigger automatically when you save.',
        '4. To override on a stylistic basis: add the check_id to the active style frontmatter `allows_structural.hard_fail_skips` and document why.',
        '',
        directive,
        '',
        'No critic output was produced this round. Round counter advances normally; if hard-fails persist for 3 rounds, the loop terminates and user review is expected.',
      ].join('\n');
      emit({ additionalContext: rejectContext.slice(0, CONTEXT_CAP) });
    }

    if (sgResult.warnings.length > 0) {
      try {
        trace.sync('structural_warning', {
          warning_checks: [...new Set(sgResult.warnings.map(w => w.check_id))],
          warning_count: sgResult.warnings.length,
          style_id: activeWhitelist?.styleId || null,
        }, { projectRoot: cwd, generationId: fileHash, round, emitter: 'structural-gate' });
      } catch { /* trace is best-effort */ }
      structuralWarningsBlock = buildStructuralWarningsBlock(sgResult.warnings);
    }

    if (sgResult.skipped.length > 0) {
      try {
        trace.sync('structural_whitelisted', {
          whitelisted_checks: [...new Set(sgResult.skipped.filter(s => s.reason === 'whitelisted').map(s => s.check_id))],
          whitelisted_count: sgResult.skipped.filter(s => s.reason === 'whitelisted').length,
          style_id: activeWhitelist?.styleId || null,
          reason: activeWhitelist?.reason || null,
        }, { projectRoot: cwd, generationId: fileHash, round, emitter: 'structural-gate' });
      } catch { /* trace is best-effort */ }
    }
  }
}

// ── Build additionalContext ──────────────────────────────────────────────────
const slopSection = slopFlags.length
  ? `\n\nDeterministic slop patterns pre-detected (include in design_slop_flags):\n${JSON.stringify(slopFlags)}`
  : '';

// Check for responsive breakpoints in source — drives multi-viewport capture
const needsMobileShot = /\b(sm|md|lg|xl):/g.test(clean) || /@media\s*\([^)]*max-width:/.test(clean);
const needsTabletShot = /\bmd:/.test(clean) || /@media\s*\([^)]*max-width:\s*7[5-9][0-9]/.test(clean);

// Preview URL: respect VISIONARY_PREVIEW_URL env override, else detect via hook payload
const previewUrl = process.env.VISIONARY_PREVIEW_URL || input.preview_url || 'http://localhost:3000';
const previewFallback = process.env.VISIONARY_PREVIEW_URL ? '' : ' (fallback http://localhost:5173)';

const mobileLine = needsMobileShot
  ? `   b. 375×812 (mobile) — source uses responsive breakpoints${needsTabletShot ? '\n   c. 768×1024 (tablet) — source uses md: breakpoint' : ''}`
  : '   (no responsive breakpoints detected — skip mobile/tablet shots)';

// Sprint 02: point the subagent at the structured-output schema + the
// loop-control predicates. The schema is the canonical contract; the existing
// rubric prose in agents/visual-critic.md is informational until the full
// 0-10 migration lands. When that migration is in place, the subagent should
// emit JSON matching skills/visionary/schemas/critique-output.schema.json
// directly, and this hook can stop including the 1-5 fallback instructions.
const useDiff = round >= 2;
const regenMode = useDiff
  ? `Round ${round} regen mode: UNIFIED DIFF (skills/visionary/diff-refine.md). Emit only hunks that address top_3_fixes; preserve unchanged lines. The hook will feed the diff through hooks/scripts/lib/apply-diff.mjs with ±3-line fuzz and fall back to full regen if the patch fails to apply.`
  : `Round ${round} regen mode: FULL component. Round 1 allows holistic redesign.`;

// Sprint 4 Task 10.2 — BoN fan-out instructions. Empty string when BoN is
// disabled or inapplicable; the hook always emits the standard critique
// flow first, then appends this block so Claude knows how to proceed.
const fanOutSection = (bonDecision.enabled && candidatePaths)
  ? buildFanOutInstructions({
      topFixes: Array.isArray(previousCritique?.top_3_fixes) ? previousCritique.top_3_fixes : [],
      filePath,
      artefactPaths: candidatePaths,
      scorerCli,
      calibrationPath,
      verifierAgentPath,
      promptHash,
    })
  : '';

const bonSummaryLine = bonDecision.enabled
  ? `Best-of-N: ENABLED — round ${round} will fan out to 3 candidates (timeout ${CANDIDATE_TIMEOUT_MS / 1000}s each, concurrency ${concurrencyLimit()}). Round 2 auto-exit threshold: winner calibrated craft_measurable >= ${BON_ROUND2_EXIT_CRAFT}.`
  : `Best-of-N: OFF (${bonDecision.reason}).`;

const resilienceSummaryLine = hasKit
  ? `Content resilience: ENABLED — visionary-kit.json found at ${kitPath}. Critic must render the component 3 times against kit-derived data (p50 / p95 / empty) and call the resilience scorer.`
  : `Content resilience: OFF — no visionary-kit.json in project. Emit scores.content_resilience = null and confidence.content_resilience = 3.`;

// The resilience block is only inserted into NEXT-TURN ACTIONS when a kit is
// present; otherwise it's empty and the pipeline is identical to pre-Sprint 07.
const resilienceStep = hasKit ? `
7b. CONTENT-RESILIENCE RENDERS (Sprint 07 Task 21.5):
    a. Load kit: \`const kit = JSON.parse(await fs.readFile('${kitPath}', 'utf8'))\`.
    b. For each state in ['p50','p95','empty']:
       - Pick the first entity from kit.entities that the component appears to render (match by prop name or heuristic). For p50: use entity.sample[0]. For p95: synthesize the worst-case row using entity.constraints[*].p95_length + diacritics. For empty: pass an empty array.
       - Expose data via \`mcp__playwright__browser_evaluate\` before navigation, e.g.: \`window.__visionary_kit__ = { state: 'p95', data: <row> }\`. Components that support kit injection will read this; components that don't will fall back to their hard-coded defaults (which is what we want to detect).
       - Capture the DOM snapshot using the same browser_evaluate payload as step 5, writing to ${domP50Path} / ${domP95Path} / ${domEmptyPath} respectively.
    c. Run the resilience scorer:
       \`node ${resilienceScorerCli} --p50 ${domP50Path} --p95 ${domP95Path} --empty ${domEmptyPath} --kit ${kitPath} --out ${resilienceOutPath}\`
       The scorer returns \`{ score, breakdown, notes, missing_states }\`. If \`score\` is null (fewer than 2 snapshots available), emit scores.content_resilience = null and add a note to \`top_3_fixes\` recommending the component accept props for kit injection.
    d. Feed score + breakdown into critic-craft as the 10th dimension; top_3_fixes entries citing content_resilience MUST use \`evidence.type: "metric"\` with values drawn from the scorer's breakdown.`
  : '';

// ── Sprint 6 Task 17.4: RAG-anchor block ──────────────────────────────────
// Built from taste/accepted-examples.jsonl + the current brief. On a fresh
// install the brief cache file is empty and we fall back to a filename-
// based weak-brief; the anchor builder then enters cold-start mode and
// returns a designer-pack fallback.
//
// Brief inference precedence:
//   1. .visionary-cache/last-variants-brief.json → .brief
//   2. .visionary-cache/last-user-prompt.txt
//   3. filename derivation (snake-case → space-separated words)
function inferBrief() {
  const variantsBriefPath = join(cacheDir, 'last-variants-brief.json');
  if (existsSync(variantsBriefPath)) {
    try {
      const j = JSON.parse(readFileSync(variantsBriefPath, 'utf8'));
      if (typeof j?.brief === 'string' && j.brief.length > 3) return j.brief;
    } catch { /* corrupt cache — fall through */ }
  }
  const promptPath = join(cacheDir, 'last-user-prompt.txt');
  if (existsSync(promptPath)) {
    try {
      const txt = readFileSync(promptPath, 'utf8').trim();
      if (txt.length > 3) return txt.slice(0, 500);
    } catch { /* ignore */ }
  }
  // Filename fallback: strip extension, decamel, replace separators with spaces.
  const base = filePath.split(/[\\/]/).pop() || filePath;
  return base
    .replace(/\.(tsx?|jsx?|vue|svelte|html)$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim();
}

const inferredBrief = inferBrief();

// Build RAG anchor block. Always safe: cold-start mode returns a designer-
// pack fallback, opt-out returns empty, so we can splice the output in
// unconditionally.
const ragResult = buildAnchors({
  briefSummary: inferredBrief,
  projectRoot: cwd,
  k: 3,
});
const ragSection = ragResult.anchor_text
  ? `\n\n${ragResult.anchor_text}`
  : '';

// Sprint 6 Task 18.3: when multi-critic mode is on, instruct Claude to
// invoke critic-craft AND critic-aesthetic in parallel and merge their
// outputs via critic-merge.mjs. Ownership partition lives in that module;
// dimensions each critic owns are documented in agents/critic-{craft,aesthetic}.md.
const criticMergePath = join(repoRoot, 'hooks', 'scripts', 'lib', 'critic-merge.mjs');
const craftAgentPath = join(repoRoot, 'agents', 'critic-craft.md');
const aestheticAgentPath = join(repoRoot, 'agents', 'critic-aesthetic.md');
const multiCriticSection = MULTI_CRITIC
  ? [
      '',
      'MULTI-CRITIC MODE (Sprint 6 Item 18 — VISIONARY_MULTI_CRITIC=1):',
      `Replace the visual-critic invocation in step 8 with TWO parallel subagent calls:`,
      `  8a. Invoke critic-craft (${craftAgentPath}) with the full input bundle; it scores hierarchy, layout, typography, contrast, accessibility, craft_measurable, content_resilience and emits null on the three aesthetic dimensions.`,
      `  8b. Invoke critic-aesthetic (${aestheticAgentPath}) with the same bundle; it scores distinctiveness, brief_conformance, motion_readiness and emits null on the seven craft dimensions.`,
      `  8c. Call Promise.all-style parallel execution — both critics share the same screenshot + DOM + axe + numeric input. No context leakage between them; each gets FRESH CONTEXT per SELF-REFINE.`,
      `  8d. Merge via \`node ${criticMergePath}\` with archetype='${ragResult.anchors?.[0]?.product_archetype || 'unknown'}' — the merge resolves any overlapping-write conflicts via skills/visionary/critic-arbitration.json and produces a single critique-output JSON. Arbitration events are logged in merge output for audit.`,
      `Apply calibration per critic identity when committed: skills/visionary/calibration.craft.json and skills/visionary/calibration.aesthetic.json (produced by \`node scripts/calibrate.mjs --critic-identity craft|aesthetic\`). Missing files → identity passthrough.`,
    ].join('\n')
  : '';

// Emit a trace event so visionary-stats can see which round was processed
// and in which mode. The emission is best-effort — trace is disabled when
// VISIONARY_NO_TRACES=1.
try {
  trace.sync('brief_embedded', {
    brief_length: inferredBrief.length,
    rag_mode: ragResult.mode,
    rag_example_count: ragResult.example_count,
    multi_critic: MULTI_CRITIC,
  }, {
    projectRoot: cwd,
    generationId: fileHash,
    round,
    emitter: 'capture-and-critique',
  });
} catch { /* trace is best-effort */ }

// Serialised calibration summary for the critique context — one line per
// dimension so the critic can see whether scores get tilted at runtime.
function calibrationSummary() {
  if (calibration.status === 'absent') return 'Calibration: none committed yet (identity).';
  if (calibration.status === 'corrupt') return 'Calibration: file corrupt — identity fallback.';
  if (calibration.status === 'stale') {
    return `Calibration: STALE (critic prompt changed — hash ${calibration.data?.critic_prompt_hash || 'unknown'} vs ${promptHash}). Identity fallback, nightly CI will refit.`;
  }
  const d = calibration.data?.per_dimension || {};
  const rows = Object.entries(d).slice(0, 9).map(([dim, { slope, intercept, spearman_rho }]) => {
    const rho = spearman_rho?.toFixed?.(2) ?? '?';
    return `  ${dim.padEnd(18)} slope=${slope?.toFixed?.(2)}, intercept=${intercept?.toFixed?.(2)}, ρ=${rho}`;
  }).join('\n');
  return `Calibration: FRESH (prompt_hash matches). Per-dimension linear fit:\n${rows}`;
}

const context = [
  `VISUAL CRITIQUE REQUESTED — Round ${round}/${MAX_ROUNDS}`,
  '',
  `File written: ${filePath}`,
  `Screenshot target: ${screenshotPath}`,
  `DOM snapshot target: ${domSnapshotPath}`,
  `axe-core snapshot target: ${axeSnapshotPath}`,
  `Numeric scorer output: ${numericOutPath}`,
  `Preview URL: ${previewUrl}${previewFallback}`,
  `Prompt hash: ${promptHash}`,
  `Verifier prompt hash: ${verifierPromptHash}`,
  bonSummaryLine,
  resilienceSummaryLine,
  calibrationSummary(),
  '',
  'NEXT-TURN ACTIONS (perform these now):',
  `1. Navigate via mcp__playwright__browser_navigate to ${previewUrl}. If that errors, try http://localhost:5173 (Vite default). If neither responds within 2 s, spin up a component-isolated Vite harness or instruct the user to set VISIONARY_PREVIEW_URL.`,
  `2. Wait via mcp__playwright__browser_evaluate for BOTH \`document.fonts.ready\` AND \`document.getAnimations().length === 0\`. Do NOT use networkidle — Playwright itself advises against it.`,
  `3. Inject axe-core via mcp__playwright__browser_evaluate — use skills/visionary/axe-runtime.js. Persist the full axe result JSON with Bash (Write tool OR \`node -e "require('fs').writeFileSync(process.argv[1], process.argv[2])" ${axeSnapshotPath} '<json>'\`).`,
  `4. Call mcp__playwright__browser_take_screenshot:\n   a. 1200×800 (desktop — always)${needsMobileShot ? '\n' + mobileLine : ''}`,
  `5. Capture a DOM snapshot via browser_evaluate: \`Array.from(document.querySelectorAll('body *')).slice(0,400).map(el => { const r=el.getBoundingClientRect(); const s=getComputedStyle(el); const tag=el.tagName.toLowerCase(); const isFooterish=['footer','aside','section','nav'].includes(tag); const isList=tag==='ul'||tag==='ol'; const isHeading=/^h[1-6]$/.test(tag); const sib=isHeading?el.nextElementSibling:null; return { selector: tag+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className?'.'+el.className.trim().split(/\\\\s+/).slice(0,3).join('.'):''), tagName: tag, text: (el.textContent||'').trim().slice(0,200) || null, parentTag: el.parentElement?el.parentElement.tagName.toLowerCase():null, className: typeof el.className==='string'?el.className:null, bbox:{x:r.x,y:r.y,width:r.width,height:r.height}, style:{fontSize:s.fontSize, lineHeight:s.lineHeight, letterSpacing:s.letterSpacing, color:s.color, backgroundColor:s.backgroundColor}, display: isFooterish?s.display:null, gridTemplateColumns: isFooterish?s.gridTemplateColumns:null, listStyleType: isList?s.listStyleType:null, childCount: el.children.length, anchorDescendantCount: el.querySelectorAll('a').length, nextElementSiblingTag: sib?sib.tagName.toLowerCase():null, nextElementSiblingText: sib?(sib.textContent||'').trim().slice(0,200):null }; }).filter(e=>e.bbox.width>0&&e.bbox.height>0)\`. Wrap as \`{elements:[...]}\` and write to ${domSnapshotPath}.`,
  `6. If any PNG's longest side > 1568 px, resize it (Claude vision optimum ≈ 1.15 megapixel).`,
  `7. Run the deterministic numeric scorer via Bash:\n   node ${scorerCli} --screenshot ${screenshotPath} --dom ${domSnapshotPath} --axe ${axeSnapshotPath} --out ${numericOutPath}\n   The scorer never throws: missing sharp → null-sub-scores, not a crash.${resilienceStep}`,
  `8. Invoke the visual-critic subagent (agents/visual-critic.md) with FRESH CONTEXT: brief + screenshots + axe-core JSON + slop flags + numeric_scores from ${numericOutPath} + round ${round} + previous-round score + prompt_hash=${promptHash}. Do NOT include full chat history — SELF-REFINE pattern requires clean context per round.`,
  `9. Output contract: JSON matching skills/visionary/schemas/critique-output.schema.json. REQUIRED: scores.* on 0-10 (include craft_measurable = numeric_scores.composite × 10 or null), confidence 1-5, numeric_scores block, prompt_hash=${promptHash}, and EVERY entry in top_3_fixes must have an evidence object { type: axe|selector|metric|coord, value }. Sub-scores below 0.7 from numeric_scores MUST be addressed in top_3_fixes with evidence.type='metric'.`,
  `10. Apply calibration before gating: \`node ${join(repoRoot, 'hooks', 'scripts', 'lib', 'apply-calibration.mjs')} --critique <critique.json> --calibration ${calibrationPath} --out <calibrated.json>\`. The resulting object has raw_scores preserved and scores replaced by slope×raw+intercept (identity fallback when calibration.status is identity_fallback or the prompt_hash mismatches).`,
  `11. Loop control: hooks/scripts/lib/loop-control.mjs. shouldEarlyExit requires min(scores)≥8.0 AND min(confidence)≥4 AND axe_violations_count===0 AND no blocker-severity slop (null craft_measurable is tolerated). shouldEscalateToReroll fires on round 1 when ≥3 dimensions score <4. If neither fires and round<${MAX_ROUNDS}, apply top_3_fixes to ${filePath} and let this hook re-trigger.`,
  `12. Evidence validation: after critique, use hooks/scripts/lib/validate-evidence.mjs to extract every top_3_fixes[].evidence with type=selector and run validateSelectorsInBrowser via mcp__playwright__browser_evaluate. Feed the results back through applyValidation. Invalid selectors mark the fix with evidence_invalid:true and emit a warning into the next round's prompt. Two or more invalid citations → critique retry with alternate model.`,
  `13. If round N score regresses vs N-1 by > 0.3, set convergence_signal=true. Caller reverts to the previous round's output.`,
  `14. PERSIST critique for the next round: after Step 10 (calibration), write the calibrated critique JSON to \`${lastCritiquePath}\`. The NEXT hook invocation reads this file to decide whether Best-of-N fan-out applies. If you skip this step, round N+1 will always fall back to sequential refine.`,
  '',
  regenMode,
  fanOutSection,
  multiCriticSection,
  structuralWarningsBlock,
  ragSection,
  buildMotionContextBlock(clean),
  '',
  `additionalContext cap: ${CONTEXT_CAP} chars — keep critique JSON concise.${slopSection}`,
].join('\n');

const truncated = context.length > CONTEXT_CAP
  ? context.slice(0, CONTEXT_CAP - 3) + '...'
  : context;

emit({ additionalContext: truncated });
