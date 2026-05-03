// hooks/scripts/lib/structural-checks/types.mjs
//
// Shared shapes used across all structural checks. Pure JSDoc — no runtime
// types, no external deps. Each check module exports a `check(domSnapshot,
// viewport)` function that returns Array<CheckHit>.

/**
 * @typedef {Object} BBox
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} ElementSnapshot
 * @property {string} selector
 * @property {string} tagName
 * @property {BBox}   bbox
 * @property {string|null} text
 * @property {string|null} parentTag
 * @property {Object} style
 * @property {string|null} listStyleType
 * @property {number|null} childCount
 * @property {number|null} anchorDescendantCount
 * @property {string|null} display
 * @property {string|null} gridTemplateColumns
 */

/**
 * @typedef {Object} DomSnapshot
 * @property {ElementSnapshot[]} elements
 */

/**
 * @typedef {Object} Viewport
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} CheckHit
 * @property {string} check_id
 * @property {string} selector
 * @property {*}      observed
 * @property {string} message
 */

/**
 * Helper: is the element visible (non-trivial bbox)?
 * @param {ElementSnapshot} el
 * @returns {boolean}
 */
export function isVisible(el) {
  return !!(el && el.bbox && el.bbox.width > 0 && el.bbox.height > 0);
}

/**
 * Helper: parse a `grid-template-columns` value into a column count.
 * Handles `none`, `1fr`, `repeat(N, 1fr)`, `1fr 2fr 1fr`, etc.
 * @param {string|null|undefined} value
 * @returns {number}
 */
export function countGridColumns(value) {
  if (typeof value !== 'string' || value.trim() === '' || value === 'none') return 1;
  const repeat = value.match(/repeat\(\s*(\d+)\s*,/);
  if (repeat) return Math.max(1, parseInt(repeat[1], 10));
  const stripped = value.replace(/\[[^\]]*\]/g, ' ');
  const tokens = stripped.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, tokens.length);
}

/**
 * Helper: normalise heading text for duplicate detection.
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function normaliseHeadingText(text) {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[\p{P}\p{S}]+/gu, '');
}
