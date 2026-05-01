import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreMotion2, applyCalibration, WEIGHTS, TIER_NAMES } from '../scorer-2.mjs';

test('weights sum to 1.0', () => {
  const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  assert.equal(+sum.toFixed(3), 1.0);
});

test('returns tier 0 (None) for empty source', () => {
  const result = scoreMotion2('');
  assert.equal(result.tier, 0);
  assert.equal(result.tier_name, 'None');
});

test('returns tier 1 (Subtle) for default ease transition only', () => {
  const src = `
    .button {
      transition: opacity 200ms ease;
    }
  `;
  const result = scoreMotion2(src);
  assert.ok(result.tier <= 1, `expected tier <=1, got ${result.tier}`);
});

test('returns tier 2-3 for spring tokens with AARS keyframes', () => {
  const src = `
    .card {
      transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
      transition-duration: 200ms;
      transition-delay: 0ms;
      animation: pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes pop {
      0% { transform: scale(0.95) }
      60% { transform: scale(1.05) }
      80% { transform: scale(0.98) }
      100% { transform: scale(1) }
    }
    @media (prefers-reduced-motion: reduce) {
      .card { animation: none; transition: none }
    }
  `;
  const result = scoreMotion2(src);
  assert.ok(result.tier >= 2, `expected tier>=2, got ${result.tier}`);
  assert.ok(result.subscores.aars_pattern >= 0.6, `aars=${result.subscores.aars_pattern}`);
  assert.ok(result.subscores.reduced_motion >= 0.7);
});

test('returns subscores for all 6 dims', () => {
  const result = scoreMotion2('transition: all 200ms ease');
  for (const key of Object.keys(WEIGHTS)) {
    assert.ok(typeof result.subscores[key] === 'number', `missing ${key}`);
  }
});

test('total_score is weighted sum', () => {
  const src = `
    .x {
      transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
      transition: all 200ms;
    }
  `;
  const result = scoreMotion2(src);
  let computed = 0;
  for (const [key, w] of Object.entries(WEIGHTS)) {
    computed += result.subscores[key] * w;
  }
  assert.equal(+computed.toFixed(3), result.total_score);
});

test('motion_readiness_10 is total*10', () => {
  const result = scoreMotion2(`
    .x {
      transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
      transition-duration: 200ms;
    }
  `);
  assert.equal(result.motion_readiness_10, +(result.total_score * 10).toFixed(2));
});

test('evidence array carries dim labels', () => {
  const src = `
    .x { transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) }
    @keyframes y { 0% { transform: translateX(0) } 100% { transform: translateX(50px) } }
  `;
  const result = scoreMotion2(src);
  assert.ok(Array.isArray(result.evidence));
  for (const e of result.evidence) {
    assert.ok(typeof e.dim === 'string');
    assert.ok([
      'easing_provenance', 'aars_pattern', 'timing_consistency',
      'narrative_arc', 'reduced_motion', 'cinema_easing',
    ].includes(e.dim));
  }
});

test('detector_meta exposes diagnostics', () => {
  const src = `
    @keyframes pop { 0% { transform: scale(0.9) } 60% { transform: scale(1.1) } 100% { transform: scale(1) } }
    .x { transition-delay: 100ms }
    .y { transition-delay: 200ms }
  `;
  const result = scoreMotion2(src);
  assert.ok(typeof result.detector_meta.aars_phases_detected === 'number');
  assert.ok(typeof result.detector_meta.narrative_layered_count === 'number');
});

test('cinematic tier requires all subscores >= 0.6', () => {
  const lopsidedSrc = `
    @keyframes a {
      0% { transform: translateX(-10px) }
      40% { transform: translateX(110px) }
      80% { transform: translateX(95px) }
      100% { transform: translateX(100px) }
    }
    .x { transition-timing-function: linear(0, 0.2, 0.5, 0.8, 1); transition-duration: 200ms }
  `;
  const result = scoreMotion2(lopsidedSrc);
  if (result.tier === 4) {
    for (const key of Object.keys(WEIGHTS)) {
      assert.ok(result.subscores[key] >= 0.6, `tier 4 violated: ${key}=${result.subscores[key]}`);
    }
  }
});

test('TIER_NAMES has 5 entries', () => {
  assert.equal(TIER_NAMES.length, 5);
  assert.equal(TIER_NAMES[0], 'None');
  assert.equal(TIER_NAMES[4], 'Cinematic');
});

test('applyCalibration without config returns unchanged result', () => {
  const result = scoreMotion2('transition: all 200ms ease');
  const calibrated = applyCalibration(result, null);
  assert.equal(calibrated.total_score, result.total_score);
});

test('applyCalibration with subscore fit re-weights total', () => {
  const result = scoreMotion2(`
    .x { transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); transition-duration: 200ms }
  `);
  const calibrated = applyCalibration(result, {
    subscores: {
      easing_provenance: { slope: 0.5, intercept: 0 },
    },
  });
  assert.ok(calibrated.subscores.easing_provenance < result.subscores.easing_provenance);
  assert.ok(calibrated.total_score < result.total_score);
});

test('applyCalibration clamps to [0, 1]', () => {
  const result = scoreMotion2('transition: all 200ms ease');
  const calibrated = applyCalibration(result, {
    subscores: {
      easing_provenance: { slope: 100, intercept: 1 },
    },
  });
  assert.ok(calibrated.subscores.easing_provenance <= 1.0);
});
