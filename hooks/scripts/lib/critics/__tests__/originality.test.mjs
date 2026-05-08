// originality.test.mjs — Sprint 16 Task 31.3.
//
// Tests the originality critic helper: round-gating, cosine math,
// empty-history fallback (with and without global priors file),
// top-3 collisions ordering.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  readRecentAccepted,
  cosineSimilarity8D,
  calculateOriginalityScore,
  loadGlobalPriors,
} from '../originality.mjs';

// ── Cosine helper ───────────────────────────────────────────────────────────

test('cosineSimilarity8D: identical vectors → 1.0', () => {
  const v = {
    hierarchy: 8, layout: 7, typography: 9, contrast: 6,
    accessibility: 8, distinctiveness: 7, brief_conformance: 8, motion_readiness: 5,
  };
  const cos = cosineSimilarity8D(v, v);
  assert.ok(cos > 0.999 && cos <= 1.0, `expected ~1.0 got ${cos}`);
});

test('cosineSimilarity8D: orthogonal vectors → 0', () => {
  const a = {
    hierarchy: 10, layout: 0, typography: 0, contrast: 0,
    accessibility: 0, distinctiveness: 0, brief_conformance: 0, motion_readiness: 0,
  };
  const b = {
    hierarchy: 0, layout: 10, typography: 0, contrast: 0,
    accessibility: 0, distinctiveness: 0, brief_conformance: 0, motion_readiness: 0,
  };
  assert.equal(cosineSimilarity8D(a, b), 0);
});

test('cosineSimilarity8D: zero vector → 0 (no NaN)', () => {
  const a = {
    hierarchy: 5, layout: 5, typography: 5, contrast: 5,
    accessibility: 5, distinctiveness: 5, brief_conformance: 5, motion_readiness: 5,
  };
  const zero = {
    hierarchy: 0, layout: 0, typography: 0, contrast: 0,
    accessibility: 0, distinctiveness: 0, brief_conformance: 0, motion_readiness: 0,
  };
  assert.equal(cosineSimilarity8D(a, zero), 0);
});

test('cosineSimilarity8D: missing keys default to 0', () => {
  const partial = { hierarchy: 8, layout: 7 };
  const full = {
    hierarchy: 8, layout: 7, typography: 0, contrast: 0,
    accessibility: 0, distinctiveness: 0, brief_conformance: 0, motion_readiness: 0,
  };
  // Cosine of partial vs full should be ~1.0 because partial's missing keys
  // are treated as 0, identical to the explicit zeros in `full`.
  const cos = cosineSimilarity8D(partial, full);
  assert.ok(cos > 0.999, `expected ~1.0 got ${cos}`);
});

test('cosineSimilarity8D: invalid input → 0', () => {
  assert.equal(cosineSimilarity8D(null, {}), 0);
  assert.equal(cosineSimilarity8D({}, null), 0);
  assert.equal(cosineSimilarity8D('foo', 'bar'), 0);
});

// ── Round-gating ────────────────────────────────────────────────────────────

test('round 1 returns score: null with reason round_1_no_history', () => {
  const out = calculateOriginalityScore({
    round: 1,
    currentEmbedding: { hierarchy: 8 },
    history: [],
  });
  assert.equal(out.score, null);
  assert.equal(out.reason, 'round_1_no_history');
});

test('non-integer round → null', () => {
  const out = calculateOriginalityScore({
    round: 'two',
    currentEmbedding: {},
    history: [],
  });
  assert.equal(out.score, null);
});

// ── Empty-history fallback ──────────────────────────────────────────────────

test('round 2 + empty history + no priors path → score 7 with fallback-unavailable', () => {
  const out = calculateOriginalityScore({
    round: 2,
    currentEmbedding: { hierarchy: 8 },
    history: [],
    priorsPath: '/nonexistent/path/priors.json',
  });
  assert.equal(out.score, 7);
  assert.equal(out.method, 'fallback-unavailable');
});

test('round 2 + empty history + valid priors file → fallback score derived from priors', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'orig-priors-'));
  const priorsPath = join(tmp, 'priors.json');
  writeFileSync(priorsPath, JSON.stringify({
    version: '1.0.0',
    entries: [
      {
        generation_id: 'p1',
        embedding_8d: {
          hierarchy: 1, layout: 1, typography: 1, contrast: 1,
          accessibility: 1, distinctiveness: 1, brief_conformance: 1, motion_readiness: 1,
        },
        last_seen: '2026-01-01T00:00:00Z',
      },
      {
        generation_id: 'p2',
        embedding_8d: {
          hierarchy: 9, layout: 0, typography: 0, contrast: 0,
          accessibility: 0, distinctiveness: 0, brief_conformance: 0, motion_readiness: 0,
        },
        last_seen: '2026-01-02T00:00:00Z',
      },
    ],
  }));

  // Generation embedding identical to p1 → max similarity ≈ 1.0 → score ≈ 0.
  const out = calculateOriginalityScore({
    round: 2,
    currentEmbedding: {
      hierarchy: 1, layout: 1, typography: 1, contrast: 1,
      accessibility: 1, distinctiveness: 1, brief_conformance: 1, motion_readiness: 1,
    },
    history: [],
    priorsPath,
  });

  assert.equal(out.method, 'fallback');
  assert.ok(out.score !== null && out.score < 1, `expected near-0 score got ${out.score}`);
  assert.equal(out.top_collisions.length, 2);
  assert.equal(out.top_collisions[0].generation_id, 'p1');

  rmSync(tmp, { recursive: true, force: true });
});

// ── Round 2 with substantive user history ───────────────────────────────────

test('round 2 + history contains near-duplicate (cosine ~0.95) → score < 4', () => {
  const current = {
    hierarchy: 8, layout: 7, typography: 9, contrast: 6,
    accessibility: 8, distinctiveness: 7, brief_conformance: 8, motion_readiness: 5,
  };
  // Create 5 history entries; first one is near-identical (small jitter).
  const history = [
    {
      generation_id: 'h1',
      embedding_8d: {
        hierarchy: 8.1, layout: 7.0, typography: 9.0, contrast: 6.1,
        accessibility: 8.0, distinctiveness: 7.0, brief_conformance: 8.0, motion_readiness: 5.0,
      },
      last_seen: '2026-04-15T00:00:00Z',
    },
    {
      generation_id: 'h2',
      embedding_8d: {
        hierarchy: 3, layout: 9, typography: 4, contrast: 8,
        accessibility: 5, distinctiveness: 9, brief_conformance: 4, motion_readiness: 9,
      },
      last_seen: '2026-04-14T00:00:00Z',
    },
    {
      generation_id: 'h3',
      embedding_8d: {
        hierarchy: 5, layout: 5, typography: 5, contrast: 5,
        accessibility: 5, distinctiveness: 5, brief_conformance: 5, motion_readiness: 5,
      },
      last_seen: '2026-04-13T00:00:00Z',
    },
    {
      generation_id: 'h4',
      embedding_8d: {
        hierarchy: 6, layout: 4, typography: 7, contrast: 8,
        accessibility: 6, distinctiveness: 8, brief_conformance: 5, motion_readiness: 6,
      },
      last_seen: '2026-04-12T00:00:00Z',
    },
    {
      generation_id: 'h5',
      embedding_8d: {
        hierarchy: 4, layout: 8, typography: 3, contrast: 7,
        accessibility: 4, distinctiveness: 7, brief_conformance: 6, motion_readiness: 8,
      },
      last_seen: '2026-04-11T00:00:00Z',
    },
  ];

  const out = calculateOriginalityScore({
    round: 2,
    currentEmbedding: current,
    history,
  });

  assert.equal(out.method, 'embedding-8d');
  assert.ok(out.score !== null && out.score < 4,
    `expected score < 4 (near-duplicate of h1) got ${out.score}`);
  assert.equal(out.top_collisions[0].generation_id, 'h1',
    'h1 should be top collision');
  assert.ok(out.top_collisions[0].similarity > 0.99,
    `expected similarity > 0.99 got ${out.top_collisions[0].similarity}`);
});

test('round 2 + distinct generation (low max similarity) → score > 7', () => {
  // Current vector is highly skewed toward distinctiveness/motion.
  const current = {
    hierarchy: 0, layout: 0, typography: 0, contrast: 0,
    accessibility: 0, distinctiveness: 0, brief_conformance: 0, motion_readiness: 10,
  };
  // History vectors all skewed toward hierarchy/typography — orthogonal axes.
  const history = Array.from({ length: 5 }, (_, i) => ({
    generation_id: `h${i}`,
    embedding_8d: {
      hierarchy: 8 + i * 0.1, layout: 7, typography: 8, contrast: 7,
      accessibility: 8, distinctiveness: 0, brief_conformance: 6, motion_readiness: 0,
    },
    last_seen: `2026-04-${10 + i}T00:00:00Z`,
  }));

  const out = calculateOriginalityScore({
    round: 2,
    currentEmbedding: current,
    history,
  });

  // motion_readiness-only vs hierarchy/typography-heavy → cosine should
  // be near 0 (the only shared positive component is motion=0 in history).
  assert.ok(out.score !== null && out.score > 7,
    `expected score > 7 (distinct generation) got ${out.score}`);
});

// ── Top-3 collisions ordering ───────────────────────────────────────────────

test('top_collisions: rapporterade i sorted DESC order', () => {
  const current = {
    hierarchy: 5, layout: 5, typography: 5, contrast: 5,
    accessibility: 5, distinctiveness: 5, brief_conformance: 5, motion_readiness: 5,
  };
  const history = [
    {
      generation_id: 'low',
      embedding_8d: {
        hierarchy: 1, layout: 0, typography: 0, contrast: 0,
        accessibility: 0, distinctiveness: 0, brief_conformance: 0, motion_readiness: 0,
      },
    },
    {
      generation_id: 'high',
      embedding_8d: {
        hierarchy: 5, layout: 5, typography: 5, contrast: 5,
        accessibility: 5, distinctiveness: 5, brief_conformance: 5, motion_readiness: 5,
      },
    },
    {
      generation_id: 'mid',
      embedding_8d: {
        hierarchy: 5, layout: 5, typography: 5, contrast: 5,
        accessibility: 0, distinctiveness: 0, brief_conformance: 0, motion_readiness: 0,
      },
    },
    {
      generation_id: 'lower',
      embedding_8d: {
        hierarchy: 0, layout: 1, typography: 0, contrast: 0,
        accessibility: 0, distinctiveness: 0, brief_conformance: 0, motion_readiness: 0,
      },
    },
    {
      generation_id: 'midlow',
      embedding_8d: {
        hierarchy: 3, layout: 3, typography: 0, contrast: 0,
        accessibility: 0, distinctiveness: 0, brief_conformance: 0, motion_readiness: 0,
      },
    },
  ];

  const out = calculateOriginalityScore({
    round: 2,
    currentEmbedding: current,
    history,
  });

  assert.equal(out.top_collisions.length, 3);
  assert.equal(out.top_collisions[0].generation_id, 'high', 'highest sim should be first');
  assert.ok(
    out.top_collisions[0].similarity >= out.top_collisions[1].similarity,
    'collisions must be in DESC similarity order',
  );
  assert.ok(
    out.top_collisions[1].similarity >= out.top_collisions[2].similarity,
    'collisions must be in DESC similarity order',
  );
});

// ── readRecentAccepted ──────────────────────────────────────────────────────

test('readRecentAccepted: filters non-accepted facts and sorts DESC by last_seen', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'orig-facts-'));
  const factsPath = join(tmp, 'facts.jsonl');
  const lines = [
    { signal: { type: 'git_kept', direction: 'positive' }, status: 'active', last_seen: '2026-04-10T00:00:00Z', generation_id: 'g1', embedding_8d: { hierarchy: 5 } },
    { signal: { type: 'rejected', direction: 'negative' }, status: 'active', last_seen: '2026-04-12T00:00:00Z', generation_id: 'g2', embedding_8d: { hierarchy: 4 } },
    { signal: { type: 'picked', direction: 'positive' }, status: 'permanent', last_seen: '2026-04-15T00:00:00Z', generation_id: 'g3', embedding_8d: { hierarchy: 6 } },
    { signal: { type: 'accepted', direction: 'positive' }, status: 'decayed', last_seen: '2026-04-01T00:00:00Z', generation_id: 'g4', embedding_8d: { hierarchy: 3 } }, // decayed → skipped
    { signal: { type: 'picked', direction: 'positive' }, status: 'active', last_seen: '2026-04-09T00:00:00Z', generation_id: 'g5' }, // missing embedding → skipped
  ];
  writeFileSync(factsPath, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');

  const out = readRecentAccepted(factsPath, 10);
  assert.equal(out.length, 2);
  assert.equal(out[0].generation_id, 'g3', 'g3 has latest last_seen');
  assert.equal(out[1].generation_id, 'g1');

  rmSync(tmp, { recursive: true, force: true });
});

test('readRecentAccepted: missing file → empty array', () => {
  const out = readRecentAccepted('/nonexistent/facts.jsonl', 10);
  assert.deepEqual(out, []);
});

test('readRecentAccepted: corrupt lines are skipped, valid ones returned', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'orig-corrupt-'));
  const factsPath = join(tmp, 'facts.jsonl');
  const body = [
    JSON.stringify({ signal: { type: 'git_kept', direction: 'positive' }, status: 'active', last_seen: '2026-04-10T00:00:00Z', generation_id: 'g1', embedding_8d: { hierarchy: 5 } }),
    '{ this is not valid json',
    JSON.stringify({ signal: { type: 'picked', direction: 'positive' }, status: 'active', last_seen: '2026-04-12T00:00:00Z', generation_id: 'g2', embedding_8d: { hierarchy: 6 } }),
  ].join('\n');
  writeFileSync(factsPath, body);

  const out = readRecentAccepted(factsPath, 10);
  assert.equal(out.length, 2);

  rmSync(tmp, { recursive: true, force: true });
});

test('readRecentAccepted: topN cap respected', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'orig-topn-'));
  const factsPath = join(tmp, 'facts.jsonl');
  const lines = Array.from({ length: 15 }, (_, i) => ({
    signal: { type: 'git_kept', direction: 'positive' },
    status: 'active',
    last_seen: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    generation_id: `g${i}`,
    embedding_8d: { hierarchy: i },
  }));
  writeFileSync(factsPath, lines.map((l) => JSON.stringify(l)).join('\n') + '\n');

  const out = readRecentAccepted(factsPath, 5);
  assert.equal(out.length, 5);
  // Most recent first (last_seen 2026-04-15 → g14).
  assert.equal(out[0].generation_id, 'g14');
  assert.equal(out[4].generation_id, 'g10');

  rmSync(tmp, { recursive: true, force: true });
});

// ── loadGlobalPriors ────────────────────────────────────────────────────────

test('loadGlobalPriors: returns null on missing file', () => {
  assert.equal(loadGlobalPriors('/nonexistent/priors.json'), null);
});

test('loadGlobalPriors: returns parsed object on valid file', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'orig-priors-load-'));
  const path = join(tmp, 'priors.json');
  writeFileSync(path, JSON.stringify({
    version: '1.0.0',
    entries: [{ generation_id: 'gp', embedding_8d: { hierarchy: 5 }, last_seen: '2026-01-01T00:00:00Z' }],
  }));
  const out = loadGlobalPriors(path);
  assert.ok(out);
  assert.equal(out.version, '1.0.0');
  assert.equal(out.entries.length, 1);
  rmSync(tmp, { recursive: true, force: true });
});

test('loadGlobalPriors: returns null on malformed JSON', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'orig-priors-bad-'));
  const path = join(tmp, 'priors.json');
  writeFileSync(path, '{ bad json');
  assert.equal(loadGlobalPriors(path), null);
  rmSync(tmp, { recursive: true, force: true });
});

// ── Acceptance criteria from sprint-doc ─────────────────────────────────────

test('AC test 1: cosine ~0.95 → originality_vs_history ≈ 0.5', () => {
  const current = {
    hierarchy: 8, layout: 7, typography: 9, contrast: 6,
    accessibility: 8, distinctiveness: 7, brief_conformance: 8, motion_readiness: 5,
  };
  // Construct history entry whose cosine vs current is ~0.95.
  // Scale current by ~1.05 in some dims and 0.95 in others to perturb angle.
  const close = {
    hierarchy: 9, layout: 8, typography: 9, contrast: 5,
    accessibility: 7, distinctiveness: 8, brief_conformance: 7, motion_readiness: 6,
  };
  const cos = cosineSimilarity8D(current, close);
  // Should be in the high-similarity band; verify, then run originality.
  assert.ok(cos > 0.9, `setup cos must be > 0.9 — got ${cos}`);

  const history = Array.from({ length: 5 }, (_, i) => ({
    generation_id: i === 0 ? 'near' : `far${i}`,
    embedding_8d: i === 0 ? close : {
      hierarchy: 1, layout: 1, typography: 1, contrast: 1,
      accessibility: 1, distinctiveness: 9, brief_conformance: 1, motion_readiness: 9,
    },
    last_seen: `2026-04-${10 + i}T00:00:00Z`,
  }));

  const out = calculateOriginalityScore({
    round: 2,
    currentEmbedding: current,
    history,
  });

  // 10 - 0.95 * 10 = 0.5 (with small slop because real cos isn't exactly 0.95).
  assert.ok(out.score < 1.5, `AC1: score should be near 0.5 — got ${out.score}`);
});

test('AC test 2: cosine ≤ 0.4 → originality_vs_history ≥ 6', () => {
  const current = {
    hierarchy: 0, layout: 0, typography: 0, contrast: 0,
    accessibility: 0, distinctiveness: 10, brief_conformance: 0, motion_readiness: 0,
  };
  const history = Array.from({ length: 5 }, (_, i) => ({
    generation_id: `h${i}`,
    embedding_8d: {
      hierarchy: 8, layout: 8, typography: 8, contrast: 8,
      accessibility: 8, distinctiveness: 0, brief_conformance: 8, motion_readiness: 0,
    },
    last_seen: `2026-04-${10 + i}T00:00:00Z`,
  }));

  // Cosine of (0,0,0,0,0,10,0,0) vs (8,8,8,8,8,0,8,0) is 0 — totally
  // orthogonal — score should land at 10.
  const out = calculateOriginalityScore({
    round: 2,
    currentEmbedding: current,
    history,
  });

  assert.ok(out.score >= 6, `AC2: score should be ≥ 6 — got ${out.score}`);
});

test('AC test 3: round 1 hoppar över originality, returnerar null', () => {
  const out = calculateOriginalityScore({
    round: 1,
    currentEmbedding: { hierarchy: 5 },
    history: [{ generation_id: 'x', embedding_8d: { hierarchy: 5 } }],
  });
  assert.equal(out.score, null);
});

test('AC test 4: round 2 + tom facts.jsonl → fallback fungerar', () => {
  // No history at all; no priors path → score 7 fallback-unavailable
  const out1 = calculateOriginalityScore({
    round: 2,
    currentEmbedding: { hierarchy: 5 },
    history: [],
    priorsPath: '/nonexistent/path.json',
  });
  assert.equal(out1.score, 7);
  assert.equal(out1.method, 'fallback-unavailable');

  // No history but priors file exists → fallback method used
  const tmp = mkdtempSync(join(tmpdir(), 'orig-ac4-'));
  const priorsPath = join(tmp, 'priors.json');
  writeFileSync(priorsPath, JSON.stringify({
    version: '1.0.0',
    entries: [
      {
        generation_id: 'gp1',
        embedding_8d: {
          hierarchy: 9, layout: 9, typography: 9, contrast: 9,
          accessibility: 9, distinctiveness: 9, brief_conformance: 9, motion_readiness: 9,
        },
        last_seen: '2026-01-01T00:00:00Z',
      },
    ],
  }));
  const out2 = calculateOriginalityScore({
    round: 2,
    currentEmbedding: { hierarchy: 5 },
    history: [],
    priorsPath,
  });
  assert.equal(out2.method, 'fallback');
  assert.ok(out2.score !== null);
  rmSync(tmp, { recursive: true, force: true });
});
