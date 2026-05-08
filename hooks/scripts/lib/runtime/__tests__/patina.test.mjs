// Tests for patina.mjs — Sprint 23 Task 42.3
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPatina, patinaStatus, DRIFT_RATES, FLOORS, getFileAgeMonths } from '../patina.mjs';

const BASE = {
  chroma: 0.4,
  border_radius: 8,
  motion_duration: 200,
  edge_sharpness: 1.0,
};

test('age 0 leaves tokens unchanged', () => {
  const r = applyPatina({ baseTokens: BASE, ageMonths: 0 });
  assert.equal(r.drifted.chroma, BASE.chroma);
  assert.equal(r.drifted.border_radius, BASE.border_radius);
  assert.equal(r.drifted.motion_duration, BASE.motion_duration);
  assert.equal(r.drifted.edge_sharpness, BASE.edge_sharpness);
  assert.equal(r.drifts_applied.length, 0);
});

test('age 3 produces expected linear drift', () => {
  const r = applyPatina({ baseTokens: BASE, ageMonths: 3 });
  // chroma: 0.4 + (-0.02)*3 = 0.34
  assert.ok(Math.abs(r.drifted.chroma - 0.34) < 1e-9, `expected 0.34, got ${r.drifted.chroma}`);
  // border_radius: 8 + 0.5*3 = 9.5
  assert.equal(r.drifted.border_radius, 9.5);
  // motion_duration: 200 + 5*3 = 215
  assert.equal(r.drifted.motion_duration, 215);
  // edge_sharpness: 1.0 + (-0.01)*3 = 0.97
  assert.ok(Math.abs(r.drifted.edge_sharpness - 0.97) < 1e-9);
  assert.ok(r.drifts_applied.includes('chroma'));
  assert.ok(r.drifts_applied.includes('border_radius'));
});

test('age 6 produces progressive drift compared to age 3', () => {
  const r3 = applyPatina({ baseTokens: BASE, ageMonths: 3 });
  const r6 = applyPatina({ baseTokens: BASE, ageMonths: 6 });
  assert.ok(r6.drifted.chroma < r3.drifted.chroma, 'chroma decreases further at age 6');
  assert.ok(r6.drifted.border_radius > r3.drifted.border_radius, 'radius grows further');
  assert.ok(r6.drifted.motion_duration > r3.drifted.motion_duration);
  assert.ok(r6.drifted.edge_sharpness < r3.drifted.edge_sharpness);
});

test('age 12 stays bounded by floors (chroma + edge_sharpness)', () => {
  // With chroma=0.4, drift -0.02/mo: at 12mo → 0.16 (still above floor 0.05).
  const r = applyPatina({ baseTokens: BASE, ageMonths: 12 });
  assert.ok(r.drifted.chroma >= FLOORS.chroma);
  assert.ok(r.drifted.edge_sharpness >= FLOORS.edge_sharpness);
});

test('extreme age clamps chroma at floor and records floors_hit', () => {
  // Drift -0.02/mo on base 0.4: would go negative around 20mo.
  const r = applyPatina({ baseTokens: BASE, ageMonths: 50 });
  assert.equal(r.drifted.chroma, FLOORS.chroma);
  const hit = r.floors_hit.find((f) => f.token === 'chroma');
  assert.ok(hit, 'expected floors_hit to record chroma clamp');
  assert.equal(hit.floor, FLOORS.chroma);
});

test('extreme age clamps edge_sharpness at floor', () => {
  const r = applyPatina({ baseTokens: BASE, ageMonths: 100 });
  assert.equal(r.drifted.edge_sharpness, FLOORS.edge_sharpness);
  const hit = r.floors_hit.find((f) => f.token === 'edge_sharpness');
  assert.ok(hit, 'expected floors_hit to record edge_sharpness clamp');
});

test('freezeAt overrides the actual age', () => {
  const r = applyPatina({ baseTokens: BASE, ageMonths: 24, freezeAt: 6 });
  assert.equal(r.effectiveAge, 6);
  // Should match the 6-month drift, not the 24-month.
  const ref = applyPatina({ baseTokens: BASE, ageMonths: 6 });
  assert.equal(r.drifted.chroma, ref.drifted.chroma);
  assert.equal(r.drifted.border_radius, ref.drifted.border_radius);
});

test('freezeAt above current age does not extrapolate', () => {
  const r = applyPatina({ baseTokens: BASE, ageMonths: 2, freezeAt: 12 });
  // effectiveAge = min(2, 12) = 2
  assert.equal(r.effectiveAge, 2);
});

test('tokens absent from baseTokens are not invented', () => {
  const r = applyPatina({ baseTokens: { chroma: 0.5 }, ageMonths: 6 });
  assert.equal(r.drifted.chroma, 0.5 + DRIFT_RATES.chroma * 6);
  assert.equal('border_radius' in r.drifted, false);
});

test('applyPatina throws on bad inputs', () => {
  assert.throws(() => applyPatina({ baseTokens: null, ageMonths: 0 }), /baseTokens object required/);
  assert.throws(() => applyPatina({ baseTokens: BASE, ageMonths: 'a' }), /ageMonths must be a finite number/);
});

test('patinaStatus shape — file, age_months, estimated_drifts', () => {
  const s = patinaStatus('nonexistent-file-for-test.mjs');
  assert.equal(s.file, 'nonexistent-file-for-test.mjs');
  assert.equal(typeof s.age_months, 'number');
  assert.ok(Array.isArray(s.estimated_drifts));
  assert.equal(s.estimated_drifts.length, Object.keys(DRIFT_RATES).length);
  for (const d of s.estimated_drifts) {
    assert.ok('token' in d);
    assert.ok('rate_per_month' in d);
    assert.ok('total_drift' in d);
  }
});

test('getFileAgeMonths returns 0 for non-existent file (graceful failure)', () => {
  const age = getFileAgeMonths('absolutely-not-a-real-file-12345.mjs');
  assert.equal(age, 0);
});
