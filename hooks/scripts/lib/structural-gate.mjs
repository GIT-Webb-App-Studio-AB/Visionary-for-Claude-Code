// hooks/scripts/lib/structural-gate.mjs
//
// Structural-integrity gate. Runs after Playwright capture, before LLM-critic.
// Hard-fails (auto-regen) on six binary structural defects; warns on gradient
// signals. See docs/superpowers/specs/2026-05-03-structural-integrity-gate-design.md.
//
// Dispatcher implementation lands in Task 13 — this file is currently a stub
// that locks the public interface so per-check modules and the integration in
// capture-and-critique.mjs can be developed against it in parallel.

export const HARD_FAIL_CHECKS = Object.freeze([
  'duplicate-heading',
  'exposed-nav-bullets',
  'off-viewport-right',
  'footer-grid-collapse',
  'empty-section',
  'heading-hierarchy-skip',
]);

export const WARNING_CHECKS = Object.freeze([
  'mystery-text-node',
  // 'image-brand-mismatch' reserved as follow-up sprint
]);

/**
 * @typedef {Object} EvaluateOptions
 * @property {{ hard_fail_skips: Set<string>, warning_skips: Set<string> }} [styleWhitelist]
 * @property {string|null} [styleId]
 */

/**
 * @typedef {Object} EvaluateResult
 * @property {Array<{check_id:string,selector:string,observed:*,message:string}>} hard_fails
 * @property {Array<{check_id:string,selector:string,observed:*,message:string}>} warnings
 * @property {Array<{check_id:string,reason:'whitelisted'|'insufficient-data'}>} skipped
 */

/**
 * Public entrypoint. Implementation lands in Task 13.
 * @param {{elements: Array}} domSnapshot
 * @param {{width:number,height:number}} viewport
 * @param {EvaluateOptions} [opts]
 * @returns {EvaluateResult}
 */
export function evaluate(domSnapshot, viewport, opts = {}) {
  void domSnapshot; void viewport; void opts;
  throw new Error('structural-gate.evaluate not yet implemented (Task 13)');
}

/**
 * Build the regen-directive context block for a hard-fail rejection.
 * Implementation lands in Task 13 alongside dispatcher.
 * @param {Array} hardFails
 * @returns {string}
 */
export function buildStructuralDirectiveBlock(hardFails) {
  void hardFails;
  throw new Error('buildStructuralDirectiveBlock not yet implemented (Task 13)');
}

/**
 * Build the warnings block injected into critic context.
 * Implementation lands in Task 13.
 * @param {Array} warnings
 * @returns {string}
 */
export function buildStructuralWarningsBlock(warnings) {
  void warnings;
  throw new Error('buildStructuralWarningsBlock not yet implemented (Task 13)');
}

// ── Trace event shapes (emitted by capture-and-critique integration) ────────
//
// The gate module itself does NOT call trace.sync — emission happens in
// the hook so it can include the hook-level cwd/generationId/round.
//
// @typedef {Object} StructuralBlockedEvent
// @property {string[]} blocking_checks
// @property {number}   blocking_count
// @property {number}   skipped_count
// @property {string|null} style_id
//
// @typedef {Object} StructuralWarningEvent
// @property {string[]} warning_checks
// @property {number}   warning_count
// @property {string|null} style_id
//
// @typedef {Object} StructuralWhitelistedEvent
// @property {string[]} whitelisted_checks
// @property {number}   whitelisted_count
// @property {string|null} style_id
// @property {string|null} reason
