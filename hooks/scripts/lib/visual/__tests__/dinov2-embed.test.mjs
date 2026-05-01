import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractEmbedding, syntheticEmbedding } from '../dinov2-embed.mjs';

test('syntheticEmbedding returns Float32Array of length 768', () => {
  const e = syntheticEmbedding(42);
  assert.ok(e instanceof Float32Array);
  assert.equal(e.length, 768);
});

test('syntheticEmbedding is deterministic', () => {
  const a = syntheticEmbedding(1);
  const b = syntheticEmbedding(1);
  for (let i = 0; i < 768; i++) assert.equal(a[i], b[i]);
});

test('syntheticEmbedding is L2-normalised', () => {
  const e = syntheticEmbedding(7);
  let sum = 0;
  for (let i = 0; i < 768; i++) sum += e[i] * e[i];
  assert.ok(Math.abs(sum - 1) < 0.001);
});

test('extractEmbedding returns null when runtime/model missing', async () => {
  const result = await extractEmbedding(Buffer.from('fakeimage'));
  // Should be null on machines without onnxruntime-web + the model
  assert.equal(result, null);
});
