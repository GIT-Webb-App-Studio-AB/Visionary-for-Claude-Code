// Run: node --test hooks/scripts/lib/__tests__/slop-directives.test.mjs
//
// Verifies parsing of slop-directives.md + directive-building. Uses the
// real markdown file on disk — we want to catch schema drift if the
// directive file gets edited in a way that breaks the header format.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  loadDirectives,
  findDirectiveForFlag,
  buildDirectiveBlock,
  _clearCacheForTest,
} from '../slop-directives.mjs';

test('loadDirectives: parses the real on-disk file', () => {
  _clearCacheForTest();
  const map = loadDirectives();
  assert.ok(map.size >= 15, `expected at least 15 directive entries, got ${map.size}`);
  // Spot-check a known entry
  const blue = map.get('default tailwind blue (#3b82f6) as primary color');
  assert.ok(blue, 'should have an entry for default Tailwind blue');
  assert.match(blue.avoid, /bg-blue-500/);
  assert.match(blue.consider, /indigo|navy|teal|electric/);
});

test('findDirectiveForFlag: strips " detected" suffix for matching', () => {
  _clearCacheForTest();
  const d = findDirectiveForFlag('Default Tailwind blue #3B82F6 as primary color detected');
  assert.ok(d);
  assert.match(d.title, /Default Tailwind blue/);
});

test('findDirectiveForFlag: substring match for detector-vs-directive wording drift', () => {
  _clearCacheForTest();
  // Detector says "Cyan-on-dark color scheme detected"; file header says "Cyan-on-dark color scheme"
  const d = findDirectiveForFlag('Cyan-on-dark color scheme detected');
  assert.ok(d);
  assert.match(d.title, /Cyan-on-dark/);
});

test('findDirectiveForFlag: returns null for unknown flag', () => {
  _clearCacheForTest();
  const d = findDirectiveForFlag('Totally novel never-before-seen pattern');
  assert.equal(d, null);
});

test('buildDirectiveBlock: empty input returns empty string', () => {
  assert.equal(buildDirectiveBlock([]), '');
  assert.equal(buildDirectiveBlock(null), '');
});

test('buildDirectiveBlock: includes REGEN REQUIRED banner', () => {
  _clearCacheForTest();
  const block = buildDirectiveBlock([
    'Default Tailwind blue #3B82F6 as primary color detected',
    'Cyan-on-dark color scheme detected',
  ]);
  assert.match(block, /REGEN REQUIRED/);
  assert.match(block, /DO NOT produce output/);
});

test('buildDirectiveBlock: includes directives for known patterns', () => {
  _clearCacheForTest();
  const block = buildDirectiveBlock([
    'Default Tailwind blue #3B82F6 as primary color detected',
  ]);
  assert.match(block, /Avoid:.*bg-blue-500/);
  assert.match(block, /Consider:.*indigo|navy/);
});

test('buildDirectiveBlock: caps at maxPatterns', () => {
  _clearCacheForTest();
  const many = Array.from({ length: 10 }).map((_, i) => `Pattern ${i} detected`);
  const block = buildDirectiveBlock(many, { maxPatterns: 3 });
  // Only three pattern names should appear in the bullet list section
  const bulletCount = (block.match(/^- Pattern \d+ detected$/gm) || []).length;
  assert.equal(bulletCount, 3);
});

test('buildDirectiveBlock: unknown patterns fall back to generic avoid-line', () => {
  _clearCacheForTest();
  const block = buildDirectiveBlock(['Absolutely Unknown Pattern detected']);
  assert.match(block, /Avoid reproducing this pattern/);
});

test('buildDirectiveBlock: handles a realistic mixed set', () => {
  _clearCacheForTest();
  const block = buildDirectiveBlock([
    'Cyan-on-dark color scheme detected',
    'Inter as sole typeface detected',
    'Repeated 3-across card grid detected',
  ]);
  // All three directives should be matched
  assert.match(block, /Cyan-on-dark/);
  assert.match(block, /Inter/);
  assert.match(block, /3-across|card grid/i);
});
