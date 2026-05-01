// MCP tool: visionary.validate_evidence
//
// Validate that every top_3_fixes entry in a critique-output has well-formed
// evidence. Returns invalid entries plus a summary so the host can decide
// whether to retry with an alternate model (Sprint 3 retry guard).
//
// "Well-formed" here means structurally valid: an evidence object with
// type ∈ {axe, selector, metric, coord} and a non-empty value of the right
// shape. We do NOT execute selectors against a DOM here — that requires a
// browser and is the host's responsibility (Playwright MCP). The repo's
// validate-evidence library exposes the post-DOM-check validators; this
// tool exposes the structural-check side and re-uses shouldRetryCritic for
// retry decisioning when the host has run DOM checks and supplies results.

import {
  applyValidation,
  shouldRetryCritic,
  formatInvalidWarning,
} from '../../../../hooks/scripts/lib/validate-evidence.mjs';

const VALID_EVIDENCE_TYPES = new Set(['axe', 'selector', 'metric', 'coord']);

// Structural validator — no DOM access required.
// Each fix in critique.top_3_fixes must:
//   - exist as an object
//   - have evidence.type in VALID_EVIDENCE_TYPES
//   - have a non-empty evidence.value of the correct shape
//     - axe:      string (rule id, e.g. "color-contrast")
//     - selector: string (CSS selector — structural check only; DOM-match is host's job)
//     - metric:   string (key=value or similar canonical form)
//     - coord:    string OR { x: number, y: number }
function validateStructural(critique) {
  const issues = [];
  if (!critique || typeof critique !== 'object') {
    return { invalid: [], reason: 'critique is not an object' };
  }
  const fixes = Array.isArray(critique.top_3_fixes) ? critique.top_3_fixes : [];
  fixes.forEach((fix, i) => {
    if (!fix || typeof fix !== 'object') {
      issues.push({ fixIndex: i, reason: 'fix is not an object' });
      return;
    }
    const ev = fix.evidence;
    if (!ev || typeof ev !== 'object') {
      issues.push({ fixIndex: i, reason: 'evidence missing or not an object' });
      return;
    }
    if (!VALID_EVIDENCE_TYPES.has(ev.type)) {
      issues.push({
        fixIndex: i,
        reason: `evidence.type must be one of ${[...VALID_EVIDENCE_TYPES].join(', ')}`,
        actual_type: ev.type,
      });
      return;
    }
    if (ev.type === 'coord') {
      const okStr = typeof ev.value === 'string' && ev.value.trim() !== '';
      const okObj = ev.value && typeof ev.value === 'object'
        && Number.isFinite(ev.value.x) && Number.isFinite(ev.value.y);
      if (!okStr && !okObj) {
        issues.push({ fixIndex: i, reason: 'coord evidence requires string or {x,y}' });
      }
      return;
    }
    if (typeof ev.value !== 'string' || ev.value.trim() === '') {
      issues.push({ fixIndex: i, reason: `${ev.type} evidence.value must be a non-empty string` });
    }
  });
  return { invalid: issues, fix_count: fixes.length };
}

export const tool = {
  name: 'visionary.validate_evidence',
  description:
    'Validate that every top_3_fixes entry in a critique-output has well-formed evidence (axe rule id, CSS selector, metric key, or coordinate). Performs structural validation only (no DOM execution — selectors are checked for shape, not for DOM matches). Optionally accepts pre-computed dom_match_results from the host (e.g. from Playwright MCP) to apply DOM-match validation and the >= 2 invalid-evidence retry guard.',
  inputSchema: {
    type: 'object',
    required: ['critique'],
    properties: {
      critique: {
        type: 'object',
        description: 'Critique output object (must include top_3_fixes[]).',
      },
      dom_match_results: {
        type: 'array',
        description: 'Optional. Array of { fixIndex, matched } from host-side DOM checks. When provided, the response includes summary.invalid_count and a retry decision.',
        items: {
          type: 'object',
          properties: {
            fixIndex: { type: 'integer' },
            matched: { type: 'boolean' },
          },
          required: ['fixIndex', 'matched'],
        },
      },
    },
  },
  async handler(args) {
    const critique = args.critique;
    const structural = validateStructural(critique);

    const out = {
      structural_invalid: structural.invalid,
      structural_invalid_count: structural.invalid.length,
      fix_count: structural.fix_count ?? 0,
    };

    if (Array.isArray(args.dom_match_results)) {
      const { critique: stamped, summary } = applyValidation(critique, args.dom_match_results);
      const retry = shouldRetryCritic(summary);
      out.dom_summary = summary;
      out.retry = retry;
      out.invalid_warning = formatInvalidWarning(summary);
      out.critique_with_flags = stamped;
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
    };
  },
};
