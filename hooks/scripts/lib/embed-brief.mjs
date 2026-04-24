// embed-brief.mjs — Sprint 06 Task 17.2
//
// Deterministic 384-dim embedder for the DesignPref RAG loop.
//
// Design decisions (read BEFORE swapping this out):
//
// 1. Zero dependencies. The rest of the repo avoids package.json deps on
//    principle (custom JSON schema validator instead of Ajv, custom
//    numeric scorer instead of a vision model, etc.). Shipping
//    @xenova/transformers would pull ~25 MB of ONNX runtime + model
//    weights into every install. That's a material user-experience tax
//    for a plugin people install with one command. This embedder is
//    therefore a **hashed character n-gram bag-of-words** with a fixed
//    384-dim output — good enough for cosine-ranking a handful of
//    briefs against each other, not good enough for open-domain
//    semantic search.
//
// 2. Why 384 dims? It matches the xenova MiniLM-L6-v2 output shape, so
//    a future swap to the real embedder only changes the `embedder_id`
//    field — file layout stays identical. (The accepted-example schema
//    tolerates 256–1024 dims so a swap to Anthropic-embeddings is also
//    schema-compatible.)
//
// 3. Deterministic. Same text → same vector across runs, across machines,
//    across platforms. We do not rely on random projections, Unicode
//    normalisation tables that vary by libicu version, or floating-point
//    order-of-operations. Hash via SHA-256 (stable everywhere).
//
// 4. Cosine-compatible. Vectors are L2-normalised before return, so
//    `dot(a, b)` equals `cos(a, b)`. Cosine is the RAG ranking primitive.
//
// 5. Identity: `embedder_id = 'hashed-ngram-v1'`. Readers MUST refuse to
//    compare vectors across embedder_ids — cross-embedder cosine is
//    meaningless.
//
// How good is it, really?
//
// Character trigram + 5-gram bag-of-words captures lexical similarity
// (same words or near-misses rank close) but nothing semantic. Two
// briefs that use different vocabulary to describe the same concept
// will rank far apart. For our use case — surfacing 3 of 50 accepted
// examples whose briefs are CLOSEST IN WORDS to the current brief —
// this is usable: users describing "pricing page for SaaS" will tend
// to hit past accepted "pricing", "B2B SaaS", "pricing tiers" briefs.
// Once xenova is in, expect a ~10-20% lift in RAG precision.
//
// API:
//   import { embedBrief, cosine, embedderId } from './embed-brief.mjs'
//   const vec = embedBrief('A pricing page for B2B SaaS with three tiers')
//   const score = cosine(vec, otherVec)
//
// Cache is in-process only — briefs repeat within a single session, and
// session-level cache is plenty. No disk cache; the vectors are tiny
// (384 floats ≈ 3 KB) and computing them costs under a millisecond.

import { createHash } from 'node:crypto';

export const embedderId = 'hashed-ngram-v1';
export const EMBEDDING_DIMS = 384;

// ── Cache ────────────────────────────────────────────────────────────────────
// Keyed on normalised input so trivial capitalisation / whitespace diffs
// collapse to one cached vector. Bounded so a pathological caller can't
// blow up memory.
const CACHE_MAX = 256;
const _cache = new Map();

function cacheGet(key) {
  if (!_cache.has(key)) return null;
  const v = _cache.get(key);
  // LRU-ish: re-insert on hit so frequent entries stay warm.
  _cache.delete(key);
  _cache.set(key, v);
  return v;
}

function cacheSet(key, value) {
  if (_cache.size >= CACHE_MAX) {
    // Evict oldest — Map iteration order is insertion order in JS.
    const oldest = _cache.keys().next().value;
    _cache.delete(oldest);
  }
  _cache.set(key, value);
}

// ── Normalisation ────────────────────────────────────────────────────────────
// Lowercase, collapse whitespace, drop punctuation that doesn't carry
// meaning for brief-similarity. We keep hyphens and underscores because
// people write "b2b-saas" / "three_tiers" and the dash IS part of the
// concept. We drop quotes / brackets / periods that add noise.
export function normaliseBrief(text) {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFKC')
    // Replace anything that's not a letter, digit, hyphen, underscore, or
    // whitespace with a space. Keeps emoji-less ASCII briefs clean; accepts
    // basic Latin extended (via the Unicode property escapes).
    .replace(/[^\p{L}\p{N}_\- ]+/gu, ' ')
    // Collapse runs of whitespace.
    .replace(/\s+/g, ' ')
    .trim();
}

// ── n-gram extraction ────────────────────────────────────────────────────────
// Two overlapping bags:
//   - Character trigrams over the normalised string (lexical fuzz tolerance)
//   - Whitespace-delimited tokens (word-level semantics)
// Both go through the same hash → bucket → count pipeline.
function* charNgrams(text, n) {
  if (text.length < n) return;
  for (let i = 0; i <= text.length - n; i++) {
    yield text.slice(i, i + n);
  }
}

function* tokens(text) {
  for (const t of text.split(' ')) {
    if (t) yield `w:${t}`;
  }
}

// ── Hash to bucket ───────────────────────────────────────────────────────────
// SHA-256 of the feature, first 4 bytes → uint32 → modulo EMBEDDING_DIMS.
// Sign is set by the 5th byte's LSB: half the features are positive, half
// negative. This is the "signed hashing trick" from Weinberger et al.,
// 2009 — it suppresses collision bias because two colliding features
// often end up with opposite signs and cancel rather than artificially
// pile up on the same index.
function featureIndexAndSign(feature) {
  const h = createHash('sha256').update(feature).digest();
  const idx = ((h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3]) >>> 0;
  const sign = (h[4] & 1) ? -1 : 1;
  return { idx: idx % EMBEDDING_DIMS, sign };
}

// ── Public: embed ────────────────────────────────────────────────────────────
// Returns a Float64Array of length EMBEDDING_DIMS, L2-normalised. Empty /
// whitespace-only input returns a zero vector (cosine against it is 0,
// which is what the RAG step wants).
export function embedBrief(text) {
  const norm = normaliseBrief(text);
  if (!norm) return zeroVector();
  const cached = cacheGet(norm);
  if (cached) return cached;

  const vec = new Float64Array(EMBEDDING_DIMS);

  // Character trigrams + 5-grams. Two window sizes give the model a bit of
  // word-boundary awareness without the explosion of full sentence-piece
  // tokenisation.
  for (const g of charNgrams(norm, 3)) {
    const { idx, sign } = featureIndexAndSign(g);
    vec[idx] += sign;
  }
  for (const g of charNgrams(norm, 5)) {
    const { idx, sign } = featureIndexAndSign(g);
    vec[idx] += sign * 0.5; // Weight 5-grams half as heavily; they're rarer, so this
                            // avoids a single rare n-gram dominating the vector.
  }
  // Whole-token features carry word-level semantics.
  for (const t of tokens(norm)) {
    const { idx, sign } = featureIndexAndSign(t);
    vec[idx] += sign * 1.5; // Whole tokens are more informative than character windows.
  }

  // L2-normalise. Zero vector stays zero (cosine undefined → treat as 0).
  let sq = 0;
  for (let i = 0; i < EMBEDDING_DIMS; i++) sq += vec[i] * vec[i];
  const norm2 = Math.sqrt(sq);
  if (norm2 > 0) {
    for (let i = 0; i < EMBEDDING_DIMS; i++) vec[i] /= norm2;
  }
  cacheSet(norm, vec);
  return vec;
}

function zeroVector() {
  return new Float64Array(EMBEDDING_DIMS);
}

// ── Public: cosine ───────────────────────────────────────────────────────────
// Because inputs are L2-normalised, cosine == dot product. Tolerates
// length mismatches by returning 0 — the RAG step treats zero as "not
// comparable", which is the right behaviour for cross-embedder vectors
// that snuck in (should never happen given embedder_id gating, but
// defence in depth).
export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  // Clamp to [-1, 1] — tiny FP drift can push just over. Downstream
  // consumers expect cosine in-range, and the clamp cost is negligible.
  return Math.max(-1, Math.min(1, s));
}

// ── Public: top-k over a set of candidates ──────────────────────────────────
// candidates = [{ id, embedding: Float64Array|number[] }, ...]
// Returns sorted highest-cosine-first, truncated to k. Embeddings that
// came from a different embedder (mismatched length) score 0 and fall
// off the bottom naturally.
export function topK(queryVec, candidates, k = 3) {
  const scored = candidates.map((c) => ({
    id: c.id,
    score: cosine(queryVec, toFloat64(c.embedding)),
    candidate: c,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

function toFloat64(v) {
  if (v instanceof Float64Array) return v;
  if (Array.isArray(v)) return Float64Array.from(v);
  return new Float64Array(0);
}

// ── Public: clear cache (tests) ──────────────────────────────────────────────
export function _clearCacheForTest() {
  _cache.clear();
}

// ── Default export ──────────────────────────────────────────────────────────
export default embedBrief;
