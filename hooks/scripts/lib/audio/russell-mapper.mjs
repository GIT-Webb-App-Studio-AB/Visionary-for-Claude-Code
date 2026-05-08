// russell-mapper.mjs — Sprint 19 Task 36.2
// Spotify audio-features → Russell circumplex (valence × arousal) coordinates
// + secondary design parameters (typography axis, motion amplitude, density,
// motion baseline duration).
//
// Mapping rationale:
//   valence (0-1)         → Russell-valence direct  (already 0=sad, 1=happy)
//   energy (0-1) + tempo  → Russell-arousal weighted: 0.7·energy + 0.3·tempo_norm
//                           Spotify "energy" already correlates with arousal,
//                           but tempo carries independent kinetic information
//                           — a slow ambient track with high "energy" rating
//                           still feels less aroused than an uptempo equivalent.
//   tempo (BPM)           → animation-baseline-duration via beat-period:
//                              60 BPM  → 1000 ms (1.0s baseline)
//                              120 BPM →  500 ms
//                              180 BPM →  333 ms
//                            Hard-clamped to [200, 2000] (see tempo-to-motion).
//   acousticness          → typography axis: high → serif/humanistic,
//                                            low  → geometric-sans
//   danceability          → motion amplitude: <0.4 subtle, 0.4-0.7 moderate,
//                                             >0.7 expressive
//   instrumentalness      → density: vocal (low) → text-rich "dense";
//                                    instrumental (high) → image-rich "sparse"

const TEMPO_MIN = 60;
const TEMPO_MAX = 180;

// Public: features → Russell coords + secondaries.
//
// Accepts the raw Spotify features shape — partial inputs are tolerated and
// fall back to neutral defaults (valence 0.5, arousal 0.5, etc.) so this
// function works for both Spotify and CLAP-derived signals.
//
// Returns:
//   {
//     valence, arousal,                  // Russell coords in [0,1]
//     tempo,                             // raw BPM (echoed for inspection)
//     animation_baseline_ms,             // beat-period in ms, clamped [200,2000]
//     typography_axis,                   // 'serif-humanist' | 'mixed' | 'geometric-sans'
//     motion_amplitude,                  // 'subtle' | 'moderate' | 'expressive'
//     density,                           // 'sparse' | 'balanced' | 'dense'
//     source_features,                   // echo of inputs for receipt
//   }
export function mapFeaturesToRussell(features = {}) {
  const valence = clamp01(num(features.valence, 0.5));
  const energy  = clamp01(num(features.energy, 0.5));
  const tempo   = clampNum(num(features.tempo, 120), 1, 1000); // BPM sanity range

  // Tempo → 0-1 normalised over the 60-180 BPM canonical pop range. Tracks
  // outside that range still produce sensible arousal values via clamping.
  const tempoNorm = clamp01((tempo - TEMPO_MIN) / (TEMPO_MAX - TEMPO_MIN));
  const arousal = clamp01(0.7 * energy + 0.3 * tempoNorm);

  // Beat-period in ms = 60000 / BPM. Hard clamp [200, 2000] mirrors the
  // tempo-to-motion module's safety bounds (vestibular floor + UI sanity ceiling).
  const animation_baseline_ms = clampNum(
    Math.round(60000 / Math.max(tempo, 1)),
    200,
    2000,
  );

  const acousticness    = clamp01(num(features.acousticness, 0.5));
  const danceability    = clamp01(num(features.danceability, 0.5));
  const instrumentalness = clamp01(num(features.instrumentalness, 0.0));

  const typography_axis = mapTypographyAxis(acousticness);
  const motion_amplitude = mapMotionAmplitude(danceability);
  const density = mapDensity(instrumentalness);

  return {
    valence,
    arousal,
    tempo,
    animation_baseline_ms,
    typography_axis,
    motion_amplitude,
    density,
    source_features: {
      valence, energy, tempo,
      acousticness, danceability, instrumentalness,
    },
  };
}

// Acousticness → typographic stance.
//   - high (>0.66) → serif/humanist  (warm, organic, traditional)
//   - mid          → mixed
//   - low (<0.33)  → geometric-sans  (clean, technological)
export function mapTypographyAxis(acousticness) {
  if (acousticness > 0.66) return 'serif-humanist';
  if (acousticness < 0.33) return 'geometric-sans';
  return 'mixed';
}

// Danceability → motion amplitude.
export function mapMotionAmplitude(danceability) {
  if (danceability > 0.7) return 'expressive';
  if (danceability < 0.4) return 'subtle';
  return 'moderate';
}

// Instrumentalness → content density (vocal-heavy = text-rich; instrumental = image-rich).
export function mapDensity(instrumentalness) {
  if (instrumentalness > 0.6) return 'sparse';     // image-rich, lots of whitespace
  if (instrumentalness < 0.2) return 'dense';      // text-rich
  return 'balanced';
}

// Helpers ────────────────────────────────────────────────────────────────────

function num(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function clamp01(v) { return clampNum(v, 0, 1); }

function clampNum(v, lo, hi) {
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, v));
}

export const __INTERNAL__ = { TEMPO_MIN, TEMPO_MAX };
