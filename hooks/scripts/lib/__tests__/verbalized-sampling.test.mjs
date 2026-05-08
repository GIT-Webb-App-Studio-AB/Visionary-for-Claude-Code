// Run: node --test hooks/scripts/lib/__tests__/verbalized-sampling.test.mjs
//
// Sprint 16 Task 31.1 unit tests. Five concerns:
//
//   1. Schema validation — one valid fixture + five invalid fixtures
//      hitting different schema constraints.
//   2. Convergence detection — five distinct concepts pass; five
//      near-identical "minimal card" variants trigger convergence.
//   3. Anti-typicality boost monte-carlo — verify the Zhang 2025 1.3-1.6x
//      pick-rate lift on probability ∈ [0.05, 0.15] candidates over 1000
//      samplings.
//   4. Edge case: uniform probabilities → uniform pick distribution.
//   5. Edge case: probability = 1 single candidate → boost cap kicks in.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateVsOutput,
  detectConvergence,
  pickWithAntiTypicality,
  _internals,
} from '../verbalized-sampling.mjs';

// ── Fixtures ────────────────────────────────────────────────────────────────
function validFixture() {
  return {
    concepts: [
      {
        concept: 'minimal editorial card with single accent line',
        probability: 0.34,
        rationale: 'matches calm-tone signal and spacious density preference',
        suggested_style_id: 'swiss-international',
      },
      {
        concept: 'asymmetric grid with overprint typography',
        probability: 0.22,
        rationale: 'alternative pulled from new-wave tradition for rhythm',
        suggested_style_id: 'new-wave-greiman',
      },
      {
        concept: 'brutalist concrete blocks with mono labels',
        probability: 0.18,
        rationale: 'pushes against the obvious minimal reading of the brief',
        suggested_style_id: 'brutalist-web',
      },
      {
        concept: 'japanese editorial vertical rhythm with red seal',
        probability: 0.14,
        rationale: 'underutilised cultural region matching density bias',
        suggested_style_id: 'japanese-editorial',
      },
      {
        concept: 'memphis postmodern shapes with primary palette',
        probability: 0.12,
        rationale: 'wildcard from 1980s era far from default vocabulary',
        suggested_style_id: 'memphis-postmodern',
      },
    ],
  };
}

// ── Schema validation ──────────────────────────────────────────────────────

test('validateVsOutput: valid fixture passes schema', () => {
  const fixture = validFixture();
  const result = validateVsOutput(fixture);
  assert.equal(result.ok, true, `expected ok, got errors: ${JSON.stringify(result.errors)}`);
  assert.equal(result.errors.length, 0);
  assert.ok(result.probabilitySum >= 0.99 && result.probabilitySum <= 1.01,
    `probability sum ${result.probabilitySum} should be ~1.0`);
});

test('validateVsOutput: also accepts a JSON string', () => {
  const json = JSON.stringify(validFixture());
  const result = validateVsOutput(json);
  assert.equal(result.ok, true);
});

test('validateVsOutput: rejects malformed JSON string', () => {
  const result = validateVsOutput('{not json at all]');
  assert.equal(result.ok, false);
  assert.match(result.errors[0].message, /invalid JSON/);
});

test('validateVsOutput: rejects fixture with missing required field', () => {
  const fixture = validFixture();
  delete fixture.concepts[2].rationale;
  const result = validateVsOutput(fixture);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((e) => /rationale/.test(e.path) && /required/.test(e.message)),
    `expected required-field error on rationale, got: ${JSON.stringify(result.errors)}`,
  );
});

test('validateVsOutput: rejects fixture with wrong type', () => {
  const fixture = validFixture();
  fixture.concepts[0].probability = '0.34'; // string instead of number
  const result = validateVsOutput(fixture);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((e) => /probability/.test(e.path)),
    `expected type error on probability, got: ${JSON.stringify(result.errors)}`,
  );
});

test('validateVsOutput: rejects fixture with out-of-range probability', () => {
  const fixture = validFixture();
  fixture.concepts[1].probability = 1.5;
  const result = validateVsOutput(fixture);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((e) => /probability/.test(e.path) && /maximum/.test(e.message)),
  );
});

test('validateVsOutput: rejects concept string shorter than 10 chars', () => {
  const fixture = validFixture();
  fixture.concepts[3].concept = 'short';
  const result = validateVsOutput(fixture);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((e) => /concept/.test(e.path) && /minimum/.test(e.message)),
  );
});

test('validateVsOutput: rejects suggested_style_id with invalid pattern', () => {
  const fixture = validFixture();
  fixture.concepts[0].suggested_style_id = 'NotKebabCase_With_Underscores';
  const result = validateVsOutput(fixture);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((e) => /suggested_style_id/.test(e.path) && /pattern/.test(e.message)),
  );
});

test('validateVsOutput: rejects array with wrong number of concepts', () => {
  const fixture = validFixture();
  fixture.concepts.push({
    concept: 'a sixth one that breaks the contract',
    probability: 0.05,
    rationale: 'should not be allowed by schema',
    suggested_style_id: 'sixth-style',
  });
  const result = validateVsOutput(fixture);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((e) => /maximum is 5/.test(e.message)),
  );
});

test('validateVsOutput: rejects fewer than 5 concepts', () => {
  const fixture = validFixture();
  fixture.concepts = fixture.concepts.slice(0, 4);
  const result = validateVsOutput(fixture);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((e) => /minimum is 5/.test(e.message)),
  );
});

// ── Convergence detection ──────────────────────────────────────────────────

test('detectConvergence: 5 distinct concepts → no convergence', () => {
  const fixture = validFixture();
  const result = detectConvergence(fixture.concepts, 0.7);
  assert.equal(result.converged, false);
  assert.ok(result.similarPairs.length < 3,
    `expected fewer than 3 similar pairs, got ${result.similarPairs.length}`);
});

test('detectConvergence: 5 near-identical concepts → convergence', () => {
  const concepts = [
    { concept: 'minimal card with subtle motion and spacious layout' },
    { concept: 'minimal card with subtle motion and clean layout' },
    { concept: 'minimal card with subtle motion and calm layout' },
    { concept: 'minimal card with subtle motion and quiet layout' },
    { concept: 'minimal card with subtle motion and restrained layout' },
  ];
  const result = detectConvergence(concepts, 0.7);
  assert.equal(result.converged, true,
    `expected convergence, got pairs: ${JSON.stringify(result.similarPairs)}`);
  assert.ok(result.similarPairs.length >= 3,
    `expected 3+ similar pairs, got ${result.similarPairs.length}`);
});

test('detectConvergence: empty input → no convergence', () => {
  assert.equal(detectConvergence([]).converged, false);
  assert.equal(detectConvergence([{ concept: 'lone' }]).converged, false);
});

test('detectConvergence: tunable threshold surfaces similar pairs', () => {
  // Two clusters: (0,1) share 4/6 tokens (jaccard ≈ 0.67), (2,3) share
  // 3/7 tokens (jaccard ≈ 0.43). At threshold 0.9 neither pair is
  // surfaced (no convergence). At threshold 0.4, both pairs surface
  // (similarPairs.length = 2 — still under the 3-pair convergence
  // bar, so converged=false but pairs are reported).
  const concepts = [
    { concept: 'minimal card with subtle accent' },
    { concept: 'minimal card with bold accent' },
    { concept: 'asymmetric grid with overprint type' },
    { concept: 'asymmetric grid with negative space' },
    { concept: 'memphis shapes with primary palette' },
  ];
  const strict = detectConvergence(concepts, 0.9);
  assert.equal(strict.converged, false);
  assert.equal(strict.similarPairs.length, 0);
  const loose = detectConvergence(concepts, 0.4);
  assert.equal(loose.similarPairs.length, 2,
    `expected 2 similar pairs at threshold 0.4, got ${JSON.stringify(loose.similarPairs)}`);
});

// ── Anti-typicality boost — monte carlo ────────────────────────────────────

test('pickWithAntiTypicality: low-prob candidates get 1.3-1.6x lift', () => {
  // Four candidates with weights spanning the Zhang 2025 sweet spot.
  // Low-prob = [0.05, 0.15]; High-prob = [0.35, 0.45]. Expected boost
  // ratios per the formula:
  //   p=0.05, alpha=0.65 → weight = 0.05^0.35 ≈ 0.366
  //   p=0.15, alpha=0.65 → weight = 0.15^0.35 ≈ 0.512
  //   p=0.35, alpha=0.65 → weight = 0.35^0.35 ≈ 0.687
  //   p=0.45, alpha=0.65 → weight = 0.45^0.35 ≈ 0.748
  // After normalisation, low-prob lift ~1.4x, high-prob deboost ~0.85x
  // (capping rarely engages for this distribution).
  const concepts = [
    { probability: 0.05 },
    { probability: 0.15 },
    { probability: 0.35 },
    { probability: 0.45 },
  ];
  const counts = [0, 0, 0, 0];
  const seed = mulberry32(42);
  const N = 1000;
  for (let i = 0; i < N; i++) {
    const { index } = pickWithAntiTypicality(concepts, 0.65, 1.6, seed);
    counts[index]++;
  }
  const rates = counts.map((c) => c / N);
  // Low-prob candidates should get 1.3-1.6x their raw probability in
  // actual pick-rate. The narrow band acknowledges monte-carlo noise
  // at N=1000 (std-dev ≈ sqrt(p(1-p)/N) ≈ 0.01 at p=0.07).
  const ratio005 = rates[0] / 0.05;
  const ratio015 = rates[1] / 0.15;
  assert.ok(ratio005 >= 1.3 && ratio005 <= 1.6,
    `p=0.05 boost ratio ${ratio005.toFixed(3)} outside [1.3, 1.6]`);
  assert.ok(ratio015 >= 1.3 && ratio015 <= 1.6,
    `p=0.15 boost ratio ${ratio015.toFixed(3)} outside [1.3, 1.6]`);
  // High-prob candidates should be deboosted (< 1.0)
  const ratio045 = rates[3] / 0.45;
  assert.ok(ratio045 < 1.0,
    `p=0.45 boost ratio ${ratio045.toFixed(3)} should be < 1.0`);
});

test('pickWithAntiTypicality: returns boostFactor matching pick-rate / raw-prob', () => {
  // Single deterministic call with rng = constant. Verify the
  // boostFactor in the return value equals the actual pick-rate /
  // raw-prob ratio for the chosen index.
  const concepts = [
    { probability: 0.10 },
    { probability: 0.20 },
    { probability: 0.30 },
    { probability: 0.40 },
  ];
  const result = pickWithAntiTypicality(concepts, 0.65, 1.6, () => 0.05);
  assert.ok(result.normalisedWeights.length === 4);
  const expectedFactor = result.normalisedWeights[result.index] / 0.10;
  // index 0 should be picked because rng = 0.05 < normalisedWeights[0]
  assert.equal(result.index, 0);
  assert.ok(Math.abs(result.boostFactor - expectedFactor) < 0.001,
    `boostFactor ${result.boostFactor} should match expected ${expectedFactor}`);
});

// ── Edge cases ─────────────────────────────────────────────────────────────

test('pickWithAntiTypicality: uniform probabilities → near-uniform pick rate', () => {
  const concepts = [
    { probability: 0.20 },
    { probability: 0.20 },
    { probability: 0.20 },
    { probability: 0.20 },
    { probability: 0.20 },
  ];
  const counts = [0, 0, 0, 0, 0];
  const seed = mulberry32(7);
  const N = 5000;
  for (let i = 0; i < N; i++) {
    const { index } = pickWithAntiTypicality(concepts, 0.65, 1.6, seed);
    counts[index]++;
  }
  for (const c of counts) {
    const rate = c / N;
    assert.ok(rate >= 0.16 && rate <= 0.24,
      `uniform pick rate ${rate.toFixed(3)} outside [0.16, 0.24]`);
  }
});

test('pickWithAntiTypicality: single candidate at probability=1 → boost cap engages', () => {
  // One candidate dominates; boost cap means it cannot be picked more
  // than 1.0x (it already gets picked 100% of the time anyway, so the
  // "cap engaging" is the deboost cap on the others).
  const concepts = [
    { probability: 1.0 },
    { probability: 0.0 },
    { probability: 0.0 },
  ];
  const result = pickWithAntiTypicality(concepts, 0.65, 1.6, () => 0.5);
  // probability=1 candidate is the only viable pick
  assert.equal(result.index, 0);
  // Pick-rate cannot exceed 1.0 (and boostFactor on a probability-1
  // candidate is necessarily ≤ 1, since pick-rate is also ≤ 1).
  assert.ok(result.boostFactor <= 1.0,
    `boostFactor ${result.boostFactor} should be <= 1.0 for p=1 candidate`);
  // The probability=0 entries get weight 0 (unpickable)
  assert.equal(result.normalisedWeights[1], 0);
  assert.equal(result.normalisedWeights[2], 0);
});

test('pickWithAntiTypicality: extremely low prob caps at boostCap', () => {
  // A 0.001 candidate vs four 0.249975 candidates. Without a cap, the
  // raw boost would be huge (0.001^0.35 / 0.001 ≈ 100x). The cap holds
  // the actual pick-rate boost at boostCap = 1.6.
  const concepts = [
    { probability: 0.001 },
    { probability: 0.249975 },
    { probability: 0.249975 },
    { probability: 0.249975 },
    { probability: 0.249975 },
  ];
  const counts = new Array(5).fill(0);
  const seed = mulberry32(99);
  const N = 5000;
  for (let i = 0; i < N; i++) {
    const { index } = pickWithAntiTypicality(concepts, 0.65, 1.6, seed);
    counts[index]++;
  }
  const lowProbRate = counts[0] / N;
  // Capped pick-rate ≤ 0.001 * 1.6 = 0.0016. Allow monte-carlo wiggle
  // room: rate ≤ 0.005 at N=5000 (events at p=0.0016 have stddev
  // ≈ 0.00056, so the upper bound stays well under 0.005).
  assert.ok(lowProbRate <= 0.005,
    `low-prob pick rate ${lowProbRate.toFixed(4)} exceeds capped expectation`);
});

test('pickWithAntiTypicality: throws on empty array', () => {
  assert.throws(() => pickWithAntiTypicality([]), /empty concepts/);
});

// ── Internal helpers ───────────────────────────────────────────────────────

test('_internals.tokenize splits on word boundaries', () => {
  const set = _internals.tokenize('Minimal Card With Subtle-Motion');
  assert.ok(set.has('minimal'));
  assert.ok(set.has('card'));
  assert.ok(set.has('with'));
  assert.ok(set.has('subtle'));
  assert.ok(set.has('motion'));
});

test('_internals.jaccard: identical sets → 1, disjoint → 0', () => {
  const a = new Set(['a', 'b', 'c']);
  const b = new Set(['a', 'b', 'c']);
  const c = new Set(['x', 'y', 'z']);
  assert.equal(_internals.jaccard(a, b), 1);
  assert.equal(_internals.jaccard(a, c), 0);
});

// ── Test helper: deterministic RNG (Mulberry32) ────────────────────────────
//
// Math.random can't be seeded; the monte-carlo tests need reproducibility
// for stable CI. Mulberry32 is a 32-bit RNG that's fine for test purposes
// (not crypto-grade, not statistically perfect, but uniform enough to
// validate boost-factor bands at N=1000-5000).
function mulberry32(seed) {
  let state = seed >>> 0;
  return function rng() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
