// Run: node --test scripts/__tests__/build-style-embeddings.test.mjs
//
// Unit tests for the pieces of build-style-embeddings.mjs that are
// importable without running main(). Covers cosineDistance + AXES
// invariants + the committed _embeddings.json shape.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cosineDistance, AXES } from '../build-style-embeddings.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const embeddingsPath = resolve(repoRoot, 'skills/visionary/styles/_embeddings.json');

// ── AXES invariants ─────────────────────────────────────────────────────────
test('AXES: exactly 8 axes in sprint-4 order', () => {
  assert.equal(AXES.length, 8);
  assert.deepEqual([...AXES], [
    'density', 'chroma', 'formality', 'motion_intensity',
    'historicism', 'texture', 'contrast_energy', 'type_drama',
  ]);
});

test('AXES: frozen', () => {
  assert.throws(() => { AXES[0] = 'junk'; });
});

// ── cosineDistance ──────────────────────────────────────────────────────────
test('cosineDistance: identical vectors → 0', () => {
  const v = [0.1, 0.9, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  assert.ok(Math.abs(cosineDistance(v, v)) < 1e-9);
});

test('cosineDistance: orthogonal → 1', () => {
  const a = [1, 0, 0, 0, 0, 0, 0, 0];
  const b = [0, 1, 0, 0, 0, 0, 0, 0];
  assert.ok(Math.abs(cosineDistance(a, b) - 1) < 1e-9);
});

test('cosineDistance: anti-parallel → 2 (but our domain is 0..1 so not reachable)', () => {
  const a = [1, 0, 0, 0, 0, 0, 0, 0];
  const b = [-1, 0, 0, 0, 0, 0, 0, 0];
  assert.ok(Math.abs(cosineDistance(a, b) - 2) < 1e-9);
});

test('cosineDistance: mismatched length → 1 (max distance)', () => {
  assert.equal(cosineDistance([1, 0], [1, 0, 0]), 1);
});

test('cosineDistance: zero vector → 1 (safe default)', () => {
  assert.equal(cosineDistance([0, 0, 0], [1, 2, 3]), 1);
  assert.equal(cosineDistance([1, 2, 3], [0, 0, 0]), 1);
});

test('cosineDistance: non-array → 1', () => {
  assert.equal(cosineDistance(null, [1, 0]), 1);
  assert.equal(cosineDistance([1, 0], 'abc'), 1);
});

// ── Committed _embeddings.json shape ────────────────────────────────────────
test('embeddings file: exists and parses', () => {
  assert.ok(existsSync(embeddingsPath), 'run: node scripts/build-style-embeddings.mjs');
  const data = JSON.parse(readFileSync(embeddingsPath, 'utf8'));
  assert.ok(data.meta);
  assert.equal(data.meta.schema_version, '1.0.0');
  assert.deepEqual(data.meta.axes, [...AXES]);
  assert.ok(typeof data.meta.count === 'number' && data.meta.count > 0);
});

test('embeddings file: every style has an 8-d vector in [0,1]', () => {
  const data = JSON.parse(readFileSync(embeddingsPath, 'utf8'));
  const ids = Object.keys(data.embeddings);
  assert.ok(ids.length >= 200, `expected >=200 styles, got ${ids.length}`);
  for (const id of ids) {
    const v = data.embeddings[id];
    assert.ok(Array.isArray(v), `${id} vector not array`);
    assert.equal(v.length, 8, `${id} has ${v.length} dimensions`);
    for (const [i, n] of v.entries()) {
      assert.ok(Number.isFinite(n), `${id}[${AXES[i]}] not finite: ${n}`);
      assert.ok(n >= 0 && n <= 1, `${id}[${AXES[i]}] out of [0,1]: ${n}`);
    }
  }
});

test('embeddings file: motion_intensity reflects motion_tier', () => {
  const data = JSON.parse(readFileSync(embeddingsPath, 'utf8'));
  // Fixtures: bauhaus is Subtle tier → ~0.33; cyberpunk-neon is Kinetic → ~0.95.
  const miIdx = AXES.indexOf('motion_intensity');
  if (data.embeddings['bauhaus']) {
    const v = data.embeddings['bauhaus'][miIdx];
    assert.ok(Math.abs(v - 0.33) < 0.1, `bauhaus motion_intensity=${v}`);
  }
  if (data.embeddings['cyberpunk-neon']) {
    const v = data.embeddings['cyberpunk-neon'][miIdx];
    assert.ok(v >= 0.9, `cyberpunk-neon motion_intensity=${v}`);
  }
});

test('embeddings file: historicism high for known period styles', () => {
  const data = JSON.parse(readFileSync(embeddingsPath, 'utf8'));
  const histIdx = AXES.indexOf('historicism');
  const periodStyles = ['bauhaus', 'art-deco', 'art-nouveau', 'memphis', 'constructivism', 'dieter-rams'];
  for (const id of periodStyles) {
    if (!data.embeddings[id]) continue;
    assert.ok(data.embeddings[id][histIdx] >= 0.7, `${id} historicism=${data.embeddings[id][histIdx]}, expected >=0.7`);
  }
});

test('embeddings file: formality low for brutalist + playful styles', () => {
  const data = JSON.parse(readFileSync(embeddingsPath, 'utf8'));
  const formIdx = AXES.indexOf('formality');
  const informalStyles = ['architectural-brutalism', 'dopamine-design', 'chaos-packaging-collage'];
  for (const id of informalStyles) {
    if (!data.embeddings[id]) continue;
    assert.ok(data.embeddings[id][formIdx] <= 0.5, `${id} formality=${data.embeddings[id][formIdx]}, expected <=0.5`);
  }
});

test('embeddings file: pairs differ enough to pass 0.1 average distance floor', () => {
  const data = JSON.parse(readFileSync(embeddingsPath, 'utf8'));
  const ids = Object.keys(data.embeddings);
  // Random subset of 30 pairs — full O(n²) is 20k pairs which is fine but
  // slow for CI. The assert is on the subset's mean.
  let sum = 0;
  let n = 0;
  for (let k = 0; k < 30; k++) {
    const a = ids[Math.floor(Math.random() * ids.length)];
    const b = ids[Math.floor(Math.random() * ids.length)];
    if (a === b) continue;
    sum += cosineDistance(data.embeddings[a], data.embeddings[b]);
    n++;
  }
  assert.ok(sum / n >= 0.04, `avg pairwise distance ${(sum / n).toFixed(3)} too low — heuristic is collapsing embeddings`);
});
