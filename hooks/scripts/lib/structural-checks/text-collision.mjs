// hooks/scripts/lib/structural-checks/text-collision.mjs
//
// v1.5.4 — Detects two text-bearing elements whose bounding boxes overlap
// significantly without one containing the other. Catches both "text in front
// of text" (sticky/fixed bars sliding over copy, dropdowns leaking into the
// page) and "text behind text" (z-index regressions where labels disappear
// under hero overlays) — flat DOM treats both identically as overlapping
// AABBs.
//
// Why bbox-AABB and not stacking-order analysis: the W3C low-vision WCAG
// 2.4.11 ("Focus Not Obscured") working group concluded that exact paint
// order requires a custom browser API that doesn't exist yet. Pragmatic
// industry approach is AABB overlap on the rendered DOM, with sibling/
// nesting filters to suppress legitimate stacking. We follow that pattern.
//
// False-positive mitigation:
//   1. Nesting-AND-rule — skip a pair only when BOTH signals point at
//      legitimate parent-child nesting:
//        a) one element's text starts or ends with the other's (the
//           recursive-textContent fingerprint), AND
//        b) one element's bbox geometrically contains the other's.
//      Either signal alone is too lossy:
//        - Text-only would suppress unrelated siblings sharing common
//          prefixes (e.g. `<h3>Summary</h3>` next to a colliding sibling
//          `<p>Summary of the report</p>`).
//        - Containment-only would suppress the very bugs we want to find
//          (sticky header fully covering a paragraph below).
//      Requiring both signals is conservative without being lossy: a
//      genuine parent-child pair always exhibits both, while either
//      bug-class pattern violates at least one.
//   2. Role/tag skip — overlay-purpose tags (dialog, menu, [role=tooltip])
//      are designed to stack. Skip.
//   3. Tiny-element skip — bbox under MIN_AREA is decorative (icon, dot).
//   4. Same-selector skip — defends against duplicated entries.
//
// Threshold: an overlap is flagged when the intersection area exceeds
// COLLISION_RATIO of the smaller element's area. 0.30 is conservative —
// 30 % of the smaller box must be obstructed before we cry foul.

import { isVisible } from './types.mjs';

export const ID = 'text-collision';

// Tunables. Lower COLLISION_RATIO → more sensitive. MIN_AREA filters out
// decorative dots. MAX_PAIRS bounds the O(N²) loop on huge DOMs.
//
// COLLISION_RATIO=0.30 chosen empirically against Lighthouse's 0.25 tap-
// targets ratio (industry consensus). Slightly stricter to compensate for
// the lack of paint-order resolution — we want fewer false positives at
// the cost of missing borderline 25-30% overlaps. Will calibrate against
// real telemetry; tracked for v1.5.5 follow-up.
const COLLISION_RATIO = 0.30;
const MIN_AREA        = 16 * 10;   // 160 px² — below this, ignore.
const MIN_TEXT_LEN    = 2;
// 200_000 ≈ 632 candidates worst-case. The DOM extractor caps at 400
// elements; after MIN_AREA + MIN_TEXT_LEN + isVisible filtering, the
// candidate pool is typically <200, well under the cap. Set high enough
// that we never silently truncate in practice.
const MAX_PAIRS       = 200_000;

// Tags that are explicitly meant to overlay other content. We skip ANY pair
// where either element (or either's parent tag) is one of these.
const OVERLAY_TAGS = new Set([
  'dialog', 'menu', 'menuitem',
]);

// Selector substrings that strongly suggest an intentional overlay layer.
// Conservative list — false positives on these break a real bug check, so
// only add patterns we're confident about.
const OVERLAY_SELECTOR_HINTS = [
  '[role="dialog"]',
  '[role="tooltip"]',
  '[role="menu"]',
  '[aria-modal',
  '[data-portal',
  '[data-tooltip',
];

function rectArea(b) {
  return Math.max(0, b.width) * Math.max(0, b.height);
}

function rectIntersection(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

// True if `outer` strictly encloses `inner` (with 1px slack to absorb
// sub-pixel rounding). Note: identical bboxes mutually contain each
// other under this definition — that's intended; the nesting-AND rule
// in the main loop pairs this with text-prefix to avoid false positives.
function fullyContains(outer, inner) {
  const slack = 1;
  return (
    inner.x >= outer.x - slack &&
    inner.y >= outer.y - slack &&
    inner.x + inner.width  <= outer.x + outer.width  + slack &&
    inner.y + inner.height <= outer.y + outer.height + slack
  );
}

function looksLikeOverlay(el) {
  if (!el) return false;
  // Defensive lowercase: the snapshot extractor uses lowercase tagNames
  // today but real Playwright DOM returns uppercase. Belt-and-braces.
  const tag = (el.tagName || '').toLowerCase();
  const parentTag = (el.parentTag || '').toLowerCase();
  if (OVERLAY_TAGS.has(tag)) return true;
  if (OVERLAY_TAGS.has(parentTag)) return true;
  const sel = el.selector || '';
  for (const hint of OVERLAY_SELECTOR_HINTS) {
    if (sel.includes(hint)) return true;
  }
  return false;
}

// Module-scope to avoid re-allocating the closure inside the O(N²) loop.
function normaliseText(s) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Returns true when the longer text starts or ends with the shorter — the
// signature of recursive `textContent` between a DOM ancestor and one of
// its leaf descendants. Restricted to startsWith/endsWith (NOT
// `includes`) because a mid-string match is too broad: a sibling
// `<p>Summary of the report</p>` would be muted by an unrelated
// `<h3>Summary</h3>` somewhere on the page. Per code review v1.5.4.
//
// Equal text does NOT count as nested — two distinct buttons both
// labelled "Sign up" that geometrically collide is a real bug we want
// to flag, not a parent-child pair.
function textsAreNested(textA, textB) {
  const a = normaliseText(textA);
  const b = normaliseText(textB);
  if (a === b) return false;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  return longer.startsWith(shorter) || longer.endsWith(shorter);
}

export function check(domSnapshot) {
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];

  // First pass: collect candidate text elements. We index a smaller pool
  // before doing the O(N²) sweep so the worst case stays bounded even on
  // a 400-element snapshot.
  const candidates = [];
  for (const el of domSnapshot.elements) {
    if (!isVisible(el)) continue;
    if (typeof el.text !== 'string') continue;
    const t = el.text.trim();
    if (t.length < MIN_TEXT_LEN) continue;
    if (rectArea(el.bbox) < MIN_AREA) continue;
    if (looksLikeOverlay(el)) continue;
    candidates.push({ el, area: rectArea(el.bbox), text: t });
  }

  const hits = [];
  const reported = new Set();
  let pairs = 0;

  for (let i = 0; i < candidates.length; i++) {
    const A = candidates[i];
    for (let j = i + 1; j < candidates.length; j++) {
      if (++pairs > MAX_PAIRS) {
        // Diagnostic: signal truncation to stderr (hooks output flows to
        // Claude Code's hook log). Better than silent partial result —
        // the caller can inspect the log to know coverage was limited.
        try {
          process.stderr.write(
            `[text-collision] truncated at ${MAX_PAIRS} pairs (candidates=${candidates.length}); some overlaps may be missed\n`,
          );
        } catch { /* hooks-spec environments may not expose stderr — best effort */ }
        return hits;
      }
      const B = candidates[j];
      if (A.el.selector === B.el.selector) continue;

      const inter = rectIntersection(A.el.bbox, B.el.bbox);
      if (inter <= 0) continue;

      // Nesting-AND rule (see header). Skip only when BOTH text and
      // geometry agree the pair is parent-child. Either signal alone
      // is too lossy.
      const textNested = textsAreNested(A.text, B.text);
      const geomNested = fullyContains(A.el.bbox, B.el.bbox) ||
                         fullyContains(B.el.bbox, A.el.bbox);
      if (textNested && geomNested) continue;

      // Real partial overlap. Compare against the SMALLER element so that
      // a tiny chip overlapping 80 % of itself with a big block fires even
      // when the block barely notices.
      const smallerArea = Math.min(A.area, B.area);
      // Defensive — MIN_AREA + isVisible should prevent zero, but make
      // the invariant local rather than distributed across guards.
      if (smallerArea <= 0) continue;
      const ratio = inter / smallerArea;
      if (!Number.isFinite(ratio) || ratio < COLLISION_RATIO) continue;

      // Stable pair key (selectors are not ordered) so we don't double-emit
      // when the snapshot includes the same element twice with different
      // synthesised classnames.
      const pairKey = [A.el.selector, B.el.selector].sort().join(' ⇄ ');
      if (reported.has(pairKey)) continue;
      reported.add(pairKey);

      hits.push({
        check_id: ID,
        selector: A.el.selector,
        observed: {
          colliding_with: B.el.selector,
          overlap_ratio: Number(ratio.toFixed(2)),
          overlap_px: Math.round(inter),
          a_text: A.text.slice(0, 60),
          b_text: B.text.slice(0, 60),
          a_bbox: A.el.bbox,
          b_bbox: B.el.bbox,
        },
        message: `Text "${A.text.slice(0, 40)}" overlaps "${B.text.slice(0, 40)}" by ${Math.round(ratio * 100)}% — broken layout (z-stack collision or negative margin)`,
      });
    }
  }

  return hits;
}
