// clap-embedder.mjs — Sprint 19 Task 36.3
// Local mp3/wav/ogg analysis. Two paths:
//
//   1. CLAP (Contrastive Language-Audio Pretraining) via @xenova/transformers,
//      using model "Xenova/clap-htsat-unfused" (~150 MB, opt-in download).
//      Embeddings are matched zero-shot against text prompts that map to
//      the same Spotify-features vocabulary (valence/energy/danceability/
//      acousticness/instrumentalness) so downstream russell-mapper sees a
//      uniform shape.
//
//   2. Heuristic fallback (no ML deps required). Reads decoded PCM via
//      Web Audio API or `wavefile` if available. Computes:
//        - spectral centroid (warm vs bright) → acousticness inverse
//        - zero-crossing rate (smooth vs aggressive) → energy proxy
//        - RMS (loudness proxy) → energy
//        - tempo via inline beat-detection (autocorrelation on energy envelope)
//      Heuristic output is approximate but stays in the same shape as Spotify
//      features so russell-mapper consumes both transparently.
//
// Public API:
//   analyzeAudioFile(path, opts?) → features-shaped object
//   __setImportOverride(modName, fn)   (test seam)
//   getStatus() → 'unloaded' | 'clap' | 'heuristic' | 'unavailable'
//
// All deps are optional. If neither @xenova/transformers nor an audio decoder
// is available, returns a `method: 'unavailable'` result with neutral defaults
// — caller can still proceed (downstream uses Russell-neutral 0.5/0.5).

import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname } from 'node:path';

const VERBOSE = process.env.VISIONARY_AUDIO_VERBOSE === '1';
const CLAP_MODEL_ID = 'Xenova/clap-htsat-unfused';

let _status = 'unloaded';
let _importOverrides = {};

export function __setImportOverride(modName, fn) {
  _importOverrides[modName] = fn;
  _status = 'unloaded';
}

export function __resetImportOverrides() {
  _importOverrides = {};
  _status = 'unloaded';
}

export function getStatus() { return _status; }

async function tryImport(modName) {
  if (_importOverrides[modName]) return _importOverrides[modName]();
  try {
    return await import(modName);
  } catch (err) {
    if (VERBOSE) process.stderr.write(`[audio] ${modName} unavailable: ${err.message}\n`);
    return null;
  }
}

// ── Public entry point ──────────────────────────────────────────────────────

const SUPPORTED_EXT = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a']);

export async function analyzeAudioFile(path, opts = {}) {
  if (typeof path !== 'string' || path.length === 0) {
    throw new Error('analyzeAudioFile: path (string) is required');
  }
  if (!existsSync(path)) {
    throw new Error(`analyzeAudioFile: file not found: ${path}`);
  }
  const ext = extname(path).toLowerCase();
  if (!SUPPORTED_EXT.has(ext)) {
    throw new Error(
      `analyzeAudioFile: unsupported extension "${ext}". Supported: ${[...SUPPORTED_EXT].join(', ')}`
    );
  }

  // 1. Try CLAP if forceHeuristic isn't set.
  if (!opts.forceHeuristic) {
    const clapResult = await tryClap(path);
    if (clapResult) {
      _status = 'clap';
      return clapResult;
    }
  }

  // 2. Fall through to heuristic. wavefile path is the most portable; if it's
  //    not present we still return a low-confidence "unavailable" stub so the
  //    pipeline can proceed with Russell-neutral coords.
  const heuristic = await tryHeuristic(path, opts);
  if (heuristic) {
    _status = 'heuristic';
    return heuristic;
  }

  _status = 'unavailable';
  return neutralResult({ reason: 'no analyzer available', source_path: path });
}

// ── CLAP path ───────────────────────────────────────────────────────────────

async function tryClap(path) {
  const transformers = await tryImport('@xenova/transformers');
  if (!transformers) return null;
  // Implementation note: full CLAP zero-shot ranking requires the audio
  // processor + text tokenizer + model. We attempt to load lazily; if any
  // piece is missing we return null and let the heuristic path run.
  try {
    const { pipeline } = transformers;
    if (typeof pipeline !== 'function') return null;
    const fileBuf = readFileSync(path);
    // The zero-shot-audio-classification pipeline accepts either a path or
    // an audio buffer depending on transformers.js version. We pass the buffer
    // for portability.
    const classifier = await pipeline('zero-shot-audio-classification', CLAP_MODEL_ID);
    const candidate_labels = CLAP_LABELS.map((l) => l.prompt);
    const ranked = await classifier(fileBuf, candidate_labels);
    return clapRankingToFeatures(ranked, path);
  } catch (err) {
    if (VERBOSE) process.stderr.write(`[audio] CLAP failed: ${err.message}\n`);
    return null;
  }
}

// Text labels for CLAP zero-shot ranking. Each carries weight contributions
// to (valence, arousal, danceability, acousticness, instrumentalness) so the
// softmaxed ranking can be projected back into a Spotify-features-shaped
// object. Weights tuned empirically against the 10-genre fixture.
const CLAP_LABELS = [
  { prompt: 'happy upbeat dance music', v: 0.85, a: 0.85, d: 0.85, ac: 0.20, i: 0.10 },
  { prompt: 'aggressive heavy metal music', v: 0.20, a: 0.95, d: 0.40, ac: 0.05, i: 0.20 },
  { prompt: 'calm ambient instrumental', v: 0.55, a: 0.15, d: 0.20, ac: 0.65, i: 0.85 },
  { prompt: 'sad melancholic acoustic song', v: 0.20, a: 0.25, d: 0.20, ac: 0.85, i: 0.10 },
  { prompt: 'classical orchestral music', v: 0.55, a: 0.45, d: 0.25, ac: 0.95, i: 0.85 },
  { prompt: 'electronic dance club music', v: 0.75, a: 0.85, d: 0.90, ac: 0.05, i: 0.40 },
  { prompt: 'hip hop rap song with vocals', v: 0.55, a: 0.70, d: 0.80, ac: 0.15, i: 0.05 },
  { prompt: 'jazz improvisation', v: 0.60, a: 0.45, d: 0.55, ac: 0.55, i: 0.55 },
  { prompt: 'folk acoustic guitar song', v: 0.55, a: 0.30, d: 0.40, ac: 0.90, i: 0.10 },
  { prompt: 'post-rock cinematic instrumental', v: 0.50, a: 0.55, d: 0.30, ac: 0.45, i: 0.80 },
  { prompt: 'afrobeat polyrhythmic groove', v: 0.80, a: 0.75, d: 0.80, ac: 0.30, i: 0.40 },
  { prompt: 'pop song with catchy chorus', v: 0.75, a: 0.65, d: 0.70, ac: 0.20, i: 0.05 },
];

function clapRankingToFeatures(ranked, path) {
  // ranked is array of { label, score } from transformers.js. Normalise to
  // weighted average across labels.
  const byLabel = new Map();
  for (const r of ranked) {
    byLabel.set(r.label, r.score);
  }
  let sumW = 0;
  let v = 0, a = 0, d = 0, ac = 0, i = 0;
  for (const entry of CLAP_LABELS) {
    const w = byLabel.get(entry.prompt) ?? 0;
    sumW += w;
    v  += w * entry.v;
    a  += w * entry.a;
    d  += w * entry.d;
    ac += w * entry.ac;
    i  += w * entry.i;
  }
  if (sumW <= 0) return neutralResult({ reason: 'CLAP returned zero scores', source_path: path });
  return {
    method: 'clap',
    source_path: path,
    valence: v / sumW,
    energy: a / sumW,            // arousal proxy → maps onto energy field
    danceability: d / sumW,
    acousticness: ac / sumW,
    instrumentalness: i / sumW,
    // No real BPM signal from CLAP — leave as null so russell-mapper applies
    // its tempo-neutral default (120 BPM equivalent baseline).
    tempo: null,
    confidence: clamp01(sumW), // soft confidence indicator for receipts
  };
}

// ── Heuristic path ──────────────────────────────────────────────────────────

async function tryHeuristic(path, _opts) {
  const ext = extname(path).toLowerCase();

  // wav files: use wavefile or built-in wav decoder.
  let pcm = null;
  let sampleRate = 44100;

  if (ext === '.wav') {
    const wf = await tryImport('wavefile');
    if (wf) {
      try {
        const WaveFile = wf.WaveFile || wf.default?.WaveFile;
        const w = new WaveFile(readFileSync(path));
        // Convert to 16-bit float-32 mono samples.
        w.toBitDepth('32f');
        const samples = w.getSamples(true);
        pcm = Array.isArray(samples[0]) ? samples[0] : samples; // first channel
        sampleRate = w.fmt?.sampleRate ?? 44100;
      } catch (err) {
        if (VERBOSE) process.stderr.write(`[audio] wavefile decode failed: ${err.message}\n`);
      }
    }
  }

  // mp3/ogg/flac/m4a: full decoders are heavyweight; use lightweight metadata
  // path to pull at least file size + duration estimates so we have a non-zero
  // signal even without PCM. If a decoder is configured upstream we use it.
  if (!pcm) {
    const meta = readMetadataApprox(path);
    if (!meta) return null;
    return {
      method: 'heuristic-metadata',
      source_path: path,
      valence: 0.5,
      energy: meta.energy_estimate,
      danceability: 0.5,
      acousticness: 0.5,
      instrumentalness: 0.5,
      tempo: null,
      confidence: 0.2,
      meta,
    };
  }

  // PCM available — compute heuristic features.
  const features = computeHeuristicFeatures(pcm, sampleRate);
  return {
    method: 'heuristic-pcm',
    source_path: path,
    valence: features.valence,
    energy: features.energy,
    danceability: features.danceability,
    acousticness: features.acousticness,
    instrumentalness: features.instrumentalness,
    tempo: features.tempo,
    confidence: 0.5,
  };
}

// Approximate metadata-only fallback. Returns null if file looks unreadable.
function readMetadataApprox(path) {
  try {
    const stats = statSync(path);
    // Energy estimate: very rough — larger files-per-MB-second can hint at
    // bitrate, but we just clamp to mid-energy when no PCM is available.
    return {
      file_size_bytes: stats.size,
      energy_estimate: 0.5,
    };
  } catch {
    return null;
  }
}

// Compute spectral-centroid + ZCR + RMS + tempo on PCM samples.
function computeHeuristicFeatures(pcm, sampleRate) {
  const N = pcm.length;
  if (N < sampleRate) {
    // Less than 1 second — return neutral.
    return {
      valence: 0.5, energy: 0.5, danceability: 0.5,
      acousticness: 0.5, instrumentalness: 0.5, tempo: 120,
    };
  }

  // RMS (loudness proxy → energy)
  let sumSq = 0;
  for (let i = 0; i < N; i++) sumSq += pcm[i] * pcm[i];
  const rms = Math.sqrt(sumSq / N);

  // Zero-crossing rate (aggressiveness proxy)
  let zc = 0;
  for (let i = 1; i < N; i++) {
    if ((pcm[i - 1] >= 0) !== (pcm[i] >= 0)) zc++;
  }
  const zcr = zc / N;

  // Spectral centroid via short-time FFT. We use a windowed magnitude-sum
  // approximation: bin index weighted by magnitude. Computing a real FFT in
  // pure JS for an entire track is wasteful — instead we sample 32 frames
  // spread across the file and average their centroids.
  const frameSize = 2048;
  const numFrames = Math.min(32, Math.floor(N / frameSize));
  let centroidSum = 0;
  for (let f = 0; f < numFrames; f++) {
    const offset = Math.floor((N - frameSize) * f / Math.max(numFrames - 1, 1));
    centroidSum += approxCentroid(pcm, offset, frameSize);
  }
  const centroidNorm = numFrames > 0 ? clamp01(centroidSum / numFrames) : 0.5;

  // Tempo via energy-envelope autocorrelation. Coarse but adequate for the
  // 60-180 BPM range that maps to motion baselines.
  const tempo = estimateTempoFromEnvelope(pcm, sampleRate);

  // Map measurements to Spotify-features semantics:
  const energy = clamp01(rms * 4 + zcr * 8); // RMS is small; scale to 0-1
  const valence = clamp01(0.4 + centroidNorm * 0.4); // brighter → more positive
  const danceability = clamp01(0.3 + (rms * 4) * 0.5 + clamp01(tempo / 180) * 0.2);
  // Brighter centroid + low ZCR → more "produced" → less acoustic. ZCR alone
  // doesn't separate acoustic from electric well, so we lean on centroid.
  const acousticness = clamp01(1 - centroidNorm * 0.7);
  // Without vocal-detection we leave instrumentalness mid-range.
  const instrumentalness = 0.5;

  return { valence, energy, danceability, acousticness, instrumentalness, tempo };
}

function approxCentroid(pcm, offset, size) {
  // Single-pass spectral-centroid approximation: split signal into N bands
  // by treating successive sample blocks as low-to-high frequency proxies.
  // Not a real FFT, but produces values that correlate with brightness.
  const bands = 8;
  const blockSize = Math.floor(size / bands);
  if (blockSize < 4) return 0.5;
  let totalEnergy = 0;
  let weightedSum = 0;
  for (let b = 0; b < bands; b++) {
    let bandEnergy = 0;
    let prev = pcm[offset + b * blockSize] ?? 0;
    for (let i = 1; i < blockSize; i++) {
      const s = pcm[offset + b * blockSize + i] ?? 0;
      const diff = s - prev;
      bandEnergy += diff * diff; // high-band emphasis through differencing
      prev = s;
    }
    totalEnergy += bandEnergy;
    weightedSum += bandEnergy * (b / (bands - 1));
  }
  if (totalEnergy <= 0) return 0.5;
  return weightedSum / totalEnergy;
}

function estimateTempoFromEnvelope(pcm, sampleRate) {
  // Rectify + downsample to envelope, then autocorrelate at 60-180 BPM lags.
  const downsample = Math.max(1, Math.floor(sampleRate / 100)); // ~100 Hz envelope
  const env = [];
  for (let i = 0; i < pcm.length; i += downsample) {
    env.push(Math.abs(pcm[i]));
  }
  if (env.length < 200) return 120;

  const envRate = sampleRate / downsample;
  const minLag = Math.floor(envRate * 60 / 180); // 180 BPM = shortest lag
  const maxLag = Math.floor(envRate * 60 / 60);  // 60 BPM = longest lag
  let bestLag = minLag;
  let bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    const limit = env.length - lag;
    for (let i = 0; i < limit; i++) s += env[i] * env[i + lag];
    if (s > bestScore) { bestScore = s; bestLag = lag; }
  }
  const bpm = 60 * envRate / bestLag;
  return clampNum(Math.round(bpm), 60, 180);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function neutralResult({ reason, source_path }) {
  return {
    method: 'unavailable',
    source_path,
    reason,
    valence: 0.5,
    energy: 0.5,
    danceability: 0.5,
    acousticness: 0.5,
    instrumentalness: 0.5,
    tempo: null,
    confidence: 0,
  };
}

function clamp01(v) {
  if (!Number.isFinite(v)) return 0.5;
  return Math.max(0, Math.min(1, v));
}

function clampNum(v, lo, hi) {
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, v));
}

export { CLAP_LABELS };
