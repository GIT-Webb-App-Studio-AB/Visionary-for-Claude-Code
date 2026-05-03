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
