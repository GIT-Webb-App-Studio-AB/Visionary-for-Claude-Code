// validate.test.mjs — Sprint 21 Task 38.3
//
// Tests the implemented validators (single-color, no-rectangles,
// monospace-headlines, asymmetry-only, no-transitions, single-typeface,
// no-center, max-3-colors) against PASS / FAIL fixtures, and confirms
// stub validators return graceful passes.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validate, validateAll, validators } from '../validate.mjs';

// Helpers for building DOM fixtures concise enough for a test file.
function el(opts) {
  return {
    selector: opts.selector || `.test-${Math.random().toString(36).slice(2, 8)}`,
    tagName: opts.tagName || 'div',
    text: opts.text != null ? opts.text : 'test',
    bbox: opts.bbox || { x: 0, y: 0, width: 200, height: 100 },
    style: {
      color: '',
      backgroundColor: '',
      borderColor: '',
      fontFamily: '',
      fontSize: '',
      fontStyle: 'normal',
      fontWeight: '400',
      textAlign: '',
      textTransform: '',
      letterSpacing: '',
      borderRadius: '0px',
      transform: 'none',
      transitionDuration: '0s',
      animationDuration: '0s',
      animationName: 'none',
      animationIterationCount: '1',
      animationPlayState: 'running',
      animationTimeline: 'auto',
      animationDelay: '0s',
      animationFillMode: 'none',
      animationTimingFunction: 'ease',
      transitionTimingFunction: 'ease',
      writingMode: 'horizontal-tb',
      marginLeft: '0',
      marginRight: '0',
      marginTop: '0',
      marginBottom: '0',
      gridTemplateColumns: 'none',
      flexDirection: 'row',
      backgroundImage: 'none',
      mixBlendMode: 'normal',
      clipPath: 'none',
      overflow: 'visible',
      display: 'block',
      ...(opts.style || {}),
    },
  };
}

function dom(elements, viewport) {
  return {
    dom: {
      elements,
      viewport: viewport || { width: 1200, height: 800 },
    },
  };
}

// ── single-color ───────────────────────────────────────────────────────

test('validate single-color: PASS — same hue, just different lightness', () => {
  const input = dom([
    el({ style: { color: 'rgb(255, 0, 0)' } }),
    el({ style: { color: 'rgb(200, 0, 0)' } }),
    el({ style: { backgroundColor: 'rgb(120, 0, 0)' } }),
  ]);
  const r = validate('single-color', input);
  assert.equal(r.passed, true, r.evidence);
});

test('validate single-color: FAIL — multiple distinct hues', () => {
  const input = dom([
    el({ style: { color: 'rgb(255, 0, 0)' } }),
    el({ style: { color: 'rgb(0, 255, 0)' } }),
    el({ style: { color: 'rgb(0, 0, 255)' } }),
  ]);
  const r = validate('single-color', input);
  assert.equal(r.passed, false);
  assert.ok(r.evidence.includes('hue-bins'));
});

test('validate single-color: PASS — only neutrals', () => {
  const input = dom([
    el({ style: { color: 'rgb(0, 0, 0)' } }),
    el({ style: { backgroundColor: 'rgb(255, 255, 255)' } }),
    el({ style: { color: 'rgb(128, 128, 128)' } }),
  ]);
  const r = validate('single-color', input);
  assert.equal(r.passed, true);
});

// ── max-3-colors ───────────────────────────────────────────────────────

test('validate max-3-colors: PASS — 3 distinct hues', () => {
  const input = dom([
    el({ style: { color: 'rgb(255, 0, 0)' } }),
    el({ style: { color: 'rgb(0, 255, 0)' } }),
    el({ style: { color: 'rgb(0, 0, 255)' } }),
  ]);
  const r = validate('max-3-colors', input);
  assert.equal(r.passed, true, r.evidence);
});

test('validate max-3-colors: FAIL — 5 distinct hues', () => {
  const input = dom([
    el({ style: { color: 'rgb(255, 0, 0)' } }),     // red
    el({ style: { color: 'rgb(255, 165, 0)' } }),   // orange
    el({ style: { color: 'rgb(255, 255, 0)' } }),   // yellow
    el({ style: { color: 'rgb(0, 255, 0)' } }),     // green
    el({ style: { color: 'rgb(0, 0, 255)' } }),     // blue
    el({ style: { color: 'rgb(128, 0, 128)' } }),   // purple
  ]);
  const r = validate('max-3-colors', input);
  assert.equal(r.passed, false);
});

// ── no-rectangles ──────────────────────────────────────────────────────

test('validate no-rectangles: PASS — all rounded', () => {
  const input = dom([
    el({
      bbox: { x: 0, y: 0, width: 200, height: 200 },
      style: { borderRadius: '24px' },
    }),
    el({
      bbox: { x: 0, y: 0, width: 320, height: 200 },
      style: { borderRadius: '50%' },
    }),
  ]);
  const r = validate('no-rectangles', input);
  assert.equal(r.passed, true, r.evidence);
});

test('validate no-rectangles: FAIL — square with sharp corners', () => {
  const input = dom([
    el({
      bbox: { x: 0, y: 0, width: 200, height: 200 },
      style: { borderRadius: '0px' },
    }),
  ]);
  const r = validate('no-rectangles', input);
  assert.equal(r.passed, false);
  assert.ok(r.evidence.includes('border-radius'));
});

test('validate no-rectangles: PASS — sharp corner but odd aspect ratio', () => {
  // 1.5:1 aspect... actually 3:2 is in our list. Try 5:1 which is unusual.
  const input = dom([
    el({
      bbox: { x: 0, y: 0, width: 1000, height: 200 },  // 5:1 — not in list
      style: { borderRadius: '0px' },
    }),
  ]);
  const r = validate('no-rectangles', input);
  assert.equal(r.passed, true, r.evidence);
});

test('validate no-rectangles: PASS — sharp but small, exempt', () => {
  const input = dom([
    el({
      bbox: { x: 0, y: 0, width: 32, height: 32 }, // below 64x64 floor
      style: { borderRadius: '0px' },
    }),
  ]);
  const r = validate('no-rectangles', input);
  assert.equal(r.passed, true);
});

// ── monospace-headlines ────────────────────────────────────────────────

test('validate monospace-headlines: PASS — h1 in JetBrains Mono', () => {
  const input = dom([
    el({ tagName: 'h1', style: { fontFamily: '"JetBrains Mono", monospace' } }),
    el({ tagName: 'h2', style: { fontFamily: 'Berkeley Mono' } }),
  ]);
  const r = validate('monospace-headlines', input);
  assert.equal(r.passed, true, r.evidence);
});

test('validate monospace-headlines: FAIL — h1 in Inter', () => {
  const input = dom([
    el({ tagName: 'h1', style: { fontFamily: 'Inter, sans-serif' } }),
  ]);
  const r = validate('monospace-headlines', input);
  assert.equal(r.passed, false);
});

// ── asymmetry-only ─────────────────────────────────────────────────────

test('validate asymmetry-only: PASS — section off-center', () => {
  const input = dom(
    [
      el({
        tagName: 'section',
        bbox: { x: 0, y: 0, width: 1200, height: 600 }, // top-level section
      }),
      el({
        tagName: 'h1',
        bbox: { x: 100, y: 100, width: 300, height: 80 }, // far off-center
      }),
    ],
    { width: 1200, height: 800 },
  );
  // We need section bbox.width >= 50% viewport. Section is 1200, viewport
  // is 1200 → qualifies. But we need to test the section's center, not
  // the heading. Let's place the section itself off-center.
  input.dom.elements = [
    el({
      tagName: 'section',
      bbox: { x: 0, y: 0, width: 800, height: 600 }, // center at x=400, viewport center 600 — off-center
    }),
  ];
  const r = validate('asymmetry-only', input);
  assert.equal(r.passed, true, r.evidence);
});

test('validate asymmetry-only: FAIL — section centered', () => {
  const input = dom(
    [
      el({
        tagName: 'section',
        bbox: { x: 200, y: 0, width: 800, height: 600 }, // center at x=600 = viewport center
      }),
    ],
    { width: 1200, height: 800 },
  );
  const r = validate('asymmetry-only', input);
  assert.equal(r.passed, false);
});

// ── no-transitions ─────────────────────────────────────────────────────

test('validate no-transitions: PASS — all elements static', () => {
  const input = dom([
    el({}),
    el({ style: { transitionDuration: '0s', animationDuration: '0s' } }),
  ]);
  const r = validate('no-transitions', input);
  assert.equal(r.passed, true, r.evidence);
});

test('validate no-transitions: FAIL — element with transition', () => {
  const input = dom([
    el({ style: { transitionDuration: '300ms' } }),
  ]);
  const r = validate('no-transitions', input);
  assert.equal(r.passed, false);
});

test('validate no-transitions: FAIL — element with animation', () => {
  const input = dom([
    el({ style: { animationDuration: '2s', animationName: 'spin' } }),
  ]);
  const r = validate('no-transitions', input);
  assert.equal(r.passed, false);
});

// ── single-typeface ────────────────────────────────────────────────────

test('validate single-typeface: PASS — all Inter', () => {
  const input = dom([
    el({ text: 'a', style: { fontFamily: 'Inter, sans-serif' } }),
    el({ text: 'b', style: { fontFamily: '"Inter", system-ui' } }),
  ]);
  const r = validate('single-typeface', input);
  assert.equal(r.passed, true, r.evidence);
});

test('validate single-typeface: FAIL — Inter + Playfair', () => {
  const input = dom([
    el({ text: 'a', style: { fontFamily: 'Inter, sans-serif' } }),
    el({ text: 'b', style: { fontFamily: 'Playfair Display, serif' } }),
  ]);
  const r = validate('single-typeface', input);
  assert.equal(r.passed, false);
});

// ── no-center ──────────────────────────────────────────────────────────

test('validate no-center: PASS — all left-aligned', () => {
  const input = dom([
    el({ text: 'hello', style: { textAlign: 'start' } }),
    el({ text: 'world', style: { textAlign: 'left' } }),
  ]);
  const r = validate('no-center', input);
  assert.equal(r.passed, true);
});

test('validate no-center: FAIL — text-align center', () => {
  const input = dom([
    el({ text: 'hi', style: { textAlign: 'center' } }),
  ]);
  const r = validate('no-center', input);
  assert.equal(r.passed, false);
});

test('validate no-center: FAIL — auto margins', () => {
  const input = dom([
    el({ text: 'hi', style: { marginLeft: 'auto', marginRight: 'auto' } }),
  ]);
  const r = validate('no-center', input);
  assert.equal(r.passed, false);
});

// ── Stub validators ────────────────────────────────────────────────────

test('stub validators return graceful passes for unimplemented constraints', () => {
  // Verify a few of the stub-only constraints
  const stubs = [
    'fractured-edges', 'viewport-bleeds', 'monochrome-only', 'no-gradients',
    'all-italic', 'huge-or-tiny', 'broken-grid', 'whitespace-explosion',
    'infinite-loop-mandatory', 'scroll-driven-only', 'staggered-cascade',
    'no-easing',
  ];
  const input = dom([el({})]);
  for (const id of stubs) {
    const r = validate(id, input);
    assert.equal(r.passed, true, `stub ${id} should pass; evidence=${r.evidence}`);
    assert.ok(
      r.evidence.includes('not implemented'),
      `stub ${id} evidence must mention 'not implemented'; got: ${r.evidence}`,
    );
  }
});

// ── validateAll dispatch ───────────────────────────────────────────────

test('validateAll: returns one result per constraint', () => {
  const constraints = [
    { id: 'single-color' },
    { id: 'no-rectangles' },
    { id: 'no-transitions' },
  ];
  const input = dom([el({})]);
  const results = validateAll(constraints, input);
  assert.equal(results.length, 3);
  for (const r of results) {
    assert.ok(typeof r.id === 'string');
    assert.ok(typeof r.passed === 'boolean');
    assert.ok(typeof r.evidence === 'string');
  }
});

test('validate: unknown id returns graceful pass', () => {
  const r = validate('made-up-constraint-id', dom([el({})]));
  assert.equal(r.passed, true);
  assert.ok(r.evidence.includes('unknown'));
});

test('validators registry contains all 40 constraint ids', () => {
  const expected = [
    // form (8)
    'no-rectangles', 'single-shape', 'fractured-edges', 'viewport-bleeds',
    'text-as-shape', 'negative-margin-mandatory', 'clipping-overflow', 'organic-blob',
    // color (8)
    'single-color', 'monochrome-only', 'no-gradients', 'max-3-colors',
    'complementary-only', 'cmyk-only', 'risograph-bleed', 'signal-on-noise',
    // typography (8)
    'single-typeface', 'monospace-headlines', 'all-italic', 'vertical-only',
    'broken-baselines', 'huge-or-tiny', 'display-as-sentence', 'caps-only',
    // layout (8)
    'asymmetry-only', 'broken-grid', 'every-section-breaks-grid', 'no-center',
    'full-bleed-mandatory', 'single-column-strict', 'nested-extreme',
    'whitespace-explosion',
    // motion (8)
    'no-transitions', 'infinite-loop-mandatory', 'scroll-driven-only',
    'paused-by-default', 'gesture-only', 'staggered-cascade', 'reverse-mount',
    'no-easing',
  ];
  for (const id of expected) {
    assert.ok(
      typeof validators[id] === 'function',
      `validator for ${id} should be registered`,
    );
  }
  assert.equal(Object.keys(validators).length, 40);
});
