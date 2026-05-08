// clip-classifier.test.mjs — Sprint 18 Task 35.2 tests
//
// Strategy: avoid loading the real ~150MB CLIP weights in CI. We exercise
// the heuristic fallback path directly and mock @xenova/transformers via
// the module's __setImportOverride hook to simulate failure / success.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  classifyMood,
  getStatus,
  MOOD_PROMPTS,
  __setImportOverride,
} from '../clip-classifier.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(__filename), '..', '..', '..', '..', '..');
const EMBEDDINGS_PATH = resolve(
  REPO_ROOT,
  'skills',
  'visionary',
  'styles',
  '_embeddings.json'
);

// Helper: extract top mood id from a result.
function topMoodId(result) {
  return result.top[0].mood;
}

// Helper: read embedded style ids from the canonical embeddings file.
function loadEmbeddingIds() {
  const raw = readFileSync(EMBEDDINGS_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  return new Set(Object.keys(parsed.embeddings));
}

// 1. Heuristic fallback: low-sat + low-edge palette → top mood is
//    'calm-minimal' or 'cold-sterile'.
test('heuristic: low-saturation + low-edges → calm-minimal or cold-sterile', async () => {
  // Force heuristic so we don't depend on transformers.js availability.
  const result = await classifyMood({
    forceHeuristic: true,
    fallbackPalette: { temperature: 'neutral' },
    fallbackSaturation: 0.08,
    fallbackEdgeDensity: 0.03,
  });
  assert.equal(result.method, 'heuristic');
  assert.ok(['calm-minimal', 'cold-sterile'].includes(topMoodId(result)),
    `expected calm-minimal or cold-sterile, got ${topMoodId(result)}`);
  assert.equal(result.top.length, 3);

  // And: explicit cool temperature should pull cold-sterile to the top.
  const cool = await classifyMood({
    forceHeuristic: true,
    fallbackPalette: { temperature: 'cool' },
    fallbackSaturation: 0.08,
    fallbackEdgeDensity: 0.03,
  });
  assert.equal(topMoodId(cool), 'cold-sterile');
});

// 2. Heuristic: high-sat + warm → 'vibrant-maximalist' top.
test('heuristic: high-saturation + warm temperature → vibrant-maximalist', async () => {
  const result = await classifyMood({
    forceHeuristic: true,
    fallbackPalette: { temperature: 'warm' },
    fallbackSaturation: 0.65,
    fallbackEdgeDensity: 0.18,
  });
  assert.equal(result.method, 'heuristic');
  assert.equal(topMoodId(result), 'vibrant-maximalist');
});

// 3. Heuristic: high-edges + cool → 'industrial-brutalist' or 'futuristic-sci-fi'.
test('heuristic: high-edges + cool temperature → industrial-brutalist or futuristic-sci-fi', async () => {
  const result = await classifyMood({
    forceHeuristic: true,
    fallbackPalette: { temperature: 'cool' },
    fallbackSaturation: 0.30,
    fallbackEdgeDensity: 0.40,
  });
  assert.equal(result.method, 'heuristic');
  assert.ok(
    ['industrial-brutalist', 'futuristic-sci-fi'].includes(topMoodId(result)),
    `expected industrial-brutalist or futuristic-sci-fi, got ${topMoodId(result)}`
  );
});

// 4. Heuristic: medium signals → 'editorial-intellectual'.
test('heuristic: medium-saturation + medium-edges + neutral → editorial-intellectual', async () => {
  const result = await classifyMood({
    forceHeuristic: true,
    fallbackPalette: { temperature: 'neutral' },
    fallbackSaturation: 0.30,
    fallbackEdgeDensity: 0.20,
  });
  assert.equal(result.method, 'heuristic');
  assert.equal(topMoodId(result), 'editorial-intellectual');
});

// 5. Missing transformers.js → method='heuristic' (mock import-fail).
test('missing @xenova/transformers → falls back to heuristic', async () => {
  // Mock the import to throw — simulates "package not installed".
  __setImportOverride(async () => {
    throw new Error('Cannot find module \'@xenova/transformers\'');
  });
  try {
    const result = await classifyMood({
      imageBuffer: Buffer.from([0, 1, 2, 3]),
      fallbackPalette: { temperature: 'cool' },
      fallbackSaturation: 0.10,
      fallbackEdgeDensity: 0.04,
    });
    assert.equal(result.method, 'heuristic');
    assert.equal(getStatus(), 'unavailable');
    assert.equal(result.top.length, 3);
  } finally {
    __setImportOverride(null);
  }
});

// 6. MOOD_PROMPTS covers 16 distinct moods and every entry has ≥1 style_tag.
test('MOOD_PROMPTS has 16 unique moods and every entry has at least one style_tag', () => {
  assert.equal(MOOD_PROMPTS.length, 16, 'expected exactly 16 mood prompts');
  const ids = new Set(MOOD_PROMPTS.map((m) => m.id));
  assert.equal(ids.size, 16, 'mood ids must be unique');
  for (const entry of MOOD_PROMPTS) {
    assert.ok(typeof entry.id === 'string' && entry.id.length > 0, `bad id: ${entry.id}`);
    assert.ok(typeof entry.prompt === 'string' && entry.prompt.length > 5,
      `bad prompt for ${entry.id}: ${entry.prompt}`);
    assert.ok(Array.isArray(entry.style_tags) && entry.style_tags.length >= 1,
      `mood ${entry.id} must have at least one style_tag`);
    for (const tag of entry.style_tags) {
      assert.ok(typeof tag === 'string' && tag.length > 0,
        `style_tag must be non-empty string in ${entry.id}`);
    }
  }
});

// 7. Style-tag references exist in _embeddings.json (smoke test against a sample).
test('style_tags reference styles that exist in _embeddings.json', () => {
  const known = loadEmbeddingIds();
  // Smoke-check a representative subset across the 16 moods so a typo in any
  // tag is caught early. Add the full set — the file is small enough.
  const tagsToCheck = new Set();
  for (const m of MOOD_PROMPTS) {
    for (const t of m.style_tags) tagsToCheck.add(t);
  }
  const missing = [...tagsToCheck].filter((t) => !known.has(t));
  assert.deepEqual(missing, [],
    `MOOD_PROMPTS references unknown styles: ${missing.join(', ')}`);
});

// Bonus integrity check: confidences in heuristic output sum to ~1 (softmax).
test('heuristic output confidences are a valid softmax distribution', async () => {
  const result = await classifyMood({
    forceHeuristic: true,
    fallbackPalette: { temperature: 'warm' },
    fallbackSaturation: 0.5,
    fallbackEdgeDensity: 0.2,
  });
  const sum = result.all_scores.reduce((s, e) => s + e.confidence, 0);
  assert.ok(Math.abs(sum - 1) < 1e-6, `softmax should sum to 1, got ${sum}`);
  for (const e of result.all_scores) {
    assert.ok(e.confidence >= 0 && e.confidence <= 1,
      `confidence out of [0,1] for ${e.mood}: ${e.confidence}`);
  }
  // top is sorted descending.
  for (let i = 1; i < result.top.length; i++) {
    assert.ok(result.top[i - 1].confidence >= result.top[i].confidence,
      'top must be sorted descending by confidence');
  }
});
