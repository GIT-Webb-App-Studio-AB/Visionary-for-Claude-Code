// validate.mjs — Sprint 21 Task 38.3
//
// Post-generation constraint validators. Each validator takes a
// {dom, css} input shape (the DOM snapshot extracted by Playwright +
// computed style information) and returns:
//   { passed: boolean, evidence: string }
//
// Sprint 21 v1 implements 8 of the 40 validators (the most-grounded
// constraints — single-color, no-rectangles, monospace-headlines,
// asymmetry-only, no-transitions, single-typeface, no-center,
// max-3-colors). The remaining 32 return graceful-degradation passes
// with `evidence: 'validator not implemented in v1'`. v2 implements all 40.
//
// The {dom, css} input shape:
//   dom: {
//     elements: [
//       {
//         selector: string,
//         tagName: string,
//         text: string | null,
//         bbox: { x, y, width, height },
//         style: {
//           color, backgroundColor, borderColor,
//           fontFamily, fontSize, fontStyle, fontWeight,
//           textAlign, textTransform, letterSpacing,
//           borderRadius, borderTopLeftRadius, ...,
//           transform, transitionDuration, animationDuration, animationName,
//           animationIterationCount, animationPlayState, animationTimeline,
//           animationDelay, animationFillMode, animationTimingFunction,
//           transitionTimingFunction,
//           writingMode, marginLeft, marginRight, marginTop, marginBottom,
//           gridTemplateColumns, flexDirection,
//           backgroundImage, mixBlendMode, clipPath, overflow,
//           display
//         }
//       },
//       ...
//     ],
//     viewport: { width, height }
//   }
//   css: { rawText: string }   // optional — full stylesheet text for AST checks
//
// Note: validators tolerate missing fields gracefully (return `passed: true`
// with `evidence: 'insufficient signal'`) so partial DOM snapshots don't
// produce false positives.

// ── Color helpers ──────────────────────────────────────────────────────────

/**
 * Parse a CSS color string (rgb, rgba, hex, hsl, oklch) into approximate
 * OKLCH coordinates. Best-effort — full color-space conversion is out of
 * scope for the v1 validator. We extract enough to bin by hue and detect
 * neutrals (chroma < 0.02).
 *
 * Returns { L: 0-1, C: 0-0.4, H: 0-360 } or null if parse fails.
 */
function parseColor(s) {
  if (typeof s !== 'string') return null;
  const t = s.trim().toLowerCase();
  if (t === '' || t === 'transparent' || t === 'none') return null;

  // oklch(L C H) — use as-is
  let m = t.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/);
  if (m) {
    const Lraw = m[1];
    const L = Lraw.endsWith('%')
      ? parseFloat(Lraw) / 100
      : parseFloat(Lraw);
    return { L, C: parseFloat(m[2]), H: parseFloat(m[3]) };
  }

  // rgb / rgba
  m = t.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    return rgbToOklchApprox(+m[1], +m[2], +m[3]);
  }
  // rgb with whitespace separators (modern syntax)
  m = t.match(/^rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)/);
  if (m) {
    return rgbToOklchApprox(+m[1], +m[2], +m[3]);
  }

  // #hex
  m = t.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let hex = m[1];
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return rgbToOklchApprox(r, g, b);
    }
  }

  return null;
}

/**
 * Approximate sRGB → OKLCH. Good enough for hue-binning and chroma cutoff.
 * Not photogrammetric-accurate; the v1 validators don't need it.
 */
function rgbToOklchApprox(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  // Quick perceptual lightness (Y of sRGB).
  const L = 0.2126 * rn + 0.7152 * gn + 0.0722 * bn;
  // Chroma estimate: distance from grayscale axis.
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const C = (max - min) * 0.5;  // scaled to roughly OKLCH range
  // Hue estimate: classic HSL hue formula.
  let H = 0;
  if (max === min) {
    H = 0;
  } else if (max === rn) {
    H = ((gn - bn) / (max - min)) * 60;
  } else if (max === gn) {
    H = (((bn - rn) / (max - min)) + 2) * 60;
  } else {
    H = (((rn - gn) / (max - min)) + 4) * 60;
  }
  if (H < 0) H += 360;
  return { L, C, H };
}

function isChromaticEnough(oklch, threshold = 0.02) {
  return oklch && oklch.C >= threshold;
}

function hueBin(H, binSize = 30) {
  return Math.floor(((H % 360) + 360) % 360 / binSize);
}

function distinctChromaticHueBins(elements, threshold = 0.02) {
  const bins = new Set();
  for (const el of elements || []) {
    const colors = [el?.style?.color, el?.style?.backgroundColor, el?.style?.borderColor];
    for (const raw of colors) {
      const ok = parseColor(raw);
      if (!ok) continue;
      if (!isChromaticEnough(ok, threshold)) continue;
      bins.add(hueBin(ok.H));
    }
  }
  return bins;
}

// ── Implemented validators ────────────────────────────────────────────────

function _validateSingleColor(input) {
  const elements = input?.dom?.elements || [];
  if (elements.length === 0) {
    return { passed: true, evidence: 'no elements in DOM snapshot' };
  }
  const bins = distinctChromaticHueBins(elements, 0.02);
  if (bins.size <= 1) {
    return {
      passed: true,
      evidence: `1 chromatic hue-bin found (binSize=30deg)`,
    };
  }
  return {
    passed: false,
    evidence: `${bins.size} distinct chromatic hue-bins found, expected ≤ 1`,
  };
}

function _validateMaxThreeColors(input) {
  const elements = input?.dom?.elements || [];
  const bins = distinctChromaticHueBins(elements, 0.02);
  if (bins.size <= 3) {
    return { passed: true, evidence: `${bins.size} chromatic hue-bins (≤ 3)` };
  }
  return {
    passed: false,
    evidence: `${bins.size} distinct chromatic hue-bins found, expected ≤ 3`,
  };
}

function _validateNoRectangles(input) {
  const elements = input?.dom?.elements || [];
  let violatorCount = 0;
  let firstViolator = null;
  for (const el of elements) {
    const bbox = el?.bbox;
    if (!bbox || bbox.width < 64 || bbox.height < 64) continue;
    const radius = parseFloat(el?.style?.borderRadius || '0');
    const clipPath = (el?.style?.clipPath || 'none').trim();
    const ratio = bbox.width / bbox.height;
    const ratioCloseToRect =
      Math.abs(ratio - 1) < 0.1 ||
      Math.abs(ratio - 16 / 9) < 0.1 ||
      Math.abs(ratio - 4 / 3) < 0.1 ||
      Math.abs(ratio - 3 / 2) < 0.1 ||
      Math.abs(ratio - 21 / 9) < 0.1;
    if (radius < 12 && (clipPath === 'none' || clipPath === '') && ratioCloseToRect) {
      violatorCount += 1;
      if (!firstViolator) {
        firstViolator = el.selector || '<unknown>';
      }
    }
  }
  if (violatorCount === 0) {
    return { passed: true, evidence: 'no rectangular elements with radius < 12px detected' };
  }
  return {
    passed: false,
    evidence: `${violatorCount} elements with border-radius < 12px AND rectangular aspect; first: ${firstViolator}`,
  };
}

function _validateMonospaceHeadlines(input) {
  const elements = input?.dom?.elements || [];
  const HEADING_TAGS = new Set(['h1', 'h2', 'h3']);
  // Known-monospace whitelist (from constraint doc).
  const MONO_FAMILIES = [
    'jetbrains mono', 'ibm plex mono', 'berkeley mono',
    'geist mono', 'iosevkaterm', 'iosevka',
    'sf mono', 'menlo', 'consolas', 'courier', 'monospace',
    'fira code', 'fira mono', 'cascadia code', 'cascadia mono',
    'source code pro', 'inconsolata', 'roboto mono',
  ];
  const violators = [];
  for (const el of elements) {
    const tag = (el?.tagName || '').toLowerCase();
    if (!HEADING_TAGS.has(tag)) continue;
    const family = (el?.style?.fontFamily || '').toLowerCase();
    if (family === '') continue;
    const primary = family.split(',')[0].trim().replace(/['"]/g, '');
    const isMono = MONO_FAMILIES.some(
      (m) => primary === m || primary.includes(m),
    );
    if (!isMono) {
      violators.push(`${tag}@${el.selector || '?'}: ${primary}`);
    }
  }
  if (violators.length === 0) {
    return { passed: true, evidence: 'all h1/h2/h3 use monospace family' };
  }
  return {
    passed: false,
    evidence: `${violators.length} non-monospace heading(s); first: ${violators[0]}`,
  };
}

function _validateAsymmetryOnly(input) {
  const dom = input?.dom;
  if (!dom?.viewport) {
    return { passed: true, evidence: 'no viewport info — skipped' };
  }
  const elements = dom.elements || [];
  // We treat top-level sections heuristically — the snapshot extractor
  // tags them with tagName = 'section' or via parentTag context. Here
  // we approximate by picking elements whose bbox.width is ≥ 50% of
  // viewport width AND tagName is one of {section, main, header, footer, article}.
  const SECTION_TAGS = new Set(['section', 'main', 'header', 'footer', 'article']);
  const sections = elements.filter((el) => {
    const tag = (el?.tagName || '').toLowerCase();
    if (!SECTION_TAGS.has(tag)) return false;
    if (!el.bbox) return false;
    return el.bbox.width >= 0.5 * dom.viewport.width;
  });
  if (sections.length === 0) {
    return { passed: true, evidence: 'no top-level sections found in snapshot' };
  }
  const vw = dom.viewport.width;
  const tolerance = 0.10 * vw;
  const centered = [];
  for (const sec of sections) {
    const cx = sec.bbox.x + sec.bbox.width / 2;
    if (Math.abs(cx - vw / 2) <= tolerance) {
      centered.push(sec.selector || '<section>');
    }
  }
  if (centered.length === 0) {
    return { passed: true, evidence: `${sections.length} sections, all off-center` };
  }
  return {
    passed: false,
    evidence: `${centered.length} section(s) centered within ±10% of viewport center; first: ${centered[0]}`,
  };
}

function _validateNoTransitions(input) {
  const elements = input?.dom?.elements || [];
  const violators = [];
  for (const el of elements) {
    const td = el?.style?.transitionDuration;
    const ad = el?.style?.animationDuration;
    const an = el?.style?.animationName;
    const tdMs = parseDurationMs(td);
    const adMs = parseDurationMs(ad);
    const hasAnim = an && an !== 'none' && an.trim() !== '';
    if (tdMs > 0 || (adMs > 0 && hasAnim)) {
      violators.push(el.selector || '<el>');
    }
  }
  if (violators.length === 0) {
    return { passed: true, evidence: 'no transition or animation detected' };
  }
  return {
    passed: false,
    evidence: `${violators.length} element(s) with motion; first: ${violators[0]}`,
  };
}

function parseDurationMs(s) {
  if (typeof s !== 'string' || s.trim() === '') return 0;
  const t = s.trim().toLowerCase();
  if (t === '0s' || t === '0ms' || t === 'none') return 0;
  const m = t.match(/([\d.]+)(ms|s)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return m[2] === 's' ? n * 1000 : n;
}

function _validateSingleTypeface(input) {
  const elements = input?.dom?.elements || [];
  const families = new Set();
  for (const el of elements) {
    if (!el?.text || el.text.trim() === '') continue;
    const ff = el?.style?.fontFamily;
    if (typeof ff !== 'string' || ff.trim() === '') continue;
    const primary = ff.split(',')[0].trim().toLowerCase().replace(/['"]/g, '');
    if (primary === '') continue;
    families.add(primary);
  }
  if (families.size <= 1) {
    return { passed: true, evidence: `${families.size} primary font-family` };
  }
  return {
    passed: false,
    evidence: `${families.size} distinct primary font-families: ${[...families].slice(0, 3).join(', ')}`,
  };
}

function _validateNoCenter(input) {
  const elements = input?.dom?.elements || [];
  const violators = [];
  for (const el of elements) {
    const text = el?.text;
    if (!text || text.trim() === '') continue;
    const ta = (el?.style?.textAlign || '').toLowerCase();
    if (ta === 'center') {
      violators.push(`${el.tagName || 'el'}@${el.selector || '?'}`);
    }
    const ml = (el?.style?.marginLeft || '').toLowerCase();
    const mr = (el?.style?.marginRight || '').toLowerCase();
    if (ml === 'auto' && mr === 'auto') {
      violators.push(`${el.tagName || 'el'}@${el.selector || '?'} (margin auto)`);
    }
  }
  if (violators.length === 0) {
    return { passed: true, evidence: 'no centered text or auto-margin elements' };
  }
  return {
    passed: false,
    evidence: `${violators.length} centered element(s); first: ${violators[0]}`,
  };
}

// ── Stub validators for the remaining 32 ──────────────────────────────────
//
// Sprint 21 v1 ships these as graceful no-ops — they always pass with a
// transparent `evidence` string so callers know the constraint was
// applied at the prompt level but not validated on output. v2 implements
// the full check.

function _stub(id) {
  return () => ({
    passed: true,
    evidence: `validator not implemented in v1 (${id})`,
  });
}

// ── Registry ──────────────────────────────────────────────────────────────

export const validators = {
  // form
  'no-rectangles': _validateNoRectangles,
  'single-shape': _stub('single-shape'),
  'fractured-edges': _stub('fractured-edges'),
  'viewport-bleeds': _stub('viewport-bleeds'),
  'text-as-shape': _stub('text-as-shape'),
  'negative-margin-mandatory': _stub('negative-margin-mandatory'),
  'clipping-overflow': _stub('clipping-overflow'),
  'organic-blob': _stub('organic-blob'),
  // color
  'single-color': _validateSingleColor,
  'monochrome-only': _stub('monochrome-only'),
  'no-gradients': _stub('no-gradients'),
  'max-3-colors': _validateMaxThreeColors,
  'complementary-only': _stub('complementary-only'),
  'cmyk-only': _stub('cmyk-only'),
  'risograph-bleed': _stub('risograph-bleed'),
  'signal-on-noise': _stub('signal-on-noise'),
  // typography
  'single-typeface': _validateSingleTypeface,
  'monospace-headlines': _validateMonospaceHeadlines,
  'all-italic': _stub('all-italic'),
  'vertical-only': _stub('vertical-only'),
  'broken-baselines': _stub('broken-baselines'),
  'huge-or-tiny': _stub('huge-or-tiny'),
  'display-as-sentence': _stub('display-as-sentence'),
  'caps-only': _stub('caps-only'),
  // layout
  'asymmetry-only': _validateAsymmetryOnly,
  'broken-grid': _stub('broken-grid'),
  'every-section-breaks-grid': _stub('every-section-breaks-grid'),
  'no-center': _validateNoCenter,
  'full-bleed-mandatory': _stub('full-bleed-mandatory'),
  'single-column-strict': _stub('single-column-strict'),
  'nested-extreme': _stub('nested-extreme'),
  'whitespace-explosion': _stub('whitespace-explosion'),
  // motion
  'no-transitions': _validateNoTransitions,
  'infinite-loop-mandatory': _stub('infinite-loop-mandatory'),
  'scroll-driven-only': _stub('scroll-driven-only'),
  'paused-by-default': _stub('paused-by-default'),
  'gesture-only': _stub('gesture-only'),
  'staggered-cascade': _stub('staggered-cascade'),
  'reverse-mount': _stub('reverse-mount'),
  'no-easing': _stub('no-easing'),
};

/**
 * Run a single validator by id. Unknown ids return a graceful pass.
 *
 * @param {string} id
 * @param {{ dom: object, css?: object }} input
 * @returns {{ passed: boolean, evidence: string }}
 */
export function validate(id, input) {
  const fn = validators[id];
  if (!fn) {
    return { passed: true, evidence: `unknown constraint id: ${id}` };
  }
  try {
    return fn(input);
  } catch (err) {
    return {
      passed: false,
      evidence: `validator threw: ${err && err.message ? err.message : String(err)}`,
    };
  }
}

/**
 * Run all provided validators against a single DOM/CSS snapshot.
 *
 * @param {Array<{id: string}>} constraints
 * @param {{ dom: object, css?: object }} input
 * @returns {Array<{ id: string, passed: boolean, evidence: string }>}
 */
export function validateAll(constraints, input) {
  const out = [];
  for (const c of constraints || []) {
    const id = typeof c === 'string' ? c : c?.id;
    if (!id) continue;
    const r = validate(id, input);
    out.push({ id, ...r });
  }
  return out;
}
