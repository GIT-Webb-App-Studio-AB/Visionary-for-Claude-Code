import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveVibe, ALL_VIBES } from '../intent-map.mjs';

test('exact match - svenska', () => {
  const r = resolveVibe('mer energiskt');
  assert.equal(r.match, 'exact');
  assert.equal(r.vibe.id, 'energetic');
});

test('exact match - english', () => {
  const r = resolveVibe('softer');
  assert.equal(r.match, 'exact');
  assert.equal(r.vibe.id, 'softer');
});

test('substring match', () => {
  const r = resolveVibe('please make it faster please');
  assert.equal(r.match, 'substring');
  assert.equal(r.vibe.id, 'faster');
});

test('fuzzy match', () => {
  const r = resolveVibe('boucier');
  assert.equal(r.match, 'fuzzy');
  assert.equal(r.vibe.id, 'bouncier');
});

test('unknown intent returns suggestions', () => {
  const r = resolveVibe('xkcd flerflugor');
  assert.equal(r.error, 'unknown-intent');
  assert.ok(Array.isArray(r.suggestions));
  assert.ok(r.suggestions.length > 0);
});

test('empty intent returns error', () => {
  const r = resolveVibe('');
  assert.equal(r.error, 'empty-intent');
});

test('all 12 vibes registered', () => {
  assert.ok(ALL_VIBES.length >= 12);
});

test('every vibe has at least one adjustment', () => {
  for (const v of ALL_VIBES) {
    assert.ok(Array.isArray(v.adjustments));
    assert.ok(v.adjustments.length > 0);
  }
});
