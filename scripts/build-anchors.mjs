#!/usr/bin/env node
// Build style-anchors/_index.json from curated screenshots.
// Run after curating images:
//   node scripts/build-anchors.mjs

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractEmbedding } from '../hooks/scripts/lib/visual/dinov2-embed.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO = dirname(dirname(__filename));
const ANCHORS_DIR = join(REPO, 'models', 'style-anchors');
const INDEX_PATH = join(ANCHORS_DIR, '_index.json');

function meanVector(vectors) {
  if (vectors.length === 0) return null;
  const dim = vectors[0].length;
  const out = new Float32Array(dim);
  for (const v of vectors) for (let i = 0; i < dim; i++) out[i] += v[i];
  for (let i = 0; i < dim; i++) out[i] /= vectors.length;
  return out;
}

function diagonalCovariance(vectors, mean) {
  if (vectors.length < 2) return null;
  const dim = mean.length;
  const out = new Float32Array(dim);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) out[i] += (v[i] - mean[i]) ** 2;
  }
  for (let i = 0; i < dim; i++) out[i] /= (vectors.length - 1);
  return out;
}

async function main() {
  if (!existsSync(ANCHORS_DIR)) await mkdir(ANCHORS_DIR, { recursive: true });
  const styles = {};
  const dirs = (await readdir(ANCHORS_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const styleId of dirs) {
    const dir = join(ANCHORS_DIR, styleId);
    const files = (await readdir(dir)).filter((f) => /\.(png|jpe?g)$/i.test(f));
    const anchors = [];
    for (const f of files) {
      process.stderr.write(`  ${styleId}/${f}\n`);
      const emb = await extractEmbedding(join(dir, f));
      if (emb) anchors.push({ image: f, embedding: Array.from(emb) });
    }
    const vectors = anchors.map((a) => Float32Array.from(a.embedding));
    const centroid = meanVector(vectors);
    const cov = diagonalCovariance(vectors, centroid);
    styles[styleId] = {
      anchors,
      centroid: centroid ? Array.from(centroid) : null,
      covariance_diagonal: cov ? Array.from(cov) : null,
    };
  }

  const index = {
    version: '1.0.0',
    model: 'dinov2-small',
    embedding_dim: 768,
    generated_at: new Date().toISOString(),
    styles,
  };
  await writeFile(INDEX_PATH, JSON.stringify(index, null, 2));
  process.stderr.write(`Saved ${INDEX_PATH}\n`);
}

main().catch((err) => {
  process.stderr.write(`[error] ${err.message}\n`);
  process.exit(1);
});
