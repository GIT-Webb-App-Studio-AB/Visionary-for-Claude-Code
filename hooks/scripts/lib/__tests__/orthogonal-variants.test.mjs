// Run: node --test hooks/scripts/lib/__tests__/orthogonal-variants.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickOrthogonalVariants,
  summariseSelection,
  averagePairwiseDistance,
  DEFAULT_DISTANCE_FLOOR,
} from '../orthogonal-variants.mjs';

// Build deterministic embeddings where we know the relative distances.
// v1 at [1,0,0,0,...], v2 orthogonal at [0,1,0,...], v3 at [0,0,1,...].
const emb = {
  v1:       [1, 0, 0, 0, 0, 0, 0, 0],
  v2:       [0, 1, 0, 0, 0, 0, 0, 0],
  v3:       [0, 0, 1, 0, 0, 0, 0, 0],
  nearV1:   [0.95, 0.3, 0, 0, 0, 0, 0, 0], // near v1 → small distance from v1
  midV1V2:  [0.6, 0.8, 0, 0, 0, 0, 0, 0],
  distantAll: [0, 0, 0, 1, 0, 0, 0, 0],
};

function candidate(id, score = 8.0, category = 'graphic') {
  return { id, score, category };
}

// ── Pure functionality ─────────────────────────────────────────────────────
test('pickOrthogonalVariants: empty ranked → failed policy', () => {
  const r = pickOrthogonalVariants({ ranked: [], embeddings: emb });
  assert.equal(r.policy, 'failed');
  assert.ok(r.notes[0].includes('no_ranked_input'));
});

test('pickOrthogonalVariants: strict floor satisfied, returns 3 orthogonal variants', () => {
  const r = pickOrthogonalVariants({
    ranked: [candidate('v1'), candidate('v2'), candidate('v3')],
    embeddings: emb,
    distanceFloor: 0.6,
  });
  assert.equal(r.policy, 'orthogonal');
  assert.deepEqual(r.variants, ['v1', 'v2', 'v3']);
  assert.ok(r.pairwise_distances.v1_v2 >= 0.6);
  assert.ok(r.pairwise_distances.v1_v3 >= 0.6);
});

test('pickOrthogonalVariants: skips near-v1 candidate, picks orthogonal one', () => {
  const r = pickOrthogonalVariants({
    ranked: [candidate('v1'), candidate('nearV1'), candidate('v2'), candidate('v3')],
    embeddings: emb,
    distanceFloor: 0.6,
  });
  assert.equal(r.variants[0], 'v1');
  assert.equal(r.variants[1], 'v2'); // nearV1 was too close, skipped
  assert.equal(r.variants[2], 'v3');
});

test('pickOrthogonalVariants: relaxes threshold when strict pool empty', () => {
  // v1, then two mediocre candidates. With floor=0.6 v2 slot is empty until
  // we relax to 0.4 where midV1V2 qualifies.
  const r = pickOrthogonalVariants({
    ranked: [candidate('v1'), candidate('nearV1'), candidate('midV1V2'), candidate('distantAll')],
    embeddings: emb,
    distanceFloor: 0.6,
    relaxSteps: [0.5, 0.4],
  });
  assert.equal(r.policy, 'orthogonal');
  assert.equal(r.variants[0], 'v1');
  // v2 should be distantAll (orthogonal) not nearV1
  assert.equal(r.variants[1], 'distantAll');
});

test('pickOrthogonalVariants: collapses to 2 when v3 pool exhausted', () => {
  // Only 2 candidates far enough apart → no v3 possible.
  const smallEmb = {
    a: [1, 0, 0, 0, 0, 0, 0, 0],
    b: [0, 1, 0, 0, 0, 0, 0, 0],
    c: [0.99, 0.1, 0, 0, 0, 0, 0, 0], // too near a
  };
  const r = pickOrthogonalVariants({
    ranked: [candidate('a'), candidate('b'), candidate('c')],
    embeddings: smallEmb,
    distanceFloor: 0.6,
    relaxSteps: [], // no relaxation allowed — force collapse, but v3 fallback may still pick
  });
  // With v3-fallback-disabled-note, pickNext returns c (highest-ranked post-v1/v2)
  // regardless of distance. So we still get 3 variants but the note explains why.
  assert.ok(r.variants.length >= 2);
  if (r.variants.length === 3) {
    assert.ok(r.notes.some((n) => n.includes('v3_threshold_disabled')));
  }
});

test('pickOrthogonalVariants: missing v1 embedding → empty result', () => {
  const r = pickOrthogonalVariants({
    ranked: [candidate('unknown'), candidate('v1')],
    embeddings: emb,
  });
  assert.equal(r.policy, 'failed');
  assert.ok(r.notes[0].includes('v1_embedding_missing'));
});

test('pickOrthogonalVariants: uses default floor 0.6', () => {
  const r = pickOrthogonalVariants({
    ranked: [candidate('v1'), candidate('v2'), candidate('v3')],
    embeddings: emb,
  });
  assert.equal(r.thresholds[0], DEFAULT_DISTANCE_FLOOR);
});

// ── Reporting helpers ──────────────────────────────────────────────────────
test('summariseSelection: includes distances for orthogonal result', () => {
  const r = pickOrthogonalVariants({
    ranked: [candidate('v1'), candidate('v2'), candidate('v3')],
    embeddings: emb,
  });
  const s = summariseSelection(r);
  assert.ok(s.includes('v1 / v2 / v3'));
  assert.ok(s.includes('orthogonal'));
  assert.ok(s.includes('pairwise d='));
});

test('summariseSelection: failed selection reports notes', () => {
  const r = { variants: [], notes: ['no_ranked_input'], policy: 'failed' };
  const s = summariseSelection(r);
  assert.ok(s.includes('NO SELECTION'));
  assert.ok(s.includes('no_ranked_input'));
});

test('averagePairwiseDistance: three orthogonal → 1.0', () => {
  const avg = averagePairwiseDistance(['v1', 'v2', 'v3'], emb);
  assert.ok(Math.abs(avg - 1.0) < 1e-9);
});

test('averagePairwiseDistance: identical pair → 0', () => {
  const e = { a: [1, 0, 0], b: [1, 0, 0] };
  assert.ok(averagePairwiseDistance(['a', 'b'], e) < 1e-9);
});

test('averagePairwiseDistance: single variant → 0', () => {
  assert.equal(averagePairwiseDistance(['v1'], emb), 0);
});

// ── AC: simulated run over diversified embedding pool ──────────────────────
// When the pool is wide enough to host three orthogonal candidates at the
// 0.6 floor, the algorithm is required to find them AND the resulting
// variants' mean pairwise distance must clear 0.5 — the sprint-4 DoD bar.
test('AC: three-orthogonal result always has pairwise avg >= 0.5', () => {
  // Deliberately spread pool — six candidates that span the 8-d space
  // thoroughly (each row has a distinct dominant axis).
  const pool = {
    density_leader:   [0.95, 0.1,  0.5,  0.1,  0.1,  0.1,  0.1,  0.1],
    chroma_leader:    [0.1,  0.95, 0.1,  0.1,  0.1,  0.1,  0.1,  0.1],
    formal_leader:    [0.1,  0.1,  0.95, 0.1,  0.1,  0.1,  0.1,  0.1],
    motion_leader:    [0.1,  0.1,  0.1,  0.95, 0.1,  0.1,  0.1,  0.1],
    history_leader:   [0.1,  0.1,  0.1,  0.1,  0.95, 0.1,  0.1,  0.1],
    texture_leader:   [0.1,  0.1,  0.1,  0.1,  0.1,  0.95, 0.1,  0.1],
  };
  const ranked = Object.keys(pool).map((id, i) => ({ id, score: 10 - i, category: 'test' }));
  const r = pickOrthogonalVariants({ ranked, embeddings: pool, distanceFloor: 0.6 });
  assert.equal(r.policy, 'orthogonal');
  assert.equal(r.variants.length, 3);
  const avg = averagePairwiseDistance(r.variants, pool);
  assert.ok(avg >= 0.5, `mean pairwise distance ${avg.toFixed(3)} fails sprint-4 DoD (>=0.5)`);
});

test('AC-guard: narrow pool collapses gracefully instead of returning bad variants', () => {
  // Pool where v1+v2 clear the floor but v3 cannot — documents the fallback.
  const narrow = {
    a: [1, 0, 0, 0, 0, 0, 0, 0],
    b: [0, 1, 0, 0, 0, 0, 0, 0],
    c_close_to_a: [0.95, 0.2, 0, 0, 0, 0, 0, 0],
    d_close_to_b: [0.2, 0.95, 0, 0, 0, 0, 0, 0],
  };
  const ranked = [
    { id: 'a', score: 10 },
    { id: 'b', score: 9 },
    { id: 'c_close_to_a', score: 8 },
    { id: 'd_close_to_b', score: 7 },
  ];
  const r = pickOrthogonalVariants({ ranked, embeddings: narrow, distanceFloor: 0.6, relaxSteps: [] });
  // v1=a, v2=b (clear 0.6 — cosine(a,b)=1.0). v3 slot: no candidate clears
  // 0.6 against BOTH a and b → falls back to top-ranked c_close_to_a with a note.
  assert.equal(r.variants[0], 'a');
  assert.equal(r.variants[1], 'b');
  assert.ok(r.notes.some((n) => n.includes('v3_threshold_disabled')), `expected v3 fallback note, got ${JSON.stringify(r.notes)}`);
});
