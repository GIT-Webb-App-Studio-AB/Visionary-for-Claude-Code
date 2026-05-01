// MCP tool: visionary.slop_gate
//
// Deterministic slop-detection over HTML/JSX/CSS source. Wraps the repo's
// shouldReject() decision logic from hooks/scripts/lib/slop-gate.mjs and
// inlines the same pattern detector that capture-and-critique.mjs uses
// (kept verbatim so MCP behaviour matches the in-plugin hook).
//
// The detector is a standalone function here because the canonical detector
// in capture-and-critique.mjs is inlined into a 600-line hook script — not
// practical to import. The pattern catalogue is identical; we update both
// when the catalogue changes.

import { shouldReject } from '../../../../hooks/scripts/lib/slop-gate.mjs';

// ── Pattern detector — mirrored from capture-and-critique.mjs ──────────────
// Returns string[] of flagged pattern names (one entry per hit). The host
// usually passes raw source; if they have already-detected flags they can
// pass `pre_detected_flags` and skip the detector entirely.
function detectSlopFlags(source, { hasKit = false } = {}) {
  const flags = [];
  if (typeof source !== 'string' || source.length === 0) return flags;

  const clean = source;
  const push = (flag, cond) => { if (cond) flags.push(flag); };

  push('Purple/violet gradient background detected',
    /\b(from|via|to)-(purple|violet)-\d{2,3}\b/.test(clean));
  push('Cyan-on-dark color scheme detected',
    /\btext-cyan-\d{2,3}\b|#06B6D4\b/i.test(clean));
  push('Left-border accent card pattern detected',
    /\bborder-l-4\b|border-left:\s*4px\s+solid/.test(clean));
  push('Dark background with colored glow shadow detected',
    /\bbg-(gray|zinc|slate)-900\b[\s\S]{0,120}\bshadow-[a-z0-9]+/.test(clean));
  push('Gradient text on heading or metric detected',
    /\bbg-clip-text\b[\s\S]{0,200}\btext-transparent\b[\s\S]{0,200}\bbg-gradient/.test(clean) ||
    /\btext-transparent\b[\s\S]{0,200}\bbg-gradient/.test(clean));

  const hasLargeText = /\btext-(4xl|5xl|6xl)\b/.test(clean);
  const hasSmallText = /\btext-(sm|xs)\b/.test(clean);
  const hasGradient = /\bbg-gradient-/.test(clean);
  push('Hero Metric Layout detected (large number + small label + gradient)',
    hasLargeText && hasSmallText && hasGradient);

  const cardMatches = clean.match(/className="[^"]*\bcard\b/g) || [];
  push('Repeated 3-across card grid detected', cardMatches.length >= 3);

  const hasInter = /font-family:\s*["']?Inter\b|fontFamily:\s*["']?Inter\b|--font-[a-z-]*:\s*["']?Inter\b/i.test(clean);
  const hasSecondary = /\b(Bricolage|Instrument|Plus Jakarta|DM Sans|Geist|Grotesk|Vela|Gentium|Cabinet)/i.test(clean);
  push('Inter as sole typeface detected', hasInter && !hasSecondary);

  push('Generic system/web font as sole typeface detected',
    /font-family:\s*["']?(Roboto|Arial|Open Sans)\b/i.test(clean) && !hasSecondary);

  push('Default Tailwind blue #3B82F6 as primary color detected',
    /\bbg-blue-500\b|#3B82F6\b/i.test(clean));
  push('Default Tailwind purple #6366F1 as primary color detected',
    /\bbg-indigo-500\b|#6366F1\b/i.test(clean));
  push('Default Tailwind green #10B981 as accent detected',
    /\btext-emerald-500\b|#10B981\b/i.test(clean));

  const radiusCount = (clean.match(/\brounded-(lg|md|xl)\b/g) || []).length;
  const classNameCount = (clean.match(/\bclassName=/g) || []).length || 1;
  push('Uniform border-radius on all elements detected', radiusCount >= classNameCount);

  const shadowMdCount = (clean.match(/\bshadow-md\b/g) || []).length;
  push('shadow-md applied uniformly to multiple cards detected', shadowMdCount >= 3);

  push('Centered hero with gradient backdrop and floating cards detected',
    /\btext-center\b/.test(clean) && /\bbg-gradient-/.test(clean) && /\babsolute\b/.test(clean));

  push('Three-column icon+heading+paragraph feature section detected',
    /<[A-Z][A-Za-z]*Icon\b|<Icon\b/.test(clean) && /<h3\b/.test(clean) &&
    /\bgrid-cols-3\b|grid-cols-\[repeat\(3/.test(clean));

  push('Poppins + blue gradient combination detected',
    /\bPoppins\b/.test(clean) && /\b(from-blue|bg-blue)-\d{2,3}\b/.test(clean));

  push('White card on light gray background (low contrast) detected',
    /\bbg-white\b/.test(clean) && /\bbg-(gray-50|gray-100|slate-50)\b/.test(clean));

  const symPad = (clean.match(/\bp-(4|6|8)\b/g) || []).length;
  const axisPad = (clean.match(/\b(px|py)-\d/g) || []).length;
  push('Symmetric padding everywhere (no horizontal/vertical rhythm) detected',
    symPad >= 3 && axisPad === 0);

  if (hasKit) {
    const placeholderRe = /\b(Jane Doe|John Doe|John Smith|Jane Smith|Acme\s+(Inc|Corp|LLC|Co)|Lorem ipsum)\b/i;
    push('Placeholder name detected in source despite visionary-kit.json present',
      placeholderRe.test(clean));
    const placeholderEmailRe = /\b[\w.-]+@(example\.com|test\.com|acme\.com)\b/i;
    push('Placeholder email domain detected in source despite visionary-kit.json present',
      placeholderEmailRe.test(clean));
  }

  return flags;
}

export const tool = {
  name: 'visionary.slop_gate',
  description:
    'Detect slop patterns in HTML/JSX/CSS source. Returns rejected=true when blocking_patterns count >= threshold (default 2). Whitelist per-style is supported via style_whitelist. The blocking_patterns list is the actionable output — feed each into a regen prompt as an "avoid" directive.',
  inputSchema: {
    type: 'object',
    required: ['source'],
    properties: {
      source: {
        type: 'string',
        description: 'Raw HTML, JSX, or CSS source to scan for slop patterns.',
      },
      threshold: {
        type: 'integer',
        default: 2,
        description: 'Reject threshold. >= this many blocking patterns triggers rejected=true.',
      },
      style_whitelist: {
        type: 'array',
        items: { type: 'string' },
        description: 'Pattern substrings the active style permits (case-insensitive). E.g. a brutalist style allowing default Tailwind blue ironically.',
      },
      has_content_kit: {
        type: 'boolean',
        default: false,
        description: 'Set true when visionary-kit.json is present — enables placeholder-name detection.',
      },
      pre_detected_flags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional. If provided, skip the detector and gate against these flags directly.',
      },
    },
  },
  async handler(args) {
    const source = typeof args.source === 'string' ? args.source : '';
    const threshold = Number.isInteger(args.threshold) ? args.threshold : 2;
    const styleWhitelist = Array.isArray(args.style_whitelist) ? args.style_whitelist : [];
    const hasKit = args.has_content_kit === true;

    const flags = Array.isArray(args.pre_detected_flags) && args.pre_detected_flags.length
      ? args.pre_detected_flags.filter((f) => typeof f === 'string')
      : detectSlopFlags(source, { hasKit });

    const decision = shouldReject({ slopFlags: flags, styleWhitelist, threshold });

    const result = {
      rejected: decision.rejected,
      blocking_patterns: decision.blocking_patterns,
      whitelisted_patterns: decision.whitelisted_patterns,
      blocking_count: decision.blocking_count,
      whitelisted_count: decision.whitelisted_count,
      threshold: decision.threshold_used,
      reason: decision.reason,
      detected_total: flags.length,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  },
};
