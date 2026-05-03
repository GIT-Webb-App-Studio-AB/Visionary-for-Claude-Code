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
