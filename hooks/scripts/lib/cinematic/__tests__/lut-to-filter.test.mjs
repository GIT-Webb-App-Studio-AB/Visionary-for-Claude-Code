// Run: node --test hooks/scripts/lib/cinematic/__tests__/lut-to-filter.test.mjs
//
// Sprint 20 Task 37.5 — LUT-mapper unit tests.
// Coverage: applyLut() per-director output, missing-preset graceful fallback,
// JSON-load error handling, listPresets() shape, CSS-format hygiene.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  loadPresets,
  applyLut,
  listPresets,
  resetCache,
} from '../lut-to-filter.mjs';

const ALL_DIRECTORS = [
  'wong-kar-wai',
  'villeneuve',
  'wes-anderson',
  'nolan',
  'kubrick',
  'lynch',
  'tarkovsky',
  'denis',
  'bong',
  'parker',
  'garland',
  'coppola',
];

// ── applyLut: per-director signature checks ─────────────────────────────────

test('applyLut(wong-kar-wai) emits hue-rotate + saturate + sepia + contrast', () => {
  resetCache();
  const css = applyLut('wong-kar-wai');
  assert.match(css, /hue-rotate\(8deg\)/);
  assert.match(css, /saturate\(1\.15\)/);
  assert.match(css, /contrast\(1\.05\)/);
  assert.match(css, /sepia\(0\.05\)/);
  // Wong has brightness 0.95 — must appear
  assert.match(css, /brightness\(0\.95\)/);
});

test('applyLut(villeneuve) is cool + high-contrast + low-brightness, no sepia', () => {
  resetCache();
  const css = applyLut('villeneuve');
  // cool = negative hue-rotate
  assert.match(css, /hue-rotate\(-10deg\)/);
  // desaturated
  assert.match(css, /saturate\(0\.85\)/);
  // high contrast
  assert.match(css, /contrast\(1\.25\)/);
  // brightness pulled down
  assert.match(css, /brightness\(0\.9\)/);
  // no sepia — Villeneuve avoids warmth
  assert.doesNotMatch(css, /sepia\(/);
});

test('applyLut(unknown-id) returns empty string', () => {
  resetCache();
  assert.equal(applyLut('not-a-real-director'), '');
  assert.equal(applyLut(''), '');
  assert.equal(applyLut(undefined), '');
  assert.equal(applyLut(null), '');
  assert.equal(applyLut(42), '');
});

// ── Missing / malformed presets file → graceful fallback ────────────────────

test('loadPresets falls back to empty registry when file is missing', () => {
  resetCache();
  const result = loadPresets('/nonexistent/path/to/lut-presets.json');
  assert.equal(typeof result, 'object');
  assert.equal(typeof result.version, 'string');
  assert.deepEqual(result.presets, {});
});

test('applyLut returns empty string when presets file is missing (no crash)', () => {
  resetCache();
  loadPresets('/nonexistent/path/to/lut-presets.json');
  // Cache is now poisoned with the empty registry — applyLut must still work.
  assert.equal(applyLut('wong-kar-wai'), '');
});

test('loadPresets handles malformed JSON gracefully', () => {
  resetCache();
  const dir = mkdtempSync(join(tmpdir(), 'lut-test-'));
  const badPath = join(dir, 'lut-presets.json');
  writeFileSync(badPath, '{ this is: not valid json,', 'utf8');
  try {
    const result = loadPresets(badPath);
    assert.deepEqual(result.presets, {});
    assert.equal(typeof result.version, 'string');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('loadPresets normalises malformed `presets` field to {}', () => {
  resetCache();
  const dir = mkdtempSync(join(tmpdir(), 'lut-test-'));
  const oddPath = join(dir, 'lut-presets.json');
  writeFileSync(oddPath, JSON.stringify({ version: '1.0.0', presets: 'oops' }), 'utf8');
  try {
    const result = loadPresets(oddPath);
    assert.deepEqual(result.presets, {});
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── All 12 presets validate ─────────────────────────────────────────────────

test('all 12 director-LUTs are registered and parse cleanly', () => {
  resetCache();
  const data = loadPresets();
  assert.equal(typeof data.presets, 'object');
  for (const id of ALL_DIRECTORS) {
    assert.ok(data.presets[id], `missing preset for director: ${id}`);
    const p = data.presets[id];
    assert.equal(typeof p.hue_rotate, 'number', `${id}: hue_rotate must be number`);
    assert.equal(typeof p.saturate, 'number', `${id}: saturate must be number`);
    assert.equal(typeof p.contrast, 'number', `${id}: contrast must be number`);
    assert.equal(typeof p.sepia, 'number', `${id}: sepia must be number`);
    assert.equal(typeof p.brightness, 'number', `${id}: brightness must be number`);
    assert.equal(typeof p.rationale, 'string', `${id}: rationale must be string`);
    assert.ok(p.rationale.length >= 20, `${id}: rationale too short`);
  }
});

test('every registered LUT produces a non-empty CSS filter string', () => {
  resetCache();
  for (const id of ALL_DIRECTORS) {
    const css = applyLut(id);
    assert.ok(css.length > 0, `${id}: applyLut returned empty string`);
  }
});

// ── listPresets: shape + completeness ───────────────────────────────────────

test('listPresets returns 12 entries with id + rationale', () => {
  resetCache();
  const list = listPresets();
  assert.equal(list.length, 12);
  const ids = new Set(list.map((p) => p.id));
  for (const expected of ALL_DIRECTORS) {
    assert.ok(ids.has(expected), `listPresets missing ${expected}`);
  }
  for (const entry of list) {
    assert.equal(typeof entry.id, 'string');
    assert.equal(typeof entry.rationale, 'string');
    assert.ok(entry.rationale.length > 0, `${entry.id}: empty rationale`);
  }
});

// ── CSS filter-string format hygiene ────────────────────────────────────────

test('CSS filter-string uses single-space separator between components', () => {
  resetCache();
  const css = applyLut('wong-kar-wai');
  // No double spaces, no leading/trailing whitespace
  assert.equal(css, css.trim());
  assert.doesNotMatch(css, /  /);
  // Components separated by single space
  const parts = css.split(' ');
  assert.ok(parts.length >= 2);
  for (const part of parts) {
    // Each component is `name(value)` — must not contain bare commas/semicolons
    assert.match(part, /^[a-z-]+\([^)]+\)$/, `malformed component: ${part}`);
  }
});

test('hue-rotate carries the deg unit; other components are unitless', () => {
  resetCache();
  const css = applyLut('lynch'); // lynch has the largest hue-rotate (18)
  assert.match(css, /hue-rotate\(18deg\)/);
  // saturate / contrast / sepia / brightness are unitless multipliers
  assert.doesNotMatch(css, /saturate\([^)]*deg\)/);
  assert.doesNotMatch(css, /contrast\([^)]*deg\)/);
  assert.doesNotMatch(css, /sepia\([^)]*deg\)/);
  assert.doesNotMatch(css, /brightness\([^)]*deg\)/);
});

test('neutral-value components (hue=0, sat=1, contrast=1, sepia=0, brightness=1) are omitted', () => {
  // Construct a synthetic "all neutral" preset and verify applyLut returns ''
  resetCache();
  const dir = mkdtempSync(join(tmpdir(), 'lut-test-'));
  const path = join(dir, 'lut-presets.json');
  writeFileSync(
    path,
    JSON.stringify({
      version: '1.0.0',
      presets: {
        neutral: {
          hue_rotate: 0,
          saturate: 1,
          contrast: 1,
          sepia: 0,
          brightness: 1,
          rationale: 'no-op preset for testing',
        },
      },
    }),
    'utf8'
  );
  try {
    loadPresets(path);
    assert.equal(applyLut('neutral'), '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('order of CSS filter components is hue → sat → contrast → sepia → brightness', () => {
  resetCache();
  const css = applyLut('wong-kar-wai');
  const huePos = css.indexOf('hue-rotate');
  const satPos = css.indexOf('saturate');
  const conPos = css.indexOf('contrast');
  const sepPos = css.indexOf('sepia');
  const brtPos = css.indexOf('brightness');
  assert.ok(huePos < satPos, 'hue-rotate must precede saturate');
  assert.ok(satPos < conPos, 'saturate must precede contrast');
  assert.ok(conPos < sepPos, 'contrast must precede sepia');
  assert.ok(sepPos < brtPos, 'sepia must precede brightness');
});

// ── LUT distinctness (sanity — every pair differs) ──────────────────────────

test('all 12 LUTs produce visually distinct CSS strings (pairwise ≠)', () => {
  resetCache();
  const filters = ALL_DIRECTORS.map((id) => ({ id, css: applyLut(id) }));
  for (let i = 0; i < filters.length; i++) {
    for (let j = i + 1; j < filters.length; j++) {
      assert.notEqual(
        filters[i].css,
        filters[j].css,
        `LUTs collide: ${filters[i].id} === ${filters[j].id}`
      );
    }
  }
});

// ── resetCache test seam ────────────────────────────────────────────────────

test('resetCache forces a fresh disk read on next loadPresets call', () => {
  resetCache();
  // Pollute cache with empty registry
  loadPresets('/no/such/file.json');
  assert.equal(applyLut('wong-kar-wai'), '');
  // Reset and verify the real registry is reachable
  resetCache();
  assert.notEqual(applyLut('wong-kar-wai'), '');
});
