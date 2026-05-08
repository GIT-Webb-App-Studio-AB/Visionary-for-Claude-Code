// verbalized-sampling.mjs — Sprint 16 Task 31.1
//
// Stage 1.5 of the visionary pipeline. Three responsibilities:
//
//   1. validateVsOutput() — parse the model's response and validate it
//      against verbalized-sampling.schema.json. Returns a structured
//      {ok, errors} so the caller can decide retry vs skip.
//
//   2. detectConvergence() — token-set Jaccard similarity between the 5
//      `concept` strings. If 3+ pairs exceed the threshold, the 5
//      concepts are too similar and the caller should re-prompt with
//      an explicit divergence instruction.
//
//   3. pickWithAntiTypicality() — weighted random pick over the 5
//      concepts, boosting low-probability candidates by `prob^(1-alpha)`
//      with alpha = 0.65 default. Boost factor is capped at 1.6x and
//      deboost floor at 0.6x relative to the raw probability. This
//      implements the Zhang 2025 anti-typicality formula in 1D.
//
// No external deps — only Node native and the existing validate-schema.mjs
// helper. The same minimal-deps convention as slop-directives.mjs.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validate as validateSchema } from './validate-schema.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..', '..');
const DEFAULT_SCHEMA_PATH = resolve(
  repoRoot,
  'skills',
  'visionary',
  'schemas',
  'verbalized-sampling.schema.json',
);

// ── Public: validate VS output against schema ───────────────────────────────
//
// `jsonText` is either a raw string from the model OR an already-parsed
// object (callers that did their own JSON.parse pass the object). We
// accept both so the function is symmetric with the rest of the lib.
//
// Returns:
//   { ok: true,  errors: [], data }
//   { ok: false, errors: [{ path, message }] }
//
// On JSON.parse failure the error path is "/" and message is "invalid JSON".
// On schema validation failure errors come from validate-schema.mjs and
// have the JSON-pointer-style path consumed by the rest of the codebase.
export function validateVsOutput(jsonText, schemaPath = DEFAULT_SCHEMA_PATH) {
  let data;
  if (typeof jsonText === 'string') {
    try {
      data = JSON.parse(jsonText);
    } catch (err) {
      return {
        ok: false,
        errors: [{ path: '/', message: `invalid JSON: ${err.message}` }],
      };
    }
  } else if (jsonText && typeof jsonText === 'object') {
    data = jsonText;
  } else {
    return {
      ok: false,
      errors: [{ path: '/', message: 'expected string or object input' }],
    };
  }

  let schema;
  try {
    schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  } catch (err) {
    return {
      ok: false,
      errors: [{ path: '/', message: `cannot read schema: ${err.message}` }],
    };
  }

  const result = validateSchema(data, schema);
  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }

  // Soft additional check: probabilities should sum to ~1.0 within
  // tolerance. We surface this as a non-fatal warning rather than a
  // schema error so the caller can still pick (the runtime normalises
  // the weights inside pickWithAntiTypicality).
  const sum = data.concepts.reduce((acc, c) => acc + c.probability, 0);
  const probabilitySum = Number(sum.toFixed(4));
  return { ok: true, errors: [], data, probabilitySum };
}

// ── Public: convergence detection over the 5 concept strings ────────────────
//
// Computes pairwise Jaccard similarity between the token sets of each
// `concept` field. If 3+ pairs exceed the threshold (default 0.7), the 5
// concepts are too similar — the caller should re-prompt with an
// explicit divergence instruction.
//
// Why 3+ pairs (not just 1): 5 concepts have C(5,2) = 10 pairs. A single
// high-similarity pair is fine (two related interpretations is not the
// same as catastrophic convergence). Three pairs means at least one
// "cluster" of 3 near-identical concepts; that's the actual failure
// mode the convergence-check exists to catch.
//
// Returns: { converged: boolean, similarPairs: [[i, j, similarity], ...] }
export function detectConvergence(concepts, threshold = 0.7) {
  if (!Array.isArray(concepts) || concepts.length < 2) {
    return { converged: false, similarPairs: [] };
  }
  const tokens = concepts.map((c) => tokenize(c?.concept ?? ''));
  const similarPairs = [];
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const sim = jaccard(tokens[i], tokens[j]);
      if (sim > threshold) similarPairs.push([i, j, Number(sim.toFixed(4))]);
    }
  }
  return {
    converged: similarPairs.length >= 3,
    similarPairs,
  };
}

// ── Public: anti-typicality weighted random pick ────────────────────────────
//
// Formula:  weight_i = probability_i ^ (1 - alpha)
//
//   probability=0.10, alpha=0.65 → weight = 0.10^0.35 ≈ 0.45
//     (raw 0.10, boosted 4.5x in absolute weight; pick-rate boost ~1.5x
//     after re-normalisation against the rest of the field)
//   probability=0.40, alpha=0.65 → weight = 0.40^0.35 ≈ 0.72
//     (raw 0.40, deboosted to 0.72; pick-rate deboost ~0.85x)
//
// The cap mechanism keeps the pick-rate boost factor in [1/boostCap,
// boostCap]. We compute the effective pick-rate (post-normalisation
// weight relative to raw probability) per candidate and clamp it. This
// prevents pathological inputs (a single 0.001 concept) from getting an
// absurd lift while still allowing the 0.10–0.20 sweet-spot to receive
// the intended 1.3–1.6x boost.
//
// Returns: { index, boostFactor, weights, normalisedWeights }
//   - index: chosen index in concepts array
//   - boostFactor: pick-rate boost relative to raw probability for the
//     chosen candidate (after capping)
//   - weights: raw boosted weights (pre-normalisation)
//   - normalisedWeights: pick-rate distribution (sums to 1)
export function pickWithAntiTypicality(
  concepts,
  alpha = 0.65,
  boostCap = 1.6,
  rng = Math.random,
) {
  if (!Array.isArray(concepts) || concepts.length === 0) {
    throw new Error('pickWithAntiTypicality: empty concepts array');
  }
  const probs = concepts.map((c) => Number(c?.probability ?? 0));
  const totalProb = probs.reduce((a, b) => a + b, 0) || 1;
  const normalisedProbs = probs.map((p) => p / totalProb);

  // Raw boosted weights: prob^(1 - alpha)
  // Edge case: alpha = 1 → weight = 1 for all, uniform pick (full
  // anti-typicality). alpha = 0 → weight = prob, no anti-typicality
  // (typical pick). Default alpha = 0.65 gives the Zhang 2025 sweet
  // spot. probability = 0 candidates get weight 0 (unpickable, which
  // is correct — model said "I'd never pick this").
  const exponent = 1 - alpha;
  const rawWeights = normalisedProbs.map((p) => (p > 0 ? Math.pow(p, exponent) : 0));
  const totalRaw = rawWeights.reduce((a, b) => a + b, 0) || 1;
  const rawNormalised = rawWeights.map((w) => w / totalRaw);

  // Apply boost cap: per-candidate pick-rate boost factor must end up
  // in [1/boostCap, boostCap] AFTER renormalisation. The naive path
  // (cap raw factors → renormalise → done) lets the cap drift because
  // renormalisation rescales remaining weights upward when capped
  // weights shrink. We therefore iterate: cap, renormalise, recheck;
  // a fixed-point converges in 1-3 passes for any realistic input.
  const floor = 1 / boostCap;
  let weights = rawNormalised.slice();
  for (let iter = 0; iter < 8; iter++) {
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    const normalised = weights.map((w) => w / total);
    let changed = false;
    for (let i = 0; i < weights.length; i++) {
      const p = normalisedProbs[i];
      if (p === 0) { weights[i] = 0; continue; }
      const factor = normalised[i] / p;
      if (factor > boostCap) {
        // Want normalised[i] = p * boostCap. Solve for the absolute
        // weight by mirroring the renormalisation: set raw weight so
        // that after dividing by current total we land on the target.
        weights[i] = p * boostCap * total;
        changed = true;
      } else if (factor < floor && p > 0) {
        weights[i] = p * floor * total;
        changed = true;
      }
    }
    if (!changed) break;
  }
  const cappedWeights = weights;
  const totalCapped = cappedWeights.reduce((a, b) => a + b, 0) || 1;
  const normalisedWeights = cappedWeights.map((w) => w / totalCapped);

  // Weighted random pick over normalisedWeights
  const r = rng();
  let cumulative = 0;
  let chosenIndex = normalisedWeights.length - 1;
  for (let i = 0; i < normalisedWeights.length; i++) {
    cumulative += normalisedWeights[i];
    if (r <= cumulative) { chosenIndex = i; break; }
  }

  // Boost factor reported back is the post-cap, post-normalisation
  // pick-rate divided by raw probability. Caller logs this in the
  // receipt for replay/debug.
  const chosenProb = normalisedProbs[chosenIndex];
  const chosenPickRate = normalisedWeights[chosenIndex];
  const boostFactor =
    chosenProb > 0 ? Number((chosenPickRate / chosenProb).toFixed(4)) : 0;

  return {
    index: chosenIndex,
    boostFactor,
    weights: cappedWeights,
    normalisedWeights,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function tokenize(text) {
  return new Set(String(text || '').toLowerCase().match(/\w+/g) || []);
}

function jaccard(a, b) {
  if (!(a instanceof Set) || !(b instanceof Set)) return 0;
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Exported for tests — keeps the helpers private to the module surface
// but lets the test suite verify the primitives directly.
export const _internals = { tokenize, jaccard };
