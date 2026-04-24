// Numeric aesthetic scorer — the 9th dimension of the critique loop.
//
// Six deterministic sub-scorers, each normalised to 0..1:
//   contrast_entropy      — Shannon entropy over CIELAB L (16 bins) from a 32×32 resize
//   gestalt_grouping      — DBSCAN on DOM bbox centroids + aligned-edge bonus
//   typographic_rhythm    — std-dev of log-ratios between consecutive font-sizes
//                           (bonus for canonical modular scales)
//   negative_space_ratio  — content-pixel ratio vs background; sweet-spot [0.2, 0.6]
//   color_harmony         — k-means dominant colours vs palette tokens in OKLCH
//                           with ΔE2000 distance
//   composite             — weighted mean of the non-null sub-scores
//
// Design rules:
//
//   1. Sharp is an OPTIONAL dependency. When sharp cannot be loaded, the three
//      screenshot-driven sub-scores (contrast_entropy, negative_space_ratio,
//      color_harmony) return null and the composite is re-weighted over the
//      remaining scorers. The scorer never throws in that scenario — the LLM
//      critique still runs, just without the pixel-level deterministic dims.
//
//   2. A hard feature-flag `VISIONARY_ENABLE_NUMERIC_SCORER` (default on) lets
//      users turn the whole scorer off for speed / CI noise / sharp install
//      failures. `VISIONARY_ENABLE_NUMERIC_SCORER=0` → scoreAesthetic returns
//      `{ enabled: false }` and the critique loop skips injecting numeric cues.
//
//   3. Every sub-scorer is a pure function over its required inputs (no shared
//      mutable state) so the module stays unit-test-friendly. DBSCAN, k-means,
//      Lab conversion and ΔE2000 all live in this file to keep the scorer
//      dep-free.
//
// Author note: the weights in COMPOSITE_WEIGHTS match the sprint plan —
// 0.25 contrast + 0.20 gestalt + 0.20 typography + 0.15 space + 0.20 harmony.
// They are retuned nightly by scripts/calibrate.mjs once the gold-set is
// scored; this file holds the fallback seed values.

// ── Config ──────────────────────────────────────────────────────────────────
const DISABLED = (() => {
  const v = process.env.VISIONARY_ENABLE_NUMERIC_SCORER;
  if (v === undefined) return false;
  if (v === '0' || v === 'false' || v.toLowerCase() === 'off') return true;
  return false;
})();

export const COMPOSITE_WEIGHTS = Object.freeze({
  contrast_entropy:     0.25,
  gestalt_grouping:     0.20,
  typographic_rhythm:   0.20,
  negative_space_ratio: 0.15,
  color_harmony:        0.20,
});

// Canonical modular scales — used as a +0.1 bonus in typographic_rhythm
// when the observed font-size ratios land close to one of these.
const CANONICAL_RATIOS = Object.freeze([
  1.125,  // major second
  1.2,    // minor third
  1.25,   // major third
  1.333,  // perfect fourth
  1.414,  // augmented fourth (√2)
  1.5,    // perfect fifth
  1.618,  // golden
]);

// ── Sharp loader (optional dep) ─────────────────────────────────────────────
// We load sharp lazily once per process. If the import fails (not installed,
// prebuilt binary missing on Windows, etc.) we cache `null` so subsequent
// screenshot-based scorers skip work without retrying the import.
let _sharpPromise = null;
async function loadSharp() {
  if (_sharpPromise !== null) return _sharpPromise;
  _sharpPromise = (async () => {
    try {
      const mod = await import('sharp');
      return mod.default ?? mod;
    } catch {
      return null;
    }
  })();
  return _sharpPromise;
}

// ── Public entrypoint ───────────────────────────────────────────────────────
/**
 * Score a rendered screenshot + DOM snapshot on six deterministic aesthetic
 * dimensions. The LLM critique reads the result and must address any
 * sub-score below 0.7 in its top_3_fixes.
 *
 * @param {string} screenshotPath   - absolute path to a PNG
 * @param {object} domSnapshot      - { elements: [{ selector, bbox, style }] }
 * @param {object} paletteTokens    - DTCG palette export for the winning style
 * @returns {Promise<NumericScore>}
 *
 * NumericScore = {
 *   enabled: boolean,
 *   contrast_entropy: number|null,      // 0..1
 *   gestalt_grouping: number|null,      // 0..1
 *   typographic_rhythm: number|null,    // 0..1
 *   negative_space_ratio: number|null,  // 0..1
 *   color_harmony: number|null,         // 0..1
 *   composite: number|null,             // 0..1
 *   accessibility_axe_score: null,      // populated elsewhere (see scoreAxe)
 *   notes: string[]
 * }
 */
export async function scoreAesthetic(screenshotPath, domSnapshot, paletteTokens) {
  const result = emptyResult();
  if (DISABLED) {
    result.enabled = false;
    result.notes.push('VISIONARY_ENABLE_NUMERIC_SCORER disabled — skipping numeric scoring');
    return result;
  }

  const sharp = await loadSharp();
  if (!sharp) {
    result.notes.push('sharp unavailable — screenshot-based scorers will return null');
  }

  // Run the DOM-only scorers first — they never need sharp so they always work.
  result.gestalt_grouping   = safeRun(() => scoreGestaltGrouping(domSnapshot), result.notes, 'gestalt_grouping');
  result.typographic_rhythm = safeRun(() => scoreTypographicRhythm(domSnapshot), result.notes, 'typographic_rhythm');

  // Pixel-based scorers — share a single sharp pipeline on the 32×32 sample
  // so we only round-trip the PNG once per critique round.
  if (sharp && screenshotPath) {
    try {
      const raw = await sharp(screenshotPath)
        .removeAlpha()
        .resize(32, 32, { fit: 'fill' })
        .raw()
        .toBuffer({ resolveWithObject: true });
      // raw.data is a length 32*32*3 Uint8 buffer in sRGB bytes (R,G,B,R,G,B,...)
      result.contrast_entropy     = safeRun(() => scoreContrastEntropy(raw),                 result.notes, 'contrast_entropy');
      result.negative_space_ratio = safeRun(() => scoreNegativeSpaceRatio(raw, paletteTokens), result.notes, 'negative_space_ratio');
      result.color_harmony        = safeRun(() => scoreColorHarmony(raw, paletteTokens),     result.notes, 'color_harmony');
    } catch (err) {
      result.notes.push(`sharp pipeline failed: ${err.message || err}`);
    }
  }

  result.composite = computeComposite(result);
  return result;
}

function emptyResult() {
  return {
    enabled: true,
    contrast_entropy: null,
    gestalt_grouping: null,
    typographic_rhythm: null,
    negative_space_ratio: null,
    color_harmony: null,
    composite: null,
    accessibility_axe_score: null,
    notes: [],
  };
}

function safeRun(fn, notes, label) {
  try {
    const v = fn();
    if (v === null || Number.isFinite(v)) return v;
    notes.push(`${label}: scorer returned non-finite value`);
    return null;
  } catch (err) {
    notes.push(`${label}: ${err.message || err}`);
    return null;
  }
}

function computeComposite(result) {
  let sumWeight = 0;
  let sumWeighted = 0;
  for (const [dim, w] of Object.entries(COMPOSITE_WEIGHTS)) {
    const v = result[dim];
    if (v === null || !Number.isFinite(v)) continue;
    sumWeight += w;
    sumWeighted += w * v;
  }
  if (sumWeight === 0) return null;
  return sumWeighted / sumWeight;
}

// ═══════════════════════════════════════════════════════════════════════════
// 7.2 — Contrast entropy
// ═══════════════════════════════════════════════════════════════════════════
// Shannon entropy over the perceptual lightness (CIELAB L) channel, bucketed
// into 16 bins over the full 32×32 sample. Output is normalised by log2(16)=4
// so a uniformly-distributed L histogram scores 1.0 and a single-bin (all-one-
// colour) sample scores 0.
//
// Flat white/grey background with a thin grey text layer → ~0.20
// Bauhaus poster with 4 tonal blocks → ~0.85
export function scoreContrastEntropy(rawSample) {
  if (!rawSample || !rawSample.data) return null;
  const { data, info } = rawSample;
  const channels = info.channels || 3;
  const pixels = info.width * info.height;

  const bins = new Array(16).fill(0);
  for (let i = 0; i < pixels; i++) {
    const r = data[i * channels] / 255;
    const g = data[i * channels + 1] / 255;
    const b = data[i * channels + 2] / 255;
    const L = srgbToLabL(r, g, b);
    // L is 0..100; bucket into 16 bins.
    const bucket = Math.max(0, Math.min(15, Math.floor((L / 100) * 16)));
    bins[bucket]++;
  }

  let entropy = 0;
  for (const count of bins) {
    if (count === 0) continue;
    const p = count / pixels;
    entropy -= p * Math.log2(p);
  }
  return clamp01(entropy / Math.log2(16));
}

// ═══════════════════════════════════════════════════════════════════════════
// 7.3 — Gestalt grouping
// ═══════════════════════════════════════════════════════════════════════════
// DBSCAN on element centroids (ε=8px, minPts=2). Singletons penalised; tight
// clusters (low variance within cluster) and aligned edges rewarded.
//
// Interpretation:
//   - Almost every element in a cluster with peers + aligned edges → ~0.9+
//   - 4 tight groups of 3 aligned cards → ~0.75
//   - Randomly scattered elements → ~0.2
export function scoreGestaltGrouping(domSnapshot) {
  const elements = Array.isArray(domSnapshot?.elements) ? domSnapshot.elements : [];
  const boxes = elements
    .map((e) => e && e.bbox)
    .filter((b) => b && Number.isFinite(b.x) && Number.isFinite(b.y) && b.width > 0 && b.height > 0);
  if (boxes.length < 2) return null;

  const centroids = boxes.map((b) => ({
    x: b.x + b.width / 2,
    y: b.y + b.height / 2,
    bbox: b,
  }));

  const clusters = dbscan(centroids, 8, 2);
  const singletonPoints = clusters.filter((c) => c.length < 2).reduce((n, c) => n + c.length, 0);
  const groupedFraction = 1 - (singletonPoints / centroids.length);

  // Within-cluster variance bonus: clusters whose members share alignment
  // (low variance along one axis) bump the score. Measure on both axes.
  let alignmentSum = 0;
  let alignmentCount = 0;
  for (const cluster of clusters) {
    if (cluster.length < 2) continue;
    const xs = cluster.map((p) => p.bbox.x);
    const ys = cluster.map((p) => p.bbox.y);
    const xVar = variance(xs);
    const yVar = variance(ys);
    // Normalise: pixel-variance ~100 = noisy, ~5 = sharp alignment.
    const axisScore = 1 / (1 + Math.min(xVar, yVar) / 50);
    alignmentSum += axisScore;
    alignmentCount++;
  }
  const alignmentBonus = alignmentCount === 0 ? 0 : alignmentSum / alignmentCount;

  // Aligned-edges bonus: how many elements share an exact `left` or `top`
  // coordinate with at least one other? Shared edges are a strong signal of
  // intentional grid. Bucketed to nearest integer pixel so subpixel rounding
  // from browser snapshots doesn't break the count.
  const leftCounts = bucketBy(boxes, (b) => b.x);
  const topCounts  = bucketBy(boxes, (b) => b.y);
  const sharedLeft = Array.from(leftCounts.values()).filter((n) => n >= 2).reduce((s, n) => s + n, 0);
  const sharedTop  = Array.from(topCounts.values()).filter((n) => n >= 2).reduce((s, n) => s + n, 0);
  const edgeBonus = Math.min(1, (sharedLeft + sharedTop) / (2 * boxes.length));

  // A well-aligned grid has singleton centroids (fails DBSCAN proximity) but
  // perfect shared edges — it IS intentional structure. A tight toolbar has
  // strong proximity clusters but may not share edges. Both patterns deserve
  // a high score, so we take the stronger of the two structural signals and
  // modulate it with within-cluster tightness.
  const structureScore = Math.max(groupedFraction, edgeBonus);
  const alignmentMod = 1 + 0.5 * alignmentBonus;
  return clamp01(structureScore * alignmentMod);
}

// ═══════════════════════════════════════════════════════════════════════════
// 7.4 — Typographic rhythm
// ═══════════════════════════════════════════════════════════════════════════
// 1 − std-dev(log(ratios)) between consecutive unique font-sizes, with a
// +0.1 bonus when the ratios cluster near a canonical modular scale.
//
// Perfect modular scale (e.g. 16 → 20 → 25 → 31.25 → 39 on 1.25) → ~0.95+
// Arbitrary sizes (12, 15, 17, 28) → ~0.3-0.4
export function scoreTypographicRhythm(domSnapshot) {
  const elements = Array.isArray(domSnapshot?.elements) ? domSnapshot.elements : [];
  const sizes = new Set();
  for (const el of elements) {
    const fs = parseFontSize(el?.style?.fontSize);
    if (fs && fs > 0) sizes.add(roundTo(fs, 2));
  }
  if (sizes.size < 3) return null;
  const sorted = Array.from(sizes).sort((a, b) => a - b);
  const ratios = [];
  for (let i = 1; i < sorted.length; i++) {
    ratios.push(sorted[i] / sorted[i - 1]);
  }
  if (ratios.length === 0) return null;

  const logRatios = ratios.map((r) => Math.log(r));
  const std = Math.sqrt(variance(logRatios));
  // log-ratio std-dev of 0 = perfectly constant ratio → score 1.
  // std-dev of ~0.2 = quite irregular → score ~0.2.
  let rhythm = Math.exp(-std * 5); // empirical normalisation; std 0.14 → ~0.5

  // Canonical-scale bonus: mean distance of each observed ratio to its
  // nearest canonical ratio, normalised. Closer = higher bonus, up to +0.1.
  const meanRatio = ratios.reduce((s, r) => s + r, 0) / ratios.length;
  const nearest = CANONICAL_RATIOS.reduce(
    (best, ref) => Math.abs(meanRatio - ref) < Math.abs(meanRatio - best) ? ref : best,
    CANONICAL_RATIOS[0],
  );
  const canonicalDistance = Math.abs(meanRatio - nearest);
  if (canonicalDistance < 0.05) rhythm += 0.1;

  return clamp01(rhythm);
}

// ═══════════════════════════════════════════════════════════════════════════
// 7.5 — Negative space ratio
// ═══════════════════════════════════════════════════════════════════════════
// Fraction of pixels whose colour differs meaningfully from the declared
// background token. Sweet-spot [0.2, 0.6]: score is 1.0 inside the band and
// degrades linearly outside it.
export function scoreNegativeSpaceRatio(rawSample, paletteTokens) {
  if (!rawSample || !rawSample.data) return null;
  const { data, info } = rawSample;
  const channels = info.channels || 3;
  const pixels = info.width * info.height;

  const bg = extractBackgroundRgb(paletteTokens) ?? inferBackgroundFromCorners(data, info);
  if (!bg) return null;

  let content = 0;
  for (let i = 0; i < pixels; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    // A pixel is "content" when its Euclidean distance from the background
    // exceeds a modest threshold. 18 in 0..255 space = ~7% perceptual delta,
    // generous enough to absorb PNG compression / subpixel AA.
    const dr = r - bg[0];
    const dg = g - bg[1];
    const db = b - bg[2];
    if (dr * dr + dg * dg + db * db > 324) content++;
  }
  const ratio = content / pixels;

  // Sweet-spot: [0.2, 0.6]. Outside → penalty scales with distance.
  if (ratio >= 0.2 && ratio <= 0.6) return 1;
  if (ratio < 0.2) return clamp01(ratio / 0.2);
  // ratio > 0.6: 0.6 → 1.0, 1.0 → 0.0 (fully saturated).
  return clamp01(1 - (ratio - 0.6) / 0.4);
}

// ═══════════════════════════════════════════════════════════════════════════
// 7.6 — Colour harmony
// ═══════════════════════════════════════════════════════════════════════════
// k-means on the 32×32 sample (k = 8), then for each cluster centre find the
// nearest palette token in Lab space and compute ΔE2000. Score is mean(1 -
// ΔE/20) clamped to [0, 1]. ΔE 0..5 = "a well-trained eye can't tell them
// apart", 5..10 "perceptually different but close", 20+ "different colours".
export function scoreColorHarmony(rawSample, paletteTokens) {
  if (!rawSample || !rawSample.data) return null;
  const palette = extractPaletteRgb(paletteTokens);
  if (!palette || palette.length === 0) return null;
  const { data, info } = rawSample;
  const channels = info.channels || 3;
  const pixels = info.width * info.height;

  const samples = new Array(pixels);
  for (let i = 0; i < pixels; i++) {
    samples[i] = [data[i * channels], data[i * channels + 1], data[i * channels + 2]];
  }
  const k = Math.min(8, pixels);
  const centroids = kmeans(samples, k, 12);

  // Convert both centroids and palette to Lab once.
  const paletteLab = palette.map(([r, g, b]) => srgbToLab(r / 255, g / 255, b / 255));
  let deltaSum = 0;
  let sampleCount = 0;
  for (const c of centroids) {
    const lab = srgbToLab(c[0] / 255, c[1] / 255, c[2] / 255);
    let best = Infinity;
    for (const plab of paletteLab) {
      const d = deltaE2000(lab, plab);
      if (d < best) best = d;
    }
    deltaSum += Math.min(best, 20);
    sampleCount++;
  }
  if (sampleCount === 0) return null;
  const meanDelta = deltaSum / sampleCount;
  return clamp01(1 - meanDelta / 20);
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers — DBSCAN, k-means, colour spaces
// ═══════════════════════════════════════════════════════════════════════════
// The helpers below are deliberately compact. They solve the specific shapes
// needed by the scorers above (2-D Euclidean DBSCAN, 3-D Euclidean k-means,
// sRGB↔Lab↔OKLCH) and don't try to be general-purpose libraries.

// DBSCAN over 2-D points. Returns an array of clusters; each cluster is an
// array of the original point objects. Singletons are emitted as length-1
// clusters so downstream code can count them.
function dbscan(points, eps, minPts) {
  const visited = new Uint8Array(points.length);
  const clusters = [];
  const eps2 = eps * eps;

  for (let i = 0; i < points.length; i++) {
    if (visited[i]) continue;
    visited[i] = 1;
    const neighbours = regionQuery(points, i, eps2);
    if (neighbours.length + 1 < minPts) {
      clusters.push([points[i]]);
      continue;
    }
    const cluster = [points[i]];
    const seeds = neighbours.slice();
    while (seeds.length > 0) {
      const j = seeds.pop();
      if (visited[j]) continue;
      visited[j] = 1;
      cluster.push(points[j]);
      const more = regionQuery(points, j, eps2);
      if (more.length + 1 >= minPts) {
        for (const idx of more) if (!visited[idx]) seeds.push(idx);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

function regionQuery(points, index, eps2) {
  const p = points[index];
  const out = [];
  for (let i = 0; i < points.length; i++) {
    if (i === index) continue;
    const dx = points[i].x - p.x;
    const dy = points[i].y - p.y;
    if (dx * dx + dy * dy <= eps2) out.push(i);
  }
  return out;
}

// k-means on 3-D integer points (RGB). Deterministic init: pick k evenly-
// spaced samples from the input so calibration remains reproducible.
function kmeans(points, k, maxIter) {
  if (points.length <= k) return points.slice();
  const centroids = [];
  const step = Math.floor(points.length / k);
  for (let i = 0; i < k; i++) centroids.push(points[i * step].slice());

  const assign = new Int32Array(points.length);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = dist3(p, centroids[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      if (assign[i] !== best) { assign[i] = best; changed = true; }
    }
    if (!changed) break;
    // Recompute centroids.
    const sums = centroids.map(() => [0, 0, 0, 0]); // r, g, b, count
    for (let i = 0; i < points.length; i++) {
      const c = assign[i];
      sums[c][0] += points[i][0];
      sums[c][1] += points[i][1];
      sums[c][2] += points[i][2];
      sums[c][3] += 1;
    }
    for (let c = 0; c < centroids.length; c++) {
      if (sums[c][3] === 0) continue;
      centroids[c] = [sums[c][0] / sums[c][3], sums[c][1] / sums[c][3], sums[c][2] / sums[c][3]];
    }
  }
  return centroids;
}

function dist3(a, b) {
  const d0 = a[0] - b[0], d1 = a[1] - b[1], d2 = a[2] - b[2];
  return d0 * d0 + d1 * d1 + d2 * d2;
}

// sRGB linear → CIE XYZ (D65) → Lab. L only version used by entropy; full Lab
// used by ΔE2000.
function srgbToLabL(r, g, b) {
  return srgbToLab(r, g, b)[0];
}

function srgbToLab(r, g, b) {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  // sRGB D65 to XYZ.
  const x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
  const z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041;
  // Reference white D65.
  const xn = x / 0.95047;
  const yn = y / 1.00000;
  const zn = z / 1.08883;
  const fx = fLab(xn), fy = fLab(yn), fz = fLab(zn);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bb = 200 * (fy - fz);
  return [L, a, bb];
}

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function fLab(t) {
  const e = 0.008856;
  const k = 903.3;
  return t > e ? Math.cbrt(t) : (k * t + 16) / 116;
}

// ΔE2000 — the modern CIE colour-difference formula. Several review papers
// validate this as the most perceptually-accurate formulation widely deployed.
function deltaE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = hueDeg(b1, a1p);
  const h2p = hueDeg(b2, a2p);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp;
  if (C1p * C2p === 0) dhp = 0;
  else if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
  else if (h2p - h1p > 180) dhp = h2p - h1p - 360;
  else dhp = h2p - h1p + 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(degToRad(dhp / 2));
  const Lbar = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;
  let hbarp;
  if (C1p * C2p === 0) hbarp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2;
  else if (h1p + h2p < 360) hbarp = (h1p + h2p + 360) / 2;
  else hbarp = (h1p + h2p - 360) / 2;
  const T = 1 - 0.17 * Math.cos(degToRad(hbarp - 30))
              + 0.24 * Math.cos(degToRad(2 * hbarp))
              + 0.32 * Math.cos(degToRad(3 * hbarp + 6))
              - 0.20 * Math.cos(degToRad(4 * hbarp - 63));
  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Rc = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(Lbar - 50, 2)) / Math.sqrt(20 + Math.pow(Lbar - 50, 2));
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(degToRad(2 * dTheta)) * Rc;
  return Math.sqrt(
    Math.pow(dLp / Sl, 2) +
    Math.pow(dCp / Sc, 2) +
    Math.pow(dHp / Sh, 2) +
    Rt * (dCp / Sc) * (dHp / Sh)
  );
}

function hueDeg(b, a) {
  if (b === 0 && a === 0) return 0;
  const h = Math.atan2(b, a) * 180 / Math.PI;
  return h < 0 ? h + 360 : h;
}
function degToRad(d) { return d * Math.PI / 180; }

// ── Palette / background extraction ─────────────────────────────────────────
// DTCG palette tokens can take many shapes. We accept any of:
//   { "color.background.default": { "$value": "#RRGGBB" } }
//   { colors: { background: "#RRGGBB", primary: "#..." } }
//   { palette: ["#...", "#...", ...] }
// …and fall back to scanning the image corners for the background when the
// token set doesn't declare one.
function extractBackgroundRgb(paletteTokens) {
  if (!paletteTokens || typeof paletteTokens !== 'object') return null;
  const candidates = [
    paletteTokens?.color?.background?.default?.$value,
    paletteTokens?.color?.background?.$value,
    paletteTokens?.colors?.background,
    paletteTokens?.background,
  ];
  for (const c of candidates) {
    const rgb = parseColor(c);
    if (rgb) return rgb;
  }
  return null;
}

function extractPaletteRgb(paletteTokens) {
  if (!paletteTokens || typeof paletteTokens !== 'object') return null;
  const out = [];
  // DTCG: walk the tree looking for any $value that parses as a colour.
  walkValues(paletteTokens, (v) => {
    const rgb = parseColor(v);
    if (rgb) out.push(rgb);
  });
  if (out.length === 0 && Array.isArray(paletteTokens.palette)) {
    for (const v of paletteTokens.palette) {
      const rgb = parseColor(v);
      if (rgb) out.push(rgb);
    }
  }
  // De-dup.
  const key = (rgb) => `${rgb[0]}-${rgb[1]}-${rgb[2]}`;
  const seen = new Set();
  const deduped = [];
  for (const rgb of out) {
    const k = key(rgb);
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(rgb);
  }
  return deduped;
}

function walkValues(obj, visit, depth = 0) {
  if (depth > 6 || !obj || typeof obj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) {
    if (k === '$value') visit(v);
    if (v && typeof v === 'object') walkValues(v, visit, depth + 1);
    else if (typeof v === 'string') visit(v);
  }
}

function parseColor(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  // #RRGGBB / #RGB
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const body = hex[1];
    if (body.length === 3) {
      return [
        parseInt(body[0] + body[0], 16),
        parseInt(body[1] + body[1], 16),
        parseInt(body[2] + body[2], 16),
      ];
    }
    return [
      parseInt(body.slice(0, 2), 16),
      parseInt(body.slice(2, 4), 16),
      parseInt(body.slice(4, 6), 16),
    ];
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/i);
  if (rgb) return [parseInt(rgb[1], 10), parseInt(rgb[2], 10), parseInt(rgb[3], 10)];
  return null;
}

function inferBackgroundFromCorners(data, info) {
  const channels = info.channels || 3;
  const w = info.width;
  const h = info.height;
  const corners = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];
  const sums = [0, 0, 0];
  for (const [x, y] of corners) {
    const i = (y * w + x) * channels;
    sums[0] += data[i];
    sums[1] += data[i + 1];
    sums[2] += data[i + 2];
  }
  return [sums[0] / 4, sums[1] / 4, sums[2] / 4];
}

// ── Utility helpers ─────────────────────────────────────────────────────────
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function variance(arr) {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
}
function roundTo(v, p) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}
function bucketBy(items, key) {
  const map = new Map();
  for (const it of items) {
    const k = Math.round(key(it));
    map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
}
function parseFontSize(fs) {
  if (typeof fs === 'number' && Number.isFinite(fs)) return fs;
  if (typeof fs !== 'string') return null;
  const m = fs.match(/([\d.]+)\s*(px|rem|em)?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] || 'px').toLowerCase();
  if (unit === 'rem' || unit === 'em') return n * 16; // best-effort; DOM snapshot reports px anyway.
  return n;
}

// Computes an axe-violation-count-based 0..10 accessibility sub-score.
// Included here rather than in a separate file because it shares the
// "deterministic scorer" conceptual bucket and gets injected into the LLM
// critique alongside the numeric scores. See Task 9.2.
export function scoreAxe(axeResult) {
  if (!axeResult || !Array.isArray(axeResult.violations)) return null;
  const weights = { critical: 3, serious: 2, moderate: 1, minor: 0.5 };
  let deduction = 0;
  for (const v of axeResult.violations) {
    const w = weights[v.impact] ?? 0.5;
    // One rule can have many nodes; each node is a discrete a11y bug, so we
    // deduct per node (capped at 5 per rule so a single buggy rule can't
    // eclipse everything).
    const nodes = Math.min(5, Array.isArray(v.nodes) ? v.nodes.length : 1);
    deduction += w * nodes;
  }
  return Math.max(0, Math.min(10, 10 - deduction));
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI entrypoint
// ═══════════════════════════════════════════════════════════════════════════
// Allows the critique hook instructions to invoke the scorer from Claude's
// Bash tool after the screenshot has been captured. Stays inactive on import.
//
// Usage:
//   node numeric-aesthetic-scorer.mjs \
//       --screenshot <png> \
//       --dom <dom-snapshot.json> \
//       [--palette <palette-tokens.json>] \
//       [--axe <axe-result.json>] \
//       [--out <output.json>]
//
// The DOM snapshot is a JSON file produced by Claude via browser_evaluate.
// The critique hook instructs Claude to serialise `document.querySelectorAll`
// results with computed style into that shape.

import { pathToFileURL } from 'node:url';
import { readFileSync as _readFileSync, writeFileSync as _writeFileSync } from 'node:fs';

const _isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href;

async function _cliMain() {
  const flag = (name) => {
    const i = process.argv.indexOf(`--${name}`);
    return i === -1 ? null : process.argv[i + 1];
  };
  const screenshot = flag('screenshot');
  const domPath = flag('dom');
  const palettePath = flag('palette');
  const axePath = flag('axe');
  const outPath = flag('out');

  if (!screenshot && !domPath) {
    process.stderr.write(
      'usage: numeric-aesthetic-scorer.mjs --screenshot <png> --dom <snapshot.json> [--palette <tokens.json>] [--axe <axe.json>] [--out <result.json>]\n',
    );
    process.exit(2);
  }

  const dom = domPath ? safeReadJson(domPath) : null;
  const palette = palettePath ? safeReadJson(palettePath) : null;
  const axe = axePath ? safeReadJson(axePath) : null;

  const numeric = await scoreAesthetic(screenshot, dom, palette);
  const result = {
    ...numeric,
    accessibility_axe_score: axe ? scoreAxe(axe) : null,
  };

  const out = JSON.stringify(result, null, 2) + '\n';
  if (outPath) _writeFileSync(outPath, out, 'utf8');
  else process.stdout.write(out);
}

function safeReadJson(p) {
  try { return JSON.parse(_readFileSync(p, 'utf8')); }
  catch (err) {
    process.stderr.write(`warn: could not read ${p}: ${err.message || err}\n`);
    return null;
  }
}

if (_isMain) {
  _cliMain().catch((err) => {
    process.stderr.write(`scorer failed: ${err.stack || err.message || err}\n`);
    process.exit(1);
  });
}
