// Run: node --test hooks/scripts/lib/flow/__tests__/cross-screen-critique.test.mjs
//
// Sprint 22 Task 40.2 — cross-screen-critique.
// Validates: coherent flows score ≈ 10, intentionally-incoherent flows score
// lower with violations reported, state-pair tolerances respected (loading
// gets larger tolerance), top-3 drifts sorted DESC by overshoot.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  scoreCrossScreenConsistency,
  computeStateDrift,
  STATE_PAIR_TOLERANCES,
} from '../cross-screen-critique.mjs';

// ─── Fixtures ───────────────────────────────────────────────────────────────

// Coherent baseline: same palette, same motion+density+tone across all 5
// states. Should score at the top of the 0..10 range with zero violations.
function coherentStateData() {
  const palette = [
    { l: 0.72, c: 0.12, h: 220 },
    { l: 0.45, c: 0.08, h: 220 },
    { l: 0.95, c: 0.02, h: 220 },
  ];
  const tone = [0.5, 0.5, 0.5, 0.5];
  const base = {
    palette,
    motion_score: 5,
    density_score: 6,
    tone_embedding: tone,
  };
  return {
    list: { ...base, palette: clonePalette(palette) },
    detail: { ...base, palette: clonePalette(palette) },
    empty: { ...base, palette: clonePalette(palette) },
    error: { ...base, palette: clonePalette(palette) },
    loading: { ...base, palette: clonePalette(palette) },
  };
}

function clonePalette(p) {
  return p.map((c) => ({ ...c }));
}

// ─── computeStateDrift ──────────────────────────────────────────────────────

test('computeStateDrift returns 0-or-near-0 on every dim for identical inputs', () => {
  const data = {
    palette: [{ l: 0.7, c: 0.1, h: 220 }],
    motion_score: 5,
    density_score: 5,
    tone_embedding: [1, 0, 0],
  };
  const drift = computeStateDrift('list', 'detail', data, data);
  assert.equal(drift.palette, 0);
  assert.equal(drift.motion, 0);
  assert.equal(drift.density, 0);
  // 1 - cosine(v,v) for nonzero v should be 0 (within float epsilon).
  assert.ok(Math.abs(drift.tone) < 1e-9);
});

test('computeStateDrift: motion-score difference is normalised by /10', () => {
  const a = {
    palette: [],
    motion_score: 3,
    density_score: 0,
    tone_embedding: [1, 0],
  };
  const b = {
    palette: [],
    motion_score: 8,
    density_score: 0,
    tone_embedding: [1, 0],
  };
  const drift = computeStateDrift('list', 'loading', a, b);
  assert.equal(drift.motion, 0.5); // |3-8|/10
});

test('computeStateDrift: tone-embedding orthogonal vectors → tone drift 1.0', () => {
  const a = {
    palette: [],
    motion_score: 0,
    density_score: 0,
    tone_embedding: [1, 0, 0],
  };
  const b = {
    palette: [],
    motion_score: 0,
    density_score: 0,
    tone_embedding: [0, 1, 0],
  };
  const drift = computeStateDrift('a', 'b', a, b);
  assert.ok(Math.abs(drift.tone - 1) < 1e-9);
});

// ─── scoreCrossScreenConsistency: coherent flow ─────────────────────────────

test('scoreCrossScreenConsistency: 5 coherent states → score === 10, no violations', () => {
  const result = scoreCrossScreenConsistency(coherentStateData());
  assert.equal(result.score, 10);
  assert.equal(result.violations.length, 0);
  assert.equal(result.top_drifts.length, 0);
  // C(5,2) = 10 pairs reported.
  assert.equal(result.pairs.length, 10);
});

test('scoreCrossScreenConsistency: every pair entry carries drift + tolerances', () => {
  const result = scoreCrossScreenConsistency(coherentStateData());
  for (const p of result.pairs) {
    assert.ok(p.pair.includes('-'));
    for (const dim of ['palette', 'motion', 'density', 'tone']) {
      assert.ok(typeof p.drift[dim] === 'number');
      assert.ok(typeof p.tolerances[dim] === 'number');
    }
  }
});

// ─── Intentionally incoherent: list vs detail palette mismatch ──────────────

test('scoreCrossScreenConsistency: list+detail palette mismatch → score lower, palette violation reported', () => {
  const data = coherentStateData();
  // Replace detail's palette with a dramatically different hue so the mean
  // ΔE comfortably overshoots the list-detail palette tolerance (0.05).
  data.detail.palette = [
    { l: 0.20, c: 0.30, h: 30 },
    { l: 0.50, c: 0.25, h: 30 },
  ];
  const result = scoreCrossScreenConsistency(data);
  assert.ok(result.score < 10, `expected score < 10, got ${result.score}`);
  const paletteViolations = result.violations.filter((v) => v.dim === 'palette');
  assert.ok(paletteViolations.length > 0, 'expected at least one palette violation');
  // The list-detail pair specifically should be flagged.
  const listDetail = paletteViolations.find(
    (v) => v.pair === 'list-detail' || v.pair === 'detail-list',
  );
  assert.ok(listDetail, 'list-detail palette violation should be reported');
});

// ─── State-typ-aware tolerances: loading gets relaxed motion ────────────────

test('STATE_PAIR_TOLERANCES: loading-pairs have larger motion tolerance than list-detail', () => {
  // Loading is intentionally more muted — the table must reflect that.
  assert.ok(
    STATE_PAIR_TOLERANCES['list-loading'].motion >
      STATE_PAIR_TOLERANCES['list-detail'].motion,
    'list-loading.motion should be more permissive than list-detail.motion',
  );
  assert.ok(
    STATE_PAIR_TOLERANCES['detail-loading'].motion >
      STATE_PAIR_TOLERANCES['list-detail'].motion,
  );
});

test('scoreCrossScreenConsistency: same motion-drift between list-detail (strict) and list-loading (lax) flags only list-detail', () => {
  const data = coherentStateData();
  // Set detail and loading both to motion_score=8 while list stays at 5.
  // |5 - 8| / 10 = 0.30 drift on both pairs.
  // list-detail.motion tolerance = 0.10 → violation.
  // list-loading.motion tolerance = 0.30 → exactly at boundary, NOT > 0.30,
  // so NO violation (tolerance is exclusive on overshoot).
  data.detail.motion_score = 8;
  data.loading.motion_score = 8;
  const result = scoreCrossScreenConsistency(data);

  const listDetailMotion = result.violations.find(
    (v) =>
      (v.pair === 'list-detail' || v.pair === 'detail-list') && v.dim === 'motion',
  );
  const listLoadingMotion = result.violations.find(
    (v) =>
      (v.pair === 'list-loading' || v.pair === 'loading-list') && v.dim === 'motion',
  );

  assert.ok(listDetailMotion, 'list-detail motion drift should be flagged');
  assert.equal(
    listLoadingMotion,
    undefined,
    'list-loading motion drift at tolerance-boundary should NOT flag',
  );
});

test('scoreCrossScreenConsistency: density drift on empty-state legitimately tolerated', () => {
  const data = coherentStateData();
  // Empty has lower density (illustration + headline + CTA). list-empty
  // density tolerance is 0.30, so a 0.25-drift should not violate.
  data.list.density_score = 7;
  data.empty.density_score = 4.5; // diff = 2.5, /10 = 0.25 < 0.30
  const result = scoreCrossScreenConsistency(data);
  const listEmptyDensity = result.violations.find(
    (v) =>
      (v.pair === 'list-empty' || v.pair === 'empty-list') && v.dim === 'density',
  );
  assert.equal(
    listEmptyDensity,
    undefined,
    'empty-state lower-density should not flag as drift',
  );
});

// ─── Top-3 drifts sorted DESC by overshoot ──────────────────────────────────

test('scoreCrossScreenConsistency: top_drifts sorted DESC by (drift - tolerance)', () => {
  const data = coherentStateData();
  // Inject several violations of varying severity:
  //   - list.detail palette mismatch (huge overshoot)
  //   - empty.error palette mismatch (medium overshoot)
  //   - list.error tone drift (small overshoot)
  data.detail.palette = [
    { l: 0.10, c: 0.35, h: 30 },
    { l: 0.10, c: 0.35, h: 30 },
  ];
  data.error.palette = [
    { l: 0.50, c: 0.20, h: 60 },
    { l: 0.50, c: 0.20, h: 60 },
  ];
  // Tone drift list↔error: rotate embedding partially.
  data.error.tone_embedding = [0, 1, 0, 0]; // orthogonal to list's [0.5, 0.5, 0.5, 0.5]

  const result = scoreCrossScreenConsistency(data);
  assert.ok(result.top_drifts.length > 0);
  assert.ok(result.top_drifts.length <= 3);

  // Validate sort order: each entry's overshoot >= next entry's overshoot.
  for (let i = 0; i < result.top_drifts.length - 1; i++) {
    const a = result.top_drifts[i].drift - result.top_drifts[i].tolerance;
    const b = result.top_drifts[i + 1].drift - result.top_drifts[i + 1].tolerance;
    assert.ok(a >= b, `top_drifts not sorted DESC: ${a} should be >= ${b}`);
  }
});

test('scoreCrossScreenConsistency: violation count drives score linearly (penalty 1.5)', () => {
  const data = coherentStateData();
  data.detail.palette = [
    { l: 0.10, c: 0.35, h: 30 },
    { l: 0.10, c: 0.35, h: 30 },
  ];
  const result = scoreCrossScreenConsistency(data);
  // score = max(0, 10 - violations * 1.5)
  const expected = Math.max(0, 10 - result.violations.length * 1.5);
  assert.equal(result.score, expected);
});

test('scoreCrossScreenConsistency: score floors at 0, never goes negative', () => {
  // Build a deliberately catastrophic incoherent flow: every state has a
  // wildly different palette + motion + density + tone.
  const blow = (h) => [
    { l: 0.1, c: 0.35, h },
    { l: 0.9, c: 0.30, h: (h + 90) % 360 },
  ];
  const stateData = {
    list: {
      palette: blow(0),
      motion_score: 0,
      density_score: 0,
      tone_embedding: [1, 0, 0],
    },
    detail: {
      palette: blow(60),
      motion_score: 10,
      density_score: 10,
      tone_embedding: [0, 1, 0],
    },
    empty: {
      palette: blow(120),
      motion_score: 5,
      density_score: 5,
      tone_embedding: [0, 0, 1],
    },
    error: {
      palette: blow(180),
      motion_score: 2,
      density_score: 8,
      tone_embedding: [-1, 0, 0],
    },
    loading: {
      palette: blow(240),
      motion_score: 8,
      density_score: 2,
      tone_embedding: [0, -1, 0],
    },
  };
  const result = scoreCrossScreenConsistency(stateData);
  assert.ok(result.score >= 0, 'score must not be negative');
  assert.ok(result.violations.length > 0);
});
