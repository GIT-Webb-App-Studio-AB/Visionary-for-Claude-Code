// Run: node --test hooks/scripts/lib/__tests__/loop-control.test.mjs
//
// Predicate-matrix coverage for shouldEarlyExit + shouldEscalateToReroll +
// shouldUseDiffRegen. The early-exit matrix below enumerates the four gate
// conditions (min score, min confidence, axe violations, blocker slop) across
// pass/fail combinations — the sprint asks for 9 cases minimum; we ship 11 so
// every single-failure branch and the calibration floor are covered.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldEarlyExit,
  shouldEscalateToReroll,
  shouldUseDiffRegen,
  DIMENSIONS,
  EARLY_EXIT_MIN_SCORE,
  EARLY_EXIT_MIN_CONFIDENCE,
} from '../loop-control.mjs';

// ── Fixture builders ────────────────────────────────────────────────────────
function cleanCritique(overrides = {}) {
  const scores = {};
  for (const d of DIMENSIONS) scores[d] = 8.5;
  const confidence = {};
  for (const d of DIMENSIONS) confidence[d] = 4;
  return {
    round: 2,
    scores,
    confidence,
    top_3_fixes: [],
    convergence_signal: false,
    slop_detections: [],
    axe_violations_count: 0,
    ...overrides,
  };
}

function withScore(base, dim, value) {
  return { ...base, scores: { ...base.scores, [dim]: value } };
}

function withConfidence(base, dim, value) {
  return { ...base, confidence: { ...base.confidence, [dim]: value } };
}

// ── shouldEarlyExit ─────────────────────────────────────────────────────────
test('shouldEarlyExit: all gates pass → exit with high_confidence', () => {
  const res = shouldEarlyExit(cleanCritique());
  assert.equal(res.exit, true);
  assert.equal(res.reason, 'high_confidence');
  assert.deepEqual(res.blockers, []);
});

test('shouldEarlyExit: min score just below floor blocks exit', () => {
  const res = shouldEarlyExit(withScore(cleanCritique(), 'contrast', EARLY_EXIT_MIN_SCORE - 0.1));
  assert.equal(res.exit, false);
  assert.equal(res.reason, 'blockers');
  assert.ok(res.blockers.some((b) => b.startsWith('min(scores)')));
});

test('shouldEarlyExit: min confidence below 4 blocks exit', () => {
  const res = shouldEarlyExit(withConfidence(cleanCritique(), 'layout', EARLY_EXIT_MIN_CONFIDENCE - 1));
  assert.equal(res.exit, false);
  assert.ok(res.blockers.some((b) => b.startsWith('min(confidence)')));
});

test('shouldEarlyExit: any axe violation blocks exit', () => {
  const res = shouldEarlyExit({ ...cleanCritique(), axe_violations_count: 1 });
  assert.equal(res.exit, false);
  assert.ok(res.blockers.some((b) => b.includes('axe_violations_count 1')));
});

test('shouldEarlyExit: missing axe count blocks exit (do not trust absence)', () => {
  const c = cleanCritique();
  delete c.axe_violations_count;
  const res = shouldEarlyExit(c);
  assert.equal(res.exit, false);
  assert.ok(res.blockers.some((b) => b.includes('axe_violations_count not reported')));
});

test('shouldEarlyExit: blocker-severity slop detection blocks exit', () => {
  const res = shouldEarlyExit({
    ...cleanCritique(),
    slop_detections: [{ pattern_id: 5, severity: 'blocker' }],
  });
  assert.equal(res.exit, false);
  assert.ok(res.blockers.some((b) => b.includes('blocker-severity slop')));
});

test('shouldEarlyExit: minor slop detection does NOT block exit', () => {
  const res = shouldEarlyExit({
    ...cleanCritique(),
    slop_detections: [{ pattern_id: 11, severity: 'minor' }],
  });
  assert.equal(res.exit, true);
});

test('shouldEarlyExit: three gates failing stacks multiple blockers', () => {
  const c = cleanCritique();
  c.scores.hierarchy = 5.0;
  c.confidence.layout = 2;
  c.axe_violations_count = 3;
  const res = shouldEarlyExit(c);
  assert.equal(res.exit, false);
  assert.equal(res.blockers.length, 3);
});

test('shouldEarlyExit: calibration floor blocks round-1 exit even when clean', () => {
  const c = cleanCritique({ round: 1 });
  const res = shouldEarlyExit(c, { calibrationMode: true });
  assert.equal(res.exit, false);
  assert.equal(res.reason, 'calibration_floor');
});

test('shouldEarlyExit: calibration mode permits round-2 exit when clean', () => {
  const c = cleanCritique({ round: 2 });
  const res = shouldEarlyExit(c, { calibrationMode: true });
  assert.equal(res.exit, true);
});

test('shouldEarlyExit: malformed critique rejected safely', () => {
  const res = shouldEarlyExit({ round: 'two', scores: null, convergence_signal: false });
  assert.equal(res.exit, false);
  assert.equal(res.reason, 'malformed_critique');
});

// ── shouldEscalateToReroll ──────────────────────────────────────────────────
test('shouldEscalateToReroll: round 1 with 3 scores < 4 escalates', () => {
  const c = cleanCritique({ round: 1 });
  c.scores.hierarchy = 2;
  c.scores.layout = 3;
  c.scores.typography = 3.5;
  const res = shouldEscalateToReroll(c);
  assert.equal(res.escalate, true);
  assert.equal(res.reason, 'escalated_reroll');
  assert.deepEqual(res.badDimensions.sort(), ['hierarchy', 'layout', 'typography']);
});

test('shouldEscalateToReroll: round 1 with only 2 scores < 4 does NOT escalate', () => {
  const c = cleanCritique({ round: 1 });
  c.scores.hierarchy = 3;
  c.scores.layout = 3;
  const res = shouldEscalateToReroll(c);
  assert.equal(res.escalate, false);
  assert.equal(res.reason, 'threshold_not_met');
});

test('shouldEscalateToReroll: round 2 never escalates (only round 1)', () => {
  const c = cleanCritique({ round: 2 });
  for (const d of DIMENSIONS) c.scores[d] = 1;
  const res = shouldEscalateToReroll(c);
  assert.equal(res.escalate, false);
  assert.equal(res.reason, 'only_round_1_escalates');
});

test('shouldEscalateToReroll: malformed input does not escalate', () => {
  const res = shouldEscalateToReroll(null);
  assert.equal(res.escalate, false);
});

// ── shouldUseDiffRegen ──────────────────────────────────────────────────────
test('shouldUseDiffRegen: round 1 → full regen', () => {
  assert.equal(shouldUseDiffRegen(1), false);
});

test('shouldUseDiffRegen: round 2 → diff', () => {
  assert.equal(shouldUseDiffRegen(2), true);
});

test('shouldUseDiffRegen: round 3 → diff', () => {
  assert.equal(shouldUseDiffRegen(3), true);
});

test('shouldUseDiffRegen: previous convergence_signal forces full regen', () => {
  assert.equal(shouldUseDiffRegen(2, { previousConvergenceSignal: true }), false);
});

test('shouldUseDiffRegen: non-integer / non-positive rounds → false', () => {
  assert.equal(shouldUseDiffRegen(0), false);
  assert.equal(shouldUseDiffRegen(-1), false);
  assert.equal(shouldUseDiffRegen('2'), false);
  assert.equal(shouldUseDiffRegen(2.5), false);
});
