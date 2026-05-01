// Token-value extractor — Sprint 14.
// Scans a JSX/CSS/Vue/Svelte/HTML file for hard-coded values that *should*
// come from a locked DTCG token. Returns a list of { kind, value, line, snippet }.

const COLOR_HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const COLOR_RGB_RE = /\brgba?\(\s*[\d.,\s]+\)/g;
const COLOR_OKLCH_RE = /\boklch\(\s*[\d.%,\s/]+\)/g;
const COLOR_HSL_RE = /\bhsla?\(\s*[\d.%,\s]+\)/g;
const TAILWIND_COLOR_RE = /\b(?:bg|text|border|fill|stroke|ring|from|to|via|outline|placeholder|caret|accent|decoration)-(?:[a-z]+-)?(?:[a-z]+-)?[1-9]\d{2}\b/g;
const SPACING_PX_RE = /\b\d{1,4}px\b/g;
const SPACING_REM_RE = /\b\d+(?:\.\d+)?rem\b/g;
const DURATION_MS_RE = /\b\d{2,5}ms\b/g;
const DURATION_S_RE = /\b\d+(?:\.\d+)?s\b/g;
const TAILWIND_SPACING_RE = /\b(?:p|m|gap|space-x|space-y|w|h|top|right|bottom|left|inset)-\d+\b/g;
const TAILWIND_DURATION_RE = /\bduration-\d+\b/g;
const FONT_SIZE_PX_RE = /\bfont-size\s*:\s*(\d+(?:\.\d+)?(?:px|rem|em))/g;
const TAILWIND_FONT_RE = /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g;

function extractWithRe(text, re, kind) {
  const out = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const matches = lines[i].matchAll(new RegExp(re.source, re.flags));
    for (const m of matches) {
      out.push({ kind, value: m[0], line: i + 1, snippet: lines[i].trim() });
    }
  }
  return out;
}

export function extractValues(text) {
  if (!text) return [];
  const out = [];
  out.push(...extractWithRe(text, COLOR_HEX_RE, 'color'));
  out.push(...extractWithRe(text, COLOR_RGB_RE, 'color'));
  out.push(...extractWithRe(text, COLOR_OKLCH_RE, 'color'));
  out.push(...extractWithRe(text, COLOR_HSL_RE, 'color'));
  out.push(...extractWithRe(text, TAILWIND_COLOR_RE, 'color'));
  out.push(...extractWithRe(text, SPACING_PX_RE, 'spacing'));
  out.push(...extractWithRe(text, SPACING_REM_RE, 'spacing'));
  out.push(...extractWithRe(text, DURATION_MS_RE, 'duration'));
  out.push(...extractWithRe(text, DURATION_S_RE, 'duration'));
  out.push(...extractWithRe(text, TAILWIND_SPACING_RE, 'spacing-tw'));
  out.push(...extractWithRe(text, TAILWIND_DURATION_RE, 'duration-tw'));
  out.push(...extractWithRe(text, FONT_SIZE_PX_RE, 'typography'));
  out.push(...extractWithRe(text, TAILWIND_FONT_RE, 'typography-tw'));
  return out;
}
