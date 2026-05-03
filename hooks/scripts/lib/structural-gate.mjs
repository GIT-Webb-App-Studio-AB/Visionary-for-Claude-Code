// hooks/scripts/lib/structural-gate.mjs
//
// Structural-integrity gate. Runs after Playwright capture, before LLM-critic.
// Spec: docs/superpowers/specs/2026-05-03-structural-integrity-gate-design.md.

import * as duplicateHeading      from './structural-checks/duplicate-heading.mjs';
import * as exposedNavBullets     from './structural-checks/exposed-nav-bullets.mjs';
import * as offViewportRight      from './structural-checks/off-viewport-right.mjs';
import * as footerGridCollapse    from './structural-checks/footer-grid-collapse.mjs';
import * as emptySection          from './structural-checks/empty-section.mjs';
import * as headingHierarchySkip  from './structural-checks/heading-hierarchy-skip.mjs';
import * as mysteryTextNode       from './structural-checks/mystery-text-node.mjs';

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
]);

const HARD_MODULES = [
  duplicateHeading, exposedNavBullets, offViewportRight,
  footerGridCollapse, emptySection, headingHierarchySkip,
];
const WARNING_MODULES = [mysteryTextNode];
const HARD_SET = new Set(HARD_FAIL_CHECKS);
const WARN_SET = new Set(WARNING_CHECKS);

const EMPTY_WHITELIST = {
  hard_fail_skips: new Set(),
  warning_skips: new Set(),
};

function runChecks(modules, allowedIds, skipSet, domSnapshot, viewport) {
  const hits = [];
  const skipped = [];
  for (const mod of modules) {
    if (!mod || typeof mod.check !== 'function' || typeof mod.ID !== 'string') continue;
    if (!allowedIds.has(mod.ID)) continue;
    if (skipSet && skipSet.has(mod.ID)) {
      skipped.push({ check_id: mod.ID, reason: 'whitelisted' });
      continue;
    }
    let result;
    try { result = mod.check(domSnapshot, viewport); }
    catch {
      skipped.push({ check_id: mod.ID, reason: 'insufficient-data' });
      continue;
    }
    if (!Array.isArray(result)) continue;
    for (const h of result) hits.push(h);
  }
  return { hits, skipped };
}

export function evaluate(domSnapshot, viewport, opts = {}) {
  const wl = opts.styleWhitelist || EMPTY_WHITELIST;
  const hard = runChecks(HARD_MODULES, HARD_SET, wl.hard_fail_skips, domSnapshot, viewport);
  const warn = runChecks(WARNING_MODULES, WARN_SET, wl.warning_skips, domSnapshot, viewport);
  return {
    hard_fails: hard.hits,
    warnings: warn.hits,
    skipped: [...hard.skipped, ...warn.skipped],
  };
}

export function buildStructuralDirectiveBlock(hardFails) {
  if (!Array.isArray(hardFails) || hardFails.length === 0) return '';
  const lines = [
    'STRUCTURAL DEFECTS BLOCKING REGEN — REWRITE TO ELIMINATE ALL OF THE FOLLOWING:',
    '',
  ];
  for (const h of hardFails) {
    lines.push(`• [${h.check_id}] ${h.message}`);
    lines.push(`  selector: ${h.selector}`);
    lines.push(`  observed: ${JSON.stringify(h.observed)}`);
    lines.push('');
  }
  lines.push('Do not regenerate a near-duplicate with cosmetic tweaks — these are mechanical defects, not stylistic preferences.');
  return lines.join('\n');
}

export function buildStructuralWarningsBlock(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) return '';
  const lines = [
    'STRUCTURAL_WARNINGS (non-blocking — consider for top_3_fixes):',
    '',
  ];
  for (const w of warnings) {
    lines.push(`• [${w.check_id}] ${w.message} (${w.selector})`);
  }
  return lines.join('\n');
}

// ── Trace event shapes (documented in Task 12) ─────────────────────────────
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
