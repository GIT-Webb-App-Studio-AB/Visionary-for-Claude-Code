import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractValues } from '../extract-values.mjs';

test('extracts hex colors', () => {
  const r = extractValues('color: #FF0000;');
  assert.ok(r.find((v) => v.kind === 'color' && v.value === '#FF0000'));
});

test('extracts Tailwind color classes', () => {
  const r = extractValues('<div class="bg-cyan-400 text-blue-700">');
  assert.ok(r.find((v) => v.kind === 'color' && v.value === 'bg-cyan-400'));
  assert.ok(r.find((v) => v.kind === 'color' && v.value === 'text-blue-700'));
});

test('extracts spacing px', () => {
  const r = extractValues('padding: 16px;');
  assert.ok(r.find((v) => v.kind === 'spacing' && v.value === '16px'));
});

test('extracts duration ms', () => {
  const r = extractValues('transition: 200ms ease;');
  assert.ok(r.find((v) => v.kind === 'duration' && v.value === '200ms'));
});

test('extracts Tailwind spacing', () => {
  const r = extractValues('<div class="p-4 m-2 gap-3">');
  assert.ok(r.find((v) => v.value === 'p-4'));
  assert.ok(r.find((v) => v.value === 'm-2'));
});

test('reports line numbers', () => {
  const r = extractValues('line1\npadding: 16px;\nline3');
  const px = r.find((v) => v.value === '16px');
  assert.equal(px.line, 2);
});

test('empty input returns empty array', () => {
  assert.deepEqual(extractValues(''), []);
});
