// voice-to-motion.mjs — Sprint 22 Task 40.3
// Maps vocal prosody (pitch contour, rhythm, envelope) to Motion v12 motion-tokens.
//
// Designed for "talked motion-design": user vocalises a movement
// ("smoooth ... snap", "slow ... fast ... pause"), Visionary extracts the
// prosodic shape and re-tunes the most-recently generated component's
// spring-tokens to match.
//
// All math is inline and dependency-free so the module runs inside the
// hook process without npm-install side-effects. Audio is consumed as a
// Float32Array of mono PCM samples in [-1, 1].
//
// Mapping summary (Motion v12 two-parameter springs):
//   pitch contour variance  → spring stiffness proxy ("snap")
//   envelope attack rate    → mass proxy ("weight")
//   envelope sustain median → visualDuration ("how long it lingers")
//   pitch end-vs-mean       → bounce ("uplift" or "settle")
//
// The legacy stiffness/damping/mass triple is also returned so styles that
// haven't migrated to v12 still get a usable motion-token set.

const HZ_FLOOR = 60;       // below male F0 register — discard sub-bass noise
const HZ_CEILING = 1500;   // above whistle range — discard hiss / transients
const FRAME_RATE_HZ = 30;  // 30 frames/sec → 33 ms per pitch frame
const ENVELOPE_WINDOW_MS = 50;

// ─── Pitch contour via short-frame autocorrelation ──────────────────────

/**
 * Extract a per-frame pitch estimate from a mono PCM buffer.
 *
 * Frames the signal at FRAME_RATE_HZ, runs a normalised autocorrelation
 * inside each frame, and reports the lag with the highest correlation that
 * lies within [HZ_FLOOR, HZ_CEILING]. Frames whose peak correlation falls
 * below 0.3 are reported as `null` (silence / unvoiced).
 *
 * @param {Float32Array} audioBuffer — mono PCM in [-1, 1]
 * @param {number} sampleRate — audio sample rate (e.g. 16000, 44100, 48000)
 * @returns {Array<number|null>} pitch in Hz per frame (null when unvoiced)
 */
export function extractPitchContour(audioBuffer, sampleRate) {
  if (!audioBuffer || audioBuffer.length === 0 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return [];
  }

  const frameSize = Math.floor(sampleRate / FRAME_RATE_HZ);
  if (frameSize < 32) return []; // sample rate too low for meaningful pitch

  const minLag = Math.floor(sampleRate / HZ_CEILING);
  const maxLag = Math.min(Math.floor(sampleRate / HZ_FLOOR), Math.floor(frameSize / 2));
  if (maxLag <= minLag) return [];

  const contour = [];
  for (let frameStart = 0; frameStart + frameSize <= audioBuffer.length; frameStart += frameSize) {
    const frame = audioBuffer.subarray(frameStart, frameStart + frameSize);

    // Normalised energy — used both for unvoiced-detection and for
    // dividing the autocorrelation into a [0, 1]-ish similarity measure.
    let energy = 0;
    for (let i = 0; i < frame.length; i += 1) {
      energy += frame[i] * frame[i];
    }
    if (energy < 1e-6) {
      contour.push(null);
      continue;
    }

    let bestLag = -1;
    let bestCorr = 0;
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      let corr = 0;
      const limit = frame.length - lag;
      for (let i = 0; i < limit; i += 1) {
        corr += frame[i] * frame[i + lag];
      }
      // Normalise against energy so different volumes don't shift threshold.
      const normalised = corr / energy;
      if (normalised > bestCorr) {
        bestCorr = normalised;
        bestLag = lag;
      }
    }

    if (bestLag === -1 || bestCorr < 0.3) {
      contour.push(null);
    } else {
      contour.push(sampleRate / bestLag);
    }
  }

  return contour;
}

// ─── Envelope (RMS over moving window) ──────────────────────────────────

/**
 * Extract an amplitude envelope as RMS values over fixed-size windows.
 *
 * @param {Float32Array} audioBuffer — mono PCM in [-1, 1]
 * @param {number} sampleRate — audio sample rate
 * @param {number} [windowMs] — window length in ms (default 50 ms)
 * @returns {number[]} RMS per window, in [0, 1]
 */
export function extractEnvelope(audioBuffer, sampleRate, windowMs = ENVELOPE_WINDOW_MS) {
  if (!audioBuffer || audioBuffer.length === 0 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return [];
  }
  const windowSize = Math.max(8, Math.floor((windowMs / 1000) * sampleRate));
  const out = [];
  for (let start = 0; start + windowSize <= audioBuffer.length; start += windowSize) {
    let sumSq = 0;
    for (let i = 0; i < windowSize; i += 1) {
      const v = audioBuffer[start + i];
      sumSq += v * v;
    }
    out.push(Math.sqrt(sumSq / windowSize));
  }
  return out;
}

// ─── Prosody → Motion v12 mapping ───────────────────────────────────────

/**
 * Translate prosodic features into a Motion-v12-compatible spring object,
 * plus legacy stiffness/damping/mass for v11 styles.
 *
 * Heuristics (deliberately simple — explainable in receipts):
 *   • pitch variance → stiffness/snap. Wide pitch swings → "snappy" feel.
 *   • envelope attack rate → mass. Quick attack ⇒ light/airy mass; slow
 *     attack ⇒ heavy/weighted mass.
 *   • envelope sustain (median amplitude after the attack peak) →
 *     visualDuration. Long sustain ⇒ token lingers.
 *   • pitch end-vs-mean → bounce. Voice ends above its mean ⇒ uplift,
 *     ends at/below ⇒ damped.
 *
 * @param {{pitchContour: Array<number|null>, envelope: number[], totalDurationS?: number}} features
 * @returns {{spring: object, raw_metrics: object}}
 */
export function prosodyToMotion({ pitchContour, envelope, totalDurationS }) {
  const voicedPitches = (pitchContour || []).filter((v) => Number.isFinite(v) && v > 0);
  const env = (envelope || []).filter((v) => Number.isFinite(v) && v >= 0);

  // ── Pitch statistics ──────────────────────────────────────────────
  const pitchMean = voicedPitches.length > 0
    ? voicedPitches.reduce((s, v) => s + v, 0) / voicedPitches.length
    : 0;
  const pitchVariance = voicedPitches.length > 0
    ? voicedPitches.reduce((s, v) => s + (v - pitchMean) * (v - pitchMean), 0) / voicedPitches.length
    : 0;
  // Normalise: 100 Hz² of variance ≈ moderate intonation ≈ 1.0.
  const stiffnessScore = clamp01(pitchVariance / 10000);

  // ── Envelope shape ────────────────────────────────────────────────
  let peakIdx = 0;
  let peakVal = 0;
  for (let i = 0; i < env.length; i += 1) {
    if (env[i] > peakVal) {
      peakVal = env[i];
      peakIdx = i;
    }
  }
  const attackTime = env.length > 0 ? peakIdx / env.length : 0; // 0..1
  const massScore = clamp01(attackTime); // slow attack ⇒ heavier feel

  // Sustain: median of env values AFTER the peak (or whole env if peak at end).
  const sustainSlice = env.slice(peakIdx).filter((v) => Number.isFinite(v));
  const sustainMedian = sustainSlice.length > 0
    ? median(sustainSlice)
    : 0;
  // Map sustain (relative to peak) to a duration in [0.2, 1.0] s.
  const sustainRel = peakVal > 0 ? clamp01(sustainMedian / peakVal) : 0;
  const visualDuration = round(0.2 + sustainRel * 0.8, 3);

  // ── Bounce: ends-up vs ends-down on pitch ─────────────────────────
  const tail = voicedPitches.slice(-Math.max(1, Math.floor(voicedPitches.length / 4)));
  const tailMean = tail.length > 0 ? tail.reduce((s, v) => s + v, 0) / tail.length : 0;
  let bounce = 0;
  if (pitchMean > 0) {
    const ratio = (tailMean - pitchMean) / pitchMean;
    if (ratio > 0.02) bounce = clamp(ratio * 4, 0, 0.6);
    else if (ratio < -0.02) bounce = 0; // damped
  }
  bounce = round(bounce, 3);

  // ── Legacy v11 mapping ────────────────────────────────────────────
  const stiffness = Math.round(200 + stiffnessScore * 400);  // 200..600
  const damping = Math.round(15 + (1 - stiffnessScore) * 20); // 35..15
  const mass = round(0.5 + massScore * 1.5, 3);               // 0.5..2.0

  return {
    spring: {
      type: 'spring',
      bounce,
      visualDuration,
      // Legacy fields for v11 styles:
      stiffness,
      damping,
      mass,
    },
    raw_metrics: {
      pitchMean: round(pitchMean, 2),
      pitchVariance: round(pitchVariance, 2),
      attackTime: round(attackTime, 3),
      sustainMedian: round(sustainMedian, 4),
      bounceRatio: round(bounce, 3),
      voicedFrames: voicedPitches.length,
      envelopeFrames: env.length,
      totalDurationS: Number.isFinite(totalDurationS) ? round(totalDurationS, 2) : null,
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function clamp01(v) {
  return clamp(v, 0, 1);
}
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return 0;
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
function round(v, digits) {
  if (!Number.isFinite(v)) return 0;
  const f = Math.pow(10, digits);
  return Math.round(v * f) / f;
}

export const __INTERNAL__ = {
  HZ_FLOOR,
  HZ_CEILING,
  FRAME_RATE_HZ,
  ENVELOPE_WINDOW_MS,
};
