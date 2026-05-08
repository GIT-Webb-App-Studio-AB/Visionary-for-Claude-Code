// style-blend-resolver.mjs — Sprint 17 Task 33.2
// Resolves a (possibly off-catalog) 8D embedding-vector into a complete
// Design Reasoning Brief: palette, typography, motion-tier, density-tokens.
//
// This is the bridge between the slerp output (a vector that may not match any
// single catalog style) and stage 3 generation, which needs a concrete brief
// (5-color palette, font pair, motion tier, spacing scale). Without this
// resolver, slerp produces abstract vectors that the generator can't consume.
//
// Pipeline:
//   1. find 3 nearest catalog anchors via cosine
//   2. weight-blend each anchor's pre-baked palette in oklch (perceptually
//      uniform; lerping in hex would shift hue and dim chroma incorrectly)
//   3. project (type_drama, formality) onto pre-baked typography matrix
//   4. quantize motion_intensity to integer tier ∈ {0,1,2,3}
//   5. lerp density tokens between tight (4px-grid) and spacious (12px-grid)
//   6. APCA-clamp body/bg pairing to Lc ≥ 75 (boost contrast if blend muddied)
//
// Pure, dep-free helper. No I/O beyond reading two pre-baked JSON files
// (palette-tokens.json, typography-matrix.json) once and caching them.
// Determinism: identical inputs → identical brief.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadEmbeddings,
  cosine8D,
  AXES,
  vectorToArray,
  arrayToVector,
} from './style-blend.mjs';

// APCA Lc thresholds (matching SKILL.md WCAG section).
// Lc 75 is the body-text floor for WCAG 2.2 AA-equivalent on small text;
// Lc 60 is acceptable for large text (≥ 24px or ≥ 18.66px bold);
// Lc 45 is the absolute floor for non-text UI components.
export const APCA_BODY_FLOOR = 75;
export const APCA_LARGE_FLOOR = 60;
export const APCA_UI_FLOOR = 45;

// Density tokens: linear-interpolate base spacing scale by `density` axis.
// density=0 → spacious  (multiply by 1.5)
// density=0.5 → standard (1.0×)
// density=1 → tight     (multiply by 0.6)
const BASE_SPACING_PX = [4, 8, 12, 16, 24, 32, 48, 64];

// Motion tier thresholds. Sprint 17 spec: [0.25, 0.5, 0.75]. Slightly tightened
// at the edges to give Static and Kinetic more reach (matches the embeddings
// fixture where most styles cluster at 0.33 / 0.67).
const MOTION_TIER_THRESHOLDS = [0.16, 0.49, 0.83];

let _palettesCache = null;
let _palettesCachePath = null;
let _typographyCache = null;
let _typographyCachePath = null;

// ── Pre-baked data loaders ─────────────────────────────────────────────────

function defaultPalettePath() {
  const __filename = fileURLToPath(import.meta.url);
  return resolve(
    dirname(__filename),
    '..',
    '..',
    '..',
    'skills',
    'visionary',
    'palette-tokens.json'
  );
}

function defaultTypographyPath() {
  const __filename = fileURLToPath(import.meta.url);
  return resolve(
    dirname(__filename),
    '..',
    '..',
    '..',
    'skills',
    'visionary',
    'typography-matrix.json'
  );
}

export function loadPalettes(customPath) {
  if (_palettesCache && _palettesCachePath === (customPath || null)) {
    return _palettesCache;
  }
  const path = customPath || defaultPalettePath();
  if (!existsSync(path)) {
    _palettesCache = { palettes: {}, fallback: null };
    _palettesCachePath = customPath || null;
    return _palettesCache;
  }
  try {
    _palettesCache = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    _palettesCache = { palettes: {}, fallback: null };
  }
  _palettesCachePath = customPath || null;
  return _palettesCache;
}

export function loadTypographyMatrix(customPath) {
  if (_typographyCache && _typographyCachePath === (customPath || null)) {
    return _typographyCache;
  }
  const path = customPath || defaultTypographyPath();
  if (!existsSync(path)) {
    _typographyCache = { pairs: [], fallback_id: 'humanistic-warm', low_confidence_threshold: 0.35 };
    _typographyCachePath = customPath || null;
    return _typographyCache;
  }
  try {
    _typographyCache = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    _typographyCache = { pairs: [], fallback_id: 'humanistic-warm', low_confidence_threshold: 0.35 };
  }
  _typographyCachePath = customPath || null;
  return _typographyCache;
}

// Test/utility: drop caches so consecutive loads with different fixtures behave.
export function _resetResolverCaches() {
  _palettesCache = null;
  _palettesCachePath = null;
  _typographyCache = null;
  _typographyCachePath = null;
}

// ── 1. Nearest catalog anchors ─────────────────────────────────────────────

// Find the k catalog anchors closest to `targetVector` by cosine similarity.
// Returns objects { id, similarity } sorted high → low.
export function findNearestAnchors(targetVector, k = 3, opts = {}) {
  const embeddings = opts.embeddings || loadEmbeddings(opts.embeddingsPath);
  const ids = Object.keys(embeddings);
  if (ids.length === 0) return [];
  const ranked = ids.map((id) => ({
    id,
    similarity: cosine8D(targetVector, embeddings[id]),
  }));
  ranked.sort((a, b) => b.similarity - a.similarity);
  return ranked.slice(0, k);
}

// ── 2. Palette: blend pre-baked anchor palettes in oklch ──────────────────

// Parse "oklch(L C H)" — accepts either "oklch(0.95 0.02 90)" or
// "oklch(0.95 0.02 90 / 0.8)" form. Returns {L, C, H, alpha} or null.
export function parseOklch(str) {
  if (typeof str !== 'string') return null;
  const m = str.match(/oklch\(\s*([\d.+-]+%?)\s+([\d.+-]+%?)\s+([\d.+-]+)(?:\s*\/\s*([\d.+-]+%?))?\s*\)/i);
  if (!m) return null;
  let L = parseFloat(m[1]);
  if (m[1].endsWith('%')) L /= 100;
  const C = parseFloat(m[2]);
  const H = parseFloat(m[3]);
  let alpha = 1;
  if (m[4]) {
    alpha = parseFloat(m[4]);
    if (m[4].endsWith('%')) alpha /= 100;
  }
  return { L, C, H, alpha };
}

export function formatOklch({ L, C, H, alpha = 1 }) {
  const round = (x, p = 3) => {
    const f = 10 ** p;
    return Math.round(x * f) / f;
  };
  const base = `oklch(${round(L)} ${round(C)} ${round(H, 1)})`;
  if (alpha < 1) return `oklch(${round(L)} ${round(C)} ${round(H, 1)} / ${round(alpha, 2)})`;
  return base;
}

// Lerp two oklch colors by factor t ∈ [0,1].
// L and C are linear; H is angular (0..360), so we wrap via shortest-arc.
export function lerpOklch(a, b, t) {
  if (!a) return b;
  if (!b) return a;
  const L = a.L * (1 - t) + b.L * t;
  const C = a.C * (1 - t) + b.C * t;
  // Hue interpolation along the shortest arc.
  let dh = b.H - a.H;
  if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;
  let H = a.H + dh * t;
  // Normalize H back to [0, 360).
  H = ((H % 360) + 360) % 360;
  const alpha = (a.alpha ?? 1) * (1 - t) + (b.alpha ?? 1) * t;
  return { L, C, H, alpha };
}

// Weighted blend of N oklch colors. Weights need not sum to 1 — they are
// re-normalized internally. Implemented as successive pairwise lerp so the
// hue-arc logic stays correct even when crossing the 0/360 wraparound.
export function blendOklchN(colors, weights) {
  if (!Array.isArray(colors) || colors.length === 0) return null;
  const cleanWeights = weights.map((w) => Math.max(0, Number(w) || 0));
  const total = cleanWeights.reduce((s, w) => s + w, 0);
  if (total === 0) return colors[0] || null;
  const wNorm = cleanWeights.map((w) => w / total);

  let acc = colors[0];
  let accW = wNorm[0];
  for (let i = 1; i < colors.length; i++) {
    const next = colors[i];
    if (!next) continue;
    if (!acc) {
      acc = next;
      accW = wNorm[i];
      continue;
    }
    const sumW = accW + wNorm[i];
    const t = sumW === 0 ? 0 : wNorm[i] / sumW;
    acc = lerpOklch(acc, next, t);
    accW = sumW;
  }
  return acc;
}

// Resolve palette by blending top-k anchor palettes per-slot in oklch.
// `anchorRanks` is the output of findNearestAnchors; `weights` are the cosine
// similarities (or a normalized derivation). Missing per-anchor palette falls
// back to the catalog fallback so we never emit `null` colors.
export function resolvePalette(anchorRanks, weights, opts = {}) {
  const palettes = opts.palettes || loadPalettes(opts.palettesPath);
  const fallback = palettes.fallback || {
    bg: 'oklch(0.985 0.000 0)',
    fg: 'oklch(0.180 0.020 250)',
    accent: 'oklch(0.550 0.150 250)',
    accent2: 'oklch(0.500 0.100 250)',
    muted: 'oklch(0.850 0.010 250)',
  };

  // Collect per-anchor palettes (with fallback for missing ids).
  const collected = anchorRanks.map((a) => palettes.palettes?.[a.id] || fallback);

  // Per-slot blend.
  const slots = ['bg', 'fg', 'accent', 'accent2', 'muted'];
  const result = {};
  for (const slot of slots) {
    const colors = collected
      .map((p) => parseOklch(p[slot] || fallback[slot]))
      .filter(Boolean);
    if (colors.length === 0) {
      result[slot] = fallback[slot];
      continue;
    }
    const blended = blendOklchN(colors, weights);
    result[slot] = blended ? formatOklch(blended) : fallback[slot];
  }
  return result;
}

// ── 3. Typography: project (type_drama, formality) onto pre-baked matrix ──

export function resolveTypography(typeDrama, formality, opts = {}) {
  const matrix = opts.matrix || loadTypographyMatrix(opts.matrixPath);
  const pairs = matrix.pairs || [];
  if (pairs.length === 0) {
    return null;
  }
  const td = clamp01(typeDrama);
  const f = clamp01(formality);

  // Find nearest pair by Euclidean distance in the 2D plane.
  let best = pairs[0];
  let bestDist = Infinity;
  for (const pair of pairs) {
    const dx = (pair.type_drama ?? 0.5) - td;
    const dy = (pair.formality ?? 0.5) - f;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = pair;
    }
  }

  const lowConfidenceThreshold = matrix.low_confidence_threshold ?? 0.35;
  let snapped = false;
  let chosen = best;

  // If we're far from the nearest pair (point sits between archetypes with no
  // clear winner), snap to the universally-safe fallback.
  if (bestDist > lowConfidenceThreshold) {
    const fallbackId = matrix.fallback_id || 'humanistic-warm';
    const fb = pairs.find((p) => p.id === fallbackId);
    if (fb) {
      chosen = fb;
      snapped = true;
    }
  }

  return {
    id: chosen.id,
    display: chosen.display,
    body: chosen.body,
    mono: chosen.mono,
    weight_range: chosen.weight_range,
    google_subset: chosen.google_subset,
    confidence: 1 - Math.min(1, bestDist / Math.SQRT2),
    distance: bestDist,
    snapped,
  };
}

// ── 4. Motion tier ────────────────────────────────────────────────────────

// Quantize fractional motion_intensity to integer tier.
// Thresholds: [0.16, 0.49, 0.83] → tiers 0, 1, 2, 3
// 0 = Static, 1 = Subtle, 2 = Expressive, 3 = Kinetic
export function resolveMotionTier(motionIntensity) {
  const v = Number(motionIntensity);
  if (!Number.isFinite(v)) return 1; // safe default = Subtle
  if (v < MOTION_TIER_THRESHOLDS[0]) return 0;
  if (v < MOTION_TIER_THRESHOLDS[1]) return 1;
  if (v < MOTION_TIER_THRESHOLDS[2]) return 2;
  return 3;
}

export const MOTION_TIER_NAMES = ['Static', 'Subtle', 'Expressive', 'Kinetic'];

// ── 5. Density tokens ─────────────────────────────────────────────────────

export function resolveDensityTokens(density) {
  const d = clamp01(density);
  // density=0 → spacious (1.5×); density=0.5 → 1.0×; density=1 → tight (0.6×)
  // Mapping: factor = 1.5 + (0.6 - 1.5) * d = 1.5 - 0.9 * d
  const factor = 1.5 - 0.9 * d;

  const scale = BASE_SPACING_PX.map((px) => Math.round(px * factor * 10) / 10);
  const baseGridPx = scale[1]; // index 1 is the 8px slot post-scale

  return {
    factor: Math.round(factor * 1000) / 1000,
    base_grid_px: baseGridPx,
    spacing: {
      xs: scale[0],
      sm: scale[1],
      md: scale[2],
      lg: scale[3],
      xl: scale[4],
      '2xl': scale[5],
      '3xl': scale[6],
      '4xl': scale[7],
    },
    radius_base_px: Math.round(baseGridPx * 0.5 * 10) / 10,
  };
}

// ── 6. APCA contrast helpers ──────────────────────────────────────────────

// Approximate APCA Lc using oklch L (perceptual lightness) directly.
// True APCA computes Y from sRGB + a power-law + polarity weighting; here we
// use a simplified approximation that is monotone in true APCA on the body
// text vs body bg pairing — sufficient for the v1 floor-check. Sprint 9-10
// can swap this for the real apca-w3 implementation without changing the API.
//
// |ΔL| × 110 gives a value that is roughly Lc on typical bg/fg pairings.
// The "/2" factor at the end accounts for chroma overlap dampening.
export function approximateApcaLc(textColor, bgColor) {
  const text = typeof textColor === 'string' ? parseOklch(textColor) : textColor;
  const bg = typeof bgColor === 'string' ? parseOklch(bgColor) : bgColor;
  if (!text || !bg) return 0;
  const dL = Math.abs(text.L - bg.L);
  // Empirical scale: a swiss-rationalism #000 on #FFF (L≈0 vs L≈1) maps to
  // ~Lc 106 in real APCA. dL=1 × 106 = 106. Match that.
  return Math.round(dL * 106);
}

// Boost fg/bg contrast in oklch space until |ΔL| satisfies the floor.
// Strategy: push fg toward the dark or light pole opposite to bg until Lc
// passes the threshold. If pushing fg alone hits the {0, 1} bound before
// the floor is reached (typical when bg sits near mid-luminance L≈0.5),
// also push bg in the opposite direction so the combined ΔL clears the
// floor. Returns updated bg only when it had to move.
// Preserves chroma and hue (only L moves).
export function clampOklchContrast(textColor, bgColor, floorLc = APCA_BODY_FLOOR) {
  const text = parseOklch(textColor);
  const bg = parseOklch(bgColor);
  if (!text || !bg) {
    return { textColor, bgColor, clamped: false };
  }
  const initial = approximateApcaLc(text, bg);
  if (initial >= floorLc) {
    return { textColor: formatOklch(text), bgColor: formatOklch(bg), clamped: false };
  }
  const targetDL = floorLc / 106;
  // Decide push direction: if bg is light (L>0.5), darken fg; otherwise
  // lighten fg. When bg sits near 0.5, this is arbitrary but symmetric.
  const goDark = bg.L > 0.5;

  // Step 1: push fg as far as it can go (clamped to [0, 1]).
  let newFgL = goDark ? bg.L - targetDL : bg.L + targetDL;
  newFgL = Math.max(0, Math.min(1, newFgL));

  let newBgL = bg.L;
  // Step 2: if fg alone couldn't reach the floor, also move bg the other way.
  const achievedDL = Math.abs(newFgL - bg.L);
  if (achievedDL < targetDL - 0.001) {
    const remainingDL = targetDL - achievedDL;
    // Move bg in the opposite direction (lighten if we darkened fg).
    newBgL = goDark ? bg.L + remainingDL : bg.L - remainingDL;
    newBgL = Math.max(0, Math.min(1, newBgL));
  }

  const adjustedText = { ...text, L: newFgL };
  const adjustedBg = { ...bg, L: newBgL };
  return {
    textColor: formatOklch(adjustedText),
    bgColor: formatOklch(adjustedBg),
    clamped: true,
    bgClamped: newBgL !== bg.L,
  };
}

// Apply APCA clamps to a 5-slot palette. Currently only enforces the body
// floor on (fg vs bg). Other pairings (accent vs bg) are tracked but use
// large-text floor since accents typically render on buttons / headings.
export function applyApcaClamps(palette, opts = {}) {
  const bodyFloor = opts.bodyFloor ?? APCA_BODY_FLOOR;
  const largeFloor = opts.largeFloor ?? APCA_LARGE_FLOOR;
  const result = { ...palette };
  const clamps_applied = [];

  // Body fg vs bg — must satisfy Lc ≥ bodyFloor. May adjust both fg and bg.
  const bodyLcBefore = approximateApcaLc(palette.fg, palette.bg);
  if (bodyLcBefore < bodyFloor) {
    const { textColor: newFg, bgColor: newBg, clamped, bgClamped } = clampOklchContrast(
      palette.fg,
      palette.bg,
      bodyFloor
    );
    if (clamped) {
      result.fg = newFg;
      if (bgClamped) {
        result.bg = newBg;
        clamps_applied.push('apca_body_bg_adjusted');
      }
      clamps_applied.push('apca_body_floor');
    }
  }

  // Accent vs (post-clamp) bg — must satisfy Lc ≥ largeFloor.
  const accentLcBefore = approximateApcaLc(palette.accent, result.bg);
  if (accentLcBefore < largeFloor) {
    const { textColor: newAccent, clamped } = clampOklchContrast(
      palette.accent,
      result.bg,
      largeFloor
    );
    if (clamped) {
      result.accent = newAccent;
      clamps_applied.push('apca_accent_floor');
    }
  }

  return { palette: result, clamps_applied };
}

// ── Main API ──────────────────────────────────────────────────────────────

// Resolve a full Design Reasoning Brief from an 8D vector.
// `vector` may be either an array (8 numbers in AXES order) or an object
// with axis-name keys. opts allows test injection of fixtures.
export function resolveBrief(vector, opts = {}) {
  // Normalize input shape — slerpN returns an object form, but tests may pass
  // arrays or random-generated raw arrays.
  const vObj = Array.isArray(vector) ? arrayToVector(vector) : vector;
  const vArr = vectorToArray(vObj);

  // 1. Find nearest 3 anchors.
  const anchors = findNearestAnchors(vArr, 3, opts);
  // Negative similarities can technically arise; clamp to 0 so they don't
  // pull the blend in inverted directions. If all similarities are 0 (no
  // overlap with catalog), fall back to uniform weights.
  const rawWeights = anchors.map((a) => Math.max(0, a.similarity));
  const sumW = rawWeights.reduce((s, w) => s + w, 0);
  const normWeights = sumW > 0
    ? rawWeights.map((w) => w / sumW)
    : anchors.map(() => 1 / Math.max(1, anchors.length));

  // 2. Palette.
  let palette = resolvePalette(anchors, normWeights, opts);

  // 3. Typography.
  const typography = resolveTypography(vObj.type_drama, vObj.formality, opts);

  // 4. Motion tier.
  const motion_tier = resolveMotionTier(vObj.motion_intensity);

  // 5. Density tokens.
  const density_tokens = resolveDensityTokens(vObj.density);

  // 6. APCA clamp pass.
  const { palette: clampedPalette, clamps_applied } = applyApcaClamps(palette, opts);

  return {
    vector: vObj,
    palette: clampedPalette,
    typography,
    motion_tier,
    motion_tier_name: MOTION_TIER_NAMES[motion_tier],
    density_tokens,
    anchors_used: anchors,
    blend_recipe: {
      anchors: anchors.map((a, i) => ({
        id: a.id,
        similarity: a.similarity,
        weight: normWeights[i],
      })),
      vector: vObj,
    },
    clamps_applied,
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────

function clamp01(x) {
  const v = Number(x);
  if (!Number.isFinite(v)) return 0.5;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
