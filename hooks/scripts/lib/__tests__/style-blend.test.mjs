// Run: node --test hooks/scripts/lib/__tests__/style-blend.test.mjs
//
// Sprint 17 Task 33.1 — slerp + accessibility clamps in 8D embedding space.
// Tests use FIXTURE embeddings only — production _embeddings.json is not
// touched here, since 33.1 must remain testable when the catalog evolves.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AXES,
  slerp2,
  slerpN,
  blend,
  applyAccessibilityClamps,
  cosine8D,
  vectorToArray,
  arrayToVector,
} from '../style-blend.mjs';

// ── Fixtures ────────────────────────────────────────────────────────────────

// Deterministic embeddings designed so we can reason about angles & magnitudes
// without depending on the live catalog.
const FIXTURE_EMBEDDINGS = {
  // Two reasonable catalog-shaped points (axes ∈ [0,1]).
  swissish:    [0.50, 0.80, 0.50, 0.33, 0.90, 0.20, 0.65, 0.22],
  liminalish:  [0.20, 0.70, 0.70, 0.33, 0.15, 0.20, 0.65, 0.58],
  // Vector with very low chroma + low contrast — clamps target.
  duller:      [0.50, 0.05, 0.50, 0.33, 0.15, 0.20, 0.10, 0.40],
  // Vector with motion mid-tier — quantization target.
  motiony:     [0.50, 0.50, 0.50, 0.50, 0.15, 0.30, 0.50, 0.40],
  // Two near-orthogonal unit-y vectors so we can predict omega exactly.
  axisX:       [1.0, 0,   0,   0,   0,    0,    0,    0  ],
  axisY:       [0,   1.0, 0,   0,   0,    0,    0,    0  ],
  axisZ:       [0,   0,   1.0, 0,   0,    0,    0,    0  ],
  // Near-antipodal pair (negate axisX is not in [0,1] but in unit-sphere
  // space we can still compute it; we use mostly-opposite sign).
  axisXneg:    [0.0, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
};

// Convenience for object-form vectors.
function vec(arr) {
  return arrayToVector(arr);
}

// ── 1. slerp2(A, A, 0.5) === A ──────────────────────────────────────────────

test('slerp2: idempotent on identical inputs (any t)', () => {
  const a = FIXTURE_EMBEDDINGS.swissish;
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const out = slerp2(a, a, t);
    for (let i = 0; i < a.length; i++) {
      assert.ok(Math.abs(out[i] - a[i]) < 1e-9, `axis ${AXES[i]} drifted at t=${t}`);
    }
  }
});

// ── 2 & 3. slerp endpoints ──────────────────────────────────────────────────

test('slerp2: t=0 returns A (within numeric tolerance)', () => {
  const a = FIXTURE_EMBEDDINGS.swissish;
  const b = FIXTURE_EMBEDDINGS.liminalish;
  const out = slerp2(a, b, 0);
  for (let i = 0; i < a.length; i++) {
    assert.ok(Math.abs(out[i] - a[i]) < 1e-9, `t=0 should equal A on axis ${AXES[i]}`);
  }
});

test('slerp2: t=1 returns B (within numeric tolerance)', () => {
  const a = FIXTURE_EMBEDDINGS.swissish;
  const b = FIXTURE_EMBEDDINGS.liminalish;
  const out = slerp2(a, b, 1);
  for (let i = 0; i < b.length; i++) {
    assert.ok(Math.abs(out[i] - b[i]) < 1e-9, `t=1 should equal B on axis ${AXES[i]}`);
  }
});

// ── 4. midpoint sanity: angle to A ≈ angle to B at t=0.5 ────────────────────

test('slerp2: t=0.5 midpoint is equidistant in angle from A and B', () => {
  const a = FIXTURE_EMBEDDINGS.axisX;
  const b = FIXTURE_EMBEDDINGS.axisY;
  const mid = slerp2(a, b, 0.5);
  const cosA = cosine8D(mid, a);
  const cosB = cosine8D(mid, b);
  assert.ok(Math.abs(cosA - cosB) < 1e-6, `mid should be equidistant: cosA=${cosA}, cosB=${cosB}`);
  // And it should NOT collapse to either endpoint.
  assert.ok(Math.abs(cosA - 1) > 0.01, 'mid should not equal A');
  assert.ok(Math.abs(cosB - 1) > 0.01, 'mid should not equal B');
});

// ── 5. slerpN with 3 anchors, equal weight ──────────────────────────────────

test('slerpN: 3 anchors with equal weight produces valid 8D vector', () => {
  const result = slerpN(
    [
      FIXTURE_EMBEDDINGS.swissish,
      FIXTURE_EMBEDDINGS.liminalish,
      FIXTURE_EMBEDDINGS.motiony,
    ],
    [1 / 3, 1 / 3, 1 / 3]
  );
  const arr = vectorToArray(result.vector);
  assert.equal(arr.length, AXES.length, 'must have 8 axes');
  for (const x of arr) {
    assert.ok(Number.isFinite(x), 'no NaN / Inf');
    assert.ok(x >= 0 && x <= 1.05, `axis value ${x} out of range`); // ε past 1 ok pre-clamp
  }
  assert.ok(typeof result.omega_max === 'number' && result.omega_max >= 0);
});

// ── 6. slerpN auto-normalizes weights ───────────────────────────────────────

test('slerpN: weights with non-unit sum get auto-normalized', () => {
  const a = FIXTURE_EMBEDDINGS.swissish;
  const b = FIXTURE_EMBEDDINGS.liminalish;
  // [2, 1] should behave like [2/3, 1/3].
  const r1 = slerpN([a, b], [2, 1]);
  const r2 = slerpN([a, b], [2 / 3, 1 / 3]);
  const arr1 = vectorToArray(r1.vector);
  const arr2 = vectorToArray(r2.vector);
  for (let i = 0; i < arr1.length; i++) {
    assert.ok(
      Math.abs(arr1[i] - arr2[i]) < 1e-9,
      `axis ${AXES[i]} differs: normalized=${arr2[i]} raw=${arr1[i]}`
    );
  }
});

// ── 7. accessibility clamps: chroma floor ──────────────────────────────────

test('applyAccessibilityClamps: low chroma triggers clamp', () => {
  const { vector, clamps_applied } = applyAccessibilityClamps(vec(FIXTURE_EMBEDDINGS.duller));
  assert.ok(clamps_applied.includes('chroma'), `expected chroma clamp, got ${clamps_applied}`);
  assert.ok(vector.chroma >= 0.15, 'chroma raised to floor');
  // contrast_energy=0.10 should also clamp to 0.30.
  assert.ok(clamps_applied.includes('contrast_energy'));
  assert.ok(vector.contrast_energy >= 0.30);
});

// ── 8. motion quantization ──────────────────────────────────────────────────

test('applyAccessibilityClamps: motion_intensity 0.5 quantizes to 0.66 (tier 2)', () => {
  // 0.5 is equidistant from 0.33 and 0.66; tie-break: nearestTier picks the
  // first one that's strictly closer when scanning, so for ties the FIRST
  // occurrence wins. With tiers [0, 0.33, 0.66, 1.0] and value 0.5:
  //   |0.5-0.33|=0.17, |0.5-0.66|=0.16 → 0.66 wins.
  const v = vec([0.5, 0.5, 0.5, 0.5, 0.15, 0.30, 0.50, 0.40]);
  const { vector, clamps_applied } = applyAccessibilityClamps(v);
  assert.ok(clamps_applied.includes('motion_intensity'));
  assert.ok(
    Math.abs(vector.motion_intensity - 0.66) < 1e-9,
    `expected snap to 0.66, got ${vector.motion_intensity}`
  );
});

test('applyAccessibilityClamps: motion_intensity already at tier value is unchanged', () => {
  const v = vec([0.5, 0.5, 0.5, 0.66, 0.15, 0.30, 0.50, 0.40]);
  const { vector, clamps_applied } = applyAccessibilityClamps(v);
  assert.ok(!clamps_applied.includes('motion_intensity'), 'no clamp when already on tier');
  assert.equal(vector.motion_intensity, 0.66);
});

// ── 9. blend() with custom embeddings map ───────────────────────────────────

test('blend: accepts injected embeddings, returns valid result', () => {
  const r = blend(
    ['swissish', 'liminalish'],
    [0.7, 0.3],
    { embeddings: FIXTURE_EMBEDDINGS }
  );
  assert.ok(r.vector && typeof r.vector === 'object');
  for (const k of AXES) {
    assert.ok(typeof r.vector[k] === 'number', `axis ${k} present`);
  }
  assert.equal(r.anchors_used.length, 2);
  assert.equal(r.anchors_used[0].id, 'swissish');
  assert.equal(r.anchors_used[0].weight, 0.7);
  assert.ok(Array.isArray(r.clamps_applied));
  assert.equal(typeof r.omegas_warning, 'boolean');
});

// ── 10. blend throws on unknown anchor ──────────────────────────────────────

test('blend: throws on unknown anchor id', () => {
  assert.throws(
    () => blend(['nonexistent-style', 'swissish'], [0.5, 0.5], { embeddings: FIXTURE_EMBEDDINGS }),
    /unknown anchor id "nonexistent-style"/
  );
});

// ── 11. omega warning on near-antipodal vectors ────────────────────────────

test('blend: omegas_warning=true when anchors are near-antipodal', () => {
  // Construct two roughly opposite unit vectors. axisX vs axisXneg with
  // mostly-opposite-sign small components → angle > 2.5 rad.
  const localEmb = {
    pole_a: [1, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
    pole_b: [0.0, 1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  };
  // Above pair is orthogonal (omega ≈ π/2 ≈ 1.57), NOT > 2.5. Build a true
  // near-antipodal pair: same axis but inverted via negative components is
  // outside [0,1]. Use unit-vectors directly.
  const localEmb2 = {
    pole_a: [1, 0, 0, 0, 0, 0, 0, 0],
    pole_b: [-0.99, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
  };
  const r = blend(['pole_a', 'pole_b'], [0.5, 0.5], { embeddings: localEmb2 });
  assert.equal(r.omegas_warning, true, `expected warning, omega_max=${r.omega_max}`);
  assert.ok(r.omega_max > 2.5);
});

test('blend: omegas_warning=false on similar vectors', () => {
  const r = blend(['swissish', 'liminalish'], [0.5, 0.5], { embeddings: FIXTURE_EMBEDDINGS });
  assert.equal(r.omegas_warning, false, `unexpected warning, omega_max=${r.omega_max}`);
});

// ── 12. cosine8D sanity ────────────────────────────────────────────────────

test('cosine8D: identical vectors → 1', () => {
  const v = FIXTURE_EMBEDDINGS.swissish;
  assert.ok(Math.abs(cosine8D(v, v) - 1) < 1e-9);
});

test('cosine8D: orthogonal vectors → 0', () => {
  assert.ok(Math.abs(cosine8D(FIXTURE_EMBEDDINGS.axisX, FIXTURE_EMBEDDINGS.axisY)) < 1e-9);
});

test('cosine8D: object form works', () => {
  const a = arrayToVector(FIXTURE_EMBEDDINGS.swissish);
  const b = arrayToVector(FIXTURE_EMBEDDINGS.liminalish);
  const c = cosine8D(a, b);
  assert.ok(c > 0 && c <= 1, `cosine should be positive small angle, got ${c}`);
});

// ── Additional: 1-anchor short-circuit ──────────────────────────────────────

test('slerpN: single anchor returns that anchor unchanged', () => {
  const r = slerpN([FIXTURE_EMBEDDINGS.swissish], [1.0]);
  const arr = vectorToArray(r.vector);
  for (let i = 0; i < arr.length; i++) {
    assert.ok(Math.abs(arr[i] - FIXTURE_EMBEDDINGS.swissish[i]) < 1e-9);
  }
  assert.equal(r.omega_max, 0);
});

// ── Additional: zero-weight rejection ───────────────────────────────────────

test('slerpN: throws when weights sum to zero', () => {
  assert.throws(
    () => slerpN([FIXTURE_EMBEDDINGS.swissish, FIXTURE_EMBEDDINGS.liminalish], [0, 0]),
    /sum to zero/
  );
});

test('slerpN: throws on length mismatch', () => {
  assert.throws(
    () => slerpN([FIXTURE_EMBEDDINGS.swissish], [0.5, 0.5]),
    /same length/
  );
});
