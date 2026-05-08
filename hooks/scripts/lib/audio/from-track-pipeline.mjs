// from-track-pipeline.mjs — Sprint 19 Task 36.4
// Top-level orchestrator for /visionary-from-track.
//
// Detects whether `source` is a Spotify URL/URI or a local audio file, runs
// the matching feature-extraction path, then produces an AudioInferenceResult
// shaped for downstream context-inference (Stage 1).
//
// Output is wired into the existing mood-mapper (Sprint 17) by injecting the
// derived (valence, arousal) Russell coords as if the user had typed
//   /visionary-mood "<v>,<a>"
// — audio is therefore an *amplifier* of the Russell signal that mood-mapper
// already understands, not a parallel system that the rest of the pipeline
// has to learn.
//
// The tempo-derived motion baseline is exposed separately on the result so
// the renderer can override the StyleBrief's motion tokens at injection time
// (see tempo-to-motion.scaleDurations).
//
// Public API:
//   runFromTrackPipeline({ source, projectRoot, brief?, opts?, _deps? })
//     → AudioInferenceResult

import { fetchAudioFeatures, fetchTrackMeta, parseTrackId } from './spotify-features.mjs';
import { mapFeaturesToRussell } from './russell-mapper.mjs';
import { analyzeAudioFile } from './clap-embedder.mjs';
import { buildMotionOverride } from './tempo-to-motion.mjs';
import { mapMood } from '../mood-mapper.mjs';

// AudioInferenceResult shape:
// {
//   source: string,
//   source_type: 'spotify' | 'audio-file',
//   features: { valence, energy, danceability, tempo, acousticness, instrumentalness, ... },
//   russell: { valence, arousal, quadrant, primary_styles, secondary_styles, motion_tier, saturation_hint },
//   design: { typography_axis, motion_amplitude, density, animation_baseline_ms, motion_override },
//   biased_style_pool: string[],
//   track_meta?: { name, artists, ... } | null,
//   meta: { pipeline_duration_ms, brief, method },
// }

export async function runFromTrackPipeline({
  source,
  projectRoot,
  brief = null,
  opts = {},
  _deps = {},
} = {}) {
  if (!source || typeof source !== 'string') {
    throw new Error('runFromTrackPipeline: source (string) is required');
  }
  if (!projectRoot || typeof projectRoot !== 'string') {
    throw new Error('runFromTrackPipeline: projectRoot (string) is required');
  }

  const _fetchAudioFeatures = _deps.fetchAudioFeatures ?? fetchAudioFeatures;
  const _fetchTrackMeta     = _deps.fetchTrackMeta ?? fetchTrackMeta;
  const _analyzeAudioFile   = _deps.analyzeAudioFile ?? analyzeAudioFile;
  const _mapFeaturesToRussell = _deps.mapFeaturesToRussell ?? mapFeaturesToRussell;
  const _mapMood            = _deps.mapMood ?? mapMood;
  const _buildMotionOverride = _deps.buildMotionOverride ?? buildMotionOverride;

  const startTime = Date.now();

  const sourceType = detectSourceType(source);
  let features;
  let trackMeta = null;
  let method;

  if (sourceType === 'spotify') {
    method = 'spotify';
    try {
      [features, trackMeta] = await Promise.all([
        _fetchAudioFeatures(source, opts),
        safeFetchTrackMeta(_fetchTrackMeta, source, opts),
      ]);
    } catch (err) {
      // Spotify failure is fatal for the spotify path. Surface a clear error
      // — the caller is expected to handle creds-missing vs network-error
      // distinctly via the message shape.
      throw new Error(`from-track-pipeline (spotify): ${err.message}`);
    }
  } else {
    method = 'audio-file';
    try {
      features = await _analyzeAudioFile(source, opts);
    } catch (err) {
      throw new Error(`from-track-pipeline (audio-file): ${err.message}`);
    }
  }

  // Map features → Russell coords + design parameters.
  const russellMapped = _mapFeaturesToRussell(features);

  // Run the same Sprint-17 mood-mapper that text-mood input uses, so audio
  // signals enter the rest of the system through a known channel. We pass
  // the (valence, arousal) coords as a string so the function's normal
  // numeric-form parser handles them.
  const moodInput = `${russellMapped.valence.toFixed(3)},${russellMapped.arousal.toFixed(3)}`;
  const moodResult = _mapMood(moodInput);

  // mapMood returns { error } when input is invalid — we just constructed
  // the input string ourselves, so this should never trigger, but treat as
  // graceful neutral if it does.
  const russell = moodResult && !moodResult.error
    ? {
        valence: moodResult.valence,
        arousal: moodResult.arousal,
        quadrant: moodResult.quadrant,
        primary_styles: moodResult.primary_styles ?? [],
        secondary_styles: moodResult.secondary_styles ?? [],
        motion_tier: moodResult.motion_tier ?? 1,
        saturation_hint: moodResult.saturation_hint ?? russellMapped.valence,
      }
    : {
        valence: russellMapped.valence,
        arousal: russellMapped.arousal,
        quadrant: null,
        primary_styles: [],
        secondary_styles: [],
        motion_tier: 1,
        saturation_hint: russellMapped.valence,
      };

  // Build the motion override from the track's actual tempo. When CLAP-only
  // (no tempo signal), russellMapped.tempo falls back to 120 BPM via the
  // mapper's defaulting, which produces a 1× scale factor — i.e. no override.
  const motion_override = _buildMotionOverride(russellMapped.tempo);

  const biased_style_pool = uniq([
    ...russell.primary_styles,
    ...russell.secondary_styles,
  ]);

  const duration = Date.now() - startTime;

  return {
    source,
    source_type: sourceType,
    features,
    russell,
    design: {
      typography_axis: russellMapped.typography_axis,
      motion_amplitude: russellMapped.motion_amplitude,
      density: russellMapped.density,
      animation_baseline_ms: russellMapped.animation_baseline_ms,
      motion_override,
    },
    biased_style_pool,
    track_meta: trackMeta,
    meta: {
      pipeline_duration_ms: duration,
      brief,
      method,
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// Heuristic: anything that smells like a Spotify URL/URI/ID goes through the
// Spotify path; otherwise we treat the input as an audio-file path. We don't
// require the file to exist here — analyzeAudioFile handles that and surfaces
// a clearer error.
export function detectSourceType(source) {
  if (typeof source !== 'string') return 'audio-file';
  const trimmed = source.trim();

  // Explicit Spotify markers
  if (
    /^spotify:track:/.test(trimmed) ||
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\//.test(trimmed) ||
    /^https?:\/\/spotify\.link\//.test(trimmed)
  ) {
    return 'spotify';
  }

  // Bare 22-char base62 ID — only treat as Spotify if it has no path
  // separators and no extension. parseTrackId enforces the 22-char shape.
  if (parseTrackId(trimmed) && !/[\\/.]/.test(trimmed)) {
    return 'spotify';
  }

  return 'audio-file';
}

async function safeFetchTrackMeta(fn, source, opts) {
  try {
    return await fn(source, opts);
  } catch {
    return null;
  }
}

function uniq(arr) {
  return Array.from(new Set(arr.filter((s) => typeof s === 'string' && s.length > 0)));
}
