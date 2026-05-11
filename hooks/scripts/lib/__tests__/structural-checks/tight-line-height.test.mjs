// Run: node --test hooks/scripts/lib/__tests__/structural-checks/tight-line-height.test.mjs
//
// Repro for the recurring "FRANCESCA hero" bug: display-size headings with
// line-height < 1.0 cause baselines to collide with adjacent dividers or
// with their own next line when the heading wraps. Three textual fixes in
// markdown failed to stick — this gate is the deterministic backstop.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, ID } from '../../structural-checks/tight-line-height.mjs';

function el(selector, tagName, text, fontSize, lineHeight) {
  return {
    selector,
    tagName,
    text,
    bbox: { x: 0, y: 0, width: 800, height: 200 },
    style: { fontSize, lineHeight, letterSpacing: 'normal', color: 'rgb(0,0,0)', backgroundColor: 'rgba(0,0,0,0)' },
  };
}

test('exports stable ID', () => { assert.equal(ID, 'tight-line-height'); });

// ── Robustness ───────────────────────────────────────────────────────────────
test('returns [] on empty/invalid input without throwing', () => {
  assert.deepEqual(check(null), []);
  assert.deepEqual(check({}), []);
  assert.deepEqual(check({ elements: [] }), []);
  assert.deepEqual(check({ elements: null }), []);
});

test('skips elements without a style object', () => {
  const dom = { elements: [{ selector: 'h1', tagName: 'h1', text: 'Big', bbox: { x: 0, y: 0, width: 800, height: 200 } }] };
  assert.deepEqual(check(dom), []);
});

test('skips elements without text content', () => {
  // A divider with a huge font-size and tight line-height but no text is not
  // a typography defect — leave it alone.
  const dom = { elements: [el('hr.divider', 'hr', '', '200px', '160px')] };
  assert.deepEqual(check(dom), []);
});

// ── Below-threshold elements pass ────────────────────────────────────────────
test('passes for body-size text regardless of line-height', () => {
  // 14px body text with line-height 1.0 is unusual but not a baseline-collision
  // bug — the threshold targets display-size headings only.
  const dom = { elements: [el('p.body', 'p', 'Body copy', '14px', '14px')] };
  assert.deepEqual(check(dom), []);
});

test('passes for medium headings at the boundary', () => {
  // 64px exactly is the threshold; only > 64px counts as display-size.
  const dom = { elements: [el('h2', 'h2', 'Subhead', '64px', '48px')] };
  assert.deepEqual(check(dom), []);
});

test('passes when line-height is "normal" (browser default ~1.2)', () => {
  // Implicit `line-height: normal` is never the bug — it resolves to a
  // browser-default ratio of roughly 1.2. Skip rather than guess.
  const dom = { elements: [el('h1.hero', 'h1', 'Headline', '200px', 'normal')] };
  assert.deepEqual(check(dom), []);
});

test('passes for display heading with safe line-height ratio (≥ 0.9)', () => {
  // 200px font, 180px line-height → ratio 0.9 exactly. Boundary case: PASS.
  const dom = { elements: [el('h1.hero', 'h1', 'Headline', '200px', '180px')] };
  assert.deepEqual(check(dom), []);
});

test('passes for typical display heading (ratio 1.0)', () => {
  // The studio-har-clean fixture pattern: 96px / 100px = 1.04 → safe.
  const dom = { elements: [el('h1.brand', 'h1', 'STUDIO/HÅR', '96px', '100px')] };
  assert.deepEqual(check(dom), []);
});

// ── Core failure case: the FRANCESCA bug ─────────────────────────────────────
test('flags display heading with line-height ratio < 0.9 (FRANCESCA repro)', () => {
  // Massive name-hero with line-height 0.8 — the recurring bug. The H1 wraps
  // ("FRAN" + "CESCA"), the second line's caps overlap the first line's
  // descenders, and the bottom-edge clips the horizontal divider below.
  const dom = { elements: [el('h1.name', 'h1', 'FRANCESCA', '240px', '192px')] };
  const hits = check(dom);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].check_id, 'tight-line-height');
  assert.equal(hits[0].selector, 'h1.name');
  assert.equal(hits[0].observed.ratio, 0.8);
  assert.equal(hits[0].observed.font_size_px, 240);
  assert.equal(hits[0].observed.line_height_px, 192);
  assert.match(hits[0].message, /line-height/);
});

test('flags h2 display heading with tight line-height', () => {
  // Same root cause is possible on any wrapping display heading, not just h1.
  const dom = { elements: [el('h2.section-title', 'h2', 'Long Section Title That Wraps', '120px', '96px')] };
  const hits = check(dom);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].observed.ratio, 0.8);
});

test('flags multiple offending elements independently', () => {
  const dom = { elements: [
    el('h1.hero',  'h1',  'FRANCESCA',         '240px', '192px'),  // 0.8 — fail
    el('h2.title', 'h2',  'Subhead',           '80px',  '60px'),   // 0.75 — fail
    el('h3.lead',  'h3',  'Tertiary heading',  '40px',  '32px'),   // below font threshold — pass
    el('p.body',   'p',   'Body copy here',    '16px',  '12px'),   // below font threshold — pass
  ]};
  const hits = check(dom);
  assert.equal(hits.length, 2);
  const selectors = hits.map((h) => h.selector).sort();
  assert.deepEqual(selectors, ['h1.hero', 'h2.title']);
});

// ── Message quality (the LLM reads this to know how to fix it) ───────────────
test('message names the property and prescribes the fix', () => {
  const dom = { elements: [el('h1.name', 'h1', 'FRANCESCA', '240px', '192px')] };
  const hits = check(dom);
  assert.match(hits[0].message, /line-height/);
  assert.match(hits[0].message, /baseline|collide|overlap|clip/i);
  // Must include a concrete prescription, not just describe the symptom.
  assert.match(hits[0].message, /≥|>=|at least/);
});

// ── Edge case: malformed style values don't crash ────────────────────────────
test('handles malformed font-size gracefully', () => {
  const dom = { elements: [el('h1.broken', 'h1', 'Hello', 'huge', '0.5em')] };
  assert.deepEqual(check(dom), []);
});

test('handles missing line-height gracefully', () => {
  const dom = { elements: [{
    selector: 'h1', tagName: 'h1', text: 'Hello',
    bbox: { x: 0, y: 0, width: 800, height: 200 },
    style: { fontSize: '200px' /* lineHeight intentionally missing */ },
  }]};
  assert.deepEqual(check(dom), []);
});

test('handles unitless line-height numeric (resolves against font-size)', () => {
  // getComputedStyle normally returns px, but the snapshot extractor could
  // in principle pass a unitless number. 200 * 0.8 = 160 → ratio 0.8 → fail.
  const dom = { elements: [{
    selector: 'h1', tagName: 'h1', text: 'Hi',
    bbox: { x: 0, y: 0, width: 800, height: 200 },
    style: { fontSize: '200px', lineHeight: '0.8' },
  }]};
  const hits = check(dom);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].observed.ratio, 0.8);
});
