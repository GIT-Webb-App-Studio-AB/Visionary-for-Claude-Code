// extract-palette.test.mjs — Sprint 18 Task 35.1
//
// Run: node --test hooks/scripts/lib/photo/__tests__/extract-palette.test.mjs
//
// Strategy:
//   - Pure helpers (hueTemperature, rgbToOklch, circularMeanHue) run on every
//     machine because they have zero deps.
//   - Pipeline tests (extractPalette, loadAndCache, resize, palette method)
//     require `sharp`. We probe once at suite start and skip those tests when
//     sharp is unavailable, surfacing a single warning so CI without native
//     deps stays green.
//   - The fixture is a hardcoded minimal valid PNG (1×1 red) decoded from a
//     base64 literal. No build-time sharp dependency for fixture generation.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

import {
  extractPalette,
  loadAndCache,
  rgbToOklch,
  hueTemperature,
  circularMeanHue,
  loadSharp,
} from '../extract-palette.mjs';

// ── Fixtures ────────────────────────────────────────────────────────────────

// Minimal 1×1 red PNG (decoded from base64 — ~70 bytes).
// Verified valid via PNG signature [137,80,78,71,...] and a single IDAT chunk.
const PNG_1x1_RED = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

// Minimal 1×1 blue PNG.
const PNG_1x1_BLUE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYPj/HwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
);

let TMP_ROOT;
let SHARP_AVAILABLE = false;
let sharpProbeError = null;

before(async () => {
  TMP_ROOT = mkdtempSync(join(tmpdir(), 'extract-palette-test-'));
  process.env.VISIONARY_CACHE_IN_REPO = '1';
  // Probe sharp once. Pipeline tests skip cleanly when it's missing.
  try {
    await loadSharp();
    SHARP_AVAILABLE = true;
  } catch (err) {
    sharpProbeError = err;
    // eslint-disable-next-line no-console
    console.warn(
      `[extract-palette.test] sharp unavailable (${err.code || err.message}); ` +
      `pipeline tests will be skipped. Pure helpers still run.`,
    );
  }
});

after(() => {
  if (TMP_ROOT && existsSync(TMP_ROOT)) {
    rmSync(TMP_ROOT, { recursive: true, force: true });
  }
  delete process.env.VISIONARY_CACHE_IN_REPO;
});

function freshProject(name = 'project') {
  const root = join(TMP_ROOT, `${name}-${Math.random().toString(36).slice(2, 8)}`);
  rmSync(root, { recursive: true, force: true });
  // Note: VISIONARY_CACHE_IN_REPO=1 will create cache under root/.visionary-cache
  // even though `root` itself doesn't exist as a dir yet — ensureCacheDir does
  // a recursive mkdir, so writes succeed regardless.
  return root;
}

// ── Pure helpers ────────────────────────────────────────────────────────────

test('hueTemperature: 200° → cool', () => {
  assert.equal(hueTemperature(200), 'cool');
});

test('hueTemperature: 30° → warm', () => {
  assert.equal(hueTemperature(30), 'warm');
});

test('hueTemperature: 330° → warm (magenta wraps into warm)', () => {
  assert.equal(hueTemperature(330), 'warm');
});

test('hueTemperature: 120° (green) → neutral', () => {
  assert.equal(hueTemperature(120), 'neutral');
});

test('hueTemperature: boundary 180 → cool, 270 → cool, 60 → warm, 300 → warm', () => {
  assert.equal(hueTemperature(180), 'cool');
  assert.equal(hueTemperature(270), 'cool');
  assert.equal(hueTemperature(60),  'warm');
  assert.equal(hueTemperature(300), 'warm');
});

test('hueTemperature: NaN / non-finite → neutral', () => {
  assert.equal(hueTemperature(NaN), 'neutral');
  assert.equal(hueTemperature(Infinity), 'neutral');
});

test('hueTemperature: handles >360 by wrapping', () => {
  assert.equal(hueTemperature(380),  'warm'); // 380 mod 360 = 20
  assert.equal(hueTemperature(-160), 'cool'); // -160 mod 360 = 200
});

// ── rgbToOklch round-trip-ish smoke tests ──────────────────────────────────

test('rgbToOklch: pure red has hue near 29° (OKLCh red anchor)', () => {
  const o = rgbToOklch({ r: 255, g: 0, b: 0 });
  // OKLCh hue for sRGB red ≈ 29.23°
  assert.ok(o.h > 25 && o.h < 35, `expected red.h ≈ 29, got ${o.h}`);
  assert.ok(o.l > 0.6 && o.l < 0.65, `expected red.l ≈ 0.63, got ${o.l}`);
  assert.ok(o.c > 0.2, `expected red.c > 0.2, got ${o.c}`);
  assert.equal(o.hex_fallback, '#ff0000');
});

test('rgbToOklch: pure blue has hue near 264° (OKLCh blue anchor)', () => {
  const o = rgbToOklch({ r: 0, g: 0, b: 255 });
  assert.ok(o.h > 260 && o.h < 270, `expected blue.h ≈ 264, got ${o.h}`);
  assert.equal(o.hex_fallback, '#0000ff');
});

test('rgbToOklch: pure black has L≈0, C≈0', () => {
  const o = rgbToOklch({ r: 0, g: 0, b: 0 });
  assert.ok(Math.abs(o.l) < 0.01);
  assert.ok(Math.abs(o.c) < 0.01);
});

test('rgbToOklch: pure white has L≈1, C≈0', () => {
  const o = rgbToOklch({ r: 255, g: 255, b: 255 });
  assert.ok(Math.abs(o.l - 1) < 0.01);
  assert.ok(Math.abs(o.c) < 0.01);
});

test('rgbToOklch: medium grey has L≈0.5±0.1, C≈0', () => {
  const o = rgbToOklch({ r: 128, g: 128, b: 128 });
  assert.ok(o.l > 0.45 && o.l < 0.65);
  assert.ok(Math.abs(o.c) < 0.01);
});

// ── circularMeanHue ─────────────────────────────────────────────────────────

test('circularMeanHue: mean of [10°, 350°] is near 0° (wrap-aware)', () => {
  const m = circularMeanHue([10, 350]);
  // Should be near 0/360, not 180.
  assert.ok(m < 5 || m > 355, `expected near 0, got ${m}`);
});

test('circularMeanHue: empty → NaN', () => {
  assert.ok(Number.isNaN(circularMeanHue([])));
});

test('circularMeanHue: single value returns itself', () => {
  const m = circularMeanHue([42]);
  assert.ok(Math.abs(m - 42) < 0.01, `expected 42, got ${m}`);
});

// ── Sharp dependency error ─────────────────────────────────────────────────

test('loadSharp: throws SHARP_UNAVAILABLE-coded error when missing', { skip: SHARP_AVAILABLE }, async () => {
  // When sharp is absent the suite-level probe will have populated
  // sharpProbeError. Re-assert the contract.
  assert.ok(sharpProbeError, 'expected probe to fail when sharp is missing');
  assert.equal(sharpProbeError.code, 'SHARP_UNAVAILABLE');
  assert.match(sharpProbeError.message, /npm install sharp/);
});

// ── Pipeline tests (require sharp) ─────────────────────────────────────────

test('loadAndCache: local path → buffer + sha256 + cache file', { skip: !SHARP_AVAILABLE }, async () => {
  const root = freshProject('load-path');
  const fixturePath = join(TMP_ROOT, 'red.png');
  writeFileSync(fixturePath, PNG_1x1_RED);

  const result = await loadAndCache(fixturePath, root);
  const expectedSha = createHash('sha256').update(PNG_1x1_RED).digest('hex');

  assert.equal(result.kind, 'path');
  assert.equal(result.sha256, expectedSha);
  assert.ok(existsSync(result.cachePath), 'cached file should exist on disk');
  assert.ok(result.cachePath.includes('photo-cache'));
  assert.deepEqual(readFileSync(result.cachePath), PNG_1x1_RED);
});

test('loadAndCache: cache hit on second call with same input', { skip: !SHARP_AVAILABLE }, async () => {
  const root = freshProject('cache-hit');
  const fixturePath = join(TMP_ROOT, 'red-cache.png');
  writeFileSync(fixturePath, PNG_1x1_RED);

  const first  = await loadAndCache(fixturePath, root);
  const before = readFileSync(first.cachePath);
  // Mutate the cached file so we can prove the second call doesn't rewrite it.
  writeFileSync(first.cachePath, Buffer.concat([before, Buffer.from([0xAA])]));
  const tampered = readFileSync(first.cachePath);

  const second = await loadAndCache(fixturePath, root);
  assert.equal(second.sha256, first.sha256);
  assert.equal(second.cachePath, first.cachePath);
  // The cache write is only triggered when the file is missing — our tampered
  // copy must remain untouched.
  assert.deepEqual(readFileSync(second.cachePath), tampered);
});

test('loadAndCache: URL via mocked fetch caches identically by sha256', { skip: !SHARP_AVAILABLE }, async () => {
  const root = freshProject('cache-url');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(url, 'https://example.com/red.png');
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => PNG_1x1_RED.buffer.slice(
        PNG_1x1_RED.byteOffset,
        PNG_1x1_RED.byteOffset + PNG_1x1_RED.byteLength,
      ),
    };
  };
  try {
    const result = await loadAndCache('https://example.com/red.png', root);
    const expectedSha = createHash('sha256').update(PNG_1x1_RED).digest('hex');
    assert.equal(result.kind, 'url');
    assert.equal(result.sha256, expectedSha);
    assert.ok(existsSync(result.cachePath));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('loadAndCache: HTTP error throws with status code', { skip: !SHARP_AVAILABLE }, async () => {
  const root = freshProject('http-error');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) });
  try {
    await assert.rejects(
      () => loadAndCache('https://example.com/missing.png', root),
      /HTTP 404/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('loadAndCache: missing local path throws', { skip: !SHARP_AVAILABLE }, async () => {
  const root = freshProject('missing-file');
  await assert.rejects(
    () => loadAndCache(join(TMP_ROOT, 'does-not-exist.png'), root),
    /File not found/,
  );
});

test('extractPalette: 1×1 red PNG yields red-dominant palette + warm temperature', { skip: !SHARP_AVAILABLE }, async () => {
  const root = freshProject('palette-red');
  const fixturePath = join(TMP_ROOT, 'palette-red.png');
  writeFileSync(fixturePath, PNG_1x1_RED);

  const result = await extractPalette({ source: fixturePath, projectRoot: root });

  // Source metadata
  assert.equal(result.source.kind, 'path');
  assert.equal(typeof result.source.sha256, 'string');
  assert.equal(result.source.sha256.length, 64);
  assert.ok(existsSync(result.source.cached_at_path));

  // Palette: at least one swatch must be non-null. For a 1×1 image only the
  // single dominant color exists; the histogram fallback may leave some buckets
  // null, which is the contract.
  const allSwatches = Object.values(result.palette);
  const validSwatches = allSwatches.filter(Boolean);
  assert.ok(validSwatches.length >= 1, 'expected at least one valid swatch');

  // Every non-null swatch must have valid OKLCh numbers.
  for (const sw of validSwatches) {
    assert.ok(Number.isFinite(sw.l), `l should be finite, got ${sw.l}`);
    assert.ok(Number.isFinite(sw.c), `c should be finite, got ${sw.c}`);
    assert.ok(Number.isFinite(sw.h), `h should be finite, got ${sw.h}`);
    assert.match(sw.hex_fallback, /^#[0-9a-f]{6}$/);
  }

  // 1×1 red → mean hue near red anchor (~29°) → warm temperature.
  assert.equal(result.temperature, 'warm');

  // mean_saturation must be in [0,1].
  assert.ok(result.mean_saturation >= 0 && result.mean_saturation <= 1,
    `mean_saturation out of range: ${result.mean_saturation}`);

  // palette_method must be either 'node-vibrant' or 'histogram'.
  assert.ok(
    ['node-vibrant', 'histogram'].includes(result.source_meta.palette_method),
    `unexpected palette_method: ${result.source_meta.palette_method}`,
  );
});

test('extractPalette: 1×1 blue PNG yields cool temperature', { skip: !SHARP_AVAILABLE }, async () => {
  const root = freshProject('palette-blue');
  const fixturePath = join(TMP_ROOT, 'palette-blue.png');
  writeFileSync(fixturePath, PNG_1x1_BLUE);

  const result = await extractPalette({ source: fixturePath, projectRoot: root });
  assert.equal(result.temperature, 'cool');
});

test('extractPalette: dimensions reflect (no-op) resize for 1×1 input', { skip: !SHARP_AVAILABLE }, async () => {
  const root = freshProject('palette-dim');
  const fixturePath = join(TMP_ROOT, 'palette-dim.png');
  writeFileSync(fixturePath, PNG_1x1_RED);

  const result = await extractPalette({ source: fixturePath, projectRoot: root });
  assert.equal(result.source_meta.dimensions.original.width,  1);
  assert.equal(result.source_meta.dimensions.original.height, 1);
  // 1×1 is below the 800px cap, so the resized dimensions equal the original.
  assert.equal(result.source_meta.dimensions.width,  1);
  assert.equal(result.source_meta.dimensions.height, 1);
});

test('extractPalette: rejects empty source', async () => {
  await assert.rejects(
    () => extractPalette({ source: '', projectRoot: '/tmp' }),
    /source must be a non-empty string/,
  );
});

test('extractPalette: rejects missing projectRoot', async () => {
  await assert.rejects(
    () => extractPalette({ source: 'foo.png' }),
    /projectRoot is required/,
  );
});
