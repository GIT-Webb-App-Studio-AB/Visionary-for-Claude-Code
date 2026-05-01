import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mahalanobisDistance, distanceToSigma, detectOod } from '../ood-detect.mjs';

test('mahalanobisDistance — exact centroid match → 0', () => {
  const emb = new Float32Array(3).fill(0);
  const centroid = new Float32Array(3).fill(0);
  const cov = new Float32Array(3).fill(1);
  assert.equal(mahalanobisDistance(emb, centroid, cov), 0);
});

test('mahalanobisDistance — null on mismatched dims', () => {
  const r = mahalanobisDistance(new Float32Array(3), new Float32Array(2), new Float32Array(3));
  assert.equal(r, null);
});

test('distanceToSigma — scales with sqrt(dim)', () => {
  const sigma = distanceToSigma(Math.sqrt(768), 768);
  assert.ok(Math.abs(sigma - 1.0) < 1e-6);
});

test('detectOod — in-distribution when distance ≤ 1σ', async () => {
  const emb = new Float32Array(3).fill(0.001);
  const fakeIndex = {
    styles: {
      'tight': {
        centroid: [0, 0, 0],
        covariance_diagonal: [1, 1, 1],
      },
    },
  };
  const result = await detectOod({ embedding: emb, styleId: 'tight', anchorIndex: fakeIndex });
  assert.equal(result.classification, 'in-distribution');
});

test('detectOod — out-of-distribution when distance ≥ 2σ', async () => {
  const dim = 100;
  const emb = new Float32Array(dim).fill(5);
  const centroid = new Array(dim).fill(0);
  const cov = new Array(dim).fill(0.01);
  const fakeIndex = { styles: { 'far': { centroid, covariance_diagonal: cov } } };
  const result = await detectOod({ embedding: emb, styleId: 'far', anchorIndex: fakeIndex });
  assert.equal(result.classification, 'out-of-distribution');
});
