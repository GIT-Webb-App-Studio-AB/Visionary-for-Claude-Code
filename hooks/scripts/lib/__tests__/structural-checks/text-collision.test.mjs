// Run: node --test hooks/scripts/lib/__tests__/structural-checks/text-collision.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, ID } from '../../structural-checks/text-collision.mjs';

// Helper: build an ElementSnapshot quickly without spelling out every field.
function el(selector, tagName, text, bbox, parentTag = null) {
  return { selector, tagName, text, bbox, parentTag };
}

test('exports stable ID', () => { assert.equal(ID, 'text-collision'); });

// ── Happy path: clean layout passes ──────────────────────────────────────────
test('passes for a normal stacked layout (no overlap)', () => {
  const dom = { elements: [
    el('header h1',  'h1', 'Welcome',     { x: 24, y: 24,  width: 600, height: 48 }),
    el('main p',     'p',  'Some text',   { x: 24, y: 96,  width: 600, height: 24 }),
    el('footer span','span','© 2026',     { x: 24, y: 760, width: 100, height: 16 }),
  ]};
  assert.deepEqual(check(dom), []);
});

// ── Core failure case: two siblings collide ──────────────────────────────────
test('flags two text elements whose bboxes overlap > 30%', () => {
  // h1 and p occupy almost the same space — broken layout.
  const dom = { elements: [
    el('h1.title', 'h1', 'Hero Title',  { x: 100, y: 100, width: 400, height: 80 }),
    el('p.subtitle', 'p', 'Subtitle',   { x: 120, y: 120, width: 380, height: 60 }),
  ]};
  const hits = check(dom);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].check_id, 'text-collision');
  assert.ok(hits[0].observed.overlap_ratio >= 0.30);
  assert.match(hits[0].message, /overlaps/);
});

// ── False-positive guard: containment (parent/child) ─────────────────────────
test('skips when one bbox fully contains the other (parent/child nesting)', () => {
  const dom = { elements: [
    el('section.hero', 'section', 'Hero — buy now', { x: 0, y: 0, width: 1200, height: 400 }),
    el('section.hero h1', 'h1',   'Hero',           { x: 100, y: 100, width: 400, height: 60 }),
  ]};
  assert.deepEqual(check(dom), []);
});

// ── False-positive guard: recursive textContent ──────────────────────────────
test('skips when one text is a prefix/superset of the other (recursive textContent)', () => {
  // Even with bboxes that overlap partially, if the text is the same or one
  // contains the other, it's the same logical text reported on both parent
  // and child by the snapshot extractor.
  const dom = { elements: [
    el('header',    'header', 'Welcome to our site',  { x: 0, y: 0, width: 1200, height: 100 }),
    el('header h1', 'h1',     'Welcome',              { x: 24, y: 30, width: 800, height: 40 }),
  ]};
  assert.deepEqual(check(dom), []);
});

// ── False-positive guard: overlay tags ───────────────────────────────────────
test('skips when one element is a dialog (intentional overlay)', () => {
  const dom = { elements: [
    el('main p', 'p', 'Content', { x: 100, y: 100, width: 400, height: 60 }),
    el('dialog.confirm', 'dialog', 'Confirm action', { x: 100, y: 100, width: 400, height: 60 }),
  ]};
  assert.deepEqual(check(dom), []);
});

test('skips when selector contains [role="tooltip"] hint', () => {
  const dom = { elements: [
    el('button.btn', 'button', 'Save', { x: 100, y: 100, width: 80, height: 36 }),
    el('span[role="tooltip"]', 'span', 'Save — Ctrl+S', { x: 110, y: 110, width: 80, height: 36 }),
  ]};
  assert.deepEqual(check(dom), []);
});

// ── Decorative/tiny elements ─────────────────────────────────────────────────
test('skips elements with bbox area below MIN_AREA', () => {
  const dom = { elements: [
    el('span.dot', 'span', 'a', { x: 100, y: 100, width: 4, height: 4 }),
    el('p.body',   'p',   'lorem',   { x: 100, y: 100, width: 4, height: 4 }),
  ]};
  assert.deepEqual(check(dom), []);
});

test('skips elements with text shorter than MIN_TEXT_LEN', () => {
  const dom = { elements: [
    el('span.a', 'span', 'a', { x: 100, y: 100, width: 200, height: 60 }),
    el('span.b', 'span', '',  { x: 100, y: 100, width: 200, height: 60 }),
  ]};
  assert.deepEqual(check(dom), []);
});

// ── Threshold edge cases ─────────────────────────────────────────────────────
test('does NOT flag a small (< 30%) overlap from negative margin grazing', () => {
  // 100x100 boxes, only 10x10 overlap = 10% of smaller. Below threshold.
  const dom = { elements: [
    el('div.a', 'div', 'Card A', { x: 0,  y: 0, width: 100, height: 100 }),
    el('div.b', 'div', 'Card B', { x: 90, y: 90, width: 100, height: 100 }),
  ]};
  assert.deepEqual(check(dom), []);
});

test('flags ratio measured against smaller element, not larger', () => {
  // Tiny chip (50x20 = 1000px²) sits inside a big section (1200x400 = 480k px²)
  // but does NOT fit fully inside it — partial overlap of, say, 50x10 = 500px²
  // = 50% of the chip but only 0.1% of the section. We must measure against
  // the chip (smaller).
  const dom = { elements: [
    el('section.bg', 'section', 'Big section content', { x: 0,  y: 0,   width: 1200, height: 400 }),
    el('span.chip',  'span',    'NEW',                 { x: 50, y: -5,  width: 50,   height: 20 }),
  ]};
  // Containment check: chip is NOT fully contained (y starts at -5, outside).
  // Overlap = 50 × 15 = 750 px². Smaller area = chip 1000 px². Ratio = 0.75.
  const hits = check(dom);
  assert.equal(hits.length, 1);
  assert.ok(hits[0].observed.overlap_ratio >= 0.30);
});

// ── Robustness ───────────────────────────────────────────────────────────────
test('returns [] on empty/invalid input without throwing', () => {
  assert.deepEqual(check(null), []);
  assert.deepEqual(check({}), []);
  assert.deepEqual(check({ elements: [] }), []);
  assert.deepEqual(check({ elements: null }), []);
});

test('handles missing bbox gracefully', () => {
  const dom = { elements: [
    el('div.a', 'div', 'Hello', null),
    el('div.b', 'div', 'World', { x: 0, y: 0, width: 0, height: 0 }),
  ]};
  assert.deepEqual(check(dom), []);
});

test('does not double-emit the same pair', () => {
  // Two genuinely overlapping elements. Should produce exactly ONE hit, not
  // one per ordering.
  const dom = { elements: [
    el('h2.a', 'h2', 'Title A', { x: 0, y: 0, width: 200, height: 60 }),
    el('h2.b', 'h2', 'Title B', { x: 0, y: 0, width: 200, height: 60 }),
  ]};
  const hits = check(dom);
  assert.equal(hits.length, 1);
});

// ── Specific real-world bug pattern ──────────────────────────────────────────
test('catches sticky-header sliding over body copy', () => {
  // Sticky bar at y=0 height=64, body p at y=20 height=24 — bar covers half
  // of the paragraph because the page didn't compensate the scroll-offset.
  const dom = { elements: [
    el('header.sticky', 'header', 'Site name • Pricing • About',
       { x: 0, y: 0, width: 1200, height: 64 }, 'body'),
    el('main p.lead',   'p',      'Welcome to our pricing page.',
       { x: 100, y: 20, width: 800, height: 24 }, 'main'),
  ]};
  const hits = check(dom);
  assert.equal(hits.length, 1);
  assert.match(hits[0].message, /broken layout/);
});

// ── Code-review regression tests (v1.5.4) ────────────────────────────────────
test('flags two unrelated siblings sharing a prefix word with partial overlap (no containment)', () => {
  // h3 "Summary" and sibling p "Summary of the report" geometrically
  // overlap partially, with NEITHER containing the other (h3 starts at
  // x=100, p starts at x=200 and extends past h3's right edge). Shared
  // text prefix MUST NOT mute the collision when geometry says
  // "siblings, not nested".
  //
  // h3 bbox: x=100-300, y=100-160 (200×60 = 12000 area)
  // p  bbox: x=200-500, y=120-180 (300×60 = 18000 area)
  // overlap: x=200-300, y=120-160 = 100×40 = 4000
  // smaller area = 12000, ratio = 4000/12000 = 0.33 ≥ 0.30 → fires
  const dom = { elements: [
    el('section h3', 'h3', 'Summary',                { x: 100, y: 100, width: 200, height: 60 }),
    el('section p',  'p',  'Summary of the report',  { x: 200, y: 120, width: 300, height: 60 }),
  ]};
  const hits = check(dom);
  assert.equal(hits.length, 1, 'sibling-with-substring overlap must still fire');
});

test('flags two siblings with identical text that geometrically collide', () => {
  // Two "Sign up" buttons positioned on top of each other due to a layout bug.
  // Equal text MUST NOT count as nesting — it is a real collision.
  const dom = { elements: [
    el('button.primary',   'button', 'Sign up', { x: 100, y: 100, width: 120, height: 40 }),
    el('button.secondary', 'button', 'Sign up', { x: 100, y: 100, width: 120, height: 40 }),
  ]};
  const hits = check(dom);
  assert.equal(hits.length, 1);
});

test('handles uppercase tagName from real DOM (case insensitivity)', () => {
  // Real Playwright element.tagName returns uppercase. The overlay-skip
  // logic must lowercase before checking OVERLAY_TAGS.
  const dom = { elements: [
    el('main p',         'P',      'Content',         { x: 100, y: 100, width: 400, height: 60 }),
    el('dialog.confirm', 'DIALOG', 'Confirm action',  { x: 100, y: 100, width: 400, height: 60 }),
  ]};
  assert.deepEqual(check(dom), [], 'DIALOG tag must be recognised as overlay regardless of case');
});

test('handles bbox with NaN fields gracefully (no false hit)', () => {
  // Bbox with NaN width passes width > 0 check (NaN > 0 = false), so
  // isVisible filters it. Explicit test to lock behaviour.
  const dom = { elements: [
    el('div.broken', 'div', 'Hello world', { x: NaN, y: 0, width: NaN, height: 50 }),
    el('div.normal', 'div', 'World hello', { x: 0,   y: 0, width: 200, height: 50 }),
  ]};
  assert.deepEqual(check(dom), []);
});

test('catches z-index regression: text behind hero overlay', () => {
  // Hero overlay at full size + a heading underneath that should be visible
  // but is fully obstructed by the overlay's text.
  const dom = { elements: [
    el('h1.hero-title', 'h1',   'Big Bold Headline',
       { x: 100, y: 200, width: 800, height: 80 }, 'section'),
    el('div.hero-overlay-text', 'div', 'Get started today',
       { x: 100, y: 200, width: 800, height: 80 }, 'section'),
  ]};
  const hits = check(dom);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].observed.overlap_ratio, 1);
});
