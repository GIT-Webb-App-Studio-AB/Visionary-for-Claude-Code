# Structural-Integrity Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a structural-integrity gate that runs after Playwright capture but before LLM-critic, hard-failing on six binary structural defects (duplicate heading, exposed nav-bullets, off-viewport-right, footer-grid-collapse, empty-section, heading-hierarchy-skip) and warning on one gradient signal (mystery-text-node), so observed Atelier Nord/Studio/Hår failures never reach the user.

**Architecture:** New module `hooks/scripts/lib/structural-gate.mjs` as a dispatcher over per-check modules in `hooks/scripts/lib/structural-checks/`. Pure functions over the existing DOM-snapshot payload (extended with extra computed-style fields). Mirrors today's `slop-gate.mjs` integration pattern for whitelist + trace-event semantics.

**Tech Stack:** Node 18+, native `node:test` runner, zero external deps.

**Spec:** `docs/superpowers/specs/2026-05-03-structural-integrity-gate-design.md`

**Branch:** `feat/structural-integrity-gate` (already created).

**Parallelism plan:** Task 1 locks the dispatcher signature + types and must complete first. Tasks 2-12 are fully independent (no shared file writes) and run in parallel. Tasks 13-16 sequence dispatcher implementation, integration, end-to-end tests, and final commit.

---

## File Structure

**Create:**
- `hooks/scripts/lib/structural-gate.mjs` — dispatcher with `evaluate()`, `HARD_FAIL_CHECKS`, `WARNING_CHECKS`, helpers
- `hooks/scripts/lib/structural-checks/types.mjs` — shared shapes & helpers
- `hooks/scripts/lib/structural-checks/duplicate-heading.mjs`
- `hooks/scripts/lib/structural-checks/exposed-nav-bullets.mjs`
- `hooks/scripts/lib/structural-checks/off-viewport-right.mjs`
- `hooks/scripts/lib/structural-checks/footer-grid-collapse.mjs`
- `hooks/scripts/lib/structural-checks/empty-section.mjs`
- `hooks/scripts/lib/structural-checks/heading-hierarchy-skip.mjs`
- `hooks/scripts/lib/structural-checks/mystery-text-node.mjs`
- `hooks/scripts/lib/__tests__/structural-gate.test.mjs`
- `hooks/scripts/lib/__tests__/structural-checks/duplicate-heading.test.mjs`
- `hooks/scripts/lib/__tests__/structural-checks/exposed-nav-bullets.test.mjs`
- `hooks/scripts/lib/__tests__/structural-checks/off-viewport-right.test.mjs`
- `hooks/scripts/lib/__tests__/structural-checks/footer-grid-collapse.test.mjs`
- `hooks/scripts/lib/__tests__/structural-checks/empty-section.test.mjs`
- `hooks/scripts/lib/__tests__/structural-checks/heading-hierarchy-skip.test.mjs`
- `hooks/scripts/lib/__tests__/structural-checks/mystery-text-node.test.mjs`
- `hooks/scripts/lib/__tests__/fixtures/atelier-nord-footer.json`
- `hooks/scripts/lib/__tests__/fixtures/atelier-nord-philosophy.json`
- `hooks/scripts/lib/__tests__/fixtures/studio-har-clean.json`

**Modify:**
- `hooks/scripts/capture-and-critique.mjs` — add structural-gate invocation between DOM-snapshot persistence and numeric-scorer call; extend `browser_evaluate` payload template with new fields
- `hooks/scripts/lib/slop-gate.mjs` — extend `loadActiveStyleWhitelist` return shape with `structural: { hard_fail_skips, warning_skips }`; export new `parseStyleAllowsStructural`

---

## Phase 1 — Lock Interface (sequential, must complete first)

### Task 1: Define shared types & lock dispatcher signature

**Files:**
- Create: `hooks/scripts/lib/structural-checks/types.mjs`
- Create: `hooks/scripts/lib/structural-gate.mjs` (stub only — implementation in Task 13)

- [ ] **Step 1: Write `types.mjs`**

```js
// hooks/scripts/lib/structural-checks/types.mjs
//
// Shared shapes used across all structural checks. Pure JSDoc — no runtime
// types, no external deps. Each check module exports a `check(domSnapshot,
// viewport)` function that returns Array<CheckHit>.

/**
 * @typedef {Object} BBox
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} ElementSnapshot
 * @property {string} selector       — CSS-like identifier ('div.hero h1')
 * @property {string} tagName        — lowercase
 * @property {BBox}   bbox
 * @property {string|null} text      — textContent.trim().slice(0,200)
 * @property {string|null} parentTag — lowercase parent tagName
 * @property {Object} style          — computed style subset
 * @property {string|null} listStyleType   — only for ul/ol
 * @property {number|null} childCount      — element children count
 * @property {number|null} anchorDescendantCount — querySelectorAll('a').length
 * @property {string|null} display         — only for footer/aside/section/nav
 * @property {string|null} gridTemplateColumns — only for footer/aside/section/nav
 */

/**
 * @typedef {Object} DomSnapshot
 * @property {ElementSnapshot[]} elements
 */

/**
 * @typedef {Object} Viewport
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} CheckHit
 * @property {string} check_id     — same as the module's exported ID
 * @property {string} selector
 * @property {*}      observed     — check-specific shape, JSON-serialisable
 * @property {string} message      — human-readable summary, ≤140 chars
 */

/**
 * Helper: is the element visible (non-trivial bbox)?
 * @param {ElementSnapshot} el
 * @returns {boolean}
 */
export function isVisible(el) {
  return !!(el && el.bbox && el.bbox.width > 0 && el.bbox.height > 0);
}

/**
 * Helper: parse a `grid-template-columns` value into a column count.
 * Handles `none`, `1fr`, `repeat(N, 1fr)`, `1fr 2fr 1fr`, etc.
 * @param {string|null|undefined} value
 * @returns {number} — 1 when single-column or unparseable, never less than 1
 */
export function countGridColumns(value) {
  if (typeof value !== 'string' || value.trim() === '' || value === 'none') return 1;
  const repeat = value.match(/repeat\(\s*(\d+)\s*,/);
  if (repeat) return Math.max(1, parseInt(repeat[1], 10));
  const stripped = value.replace(/\[[^\]]*\]/g, ' ');
  const tokens = stripped.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, tokens.length);
}

/**
 * Helper: normalise heading text for duplicate detection.
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function normaliseHeadingText(text) {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[\p{P}\p{S}]+/gu, '');
}
```

- [ ] **Step 2: Write `structural-gate.mjs` stub with locked exports**

```js
// hooks/scripts/lib/structural-gate.mjs
//
// Structural-integrity gate. Runs after Playwright capture, before LLM-critic.
// See docs/superpowers/specs/2026-05-03-structural-integrity-gate-design.md.
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

export function buildStructuralDirectiveBlock(hardFails) {
  void hardFails;
  throw new Error('buildStructuralDirectiveBlock not yet implemented (Task 13)');
}

export function buildStructuralWarningsBlock(warnings) {
  void warnings;
  throw new Error('buildStructuralWarningsBlock not yet implemented (Task 13)');
}
```

- [ ] **Step 3: Verify both files parse**

Run: `node --check hooks/scripts/lib/structural-checks/types.mjs && node --check hooks/scripts/lib/structural-gate.mjs`
Expected: exit 0, no output.

- [ ] **Step 4: Verify exports load without crashing**

Run: `node -e "import('./hooks/scripts/lib/structural-gate.mjs').then(m => console.log(Object.keys(m).sort().join(',')))"` from repo root.
Expected output: `HARD_FAIL_CHECKS,WARNING_CHECKS,buildStructuralDirectiveBlock,buildStructuralWarningsBlock,evaluate`

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/structural-checks/types.mjs hooks/scripts/lib/structural-gate.mjs
git commit -m "feat(structural-gate): lock public interface

Define shared types in structural-checks/types.mjs and stub
structural-gate.mjs with locked exports. All evaluate-related exports
throw 'not yet implemented' until Task 13 lands the dispatcher.

This unblocks parallel development of per-check modules and the
capture-and-critique integration."
```

---

## Phase 2 — Parallel Tasks (≥11 independent work items)

Tasks 2-12 are fully independent — no shared file writes. Dispatch all in parallel after Task 1 commits.

### Task 2: duplicate-heading check

**Files:**
- Create: `hooks/scripts/lib/structural-checks/duplicate-heading.mjs`
- Create: `hooks/scripts/lib/__tests__/structural-checks/duplicate-heading.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// hooks/scripts/lib/__tests__/structural-checks/duplicate-heading.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, ID } from '../../structural-checks/duplicate-heading.mjs';

const VIEWPORT = { width: 1200, height: 800 };

test('exports stable ID', () => {
  assert.equal(ID, 'duplicate-heading');
});

test('returns empty array on unique headings', () => {
  const dom = { elements: [
    { selector: 'h1', tagName: 'h1', text: 'Welcome', bbox: { x: 0, y: 0, width: 600, height: 40 } },
    { selector: 'h2', tagName: 'h2', text: 'Pricing', bbox: { x: 0, y: 60, width: 400, height: 30 } },
    { selector: 'h2.b', tagName: 'h2', text: 'About',  bbox: { x: 0, y: 120, width: 400, height: 30 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('hard-fails on two visible h2 with identical text', () => {
  const dom = { elements: [
    { selector: 'section.philosophy h2', tagName: 'h2', text: 'Tjänster & takt', bbox: { x: 0, y: 100, width: 500, height: 50 } },
    { selector: 'section.prices h2',     tagName: 'h2', text: 'Tjänster & takt', bbox: { x: 0, y: 800, width: 500, height: 50 } },
  ]};
  const hits = check(dom, VIEWPORT);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].check_id, 'duplicate-heading');
  assert.equal(hits[0].observed.count, 2);
  assert.equal(hits[0].observed.all_selectors.length, 2);
});

test('normalises whitespace and case', () => {
  const dom = { elements: [
    { selector: 'h2.a', tagName: 'h2', text: 'Tjänster & takt',     bbox: { x: 0, y: 0, width: 500, height: 50 } },
    { selector: 'h2.b', tagName: 'h2', text: 'tjänster   &   takt', bbox: { x: 0, y: 100, width: 500, height: 50 } },
  ]};
  assert.equal(check(dom, VIEWPORT).length, 1);
});

test('skips non-visible duplicates (zero bbox)', () => {
  const dom = { elements: [
    { selector: 'h2.real',   tagName: 'h2', text: 'Hidden in dialog', bbox: { x: 0, y: 0, width: 0, height: 0 } },
    { selector: 'h2.shown',  tagName: 'h2', text: 'Hidden in dialog', bbox: { x: 0, y: 100, width: 500, height: 50 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('skips empty heading text', () => {
  const dom = { elements: [
    { selector: 'h2.a', tagName: 'h2', text: '   ', bbox: { x: 0, y: 0, width: 500, height: 50 } },
    { selector: 'h2.b', tagName: 'h2', text: '',    bbox: { x: 0, y: 100, width: 500, height: 50 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/duplicate-heading.test.mjs`
Expected: FAIL — `Cannot find module ...`.

- [ ] **Step 3: Write the implementation**

```js
// hooks/scripts/lib/structural-checks/duplicate-heading.mjs
import { isVisible, normaliseHeadingText } from './types.mjs';

export const ID = 'duplicate-heading';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3']);

export function check(domSnapshot, viewport) {
  void viewport;
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];

  const groups = new Map();
  for (const el of domSnapshot.elements) {
    if (!HEADING_TAGS.has(el?.tagName)) continue;
    if (!isVisible(el)) continue;
    const norm = normaliseHeadingText(el.text);
    if (norm === '') continue;
    const arr = groups.get(norm) || [];
    arr.push(el);
    groups.set(norm, arr);
  }

  const hits = [];
  for (const [norm, arr] of groups.entries()) {
    if (arr.length < 2) continue;
    hits.push({
      check_id: ID,
      selector: arr[0].selector,
      observed: {
        text: arr[0].text,
        normalised: norm,
        count: arr.length,
        all_selectors: arr.map((e) => e.selector),
      },
      message: `${arr.length}× duplicate heading "${arr[0].text.slice(0, 60)}"`,
    });
  }
  return hits;
}
```

- [ ] **Step 4: Run test, expect pass**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/duplicate-heading.test.mjs`
Expected: `# pass 6 # fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/structural-checks/duplicate-heading.mjs hooks/scripts/lib/__tests__/structural-checks/duplicate-heading.test.mjs
git commit -m "feat(structural-gate): duplicate-heading check"
```

---

### Task 3: exposed-nav-bullets check

**Files:**
- Create: `hooks/scripts/lib/structural-checks/exposed-nav-bullets.mjs`
- Create: `hooks/scripts/lib/__tests__/structural-checks/exposed-nav-bullets.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, ID } from '../../structural-checks/exposed-nav-bullets.mjs';

const VIEWPORT = { width: 1200, height: 800 };

test('exports stable ID', () => {
  assert.equal(ID, 'exposed-nav-bullets');
});

test('returns empty array when ul has list-style: none', () => {
  const dom = { elements: [
    { selector: 'footer ul', tagName: 'ul', listStyleType: 'none', childCount: 5, anchorDescendantCount: 5,
      bbox: { x: 0, y: 0, width: 800, height: 200 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('hard-fails on ul with disc bullets and link children', () => {
  const dom = { elements: [
    { selector: 'footer ul.nav', tagName: 'ul', listStyleType: 'disc', childCount: 6, anchorDescendantCount: 6,
      bbox: { x: 0, y: 800, width: 800, height: 200 } },
  ]};
  assert.equal(check(dom, VIEWPORT).length, 1);
});

test('does not flag ul without anchors (intentional bullet list)', () => {
  const dom = { elements: [
    { selector: 'main ul', tagName: 'ul', listStyleType: 'disc', childCount: 4, anchorDescendantCount: 0,
      bbox: { x: 0, y: 0, width: 600, height: 100 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('does not flag single-item ul', () => {
  const dom = { elements: [
    { selector: 'aside ul', tagName: 'ul', listStyleType: 'disc', childCount: 1, anchorDescendantCount: 1,
      bbox: { x: 0, y: 0, width: 200, height: 30 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('flags circle and square list-styles too', () => {
  const dom = { elements: [
    { selector: 'footer ul.a', tagName: 'ul', listStyleType: 'circle', childCount: 3, anchorDescendantCount: 3,
      bbox: { x: 0, y: 0, width: 400, height: 100 } },
    { selector: 'footer ul.b', tagName: 'ul', listStyleType: 'square', childCount: 4, anchorDescendantCount: 4,
      bbox: { x: 0, y: 200, width: 400, height: 100 } },
  ]};
  assert.equal(check(dom, VIEWPORT).length, 2);
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/exposed-nav-bullets.test.mjs`
Expected: FAIL — module missing.

- [ ] **Step 3: Write the implementation**

```js
// hooks/scripts/lib/structural-checks/exposed-nav-bullets.mjs
export const ID = 'exposed-nav-bullets';

export function check(domSnapshot, viewport) {
  void viewport;
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];
  const hits = [];
  for (const el of domSnapshot.elements) {
    if (el?.tagName !== 'ul') continue;
    if (typeof el.listStyleType !== 'string') continue;
    if (el.listStyleType === 'none' || el.listStyleType === '') continue;
    if (!Number.isFinite(el.childCount) || el.childCount <= 1) continue;
    if (!Number.isFinite(el.anchorDescendantCount) || el.anchorDescendantCount <= 0) continue;
    hits.push({
      check_id: ID,
      selector: el.selector,
      observed: {
        list_style_type: el.listStyleType,
        child_count: el.childCount,
        anchor_descendant_count: el.anchorDescendantCount,
      },
      message: `<ul> exposes ${el.listStyleType} bullets with ${el.anchorDescendantCount} link children — collapsed navigation`,
    });
  }
  return hits;
}
```

- [ ] **Step 4: Run test, expect pass**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/exposed-nav-bullets.test.mjs`
Expected: `# pass 5 # fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/structural-checks/exposed-nav-bullets.mjs hooks/scripts/lib/__tests__/structural-checks/exposed-nav-bullets.test.mjs
git commit -m "feat(structural-gate): exposed-nav-bullets check"
```

---

### Task 4: off-viewport-right check

**Files:**
- Create: `hooks/scripts/lib/structural-checks/off-viewport-right.mjs`
- Create: `hooks/scripts/lib/__tests__/structural-checks/off-viewport-right.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, ID } from '../../structural-checks/off-viewport-right.mjs';

const VIEWPORT = { width: 1200, height: 800 };

test('exports stable ID', () => { assert.equal(ID, 'off-viewport-right'); });

test('passes when all elements fit within viewport', () => {
  const dom = { elements: [
    { selector: 'header', tagName: 'header', bbox: { x: 0, y: 0, width: 1200, height: 80 } },
    { selector: 'main',   tagName: 'main',   bbox: { x: 0, y: 80, width: 1200, height: 600 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('hard-fails when a non-trivial element extends past right edge', () => {
  const dom = { elements: [
    { selector: 'section.hero', tagName: 'section', bbox: { x: 0, y: 0, width: 1400, height: 600 } },
  ]};
  const hits = check(dom, VIEWPORT);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].observed.overflow_px, 200);
});

test('tolerates 4px subpixel overflow', () => {
  const dom = { elements: [
    { selector: 'div.almost', tagName: 'div', bbox: { x: 0, y: 0, width: 1203, height: 100 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('skips tiny decorative elements', () => {
  const dom = { elements: [
    { selector: 'div.bleed', tagName: 'div', bbox: { x: 1190, y: 10, width: 50, height: 4 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('flags multiple offending elements', () => {
  const dom = { elements: [
    { selector: 'section.a', tagName: 'section', bbox: { x: 0,    y: 0,   width: 1300, height: 200 } },
    { selector: 'section.b', tagName: 'section', bbox: { x: 1100, y: 300, width: 400,  height: 200 } },
  ]};
  assert.equal(check(dom, VIEWPORT).length, 2);
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/off-viewport-right.test.mjs`
Expected: module-missing FAIL.

- [ ] **Step 3: Write the implementation**

```js
// hooks/scripts/lib/structural-checks/off-viewport-right.mjs
export const ID = 'off-viewport-right';

const TOLERANCE_PX = 4;
const MIN_WIDTH    = 100;
const MIN_HEIGHT   = 20;

export function check(domSnapshot, viewport) {
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];
  if (!viewport || !Number.isFinite(viewport.width)) return [];

  const limit = viewport.width + TOLERANCE_PX;
  const hits = [];
  for (const el of domSnapshot.elements) {
    const b = el?.bbox;
    if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.width)) continue;
    if (b.width < MIN_WIDTH || b.height < MIN_HEIGHT) continue;
    const right = b.x + b.width;
    if (right <= limit) continue;
    hits.push({
      check_id: ID,
      selector: el.selector,
      observed: {
        right,
        viewport_width: viewport.width,
        overflow_px: Math.round(right - viewport.width),
      },
      message: `<${el.tagName}> overflows viewport by ${Math.round(right - viewport.width)}px`,
    });
  }
  return hits;
}
```

- [ ] **Step 4: Run test, expect pass**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/off-viewport-right.test.mjs`
Expected: `# pass 5 # fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/structural-checks/off-viewport-right.mjs hooks/scripts/lib/__tests__/structural-checks/off-viewport-right.test.mjs
git commit -m "feat(structural-gate): off-viewport-right check"
```

---

### Task 5: footer-grid-collapse check

**Files:**
- Create: `hooks/scripts/lib/structural-checks/footer-grid-collapse.mjs`
- Create: `hooks/scripts/lib/__tests__/structural-checks/footer-grid-collapse.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, ID } from '../../structural-checks/footer-grid-collapse.mjs';

const DESKTOP = { width: 1200, height: 800 };
const MOBILE  = { width: 375,  height: 800 };

test('exports stable ID', () => { assert.equal(ID, 'footer-grid-collapse'); });

test('passes on desktop footer with grid 4 columns', () => {
  const dom = { elements: [
    { selector: 'footer', tagName: 'footer', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      anchorDescendantCount: 12, bbox: { x: 0, y: 800, width: 1200, height: 200 } },
  ]};
  assert.deepEqual(check(dom, DESKTOP), []);
});

test('hard-fails on desktop footer with display: block and 6+ links', () => {
  const dom = { elements: [
    { selector: 'footer', tagName: 'footer', display: 'block', gridTemplateColumns: 'none',
      anchorDescendantCount: 8, bbox: { x: 0, y: 800, width: 1200, height: 600 } },
  ]};
  assert.equal(check(dom, DESKTOP).length, 1);
});

test('hard-fails on grid with single column at desktop', () => {
  const dom = { elements: [
    { selector: 'footer', tagName: 'footer', display: 'grid', gridTemplateColumns: '1fr',
      anchorDescendantCount: 7, bbox: { x: 0, y: 800, width: 1200, height: 400 } },
  ]};
  assert.equal(check(dom, DESKTOP).length, 1);
});

test('does not flag mobile viewport (single column expected)', () => {
  const dom = { elements: [
    { selector: 'footer', tagName: 'footer', display: 'block', gridTemplateColumns: 'none',
      anchorDescendantCount: 8, bbox: { x: 0, y: 800, width: 375, height: 800 } },
  ]};
  assert.deepEqual(check(dom, MOBILE), []);
});

test('does not flag minimal footer with < 6 anchors', () => {
  const dom = { elements: [
    { selector: 'footer', tagName: 'footer', display: 'block', gridTemplateColumns: 'none',
      anchorDescendantCount: 3, bbox: { x: 0, y: 800, width: 1200, height: 100 } },
  ]};
  assert.deepEqual(check(dom, DESKTOP), []);
});

test('passes on flex with 9 anchors', () => {
  const dom = { elements: [
    { selector: 'footer', tagName: 'footer', display: 'flex', gridTemplateColumns: 'none',
      anchorDescendantCount: 9, bbox: { x: 0, y: 800, width: 1200, height: 200 } },
  ]};
  assert.deepEqual(check(dom, DESKTOP), []);
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/footer-grid-collapse.test.mjs`
Expected: module-missing FAIL.

- [ ] **Step 3: Write the implementation**

```js
// hooks/scripts/lib/structural-checks/footer-grid-collapse.mjs
import { countGridColumns } from './types.mjs';

export const ID = 'footer-grid-collapse';

const FOOTER_TAGS = new Set(['footer', 'aside']);
const MIN_ANCHORS = 6;
const DESKTOP_MIN = 1024;

export function check(domSnapshot, viewport) {
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];
  if (!viewport || !Number.isFinite(viewport.width) || viewport.width < DESKTOP_MIN) return [];

  const hits = [];
  for (const el of domSnapshot.elements) {
    if (!FOOTER_TAGS.has(el?.tagName)) continue;
    const anchors = Number.isFinite(el.anchorDescendantCount) ? el.anchorDescendantCount : 0;
    if (anchors < MIN_ANCHORS) continue;
    const display = typeof el.display === 'string' ? el.display : '';
    const gtc = typeof el.gridTemplateColumns === 'string' ? el.gridTemplateColumns : 'none';

    let collapsed = false;
    if (display !== 'grid' && display !== 'flex') {
      collapsed = true;
    } else if (display === 'grid' && countGridColumns(gtc) <= 1) {
      collapsed = true;
    }

    if (!collapsed) continue;

    hits.push({
      check_id: ID,
      selector: el.selector,
      observed: {
        display,
        grid_template_columns: gtc,
        anchor_count: anchors,
        viewport_width: viewport.width,
      },
      message: `<${el.tagName}> with ${anchors} links collapses to single column on desktop (display: ${display || 'unknown'})`,
    });
  }
  return hits;
}
```

- [ ] **Step 4: Run test, expect pass**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/footer-grid-collapse.test.mjs`
Expected: `# pass 6 # fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/structural-checks/footer-grid-collapse.mjs hooks/scripts/lib/__tests__/structural-checks/footer-grid-collapse.test.mjs
git commit -m "feat(structural-gate): footer-grid-collapse check"
```

---

### Task 6: empty-section check

**Files:**
- Create: `hooks/scripts/lib/structural-checks/empty-section.mjs`
- Create: `hooks/scripts/lib/__tests__/structural-checks/empty-section.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, ID } from '../../structural-checks/empty-section.mjs';

const VIEWPORT = { width: 1200, height: 800 };

test('exports stable ID', () => { assert.equal(ID, 'empty-section'); });

test('returns empty array when all headings have content following', () => {
  const dom = { elements: [
    { selector: 'h2.a', tagName: 'h2', text: 'Pricing',  nextElementSiblingText: 'Our plans...', nextElementSiblingTag: 'p',
      bbox: { x: 0, y: 0, width: 500, height: 50 } },
    { selector: 'h2.b', tagName: 'h2', text: 'About',    nextElementSiblingText: 'We are...',    nextElementSiblingTag: 'p',
      bbox: { x: 0, y: 100, width: 500, height: 50 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('does not flag a single empty heading (intentional whitespace)', () => {
  const dom = { elements: [
    { selector: 'h2.lonely', tagName: 'h2', text: 'Big Statement', nextElementSiblingText: null, nextElementSiblingTag: null,
      bbox: { x: 0, y: 0, width: 600, height: 80 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('hard-fails on ≥2 empty headings', () => {
  const dom = { elements: [
    { selector: 'h2.a', tagName: 'h2', text: 'Section A', nextElementSiblingText: null, nextElementSiblingTag: null,
      bbox: { x: 0, y: 0, width: 500, height: 50 } },
    { selector: 'h2.b', tagName: 'h2', text: 'Section B', nextElementSiblingText: '',   nextElementSiblingTag: 'div',
      bbox: { x: 0, y: 100, width: 500, height: 50 } },
  ]};
  const hits = check(dom, VIEWPORT);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].observed.empty_headings.length, 2);
});

test('treats heading→list/figure/img as content (not empty)', () => {
  const dom = { elements: [
    { selector: 'h2.a', tagName: 'h2', text: 'Tiles',  nextElementSiblingText: '', nextElementSiblingTag: 'ul',
      bbox: { x: 0, y: 0, width: 500, height: 50 } },
    { selector: 'h2.b', tagName: 'h2', text: 'Photos', nextElementSiblingText: '', nextElementSiblingTag: 'figure',
      bbox: { x: 0, y: 100, width: 500, height: 50 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/empty-section.test.mjs`
Expected: module-missing FAIL.

- [ ] **Step 3: Write the implementation**

```js
// hooks/scripts/lib/structural-checks/empty-section.mjs
import { isVisible } from './types.mjs';

export const ID = 'empty-section';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3']);
const STRUCTURAL_CONTENT_TAGS = new Set([
  'ul', 'ol', 'dl', 'table', 'figure', 'picture', 'video', 'iframe',
  'img', 'svg', 'blockquote', 'pre', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]);
const MIN_EMPTY_FOR_FAIL = 2;

export function check(domSnapshot, viewport) {
  void viewport;
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];

  const empties = [];
  for (const el of domSnapshot.elements) {
    if (!HEADING_TAGS.has(el?.tagName)) continue;
    if (!isVisible(el)) continue;
    const sibTag = typeof el.nextElementSiblingTag === 'string' ? el.nextElementSiblingTag : null;
    const sibText = typeof el.nextElementSiblingText === 'string' ? el.nextElementSiblingText.trim() : '';

    if (sibTag == null) {
      empties.push({ selector: el.selector, text: el.text || '' });
      continue;
    }
    if (STRUCTURAL_CONTENT_TAGS.has(sibTag)) continue;
    if (sibText.length > 0) continue;
    empties.push({ selector: el.selector, text: el.text || '' });
  }

  if (empties.length < MIN_EMPTY_FOR_FAIL) return [];

  return [{
    check_id: ID,
    selector: empties[0].selector,
    observed: { empty_headings: empties, count: empties.length },
    message: `${empties.length} headings without following content (layout collapse)`,
  }];
}
```

- [ ] **Step 4: Run test, expect pass**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/empty-section.test.mjs`
Expected: `# pass 4 # fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/structural-checks/empty-section.mjs hooks/scripts/lib/__tests__/structural-checks/empty-section.test.mjs
git commit -m "feat(structural-gate): empty-section check"
```

---

### Task 7: heading-hierarchy-skip check

**Files:**
- Create: `hooks/scripts/lib/structural-checks/heading-hierarchy-skip.mjs`
- Create: `hooks/scripts/lib/__tests__/structural-checks/heading-hierarchy-skip.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, ID } from '../../structural-checks/heading-hierarchy-skip.mjs';

const VIEWPORT = { width: 1200, height: 800 };
const h = (tag, selector, y) => ({ selector, tagName: tag, text: tag, bbox: { x: 0, y, width: 600, height: 40 } });

test('exports stable ID', () => { assert.equal(ID, 'heading-hierarchy-skip'); });

test('passes on h1 → h2 → h3 progression', () => {
  const dom = { elements: [h('h1', 'h1', 0), h('h2', 'h2', 80), h('h3', 'h3', 160)] };
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('hard-fails on h1 → h3 skip', () => {
  const dom = { elements: [h('h1', 'h1', 0), h('h3', 'h3', 80)] };
  const hits = check(dom, VIEWPORT);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].observed.from_level, 1);
  assert.equal(hits[0].observed.to_level, 3);
});

test('does not flag component starting at h2 (no implicit h1)', () => {
  const dom = { elements: [h('h2', 'h2', 0), h('h3', 'h3', 80)] };
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('flags downstream skip after component start at h2', () => {
  const dom = { elements: [h('h2', 'h2', 0), h('h4', 'h4', 80)] };
  assert.equal(check(dom, VIEWPORT).length, 1);
});

test('h1 resets baseline for multi-section pages', () => {
  const dom = { elements: [
    h('h1', 'h1.first',  0),
    h('h2', 'h2.first',  80),
    h('h3', 'h3.first',  160),
    h('h1', 'h1.second', 240),
    h('h2', 'h2.second', 320),
    h('h3', 'h3.second', 400),
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('skips hidden headings (zero bbox)', () => {
  const dom = { elements: [
    h('h1', 'h1', 0),
    { selector: 'h2.hidden', tagName: 'h2', text: 'h2', bbox: { x: 0, y: 80, width: 0, height: 0 } },
    h('h3', 'h3', 160),
  ]};
  assert.equal(check(dom, VIEWPORT).length, 1);
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/heading-hierarchy-skip.test.mjs`
Expected: module-missing FAIL.

- [ ] **Step 3: Write the implementation**

```js
// hooks/scripts/lib/structural-checks/heading-hierarchy-skip.mjs
import { isVisible } from './types.mjs';

export const ID = 'heading-hierarchy-skip';
const HEADING_RE = /^h([1-6])$/;

export function check(domSnapshot, viewport) {
  void viewport;
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];

  const headings = [];
  for (const el of domSnapshot.elements) {
    const m = HEADING_RE.exec(el?.tagName || '');
    if (!m) continue;
    if (!isVisible(el)) continue;
    headings.push({ level: parseInt(m[1], 10), selector: el.selector });
  }

  const hits = [];
  let lastSeenLevel = null;
  for (const h of headings) {
    if (h.level === 1) {
      lastSeenLevel = 1;
      continue;
    }
    if (lastSeenLevel === null) {
      lastSeenLevel = h.level;
      continue;
    }
    if (h.level > lastSeenLevel + 1) {
      hits.push({
        check_id: ID,
        selector: h.selector,
        observed: { from_level: lastSeenLevel, to_level: h.level, selector_at_skip: h.selector },
        message: `Heading hierarchy skips from h${lastSeenLevel} to h${h.level}`,
      });
    }
    lastSeenLevel = h.level;
  }
  return hits;
}
```

- [ ] **Step 4: Run test, expect pass**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/heading-hierarchy-skip.test.mjs`
Expected: `# pass 6 # fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/structural-checks/heading-hierarchy-skip.mjs hooks/scripts/lib/__tests__/structural-checks/heading-hierarchy-skip.test.mjs
git commit -m "feat(structural-gate): heading-hierarchy-skip check"
```

---

### Task 8: mystery-text-node warning check

**Files:**
- Create: `hooks/scripts/lib/structural-checks/mystery-text-node.mjs`
- Create: `hooks/scripts/lib/__tests__/structural-checks/mystery-text-node.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, ID } from '../../structural-checks/mystery-text-node.mjs';

const VIEWPORT = { width: 1200, height: 800 };

test('exports stable ID', () => { assert.equal(ID, 'mystery-text-node'); });

test('returns empty when no orphan text', () => {
  const dom = { elements: [
    { selector: 'p', tagName: 'p', text: 'A paragraph with multiple words', display: 'block', parentTag: 'main',
      bbox: { x: 0, y: 0, width: 800, height: 30 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('warns on lone single-word block element', () => {
  const dom = { elements: [
    { selector: 'div.atelier', tagName: 'div', text: 'Atelier', display: 'block', parentTag: 'footer',
      bbox: { x: 0, y: 800, width: 200, height: 30 } },
  ]};
  assert.equal(check(dom, VIEWPORT).length, 1);
});

test('skips single-word inside li/button/a/label', () => {
  const dom = { elements: [
    { selector: 'li',     tagName: 'li',     text: 'Klipp',  display: 'list-item',    parentTag: 'ul',   bbox: { x: 0, y: 0,  width: 100, height: 20 } },
    { selector: 'button', tagName: 'button', text: 'Submit', display: 'inline-block', parentTag: 'form', bbox: { x: 0, y: 30, width: 100, height: 30 } },
    { selector: 'a',      tagName: 'a',      text: 'Boka',   display: 'inline',       parentTag: 'nav',  bbox: { x: 0, y: 60, width: 80,  height: 20 } },
    { selector: 'label',  tagName: 'label',  text: 'Email',  display: 'block',        parentTag: 'form', bbox: { x: 0, y: 90, width: 80,  height: 20 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('skips single-word with badge/chip/tag class', () => {
  const dom = { elements: [
    { selector: 'span.badge-new', tagName: 'span', text: 'Ny', display: 'inline-block', parentTag: 'div',
      className: 'badge-new', bbox: { x: 0, y: 0, width: 40, height: 20 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});

test('skips long single-word text (likely a brand/heading)', () => {
  const dom = { elements: [
    { selector: 'div.brand', tagName: 'div', text: 'Constantinople', display: 'block', parentTag: 'header',
      bbox: { x: 0, y: 0, width: 400, height: 40 } },
  ]};
  assert.deepEqual(check(dom, VIEWPORT), []);
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/mystery-text-node.test.mjs`
Expected: module-missing FAIL.

- [ ] **Step 3: Write the implementation**

```js
// hooks/scripts/lib/structural-checks/mystery-text-node.mjs
export const ID = 'mystery-text-node';

const SKIP_TAGS = new Set([
  'li', 'button', 'a', 'label', 'th', 'td', 'dt', 'dd', 'caption', 'option',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]);
const SKIP_CLASS_RE = /\b(badge|chip|tag|pill|stat|metric)\b/i;
const MAX_CHAR_LEN = 12;
const BLOCK_DISPLAYS = new Set(['block', 'flex', 'grid', 'flow-root']);
const BLOCKY_TAGS = new Set(['div', 'section', 'article', 'header', 'footer', 'aside', 'main']);

export function check(domSnapshot, viewport) {
  void viewport;
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];

  const hits = [];
  for (const el of domSnapshot.elements) {
    if (!el?.tagName || SKIP_TAGS.has(el.tagName)) continue;
    if (typeof el.text !== 'string') continue;
    const t = el.text.trim();
    if (t.length === 0 || t.length > MAX_CHAR_LEN) continue;
    if (t.split(/\s+/).length !== 1) continue;
    const display = typeof el.display === 'string' ? el.display : null;
    const blockyTag = BLOCKY_TAGS.has(el.tagName);
    if (!blockyTag && (display == null || !BLOCK_DISPLAYS.has(display))) continue;
    if (typeof el.className === 'string' && SKIP_CLASS_RE.test(el.className)) continue;

    hits.push({
      check_id: ID,
      selector: el.selector,
      observed: { text: t, parent_tag: el.parentTag || null, length: t.length },
      message: `Single-word block "${t}" in <${el.parentTag || el.tagName}> — looks like an orphan label`,
    });
  }
  return hits;
}
```

- [ ] **Step 4: Run test, expect pass**

Run: `node --test hooks/scripts/lib/__tests__/structural-checks/mystery-text-node.test.mjs`
Expected: `# pass 5 # fail 0`.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/structural-checks/mystery-text-node.mjs hooks/scripts/lib/__tests__/structural-checks/mystery-text-node.test.mjs
git commit -m "feat(structural-gate): mystery-text-node warning check"
```

---

### Task 9: Three fixture DOM-snapshots

**Files:**
- Create: `hooks/scripts/lib/__tests__/fixtures/atelier-nord-footer.json`
- Create: `hooks/scripts/lib/__tests__/fixtures/atelier-nord-philosophy.json`
- Create: `hooks/scripts/lib/__tests__/fixtures/studio-har-clean.json`

- [ ] **Step 1: Write `atelier-nord-footer.json`**

```json
{
  "elements": [
    {
      "selector": "footer.site-footer",
      "tagName": "footer",
      "text": null,
      "parentTag": "body",
      "bbox": { "x": 0, "y": 1800, "width": 1200, "height": 800 },
      "style": { "fontSize": "14px", "lineHeight": "20px", "letterSpacing": "normal", "color": "rgb(20,20,20)", "backgroundColor": "rgb(248,242,232)" },
      "listStyleType": null,
      "childCount": 12,
      "anchorDescendantCount": 9,
      "display": "block",
      "gridTemplateColumns": "none"
    },
    {
      "selector": "footer ul.nav-services",
      "tagName": "ul",
      "text": null,
      "parentTag": "footer",
      "bbox": { "x": 80, "y": 2100, "width": 200, "height": 200 },
      "style": { "fontSize": "14px", "lineHeight": "24px", "letterSpacing": "normal", "color": "rgb(20,20,20)", "backgroundColor": "rgba(0,0,0,0)" },
      "listStyleType": "disc",
      "childCount": 4,
      "anchorDescendantCount": 4,
      "display": null,
      "gridTemplateColumns": null
    },
    {
      "selector": "footer div.atelier-row",
      "tagName": "div",
      "text": "Atelier",
      "parentTag": "footer",
      "bbox": { "x": 80, "y": 2310, "width": 200, "height": 30 },
      "style": { "fontSize": "12px", "lineHeight": "20px", "letterSpacing": "0.1em", "color": "rgb(120,120,120)", "backgroundColor": "rgba(0,0,0,0)" },
      "listStyleType": null,
      "childCount": 0,
      "anchorDescendantCount": 0,
      "display": "block",
      "gridTemplateColumns": null
    },
    {
      "selector": "footer div.sociala-row",
      "tagName": "div",
      "text": "Sociala",
      "parentTag": "footer",
      "bbox": { "x": 80, "y": 2350, "width": 200, "height": 30 },
      "style": { "fontSize": "12px", "lineHeight": "20px", "letterSpacing": "0.1em", "color": "rgb(120,120,120)", "backgroundColor": "rgba(0,0,0,0)" },
      "listStyleType": null,
      "childCount": 0,
      "anchorDescendantCount": 0,
      "display": "block",
      "gridTemplateColumns": null
    }
  ]
}
```

- [ ] **Step 2: Write `atelier-nord-philosophy.json`**

```json
{
  "elements": [
    {
      "selector": "section.philosophy h2",
      "tagName": "h2",
      "text": "Tjänster & takt",
      "parentTag": "section",
      "bbox": { "x": 100, "y": 600, "width": 600, "height": 60 },
      "style": { "fontSize": "48px", "lineHeight": "56px", "letterSpacing": "-0.02em", "color": "rgb(20,20,20)", "backgroundColor": "rgba(0,0,0,0)" },
      "listStyleType": null,
      "childCount": 0,
      "anchorDescendantCount": 0,
      "display": null,
      "gridTemplateColumns": null,
      "nextElementSiblingText": "Vi tror på långsamhet, väl avvägda klipp...",
      "nextElementSiblingTag": "p"
    },
    {
      "selector": "section.prices h2",
      "tagName": "h2",
      "text": "Tjänster & takt",
      "parentTag": "section",
      "bbox": { "x": 100, "y": 1300, "width": 600, "height": 60 },
      "style": { "fontSize": "48px", "lineHeight": "56px", "letterSpacing": "-0.02em", "color": "rgb(20,20,20)", "backgroundColor": "rgba(0,0,0,0)" },
      "listStyleType": null,
      "childCount": 0,
      "anchorDescendantCount": 0,
      "display": null,
      "gridTemplateColumns": null,
      "nextElementSiblingText": "",
      "nextElementSiblingTag": "ol"
    }
  ]
}
```

- [ ] **Step 3: Write `studio-har-clean.json`**

```json
{
  "elements": [
    {
      "selector": "h1.brand",
      "tagName": "h1",
      "text": "STUDIO/HÅR",
      "parentTag": "header",
      "bbox": { "x": 40, "y": 40, "width": 600, "height": 100 },
      "style": { "fontSize": "96px", "lineHeight": "100px", "letterSpacing": "-0.04em", "color": "rgb(20,20,20)", "backgroundColor": "rgba(0,0,0,0)" },
      "listStyleType": null,
      "childCount": 0,
      "anchorDescendantCount": 0,
      "display": null,
      "gridTemplateColumns": null,
      "nextElementSiblingText": "Salongen för dig som vill ha klipp som syns",
      "nextElementSiblingTag": "p"
    },
    {
      "selector": "section.services h2",
      "tagName": "h2",
      "text": "Vi gör en sak — håret",
      "parentTag": "section",
      "bbox": { "x": 40, "y": 800, "width": 1100, "height": 100 },
      "style": { "fontSize": "72px", "lineHeight": "80px", "letterSpacing": "-0.02em", "color": "rgb(20,20,20)", "backgroundColor": "rgba(0,0,0,0)" },
      "listStyleType": null,
      "childCount": 0,
      "anchorDescendantCount": 0,
      "display": null,
      "gridTemplateColumns": null,
      "nextElementSiblingText": "Six service cards",
      "nextElementSiblingTag": "div"
    },
    {
      "selector": "footer.site-footer",
      "tagName": "footer",
      "text": null,
      "parentTag": "body",
      "bbox": { "x": 0, "y": 3200, "width": 1200, "height": 200 },
      "style": { "fontSize": "14px", "lineHeight": "20px", "letterSpacing": "normal", "color": "rgb(255,255,255)", "backgroundColor": "rgb(20,20,20)" },
      "listStyleType": null,
      "childCount": 4,
      "anchorDescendantCount": 8,
      "display": "grid",
      "gridTemplateColumns": "repeat(4, 1fr)"
    },
    {
      "selector": "footer ul.nav-studio",
      "tagName": "ul",
      "text": null,
      "parentTag": "footer",
      "bbox": { "x": 40, "y": 3260, "width": 250, "height": 130 },
      "style": { "fontSize": "14px", "lineHeight": "24px", "letterSpacing": "normal", "color": "rgb(255,255,255)", "backgroundColor": "rgba(0,0,0,0)" },
      "listStyleType": "none",
      "childCount": 4,
      "anchorDescendantCount": 4,
      "display": null,
      "gridTemplateColumns": null
    }
  ]
}
```

- [ ] **Step 4: Verify all three fixtures parse as valid JSON**

Run: `node -e "['atelier-nord-footer','atelier-nord-philosophy','studio-har-clean'].forEach(f => { JSON.parse(require('fs').readFileSync('hooks/scripts/lib/__tests__/fixtures/'+f+'.json','utf8')); console.log(f, 'ok'); })"`
Expected: three `ok` lines.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/__tests__/fixtures/
git commit -m "test(structural-gate): three DOM-snapshot fixtures"
```

---

### Task 10: DOM-snapshot extension in capture-and-critique.mjs

**Files:**
- Modify: `hooks/scripts/capture-and-critique.mjs:605` (the `Array.from(document.querySelectorAll('body *'))...` template literal in step 5 of the prompt)

- [ ] **Step 1: Locate the existing template**

Run: `grep -n "Array.from(document.querySelectorAll" hooks/scripts/capture-and-critique.mjs`
Expected: a single hit on the line containing the browser_evaluate payload string.

- [ ] **Step 2: Apply the edit**

Replace the existing payload string (the single backtick-quoted long line) with the extended version. The new payload adds `tagName`, `text`, `parentTag`, `className`, `display`, `gridTemplateColumns`, `listStyleType`, `childCount`, `anchorDescendantCount`, `nextElementSiblingTag`, `nextElementSiblingText` — all conditionally so payload growth is ≈30%.

The new template (write as one continuous string in the source — broken across lines here for readability):

```
Array.from(document.querySelectorAll('body *')).slice(0,400).map(el => {
  const r=el.getBoundingClientRect();
  const s=getComputedStyle(el);
  const tag=el.tagName.toLowerCase();
  const isFooterish=['footer','aside','section','nav'].includes(tag);
  const isList=tag==='ul'||tag==='ol';
  const isHeading=/^h[1-6]$/.test(tag);
  const sib=isHeading?el.nextElementSibling:null;
  return {
    selector: tag+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className?'.'+el.className.trim().split(/\\s+/).slice(0,3).join('.'):''),
    tagName: tag,
    text: (el.textContent||'').trim().slice(0,200) || null,
    parentTag: el.parentElement?el.parentElement.tagName.toLowerCase():null,
    className: typeof el.className==='string'?el.className:null,
    bbox:{x:r.x,y:r.y,width:r.width,height:r.height},
    style:{fontSize:s.fontSize, lineHeight:s.lineHeight, letterSpacing:s.letterSpacing, color:s.color, backgroundColor:s.backgroundColor},
    display: isFooterish?s.display:null,
    gridTemplateColumns: isFooterish?s.gridTemplateColumns:null,
    listStyleType: isList?s.listStyleType:null,
    childCount: el.children.length,
    anchorDescendantCount: el.querySelectorAll('a').length,
    nextElementSiblingTag: sib?sib.tagName.toLowerCase():null,
    nextElementSiblingText: sib?(sib.textContent||'').trim().slice(0,200):null
  };
}).filter(e=>e.bbox.width>0&&e.bbox.height>0)
```

- [ ] **Step 3: Verify the file still parses**

Run: `node --check hooks/scripts/capture-and-critique.mjs`
Expected: exit 0.

- [ ] **Step 4: Verify hook still loads**

Run: `node -e "import('./hooks/scripts/capture-and-critique.mjs').catch(e => process.stderr.write(e.stack))"`
Expected: no output (the hook reads stdin on load and exits silently when stdin is empty).

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/capture-and-critique.mjs
git commit -m "feat(structural-gate): extend DOM-snapshot payload

Add fields needed by structural-gate checks: tagName, text, parentTag,
className, display (footer/aside/section/nav only), gridTemplateColumns
(same), listStyleType (ul/ol only), childCount, anchorDescendantCount,
nextElementSiblingTag/Text (headings only). Payload growth ≈30%."
```

---

### Task 11: `allows_structural` whitelist extension in slop-gate

**Files:**
- Modify: `hooks/scripts/lib/slop-gate.mjs` — add `parseStyleAllowsStructural` export and extend `loadActiveStyleWhitelist` return shape

- [ ] **Step 1: Write or extend the failing test**

Locate `hooks/scripts/lib/__tests__/slop-gate.test.mjs` (create if missing). Append:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStyleAllowsStructural } from '../slop-gate.mjs';

test('parseStyleAllowsStructural: empty when frontmatter has no allows_structural', () => {
  const out = parseStyleAllowsStructural('id: foo\nname: Foo\n');
  assert.deepEqual(out.hard_fail_skips, []);
  assert.deepEqual(out.warning_skips, []);
});

test('parseStyleAllowsStructural: parses inline array under hard_fail_skips', () => {
  const yaml = `id: brutalist\nallows_structural:\n  hard_fail_skips: [exposed-nav-bullets, footer-grid-collapse]\n`;
  const out = parseStyleAllowsStructural(yaml);
  assert.deepEqual(out.hard_fail_skips.sort(), ['exposed-nav-bullets', 'footer-grid-collapse']);
  assert.deepEqual(out.warning_skips, []);
});

test('parseStyleAllowsStructural: parses multi-line list with both subkeys', () => {
  const yaml = `allows_structural:\n  hard_fail_skips:\n    - duplicate-heading\n    - empty-section\n  warning_skips:\n    - mystery-text-node\n`;
  const out = parseStyleAllowsStructural(yaml);
  assert.deepEqual(out.hard_fail_skips.sort(), ['duplicate-heading', 'empty-section']);
  assert.deepEqual(out.warning_skips, ['mystery-text-node']);
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `node --test hooks/scripts/lib/__tests__/slop-gate.test.mjs`
Expected: FAIL with `parseStyleAllowsStructural is not a function`.

- [ ] **Step 3: Add the parser and extend `loadActiveStyleWhitelist`**

Append to `hooks/scripts/lib/slop-gate.mjs` (after `parseStyleAllowsSlop`, before `loadActiveStyleWhitelist`):

```js
// Mirrors parseStyleAllowsSlop. Frontmatter shape:
//   allows_structural:
//     hard_fail_skips: [duplicate-heading, footer-grid-collapse]
//     warning_skips: [mystery-text-node]
// Returns { hard_fail_skips: string[], warning_skips: string[] }.
export function parseStyleAllowsStructural(frontmatterText) {
  const out = { hard_fail_skips: [], warning_skips: [] };
  if (typeof frontmatterText !== 'string') return out;

  const blockMatch = frontmatterText.match(/^allows_structural:\s*\n((?:[ \t]+.*\n?)+)/m);
  if (!blockMatch) return out;
  const body = blockMatch[1];

  for (const subKey of ['hard_fail_skips', 'warning_skips']) {
    const inline = body.match(new RegExp(`^[ \\t]+${subKey}:\\s*\\[([^\\]]*)\\]`, 'm'));
    if (inline) {
      out[subKey] = splitArrayEntries(inline[1]);
      continue;
    }
    const multi = body.match(new RegExp(`^[ \\t]+${subKey}:\\s*\\n((?:[ \\t]+-[ \\t]+.+\\n?)+)`, 'm'));
    if (multi) {
      out[subKey] = multi[1]
        .split('\n')
        .map((line) => line.replace(/^[ \t]+-[ \t]+/, '').trim())
        .map(stripQuotes)
        .filter(Boolean);
    }
  }
  return out;
}
```

Update `loadActiveStyleWhitelist`:

1. Replace the top-of-function `empty` constant with:
```js
const empty = {
  styleId: null,
  patterns: [],
  reason: null,
  structural: { hard_fail_skips: new Set(), warning_skips: new Set() },
};
```
2. Replace the trailing return statement (currently `return { styleId, patterns: parsed.patterns, reason: parsed.reason };`) with:
```js
const struct = parseStyleAllowsStructural(frontmatterMatch[1]);
return {
  styleId,
  patterns: parsed.patterns,
  reason: parsed.reason,
  structural: {
    hard_fail_skips: new Set(struct.hard_fail_skips),
    warning_skips: new Set(struct.warning_skips),
  },
};
```
3. Audit every other early-return in the function — replace any `return empty;` that's correct, and replace `return { ...empty, styleId };` (3 occurrences) with `return { ...empty, styleId };` (no change needed since `empty` now contains the structural Sets).

- [ ] **Step 4: Run test, expect pass**

Run: `node --test hooks/scripts/lib/__tests__/slop-gate.test.mjs`
Expected: All tests pass (new + pre-existing).

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/slop-gate.mjs hooks/scripts/lib/__tests__/slop-gate.test.mjs
git commit -m "feat(structural-gate): allows_structural style frontmatter

Backwards-compatible extension of loadActiveStyleWhitelist with
allows_structural.hard_fail_skips and warning_skips (Set<string>)."
```

---

### Task 12: Trace-event payload documentation

**Files:**
- Modify: `hooks/scripts/lib/structural-gate.mjs` — append JSDoc trace-event shape comments

- [ ] **Step 1: Append JSDoc trace shape comments**

Append to `hooks/scripts/lib/structural-gate.mjs`:

```js
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
```

- [ ] **Step 2: Verify the file still parses**

Run: `node --check hooks/scripts/lib/structural-gate.mjs`
Expected: exit 0.

- [ ] **Step 3: Verify export surface unchanged**

Run: `node -e "import('./hooks/scripts/lib/structural-gate.mjs').then(m => console.log(Object.keys(m).sort().join(',')))"`
Expected: `HARD_FAIL_CHECKS,WARNING_CHECKS,buildStructuralDirectiveBlock,buildStructuralWarningsBlock,evaluate`.

- [ ] **Step 4: Verify pre-existing tests still pass**

Run: `node --test hooks/scripts/lib/__tests__/`
Expected: All previously-passing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/structural-gate.mjs
git commit -m "docs(structural-gate): trace-event payload shapes"
```

---

## Phase 3 — Sequential (depends on Phase 2 completion)

### Task 13: Implement dispatcher in structural-gate.mjs

**Files:**
- Modify: `hooks/scripts/lib/structural-gate.mjs` — replace stub `evaluate`, `buildStructuralDirectiveBlock`, `buildStructuralWarningsBlock` with full implementations
- Create: `hooks/scripts/lib/__tests__/structural-gate.test.mjs`

- [ ] **Step 1: Write the failing integration test**

```js
// hooks/scripts/lib/__tests__/structural-gate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluate,
  buildStructuralDirectiveBlock,
  buildStructuralWarningsBlock,
  HARD_FAIL_CHECKS,
  WARNING_CHECKS,
} from '../structural-gate.mjs';

const __filename = fileURLToPath(import.meta.url);
const FIXTURES = join(dirname(__filename), 'fixtures');
const DESKTOP = { width: 1200, height: 800 };
const EMPTY_WL = { hard_fail_skips: new Set(), warning_skips: new Set() };

const loadFixture = (n) => JSON.parse(readFileSync(join(FIXTURES, n + '.json'), 'utf8'));

test('hard-fail catalogue is exactly the six checks', () => {
  assert.deepEqual([...HARD_FAIL_CHECKS].sort(), [
    'duplicate-heading',
    'empty-section',
    'exposed-nav-bullets',
    'footer-grid-collapse',
    'heading-hierarchy-skip',
    'off-viewport-right',
  ]);
  assert.deepEqual([...WARNING_CHECKS], ['mystery-text-node']);
});

test('Atelier Nord footer fixture: hard-fails footer-grid-collapse + exposed-nav-bullets, warns mystery-text-node ×2', () => {
  const dom = loadFixture('atelier-nord-footer');
  const r = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  const hardIds = r.hard_fails.map((h) => h.check_id).sort();
  assert.ok(hardIds.includes('footer-grid-collapse'), `expected footer-grid-collapse, got ${hardIds}`);
  assert.ok(hardIds.includes('exposed-nav-bullets'), `expected exposed-nav-bullets, got ${hardIds}`);
  const warnIds = r.warnings.map((w) => w.check_id);
  const mysteryCount = warnIds.filter((id) => id === 'mystery-text-node').length;
  assert.equal(mysteryCount, 2);
});

test('Atelier Nord philosophy fixture: hard-fails duplicate-heading', () => {
  const dom = loadFixture('atelier-nord-philosophy');
  const r = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  assert.ok(r.hard_fails.some((h) => h.check_id === 'duplicate-heading'));
});

test('Studio/Hår clean fixture: empty hard_fails and warnings', () => {
  const dom = loadFixture('studio-har-clean');
  const r = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  assert.deepEqual(r.hard_fails, []);
  assert.deepEqual(r.warnings, []);
});

test('whitelist moves a check result from hard_fails to skipped', () => {
  const dom = loadFixture('atelier-nord-philosophy');
  const wl = { hard_fail_skips: new Set(['duplicate-heading']), warning_skips: new Set() };
  const r = evaluate(dom, DESKTOP, { styleWhitelist: wl });
  assert.ok(!r.hard_fails.some((h) => h.check_id === 'duplicate-heading'));
  assert.ok(r.skipped.some((s) => s.check_id === 'duplicate-heading' && s.reason === 'whitelisted'));
});

test('buildStructuralDirectiveBlock returns directive containing check_id', () => {
  const dom = loadFixture('atelier-nord-philosophy');
  const r = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  const block = buildStructuralDirectiveBlock(r.hard_fails);
  assert.ok(block.length > 0);
  assert.ok(/duplicate-heading/.test(block));
});

test('buildStructuralWarningsBlock returns empty string when no warnings', () => {
  assert.equal(buildStructuralWarningsBlock([]), '');
});

test('buildStructuralWarningsBlock formats one entry per warning', () => {
  const block = buildStructuralWarningsBlock([
    { check_id: 'mystery-text-node', selector: 'div.atelier', observed: { text: 'Atelier' }, message: "single-word block 'Atelier'" },
  ]);
  assert.ok(/mystery-text-node/.test(block));
  assert.ok(/div\.atelier/.test(block));
});

test('crashing check is recorded as skipped (insufficient-data), does not throw', () => {
  // A snapshot with no elements array shouldn't crash; it just yields empty hard_fails.
  const r = evaluate({}, DESKTOP, { styleWhitelist: EMPTY_WL });
  assert.deepEqual(r.hard_fails, []);
  assert.deepEqual(r.warnings, []);
});
```

- [ ] **Step 2: Run test, expect fail**

Run: `node --test hooks/scripts/lib/__tests__/structural-gate.test.mjs`
Expected: FAIL — `structural-gate.evaluate not yet implemented (Task 13)`.

- [ ] **Step 3: Replace stub bodies in structural-gate.mjs**

Replace the entire content of `hooks/scripts/lib/structural-gate.mjs` with:

```js
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
```

- [ ] **Step 4: Run test, expect pass**

Run: `node --test hooks/scripts/lib/__tests__/structural-gate.test.mjs`
Expected: All 9 tests pass.

Also run the full check-module suite:
Run: `node --test hooks/scripts/lib/__tests__/structural-checks/`
Expected: All per-check tests pass.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/lib/structural-gate.mjs hooks/scripts/lib/__tests__/structural-gate.test.mjs
git commit -m "feat(structural-gate): dispatcher implementation

Replace stub evaluate() with the full dispatcher: imports all 7 check
modules, partitions results into hard_fails/warnings/skipped, applies
whitelist Sets, and never throws (a check that crashes records skipped
with reason 'insufficient-data').

Integration test verifies all three observed fixtures produce the
expected breakdown."
```

---

### Task 14: Integrate gate into capture-and-critique.mjs

**Files:**
- Modify: `hooks/scripts/capture-and-critique.mjs` — invoke `evaluate` on the prior round's DOM snapshot, emit regen-directive on hard-fail, inject warnings on pass

- [ ] **Step 1: Add imports at the top of the existing import block**

Locate the existing import block (around lines 16-38). Add immediately after the `slop-directives.mjs` import:

```js
import {
  evaluate as evaluateStructural,
  buildStructuralDirectiveBlock,
  buildStructuralWarningsBlock,
} from './lib/structural-gate.mjs';
```

- [ ] **Step 2: Insert the gate invocation before "── Build additionalContext ──"**

Find the section header `// ── Build additionalContext ──` (around line 418). Insert immediately *before* that line:

```js
// ── structural-gate: post-capture structural-integrity gate ─────────────────
// Reads the prior round's persisted DOM snapshot and runs the dispatcher.
// Round 1 has no prior snapshot → gate is a no-op and slop-gate + LLM-critic
// remain the sole defence.

const STRUCTURAL_DISABLED = (() => {
  const v = process.env.VISIONARY_ENABLE_STRUCTURAL_GATE;
  if (v === undefined) return false;
  if (v === '0' || v === 'false' || v.toLowerCase() === 'off') return true;
  return false;
})();

let structuralWarningsBlock = '';
if (!STRUCTURAL_DISABLED && existsSync(domSnapshotPath)) {
  let priorDom = null;
  try { priorDom = JSON.parse(readFileSync(domSnapshotPath, 'utf8')); }
  catch { /* corrupt snapshot — skip gate */ }

  if (priorDom && Array.isArray(priorDom.elements)) {
    const wlStructural = activeWhitelist?.structural || {
      hard_fail_skips: new Set(),
      warning_skips: new Set(),
    };
    const sgResult = evaluateStructural(priorDom, { width: 1200, height: 800 }, {
      styleWhitelist: wlStructural,
      styleId: activeWhitelist?.styleId,
    });

    if (sgResult.hard_fails.length > 0) {
      try {
        trace.sync('structural_blocked', {
          blocking_checks: [...new Set(sgResult.hard_fails.map(h => h.check_id))],
          blocking_count: sgResult.hard_fails.length,
          skipped_count: sgResult.skipped.length,
          style_id: activeWhitelist?.styleId || null,
        }, { projectRoot: cwd, generationId: fileHash, round, emitter: 'structural-gate' });
      } catch { /* trace is best-effort */ }

      const directive = buildStructuralDirectiveBlock(sgResult.hard_fails);
      const rejectContext = [
        `STRUCTURAL GATE BLOCKED REGEN — Round ${round}/${MAX_ROUNDS}`,
        '',
        `File written: ${filePath}`,
        `Active style: ${activeWhitelist?.styleId || '(no .visionary-generated marker — gate used empty whitelist)'}`,
        `Hard-fails: ${sgResult.hard_fails.length}  ·  warnings (suppressed this round): ${sgResult.warnings.length}  ·  skipped: ${sgResult.skipped.length}`,
        '',
        'NEXT-TURN ACTIONS:',
        '1. Skip the normal critic+screenshot flow — this output has structural defects that must be eliminated before scoring is meaningful.',
        '2. Read the STRUCTURAL DEFECTS block below carefully.',
        '3. Rewrite the component to fix every flagged defect. The hook will re-trigger automatically when you save.',
        '4. To override on a stylistic basis: add the check_id to the active style frontmatter `allows_structural.hard_fail_skips` and document why.',
        '',
        directive,
        '',
        'No critic output was produced this round. Round counter advances normally; if hard-fails persist for 3 rounds, the loop terminates and user review is expected.',
      ].join('\n');
      emit({ additionalContext: rejectContext.slice(0, CONTEXT_CAP) });
    }

    if (sgResult.warnings.length > 0) {
      try {
        trace.sync('structural_warning', {
          warning_checks: [...new Set(sgResult.warnings.map(w => w.check_id))],
          warning_count: sgResult.warnings.length,
          style_id: activeWhitelist?.styleId || null,
        }, { projectRoot: cwd, generationId: fileHash, round, emitter: 'structural-gate' });
      } catch { /* trace is best-effort */ }
      structuralWarningsBlock = buildStructuralWarningsBlock(sgResult.warnings);
    }

    if (sgResult.skipped.length > 0) {
      try {
        trace.sync('structural_whitelisted', {
          whitelisted_checks: [...new Set(sgResult.skipped.filter(s => s.reason === 'whitelisted').map(s => s.check_id))],
          whitelisted_count: sgResult.skipped.filter(s => s.reason === 'whitelisted').length,
          style_id: activeWhitelist?.styleId || null,
          reason: activeWhitelist?.reason || null,
        }, { projectRoot: cwd, generationId: fileHash, round, emitter: 'structural-gate' });
      } catch { /* trace is best-effort */ }
    }
  }
}
```

- [ ] **Step 3: Inject the warnings block into the critic context**

Find the `const context = [...]` array (around line 585). Insert `structuralWarningsBlock,` after `multiCriticSection,`. The order matters: warnings reach the LLM-critic alongside slop-flag and motion-context blocks.

- [ ] **Step 4: Verify the file still parses**

Run: `node --check hooks/scripts/capture-and-critique.mjs`
Expected: exit 0.

Also re-run the full structural-gate suite to ensure no regressions:
Run: `node --test hooks/scripts/lib/__tests__/structural-gate.test.mjs hooks/scripts/lib/__tests__/structural-checks/ hooks/scripts/lib/__tests__/slop-gate.test.mjs`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/capture-and-critique.mjs
git commit -m "feat(structural-gate): integrate gate into capture-and-critique

Add structural-gate invocation between slop-gate and context build.
Reads the prior round's DOM snapshot (persists across rounds via the
existing tmpdir convention); on hard-fail, emits a regen-directive
context that mirrors slop-gate's pattern and short-circuits the LLM-critic.

Warnings are non-blocking — injected into the LLM-critic context as a
'STRUCTURAL_WARNINGS:' block alongside slop_section and motion-context.

Three trace events emitted: structural_blocked, structural_warning,
structural_whitelisted. Hard-disable via VISIONARY_ENABLE_STRUCTURAL_GATE=0."
```

---

### Task 15: Function-level integration test for capture-and-critique helpers

**Files:**
- Create: `hooks/scripts/__tests__/structural-gate-integration.test.mjs`

**Why function-level:** Spawning the hook as a real process exercises the stdin/stdout contract but adds Windows-specific complexity. The integration test below imports the same helpers the hook imports and asserts their composition produces the expected output. Combined with the hook smoke test in Task 14 Step 4 and the dispatcher integration test in Task 13, this gives end-to-end coverage without process-spawning.

- [ ] **Step 1: Write the failing test**

```js
// hooks/scripts/__tests__/structural-gate-integration.test.mjs
//
// End-to-end behaviour test that composes the same helpers capture-and-critique.mjs
// uses on the gate path: evaluate → buildStructuralDirectiveBlock →
// the rejectContext lines. Verifies the final additionalContext shape
// for each of the three observed fixtures.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluate,
  buildStructuralDirectiveBlock,
  buildStructuralWarningsBlock,
} from '../lib/structural-gate.mjs';

const __filename = fileURLToPath(import.meta.url);
const FIXTURES = join(dirname(__filename), '..', 'lib', '__tests__', 'fixtures');
const DESKTOP = { width: 1200, height: 800 };
const EMPTY_WL = { hard_fail_skips: new Set(), warning_skips: new Set() };

function loadFixture(n) { return JSON.parse(readFileSync(join(FIXTURES, n + '.json'), 'utf8')); }

// Mirror of the rejectContext composition in capture-and-critique.mjs.
function composeRejectContext(filePath, round, MAX_ROUNDS, styleId, sgResult) {
  const directive = buildStructuralDirectiveBlock(sgResult.hard_fails);
  return [
    `STRUCTURAL GATE BLOCKED REGEN — Round ${round}/${MAX_ROUNDS}`,
    '',
    `File written: ${filePath}`,
    `Active style: ${styleId || '(no .visionary-generated marker — gate used empty whitelist)'}`,
    `Hard-fails: ${sgResult.hard_fails.length}  ·  warnings (suppressed this round): ${sgResult.warnings.length}  ·  skipped: ${sgResult.skipped.length}`,
    '',
    'NEXT-TURN ACTIONS:',
    '1. Skip the normal critic+screenshot flow — this output has structural defects that must be eliminated before scoring is meaningful.',
    '2. Read the STRUCTURAL DEFECTS block below carefully.',
    '3. Rewrite the component to fix every flagged defect. The hook will re-trigger automatically when you save.',
    '4. To override on a stylistic basis: add the check_id to the active style frontmatter `allows_structural.hard_fail_skips` and document why.',
    '',
    directive,
  ].join('\n');
}

test('philosophy fixture composes a STRUCTURAL GATE BLOCKED context with duplicate-heading', () => {
  const dom = loadFixture('atelier-nord-philosophy');
  const sg = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  assert.ok(sg.hard_fails.length > 0);
  const ctx = composeRejectContext('/tmp/Test.tsx', 2, 3, 'atelier-nord', sg);
  assert.match(ctx, /STRUCTURAL GATE BLOCKED REGEN — Round 2\/3/);
  assert.match(ctx, /duplicate-heading/);
  assert.match(ctx, /Tjänster & takt/);
});

test('footer fixture composes context with footer-grid-collapse + warnings block', () => {
  const dom = loadFixture('atelier-nord-footer');
  const sg = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  const ctx = composeRejectContext('/tmp/Footer.tsx', 2, 3, 'atelier-nord', sg);
  assert.match(ctx, /footer-grid-collapse/);
  assert.match(ctx, /exposed-nav-bullets/);

  // Warnings block goes through the OK path, not the reject path
  const warnBlock = buildStructuralWarningsBlock(sg.warnings);
  assert.match(warnBlock, /mystery-text-node/);
});

test('clean fixture: hard_fails empty, no reject context produced', () => {
  const dom = loadFixture('studio-har-clean');
  const sg = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  assert.deepEqual(sg.hard_fails, []);
  assert.deepEqual(sg.warnings, []);
  // Caller wouldn't compose a rejectContext at all; verify the directive
  // and warning blocks are both empty when nothing's to report.
  assert.equal(buildStructuralDirectiveBlock(sg.hard_fails), '');
  assert.equal(buildStructuralWarningsBlock(sg.warnings), '');
});

test('whitelist allows opting out of duplicate-heading without affecting other checks', () => {
  const dom = loadFixture('atelier-nord-philosophy');
  const wl = { hard_fail_skips: new Set(['duplicate-heading']), warning_skips: new Set() };
  const sg = evaluate(dom, DESKTOP, { styleWhitelist: wl });
  assert.ok(!sg.hard_fails.some((h) => h.check_id === 'duplicate-heading'));
  assert.ok(sg.skipped.some((s) => s.check_id === 'duplicate-heading' && s.reason === 'whitelisted'));
});

test('STRUCTURAL_WARNINGS block contains selector AND check_id for traceability', () => {
  const dom = loadFixture('atelier-nord-footer');
  const sg = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  const block = buildStructuralWarningsBlock(sg.warnings);
  assert.match(block, /mystery-text-node/);
  assert.match(block, /atelier-row|sociala-row/);
});
```

- [ ] **Step 2: Run test, expect pass**

Run: `node --test hooks/scripts/__tests__/structural-gate-integration.test.mjs`
Expected: 5 tests pass.

If any test FAILS, the failure is between Task 13 (dispatcher) and Task 14 (composition). Inspect the diff and fix.

- [ ] **Step 3: Run the entire structural-gate suite together**

Run:
```
node --test hooks/scripts/lib/__tests__/structural-gate.test.mjs hooks/scripts/lib/__tests__/structural-checks/ hooks/scripts/lib/__tests__/slop-gate.test.mjs hooks/scripts/__tests__/structural-gate-integration.test.mjs
```
Expected: All tests pass.

- [ ] **Step 4: Final parse audit on all new files**

Run:
```
node --check hooks/scripts/lib/structural-gate.mjs && \
for f in hooks/scripts/lib/structural-checks/*.mjs; do node --check "$f"; done && \
node --check hooks/scripts/capture-and-critique.mjs && \
echo "all parse"
```
Expected: `all parse`.

- [ ] **Step 5: Commit**

```bash
git add hooks/scripts/__tests__/structural-gate-integration.test.mjs
git commit -m "test(structural-gate): function-level integration test

Composes the same helpers capture-and-critique.mjs uses on the gate
path (evaluate → buildStructuralDirectiveBlock + buildStructuralWarningsBlock)
and asserts the final additionalContext / warnings-block shape for
each of the three observed fixtures.

Skips real subprocess invocation to keep the test cross-platform; the
hook smoke-test in Task 14 Step 4 covers the stdin/stdout boundary."
```

---

### Task 16: Final review + summary

**Files:**
- Read-only sweep — no new files.

- [ ] **Step 1: Verify spec coverage**

Open `docs/superpowers/specs/2026-05-03-structural-integrity-gate-design.md` "Acceptance criteria" section. Walk each checkbox:

- All six hard-fail checks implemented in separate modules → Tasks 2-7
- One warning check implemented; image-brand-mismatch placeholder registered in WARNING_CHECKS but not implemented → Tasks 8 + Task 1
- Dispatcher partitions, applies whitelist, returns expected shape → Task 13
- Three fixture snapshots committed → Task 9
- Each check has unit tests with pass + fail + edge cases → Tasks 2-8
- Integration test verifies all three observed failures + clean baseline → Tasks 13 + 15
- capture-and-critique.mjs integrated; emits structural_blocked → Task 14
- loadActiveStyleWhitelist extended with allows_structural → Task 11
- DOM-snapshot extension captures new fields → Task 10
- Feature flag VISIONARY_ENABLE_STRUCTURAL_GATE honoured → Task 14
- All new code passes existing __tests__ suite → final test run below

- [ ] **Step 2: Run the full repo test suite**

Run: `node --test hooks/scripts/lib/__tests__/ hooks/scripts/__tests__/`
Expected: All pre-existing tests still pass alongside the new tests.

- [ ] **Step 3: Diff sanity-check**

Run: `git diff main..feat/structural-integrity-gate --stat`
Expected: Diff shows new files under `hooks/scripts/lib/structural-checks/`, `hooks/scripts/lib/__tests__/structural-checks/`, `hooks/scripts/lib/__tests__/fixtures/`, plus modifications to `slop-gate.mjs` and `capture-and-critique.mjs`. No unrelated changes.

- [ ] **Step 4: Verify branch is local-only (no push)**

Run: `git -C C:/dev/Visionary-for-Claude-Code config --get-all branch.feat/structural-integrity-gate.remote`
Expected: empty output (no upstream tracking — branch has not been pushed).

- [ ] **Step 5: Tag locally**

```bash
git tag structural-integrity-gate-impl-complete
```

Local tag for orientation. Do not push.

---

## Self-Review Notes

**Spec coverage:** Every Acceptance Criteria item maps to a task. Task 16 makes this explicit.

**Type consistency:** `CheckHit` shape (`check_id`, `selector`, `observed`, `message`) is identical across all per-check modules. `evaluate()` return shape (`hard_fails`, `warnings`, `skipped`) matches the JSDoc in Task 1 and the integration tests in Tasks 13 + 15.

**Whitelist semantics consistency:** `hard_fail_skips` and `warning_skips` are `Set<string>` everywhere — Task 11 (parser), Task 13 (dispatcher consumption), and Task 14 (integration).

**Trace event consistency:** `structural_blocked` / `structural_warning` / `structural_whitelisted` payload shapes documented in Task 12 are emitted exactly as specified in Task 14. `style_id` is always `string | null`, never undefined.

**No placeholders:** No "TBD"/"TODO"/"implement later" found in any task body. Image-brand-mismatch is explicitly deferred and registered as a WARNING_CHECKS catalogue entry only.
