// Tests for coordinator.mjs — Sprint 23 Task 42.4
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveRuntimeContext,
  composeRuntimeSnippets,
  PRECEDENCE,
  COMBINED_DRIFT_CAP,
} from '../coordinator.mjs';

const BASE = {
  chroma: 0.4,
  border_radius: 8,
  motion_duration: 200,
  edge_sharpness: 1.0,
};

const PALETTES = {
  dawn:  { 'circadian-bg': '#fef3c7' },
  day:   { 'circadian-bg': '#ffffff' },
  dusk:  { 'circadian-bg': '#fed7aa' },
  night: { 'circadian-bg': '#0f172a' },
};

test('PRECEDENCE order is system_pref > network > circadian > patina', () => {
  assert.deepEqual(PRECEDENCE, ['system_pref', 'network', 'circadian', 'patina']);
});

test('all 3 mechanisms can be enabled simultaneously without crashing', () => {
  const r = resolveRuntimeContext({
    baseTokens: BASE,
    enableCircadian: true,
    enableNetwork: true,
    enablePatina: true,
    fileAgeMonths: 3,
    date: new Date('2026-03-20T11:00:00'),
    lat: 60,
  });
  assert.ok(r.tokens);
  assert.ok(Array.isArray(r.trace));
  // Patina layer should appear because age > 0.
  assert.ok(r.trace.find((t) => t.layer === 'patina'));
  // Circadian layer recorded.
  assert.ok(r.trace.find((t) => t.layer === 'circadian'));
  // Network layer recorded.
  assert.ok(r.trace.find((t) => t.layer === 'network'));
});

test('trace order respects build-time precedence (patina first, network last)', () => {
  const r = resolveRuntimeContext({
    baseTokens: BASE,
    enableCircadian: true,
    enableNetwork: true,
    enablePatina: true,
    fileAgeMonths: 1,
  });
  const layers = r.trace.map((t) => t.layer).filter((l) => l !== 'combined-drift-cap');
  // Build-time application order: patina → circadian → network.
  const patinaIdx = layers.indexOf('patina');
  const circIdx = layers.indexOf('circadian');
  const netIdx = layers.indexOf('network');
  assert.ok(patinaIdx < circIdx, 'patina before circadian');
  assert.ok(circIdx < netIdx, 'circadian before network');
});

test('disabling a mechanism omits its trace entry', () => {
  const r = resolveRuntimeContext({
    baseTokens: BASE,
    enableCircadian: false,
    enableNetwork: false,
    enablePatina: true,
    fileAgeMonths: 2,
  });
  assert.ok(r.trace.find((t) => t.layer === 'patina'));
  assert.ok(!r.trace.find((t) => t.layer === 'circadian'));
  assert.ok(!r.trace.find((t) => t.layer === 'network'));
});

test('combined-drift-cap clamps drift exceeding 15% from base', () => {
  // Force a deliberate >15% drift by using extreme age on motion_duration:
  // base 200, +5/mo → at 12mo = 260. 60/200 = 30% drift. Should be clamped to 15%.
  const r = resolveRuntimeContext({
    baseTokens: BASE,
    enablePatina: true,
    fileAgeMonths: 12,
  });
  // Expected motion_duration after clamp: 200 + 200*0.15 = 230.
  assert.ok(Math.abs(r.tokens.motion_duration - 230) < 1e-9, `motion_duration=${r.tokens.motion_duration}`);
  // Border radius: base 8, +0.5/mo → 12mo=14, 6/8=75% drift, clamp to 8+1.2=9.2.
  assert.ok(Math.abs(r.tokens.border_radius - 9.2) < 1e-9, `border_radius=${r.tokens.border_radius}`);
  // Cap trace entry should record clamped tokens.
  const capTrace = r.trace.find((t) => t.layer === 'combined-drift-cap');
  assert.ok(capTrace, 'combined-drift-cap trace entry expected');
  const clampedTokens = capTrace.clamped.map((c) => c.token);
  assert.ok(clampedTokens.includes('motion_duration'));
  assert.ok(clampedTokens.includes('border_radius'));
});

test('combined-drift-cap leaves small drifts untouched', () => {
  // age 1 mo → all drifts below 15%.
  const r = resolveRuntimeContext({
    baseTokens: BASE,
    enablePatina: true,
    fileAgeMonths: 1,
  });
  const capTrace = r.trace.find((t) => t.layer === 'combined-drift-cap');
  assert.ok(!capTrace, 'no clamping expected at age=1mo');
});

test('COMBINED_DRIFT_CAP is documented at 15%', () => {
  assert.equal(COMBINED_DRIFT_CAP, 0.15);
});

test('resolveRuntimeContext throws on missing baseTokens', () => {
  assert.throws(() => resolveRuntimeContext({}), /baseTokens object required/);
});

test('composeRuntimeSnippets — network only', () => {
  const out = composeRuntimeSnippets({ enableNetwork: true });
  assert.match(out, /<script>/);
  assert.ok(out.includes('navigator.connection'));
  assert.ok(!out.includes('palettes ='), 'circadian payload absent');
});

test('composeRuntimeSnippets — circadian requires palettes', () => {
  assert.throws(
    () => composeRuntimeSnippets({ enableCircadian: true }),
    /palettes required when enableCircadian=true/,
  );
});

test('composeRuntimeSnippets — both ordered network-first then circadian', () => {
  const out = composeRuntimeSnippets({
    enableNetwork: true,
    enableCircadian: true,
    palettes: PALETTES,
  });
  const netIdx = out.indexOf('navigator.connection');
  const circIdx = out.indexOf('circadian-bg');
  assert.ok(netIdx > -1 && circIdx > -1);
  assert.ok(netIdx < circIdx, 'network snippet must precede circadian snippet');
});

test('composeRuntimeSnippets — neither enabled returns empty string', () => {
  assert.equal(composeRuntimeSnippets({}), '');
});

test('patina freeze flows through coordinator', () => {
  const r = resolveRuntimeContext({
    baseTokens: BASE,
    enablePatina: true,
    fileAgeMonths: 24,
    freezePatina: 3,
  });
  const patinaTrace = r.trace.find((t) => t.layer === 'patina');
  assert.equal(patinaTrace.effective_age, 3);
});

test('100 randomized fixtures: combined drift never exceeds cap post-clamp', () => {
  // Sample random base + age, ensure post-clamp result respects 15% bound.
  function rand(min, max) { return min + Math.random() * (max - min); }
  let violations = 0;
  for (let i = 0; i < 100; i++) {
    const base = {
      chroma: rand(0.2, 0.8),
      border_radius: rand(2, 24),
      motion_duration: rand(100, 400),
      edge_sharpness: rand(0.7, 1.0),
    };
    const r = resolveRuntimeContext({
      baseTokens: base,
      enablePatina: true,
      fileAgeMonths: rand(0, 36),
    });
    for (const k of Object.keys(base)) {
      if (typeof r.tokens[k] !== 'number' || base[k] === 0) continue;
      const drift = Math.abs(r.tokens[k] - base[k]) / Math.abs(base[k]);
      // Allow tiny floating-point slop.
      if (drift > COMBINED_DRIFT_CAP + 1e-9) violations++;
    }
  }
  assert.equal(violations, 0, `expected zero combined-drift-cap violations, got ${violations}`);
});
