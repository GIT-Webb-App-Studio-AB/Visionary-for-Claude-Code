// blend-parser.mjs — Sprint 17 Task 33.3
// Parses both:
//   1. STRICT: "swiss-international:0.7 + liminal-space:0.3"  (for --blend flag)
//   2. NL: "70% Swiss, 30% Liminal" or "Swiss men med Liminals typografi"
//
// Pure, dep-free helper apart from a one-time read of _embeddings.json so we
// can validate that anchors actually exist in the catalog. The same loader
// pattern as style-blend.mjs — tolerate both the wrapped {meta, embeddings}
// shape and a flat id→vector map (tests inject the flat shape directly).
//
// Public API:
//   parseStrictBlend(input, opts?) → { ok, anchors, errors }
//   parseNaturalLanguage(prompt, opts?) → { ok, mode, anchors|base+overlay, errors }
//   parseBlend(input, opts?)       → strict-then-NL convenience entry
//   validateAnchors(anchors, opts?) → { ok, normalized?, error? }

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let _validIds = null;
let _validIdsPath = null;

function loadValidIds(customPath) {
  if (_validIds && _validIdsPath === (customPath || null)) return _validIds;
  let path = customPath;
  if (!path) {
    const __filename = fileURLToPath(import.meta.url);
    path = resolve(
      dirname(__filename),
      '..',
      '..',
      '..',
      'skills',
      'visionary',
      'styles',
      '_embeddings.json'
    );
  }
  if (existsSync(path)) {
    try {
      const data = JSON.parse(readFileSync(path, 'utf8'));
      // Tolerate both the wrapped `{meta, embeddings}` shape (production file)
      // and a flat `{id: vector}` map (test fixtures).
      const map =
        data && data.embeddings && typeof data.embeddings === 'object'
          ? data.embeddings
          : data;
      _validIds = new Set(Object.keys(map));
      _validIdsPath = customPath || null;
      return _validIds;
    } catch {
      /* fallthrough to empty set */
    }
  }
  _validIds = new Set();
  _validIdsPath = customPath || null;
  return _validIds;
}

// Resolve the `validIds` source for a given call. `opts.validIds` accepts
// either a Set, an Array, or a plain object (id→anything). Falls back to the
// on-disk catalog. An empty set is treated as "skip catalog validation" so
// the strict parser can still surface syntax errors without a catalog file.
function resolveValidIds(opts = {}) {
  if (opts.validIds instanceof Set) return opts.validIds;
  if (Array.isArray(opts.validIds)) return new Set(opts.validIds);
  if (opts.validIds && typeof opts.validIds === 'object') {
    return new Set(Object.keys(opts.validIds));
  }
  return loadValidIds(opts.embeddingsPath);
}

// ── Strict parser ──────────────────────────────────────────────────────────
// Format: "id1:w1 + id2:w2 + id3:w3"
// Returns { ok, anchors: [{id, weight}, ...], errors: [] }
export function parseStrictBlend(input, opts = {}) {
  const errors = [];
  const anchors = [];
  if (typeof input !== 'string' || !input.trim()) {
    return { ok: false, anchors, errors: ['Empty input'] };
  }
  const validIds = resolveValidIds(opts);
  // Split by + with optional whitespace. Lowercase here so the strict format
  // is case-insensitive on the id while still requiring a leading letter.
  const parts = input.trim().split(/\s*\+\s*/);
  for (const partRaw of parts) {
    const part = partRaw.trim().toLowerCase();
    if (!part) {
      errors.push('Empty token');
      continue;
    }
    const m = part.match(/^([a-z][a-z0-9-]*):([0-9]+(?:\.[0-9]+)?)$/);
    if (!m) {
      errors.push(`Invalid token: "${partRaw}"`);
      continue;
    }
    const id = m[1];
    const weight = parseFloat(m[2]);
    if (Number.isNaN(weight) || weight < 0) {
      errors.push(`Invalid weight in "${partRaw}"`);
      continue;
    }
    if (validIds.size > 0 && !validIds.has(id)) {
      errors.push(`Unknown style id: "${id}"`);
      continue;
    }
    anchors.push({ id, weight });
  }
  if (anchors.length < 2) {
    errors.push('Need at least 2 anchors for a blend');
  }
  return { ok: errors.length === 0, anchors, errors };
}

// ── NL parser ──────────────────────────────────────────────────────────────
// Patterns supported (Swedish + English):
//   "70% Swiss, 30% Liminal"
//   "70% swiss + 30% liminal-space"
//   "Swiss men med Liminals typografi"           (X-with-Y's-Z)
//   "Swiss but with Liminal's motion"            (X-with-Y's-Z)
//
// Returns:
//   { ok, mode: 'blend',    anchors: [{id, weight}, ...], errors }
//   { ok, mode: 'override', base, overlay: { component, from }, errors }
//   { ok: false, mode: 'none', anchors: [], errors }
export function parseNaturalLanguage(prompt, opts = {}) {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return { ok: false, mode: 'none', anchors: [], errors: ['Empty input'] };
  }
  const validIds = resolveValidIds(opts);

  // Pattern 1: "X% style-name [, or +] Y% style-name [...]".
  // Need ≥2 percent-tagged tokens to count as a blend; "100% Swiss" alone is
  // a single-anchor request, not a blend.
  const pctRe = /(\d{1,3})\s*%\s*([a-zA-ZåäöÅÄÖ][a-zA-ZåäöÅÄÖ\s-]{1,30}?)(?=\s*(?:[,+]|och|and|$))/gi;
  const pctMatches = [...prompt.matchAll(pctRe)];
  if (pctMatches.length >= 2) {
    const anchors = [];
    const errors = [];
    for (const m of pctMatches) {
      const pct = parseInt(m[1], 10);
      const styleHint = m[2].trim().toLowerCase();
      const id = fuzzyMatchId(styleHint, validIds);
      if (!id) {
        errors.push(`Unknown style: "${styleHint}"`);
        continue;
      }
      anchors.push({ id, weight: pct / 100 });
    }
    return {
      ok: errors.length === 0 && anchors.length >= 2,
      mode: 'blend',
      anchors,
      errors,
    };
  }

  // Pattern 2: "X men med Y[:s|s] Z" / "X but with Y['s] Z"
  // Component vocabulary supports SV + EN with light typo-tolerance for the
  // possessive 's (Swedish drops the apostrophe; "Liminals" === "Liminal:s").
  const overlayRe =
    /([a-zA-ZåäöÅÄÖ][a-zA-ZåäöÅÄÖ\s-]{1,30}?)\s+(?:men med|but with)\s+([a-zA-ZåäöÅÄÖ][a-zA-ZåäöÅÄÖ\s-]{1,30}?)(?:'s|:s|s)?\s+(typografi|typography|motion|palette|färg|färger|color|colour)\b/i;
  const om = prompt.match(overlayRe);
  if (om) {
    const baseHint = om[1].trim().toLowerCase();
    const overlayHint = om[2].trim().toLowerCase();
    const componentRaw = om[3].toLowerCase();
    const componentMap = {
      typografi: 'typography',
      typography: 'typography',
      motion: 'motion',
      palette: 'palette',
      färg: 'palette',
      färger: 'palette',
      color: 'palette',
      colour: 'palette',
    };
    const component = componentMap[componentRaw];
    const baseId = fuzzyMatchId(baseHint, validIds);
    const overlayId = fuzzyMatchId(overlayHint, validIds);
    if (baseId && overlayId && component) {
      return {
        ok: true,
        mode: 'override',
        base: baseId,
        overlay: { component, from: overlayId },
        errors: [],
      };
    }
    // Overlay shape detected but couldn't resolve — surface as an explicit
    // error rather than falling silently through to "no pattern".
    const errs = [];
    if (!baseId) errs.push(`Unknown base style: "${baseHint}"`);
    if (!overlayId) errs.push(`Unknown overlay style: "${overlayHint}"`);
    if (!component) errs.push(`Unknown overlay component: "${componentRaw}"`);
    return { ok: false, mode: 'override', anchors: [], errors: errs };
  }

  return { ok: false, mode: 'none', anchors: [], errors: ['No blend pattern detected'] };
}

// Fuzzy id-match: lowercase + dashed, then try direct, prefix, contains.
// Bidirectional contains is intentional — a prompt's natural shorthand
// ("swiss") is a substring of catalog ids ("swiss-international",
// "swiss-rationalism"). We pick the shortest match for stability so
// "swiss" → "swiss" if it exists, else the first prefix candidate.
function fuzzyMatchId(hint, validIds) {
  if (!hint) return null;
  const h = hint
    .toLowerCase()
    .trim()
    .replace(/['']/g, '') // strip stray apostrophes from "y's"
    .replace(/\s+/g, '-');
  if (validIds.size === 0) return h; // no catalog → trust the hint as-is
  if (validIds.has(h)) return h;

  // Prefix match: prefer shortest id (most specific anchor).
  const prefix = [];
  for (const id of validIds) if (id.startsWith(h + '-') || id.startsWith(h)) prefix.push(id);
  if (prefix.length > 0) {
    prefix.sort((a, b) => a.length - b.length);
    return prefix[0];
  }

  // Contains match in either direction (hint-in-id or id-in-hint).
  for (const id of validIds) if (id.includes(h)) return id;
  for (const id of validIds) if (h.includes(id)) return id;

  return null;
}

// Single high-level entry: try strict first, fall back to NL.
export function parseBlend(input, opts = {}) {
  const strict = parseStrictBlend(input, opts);
  if (strict.ok) return { ...strict, source: 'strict' };
  const nl = parseNaturalLanguage(input, opts);
  if (nl.ok) return { ...nl, source: 'nl' };
  // Aggregate errors so callers can surface them in one go.
  const errors = [];
  for (const e of strict.errors || []) errors.push(`strict: ${e}`);
  for (const e of nl.errors || []) errors.push(`nl: ${e}`);
  return { ok: false, errors, source: 'none' };
}

// Validation: weights must normalize to 1.0 ± epsilon. We accept any positive
// sum and renormalize — a user typing "swiss:1.5 + liminal:1.5" expresses
// intent (50/50) clearly, even though their numbers are sloppy. We only fail
// when every weight is ~0 (no signal to renormalize).
export function validateAnchors(anchors, opts = {}) {
  const eps = opts.epsilon ?? 0.05;
  if (!Array.isArray(anchors) || anchors.length === 0) {
    return { ok: false, error: 'No anchors' };
  }
  const sum = anchors.reduce((s, a) => s + (Number(a.weight) || 0), 0);
  if (Math.abs(sum) < eps) {
    return { ok: false, error: 'All weights are zero' };
  }
  return {
    ok: true,
    normalized: anchors.map((a) => ({ ...a, weight: a.weight / sum })),
  };
}

// Test-only export for cache reset between specs.
export function _resetCacheForTests() {
  _validIds = null;
  _validIdsPath = null;
}
