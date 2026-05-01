// OOD detection — Sprint 11.
// Mahalanobis distance with diagonal covariance to flag rendered
// components that fall outside the style's training distribution.

import { loadAnchorIndex } from './style-match.mjs';

export function mahalanobisDistance(embedding, centroid, covarianceDiagonal) {
  if (!embedding || !centroid || !covarianceDiagonal) return null;
  if (embedding.length !== centroid.length) return null;
  let sum = 0;
  for (let i = 0; i < embedding.length; i++) {
    const diff = embedding[i] - centroid[i];
    const variance = covarianceDiagonal[i] || 1e-6;
    sum += (diff * diff) / variance;
  }
  return Math.sqrt(sum);
}

export function distanceToSigma(distance, dim) {
  if (distance === null) return null;
  // Approximate: chi-square sqrt-distance for d dims is roughly sqrt(d) at 1σ.
  const baseline = Math.sqrt(dim);
  return distance / baseline;
}

export async function detectOod({ embedding, styleId, anchorIndex }) {
  if (!embedding) return { in_distribution: null, reason: 'no-embedding' };
  const index = anchorIndex || await loadAnchorIndex();
  if (!index || !index.styles) return { in_distribution: null, reason: 'no-anchor-index' };

  const style = index.styles[styleId];
  if (!style || !style.centroid || !style.covariance_diagonal) {
    return { in_distribution: null, reason: 'no-distribution-stats' };
  }

  const centroid = Float32Array.from(style.centroid);
  const cov = Float32Array.from(style.covariance_diagonal);
  const dist = mahalanobisDistance(embedding, centroid, cov);
  const sigma = distanceToSigma(dist, embedding.length);

  let classification;
  if (sigma <= 1.0) classification = 'in-distribution';
  else if (sigma <= 2.0) classification = 'marginal';
  else classification = 'out-of-distribution';

  return {
    in_distribution: classification === 'in-distribution',
    classification,
    distance: dist === null ? null : +dist.toFixed(3),
    distance_sigma: sigma === null ? null : +sigma.toFixed(3),
  };
}
