// Best-of-N fan-out helpers — Sprint 4 Task 10.2.
//
// Pure, dep-free, unit-testable. The hook orchestrates I/O; this module
// defines the contract.
//
// The flow the hook drives (all runs on Claude's NEXT turn after the hook
// emits additionalContext):
//
//   1. Hook decides fan-out is warranted (round >= 2, BoN enabled, previous
//      round returned non-empty top_3_fixes, no convergence_signal).
//   2. Hook emits additionalContext that tells Claude to:
//        a. Fork three Task-subagent-calls using the temperature/instruction
//           profiles this module produces in buildFanOutInstructions().
//        b. Apply each candidate's diff against a per-candidate TEMP copy of
//           the source file at paths this module produces in
//           buildCandidateArtefactPaths().
//        c. Screenshot + numeric-score each candidate (re-using the existing
//           scorer CLI), persisting artefacts at the per-candidate paths.
//        d. Invoke agents/visual-verifier.md with the combined artefacts
//           assembled via prepareVerifierInput().
//        e. Parse the verifier output via parseVerifierOutput() and apply
//           the winning diff to the actual source file, OR surface all three
//           if escalate_to_user.
//   3. Hook collects bon_stats via collectBonStats() and appends to the
//      round's metrics block.
//
// DESIGN CONSTRAINT: this lib never touches the filesystem, spawns no
// processes, and imports no non-stdlib modules. Everything it exposes is a
// computable string, path, or predicate. All orchestration is the hook's job.

import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ── Candidate profiles ──────────────────────────────────────────────────────
// Three Task-subagent-calls, deliberately diversified. See
// agents/visual-verifier.md § "The Three Candidates Are Not Drawn From The
// Same Distribution" for the product rationale.
export const CANDIDATE_PROFILES = Object.freeze([
  Object.freeze({
    id: 'A',
    index: 0,
    temperature: 0.2,
    instruction: 'Apply top_3_fixes literally. Minimal deviation from the cited selectors and values. Do not re-derive the visual solution at the style level.',
    expected_wins_on: ['brief_conformance', 'regression_safety'],
  }),
  Object.freeze({
    id: 'B',
    index: 1,
    temperature: 0.5,
    instruction: 'Apply top_3_fixes in spirit. Holistic adjustments are allowed when they serve the same dimension the fix targeted. Preserve original style intent.',
    expected_wins_on: ['hierarchy', 'layout'],
  }),
  Object.freeze({
    id: 'C',
    index: 2,
    temperature: 0.8,
    instruction: 'Apply top_3_fixes but explore a distinct visual solution. Free to re-derive the fix at the style level if the current direction is stuck. Stay within the chosen style\'s frontmatter vocabulary.',
    expected_wins_on: ['distinctiveness', 'craft_measurable'],
  }),
]);

// Hard ceiling on how many candidates we ever fan out to. The verifier's
// pairwise rubric assumes exactly three, and Playwright MCP concurrency
// tops out around three browser contexts on most hardware.
export const MAX_CANDIDATES = 3;

// Per-candidate generation budget. 90s matches the sprint plan's wall-clock
// budget per candidate; real-world screenshots + axe runs + numeric scoring
// usually finish in 30-50s.
export const CANDIDATE_TIMEOUT_MS = 90_000;

// On Windows we've seen Playwright contexts flake when more than 2 run in
// true parallel. The hook queues accordingly, but the ceiling lives here so
// both sides agree.
export const WINDOWS_CONCURRENCY_LIMIT = 2;
export const DEFAULT_CONCURRENCY_LIMIT = 3;

// Score margin tolerances — thresholds the verifier references.
export const DECISIVE_COMPOSITE_DELTA = 1.0;
export const NARROW_COMPOSITE_DELTA = 0.5;

// Round-2 auto-exit threshold when BoN found a clear winner. Matches the
// sprint plan (Task 10.3): composite >= 7.5 on the ninth dimension lets us
// skip round 3 entirely.
export const BON_ROUND2_EXIT_CRAFT = 7.5;

// ── Feature flag ────────────────────────────────────────────────────────────
// BoN is on by default. Users disable via env for cost-sensitive runs or
// when Playwright MCP is unavailable (Task 10.2 acceptance criterion).
export function isBonEnabled({ env = process.env, round = 1, previousCritique = null } = {}) {
  const flag = env.VISIONARY_DISABLE_BON;
  if (flag && flag !== '0' && String(flag).toLowerCase() !== 'false') {
    return { enabled: false, reason: 'disabled_by_env' };
  }
  if (!Number.isInteger(round) || round < 2) {
    return { enabled: false, reason: 'round_below_threshold' };
  }
  if (previousCritique && previousCritique.convergence_signal === true) {
    return { enabled: false, reason: 'previous_convergence' };
  }
  if (previousCritique && Array.isArray(previousCritique.top_3_fixes) && previousCritique.top_3_fixes.length === 0) {
    return { enabled: false, reason: 'no_fixes_to_apply' };
  }
  return { enabled: true, reason: 'bon_active' };
}

// ── Artefact paths ──────────────────────────────────────────────────────────
// Per-candidate temp paths. Stable under `fileHash + round + candidate` so
// the hook can re-read them when collecting verifier input. The hash is the
// same md5 slice the hook uses elsewhere — deliberate, so verifier logs can
// be cross-referenced with the main critique round.
export function buildCandidateArtefactPaths({ fileHash, round, tmpDirOverride = null }) {
  if (!fileHash || typeof fileHash !== 'string') {
    throw new Error('fileHash required');
  }
  if (!Number.isInteger(round) || round < 1) {
    throw new Error(`round must be a positive integer, got ${round}`);
  }
  const base = tmpDirOverride || tmpdir();
  const paths = {};
  for (const profile of CANDIDATE_PROFILES) {
    const stem = `visionary-verifier-${fileHash}-${round}-${profile.id}`;
    paths[profile.id] = {
      id: profile.id,
      index: profile.index,
      temperature: profile.temperature,
      instruction: profile.instruction,
      source_copy: join(base, `${stem}.src.tsx`),
      diff:        join(base, `${stem}.diff`),
      screenshot:  join(base, `${stem}.png`),
      dom:         join(base, `${stem}.dom.json`),
      axe:         join(base, `${stem}.axe.json`),
      numeric:     join(base, `${stem}.numeric.json`),
      critique:    join(base, `${stem}.critique.json`),
      calibrated:  join(base, `${stem}.calibrated.json`),
    };
  }
  return paths;
}

// ── Concurrency ─────────────────────────────────────────────────────────────
// Windows gets the conservative ceiling; others get the full MAX_CANDIDATES.
export function concurrencyLimit({ platform = process.platform } = {}) {
  if (platform === 'win32') return WINDOWS_CONCURRENCY_LIMIT;
  return DEFAULT_CONCURRENCY_LIMIT;
}

// ── Fan-out instruction block ───────────────────────────────────────────────
// A compact block the hook appends to additionalContext. Heavy prose lives
// in skills/visionary/bon-fanout.md — Claude reads that file for the full
// playbook. We only emit the per-generation data: the artefact paths
// (they're round-scoped) and the originating top_3_fixes.
//
// Keeping the block short is load-bearing: the full hook context is capped
// at 10 KB and the default critique instructions already consume ~6 KB.
export function buildFanOutInstructions({
  topFixes = [],
  filePath,
  artefactPaths,
  scorerCli,
  calibrationPath,
  verifierAgentPath,
  promptHash,
  fanoutDocPath = 'skills/visionary/bon-fanout.md',
} = {}) {
  if (!filePath || !scorerCli || !verifierAgentPath) {
    throw new Error('buildFanOutInstructions: filePath, scorerCli, verifierAgentPath required');
  }
  if (!artefactPaths || !artefactPaths.A || !artefactPaths.B || !artefactPaths.C) {
    throw new Error('buildFanOutInstructions: artefactPaths must carry A, B, C');
  }
  if (!Array.isArray(topFixes)) {
    throw new Error('buildFanOutInstructions: topFixes must be an array');
  }

  // Compact path table — one line per candidate, stems only since the
  // pattern is "<stem>.png / .diff / .dom.json / .axe.json / .numeric.json".
  const stems = CANDIDATE_PROFILES.map((profile) => {
    const p = artefactPaths[profile.id];
    const stem = p.source_copy.replace(/\.src\.tsx$/, '');
    return `  ${profile.id} (t=${profile.temperature}): ${stem}.{src.tsx,diff,png,dom.json,axe.json,numeric.json,critique.json,calibrated.json}`;
  }).join('\n');

  // Compact top_3_fixes — one line per fix rather than pretty-printed JSON.
  const fixLines = topFixes.map((f, i) => {
    const ev = f?.evidence ? `${f.evidence.type}:${f.evidence.value}` : 'no-evidence';
    return `  #${i + 1} [${f?.dimension || '?'}|${f?.severity || '?'}] ${f?.proposed_fix || ''} ⟶ ${ev}`;
  }).join('\n') || '  (no fixes — BoN should have been disabled; check hook logic)';

  return [
    '',
    '── Best-of-N FAN-OUT (round >= 2) ──',
    '',
    `Full protocol: ${fanoutDocPath}`,
    `Source file: ${filePath}`,
    `Scorer CLI: ${scorerCli}`,
    `Calibration: ${calibrationPath || '(absent)'}`,
    `Verifier: ${verifierAgentPath}`,
    `Prompt hash to echo: ${promptHash || 'sha256:unknown'}`,
    '',
    'Originating top_3_fixes:',
    fixLines,
    '',
    'Per-candidate artefact path stems:',
    stems,
    '',
    `Concurrency ceiling: ${concurrencyLimit()} parallel Playwright contexts, per-candidate budget ${CANDIDATE_TIMEOUT_MS / 1000}s.`,
    `Round-2 auto-exit: winner calibrated craft_measurable >= ${BON_ROUND2_EXIT_CRAFT} with non-indistinguishable margin.`,
  ].join('\n');
}

// ── Verifier input assembly ─────────────────────────────────────────────────
// The hook collects the per-candidate critique + calibrated-scores + numeric
// + applied-diff blobs and passes the lot to this function. The return value
// is the exact object the verifier subagent receives.
//
// We do NOT read files here (no I/O). The caller reads + parses each path,
// then hands us the parsed structures.
export function prepareVerifierInput({
  round,
  originatingTopFixes = [],
  candidates = [],
  promptHash,
  verifierPromptHash,
} = {}) {
  if (!Number.isInteger(round)) {
    throw new Error('prepareVerifierInput: round must be integer');
  }
  if (!Array.isArray(candidates)) {
    throw new Error('prepareVerifierInput: candidates must be array');
  }

  const normalized = CANDIDATE_PROFILES.map((profile) => {
    const found = candidates.find((c) => c && (c.id === profile.id || c.index === profile.index));
    if (!found) {
      return {
        candidate: profile.id,
        index: profile.index,
        temperature: profile.temperature,
        missing: true,
      };
    }
    return {
      candidate: profile.id,
      index: profile.index,
      temperature: profile.temperature,
      screenshot_path: found.screenshot_path || null,
      applied_diff: typeof found.applied_diff === 'string' ? found.applied_diff : null,
      calibrated_scores: found.calibrated_scores || null,
      raw_scores: found.raw_scores || null,
      numeric_scores: found.numeric_scores || null,
      axe_violations_count: Number.isFinite(found.axe_violations_count) ? found.axe_violations_count : null,
      missing: false,
    };
  });

  const completeCount = normalized.filter((c) => !c.missing && c.applied_diff && c.calibrated_scores).length;

  return {
    round,
    originating_top_fixes: originatingTopFixes,
    candidates: normalized,
    complete_count: completeCount,
    prompt_hash: promptHash || 'sha256:unknown',
    verifier_prompt_hash: verifierPromptHash || null,
  };
}

// ── Verifier output parser ──────────────────────────────────────────────────
// Tolerates minor shape drift: winner_index can arrive as number or string,
// margin normalizes to lowercase. Returns a stable object or an `ok: false`
// sentinel the hook falls back on.
export function parseVerifierOutput(raw) {
  if (raw == null) {
    return { ok: false, reason: 'null_output' };
  }
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch (err) {
      return { ok: false, reason: 'invalid_json', error: String(err && err.message || err) };
    }
  }
  if (typeof data !== 'object') {
    return { ok: false, reason: 'not_object' };
  }
  const winner = typeof data.winner_index === 'string' ? parseInt(data.winner_index, 10) : data.winner_index;
  if (!Number.isInteger(winner) || winner < 0 || winner >= MAX_CANDIDATES) {
    return { ok: false, reason: 'invalid_winner_index', winner };
  }
  const margin = typeof data.margin === 'string' ? data.margin.toLowerCase() : null;
  if (!['decisive', 'narrow', 'indistinguishable'].includes(margin)) {
    return { ok: false, reason: 'invalid_margin', margin };
  }
  const escalate = !!data.escalate_to_user;
  const pairwise = Array.isArray(data.pairwise_rationale) ? data.pairwise_rationale : [];
  return {
    ok: true,
    winner_index: winner,
    winner_id: CANDIDATE_PROFILES[winner].id,
    margin,
    escalate_to_user: escalate,
    pairwise_rationale: pairwise,
    regression_notes: Array.isArray(data.regression_notes) ? data.regression_notes : [],
    prompt_hash: typeof data.prompt_hash === 'string' ? data.prompt_hash : null,
    round: Number.isInteger(data.round) ? data.round : null,
  };
}

// ── Fallback policy ─────────────────────────────────────────────────────────
// When candidates fail we degrade gracefully instead of crashing the loop.
// Policy mirrors the sprint plan AC: "om ≥ 2 av 3 kandidater failar → degrade
// till sekventiell single-best-effort (dagens beteende)".
export function selectFallbackPolicy({ candidates = [] } = {}) {
  if (!Array.isArray(candidates)) {
    return { policy: 'sequential', reason: 'candidates_not_array' };
  }
  const complete = candidates.filter((c) => c && !c.missing && c.applied_diff);
  if (complete.length === 0) {
    return { policy: 'sequential', reason: 'all_candidates_failed' };
  }
  if (complete.length === 1) {
    return {
      policy: 'single_winner',
      reason: 'only_one_candidate_complete',
      winner_index: complete[0].index,
    };
  }
  if (complete.length >= 2) {
    return { policy: 'bon', reason: 'bon_quorum_reached', complete_count: complete.length };
  }
  return { policy: 'sequential', reason: 'fallback_default' };
}

// ── Round-2 exit decision ───────────────────────────────────────────────────
// Sprint 4 Task 10.3: when BoN is active and the verifier picked a winner
// whose calibrated craft_measurable clears BON_ROUND2_EXIT_CRAFT, skip
// round 3. Returns { exit, reason }.
export function shouldBonRound2Exit({ round, verifierResult, winnerCalibrated }) {
  if (!verifierResult || !verifierResult.ok) {
    return { exit: false, reason: 'verifier_unavailable' };
  }
  if (round !== 2) {
    return { exit: false, reason: 'not_round_2' };
  }
  if (verifierResult.margin === 'indistinguishable') {
    return { exit: false, reason: 'indistinguishable_margin' };
  }
  const craft = winnerCalibrated && typeof winnerCalibrated.craft_measurable === 'number'
    ? winnerCalibrated.craft_measurable
    : null;
  if (craft === null || craft < BON_ROUND2_EXIT_CRAFT) {
    return { exit: false, reason: 'craft_below_threshold', craft };
  }
  return { exit: true, reason: 'bon_winner_clears_craft_floor', craft };
}

// ── bon_stats metric assembly ───────────────────────────────────────────────
// Task 10.4. Assembles the per-generation metrics block the hook appends to
// its run log. Inputs are the verifier result, the complete candidate list
// (post-fanout), and the pre-BoN baseline composite from the last sequential
// round. Anything missing → null field; consumers should treat null as
// "not measured this run" rather than zero.
export function collectBonStats({
  verifierResults = [],
  candidatesByRound = {},
  sequentialBaselineComposite = null,
} = {}) {
  const rounds = Object.keys(candidatesByRound).map((k) => parseInt(k, 10)).filter(Number.isInteger);
  const roundsUsingBon = rounds.length;

  let marginDecisive = 0, marginNarrow = 0, marginIndistinguishable = 0;
  let escalations = 0;
  for (const r of verifierResults) {
    if (!r || !r.ok) continue;
    if (r.margin === 'decisive') marginDecisive++;
    else if (r.margin === 'narrow') marginNarrow++;
    else if (r.margin === 'indistinguishable') marginIndistinguishable++;
    if (r.escalate_to_user) escalations++;
  }

  let candidateFailures = 0;
  for (const round of Object.values(candidatesByRound)) {
    if (!Array.isArray(round)) continue;
    candidateFailures += round.filter((c) => !c || c.missing || !c.applied_diff).length;
  }

  // Winner score-lift — compute against the pre-fan-out sequential baseline.
  let winnerScoreLift = null;
  const lastRound = rounds.length ? Math.max(...rounds) : null;
  if (
    lastRound != null
    && Array.isArray(candidatesByRound[lastRound])
    && typeof sequentialBaselineComposite === 'number'
  ) {
    const lastVerifier = verifierResults[verifierResults.length - 1];
    if (lastVerifier && lastVerifier.ok) {
      const winner = candidatesByRound[lastRound][lastVerifier.winner_index];
      const comp = winner && winner.calibrated_scores
        && typeof winner.calibrated_scores.craft_measurable === 'number'
          ? winner.calibrated_scores.craft_measurable
          : null;
      if (comp != null) winnerScoreLift = +(comp - sequentialBaselineComposite).toFixed(3);
    }
  }

  // Dominant margin — narrow when tied (conservative signal for consumers).
  let avgMargin = 'indistinguishable';
  if (marginDecisive > marginNarrow && marginDecisive > marginIndistinguishable) avgMargin = 'decisive';
  else if (marginNarrow >= marginDecisive && marginNarrow > marginIndistinguishable) avgMargin = 'narrow';

  return {
    rounds_using_bon: roundsUsingBon,
    avg_verifier_margin: avgMargin,
    escalations_to_user: escalations,
    candidate_failures: candidateFailures,
    winner_score_lift_vs_seq: winnerScoreLift,
    margin_histogram: {
      decisive: marginDecisive,
      narrow: marginNarrow,
      indistinguishable: marginIndistinguishable,
    },
  };
}

// ── Verifier prompt hash ────────────────────────────────────────────────────
// Separate from the critic's prompt_hash. The verifier lives in a different
// context and its role is selection, not scoring — calibration.json is not
// refit when the verifier prompt changes.
export function computeVerifierPromptHash(verifierBody) {
  if (typeof verifierBody !== 'string' || verifierBody.length === 0) {
    return 'sha256:unknown';
  }
  const h = createHash('sha256');
  h.update(verifierBody);
  return 'sha256:' + h.digest('hex').slice(0, 16);
}
