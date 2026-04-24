// Run: node --test hooks/scripts/lib/__tests__/apply-calibration.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyCalibration, DIMENSIONS } from '../apply-calibration.mjs';

function critique(overrides = {}) {
  const scores = {};
  for (const d of DIMENSIONS) scores[d] = 7;
  return {
    round: 1,
    scores,
    confidence: Object.fromEntries(DIMENSIONS.map((d) => [d, 4])),
    top_3_fixes: [],
    convergence_signal: false,
    prompt_hash: 'sha256:abc',
    ...overrides,
  };
}

function fittedCalibration(overrides = {}) {
  const per = {};
  for (const d of DIMENSIONS) per[d] = { slope: 1, intercept: 0, spearman_rho: 0.8, mse: 0.5, pair_count: 12, tight_pair_count: 12, low_correlation: false };
  return {
    schema_version: '1.0.0',
    generated_at: '2026-04-22T00:00:00Z',
    status: 'fitted',
    entry_counts: { total: 12, usable: 12, skipped: [] },
    critic_prompt_hash: 'sha256:abc',
    warnings: [],
    per_dimension: per,
    ...overrides,
  };
}

test('identity_fallback leaves critique untouched', () => {
  const c = critique();
  const cal = { status: 'identity_fallback', per_dimension: {} };
  const r = applyCalibration(c, cal);
  assert.equal(r.applied, false);
  assert.equal(r.reason, 'identity_fallback');
  assert.deepEqual(r.critique.scores, c.scores);
});

test('prompt_hash mismatch short-circuits and warns', () => {
  const c = critique({ prompt_hash: 'sha256:NEW' });
  const cal = fittedCalibration({ critic_prompt_hash: 'sha256:OLD' });
  const r = applyCalibration(c, cal);
  assert.equal(r.applied, false);
  assert.equal(r.reason, 'prompt_hash_mismatch');
  assert.ok(r.warnings.some((w) => w.includes('sha256:OLD') && w.includes('sha256:NEW')));
});

test('fitted mode applies slope + intercept and preserves raw_scores', () => {
  const c = critique();
  // Apply a non-trivial fit: hierarchy critic overrates by +1, contrast underrates by -0.5
  const cal = fittedCalibration();
  cal.per_dimension.hierarchy = { slope: 1, intercept: -1, spearman_rho: 0.9, mse: 0.1, pair_count: 15, tight_pair_count: 15, low_correlation: false };
  cal.per_dimension.contrast  = { slope: 1, intercept: +0.5, spearman_rho: 0.85, mse: 0.1, pair_count: 15, tight_pair_count: 15, low_correlation: false };
  const r = applyCalibration(c, cal);
  assert.equal(r.applied, true);
  assert.equal(r.critique.scores.hierarchy, 6);   // 7 + (-1)
  assert.equal(r.critique.scores.contrast,  7.5); // 7 + 0.5
  assert.equal(r.critique.scores.typography, 7);  // identity
  assert.equal(r.critique.raw_scores.hierarchy, 7);
  assert.equal(r.critique.calibration_applied, true);
  assert.equal(r.critique.calibration_status, 'fitted');
});

test('clamps to [0, 10] after fitting', () => {
  const c = critique();
  c.scores.hierarchy = 9;
  const cal = fittedCalibration();
  cal.per_dimension.hierarchy = { slope: 2, intercept: 5, spearman_rho: 0.7, mse: 1, pair_count: 12, tight_pair_count: 12, low_correlation: false };
  // Predicted = 2*9 + 5 = 23 → clamped to 10
  const r = applyCalibration(c, cal);
  assert.equal(r.critique.scores.hierarchy, 10);
});

test('null craft_measurable survives calibration', () => {
  const c = critique();
  c.scores.craft_measurable = null;
  const cal = fittedCalibration();
  const r = applyCalibration(c, cal);
  assert.equal(r.applied, true);
  assert.equal(r.critique.scores.craft_measurable, null);
});

test('low_correlation dimension is applied but warned', () => {
  const c = critique();
  const cal = fittedCalibration();
  cal.per_dimension.motion_readiness = { slope: 0.8, intercept: 0.5, spearman_rho: 0.4, mse: 2, pair_count: 12, tight_pair_count: 12, low_correlation: true };
  const r = applyCalibration(c, cal);
  assert.equal(r.applied, true);
  assert.equal(r.critique.scores.motion_readiness, 0.8 * 7 + 0.5);
  assert.ok(r.warnings.some((w) => w.includes('motion_readiness') && w.includes('untrustworthy')));
});

test('absent calibration returns reason=absent', () => {
  const r = applyCalibration(critique(), null);
  assert.equal(r.applied, false);
  assert.equal(r.reason, 'absent');
});

test('corrupt critique returns reason=corrupt_critique', () => {
  const r = applyCalibration({ scores: null }, fittedCalibration());
  assert.equal(r.applied, false);
  assert.equal(r.reason, 'corrupt_critique');
});

test('dimension missing from calibration entry keeps raw value', () => {
  const c = critique();
  const cal = fittedCalibration();
  delete cal.per_dimension.hierarchy;
  const r = applyCalibration(c, cal);
  assert.equal(r.applied, true);
  assert.equal(r.critique.scores.hierarchy, 7); // unchanged
  assert.ok(r.warnings.some((w) => w.includes('hierarchy') && w.includes('missing')));
});
