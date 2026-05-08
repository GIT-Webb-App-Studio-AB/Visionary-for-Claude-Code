// tempo-to-motion.mjs — Sprint 19 Task 36.5
// BPM → CSS animation-duration override mapping for audio-driven UIs.
//
// Core idea: when a track is the source-of-truth for design, the UI's motion
// tokens should pulse in sympathy with the track's tempo. We expose two
// helpers:
//
//   bpmToBaselineMs(bpm)              → beat-period in ms, clamped [200, 2000]
//   scaleDurations(durations, bpm)    → multiply a token map proportionally
//
// Hard-clamp rationale:
//   - Floor 200 ms: WCAG 2.2 + vestibular research. Animations under ~150 ms
//                   trigger flicker / motion-sickness for sensitive users.
//                   200 ms keeps a small safety margin even at 240+ BPM input.
//   - Ceiling 2000 ms: UI sanity. Beyond ~2 s, transitions feel broken — users
//                      tap repeatedly or assume the page hung. Caps slow
//                      ambient tracks (40 BPM = 1500 ms uncapped) at a still-
//                      perceptible-as-deliberate ceiling.
//
// Reference baseline: 120 BPM → 500 ms beat-period maps to the standard
// "ui" motion token (350-500 ms range), so 120 BPM = 1.0× scale factor.
// Slower tracks scale durations proportionally up; faster tracks scale down.

const HARD_FLOOR_MS = 200;
const HARD_CEILING_MS = 2000;
const REFERENCE_BPM = 120;
const REFERENCE_BEAT_MS = 500; // 60_000 / 120

/**
 * Convert BPM → beat-period in ms, hard-clamped to [200, 2000].
 *
 * @param {number} bpm — beats per minute. Non-finite or non-positive inputs
 *                       yield the reference 500 ms baseline.
 * @returns {number} integer ms, always within [200, 2000].
 */
export function bpmToBaselineMs(bpm) {
  if (!Number.isFinite(bpm) || bpm <= 0) return REFERENCE_BEAT_MS;
  const beatMs = 60000 / bpm;
  return clampMs(Math.round(beatMs));
}

/**
 * Compute the scale factor relative to the 120 BPM reference (=1.0).
 * Slower tempo → factor > 1 (durations grow). Faster → factor < 1.
 * Clamp on the OUTPUT side via scaleDurations(); this returns the raw factor
 * so callers can inspect it for receipts.
 */
export function bpmToScaleFactor(bpm) {
  if (!Number.isFinite(bpm) || bpm <= 0) return 1.0;
  return (60000 / bpm) / REFERENCE_BEAT_MS;
}

/**
 * Multiply every numeric value in a duration token map by the BPM-derived
 * scale factor, then hard-clamp each result to [200, 2000] ms.
 *
 * Usage:
 *   const tokens = { fast: 200, ui: 350, slow: 600, deliberate: 1000 };
 *   scaleDurations(tokens, 60);   // → all values grow ~2× (then clamped)
 *   scaleDurations(tokens, 180);  // → all values shrink ~0.67×
 *
 * Non-numeric values are preserved unchanged (allows token maps to carry
 * easing-function strings alongside duration numbers).
 *
 * @param {Record<string, number|*>} durations — token map.
 * @param {number} bpm — track BPM.
 * @returns {Record<string, number|*>} new map; original is not mutated.
 */
export function scaleDurations(durations, bpm) {
  if (!durations || typeof durations !== 'object') return durations;
  const factor = bpmToScaleFactor(bpm);
  const out = {};
  for (const [key, value] of Object.entries(durations)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = clampMs(Math.round(value * factor));
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Build a complete motion-baseline override object from a BPM, suitable for
 * merging into a StyleBrief.motion section. Includes a `note` field so
 * receipts can explain *why* the durations got reshaped.
 */
export function buildMotionOverride(bpm) {
  const baselineMs = bpmToBaselineMs(bpm);
  const scale = bpmToScaleFactor(bpm);
  const clampedScale = clampMs(Math.round(scale * REFERENCE_BEAT_MS)) / REFERENCE_BEAT_MS;
  return {
    bpm,
    beat_period_ms: baselineMs,
    scale_factor: scale,
    clamped: scale !== clampedScale,
    note: `Audio-driven motion: ${Math.round(bpm)} BPM → ${baselineMs} ms beat-period baseline.`,
  };
}

function clampMs(v) {
  if (!Number.isFinite(v)) return REFERENCE_BEAT_MS;
  return Math.max(HARD_FLOOR_MS, Math.min(HARD_CEILING_MS, v));
}

export const __INTERNAL__ = {
  HARD_FLOOR_MS,
  HARD_CEILING_MS,
  REFERENCE_BPM,
  REFERENCE_BEAT_MS,
};
