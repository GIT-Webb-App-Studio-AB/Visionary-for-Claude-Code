// Loop-control predicates for the capture-and-critique flow.
//
// Pure functions — no I/O, no side effects, no dependencies — so they stay
// trivially unit-testable. capture-and-critique.mjs imports these and applies
// them against a parsed critique JSON before deciding whether to run another
// round, bail to variants reroll, or keep the previous output.
//
// The rules themselves are documented in skills/visionary/critique-schema.md
// under "Loop Termination Rules". This module is the executable source of
// truth — update the doc if you change a rule here.
//
// Scale note: these predicates operate on the Sprint 02 critique schema,
// where `scores.*` are 0-10 numbers and `confidence.*` are 1-5 integers.
// See schemas/critique-output.schema.json for the canonical shape.

// Dimensions scored by the visual-critic subagent. Kept in sync with
// schemas/critique-output.schema.json#/properties/scores/required.
//
// CORE_DIMENSIONS always receive a score; missing values are a hard gate
// failure. OPTIONAL_DIMENSIONS may be null when the upstream scorer could
// not compute them (sharp unavailable, DOM empty, etc.) — loop-control
// skips null values in the min-score check instead of flunking the gate.
export const CORE_DIMENSIONS = Object.freeze([
  'hierarchy',
  'layout',
  'typography',
  'contrast',
  'distinctiveness',
  'brief_conformance',
  'accessibility',
  'motion_readiness',
]);
export const OPTIONAL_DIMENSIONS = Object.freeze(['craft_measurable']);
export const DIMENSIONS = Object.freeze([...CORE_DIMENSIONS, ...OPTIONAL_DIMENSIONS]);

// Thresholds — named so they can be grepped/overridden if we tune them later.
export const EARLY_EXIT_MIN_SCORE = 8.0;
export const EARLY_EXIT_MIN_CONFIDENCE = 4;
export const ESCALATE_BAD_SCORE = 4.0;  // strictly less-than counts
export const ESCALATE_BAD_COUNT_MIN = 3;

// ── shouldEarlyExit ─────────────────────────────────────────────────────────
// Returns { exit: boolean, reason: string, blockers?: string[] }.
// exit=true → stop the refine loop and return this round's output to the user.
//
// Rule (from the sprint plan):
//   EARLY EXIT after round N (N >= 1):
//     IF min(scores) >= 8.0
//     AND min(confidence) >= 4
//     AND axe_violations_count === 0
//     AND slop_detections.filter(s => s.severity === 'blocker').length === 0
//     THEN exit success
//
// Safety floor: first generation for a new user (empty system.md) MUST NOT
// early-exit before round 2 — we want data for taste calibration. Pass
// `calibrationMode: true` in opts to enforce the floor.
export function shouldEarlyExit(critique, opts = {}) {
  const { calibrationMode = false } = opts;

  if (!isCritiqueShape(critique)) {
    return { exit: false, reason: 'malformed_critique', blockers: ['critique shape invalid'] };
  }

  if (calibrationMode && critique.round < 2) {
    return { exit: false, reason: 'calibration_floor', blockers: ['round 1 blocked for calibration'] };
  }

  const blockers = [];
  const minScore = minOverDimensions(critique.scores);
  if (minScore < EARLY_EXIT_MIN_SCORE) {
    blockers.push(`min(scores) ${minScore.toFixed(2)} < ${EARLY_EXIT_MIN_SCORE}`);
  }

  const minConf = minConfidence(critique.confidence);
  if (minConf === null) {
    blockers.push('confidence object missing or empty');
  } else if (minConf < EARLY_EXIT_MIN_CONFIDENCE) {
    blockers.push(`min(confidence) ${minConf} < ${EARLY_EXIT_MIN_CONFIDENCE}`);
  }

  const axeCount = Number.isFinite(critique.axe_violations_count)
    ? critique.axe_violations_count
    : null;
  if (axeCount === null) {
    // Undefined is treated as "not clean enough to early-exit". We don't trust
    // "absent field" as "0 violations" — that would let a silent subagent
    // error pass the gate.
    blockers.push('axe_violations_count not reported');
  } else if (axeCount > 0) {
    blockers.push(`axe_violations_count ${axeCount} > 0`);
  }

  const slopBlockers = countSlopBlockers(critique.slop_detections);
  if (slopBlockers > 0) {
    blockers.push(`${slopBlockers} blocker-severity slop detection(s)`);
  }

  if (blockers.length === 0) {
    return { exit: true, reason: 'high_confidence', blockers: [] };
  }
  return { exit: false, reason: 'blockers', blockers };
}

// ── shouldEscalateToReroll ──────────────────────────────────────────────────
// Returns { escalate: boolean, reason: string, badDimensions?: string[] }.
// escalate=true → abort the refine loop and signal "reroll" to the variants
// flow. Rationale: when round 1 has 3+ dimensions failing hard, the draft is
// fundamentally broken and incremental fixes waste tokens — better to emit a
// fresh variant.
//
// Rule:
//   ESCALATE after round 1:
//     IF scores.count(s => s < 4) >= 3
//     THEN abort refine, signal reroll
export function shouldEscalateToReroll(critique) {
  if (!isCritiqueShape(critique)) {
    return { escalate: false, reason: 'malformed_critique' };
  }
  if (critique.round !== 1) {
    return { escalate: false, reason: 'only_round_1_escalates' };
  }
  // Escalation counts any numeric dimension below the floor, including the
  // optional craft_measurable when it was computed. Null (scorer disabled)
  // does not count against the draft — we can't hold the model accountable
  // for a metric that wasn't produced.
  const bad = DIMENSIONS.filter((dim) => {
    const v = critique.scores[dim];
    return typeof v === 'number' && v < ESCALATE_BAD_SCORE;
  });
  if (bad.length >= ESCALATE_BAD_COUNT_MIN) {
    return { escalate: true, reason: 'escalated_reroll', badDimensions: bad };
  }
  return { escalate: false, reason: 'threshold_not_met', badDimensions: bad };
}

// ── shouldUseDiffRegen ──────────────────────────────────────────────────────
// Returns true when the next round should emit a unified diff instead of a
// full component rewrite.
//
// Policy:
//   Round 1 → ALWAYS full regen (holistic redesigns are useful on round 1).
//   Round 2 & 3 → diff regen (tokens saved on preserved scaffolding).
//   Exception: convergence_signal=true from the previous round → no more
//   rounds at all; early-exit path handles this, but we return false so that
//   any caller that reaches this helper by accident does a safe full regen
//   instead of diffing against stale context.
export function shouldUseDiffRegen(round, opts = {}) {
  const { previousConvergenceSignal = false } = opts;
  if (previousConvergenceSignal) return false;
  if (!Number.isInteger(round) || round < 1) return false;
  return round >= 2;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function isCritiqueShape(c) {
  return c
    && typeof c === 'object'
    && typeof c.round === 'number'
    && c.scores && typeof c.scores === 'object'
    && typeof c.convergence_signal === 'boolean';
}

function minOverDimensions(scores) {
  let min = Infinity;
  for (const dim of CORE_DIMENSIONS) {
    const v = scores[dim];
    if (typeof v !== 'number') return -Infinity; // missing core score = fail gate
    if (v < min) min = v;
  }
  // Optional dimensions (craft_measurable) may be null when the deterministic
  // scorer was disabled / degraded. Skip null values; count numeric ones.
  for (const dim of OPTIONAL_DIMENSIONS) {
    const v = scores[dim];
    if (v === null || v === undefined) continue;
    if (typeof v !== 'number') return -Infinity;
    if (v < min) min = v;
  }
  return min;
}

function minConfidence(confidence) {
  if (!confidence || typeof confidence !== 'object') return null;
  let min = Infinity;
  let count = 0;
  for (const v of Object.values(confidence)) {
    if (typeof v !== 'number') continue;
    count++;
    if (v < min) min = v;
  }
  return count === 0 ? null : min;
}

function countSlopBlockers(slopDetections) {
  if (!Array.isArray(slopDetections)) return 0;
  return slopDetections.filter((s) => s && s.severity === 'blocker').length;
}
