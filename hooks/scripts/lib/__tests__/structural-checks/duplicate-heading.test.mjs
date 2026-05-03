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
