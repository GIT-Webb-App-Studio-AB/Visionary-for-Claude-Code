import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectDrift } from '../drift-detect.mjs';

test('exact-match passes', () => {
  const tokens = {
    color: { primary: { '$value': '#7c2d12', '$type': 'color' } },
  };
  const r = detectDrift({ source: 'color: #7c2d12;', lockedTokens: tokens });
  assert.equal(r.ok, true);
  assert.equal(r.drifts.length, 0);
});

test('drift detected for unlocked color', () => {
  const tokens = { color: { primary: { '$value': '#7c2d12' } } };
  const r = detectDrift({ source: 'color: #06b6d4;', lockedTokens: tokens });
  assert.equal(r.ok, false);
  assert.ok(r.drifts.length >= 1);
  const d = r.drifts.find((d) => d.value === '#06b6d4');
  assert.ok(d);
});

test('near-match within tolerance → warning, not drift', () => {
  const tokens = { spacing: { md: { '$value': 16 } } };
  const r = detectDrift({ source: 'padding: 17px;', lockedTokens: tokens, tolerance: 0.1 });
  assert.equal(r.drifts.length, 0);
  assert.ok(r.warnings.length >= 1);
});

test('allowed_drifts pattern bypasses', () => {
  const tokens = { color: { primary: { '$value': '#7c2d12' } } };
  const r = detectDrift({ source: 'color: #06b6d4;', lockedTokens: tokens, allowedDrifts: ['#06b6d4'] });
  assert.equal(r.ok, true);
});

test('Tailwind class detected as drift if not in tokens', () => {
  const r = detectDrift({ source: '<div class="bg-cyan-400">', lockedTokens: {} });
  assert.ok(r.drifts.length >= 1);
});
