// Run: node --test hooks/scripts/lib/photo/__tests__/from-photo-pipeline.test.mjs
//
// Sprint 18 Task 35.4 — From-photo pipeline orchestrator.
// Tests use the `_deps` injection seam on runPhotoInferencePipeline so we can
// stub extract-palette, clip-classifier, and edge-detect without spinning up
// sharp / @xenova/transformers. The seam exists specifically for this
// purpose; production callers don't pass it.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  runPhotoInferencePipeline,
  combineStylePool,
} from '../from-photo-pipeline.mjs';

// ── Fixtures ────────────────────────────────────────────────────────────────

const FAKE_BUFFER = Buffer.from('fake-image-bytes');

function fakePaletteResult({
  withCachedBuffer = true,
  temperature = 'warm',
  saturation = 0.45,
  paletteMethod = 'node-vibrant',
} = {}) {
  return {
    source: {
      kind: 'path',
      original: '/tmp/test.jpg',
      sha256: 'abc123',
      cached_at_path: '/nonexistent/test.bin', // unreal — buffer comes from cached_buffer below
    },
    palette: {
      vibrant: { l: 0.7, c: 0.15, h: 30, hex_fallback: '#ff7733' },
      light_vibrant: { l: 0.85, c: 0.08, h: 40, hex_fallback: '#ffaa88' },
      dark_vibrant: { l: 0.4, c: 0.12, h: 25, hex_fallback: '#aa3311' },
      muted: { l: 0.5, c: 0.04, h: 50, hex_fallback: '#998877' },
      dark_muted: { l: 0.3, c: 0.03, h: 60, hex_fallback: '#665544' },
    },
    temperature,
    mean_saturation: saturation,
    source_meta: {
      dimensions: { width: 800, height: 600, original: { width: 1600, height: 1200 } },
      palette_method: paletteMethod,
      // Test seam: pipeline reads source_meta.cached_buffer when present so
      // we don't have to populate the actual cache file on disk.
      cached_buffer: withCachedBuffer ? FAKE_BUFFER : undefined,
    },
  };
}

function fakeMoodResult({
  method = 'heuristic',
  topMoods = [
    { mood: 'warm-cozy-organic', confidence: 0.35, style_tags: ['cottagecore-tech', 'witchcore-ui'] },
    { mood: 'craft-handmade', confidence: 0.25, style_tags: ['cottagecore-tech', 'memphis'] },
    { mood: 'retro-nostalgic', confidence: 0.15, style_tags: ['y2k-futurism', 'vaporwave', 'frutiger-aero'] },
  ],
} = {}) {
  return { method, top: topMoods, all_scores: [] };
}

function fakeEdgesResult({ density = 0.18, motionTier = 2 } = {}) {
  return {
    edge_density: density,
    mean_magnitude: 42.5,
    motion_tier: motionTier,
  };
}

// ── Pipeline e2e (with mocked sub-modules) ──────────────────────────────────

test('pipeline e2e: returns full PhotoInferenceResult with all fields populated', async () => {
  let extractCalls = 0;
  let moodCalls = 0;
  let edgesCalls = 0;

  const result = await runPhotoInferencePipeline({
    source: '/tmp/test.jpg',
    projectRoot: '/tmp/project',
    brief: 'hero section for fintech',
    _deps: {
      extractPalette: async () => {
        extractCalls++;
        return fakePaletteResult();
      },
      classifyMood: async () => {
        moodCalls++;
        return fakeMoodResult();
      },
      detectEdges: async () => {
        edgesCalls++;
        return fakeEdgesResult();
      },
    },
  });

  // Every sub-module called exactly once.
  assert.equal(extractCalls, 1);
  assert.equal(moodCalls, 1);
  assert.equal(edgesCalls, 1);

  // Top-level shape.
  assert.equal(result.source, '/tmp/test.jpg');
  assert.equal(result.temperature, 'warm');
  assert.equal(result.saturation_mean, 0.45);
  assert.equal(result.palette_method, 'node-vibrant');
  assert.equal(result.motion_tier, 2);

  // Palette flows through verbatim.
  assert.equal(result.palette.vibrant.h, 30);
  assert.equal(result.palette_override.vibrant.h, 30);

  // Mood + edges nested correctly.
  assert.equal(result.mood.method, 'heuristic');
  assert.equal(result.mood.top.length, 3);
  assert.equal(result.edges.edge_density, 0.18);

  // biased_style_pool = union of top-3 style_tags, dedup, insertion-ordered.
  assert.deepEqual(result.biased_style_pool, [
    'cottagecore-tech',
    'witchcore-ui',
    'memphis',
    'y2k-futurism',
    'vaporwave',
    'frutiger-aero',
  ]);

  // Meta.
  assert.equal(result.meta.brief, 'hero section for fintech');
  assert.equal(result.meta.sha256, 'abc123');
  assert.equal(result.meta.cached_at, '/nonexistent/test.bin');
  assert.ok(typeof result.meta.pipeline_duration_ms === 'number');
  assert.ok(result.meta.pipeline_duration_ms >= 0);
});

// ── Failure paths — graceful degradation ────────────────────────────────────

test('pipeline e2e: failed mood classification → mood.top = [] (graceful)', async () => {
  const result = await runPhotoInferencePipeline({
    source: '/tmp/x.jpg',
    projectRoot: '/tmp/project',
    _deps: {
      extractPalette: async () => fakePaletteResult(),
      classifyMood: async () => { throw new Error('CLIP model not found'); },
      detectEdges: async () => fakeEdgesResult(),
    },
  });

  assert.equal(result.mood.method, 'error');
  assert.equal(result.mood.error, 'CLIP model not found');
  assert.deepEqual(result.mood.top, []);
  // biased_style_pool should be empty when mood fails — context-inference
  // then treats it as "no mood signal" and falls back to palette + edges.
  assert.deepEqual(result.biased_style_pool, []);
  // Edges + palette still flow through even when mood errors.
  assert.equal(result.motion_tier, 2);
  assert.equal(result.temperature, 'warm');
});

test('pipeline e2e: failed edge-detection → motion_tier defaults to 1 (Subtle)', async () => {
  const result = await runPhotoInferencePipeline({
    source: '/tmp/x.jpg',
    projectRoot: '/tmp/project',
    _deps: {
      extractPalette: async () => fakePaletteResult(),
      classifyMood: async () => fakeMoodResult(),
      detectEdges: async () => { throw new Error('sharp missing'); },
    },
  });

  assert.equal(result.motion_tier, 1, 'falls back to Subtle (1)');
  assert.equal(result.edges.error, 'sharp missing');
  assert.equal(result.edges.edge_density, 0);
  // Mood + palette unaffected by edge failure.
  assert.equal(result.mood.method, 'heuristic');
  assert.equal(result.palette.vibrant.h, 30);
});

test('pipeline e2e: missing cached buffer → mood + edges get safe defaults', async () => {
  // Simulate a palette result that doesn't expose its buffer (e.g. cache
  // file gone missing between writeFileSync and readFileSync).
  const paletteWithoutBuffer = fakePaletteResult({ withCachedBuffer: false });
  paletteWithoutBuffer.source.cached_at_path = '/definitely/does/not/exist.bin';

  const result = await runPhotoInferencePipeline({
    source: '/tmp/x.jpg',
    projectRoot: '/tmp/project',
    _deps: {
      extractPalette: async () => paletteWithoutBuffer,
      classifyMood: async ({ imageBuffer, forceHeuristic }) => {
        // Pipeline must invoke heuristic-only when buffer is unavailable.
        assert.equal(imageBuffer, null);
        assert.equal(forceHeuristic, true);
        return { method: 'heuristic', top: [], all_scores: [] };
      },
      detectEdges: async () => { throw new Error('should not be called without buffer'); },
    },
  });

  // Mood degrades to heuristic-no-buffer; edges short-circuits to defaults.
  assert.equal(result.mood.method, 'heuristic');
  assert.equal(result.edges.error, 'no_image_buffer');
  assert.equal(result.motion_tier, 1);
});

// ── combineStylePool — pure function ────────────────────────────────────────

test('combineStylePool: union of top-3 style_tags, dedup preserved insertion order', () => {
  const mood = {
    method: 'clip',
    top: [
      { mood: 'a', confidence: 0.5, style_tags: ['x', 'y'] },
      { mood: 'b', confidence: 0.3, style_tags: ['y', 'z'] }, // y is dup
      { mood: 'c', confidence: 0.2, style_tags: ['w'] },
    ],
  };
  assert.deepEqual(combineStylePool(mood), ['x', 'y', 'z', 'w']);
});

test('combineStylePool: empty mood → empty pool', () => {
  assert.deepEqual(combineStylePool({ method: 'error', top: [] }), []);
  assert.deepEqual(combineStylePool(null), []);
  assert.deepEqual(combineStylePool(undefined), []);
});

test('combineStylePool: only takes top-3 even if more entries supplied', () => {
  const mood = {
    method: 'clip',
    top: [
      { mood: 'a', confidence: 0.5, style_tags: ['x'] },
      { mood: 'b', confidence: 0.3, style_tags: ['y'] },
      { mood: 'c', confidence: 0.2, style_tags: ['z'] },
      { mood: 'd', confidence: 0.1, style_tags: ['SHOULD_NOT_APPEAR'] },
    ],
  };
  const pool = combineStylePool(mood);
  assert.deepEqual(pool, ['x', 'y', 'z']);
  assert.ok(!pool.includes('SHOULD_NOT_APPEAR'));
});

test('combineStylePool: tolerates malformed entries (missing or non-array style_tags)', () => {
  const mood = {
    method: 'heuristic',
    top: [
      { mood: 'a', confidence: 0.5, style_tags: ['x'] },
      { mood: 'b', confidence: 0.3 }, // missing style_tags
      { mood: 'c', confidence: 0.2, style_tags: 'not-an-array' },
    ],
  };
  assert.deepEqual(combineStylePool(mood), ['x']);
});

// ── Argument validation ─────────────────────────────────────────────────────

test('runPhotoInferencePipeline: rejects when source is missing', async () => {
  await assert.rejects(
    () => runPhotoInferencePipeline({ projectRoot: '/tmp' }),
    /source.*required/,
  );
});

test('runPhotoInferencePipeline: rejects when projectRoot is missing', async () => {
  await assert.rejects(
    () => runPhotoInferencePipeline({ source: '/tmp/x.jpg' }),
    /projectRoot.*required/,
  );
});
