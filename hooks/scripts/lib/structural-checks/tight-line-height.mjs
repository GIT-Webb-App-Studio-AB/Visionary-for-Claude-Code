// hooks/scripts/lib/structural-checks/tight-line-height.mjs
//
// Detects display-size headings (font-size > 64px) with line-height ratio
// below 0.9. At those sizes, sub-1.0 line-height is the dominant cause of
// baseline-collision bugs we keep seeing: a wrapping H1 stacks its second
// line so close that ascenders/descenders overlap, or the heading's
// natural descender clips into a horizontal divider directly below.
//
// History: three prior textual fixes in the skill markdown failed to stick
// because they relied on the model checking its own output. This module is
// the deterministic backstop — the structural gate runs it on the DOM
// snapshot before the critic loop sees the screenshot, so the bug can't
// reach a final render.
//
// Threshold rationale (font-size > 64px, ratio < 0.9):
//   - 64px is the floor for "display" treatment across major design systems
//     (Material 3 display-medium = 45px, Tailwind text-6xl = 60px, IBM
//     Carbon expressive-04 ≈ 54px). 64px sits a step above and reliably
//     filters body/UI copy.
//   - Below ratio 0.9 the ascender on line N+1 starts overlapping the
//     descender on line N for most display fonts (cap-height ≈ 70-75% of
//     em-square, ascender ≈ 80-85%). 0.9 is conservative — typical safe
//     display line-height is 1.0-1.1.
//   - Stylistic overrides (Swiss-punk poster, brutalist editorial) can
//     opt out via the active style's frontmatter
//     `allows_structural.hard_fail_skips: ['tight-line-height']`.
//
// Data source: the capture-and-critique DOM snapshot already extracts
// `style.fontSize` and `style.lineHeight` from `getComputedStyle`, so this
// check needs no new instrumentation. Both arrive as px strings ("96px",
// "100px") except when line-height is unset, in which case it's "normal"
// (browser default ≈ 1.2 — safe, skip).

export const ID = 'tight-line-height';

const MIN_FONT_SIZE_PX = 64;
const MIN_RATIO = 0.9;

// Slack on the ratio check absorbs sub-pixel rounding from getComputedStyle —
// 0.899 px-ratios that round to 0.9 when displayed shouldn't fire.
const RATIO_EPSILON = 0.005;

function parsePx(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^([\d.]+)px$/);
  if (!match) return null;
  const n = parseFloat(match[1]);
  return Number.isFinite(n) ? n : null;
}

// Resolve `line-height` to a px value given the element's font-size. Returns
// null for `normal` (browser default — never a bug) and for malformed input.
function resolveLineHeightPx(lineHeight, fontSizePx) {
  if (typeof lineHeight !== 'string') return null;
  const trimmed = lineHeight.trim();
  if (trimmed === '' || trimmed === 'normal') return null;

  // Px form ("160px"). getComputedStyle returns this almost always.
  const px = parsePx(trimmed);
  if (px !== null) return px;

  // Unitless numeric ("0.8") — resolves against the element's font-size.
  // getComputedStyle normally converts these to px, but defend against
  // alternative snapshot sources.
  if (/^[\d.]+$/.test(trimmed)) {
    const ratio = parseFloat(trimmed);
    if (Number.isFinite(ratio)) return ratio * fontSizePx;
  }

  return null;
}

export function check(domSnapshot) {
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];

  const hits = [];
  for (const el of domSnapshot.elements) {
    if (!el || !el.style) continue;
    // Empty-text elements are not typography defects regardless of their
    // declared font-size — a 240px <hr> with no text content is irrelevant
    // to baseline collision.
    if (typeof el.text !== 'string' || el.text.trim().length === 0) continue;

    const fontSizePx = parsePx(el.style.fontSize);
    if (fontSizePx === null || fontSizePx <= MIN_FONT_SIZE_PX) continue;

    const lineHeightPx = resolveLineHeightPx(el.style.lineHeight, fontSizePx);
    if (lineHeightPx === null) continue;

    const ratio = lineHeightPx / fontSizePx;
    if (!Number.isFinite(ratio)) continue;
    if (ratio >= MIN_RATIO - RATIO_EPSILON) continue;

    hits.push({
      check_id: ID,
      selector: el.selector,
      observed: {
        font_size_px: Math.round(fontSizePx),
        line_height_px: Math.round(lineHeightPx),
        ratio: Number(ratio.toFixed(2)),
        threshold: MIN_RATIO,
        tag: el.tagName,
      },
      message: `Display <${el.tagName}> font-size:${Math.round(fontSizePx)}px with line-height:${Math.round(lineHeightPx)}px (ratio ${ratio.toFixed(2)}) — ascenders/descenders collide between lines and the next line's caps clip into the line above or into adjacent dividers. Raise line-height to ≥ ${MIN_RATIO} of font-size (e.g. line-height:${Math.round(fontSizePx * MIN_RATIO)}px) for headings >${MIN_FONT_SIZE_PX}px. If the cramped leading is a deliberate stylistic choice, whitelist this check_id in the style's frontmatter \`allows_structural.hard_fail_skips\`.`,
    });
  }
  return hits;
}
