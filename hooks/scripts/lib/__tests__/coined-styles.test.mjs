// Run: node --test hooks/scripts/lib/__tests__/coined-styles.test.mjs
//
// Sprint 17 Task 33.6 — persistence stub for coined (off-catalog) blends.
// Tests use os.tmpdir() so we never touch the real taste/ directory.

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  getCoinedStylesPath,
  readCoinedStyles,
  persistCoinedBlend,
  _internals,
} from '../coined-styles.mjs';

let tmpRoot;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'coined-styles-test-'));
  // Clear any env override that might leak from another test runner.
  delete process.env.VISIONARY_COINED_STYLES_PATH;
});

afterEach(() => {
  if (tmpRoot && existsSync(tmpRoot)) {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
  delete process.env.VISIONARY_COINED_STYLES_PATH;
});

const SAMPLE_VECTOR = {
  density: 0.5,
  chroma: 0.7,
  formality: 0.5,
  motion_intensity: 0.33,
  historicism: 0.6,
  texture: 0.2,
  contrast_energy: 0.65,
  type_drama: 0.4,
};

const SAMPLE_RECIPE = [
  { id: 'swiss-rationalism', weight: 0.7 },
  { id: 'liminal-space', weight: 0.3 },
];

// ── 1. readCoinedStyles on missing file → [] ───────────────────────────────

test('readCoinedStyles: missing file returns empty array', () => {
  // No file written under tmpRoot/taste/
  const result = readCoinedStyles(tmpRoot);
  assert.deepEqual(result, []);
});

// ── 2. readCoinedStyles tolerates malformed JSON lines ─────────────────────

test('readCoinedStyles: skips malformed lines, returns valid entries', () => {
  const path = join(tmpRoot, 'taste', 'coined-styles.jsonl');
  const taste = join(tmpRoot, 'taste');
  mkdirSync(taste, { recursive: true });
  const validEntry = JSON.stringify({
    id: 'coined-abc123',
    vector: SAMPLE_VECTOR,
    anchor_recipe: SAMPLE_RECIPE,
    accepted_count: 1,
    first_seen: '2026-05-05T00:00:00.000Z',
    last_seen: '2026-05-05T00:00:00.000Z',
    name: null,
  });
  const content = [
    validEntry,
    '{ this is not json',          // malformed
    '',                            // blank — should skip silently
    validEntry,                    // valid duplicate ok pre-sprint-21
    'null',                        // parses but is not an object → skip
  ].join('\n');
  writeFileSync(path, content + '\n', 'utf8');

  const result = readCoinedStyles(tmpRoot);
  assert.equal(result.length, 2, `expected 2 valid entries, got ${result.length}`);
  assert.equal(result[0].id, 'coined-abc123');
});

// ── 3. persistCoinedBlend creates entry with correct schema ────────────────

test('persistCoinedBlend: creates JSONL entry with required fields', () => {
  const result = persistCoinedBlend({
    vector: SAMPLE_VECTOR,
    anchor_recipe: SAMPLE_RECIPE,
    projectRoot: tmpRoot,
    now: new Date('2026-05-05T12:00:00Z'),
  });

  // Returns the entry, not an error.
  assert.ok(!result.error, `unexpected error: ${result.error}`);
  assert.ok(typeof result.id === 'string' && result.id.startsWith('coined-'));
  assert.deepEqual(result.vector, SAMPLE_VECTOR);
  assert.deepEqual(result.anchor_recipe, SAMPLE_RECIPE);
  assert.equal(result.accepted_count, 1);
  assert.equal(result.first_seen, '2026-05-05T12:00:00.000Z');
  assert.equal(result.last_seen, '2026-05-05T12:00:00.000Z');
  assert.equal(result.name, null);

  // File was actually written.
  const path = join(tmpRoot, 'taste', 'coined-styles.jsonl');
  assert.ok(existsSync(path), 'JSONL file should exist after persist');
  const lines = readFileSync(path, 'utf8').trim().split('\n');
  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.id, result.id);
});

// ── 4. id derived from vector → stable across calls ────────────────────────

test('persistCoinedBlend: same vector produces same id (deterministic hash)', () => {
  const r1 = persistCoinedBlend({
    vector: SAMPLE_VECTOR,
    anchor_recipe: SAMPLE_RECIPE,
    projectRoot: tmpRoot,
  });
  const r2 = persistCoinedBlend({
    vector: SAMPLE_VECTOR,
    anchor_recipe: SAMPLE_RECIPE,
    projectRoot: tmpRoot,
  });
  assert.ok(!r1.error && !r2.error);
  assert.equal(r1.id, r2.id, 'identical vectors must hash to identical ids');
});

// ── 5. different vectors → different ids ───────────────────────────────────

test('persistCoinedBlend: different vectors produce different ids', () => {
  const v2 = { ...SAMPLE_VECTOR, chroma: 0.2 }; // chroma changed
  const r1 = persistCoinedBlend({
    vector: SAMPLE_VECTOR,
    anchor_recipe: SAMPLE_RECIPE,
    projectRoot: tmpRoot,
  });
  const r2 = persistCoinedBlend({
    vector: v2,
    anchor_recipe: SAMPLE_RECIPE,
    projectRoot: tmpRoot,
  });
  assert.notEqual(r1.id, r2.id);
});

// ── 6. ENV override is honored ─────────────────────────────────────────────

test('getCoinedStylesPath: env override wins over projectRoot default', () => {
  process.env.VISIONARY_COINED_STYLES_PATH = '/some/explicit/path.jsonl';
  const path = getCoinedStylesPath(tmpRoot);
  assert.equal(path, '/some/explicit/path.jsonl');
});

test('getCoinedStylesPath: defaults to <root>/taste/coined-styles.jsonl', () => {
  const path = getCoinedStylesPath(tmpRoot);
  assert.equal(path, join(tmpRoot, 'taste', 'coined-styles.jsonl'));
});

// ── 7. internal hash + stable stringify sanity ─────────────────────────────

test('_internals.simpleHash: deterministic and 8 chars', () => {
  const a = _internals.simpleHash('foo');
  const b = _internals.simpleHash('foo');
  const c = _internals.simpleHash('bar');
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.equal(a.length, 8);
});

test('_internals.stableStringify: key order does not affect output', () => {
  const a = _internals.stableStringify({ chroma: 0.5, density: 0.3 });
  const b = _internals.stableStringify({ density: 0.3, chroma: 0.5 });
  assert.equal(a, b);
});

// ── 8. validation: missing required args ───────────────────────────────────

test('persistCoinedBlend: returns error on missing vector', () => {
  const r = persistCoinedBlend({
    vector: null,
    anchor_recipe: SAMPLE_RECIPE,
    projectRoot: tmpRoot,
  });
  assert.ok(r.error, 'expected error for null vector');
});

test('persistCoinedBlend: returns error on non-array recipe', () => {
  const r = persistCoinedBlend({
    vector: SAMPLE_VECTOR,
    anchor_recipe: 'not-an-array',
    projectRoot: tmpRoot,
  });
  assert.ok(r.error, 'expected error for non-array anchor_recipe');
});
