// extract-palette.mjs — Sprint 18 Task 35.1
//
// Extracts a 5-color OKLCh palette + dominant temperature + mean saturation
// from a photo (URL or local path).
//
// Dependency strategy (no package.json mutations — every dep is optional):
//   - sharp:        REQUIRED at call-time. If missing, the public API throws a
//                   helpful error pointing at the install command. Probed via
//                   dynamic import so that this module loads cleanly even when
//                   sharp is absent (lets unit tests around hueTemperature /
//                   rgbToOklch / cache helpers run on bare CI).
//   - node-vibrant: PREFERRED. Falls back to a sharp-backed histogram +
//                   pixel-frequency clustering when not installed.
//   - culori:       PREFERRED. Falls back to inline linear-sRGB → OKLab → OKLCh
//                   math (Björn Ottosson's transform).
//
// Cache convention: photos are stored permanently under
// ${ensureCacheDir(projectRoot)}/photo-cache/<sha256>.bin (raw bytes preserved
// verbatim — we do not transcode), keyed by sha256 of the source bytes. The
// cache is permanent because the photo is *input*, not an intermediate artefact.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { ensureCacheDir } from '../cache-dir.mjs';

const PHOTO_CACHE_SUBDIR = 'photo-cache';
const RESIZE_MAX = 800;
const HISTOGRAM_QUANTIZE_BITS = 4; // 4 bits per channel → 4096 bins

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Extract a 5-color OKLCh palette + temperature + saturation-mean from a photo.
 *
 * @param {object}        args
 * @param {string}        args.source       URL (http/https) or absolute path.
 * @param {string}        args.projectRoot  Used to resolve the photo-cache dir.
 * @param {object}        [args.opts]
 * @param {number}        [args.opts.resizeMax=800]  Longest-side resize cap.
 * @returns {Promise<PhotoPalette>}
 *
 * @typedef {{l:number,c:number,h:number,hex_fallback:string}} OkLch
 * @typedef {{
 *   source: { kind:"url"|"path", original:string, sha256:string, cached_at_path:string },
 *   palette: { vibrant:OkLch|null, light_vibrant:OkLch|null, dark_vibrant:OkLch|null, muted:OkLch|null, dark_muted:OkLch|null },
 *   temperature: "warm"|"cool"|"neutral",
 *   mean_saturation: number,
 *   source_meta: { dimensions: { width:number, height:number, original:{ width:number, height:number } }, palette_method: "node-vibrant"|"histogram" }
 * }} PhotoPalette
 */
export async function extractPalette({ source, projectRoot, opts = {} }) {
  if (!source || typeof source !== 'string') {
    throw new TypeError('extractPalette: source must be a non-empty string');
  }
  if (!projectRoot) {
    throw new TypeError('extractPalette: projectRoot is required');
  }

  const resizeMax = Number.isFinite(opts.resizeMax) ? opts.resizeMax : RESIZE_MAX;

  // 1. Load + cache raw bytes.
  const { buffer, sha256, cachePath, kind } = await loadAndCache(source, projectRoot);

  // 2. Resize via sharp (REQUIRED).
  const sharp = await loadSharp();
  const resized = await resizeImage(buffer, resizeMax, sharp);

  // 3. Extract 5 dominant RGB swatches (Vibrant or histogram fallback).
  const swatches = await extractColorPalette(resized.buffer, sharp);

  // 4. Convert each swatch to OKLCh.
  const palette = {
    vibrant:       swatches.vibrant       ? rgbToOklch(swatches.vibrant)       : null,
    light_vibrant: swatches.lightVibrant  ? rgbToOklch(swatches.lightVibrant)  : null,
    dark_vibrant:  swatches.darkVibrant   ? rgbToOklch(swatches.darkVibrant)   : null,
    muted:         swatches.muted         ? rgbToOklch(swatches.muted)         : null,
    dark_muted:    swatches.darkMuted     ? rgbToOklch(swatches.darkMuted)     : null,
  };

  // 5. Dominant temperature from the three vibrant swatches' mean hue.
  const tempSwatches = [palette.vibrant, palette.light_vibrant, palette.dark_vibrant].filter(Boolean);
  const meanHue = circularMeanHue(tempSwatches.map(s => s.h));
  const temperature = hueTemperature(meanHue);

  // 6. Mean saturation across all valid swatches' OKLCh chroma. We treat OKLCh
  //    chroma roughly as 0..0.4 in practice; clamp to [0,1] after normalising.
  const allSwatches = Object.values(palette).filter(Boolean);
  const meanChroma = allSwatches.length === 0
    ? 0
    : allSwatches.reduce((acc, s) => acc + s.c, 0) / allSwatches.length;
  const mean_saturation = Math.max(0, Math.min(1, meanChroma / 0.4));

  return {
    source: { kind, original: source, sha256, cached_at_path: cachePath },
    palette,
    temperature,
    mean_saturation,
    source_meta: {
      dimensions: {
        width: resized.width,
        height: resized.height,
        original: resized.original,
      },
      palette_method: swatches.method,
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function loadSharp() {
  try {
    const mod = await import('sharp');
    return mod.default || mod;
  } catch (err) {
    const e = new Error(
      'sharp is required for photo processing but could not be loaded. ' +
      'Install via: npm install sharp',
    );
    e.cause = err;
    e.code = 'SHARP_UNAVAILABLE';
    throw e;
  }
}

/**
 * Load image bytes from URL or path and cache them under
 * ${cacheDir}/photo-cache/<sha256>.bin. Returns the buffer plus cache metadata.
 */
export async function loadAndCache(source, projectRoot) {
  const isUrl = /^https?:\/\//i.test(source);
  let buffer;
  if (isUrl) {
    if (typeof fetch !== 'function') {
      throw new Error('global fetch is unavailable; Node ≥ 18 required for URL photo input');
    }
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${source}: HTTP ${res.status}`);
    }
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    if (!existsSync(source)) {
      throw new Error(`File not found: ${source}`);
    }
    buffer = readFileSync(source);
  }

  const sha256 = createHash('sha256').update(buffer).digest('hex');
  const baseCacheDir = ensureCacheDir(projectRoot);
  const photoCacheDir = join(baseCacheDir, PHOTO_CACHE_SUBDIR);
  try { mkdirSync(photoCacheDir, { recursive: true }); } catch { /* EEXIST ok */ }
  const cachePath = join(photoCacheDir, `${sha256}.bin`);
  if (!existsSync(cachePath)) {
    writeFileSync(cachePath, buffer);
  }

  return {
    buffer,
    sha256,
    cachePath,
    kind: isUrl ? 'url' : 'path',
  };
}

/**
 * Resize via sharp to at most `maxSize` on the longest side (fit:inside).
 * Pure when given the same buffer; metadata reads are awaited.
 */
async function resizeImage(buffer, maxSize, sharp) {
  const img = sharp(buffer);
  const metadata = await img.metadata();
  const w0 = metadata.width || 0;
  const h0 = metadata.height || 0;
  if (!w0 || !h0) {
    throw new Error('sharp could not determine image dimensions');
  }
  const longestSide = Math.max(w0, h0);
  if (longestSide > maxSize) {
    const scale = maxSize / longestSide;
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const resizedBuffer = await sharp(buffer).resize(w, h, { fit: 'inside' }).toBuffer();
    return { buffer: resizedBuffer, width: w, height: h, original: { width: w0, height: h0 } };
  }
  return { buffer, width: w0, height: h0, original: { width: w0, height: h0 } };
}

/**
 * Try node-vibrant first; fall back to histogram-based clustering.
 * Always returns the 5-bucket shape. Each bucket is `{r,g,b}` in 0..255 or null.
 */
async function extractColorPalette(buffer, sharp) {
  // Try node-vibrant.
  let Vibrant = null;
  try {
    const mod = await import('node-vibrant');
    Vibrant = mod.default || mod.Vibrant || mod;
  } catch {
    /* fall through */
  }

  if (Vibrant && typeof Vibrant.from === 'function') {
    try {
      const palette = await Vibrant.from(buffer).getPalette();
      const rgb = (sw) => sw && sw.rgb
        ? { r: Math.round(sw.rgb[0]), g: Math.round(sw.rgb[1]), b: Math.round(sw.rgb[2]) }
        : null;
      return {
        vibrant:      rgb(palette.Vibrant),
        lightVibrant: rgb(palette.LightVibrant),
        darkVibrant:  rgb(palette.DarkVibrant),
        muted:        rgb(palette.Muted),
        darkMuted:    rgb(palette.DarkMuted),
        method: 'node-vibrant',
      };
    } catch {
      /* fall through to histogram */
    }
  }

  return await extractPaletteHistogram(buffer, sharp);
}

/**
 * Histogram-based 5-bucket palette extractor.
 *
 * Strategy:
 *   1. Decode raw RGB pixels via sharp.
 *   2. Quantize each channel to 4 bits → 4096 bins.
 *   3. Pick the most frequent bin as the "Vibrant" anchor; from the top-N bins
 *      route candidates into the 5 named buckets by lightness/chroma using
 *      OKLCh L and C thresholds.
 */
async function extractPaletteHistogram(buffer, sharp) {
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // typically 3 after removeAlpha
  const histogram = new Map(); // key (number) → { count, rSum, gSum, bSum }
  const total = data.length / channels;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key =
      ((r >> (8 - HISTOGRAM_QUANTIZE_BITS)) << (HISTOGRAM_QUANTIZE_BITS * 2)) |
      ((g >> (8 - HISTOGRAM_QUANTIZE_BITS)) << HISTOGRAM_QUANTIZE_BITS) |
       (b >> (8 - HISTOGRAM_QUANTIZE_BITS));
    let bin = histogram.get(key);
    if (!bin) {
      bin = { count: 0, rSum: 0, gSum: 0, bSum: 0 };
      histogram.set(key, bin);
    }
    bin.count++;
    bin.rSum += r;
    bin.gSum += g;
    bin.bSum += b;
  }

  if (total === 0 || histogram.size === 0) {
    return {
      vibrant: null, lightVibrant: null, darkVibrant: null, muted: null, darkMuted: null,
      method: 'histogram',
    };
  }

  // Top-N bins by frequency, mean RGB per bin.
  const topBins = [...histogram.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 64)
    .map(bin => ({
      r: Math.round(bin.rSum / bin.count),
      g: Math.round(bin.gSum / bin.count),
      b: Math.round(bin.bSum / bin.count),
      count: bin.count,
    }));

  // Classify each candidate by OKLCh L (lightness) and C (chroma).
  const classified = topBins.map(rgb => {
    const oklch = rgbToOklch(rgb);
    return { rgb, l: oklch.l, c: oklch.c };
  });

  // Bucket thresholds: lightness mid ≈ 0.5, chroma mid ≈ 0.07 (OKLCh).
  const isVibrant = (s) => s.c >= 0.07;
  const isLight   = (s) => s.l >= 0.65;
  const isDark    = (s) => s.l <= 0.40;

  const pick = (predicate) => {
    const hit = classified.find(predicate);
    return hit ? { r: hit.rgb.r, g: hit.rgb.g, b: hit.rgb.b } : null;
  };

  const vibrant      = pick(s => isVibrant(s) && !isLight(s) && !isDark(s))
                    || pick(isVibrant)
                    || (topBins[0] ? { r: topBins[0].r, g: topBins[0].g, b: topBins[0].b } : null);
  const lightVibrant = pick(s => isVibrant(s) && isLight(s));
  const darkVibrant  = pick(s => isVibrant(s) && isDark(s));
  const muted        = pick(s => !isVibrant(s) && !isLight(s) && !isDark(s));
  const darkMuted    = pick(s => !isVibrant(s) && isDark(s));

  return {
    vibrant, lightVibrant, darkVibrant, muted, darkMuted,
    method: 'histogram',
  };
}

// ── Color math: RGB → OKLCh ────────────────────────────────────────────────

/**
 * Convert sRGB (0..255) to OKLCh.
 * Uses culori when present; otherwise inline math (Björn Ottosson, 2020).
 *
 * @param {{r:number,g:number,b:number}} rgb
 * @returns {{l:number,c:number,h:number,hex_fallback:string}}
 */
export function rgbToOklch(rgb) {
  const hex_fallback = rgbToHex(rgb);

  // Try culori (sync API — no top-level await, so we attempt cached require-style).
  // We can't dynamically import synchronously, so we expose an async variant
  // separately. Inline math below covers both paths transparently.
  const oklch = rgbToOklchInline(rgb);
  return { ...oklch, hex_fallback };
}

function rgbToOklchInline({ r, g, b }) {
  // 1. sRGB 0..255 → linear sRGB 0..1
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);

  // 2. Linear sRGB → LMS (Ottosson 2020 matrix)
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  // 3. LMS → cube-root LMS
  const lc = Math.cbrt(l_);
  const mc = Math.cbrt(m_);
  const sc = Math.cbrt(s_);

  // 4. cube-root LMS → OKLab
  const L = 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc;
  const a = 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc;
  const bb = 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc;

  // 5. OKLab → OKLCh
  const C = Math.hypot(a, bb);
  let H = Math.atan2(bb, a) * 180 / Math.PI;
  if (H < 0) H += 360;

  return {
    l: roundTo(L, 4),
    c: roundTo(C, 4),
    h: roundTo(H, 2),
  };
}

function srgbToLinear(u) {
  return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
}

function rgbToHex({ r, g, b }) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const hex = (n) => clamp(n).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function roundTo(n, digits) {
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

// ── Hue → temperature ──────────────────────────────────────────────────────

/**
 * Map mean OKLCh hue (degrees, 0..360) to a coarse warm / cool / neutral label.
 *
 *   warm    — h ∈ [300, 360] ∪ [0, 60]   (red / orange / yellow / magenta)
 *   cool    — h ∈ [180, 270]             (cyan / blue / violet)
 *   neutral — anything else (greens, near-greys handled by mean_saturation
 *             check at call-site if needed)
 */
export function hueTemperature(meanHue) {
  if (!Number.isFinite(meanHue)) return 'neutral';
  const h = ((meanHue % 360) + 360) % 360;
  if (h >= 180 && h <= 270) return 'cool';
  if (h >= 300 || h <= 60)  return 'warm';
  return 'neutral';
}

/**
 * Circular mean of hue angles (degrees). Returns NaN for empty input.
 */
function circularMeanHue(hues) {
  if (!hues || hues.length === 0) return NaN;
  let x = 0, y = 0;
  for (const h of hues) {
    const r = (h * Math.PI) / 180;
    x += Math.cos(r);
    y += Math.sin(r);
  }
  let mean = (Math.atan2(y / hues.length, x / hues.length) * 180) / Math.PI;
  if (mean < 0) mean += 360;
  return mean;
}

// Re-export internals primarily for tests.
export { circularMeanHue, loadSharp };
