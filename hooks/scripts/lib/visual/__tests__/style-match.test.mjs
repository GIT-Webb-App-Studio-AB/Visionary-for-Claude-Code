import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cosineSimilarity,
  similarityToScore,
  scoreStyleMatch,
  clearCache,
} from '../style-match.mjs';

test('cosineSimilarity — identical vectors → 1.0', () => {
  const v = new Float32Array([1, 0, 0]);
  const sim = cosineSimilarity(v, v);
  assert.ok(Math.abs(sim - 1.0) < 1e-6);
});

test('cosineSimilarity — orthogonal vectors → 0', () => {
  const a = new Float32Array([1, 0, 0]);
  const b = new Float32Array([0, 1, 0]);
  const sim = cosineSimilarity(a, b);
  assert.ok(Math.abs(sim) < 1e-6);
});

test('cosineSimilarity — null on length mismatch', () => {
  assert.equal(cosineSimilarity(new Float32Array([1, 0]), new Float32Array([1, 0, 0])), null);
});

test('similarityToScore mapping', () => {
  assert.equal(similarityToScore(0.9), 10);
  assert.equal(similarityToScore(0.75), 8);
  assert.equal(similarityToScore(0.6), 5);
  assert.equal(similarityToScore(0.45), 3);
  assert.equal(similarityToScore(0.1), 1);
  assert.equal(similarityToScore(null), null);
});

test('scoreStyleMatch — no anchor index returns null score with reason', async () => {
  clearCache();
  const result = await scoreStyleMatch({
    embedding: new Float32Array(768).fill(0),
    styleId: 'unknown-style',
    anchorIndex: { styles: {} },
  });
  assert.equal(result.score, null);
  assert.ok(typeof result.reason === 'string');
});

test('scoreStyleMatch — perfect anchor match returns 10', async () => {
  clearCache();
  const emb = new Float32Array(768);
  for (let i = 0; i < 768; i++) emb[i] = (i % 7 === 0) ? 1 : 0;
  // Normalise
  let sum = 0;
  for (const v of emb) sum += v * v;
  const norm = Math.sqrt(sum);
  for (let i = 0; i < 768; i++) emb[i] /= norm;

  const fakeIndex = {
    styles: {
      'test-style': {
        anchors: [{ image: 'a.png', embedding: Array.from(emb) }],
      },
    },
  };
  const result = await scoreStyleMatch({ embedding: emb, styleId: 'test-style', anchorIndex: fakeIndex });
  assert.equal(result.score, 10);
  assert.ok(result.sim >= 0.99);
});
