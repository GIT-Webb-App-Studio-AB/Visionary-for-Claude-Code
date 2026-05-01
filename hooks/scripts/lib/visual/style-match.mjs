// Style-match — Sprint 11.
// Cosine similarity between rendered embedding and curated style anchors.
// Returns visual_style_match score 0..10 (or null when anchors absent).

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = dirname(dirname(dirname(dirname(__filename))));
const DEFAULT_INDEX = join(REPO_ROOT, 'models', 'style-anchors', '_index.json');

let _indexCache = null;

export async function loadAnchorIndex(path = DEFAULT_INDEX) {
  if (_indexCache) return _indexCache;
  if (!existsSync(path)) return null;
  try {
    const raw = await readFile(path, 'utf8');
    _indexCache = JSON.parse(raw);
    return _indexCache;
  } catch {
    return null;
  }
}

export function clearCache() {
  _indexCache = null;
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return null;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (denom === 0) return null;
  return dot / denom;
}

export function similarityToScore(sim) {
  if (sim === null || sim === undefined) return null;
  if (sim >= 0.85) return 10;
  if (sim >= 0.70) return 8;
  if (sim >= 0.55) return 5;
  if (sim >= 0.40) return 3;
  return 1;
}

export async function scoreStyleMatch({ embedding, styleId, anchorIndex }) {
  if (!embedding) return { score: null, reason: 'no-embedding' };
  const index = anchorIndex || await loadAnchorIndex();
  if (!index || !index.styles) return { score: null, reason: 'no-anchor-index' };

  const style = index.styles[styleId];
  if (!style || !style.anchors || style.anchors.length === 0) {
    // Try category fallback
    const catFallback = style?.category_fallback;
    if (catFallback && index.category_centroids?.[catFallback]) {
      const centroid = Float32Array.from(index.category_centroids[catFallback]);
      const sim = cosineSimilarity(embedding, centroid);
      return {
        score: similarityToScore(sim),
        sim,
        used: 'category-centroid',
        reason: `style ${styleId} has no anchors; matched against category ${catFallback}`,
      };
    }
    return { score: null, reason: `no-anchors-for-style:${styleId}` };
  }

  // Pick best anchor
  let bestSim = -2;
  for (const anchor of style.anchors) {
    const anchorVec = Float32Array.from(anchor.embedding);
    const sim = cosineSimilarity(embedding, anchorVec);
    if (sim !== null && sim > bestSim) bestSim = sim;
  }

  if (bestSim === -2) return { score: null, reason: 'no-valid-anchors' };

  return {
    score: similarityToScore(bestSim),
    sim: +bestSim.toFixed(3),
    used: 'anchor-max',
    style_id: styleId,
  };
}
