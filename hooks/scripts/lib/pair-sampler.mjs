// pair-sampler.mjs — Sprint 05 Task 15.4.
//
// Picks a diverse subset of taste-pairs for FSPO few-shot injection. Without
// diversity the retriever would feed the LLM eight near-duplicates of the
// same taste signal — wasted prompt budget AND a biased anchor that makes
// Step 4 select toward the duplicated dimension.
//
// Algorithm (from sprint plan):
//   1. For each pair, compute a signal vector = chosen_embedding - mean(rejected_embeddings)
//   2. Anchor: pick the pair whose signal is most similar to the current brief
//      vector (highest cosine similarity).
//   3. Greedy diversification: for each subsequent slot, pick the pair with
//      maximum minimum-cosine-distance from the already-chosen set.
//   4. Stop at `k` (default 8) or when the pool is exhausted.
//
// Embeddings come from skills/visionary/styles/_embeddings.json (Sprint 4).
// We treat missing style ids as zero-vectors so unknown/custom styles don't
// crash the sampler — they just won't cluster meaningfully.
//
// Pure module — no I/O. The caller (UserPromptSubmit hook that injects
// few-shots into additionalContext) loads pairs + embeddings and passes
// them in.

import { readFileSync } from 'node:fs';

// ── Embedding loader (cached) ────────────────────────────────────────────────
// Cache the embeddings JSON for the life of the process. A hook runs in
// milliseconds so cache-invalidation is trivial.
let _embeddingsCache = null;
export function loadEmbeddings(path) {
  if (_embeddingsCache && _embeddingsCache._path === path) return _embeddingsCache;
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const cache = { _path: path, meta: raw.meta, embeddings: raw.embeddings || {} };
  _embeddingsCache = cache;
  return cache;
}

const ZERO_VECTOR = Object.freeze(new Array(8).fill(0));

export function embeddingFor(id, embeddings) {
  if (!id) return ZERO_VECTOR.slice();
  const v = embeddings[id];
  return Array.isArray(v) && v.length === 8 ? v : ZERO_VECTOR.slice();
}

// ── Vector math ──────────────────────────────────────────────────────────────
// All pure and tiny. Kept as separate functions so the unit tests can assert
// correctness without reaching through sampleDiversePairs.

export function vectorSub(a, b) {
  const n = Math.min(a.length, b.length);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = a[i] - b[i];
  return out;
}

export function vectorMean(vectors) {
  if (!vectors.length) return ZERO_VECTOR.slice();
  const n = vectors[0].length;
  const out = new Array(n).fill(0);
  for (const v of vectors) for (let i = 0; i < n; i++) out[i] += v[i];
  for (let i = 0; i < n; i++) out[i] /= vectors.length;
  return out;
}

export function dot(a, b) {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

export function norm(a) {
  return Math.sqrt(dot(a, a));
}

export function cosineSimilarity(a, b) {
  const na = norm(a); const nb = norm(b);
  if (na === 0 || nb === 0) return 0;
  return dot(a, b) / (na * nb);
}

export function cosineDistance(a, b) {
  return 1 - cosineSimilarity(a, b);
}

// ── Signal vector for a pair ─────────────────────────────────────────────────
// The sprint spec says "8-dim embedding of (chosen - rejected_mean)". We do
// exactly that. If the pair has zero rejected siblings we fall back to the
// chosen vector itself (signal strength is lower but non-zero).
export function signalVectorFor(pair, embeddings) {
  const chosen = embeddingFor(pair?.chosen?.style_id, embeddings);
  const rejectedVecs = Array.isArray(pair?.rejected)
    ? pair.rejected.map((r) => embeddingFor(r.style_id, embeddings))
    : [];
  if (rejectedVecs.length === 0) return chosen.slice();
  const rejectedMean = vectorMean(rejectedVecs);
  return vectorSub(chosen, rejectedMean);
}

// ── Brief vector ─────────────────────────────────────────────────────────────
// The current brief needs a comparable vector. We assemble one from the
// inferred StyleBrief: use the embedding of the tentatively-top-ranked
// style if the caller provides it, otherwise from the brief's declared
// motion/density signals mapped into the 8 axes (loose approximation —
// good enough to anchor the first pick).
//
// Signature intentionally permissive: the caller can pass either a style_id
// OR a synthetic 8-vector built from StyleBrief signals.
export function briefVectorFor(brief, embeddings) {
  if (!brief) return ZERO_VECTOR.slice();
  if (Array.isArray(brief) && brief.length === 8) return brief.slice();
  if (typeof brief === 'string') return embeddingFor(brief, embeddings);
  if (brief.anchor_style_id) return embeddingFor(brief.anchor_style_id, embeddings);
  // Fallback: synthesize from StyleBrief fields. Axis order:
  //   [density, chroma, formality, motion_intensity, historicism, texture, contrast_energy, type_drama]
  const density = brief.density === 'dense' ? 0.85
                : brief.density === 'sparse' ? 0.2
                : 0.5;
  const motion = brief.motion_level === 3 ? 0.95
               : brief.motion_level === 2 ? 0.67
               : brief.motion_level === 1 ? 0.33
               : 0.15;
  // The other axes stay neutral (0.5) — StyleBrief doesn't carry them.
  return [density, 0.5, 0.5, motion, 0.5, 0.5, 0.5, 0.5];
}

// ── Public entry: sampleDiversePairs ────────────────────────────────────────
// Inputs:
//   pairs      — array of taste-pair objects (taste/pairs.jsonl contents)
//   briefInput — see briefVectorFor above
//   embeddings — { <id>: [8 floats] }
//   options    — { k: 8, relevanceWeight: 0.5 }
//
// Output: array of at most k pairs, ordered [anchor, …diverse picks]. If
// the pool is smaller than k, returns the whole pool ordered by relevance.
//
// Scoring for slot N>0: score(candidate) = minCosineDistance-to-chosen
//   Relevance to brief is NOT re-weighted per slot — the anchor already
//   handled that. Sprint plan says "maximal cosine-distance from redan-valda",
//   interpret literally.
export function sampleDiversePairs(pairs, briefInput, embeddings, options = {}) {
  const k = options.k ?? 8;
  if (!Array.isArray(pairs) || pairs.length === 0) return [];
  if (pairs.length <= k && pairs.length <= 1) return pairs.slice();

  const briefVec = briefVectorFor(briefInput, embeddings);
  const pool = pairs.map((p) => ({
    pair: p,
    signal: signalVectorFor(p, embeddings),
  }));

  // Anchor: highest cosine similarity to briefVec.
  pool.sort((a, b) => cosineSimilarity(b.signal, briefVec) - cosineSimilarity(a.signal, briefVec));
  const chosen = [pool[0]];
  const remaining = pool.slice(1);

  while (chosen.length < k && remaining.length) {
    // For each remaining item: minimum distance to anything already chosen.
    let bestIdx = 0;
    let bestMinDist = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      let minDist = Infinity;
      for (const sel of chosen) {
        const d = cosineDistance(c.signal, sel.signal);
        if (d < minDist) minDist = d;
      }
      if (minDist > bestMinDist) { bestMinDist = minDist; bestIdx = i; }
    }
    chosen.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  return chosen.map((c) => c.pair);
}

// ── Diagnostic helper ────────────────────────────────────────────────────────
// Unit-test assertion from the sprint AC: mean pairwise cosine distance of
// the returned set should be >= 0.4 on random synthetic pairs. Exposed so
// tests can compute and the /visionary-taste debug command can report it.
export function meanPairwiseDistance(pairs, embeddings) {
  if (!Array.isArray(pairs) || pairs.length < 2) return 0;
  const signals = pairs.map((p) => signalVectorFor(p, embeddings));
  let sum = 0; let count = 0;
  for (let i = 0; i < signals.length; i++) {
    for (let j = i + 1; j < signals.length; j++) {
      sum += cosineDistance(signals[i], signals[j]);
      count++;
    }
  }
  return count === 0 ? 0 : sum / count;
}

// Test seam: lets unit-tests clear the embeddings cache between runs.
export function _resetEmbeddingsCacheForTests() {
  _embeddingsCache = null;
}
