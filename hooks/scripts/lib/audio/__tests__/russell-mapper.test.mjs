// Run: node --test hooks/scripts/lib/audio/__tests__/russell-mapper.test.mjs
//
// Sprint 19 Task 36.2 — Russell-mapper tests.
// Validates that 10 fixture tracks across distinct genres land in
// logically-grouped Russell quadrants and produce sensible secondary
// design parameters (typography axis, motion amplitude, density).
// Also pins the tempo → animation-baseline-ms mapping at the canonical
// 60/120/180 BPM points and verifies clamping at the extremes.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  mapFeaturesToRussell,
  mapTypographyAxis,
  mapMotionAmplitude,
  mapDensity,
} from '../russell-mapper.mjs';

import { getQuadrant } from '../../mood-mapper.mjs';

// 10 representative tracks, one per target genre. Numbers approximate real
// Spotify-features distributions for archetypal tracks of each style. Exact
// values matter less than the resulting quadrant grouping.
const FIXTURES = [
  // genre, expected quadrant, features
  { genre: 'electronic-edm',   eq: 'Q1', f: { valence: 0.78, energy: 0.92, danceability: 0.88, tempo: 128, acousticness: 0.02, instrumentalness: 0.45 } },
  { genre: 'pop',              eq: 'Q1', f: { valence: 0.72, energy: 0.65, danceability: 0.72, tempo: 110, acousticness: 0.18, instrumentalness: 0.02 } },
  { genre: 'afrobeat',         eq: 'Q1', f: { valence: 0.82, energy: 0.78, danceability: 0.86, tempo: 116, acousticness: 0.30, instrumentalness: 0.40 } },
  { genre: 'metal',            eq: 'Q2', f: { valence: 0.18, energy: 0.95, danceability: 0.34, tempo: 165, acousticness: 0.02, instrumentalness: 0.20 } },
  { genre: 'hip-hop-aggressive', eq: 'Q2', f: { valence: 0.32, energy: 0.85, danceability: 0.78, tempo: 140, acousticness: 0.04, instrumentalness: 0.02 } },
  { genre: 'ambient',          eq: 'Q3', f: { valence: 0.42, energy: 0.10, danceability: 0.18, tempo: 70,  acousticness: 0.65, instrumentalness: 0.92 } },
  { genre: 'classical',        eq: 'Q3', f: { valence: 0.48, energy: 0.30, danceability: 0.20, tempo: 80,  acousticness: 0.95, instrumentalness: 0.92 } },
  { genre: 'folk',             eq: 'Q4', f: { valence: 0.62, energy: 0.30, danceability: 0.42, tempo: 92,  acousticness: 0.92, instrumentalness: 0.08 } },
  { genre: 'jazz',             eq: 'Q4', f: { valence: 0.58, energy: 0.42, danceability: 0.55, tempo: 102, acousticness: 0.62, instrumentalness: 0.55 } },
  { genre: 'post-rock',        eq: 'Q3', f: { valence: 0.40, energy: 0.45, danceability: 0.28, tempo: 95,  acousticness: 0.45, instrumentalness: 0.85 } },
];

// ── Quadrant grouping ──────────────────────────────────────────────────────

test('10 fixture tracks land in their expected Russell quadrants', () => {
  const errors = [];
  for (const tk of FIXTURES) {
    const r = mapFeaturesToRussell(tk.f);
    const q = getQuadrant(r.valence, r.arousal);
    if (q !== tk.eq) {
      errors.push(`${tk.genre}: expected ${tk.eq}, got ${q} (v=${r.valence.toFixed(2)}, a=${r.arousal.toFixed(2)})`);
    }
  }
  assert.equal(errors.length, 0, `Quadrant mismatches:\n  ${errors.join('\n  ')}`);
});

test('quadrant centroids: high-V/high-A genres separate from low-V/low-A genres', () => {
  // Pull the high-energy "Q1" group and the calm "Q3" group, then check
  // their centroids are at least 0.4 apart in the V-A plane.
  const q1 = FIXTURES.filter((t) => t.eq === 'Q1').map((t) => mapFeaturesToRussell(t.f));
  const q3 = FIXTURES.filter((t) => t.eq === 'Q3').map((t) => mapFeaturesToRussell(t.f));
  const c1 = centroid(q1);
  const c3 = centroid(q3);
  const dist = Math.hypot(c1.v - c3.v, c1.a - c3.a);
  assert.ok(dist > 0.4, `Q1↔Q3 centroid distance was only ${dist.toFixed(3)}; expected > 0.4`);
});

// ── Tempo → animation-baseline-ms ──────────────────────────────────────────

test('tempo mapping: 60 BPM → 1000 ms baseline', () => {
  const r = mapFeaturesToRussell({ valence: 0.5, energy: 0.5, tempo: 60 });
  assert.equal(r.animation_baseline_ms, 1000);
});

test('tempo mapping: 120 BPM → 500 ms baseline', () => {
  const r = mapFeaturesToRussell({ valence: 0.5, energy: 0.5, tempo: 120 });
  assert.equal(r.animation_baseline_ms, 500);
});

test('tempo mapping: 180 BPM → 333 ms baseline', () => {
  const r = mapFeaturesToRussell({ valence: 0.5, energy: 0.5, tempo: 180 });
  assert.equal(r.animation_baseline_ms, 333);
});

test('tempo mapping: clamps at floor (240 BPM should not go below 250 ms)', () => {
  const r = mapFeaturesToRussell({ valence: 0.5, energy: 0.5, tempo: 240 });
  // 60_000 / 240 = 250 ms, which is above the 200 ms floor.
  assert.equal(r.animation_baseline_ms, 250);
});

test('tempo mapping: clamps at ceiling (30 BPM clamps to 2000 ms)', () => {
  const r = mapFeaturesToRussell({ valence: 0.5, energy: 0.5, tempo: 30 });
  // 60_000 / 30 = 2000 ms, exactly at ceiling.
  assert.equal(r.animation_baseline_ms, 2000);
});

test('tempo mapping: very slow tempo (10 BPM) clamps to 2000 ms ceiling', () => {
  const r = mapFeaturesToRussell({ valence: 0.5, energy: 0.5, tempo: 10 });
  assert.equal(r.animation_baseline_ms, 2000);
});

test('tempo mapping: very fast tempo (400 BPM) clamps to 200 ms floor', () => {
  const r = mapFeaturesToRussell({ valence: 0.5, energy: 0.5, tempo: 400 });
  assert.equal(r.animation_baseline_ms, 200);
});

// ── Secondary design parameters ────────────────────────────────────────────

test('typography axis: high acousticness → serif-humanist; low → geometric-sans', () => {
  assert.equal(mapTypographyAxis(0.9), 'serif-humanist');
  assert.equal(mapTypographyAxis(0.5), 'mixed');
  assert.equal(mapTypographyAxis(0.1), 'geometric-sans');
});

test('motion amplitude: danceability bands → subtle/moderate/expressive', () => {
  assert.equal(mapMotionAmplitude(0.2), 'subtle');
  assert.equal(mapMotionAmplitude(0.5), 'moderate');
  assert.equal(mapMotionAmplitude(0.85), 'expressive');
});

test('density: instrumentalness bands → dense/balanced/sparse', () => {
  assert.equal(mapDensity(0.05), 'dense');
  assert.equal(mapDensity(0.4), 'balanced');
  assert.equal(mapDensity(0.85), 'sparse');
});

test('classical track has serif typography + sparse density (image-rich) + subtle motion', () => {
  const r = mapFeaturesToRussell(FIXTURES.find((t) => t.genre === 'classical').f);
  assert.equal(r.typography_axis, 'serif-humanist');
  assert.equal(r.density, 'sparse');
  assert.equal(r.motion_amplitude, 'subtle');
});

test('EDM track has geometric-sans typography + expressive motion', () => {
  const r = mapFeaturesToRussell(FIXTURES.find((t) => t.genre === 'electronic-edm').f);
  assert.equal(r.typography_axis, 'geometric-sans');
  assert.equal(r.motion_amplitude, 'expressive');
});

test('folk track has serif typography + dense (vocal-rich) text orientation', () => {
  const r = mapFeaturesToRussell(FIXTURES.find((t) => t.genre === 'folk').f);
  assert.equal(r.typography_axis, 'serif-humanist');
  assert.equal(r.density, 'dense');
});

// ── Defensive defaults ──────────────────────────────────────────────────────

test('mapFeaturesToRussell: tolerates missing/partial features with neutral defaults', () => {
  const r = mapFeaturesToRussell({});
  assert.equal(r.valence, 0.5);
  assert.equal(r.arousal, 0.5);
  // 120 BPM default → 500 ms baseline.
  assert.equal(r.animation_baseline_ms, 500);
  assert.equal(r.typography_axis, 'mixed');
  assert.equal(r.motion_amplitude, 'moderate');
});

test('mapFeaturesToRussell: clamps out-of-range inputs to [0,1]', () => {
  const r = mapFeaturesToRussell({ valence: 1.5, energy: -0.2, tempo: 120, acousticness: 99 });
  assert.equal(r.valence, 1);
  // energy clamped to 0, tempo 120 contributes 0.5*0.3 = 0.15 → arousal 0.15
  assert.ok(r.arousal >= 0 && r.arousal <= 1);
});

test('mapFeaturesToRussell: NaN/Infinity tempo falls back to 120 BPM neutral baseline', () => {
  const r = mapFeaturesToRussell({ valence: 0.5, energy: 0.5, tempo: Number.NaN });
  assert.equal(r.animation_baseline_ms, 500);
});

test('mapFeaturesToRussell: source_features echo for receipt rendering', () => {
  const r = mapFeaturesToRussell({
    valence: 0.7, energy: 0.6, tempo: 100,
    acousticness: 0.4, danceability: 0.8, instrumentalness: 0.1,
    speechiness: 0.05, // extra fields ignored, not echoed
  });
  assert.equal(r.source_features.valence, 0.7);
  assert.equal(r.source_features.energy, 0.6);
  assert.equal(r.source_features.tempo, 100);
  assert.equal(r.source_features.danceability, 0.8);
});

// ── Helpers ────────────────────────────────────────────────────────────────

function centroid(results) {
  const v = results.reduce((s, r) => s + r.valence, 0) / results.length;
  const a = results.reduce((s, r) => s + r.arousal, 0) / results.length;
  return { v, a };
}
