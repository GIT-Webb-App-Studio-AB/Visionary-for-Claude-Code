// coordinator.mjs — Sprint 23 Task 42.4
// Coordinates circadian + network + patina runtime mechanisms.
// Resolves conflicts via deterministic precedence:
//   prefers-reduced-motion / prefers-color-scheme (system)
//     > network-budget (urgency)
//     > circadian (time)
//     > patina (age)
//
// Combined drift cap: total drift from base may not exceed 15% in any dimension.

import { getCurrentPhase, generateCircadianRuntimeSnippet } from './circadian.mjs';
import { applyPatina } from './patina.mjs';
import { generateNetworkRuntimeSnippet } from './network-aware.mjs';

export const PRECEDENCE = ['system_pref', 'network', 'circadian', 'patina'];

/** Cap on combined drift from any single dimension, expressed as fraction of base value. */
export const COMBINED_DRIFT_CAP = 0.15;

/**
 * Clamp drifted tokens so no single token has shifted more than 15% from base.
 * Returns the clamped tokens plus a list of clamped keys.
 */
function clampCombinedDrift(baseTokens, drifted) {
  const out = { ...drifted };
  const clamped = [];
  for (const [key, baseVal] of Object.entries(baseTokens)) {
    if (typeof baseVal !== 'number' || baseVal === 0) continue;
    const driftedVal = out[key];
    if (typeof driftedVal !== 'number') continue;
    const delta = driftedVal - baseVal;
    const maxDelta = Math.abs(baseVal) * COMBINED_DRIFT_CAP;
    if (Math.abs(delta) > maxDelta) {
      out[key] = baseVal + Math.sign(delta) * maxDelta;
      clamped.push({ token: key, original_drift: delta, clamped_to: out[key] - baseVal });
    }
  }
  return { tokens: out, clamped };
}

/**
 * resolveRuntimeContext(opts) → { tokens, trace, clamped }
 *
 * Build-time resolution: applies patina drift to baseTokens, records circadian phase
 * (palette-shift is applied client-side), and records network tier (also client-side).
 * The combined-drift-cap clamps any token that drifted >15% from base.
 */
export function resolveRuntimeContext({
  baseTokens,
  enableCircadian = false,
  enableNetwork = false,
  enablePatina = false,
  fileAgeMonths = 0,
  freezePatina = null,
  date = new Date(),
  lat = 60,
} = {}) {
  if (!baseTokens || typeof baseTokens !== 'object') {
    throw new Error('resolveRuntimeContext: baseTokens object required');
  }
  const trace = [];
  let tokens = { ...baseTokens };

  // Layer 1 — Patina (oldest, most diffuse): build-time, modifies numeric tokens directly.
  if (enablePatina && fileAgeMonths > 0) {
    const result = applyPatina({ baseTokens: tokens, ageMonths: fileAgeMonths, freezeAt: freezePatina });
    tokens = result.drifted;
    trace.push({
      layer: 'patina',
      effective_age: result.effectiveAge,
      drifts_applied: result.drifts_applied,
      floors_hit: result.floors_hit,
    });
  }

  // Layer 2 — Circadian: client-side palette overlay. Records phase only.
  if (enableCircadian) {
    const phase = getCurrentPhase(date, lat);
    trace.push({ layer: 'circadian', phase, note: 'palette-shift applied at runtime' });
  }

  // Layer 3 — Network: client-side class on <html>. Records intent only.
  if (enableNetwork) {
    trace.push({ layer: 'network', note: 'tier resolved at runtime via navigator.connection' });
  }

  // Combined drift cap.
  const { tokens: capped, clamped } = clampCombinedDrift(baseTokens, tokens);
  if (clamped.length > 0) {
    trace.push({ layer: 'combined-drift-cap', clamped });
  }

  return { tokens: capped, trace, clamped };
}

/**
 * Compose runtime-snippets in the correct precedence.
 * Network goes first so its <html>-class is set before circadian reads :root.
 *
 * @param {object} opts
 * @param {boolean} [opts.enableCircadian]
 * @param {boolean} [opts.enableNetwork]
 * @param {object} [opts.palettes] — required when enableCircadian
 * @param {number} [opts.lat=60]
 * @returns {string} concatenated <script> blocks
 */
export function composeRuntimeSnippets({
  enableCircadian = false,
  enableNetwork = false,
  palettes = null,
  lat = 60,
} = {}) {
  const snippets = [];
  if (enableNetwork) snippets.push(generateNetworkRuntimeSnippet());
  if (enableCircadian) {
    if (!palettes) throw new Error('composeRuntimeSnippets: palettes required when enableCircadian=true');
    snippets.push(generateCircadianRuntimeSnippet({ palettes, lat }));
  }
  return snippets.join('\n');
}
