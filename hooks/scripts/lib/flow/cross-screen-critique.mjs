// cross-screen-critique.mjs — Sprint 22 Task 40.2
//
// Specialized critic measuring CROSS-SCREEN consistency, NOT per-screen
// quality. Per-screen quality is already covered by the visual-critic loop in
// hooks/scripts/capture-and-critique.mjs. This module measures DRIFT between
// the 5 states of a single feature so a flow reads as one coherent product
// instead of five independent generations.
//
// Drift dimensions (4):
//   - palette  — mean ΔE in oklch space between dominant colours
//   - motion   — dominant duration-band difference (token-extracted from CSS)
//   - density  — white-space-ratio difference per viewport
//   - tone     — semantic embedding distance (1 - cosine similarity)
//
// State-typ-aware tolerances acknowledge that legitimate variation exists:
//   - loading skeleton SHOULD be more muted than list (intentional)
//   - error state MAY have a red-accent without violating palette coherence
//   - empty state MAY have lower density (illustration + headline)
//
// Reference: docs/sprints/sprint-22-cross-screen-voice.md Task 40.2

// ─── State-pair tolerances ──────────────────────────────────────────────────
// Drift on any dimension exceeding the tolerance counts as a violation. These
// numbers are hand-calibrated for the typical Visionary aesthetic range; they
// are *deliberately* asymmetric across pairs to encode design intuition.
//
// Lookup is symmetric: STATE_PAIR_TOLERANCES['list-loading'] =
// STATE_PAIR_TOLERANCES['loading-list']. The scorer normalises by sorting the
// pair-key alphabetically before lookup.
export const STATE_PAIR_TOLERANCES = {
  'list-detail': { palette: 0.05, motion: 0.10, density: 0.20, tone: 0.10 },
  'list-empty': { palette: 0.10, motion: 0.15, density: 0.30, tone: 0.05 },
  'list-error': { palette: 0.15, motion: 0.10, density: 0.25, tone: 0.10 },
  'list-loading': { palette: 0.20, motion: 0.30, density: 0.15, tone: 0.20 },
  'detail-empty': { palette: 0.10, motion: 0.15, density: 0.30, tone: 0.05 },
  'detail-error': { palette: 0.15, motion: 0.10, density: 0.25, tone: 0.10 },
  'detail-loading': { palette: 0.20, motion: 0.30, density: 0.15, tone: 0.20 },
  'empty-error': { palette: 0.10, motion: 0.10, density: 0.20, tone: 0.05 },
  'empty-loading': { palette: 0.15, motion: 0.20, density: 0.20, tone: 0.15 },
  'error-loading': { palette: 0.15, motion: 0.20, density: 0.20, tone: 0.15 },
};

// Default tolerance when a pair isn't in the table (defensive — should never
// fire for the 5 canonical states but keeps the function total).
const DEFAULT_TOLERANCE = { palette: 0.10, motion: 0.10, density: 0.20, tone: 0.10 };

const DRIFT_DIMENSIONS = ['palette', 'motion', 'density', 'tone'];

// Scoring weights: each violation costs this much off a starting score of 10.
const VIOLATION_PENALTY = 1.5;
const STARTING_SCORE = 10;

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Compute drift between two states on the four canonical dimensions.
 *
 * @param {string} stateA
 * @param {string} stateB
 * @param {object} dataA — { palette: oklch[], motion_score, density_score, tone_embedding }
 * @param {object} dataB — same shape
 * @returns {{palette: number, motion: number, density: number, tone: number}}
 */
export function computeStateDrift(stateA, stateB, dataA, dataB) {
  return {
    palette: paletteDistance(dataA.palette, dataB.palette),
    // motion_score is on a 0-10 scale internally; normalise to 0-1 for
    // comparison with the other dimensions and the tolerance table.
    motion: Math.abs((dataA.motion_score || 0) - (dataB.motion_score || 0)) / 10,
    density: Math.abs((dataA.density_score || 0) - (dataB.density_score || 0)) / 10,
    tone: 1 - cosine(dataA.tone_embedding, dataB.tone_embedding),
  };
}

/**
 * Score the cross-screen consistency of a flow.
 *
 * @param {Record<string, object>} stateData — keyed by state name. Each value
 *   carries { palette, motion_score, density_score, tone_embedding }.
 * @returns {{
 *   score: number,            // 0..10 (higher = more coherent)
 *   violations: Array,        // every drift>tolerance entry
 *   top_drifts: Array,        // top-3 worst (drift - tolerance), DESC
 *   pairs: Array              // one entry per C(n,2) pair
 * }}
 */
export function scoreCrossScreenConsistency(stateData) {
  const states = Object.keys(stateData);
  const pairs = [];
  const violations = [];

  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const sA = states[i];
      const sB = states[j];
      const pairKey = `${sA}-${sB}`;
      const tolerances = lookupTolerance(sA, sB);
      const drift = computeStateDrift(sA, sB, stateData[sA], stateData[sB]);
      pairs.push({ pair: pairKey, drift, tolerances });

      for (const dim of DRIFT_DIMENSIONS) {
        if (drift[dim] > tolerances[dim]) {
          violations.push({
            pair: pairKey,
            dim,
            drift: drift[dim],
            tolerance: tolerances[dim],
          });
        }
      }
    }
  }

  // Top-3 sorted DESC by how much the drift OVER-shoots its tolerance. This
  // prioritises the worst offenders rather than the largest absolute drift —
  // a 0.5 motion-drift on list-loading (tolerance 0.30) is less serious than
  // a 0.3 motion-drift on list-detail (tolerance 0.10).
  const top_drifts = violations
    .slice()
    .sort((a, b) => (b.drift - b.tolerance) - (a.drift - a.tolerance))
    .slice(0, 3);

  const score = Math.max(0, STARTING_SCORE - violations.length * VIOLATION_PENALTY);

  return { score, violations, top_drifts, pairs };
}

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Pair tolerance is symmetric: look up `${a}-${b}`, then `${b}-${a}`, then
 * fall back to the default. This keeps callers from having to know the
 * canonical order.
 */
function lookupTolerance(a, b) {
  return (
    STATE_PAIR_TOLERANCES[`${a}-${b}`] ||
    STATE_PAIR_TOLERANCES[`${b}-${a}`] ||
    DEFAULT_TOLERANCE
  );
}

/**
 * Mean-channel ΔE in oklch space between two palettes. We treat each palette
 * as a multiset of oklch triples and compute the mean Euclidean distance over
 * the [L, C, h] axes after pairing each colour in `a` with its nearest in `b`.
 *
 * For empty / non-array inputs returns 0 (no drift detectable). For mismatched
 * lengths we use min(len) — extra colours in either palette are ignored.
 *
 * Each oklch entry is { l: 0..1, c: 0..0.4, h: 0..360 }. Hue is normalised to
 * the unit circle to avoid 359° vs 1° reading as far apart.
 */
function paletteDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return 0;
  }

  // For each colour in `a`, find the closest colour in `b`. Sum, then mean.
  let totalDist = 0;
  let count = 0;
  for (const cA of a) {
    let best = Infinity;
    for (const cB of b) {
      const d = oklchDistance(cA, cB);
      if (d < best) best = d;
    }
    if (Number.isFinite(best)) {
      totalDist += best;
      count++;
    }
  }
  if (count === 0) return 0;
  return totalDist / count;
}

function oklchDistance(c1, c2) {
  const l1 = num(c1.l, 0);
  const l2 = num(c2.l, 0);
  const ch1 = num(c1.c, 0);
  const ch2 = num(c2.c, 0);
  // Hue diff folded to [0, 180] so 359↔1 is small.
  const h1 = num(c1.h, 0);
  const h2 = num(c2.h, 0);
  let dh = Math.abs(h1 - h2) % 360;
  if (dh > 180) dh = 360 - dh;
  // Normalise hue contribution to roughly the same scale as L/C.
  const dhNorm = dh / 360;
  return Math.sqrt((l1 - l2) ** 2 + (ch1 - ch2) ** 2 + dhNorm ** 2);
}

/**
 * Cosine similarity between two equal-length numeric vectors.
 * Returns 1 (identical direction) for identical or both-zero inputs, 0 for
 * orthogonal / undefined cases. Caller converts to distance via 1 - cosine.
 */
function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    // No tone-embedding available → assume identical (no drift signal).
    return 1;
  }
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < n; i++) {
    const x = num(a[i], 0);
    const y = num(b[i], 0);
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function num(v, fallback) {
  return Number.isFinite(v) ? v : fallback;
}
