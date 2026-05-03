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
