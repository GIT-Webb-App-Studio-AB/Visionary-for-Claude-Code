// Run: node --test hooks/scripts/lib/audio/__tests__/from-track-pipeline.test.mjs
//
// Sprint 19 Task 36.4 — End-to-end pipeline tests with sub-modules mocked
// via the `_deps` injection seam (same pattern as from-photo-pipeline tests).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

import { runFromTrackPipeline, detectSourceType } from '../from-track-pipeline.mjs';

const __filename = fileURLToPath(import.meta.url);
const FIXTURES = resolve(dirname(__filename), '__fixtures__');
const TRACK_FIXTURE = JSON.parse(
  readFileSync(resolve(FIXTURES, 'spotify-track.json'), 'utf8'),
);

// ── detectSourceType ────────────────────────────────────────────────────────

test('detectSourceType: spotify URL → "spotify"', () => {
  assert.equal(detectSourceType('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'), 'spotify');
  assert.equal(detectSourceType('https://open.spotify.com/intl-en/track/4iV5W9uYEdYUVa79Axb7Rh'), 'spotify');
  assert.equal(detectSourceType('spotify:track:4iV5W9uYEdYUVa79Axb7Rh'), 'spotify');
  assert.equal(detectSourceType('https://spotify.link/abc123'), 'spotify');
});

test('detectSourceType: bare 22-char base62 ID → "spotify"', () => {
  assert.equal(detectSourceType('4iV5W9uYEdYUVa79Axb7Rh'), 'spotify');
});

test('detectSourceType: filesystem path → "audio-file"', () => {
  assert.equal(detectSourceType('./moodboards/track.mp3'), 'audio-file');
  assert.equal(detectSourceType('/home/me/music/song.flac'), 'audio-file');
  assert.equal(detectSourceType('C:\\Users\\me\\Music\\song.wav'), 'audio-file');
  assert.equal(detectSourceType('song.mp3'), 'audio-file');
});

// ── Spotify pipeline (mocked) ───────────────────────────────────────────────

test('pipeline (spotify): returns full AudioInferenceResult with russell + design + meta', async () => {
  let featuresCalls = 0;
  let metaCalls = 0;
  const result = await runFromTrackPipeline({
    source: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
    projectRoot: '/tmp/project',
    brief: 'landing for indie label',
    _deps: {
      fetchAudioFeatures: async () => { featuresCalls++; return TRACK_FIXTURE; },
      fetchTrackMeta: async () => {
        metaCalls++;
        return { name: 'Test Track', artists: [{ name: 'Test Artist' }] };
      },
    },
  });

  assert.equal(featuresCalls, 1);
  assert.equal(metaCalls, 1);

  // Top-level shape
  assert.equal(result.source_type, 'spotify');
  assert.equal(result.source, 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh');
  assert.equal(result.meta.method, 'spotify');
  assert.equal(result.meta.brief, 'landing for indie label');
  assert.ok(result.meta.pipeline_duration_ms >= 0);

  // Features echoed verbatim
  assert.equal(result.features.id, TRACK_FIXTURE.id);
  assert.equal(result.features.tempo, TRACK_FIXTURE.tempo);

  // Russell coords are in [0,1]
  assert.ok(result.russell.valence >= 0 && result.russell.valence <= 1);
  assert.ok(result.russell.arousal >= 0 && result.russell.arousal <= 1);
  assert.ok(['Q1', 'Q2', 'Q3', 'Q4'].includes(result.russell.quadrant));
  assert.ok(Array.isArray(result.russell.primary_styles));
  assert.ok(result.russell.primary_styles.length > 0);

  // Design parameters present
  assert.ok(result.design.animation_baseline_ms >= 200);
  assert.ok(result.design.animation_baseline_ms <= 2000);
  assert.ok(['serif-humanist', 'mixed', 'geometric-sans'].includes(result.design.typography_axis));
  assert.ok(['subtle', 'moderate', 'expressive'].includes(result.design.motion_amplitude));
  assert.ok(['sparse', 'balanced', 'dense'].includes(result.design.density));

  // Motion override built from track tempo
  assert.equal(result.design.motion_override.bpm, TRACK_FIXTURE.tempo);
  assert.ok(typeof result.design.motion_override.scale_factor === 'number');

  // biased_style_pool is a non-empty union of primary + secondary
  assert.ok(Array.isArray(result.biased_style_pool));
  assert.ok(result.biased_style_pool.length > 0);

  // Track meta passed through
  assert.equal(result.track_meta.name, 'Test Track');
  assert.equal(result.track_meta.artists[0].name, 'Test Artist');
});

test('pipeline (spotify): swallows track-meta errors gracefully', async () => {
  const result = await runFromTrackPipeline({
    source: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
    projectRoot: '/tmp',
    _deps: {
      fetchAudioFeatures: async () => TRACK_FIXTURE,
      fetchTrackMeta: async () => { throw new Error('API down'); },
    },
  });
  assert.equal(result.track_meta, null, 'meta failure must not break the pipeline');
  assert.equal(result.features.id, TRACK_FIXTURE.id);
});

test('pipeline (spotify): features fetch failure is fatal with clear error', async () => {
  await assert.rejects(
    () => runFromTrackPipeline({
      source: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
      projectRoot: '/tmp',
      _deps: {
        fetchAudioFeatures: async () => { throw new Error('credentials file not found'); },
        fetchTrackMeta: async () => null,
      },
    }),
    /from-track-pipeline.*spotify.*credentials file not found/,
  );
});

// ── Audio-file pipeline (mocked) ────────────────────────────────────────────

test('pipeline (audio-file): synthesises features from analyzeAudioFile result', async () => {
  // Create a temp file so source-existence check (if any) doesn't trip.
  const tmpDir = mkdtempSync(join(tmpdir(), 'visionary-track-test-'));
  const fakePath = join(tmpDir, 'fake.mp3');
  writeFileSync(fakePath, 'fake mp3 bytes');

  try {
    const result = await runFromTrackPipeline({
      source: fakePath,
      projectRoot: tmpDir,
      _deps: {
        analyzeAudioFile: async () => ({
          method: 'heuristic-pcm',
          source_path: fakePath,
          valence: 0.3,
          energy: 0.2,
          danceability: 0.25,
          acousticness: 0.85,
          instrumentalness: 0.95,
          tempo: 70,
          confidence: 0.5,
        }),
      },
    });

    assert.equal(result.source_type, 'audio-file');
    assert.equal(result.meta.method, 'audio-file');

    // Low-V + low-A → Q3 quadrant
    assert.equal(result.russell.quadrant, 'Q3');

    // 70 BPM → 60_000 / 70 ≈ 857 ms
    assert.equal(result.design.animation_baseline_ms, Math.round(60000 / 70));

    // High acousticness → serif typography
    assert.equal(result.design.typography_axis, 'serif-humanist');

    // High instrumentalness → sparse density
    assert.equal(result.design.density, 'sparse');

    // No track meta available for audio files
    assert.equal(result.track_meta, null);
  } finally {
    try { unlinkSync(fakePath); } catch { /* best-effort */ }
  }
});

test('pipeline (audio-file): graceful neutral when analyzer returns "unavailable"', async () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'visionary-track-test-'));
  const fakePath = join(tmpDir, 'fake.mp3');
  writeFileSync(fakePath, 'x');

  try {
    const result = await runFromTrackPipeline({
      source: fakePath,
      projectRoot: tmpDir,
      _deps: {
        analyzeAudioFile: async () => ({
          method: 'unavailable',
          source_path: fakePath,
          reason: 'no analyzer available',
          valence: 0.5,
          energy: 0.5,
          danceability: 0.5,
          acousticness: 0.5,
          instrumentalness: 0.5,
          tempo: null,
          confidence: 0,
        }),
      },
    });

    // Neutral coords still produce a valid quadrant (function is total).
    assert.ok(['Q1', 'Q2', 'Q3', 'Q4'].includes(result.russell.quadrant));
    // No tempo signal → motion override stays at the 120 BPM reference baseline.
    assert.equal(result.design.animation_baseline_ms, 500);
  } finally {
    try { unlinkSync(fakePath); } catch { /* best-effort */ }
  }
});

test('pipeline (audio-file): analyzer failure is fatal with clear error', async () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'visionary-track-test-'));
  const fakePath = join(tmpDir, 'fake.mp3');
  writeFileSync(fakePath, 'x');

  try {
    await assert.rejects(
      () => runFromTrackPipeline({
        source: fakePath,
        projectRoot: tmpDir,
        _deps: {
          analyzeAudioFile: async () => { throw new Error('decoder missing'); },
        },
      }),
      /from-track-pipeline.*audio-file.*decoder missing/,
    );
  } finally {
    try { unlinkSync(fakePath); } catch { /* best-effort */ }
  }
});

// ── Spotify vs audio-file: similar but not identical ───────────────────────

test('pipeline: Spotify and audio-file paths produce comparable but not identical results', async () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'visionary-track-test-'));
  const fakePath = join(tmpDir, 'fake.mp3');
  writeFileSync(fakePath, 'x');

  try {
    const spotify = await runFromTrackPipeline({
      source: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
      projectRoot: tmpDir,
      _deps: {
        fetchAudioFeatures: async () => TRACK_FIXTURE,
        fetchTrackMeta: async () => null,
      },
    });

    // Audio file simulating CLAP analysis of the same track — close but
    // intentionally noisy on every signal so we catch a "literally identical"
    // bug if mocking layers ever collapse.
    const local = await runFromTrackPipeline({
      source: fakePath,
      projectRoot: tmpDir,
      _deps: {
        analyzeAudioFile: async () => ({
          method: 'clap',
          source_path: fakePath,
          valence: TRACK_FIXTURE.valence + 0.05,
          energy: TRACK_FIXTURE.energy + 0.04,
          danceability: TRACK_FIXTURE.danceability - 0.03,
          acousticness: TRACK_FIXTURE.acousticness - 0.02,
          instrumentalness: TRACK_FIXTURE.instrumentalness + 0.05,
          tempo: TRACK_FIXTURE.tempo + 2,
        }),
      },
    });

    // Numerically close (within 0.15 on each axis) but distinct outputs.
    // Quadrant equality is NOT asserted — fixture sits on a Russell border
    // and small noise can flip Q1↔Q4 or Q2↔Q3, which is the whole reason
    // the AC says "similar but not identical".
    const dV = Math.abs(spotify.russell.valence - local.russell.valence);
    const dA = Math.abs(spotify.russell.arousal - local.russell.arousal);
    assert.ok(dV < 0.15, `valence drift ${dV.toFixed(3)} should stay under 0.15`);
    assert.ok(dA < 0.15, `arousal drift ${dA.toFixed(3)} should stay under 0.15`);
    assert.notEqual(spotify.russell.valence, local.russell.valence);
    assert.notEqual(spotify.design.animation_baseline_ms, local.design.animation_baseline_ms);
  } finally {
    try { unlinkSync(fakePath); } catch { /* best-effort */ }
  }
});

// ── Argument validation ────────────────────────────────────────────────────

test('runFromTrackPipeline: rejects when source missing', async () => {
  await assert.rejects(
    () => runFromTrackPipeline({ projectRoot: '/tmp' }),
    /source.*required/,
  );
});

test('runFromTrackPipeline: rejects when projectRoot missing', async () => {
  await assert.rejects(
    () => runFromTrackPipeline({ source: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh' }),
    /projectRoot.*required/,
  );
});
