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
