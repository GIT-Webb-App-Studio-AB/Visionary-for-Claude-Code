// from-photo-pipeline.mjs — Sprint 18 Task 35.4
// Top-level orchestrator: photo input (URL or path) → PhotoInferenceResult
// ready for context-inference.
//
// Wires together the three sub-modules:
//   • extract-palette.mjs  (Task 35.1) — sharp + node-vibrant → 5-colour oklch
//                                        palette + temperature + saturation
//   • clip-classifier.mjs  (Task 35.2) — local CLIP zero-shot → top-3 mood
//                                        (with heuristic fallback)
//   • edge-detect.mjs      (Task 35.3) — Sobel → edge-density → motion-tier
//
// Strategy: load+palette runs first (it owns the cache + buffer); mood and
// edges run in parallel against the cached buffer. Failures in mood or edges
// degrade gracefully — the pipeline always returns a result with sensible
// defaults so context-inference can decide whether to use it.

import { readFileSync, existsSync } from 'node:fs';

import { extractPalette } from './extract-palette.mjs';
import { classifyMood } from './clip-classifier.mjs';
import { detectEdges } from './edge-detect.mjs';

// PhotoInferenceResult shape (returned to context-inference):
//   {
//     source: string,                            // original URL or path
//     palette: { vibrant, light_vibrant, ... },  // 5 oklch swatches
//     palette_method: 'node-vibrant' | 'histogram',
//     temperature: 'warm' | 'cool' | 'neutral',
//     saturation_mean: number,                   // 0..1 (from mean_saturation)
//     mood: { method, top: [{ mood, confidence, style_tags }] },
//     edges: { edge_density, mean_magnitude, motion_tier },
//     motion_tier: 0|1|2|3,                      // shortcut to edges.motion_tier
//     biased_style_pool: string[],               // soft anchors for stage 1
//     palette_override: object,                  // hard signal for stage 4
//     meta: { pipeline_duration_ms, sha256, cached_at, brief },
//   }
//
// Args:
//   source (string)        : URL ("https://…") or absolute filesystem path
//   projectRoot (string)   : project root (resolves CLAUDE_PLUGIN_DATA cache)
//   brief (string|null)    : optional user brief, passed through to receipt
//   opts (object)          : forwarded to extractPalette
//   _deps (object)         : internal — test seam for mocking sub-modules
//
// Returns: Promise<PhotoInferenceResult>
export async function runPhotoInferencePipeline({
  source,
  projectRoot,
  brief = null,
  opts = {},
  _deps = {},
}) {
  if (!source || typeof source !== 'string') {
    throw new Error('runPhotoInferencePipeline: source (string) is required');
  }
  if (!projectRoot || typeof projectRoot !== 'string') {
    throw new Error('runPhotoInferencePipeline: projectRoot (string) is required');
  }

  // Allow tests to inject mocks without monkey-patching the import graph.
  const _extractPalette = _deps.extractPalette ?? extractPalette;
  const _classifyMood = _deps.classifyMood ?? classifyMood;
  const _detectEdges = _deps.detectEdges ?? detectEdges;

  const startTime = Date.now();

  // Step 1: load + palette (owns cache + buffer). Must succeed — without a
  // buffer there's nothing for mood/edges to operate on.
  const paletteResult = await _extractPalette({ source, projectRoot, opts });
  const imageBuffer = resolveImageBuffer(paletteResult);

  // Step 2 + 3: mood and edges in parallel against the cached buffer.
  // Both wrap their own errors so a single sub-failure doesn't take down
  // the pipeline (e.g. CLIP model not downloaded → mood is empty, but
  // palette + edges still feed context-inference).
  const [moodResult, edgesResult] = await Promise.all([
    safeClassifyMood(_classifyMood, {
      imageBuffer,
      fallbackPalette: paletteResult.palette,
      fallbackSaturation: paletteResult.mean_saturation,
      fallbackEdgeDensity: null, // edges still computing; not used by fallback
    }),
    safeDetectEdges(_detectEdges, { imageBuffer }),
  ]);

  const duration = Date.now() - startTime;

  return {
    source,
    palette: paletteResult.palette,
    palette_method: paletteResult.source_meta?.palette_method ?? 'unknown',
    temperature: paletteResult.temperature,
    saturation_mean: paletteResult.mean_saturation,
    mood: moodResult,
    edges: edgesResult,
    motion_tier: edgesResult.motion_tier,

    // Soft + hard anchors consumed by skills/visionary/context-inference.md.
    // biased_style_pool is a SOFT signal (+20 boost in scoring); palette_override
    // is HARD (overrides stil-default-palette unless blocked by stil tags).
    biased_style_pool: combineStylePool(moodResult, paletteResult.temperature),
    palette_override: paletteResult.palette,

    meta: {
      pipeline_duration_ms: duration,
      sha256: paletteResult.source?.sha256 ?? null,
      cached_at: paletteResult.source?.cached_at_path ?? null,
      brief,
    },
  };
}

// Combine top-3 mood style_tags into a deduplicated style pool. Order is
// preserved by Set insertion order — which means higher-confidence moods
// land their tags first and "win" tie-breaks downstream.
//
// Returns [] when mood-classification produced no usable result (offline,
// model load fail, error path) — caller treats empty pool as "no mood signal".
export function combineStylePool(moodResult, _temperature) {
  if (!moodResult || !Array.isArray(moodResult.top) || moodResult.top.length === 0) {
    return [];
  }
  const styles = new Set();
  for (const entry of moodResult.top.slice(0, 3)) {
    if (!entry || !Array.isArray(entry.style_tags)) continue;
    for (const tag of entry.style_tags) {
      if (typeof tag === 'string' && tag.length > 0) styles.add(tag);
    }
  }
  return Array.from(styles);
}

// ── Internal helpers ────────────────────────────────────────────────────────

// extractPalette caches bytes at source.cached_at_path. Resolve to a Buffer
// so mood + edges can run against the cached image. Returns null when the
// cache file is missing — sub-modules then bail with safe defaults via their
// wrappers.
function resolveImageBuffer(paletteResult) {
  // Tests may inject a buffer directly via source_meta.cached_buffer to avoid
  // round-tripping through the filesystem.
  const cachedBuffer = paletteResult?.source_meta?.cached_buffer;
  if (cachedBuffer && Buffer.isBuffer(cachedBuffer)) return cachedBuffer;

  const cachePath = paletteResult?.source?.cached_at_path;
  if (cachePath && existsSync(cachePath)) {
    return readFileSync(cachePath);
  }
  return null;
}

// Wrap classifyMood with graceful degradation. CLIP can fail for many reasons
// (model not downloaded, ONNX runtime missing, OOM, etc.) — the classifier
// itself falls back to heuristic, but if it throws unexpectedly we swallow
// the exception into a typed error shape so the pipeline always returns.
async function safeClassifyMood(classifyFn, args) {
  if (!args.imageBuffer) {
    // No buffer? Force heuristic with the palette/saturation we do have.
    try {
      return await classifyFn({
        imageBuffer: null,
        fallbackPalette: args.fallbackPalette,
        fallbackSaturation: args.fallbackSaturation,
        fallbackEdgeDensity: args.fallbackEdgeDensity,
        forceHeuristic: true,
      });
    } catch (err) {
      return { method: 'error', error: err?.message ?? String(err), top: [] };
    }
  }
  try {
    return await classifyFn(args);
  } catch (err) {
    return {
      method: 'error',
      error: err?.message ?? String(err),
      top: [],
    };
  }
}

// Wrap detectEdges similarly. On failure we return motion_tier=1 (Subtle)
// which is a conservative, taste-neutral default — neither pushes the UI
// toward Static (might feel dead) nor Kinetic (might feel obnoxious).
async function safeDetectEdges(detectFn, { imageBuffer }) {
  if (!imageBuffer) {
    return {
      error: 'no_image_buffer',
      edge_density: 0,
      mean_magnitude: 0,
      motion_tier: 1,
    };
  }
  try {
    return await detectFn({ imageBuffer });
  } catch (err) {
    return {
      error: err?.message ?? String(err),
      edge_density: 0,
      mean_magnitude: 0,
      motion_tier: 1,
    };
  }
}
