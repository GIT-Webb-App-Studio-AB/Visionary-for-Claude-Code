// blend-parser.test.mjs — Sprint 17 Task 33.3
// Verifies both strict and NL parser paths plus the "X men med Y:s Z"
// override pattern. We inject a fixture `validIds` set so the tests are
// independent of the on-disk _embeddings.json catalog state.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseStrictBlend,
  parseNaturalLanguage,
  parseBlend,
  validateAnchors,
} from '../blend-parser.mjs';

// Fixture catalog for tests. Mirrors enough of the real catalog to exercise
// fuzzy-match (prefix, contains) and override patterns without coupling to
// the production _embeddings.json file.
const FIXTURE_IDS = new Set([
  'swiss',
  'swiss-international',
  'swiss-rationalism',
  'liminal',
  'liminal-space',
  'brutalist',
  'brutalist-honesty',
  'glass',
  'liquid-glass',
  'memphis',
  'bauhaus',
  'editorial',
  'editorial-magazine',
  'dreamcore',
  'glitchcore',
  'fintech-trust',
  'saas-b2b-dashboard',
]);

const opts = { validIds: FIXTURE_IDS };

// ── 1. parseStrictBlend ────────────────────────────────────────────────────

test('parseStrictBlend: well-formed two-anchor blend', () => {
  const r = parseStrictBlend(
    'swiss-international:0.7 + liminal-space:0.3',
    opts
  );
  assert.equal(r.ok, true);
  assert.equal(r.anchors.length, 2);
  assert.deepEqual(r.anchors[0], { id: 'swiss-international', weight: 0.7 });
  assert.deepEqual(r.anchors[1], { id: 'liminal-space', weight: 0.3 });
});

test('parseStrictBlend: single anchor → not a blend', () => {
  const r = parseStrictBlend('swiss-international:1.0', opts);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /at least 2/i.test(e)));
});

test('parseStrictBlend: unknown id surfaces explicit error', () => {
  const r = parseStrictBlend(
    'nonexistent-style:0.5 + swiss-international:0.5',
    opts
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /unknown style id/i.test(e)));
});

test('parseStrictBlend: malformed weight → error', () => {
  const r = parseStrictBlend('swiss-international:abc + liminal-space:0.5', opts);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /invalid token/i.test(e)));
});

test('parseStrictBlend: empty input → error', () => {
  const r = parseStrictBlend('', opts);
  assert.equal(r.ok, false);
});

test('parseStrictBlend: case insensitive on id', () => {
  const r = parseStrictBlend(
    'Swiss-International:0.6 + Liminal-Space:0.4',
    opts
  );
  assert.equal(r.ok, true);
  assert.equal(r.anchors[0].id, 'swiss-international');
});

// ── 2. parseNaturalLanguage: percent-form ──────────────────────────────────

test('parseNaturalLanguage: "70% Swiss, 30% Liminal"', () => {
  const r = parseNaturalLanguage('70% Swiss, 30% Liminal', opts);
  assert.equal(r.ok, true);
  assert.equal(r.mode, 'blend');
  assert.equal(r.anchors.length, 2);
  // "swiss" is its own id in the fixture so the shortest-prefix rule picks it.
  assert.equal(r.anchors[0].id, 'swiss');
  assert.equal(r.anchors[0].weight, 0.7);
  assert.equal(r.anchors[1].id, 'liminal');
  assert.equal(r.anchors[1].weight, 0.3);
});

test('parseNaturalLanguage: "70% swiss-international + 30% liminal-space"', () => {
  const r = parseNaturalLanguage(
    '70% swiss-international + 30% liminal-space',
    opts
  );
  assert.equal(r.ok, true);
  assert.equal(r.anchors.length, 2);
  assert.equal(r.anchors[0].id, 'swiss-international');
  assert.equal(r.anchors[1].id, 'liminal-space');
});

test('parseNaturalLanguage: single percent → not a blend', () => {
  const r = parseNaturalLanguage('Just 100% Swiss', opts);
  assert.equal(r.ok, false);
});

// ── 3. parseNaturalLanguage: override pattern ──────────────────────────────

test('parseNaturalLanguage: "Swiss men med Liminals typografi"', () => {
  const r = parseNaturalLanguage('Swiss men med Liminals typografi', opts);
  assert.equal(r.ok, true);
  assert.equal(r.mode, 'override');
  assert.equal(r.base, 'swiss');
  assert.equal(r.overlay.component, 'typography');
  assert.equal(r.overlay.from, 'liminal');
});

test("parseNaturalLanguage: \"Brutalist but with Glass's motion\"", () => {
  const r = parseNaturalLanguage("Brutalist but with Glass's motion", opts);
  assert.equal(r.ok, true);
  assert.equal(r.mode, 'override');
  assert.equal(r.overlay.component, 'motion');
});

test('parseNaturalLanguage: SV palette via "färg"', () => {
  const r = parseNaturalLanguage('Editorial men med Memphis färg', opts);
  assert.equal(r.ok, true);
  assert.equal(r.mode, 'override');
  assert.equal(r.overlay.component, 'palette');
  assert.equal(r.overlay.from, 'memphis');
});

test('parseNaturalLanguage: empty input', () => {
  const r = parseNaturalLanguage('', opts);
  assert.equal(r.ok, false);
});

test('parseNaturalLanguage: nonsense returns ok:false', () => {
  const r = parseNaturalLanguage('absolute nonsense', opts);
  assert.equal(r.ok, false);
});

// ── 4. parseBlend: strict-then-NL fallthrough ──────────────────────────────

test('parseBlend: strict succeeds → source=strict', () => {
  const r = parseBlend('swiss-international:0.7 + liminal-space:0.3', opts);
  assert.equal(r.ok, true);
  assert.equal(r.source, 'strict');
});

test('parseBlend: NL fallback when strict fails', () => {
  const r = parseBlend('70% Swiss, 30% Liminal', opts);
  assert.equal(r.ok, true);
  assert.equal(r.source, 'nl');
});

test('parseBlend: both fail → ok:false with aggregated errors', () => {
  const r = parseBlend('absolute nonsense', opts);
  assert.equal(r.ok, false);
  assert.equal(r.source, 'none');
  assert.ok(r.errors.length > 0);
});

// ── 5. validateAnchors: auto-renormalize ───────────────────────────────────

test('validateAnchors: weights summing to 1 pass through', () => {
  const r = validateAnchors([
    { id: 'a', weight: 0.7 },
    { id: 'b', weight: 0.3 },
  ]);
  assert.equal(r.ok, true);
  assert.equal(r.normalized[0].weight, 0.7);
});

test('validateAnchors: weights >1 auto-renormalize to 1', () => {
  const r = validateAnchors([
    { id: 'a', weight: 1.5 },
    { id: 'b', weight: 1.5 },
  ]);
  assert.equal(r.ok, true);
  const sum = r.normalized.reduce((s, a) => s + a.weight, 0);
  assert.ok(Math.abs(sum - 1.0) < 1e-9);
  // Even split.
  assert.ok(Math.abs(r.normalized[0].weight - 0.5) < 1e-9);
});

test('validateAnchors: all-zero weights → fail', () => {
  const r = validateAnchors([
    { id: 'a', weight: 0 },
    { id: 'b', weight: 0 },
  ]);
  assert.equal(r.ok, false);
});

// ── 6. fuzzy match smoke ───────────────────────────────────────────────────

test('fuzzy match: "swiss" resolves to "swiss" (shortest prefix)', () => {
  const r = parseNaturalLanguage('60% Swiss, 40% Liminal', opts);
  assert.equal(r.ok, true);
  assert.equal(r.anchors[0].id, 'swiss');
});

test('fuzzy match: hint with no catalog entry returns error', () => {
  const r = parseNaturalLanguage('60% Quasarpunk, 40% Liminal', opts);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /unknown style/i.test(e)));
});

// ── 7. Data-driven: 20 phrases per AC ──────────────────────────────────────
//
// Each row: [phrase, predicate(result) → boolean | string-msg-on-fail].
// We use parseBlend so each phrase is exercised through the same entry point
// the runtime uses. Some phrases are intentionally negative ("100% Swiss",
// empty, nonsense).

const PHRASES = [
  // 1. Strict, well-formed
  [
    'swiss-international:0.7 + liminal-space:0.3',
    (r) => r.ok && r.source === 'strict' && r.anchors.length === 2,
  ],
  // 2. NL percent, mixed-case
  ['70% Swiss, 30% Liminal', (r) => r.ok && r.source === 'nl' && r.anchors.length === 2],
  // 3. NL with + separator
  ['70% swiss + 30% liminal', (r) => r.ok && r.anchors.length === 2],
  // 4. NL pair on different anchors
  [
    '60% Brutalist, 40% Glass',
    (r) => r.ok && r.anchors.some((a) => a.id.startsWith('brutalist')),
  ],
  // 5. NL reversed-weight order
  [
    '30% Memphis, 70% Bauhaus',
    (r) => r.ok && r.anchors[0].weight === 0.3 && r.anchors[1].weight === 0.7,
  ],
  // 6. Override SV (typografi)
  [
    'Swiss men med Liminals typografi',
    (r) => r.ok && r.mode === 'override' && r.overlay.component === 'typography',
  ],
  // 7. Override EN (motion)
  [
    "Brutalist but with Glass's motion",
    (r) => r.ok && r.mode === 'override' && r.overlay.component === 'motion',
  ],
  // 8. Override SV (motion) — note SV often drops the genitive apostrophe
  [
    'Memphis men med Bauhaus motion',
    (r) => r.ok && r.mode === 'override' && r.overlay.component === 'motion',
  ],
  // 9. Override EN (palette via "palette")
  [
    "Dreamcore but with Glitchcore's palette",
    (r) => r.ok && r.mode === 'override' && r.overlay.component === 'palette',
  ],
  // 10. Strict on multi-segment ids
  [
    'fintech-trust:0.5 + saas-b2b-dashboard:0.5',
    (r) => r.ok && r.source === 'strict' && r.anchors.length === 2,
  ],
  // 11. Single anchor — not a blend
  ['100% Swiss', (r) => r.ok === false],
  // 12. Empty input
  ['', (r) => r.ok === false],
  // 13. Pure nonsense
  ['absolute nonsense', (r) => r.ok === false],
  // 14. Strict, mixed case ids
  [
    'Swiss-International:0.6 + Liminal-Space:0.4',
    (r) => r.ok && r.source === 'strict',
  ],
  // 15. Strict with one zero weight is still parsed; downstream validateAnchors
  //     catches the all-zero case. Here only one is zero so the normalized
  //     blend is just "100% swiss-international" — valid syntax, parser ok.
  [
    'swiss-international:1.0 + liminal:0',
    (r) => r.ok && r.anchors.length === 2 && r.anchors[1].weight === 0,
  ],
  // 16. Sum-greater-than-1 — parser accepts; validateAnchors renormalizes.
  [
    'swiss:1.5 + liminal:1.5',
    (r) => {
      if (!r.ok) return 'parser rejected sum>1';
      const v = validateAnchors(r.anchors);
      const sum = v.normalized.reduce((s, a) => s + a.weight, 0);
      return v.ok && Math.abs(sum - 1) < 1e-9;
    },
  ],
  // 17. NL pair at different ratios
  [
    '85% Glass, 15% Editorial',
    (r) => r.ok && r.anchors[0].weight === 0.85 && r.anchors[1].weight === 0.15,
  ],
  // 18. Override SV via "färg"
  [
    'Editorial men med Memphis färg',
    (r) => r.ok && r.mode === 'override' && r.overlay.component === 'palette',
  ],
  // 19. Override EN via "palette" with explicit possessive
  [
    "Editorial but with Memphis's palette",
    (r) => r.ok && r.mode === 'override' && r.overlay.component === 'palette',
  ],
  // 20. Typo-robust: "Memphiss palette" with no apostrophe — the SV/EN regex
  //     also accepts a trailing "s" possessive (Swedish convention) so this
  //     should still parse.
  [
    'Editorial but with Memphiss palette',
    (r) => r.ok && r.mode === 'override' && r.overlay.component === 'palette',
  ],
];

test('20-phrase data-driven recall (≥80%)', () => {
  let passed = 0;
  const failures = [];
  for (const [phrase, pred] of PHRASES) {
    const r = parseBlend(phrase, opts);
    let ok;
    try {
      const v = pred(r);
      ok = v === true;
      if (!ok && typeof v === 'string') failures.push(`"${phrase}" → ${v}`);
      else if (!ok) failures.push(`"${phrase}" → predicate false (got ${JSON.stringify(r)})`);
    } catch (e) {
      failures.push(`"${phrase}" → predicate threw: ${e.message}`);
      ok = false;
    }
    if (ok) passed++;
  }
  // AC: ≥80% recall on rimliga formuleringar. With 20 phrases that is ≥16.
  // We aim for 20/20 in this fixture; treat anything <16 as a hard fail.
  const recall = passed / PHRASES.length;
  assert.ok(
    recall >= 0.8,
    `recall ${(recall * 100).toFixed(1)}% < 80% — failures:\n${failures.join('\n')}`
  );
});
