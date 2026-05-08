// style-blend.mjs — Sprint 17 Task 33.1
// Spherical Linear Interpolation in the 8D style-embedding space.
// Used to produce continuous blends between catalog anchors so we can place a
// point like "70 % Swiss + 30 % Liminal" on the unit hypersphere instead of
// linearly averaging (which would muddy chroma + contrast).
//
// Pure, dep-free helper. No I/O beyond a one-time read of _embeddings.json
// (cached). Determinism is required: two identical (anchors, weights) inputs
// must always produce the same vector. No Math.random.
//
// Public API:
//   blend(anchorIds, weights, opts?) → { vector, anchors_used, clamps_applied, omegas_warning }
//   slerp2(a, b, t)                  → 8D vector (object form)
//   slerpN(anchors, weights)         → { vector, omega_max }
//   applyAccessibilityClamps(vector) → { vector, clamps_applied }
//   cosine8D(a, b)                   → number in [-1, 1]
//   loadEmbeddings(customPath?)      → { [id]: 8D-array }
//   AXES                             → canonical axis order

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const AXES = [
  'density',
  'chroma',
  'formality',
  'motion_intensity',
  'historicism',
  'texture',
  'contrast_energy',
  'type_drama',
];

// Numerical-stability cutoffs. Picked to avoid div-by-zero in sin(omega).
const OMEGA_LERP_FALLBACK = 0.001; // < 0.06° → linear
const OMEGA_WARN_HIGH = 2.5;        // ~143° → near-antipodal, blend gets muddy

// Accessibility floors applied AFTER slerp. These are hard hygiene minimums
// the catalog already enforces — slerping 50/50 between a low-chroma swiss
// and a low-chroma liminal can drag chroma below the palette-pop floor and
// produce a visually muddy gray, so we clamp.
const CHROMA_FLOOR = 0.15;
const CONTRAST_ENERGY_FLOOR = 0.30;

// motion_intensity gets quantized to 4 tiers (Static/Subtle/Expressive/Kinetic)
// so the resolver can pick a single tier rather than a fractional value.
const MOTION_TIERS = [0, 0.33, 0.66, 1.0];

let _embeddingsCache = null;
let _embeddingsCachePath = null;

// ── Embedding loader ───────────────────────────────────────────────────────

// Resolve default path lazily so tests can override or skip if the JSON is
// missing. Returns the `embeddings` map (id → array<8>), NOT the wrapper
// object — callers don't need the meta block for this work.
export function loadEmbeddings(customPath) {
  if (_embeddingsCache && _embeddingsCachePath === (customPath || null)) {
    return _embeddingsCache;
  }
  let path = customPath;
  if (!path) {
    const __filename = fileURLToPath(import.meta.url);
    path = resolve(
      dirname(__filename),
      '..',
      '..',
      '..',
      'skills',
      'visionary',
      'styles',
      '_embeddings.json'
    );
  }
  if (!existsSync(path)) {
    _embeddingsCache = {};
    _embeddingsCachePath = customPath || null;
    return _embeddingsCache;
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    // _embeddings.json wraps the map in `embeddings`. Tolerate either shape so
    // tests can inject a flat fixture map directly.
    _embeddingsCache = raw && raw.embeddings && typeof raw.embeddings === 'object'
      ? raw.embeddings
      : raw;
  } catch {
    _embeddingsCache = {};
  }
  _embeddingsCachePath = customPath || null;
  return _embeddingsCache;
}

// Test/utility: drop the cache so consecutive loads with different paths
// behave as expected. Production code should not need this.
export function _resetEmbeddingsCache() {
  _embeddingsCache = null;
  _embeddingsCachePath = null;
}

// ── Vector helpers ─────────────────────────────────────────────────────────

export function vectorToArray(v) {
  if (Array.isArray(v)) return v.slice(0, AXES.length);
  return AXES.map((k) => Number(v[k]) || 0);
}

export function arrayToVector(arr) {
  const v = {};
  AXES.forEach((k, i) => {
    v[k] = Number(arr[i]) || 0;
  });
  return v;
}

function magnitude(arr) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i] * arr[i];
  return Math.sqrt(s);
}

function normalize(arr) {
  const m = magnitude(arr);
  if (m === 0) return arr.slice();
  return arr.map((x) => x / m);
}

function dot(a, b) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

export function cosine8D(a, b) {
  const aArr = vectorToArray(a);
  const bArr = vectorToArray(b);
  const ma = magnitude(aArr);
  const mb = magnitude(bArr);
  if (ma === 0 || mb === 0) return 0;
  return dot(aArr, bArr) / (ma * mb);
}

// ── Slerp ──────────────────────────────────────────────────────────────────
//
// Standard 2-anchor slerp:
//   slerp(p0, p1, t) = sin((1-t)·Ω)/sin(Ω) · p0  +  sin(t·Ω)/sin(Ω) · p1
//   where Ω = arccos((p0 · p1) / (|p0|·|p1|))
//
// Inputs may be arrays or {axis: number} objects; output mirrors p0's shape
// only when both inputs are objects, else returns array. Internally we work
// in array-space and on the unit sphere; we re-normalize before returning so
// numerical drift doesn't accumulate when slerpN composes pairwise.

export function slerp2(a, b, t) {
  const wantObject = !Array.isArray(a) && !Array.isArray(b);
  const aArr = vectorToArray(a);
  const bArr = vectorToArray(b);

  // Project both onto the unit sphere — embeddings.json vectors are NOT
  // unit-norm (axes ∈ [0,1]), so without this the angle math is meaningless.
  const aN = normalize(aArr);
  const bN = normalize(bArr);

  const cosOmega = Math.max(-1, Math.min(1, dot(aN, bN)));
  const omega = Math.acos(cosOmega);

  let outN;
  if (omega < OMEGA_LERP_FALLBACK) {
    // Vectors near-parallel → sin(Ω) ≈ 0, slerp is numerically unstable.
    // Linear interpolation is the well-defined limit and visually identical.
    outN = aN.map((v, i) => v * (1 - t) + bN[i] * t);
  } else {
    const sinOmega = Math.sin(omega);
    const c0 = Math.sin((1 - t) * omega) / sinOmega;
    const c1 = Math.sin(t * omega) / sinOmega;
    outN = aN.map((v, i) => v * c0 + bN[i] * c1);
  }

  // Map back to the [0,1] axis-space we actually live in. We pick the average
  // of input magnitudes weighted by t — this preserves the "halfway between
  // two points in the cube" intuition while keeping the angle from slerp.
  const targetMag = magnitude(aArr) * (1 - t) + magnitude(bArr) * t;
  const outMag = magnitude(outN);
  const scaled = outMag === 0 ? outN : outN.map((v) => (v / outMag) * targetMag);

  return wantObject ? arrayToVector(scaled) : scaled;
}

// N-anchor slerp via successive pairwise composition.
//
// Recipe:
//   slerpN([A, B, C], [w_a, w_b, w_c]) =
//     slerp(slerp(A, B, w_b / (w_a + w_b)), C, w_c)
//
// This is O(N) and stable for ≤ 5 anchors per the sprint plan. Weights are
// auto-normalized so callers don't need to worry about their sum being 1.0.
// Returns the blended vector (object form) plus omega_max — the largest
// pairwise angle encountered, so callers can decide whether to surface a
// near-antipodal warning to the user.

export function slerpN(anchors, weights) {
  if (!Array.isArray(anchors) || anchors.length === 0) {
    throw new Error('slerpN: anchors must be a non-empty array');
  }
  if (!Array.isArray(weights) || weights.length !== anchors.length) {
    throw new Error('slerpN: weights must be an array of the same length as anchors');
  }
  // Normalize weights. Negative or zero weights are not meaningful here.
  const cleanWeights = weights.map((w) => Math.max(0, Number(w) || 0));
  const total = cleanWeights.reduce((s, w) => s + w, 0);
  if (total === 0) {
    throw new Error('slerpN: weights sum to zero');
  }
  const wNorm = cleanWeights.map((w) => w / total);

  // Trivial case
  if (anchors.length === 1) {
    return { vector: arrayToVector(vectorToArray(anchors[0])), omega_max: 0 };
  }

  let omegaMax = 0;
  let acc = vectorToArray(anchors[0]);
  let accWeight = wNorm[0];

  for (let i = 1; i < anchors.length; i++) {
    const next = vectorToArray(anchors[i]);
    const nextWeight = wNorm[i];
    const sumWeight = accWeight + nextWeight;
    // t = how much we shift FROM acc TOWARD next.
    // If acc has weight 0.7 and next has 0.3, we shift 30 % of the way.
    const t = sumWeight === 0 ? 0 : nextWeight / sumWeight;

    // Track angle in unit-sphere space for the warning.
    const accN = normalize(acc);
    const nextN = normalize(next);
    const cosOmega = Math.max(-1, Math.min(1, dot(accN, nextN)));
    omegaMax = Math.max(omegaMax, Math.acos(cosOmega));

    acc = slerp2(acc, next, t);
    accWeight = sumWeight;
  }

  return { vector: arrayToVector(acc), omega_max: omegaMax };
}

// ── Accessibility clamps ───────────────────────────────────────────────────
//
// Slerp can drop chroma or contrast_energy below catalog hygiene minimums
// (e.g. blending two low-chroma styles ≠ a low-chroma blend; it can be even
// duller). These clamps preserve the catalog's a11y/aesthetic floor.
//
// motion_intensity is also quantized here — the resolver downstream picks
// from { Static, Subtle, Expressive, Kinetic } and fractional values need to
// snap to one of those tiers.

export function applyAccessibilityClamps(input) {
  const v = Array.isArray(input) ? arrayToVector(input) : { ...input };
  const clamps_applied = [];

  if (typeof v.chroma === 'number' && v.chroma < CHROMA_FLOOR) {
    v.chroma = CHROMA_FLOOR;
    clamps_applied.push('chroma');
  }
  if (typeof v.contrast_energy === 'number' && v.contrast_energy < CONTRAST_ENERGY_FLOOR) {
    v.contrast_energy = CONTRAST_ENERGY_FLOOR;
    clamps_applied.push('contrast_energy');
  }
  if (typeof v.motion_intensity === 'number') {
    const original = v.motion_intensity;
    const snapped = nearestTier(original, MOTION_TIERS);
    if (snapped !== original) {
      v.motion_intensity = snapped;
      clamps_applied.push('motion_intensity');
    }
  }
  // Defensive [0, 1] bounds on every axis. Slerp shouldn't escape this range
  // in practice, but mismatched anchor shapes could push us slightly past.
  for (const k of AXES) {
    if (typeof v[k] === 'number') {
      if (v[k] < 0) {
        v[k] = 0;
        if (!clamps_applied.includes(k)) clamps_applied.push(`${k}_lower`);
      } else if (v[k] > 1) {
        v[k] = 1;
        if (!clamps_applied.includes(k)) clamps_applied.push(`${k}_upper`);
      }
    }
  }
  return { vector: v, clamps_applied };
}

function nearestTier(value, tiers) {
  let best = tiers[0];
  let bestDiff = Math.abs(value - tiers[0]);
  for (let i = 1; i < tiers.length; i++) {
    const d = Math.abs(value - tiers[i]);
    if (d < bestDiff) {
      bestDiff = d;
      best = tiers[i];
    }
  }
  return best;
}

// ── Public blend() ─────────────────────────────────────────────────────────
//
// The thing the rest of the system actually calls. Looks up each anchor in
// _embeddings.json (or a custom embeddings map for tests), runs slerpN,
// applies a11y clamps, and returns a structured result that the receipt
// schema can serialize.

export function blend(anchorIds, weights, opts = {}) {
  if (!Array.isArray(anchorIds) || anchorIds.length === 0) {
    throw new Error('blend: anchorIds must be a non-empty array');
  }
  if (!Array.isArray(weights) || weights.length !== anchorIds.length) {
    throw new Error('blend: weights must be an array of the same length as anchorIds');
  }

  const embeddings = opts.embeddings || loadEmbeddings(opts.embeddingsPath);

  const anchorVectors = [];
  for (const id of anchorIds) {
    const vec = embeddings[id];
    if (!vec) {
      throw new Error(`blend: unknown anchor id "${id}" — not present in embeddings`);
    }
    anchorVectors.push(vec);
  }

  const { vector: rawVector, omega_max } = slerpN(anchorVectors, weights);
  const { vector: clampedVector, clamps_applied } = applyAccessibilityClamps(rawVector);

  return {
    vector: clampedVector,
    anchors_used: anchorIds.map((id, i) => ({ id, weight: weights[i] })),
    clamps_applied,
    omegas_warning: omega_max > OMEGA_WARN_HIGH,
    omega_max,
  };
}
