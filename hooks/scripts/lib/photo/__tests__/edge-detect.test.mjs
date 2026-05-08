// Run: node --test hooks/scripts/lib/photo/__tests__/edge-detect.test.mjs
//
// Sprint 18 Task 35.3 — Edge-density → motion-tier mapping.
// Covers: pure bucket function (deterministic, dependency-free) plus a
// best-effort sharp integration test that gracefully skips when sharp is
// unavailable on the host (CI / fresh checkout).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { detectEdges, edgeDensityToMotionTier } from '../edge-detect.mjs';

// ── edgeDensityToMotionTier — interior bucket values ────────────────────────

test('edgeDensityToMotionTier: 0.02 → 0 (Static, well below 5%)', () => {
  assert.equal(edgeDensityToMotionTier(0.02), 0);
});

test('edgeDensityToMotionTier: 0.10 → 1 (Subtle, mid-band 5-15%)', () => {
  assert.equal(edgeDensityToMotionTier(0.10), 1);
});

test('edgeDensityToMotionTier: 0.20 → 2 (Expressive, mid-band 15-30%)', () => {
  assert.equal(edgeDensityToMotionTier(0.20), 2);
});

test('edgeDensityToMotionTier: 0.40 → 3 (Kinetic, well above 30%)', () => {
  assert.equal(edgeDensityToMotionTier(0.40), 3);
});

// ── Boundary values — lower-inclusive, upper-exclusive ──────────────────────
// The sprint spec defines the buckets as [0.05, 0.15), [0.15, 0.30), [0.30, ∞).

test('edgeDensityToMotionTier: 0.05 → 1 (boundary: 0.05 is start of Subtle)', () => {
  assert.equal(edgeDensityToMotionTier(0.05), 1);
});

test('edgeDensityToMotionTier: 0.15 → 2 (boundary: 0.15 is start of Expressive)', () => {
  assert.equal(edgeDensityToMotionTier(0.15), 2);
});

test('edgeDensityToMotionTier: 0.30 → 3 (boundary: 0.30 is start of Kinetic)', () => {
  assert.equal(edgeDensityToMotionTier(0.30), 3);
});

// Just-below boundaries — guard against floating-point creep.

test('edgeDensityToMotionTier: 0.0499 → 0 (just below Subtle)', () => {
  assert.equal(edgeDensityToMotionTier(0.0499), 0);
});

test('edgeDensityToMotionTier: 0.1499 → 1 (just below Expressive)', () => {
  assert.equal(edgeDensityToMotionTier(0.1499), 1);
});

test('edgeDensityToMotionTier: 0.2999 → 2 (just below Kinetic)', () => {
  assert.equal(edgeDensityToMotionTier(0.2999), 2);
});

// ── Edge cases — degenerate inputs ──────────────────────────────────────────

test('edgeDensityToMotionTier: 0 → 0 (empty image)', () => {
  assert.equal(edgeDensityToMotionTier(0), 0);
});

test('edgeDensityToMotionTier: 1 → 3 (every pixel high-gradient)', () => {
  assert.equal(edgeDensityToMotionTier(1), 3);
});

test('edgeDensityToMotionTier: NaN → 0 (defensive)', () => {
  assert.equal(edgeDensityToMotionTier(NaN), 0);
});

test('edgeDensityToMotionTier: undefined → 0 (defensive)', () => {
  assert.equal(edgeDensityToMotionTier(undefined), 0);
});

// ── detectEdges — sharp integration (best-effort) ───────────────────────────
// We test against a real PNG buffer when sharp is available. On CI / fresh
// checkout where sharp isn't installed, the test logs a skip-warning and
// passes — installing sharp is not the test runner's responsibility, and we
// still want green on machines that lack the optional dep.

test('detectEdges: throws clear error when sharp is missing OR returns valid metrics', async () => {
  // Build a tiny 8x8 checkerboard PNG buffer (high-frequency input → expect
  // many edges → motion_tier ≥ 1 in a working pipeline).
  let sharp;
  try {
    ({ default: sharp } = await import('sharp'));
  } catch {
    // Sharp not installed — verify detectEdges raises the expected install
    // instruction. A bogus buffer is fine; the error fires before parse.
    await assert.rejects(
      () => detectEdges({ imageBuffer: Buffer.from('fake-png-data') }),
      /sharp is required/,
    );
    console.warn(
      '[edge-detect.test] sharp not installed; skipped real-image integration test',
    );
    return;
  }

  // Generate an 8x8 chess-board PNG: alternating black/white pixels create
  // maximum edge density. Use raw → sharp → png pipeline for determinism.
  const pixels = Buffer.alloc(8 * 8 * 3);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const i = (y * 8 + x) * 3;
      const v = ((x + y) % 2) === 0 ? 0 : 255;
      pixels[i] = v;
      pixels[i + 1] = v;
      pixels[i + 2] = v;
    }
  }
  const png = await sharp(pixels, { raw: { width: 8, height: 8, channels: 3 } })
    .png()
    .toBuffer();

  const result = await detectEdges({ imageBuffer: png });

  assert.ok(typeof result.edge_density === 'number', 'edge_density is number');
  assert.ok(result.edge_density >= 0 && result.edge_density <= 1, 'edge_density in [0,1]');
  assert.ok(typeof result.mean_magnitude === 'number', 'mean_magnitude is number');
  assert.ok([0, 1, 2, 3].includes(result.motion_tier), 'motion_tier in {0,1,2,3}');
});

test('detectEdges: rejects when imageBuffer is missing', async () => {
  await assert.rejects(
    () => detectEdges({}),
    /imageBuffer.*required/,
  );
});

test('detectEdges: rejects when imageBuffer is not a Buffer', async () => {
  await assert.rejects(
    () => detectEdges({ imageBuffer: 'not-a-buffer' }),
    /imageBuffer.*required/,
  );
});
