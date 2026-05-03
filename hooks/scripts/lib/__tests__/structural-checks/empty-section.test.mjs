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
