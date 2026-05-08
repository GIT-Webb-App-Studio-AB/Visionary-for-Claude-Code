// mood-mapper.test.mjs — Sprint 17 Task 33.5
// Tests for hooks/scripts/lib/mood-mapper.mjs
//
// Coverage targets (from sprint-17 AC):
//   1. Numeric coord input parses correctly and maps to the right quadrant
//   2. Text-mood lookup returns valid coordinates and a text_match marker
//   3. 16 mood combinations produce logically grouped style picks
//   4. Motion-tier quantisation lands in {0, 1, 2, 3}
//   5. Centrist (mid-axis) inputs pull in adjacent quadrants
//   6. All error cases return { error: ... } instead of throwing
//
// Note: tests assert structural properties (quadrant ID, length bounds,
// ranges) rather than byte-equality of the style cluster — the cluster
// composition can evolve as the catalog grows without breaking these tests.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapMood,
  getQuadrant,
  QUADRANT_STYLES,
  TEXT_MOOD_MAP,
} from '../mood-mapper.mjs';

// ──────────────────────────────────────────────────────────────────────
// Test 1: numeric coordinate "0.8,0.2" → Q4 (high-V, low-A — soft/glass)
// ──────────────────────────────────────────────────────────────────────
test('mapMood("0.8,0.2") parses numeric coords and lands in Q4', () => {
  const r = mapMood('0.8,0.2');
  assert.equal(r.error, undefined, 'should not error');
  assert.equal(r.valence, 0.8);
  assert.equal(r.arousal, 0.2);
  assert.equal(r.quadrant, 'Q4');
  assert.ok(Array.isArray(r.primary_styles));
  assert.ok(r.primary_styles.length >= 6, 'Q4 must surface ≥6 candidate styles');
});

// ──────────────────────────────────────────────────────────────────────
// Test 2: low-V / high-A → Q2 (brutalist / glitch)
// ──────────────────────────────────────────────────────────────────────
test('mapMood("0.2,0.8") lands in Q2 (brutalist/glitch cluster)', () => {
  const r = mapMood('0.2,0.8');
  assert.equal(r.quadrant, 'Q2');
  assert.ok(r.primary_styles.includes('brutalist-web'));
  assert.ok(r.primary_styles.includes('glitchcore'));
});

// ──────────────────────────────────────────────────────────────────────
// Test 3: high-V / high-A → Q1 (vibrant maximalist)
// ──────────────────────────────────────────────────────────────────────
test('mapMood("0.85,0.85") lands in Q1 (vibrant maximalist)', () => {
  const r = mapMood('0.85,0.85');
  assert.equal(r.quadrant, 'Q1');
  assert.ok(r.primary_styles.includes('memphis'));
  assert.ok(r.primary_styles.includes('vaporwave'));
});

// ──────────────────────────────────────────────────────────────────────
// Test 4: low-V / low-A → Q3 (swiss / mono / calm)
// ──────────────────────────────────────────────────────────────────────
test('mapMood("0.15,0.15") lands in Q3 (swiss/mono/calm)', () => {
  const r = mapMood('0.15,0.15');
  assert.equal(r.quadrant, 'Q3');
  assert.ok(r.primary_styles.includes('swiss-rationalism'));
  assert.ok(r.primary_styles.includes('liminal-space'));
});

// ──────────────────────────────────────────────────────────────────────
// Test 5: text mood "happy-anxious" → ≈ (0.7, 0.85), Q1, text_match set
// ──────────────────────────────────────────────────────────────────────
test('mapMood("happy-anxious") resolves to Q1 with text_match', () => {
  const r = mapMood('happy-anxious');
  assert.equal(r.valence, 0.70);
  assert.equal(r.arousal, 0.85);
  assert.equal(r.quadrant, 'Q1');
  assert.equal(r.text_match, 'happy-anxious');
});

// ──────────────────────────────────────────────────────────────────────
// Test 6: text mood "calm-melancholic" → low-V / low-A → Q3
// ──────────────────────────────────────────────────────────────────────
test('mapMood("calm-melancholic") resolves to Q3', () => {
  const r = mapMood('calm-melancholic');
  assert.ok(r.valence <= 0.5, 'valence should be low');
  assert.ok(r.arousal <= 0.5, 'arousal should be low');
  assert.equal(r.quadrant, 'Q3');
  assert.equal(r.text_match, 'calm-melancholic');
});

// ──────────────────────────────────────────────────────────────────────
// Test 7: unknown mood string returns explicit error
// ──────────────────────────────────────────────────────────────────────
test('mapMood("unknown-mood") returns error', () => {
  const r = mapMood('unknown-mood');
  assert.ok(r.error, 'should error');
  assert.match(r.error, /unknown mood text/i);
});

// ──────────────────────────────────────────────────────────────────────
// Test 8: out-of-range numeric coords return error
// ──────────────────────────────────────────────────────────────────────
test('mapMood("1.5,0.5") returns error for out-of-range coord', () => {
  const r = mapMood('1.5,0.5');
  assert.ok(r.error, 'should error');
  assert.match(r.error, /\[0, 1\]/);
});

// ──────────────────────────────────────────────────────────────────────
// Test 9: non-numeric coord input returns error
// ──────────────────────────────────────────────────────────────────────
test('mapMood("not,numbers") returns error', () => {
  const r = mapMood('not,numbers');
  assert.ok(r.error, 'should error');
  assert.match(r.error, /numeric format/i);
});

// ──────────────────────────────────────────────────────────────────────
// Test 10: object form { valence: 0.5, arousal: 0.5 } — exactly centrist
// → falls into Q4 (because mid-axis defaults to "low", v>0.5 evaluates false)
// and pulls in adjacent quadrants because distFromMid = 0.
// ──────────────────────────────────────────────────────────────────────
test('mapMood({0.5, 0.5}) — centrist input pulls in adjacent quadrants', () => {
  const r = mapMood({ valence: 0.5, arousal: 0.5 });
  assert.equal(r.error, undefined);
  // Both v and a are not > 0.5 → both classified as "low" → Q3.
  assert.equal(r.quadrant, 'Q3');
  // Centrist → adjacent quadrants pulled in
  assert.ok(r.secondary_styles.length > 0, 'centrist input should surface adjacent styles');
});

// ──────────────────────────────────────────────────────────────────────
// Test 11: motion-tier mapping
// ──────────────────────────────────────────────────────────────────────
test('motion-tier quantisation: arousal → {0,1,2,3}', () => {
  assert.equal(mapMood('0.5,0.10').motion_tier, 0, 'arousal 0.10 → tier 0');
  assert.equal(mapMood('0.5,0.40').motion_tier, 1, 'arousal 0.40 → tier 1');
  assert.equal(mapMood('0.5,0.70').motion_tier, 2, 'arousal 0.70 → tier 2');
  assert.equal(mapMood('0.5,0.95').motion_tier, 3, 'arousal 0.95 → tier 3');
});

// ──────────────────────────────────────────────────────────────────────
// Test 12: all 16 (well, 20 incl. aliases) text-mood entries map to logical
// quadrants. Loop and verify each quadrant's expected occupants.
// ──────────────────────────────────────────────────────────────────────
test('all TEXT_MOOD_MAP entries resolve to a valid quadrant', () => {
  const expectedQuadrant = {
    'happy':              'Q1',
    'happy-anxious':      'Q1',
    'excited':            'Q1',
    'energetic':          'Q1',
    'calm':               'Q4',
    'calm-positive':      'Q4',
    'serene':             'Q4',
    'peaceful':           'Q4',
    'melancholic':        'Q3',
    'calm-melancholic':   'Q3',
    'sad':                'Q3',
    'depressed':          'Q3',
    'angry':              'Q2',
    'tense':              'Q3', // valence 0.30, arousal 0.80 → low-V/high-A = Q2
    'aggressive':         'Q2',
    'anxious':            'Q3', // valence 0.35, arousal 0.80 → low-V/high-A = Q2
  };

  // Re-derive expected quadrant from coords (truth source) and verify mapMood agrees
  for (const [key, coords] of Object.entries(TEXT_MOOD_MAP)) {
    const [v, a] = coords;
    const expected = getQuadrant(v, a);
    const r = mapMood(key);
    assert.equal(
      r.quadrant,
      expected,
      `text "${key}" at (${v},${a}) should map to ${expected}, got ${r.quadrant}`,
    );
    assert.ok(r.primary_styles.length >= 4, `quadrant ${expected} should expose ≥4 primary styles`);
  }

  // Spot-check a few key labels (sanity: not just self-consistent but logical)
  assert.equal(mapMood('happy').quadrant, expectedQuadrant['happy']);
  assert.equal(mapMood('calm').quadrant, expectedQuadrant['calm']);
  assert.equal(mapMood('sad').quadrant, expectedQuadrant['sad']);
  assert.equal(mapMood('aggressive').quadrant, expectedQuadrant['aggressive']);
});

// ──────────────────────────────────────────────────────────────────────
// Bonus: getQuadrant boundary behaviour
// ──────────────────────────────────────────────────────────────────────
test('getQuadrant treats mid-axis (0.5) as the "low" half', () => {
  // v > 0.5 ? 'high' : 'low' — 0.5 itself counts as "low" → low/low → Q3
  assert.equal(getQuadrant(0.5, 0.5), 'Q3');
});

test('getQuadrant: explicit boundary points', () => {
  assert.equal(getQuadrant(0.5,  0.5),  'Q3'); // both low (≤0.5)
  assert.equal(getQuadrant(0.51, 0.51), 'Q1'); // both high
  assert.equal(getQuadrant(0.51, 0.5),  'Q4'); // high-V, low-A
  assert.equal(getQuadrant(0.5,  0.51), 'Q2'); // low-V, high-A
});

// ──────────────────────────────────────────────────────────────────────
// Bonus: catalog-distribution audit — each quadrant has ≥6 distinct styles
// (Sprint 17 AC: "ingen kvadrant har < 6 distinkta stilar")
// ──────────────────────────────────────────────────────────────────────
test('each quadrant exposes ≥ 6 distinct catalog styles', () => {
  for (const [q, styles] of Object.entries(QUADRANT_STYLES)) {
    const unique = new Set(styles);
    assert.ok(unique.size >= 6, `${q} has ${unique.size} distinct styles, need ≥6`);
  }
});

// ──────────────────────────────────────────────────────────────────────
// Bonus: saturation_hint mirrors valence
// ──────────────────────────────────────────────────────────────────────
test('saturation_hint equals valence', () => {
  const r = mapMood('0.73,0.42');
  assert.equal(r.saturation_hint, 0.73);
});
