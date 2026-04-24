// Orthogonal variants selection — Sprint 4 Task 11.2.
//
// Pure, dep-free helper consumed by commands/variants.md. The command runs as
// a Claude prompt, but the deterministic work (cosine-distance filtering) is
// better in JS: the math is trivial but the algorithm has three failure
// branches that are easier to get right in code than in prose.
//
// Contract:
//
//   pickOrthogonalVariants({ ranked, embeddings, distanceFloor, relaxSteps })
//     → { variants: [id, id, id], thresholds: [0.6, t2, t3], notes: [...] }
//
// ranked          Array of candidates sorted by Stage-4 score descending.
//                 Each entry must have { id, score, category } at minimum.
// embeddings      Object keyed by style id → 8-d vector (0..1). From
//                 skills/visionary/styles/_embeddings.json#embeddings.
// distanceFloor   Minimum cosine distance between picked variants. Sprint-4
//                 plan specifies 0.6. Lower values converge onto similar
//                 aesthetics; higher values starve the candidate pool.
// relaxSteps      Fallback thresholds to try when the strict floor produces
//                 an empty pool. Sprint plan: [0.5, 0.4]. After relaxSteps
//                 are exhausted, the algorithm falls back to "three nearest
//                 post-v1" and surfaces a note to the caller.
//
// Determinism: no Math.random. Stable tie-break (first-in-ranked wins). The
// caller owns the randomisation that happened upstream (weighted-random
// already applied when building `ranked`).

import { cosineDistance } from '../../../scripts/build-style-embeddings.mjs';

// Sprint-4 Task 11.2 defaults. Named so they can be referenced / overridden
// from tests without hardcoding magic numbers elsewhere.
export const DEFAULT_DISTANCE_FLOOR = 0.6;
export const DEFAULT_RELAX_STEPS = [0.5, 0.4];

// Entry point ───────────────────────────────────────────────────────────────
export function pickOrthogonalVariants({
  ranked = [],
  embeddings = {},
  distanceFloor = DEFAULT_DISTANCE_FLOOR,
  relaxSteps = DEFAULT_RELAX_STEPS,
} = {}) {
  if (!Array.isArray(ranked) || ranked.length === 0) {
    return empty('no_ranked_input');
  }
  if (!embeddings || typeof embeddings !== 'object') {
    return empty('no_embeddings_input');
  }

  const v1 = ranked[0];
  if (!v1 || !embeddings[v1.id]) {
    return empty('v1_embedding_missing');
  }

  const notes = [];

  // Pool for v2: strict floor against v1.
  const v2 = pickNext({
    ranked: ranked.slice(1),
    picked: [v1],
    embeddings,
    threshold: distanceFloor,
    relaxSteps,
    notes,
    slot: 'v2',
  });
  if (!v2) {
    return {
      variants: [v1.id],
      thresholds: [distanceFloor],
      notes: [...notes, 'v2_fallback_exhausted — returning single variant'],
      policy: 'collapsed',
    };
  }

  // Pool for v3: must clear the threshold against BOTH v1 and v2.
  const v3 = pickNext({
    ranked: ranked.filter((c) => c.id !== v1.id && c.id !== v2.id),
    picked: [v1, v2],
    embeddings,
    threshold: distanceFloor,
    relaxSteps,
    notes,
    slot: 'v3',
  });

  if (!v3) {
    return {
      variants: [v1.id, v2.id],
      thresholds: [distanceFloor, notes.find((n) => n.startsWith('v2_threshold='))?.split('=')[1] || distanceFloor, null],
      notes: [...notes, 'v3_fallback_exhausted — returning two variants'],
      policy: 'collapsed',
    };
  }

  return {
    variants: [v1.id, v2.id, v3.id],
    thresholds: [
      distanceFloor,
      inferUsedThreshold(notes, 'v2'),
      inferUsedThreshold(notes, 'v3'),
    ],
    notes,
    policy: 'orthogonal',
    pairwise_distances: {
      v1_v2: cosineDistance(embeddings[v1.id], embeddings[v2.id]),
      v1_v3: cosineDistance(embeddings[v1.id], embeddings[v3.id]),
      v2_v3: cosineDistance(embeddings[v2.id], embeddings[v3.id]),
    },
  };
}

// Pick the next variant that clears the given threshold against ALL prior
// picks. On empty pool, try relaxed thresholds. On final emptiness return
// null and let the caller decide whether to collapse to fewer variants.
function pickNext({ ranked, picked, embeddings, threshold, relaxSteps, notes, slot }) {
  const thresholds = [threshold, ...relaxSteps];
  for (const t of thresholds) {
    const hit = ranked.find((c) => {
      if (!embeddings[c.id]) return false;
      return picked.every((p) => cosineDistance(embeddings[c.id], embeddings[p.id]) >= t);
    });
    if (hit) {
      if (t !== threshold) {
        notes.push(`${slot}_threshold_relaxed_from=${threshold}`);
        notes.push(`${slot}_threshold_used=${t}`);
      } else {
        notes.push(`${slot}_threshold=${t}`);
      }
      return hit;
    }
  }
  // Last resort before null: the "three nearest post-v1" fallback — pick the
  // highest-ranked candidate regardless of distance. Only for v3 (v2 collapse
  // is more serious and we leave that to the caller).
  if (slot === 'v3' && ranked.length > 0) {
    for (const c of ranked) {
      if (!embeddings[c.id]) continue;
      notes.push(`${slot}_threshold_disabled — distance floor unreachable, picked top ranked`);
      return c;
    }
  }
  return null;
}

function inferUsedThreshold(notes, slot) {
  for (const n of notes) {
    if (n.startsWith(`${slot}_threshold_used=`)) return parseFloat(n.split('=')[1]);
    if (n.startsWith(`${slot}_threshold=`)) return parseFloat(n.split('=')[1]);
  }
  return null;
}

function empty(reason) {
  return { variants: [], thresholds: [], notes: [reason], policy: 'failed' };
}

// ── Reporting helper ───────────────────────────────────────────────────────
// Produces a one-line summary the /variants command can echo back to the
// user so they understand why a specific trio was picked. Stable phrasing
// so tests can regex over it.
export function summariseSelection(result) {
  if (!result || !result.variants || result.variants.length === 0) {
    return `orthogonal-variants: NO SELECTION (${(result?.notes || []).join('; ') || 'unknown'})`;
  }
  const pd = result.pairwise_distances;
  const dists = pd
    ? ` — pairwise d=[${pd.v1_v2.toFixed(2)}, ${pd.v1_v3.toFixed(2)}, ${pd.v2_v3.toFixed(2)}]`
    : '';
  return `orthogonal-variants: ${result.variants.join(' / ')} (${result.policy})${dists}`;
}

// Average pairwise distance — consumed by the sprint-4 acceptance test
// "On 10 /variants-körningar: genomsnittlig pairwise cosine distance >= 0.5".
export function averagePairwiseDistance(variants, embeddings) {
  if (!Array.isArray(variants) || variants.length < 2) return 0;
  const validVecs = variants.map((id) => embeddings[id]).filter(Array.isArray);
  if (validVecs.length < 2) return 0;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < validVecs.length; i++) {
    for (let j = i + 1; j < validVecs.length; j++) {
      sum += cosineDistance(validVecs[i], validVecs[j]);
      n++;
    }
  }
  return n === 0 ? 0 : sum / n;
}
