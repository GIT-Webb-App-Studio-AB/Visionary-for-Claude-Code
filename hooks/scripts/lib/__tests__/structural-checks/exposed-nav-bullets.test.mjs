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
