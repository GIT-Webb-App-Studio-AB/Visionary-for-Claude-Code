// Run: node --test hooks/scripts/lib/__tests__/anti-anchors.test.mjs
//
// Sprint 08 Task 23.4. Covers the loader, style-family selection, and
// prompt-block builder. Uses a synthetic on-disk catalogue in tmpdir so
// tests don't depend on the state of docs/slop-anchors/ images being
// curated yet (they're PLACEHOLDER by design at this point).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  loadAntiAnchors,
  selectForStyle,
  buildAntiAnchorBlock,
  buildBlockForStyle,
  _clearCacheForTest,
  DEFAULT_ANCHOR_COUNT,
} from '../anti-anchors.mjs';

function mkCatalogue(entries) {
  const root = mkdtempSync(join(tmpdir(), 'anti-anchor-test-'));
  for (const entry of entries) {
    const dir = join(root, entry.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({
      category: entry.slug,
      description: entry.description || 'test category',
      avoid_reasoning: entry.reasoning || 'test reasoning',
      avoid_families: entry.families || [],
      excludes_styles: entry.excludesStyles || [],
      images: (entry.images || []).map((file, i) => ({ file, caption: `image ${i + 1}` })),
    }, null, 2));
    for (const img of (entry.actualImages || [])) {
      writeFileSync(join(dir, img), 'fake-image-bytes');
    }
  }
  return root;
}

// ── loadAntiAnchors ─────────────────────────────────────────────────────────
test('loadAntiAnchors reads categories with manifest.json', () => {
  _clearCacheForTest();
  const root = mkCatalogue([
    { slug: 'cat-a', description: 'A', families: ['saas'], images: ['1.png'], actualImages: ['1.png'] },
    { slug: 'cat-b', description: 'B', families: ['editorial'], images: ['1.png'], actualImages: [] },
  ]);
  const cats = loadAntiAnchors(root);
  assert.equal(cats.length, 2);
  const a = cats.find((c) => c.category === 'cat-a');
  const b = cats.find((c) => c.category === 'cat-b');
  assert.equal(a.complete, true, 'cat-a has image on disk');
  assert.equal(b.complete, false, 'cat-b manifest lists image but file missing');
});

test('loadAntiAnchors tolerates a missing root dir', () => {
  _clearCacheForTest();
  const cats = loadAntiAnchors(join(tmpdir(), 'does-not-exist-' + Date.now()));
  assert.deepEqual(cats, []);
});

test('loadAntiAnchors skips categories without manifest.json', () => {
  _clearCacheForTest();
  const root = mkdtempSync(join(tmpdir(), 'anti-anchor-nomanifest-'));
  mkdirSync(join(root, 'stray-dir'), { recursive: true });
  writeFileSync(join(root, 'stray-dir', 'random.txt'), 'not a manifest');
  const cats = loadAntiAnchors(root);
  assert.equal(cats.length, 0);
});

// ── selectForStyle ──────────────────────────────────────────────────────────
test('selectForStyle ranks by family-overlap score', () => {
  _clearCacheForTest();
  const root = mkCatalogue([
    { slug: 'saas-slop',       families: ['saas', 'marketing'],   images: ['a.png'], actualImages: ['a.png'] },
    { slug: 'editorial-slop',  families: ['editorial'],           images: ['a.png'], actualImages: ['a.png'] },
    { slug: 'dashboard-slop',  families: ['dashboard'],           images: ['a.png'], actualImages: ['a.png'] },
  ]);
  const anchors = loadAntiAnchors(root);
  const picked = selectForStyle({ styleFamily: ['saas', 'b2b'], count: 2, anchors });
  assert.equal(picked.length, 2);
  // Top match should be the saas-slop (score 1, overlap on 'saas')
  assert.equal(picked[0].category, 'saas-slop');
});

test('selectForStyle skips categories in excludes_styles', () => {
  _clearCacheForTest();
  const root = mkCatalogue([
    { slug: 'cyan-slop',  families: ['dashboard'], excludesStyles: ['neon-dystopia'], images: ['a.png'], actualImages: ['a.png'] },
    { slug: 'other-slop', families: ['saas'],                                           images: ['a.png'], actualImages: ['a.png'] },
  ]);
  const anchors = loadAntiAnchors(root);
  const picked = selectForStyle({ styleId: 'neon-dystopia', styleFamily: ['dashboard', 'saas'], count: 5, anchors });
  // cyan-slop is excluded; only other-slop should surface.
  assert.equal(picked.length, 1);
  assert.equal(picked[0].category, 'other-slop');
});

test('selectForStyle returns empty when no complete categories', () => {
  _clearCacheForTest();
  const root = mkCatalogue([
    { slug: 'incomplete-a', families: ['saas'], images: ['a.png'], actualImages: [] },
    { slug: 'incomplete-b', families: ['saas'], images: ['a.png'], actualImages: [] },
  ]);
  const anchors = loadAntiAnchors(root);
  const picked = selectForStyle({ styleFamily: ['saas'], count: 2, anchors });
  assert.deepEqual(picked, []);
});

test('selectForStyle handles missing family gracefully', () => {
  _clearCacheForTest();
  const root = mkCatalogue([
    { slug: 'z-cat', families: ['saas'],     images: ['a.png'], actualImages: ['a.png'] },
    { slug: 'a-cat', families: ['editorial'], images: ['a.png'], actualImages: ['a.png'] },
  ]);
  const anchors = loadAntiAnchors(root);
  const picked = selectForStyle({ styleFamily: [], count: 2, anchors });
  // No overlap → alphabetical order, both returned
  assert.equal(picked.length, 2);
  assert.equal(picked[0].category, 'a-cat');
});

// ── buildAntiAnchorBlock ────────────────────────────────────────────────────
test('buildAntiAnchorBlock produces markdown with image paths', () => {
  _clearCacheForTest();
  const root = mkCatalogue([
    { slug: 'saas-slop', description: 'Saas slop desc', reasoning: 'Generic reason', families: ['saas'], images: ['ex1.png', 'ex2.png'], actualImages: ['ex1.png', 'ex2.png'] },
  ]);
  const anchors = loadAntiAnchors(root);
  const block = buildAntiAnchorBlock(anchors);
  assert.match(block, /NEGATIVE visual anchors/);
  assert.match(block, /saas-slop/);
  assert.match(block, /Generic reason/);
  assert.match(block, /ex1\.png/);
});

test('buildAntiAnchorBlock returns empty string for empty selection', () => {
  assert.equal(buildAntiAnchorBlock([]), '');
  assert.equal(buildAntiAnchorBlock(null), '');
});

test('buildAntiAnchorBlock can omit image paths', () => {
  _clearCacheForTest();
  const root = mkCatalogue([
    { slug: 'cat-a', families: [], images: ['x.png'], actualImages: ['x.png'] },
  ]);
  const anchors = loadAntiAnchors(root);
  const block = buildAntiAnchorBlock(anchors, { includeImagePaths: false });
  assert.match(block, /cat-a/);
  assert.doesNotMatch(block, /x\.png/);
});

// ── buildBlockForStyle convenience ──────────────────────────────────────────
test('buildBlockForStyle combines load + select + build', () => {
  _clearCacheForTest();
  const root = mkCatalogue([
    { slug: 'saas-slop',      description: 'saas',      families: ['saas'],      images: ['a.png'], actualImages: ['a.png'] },
    { slug: 'editorial-slop', description: 'editorial', families: ['editorial'], images: ['a.png'], actualImages: ['a.png'] },
  ]);
  const block = buildBlockForStyle({ styleFamily: ['saas'], count: 1, anchorsDir: root });
  assert.match(block, /saas-slop/);
  assert.doesNotMatch(block, /editorial-slop/);
});

test('buildBlockForStyle returns empty when catalogue has no complete entries', () => {
  _clearCacheForTest();
  const root = mkCatalogue([
    { slug: 'incomplete', families: ['saas'], images: ['a.png'], actualImages: [] },
  ]);
  const block = buildBlockForStyle({ styleFamily: ['saas'], anchorsDir: root });
  assert.equal(block, '');
});

test('DEFAULT_ANCHOR_COUNT is a sensible small integer', () => {
  assert.ok(Number.isInteger(DEFAULT_ANCHOR_COUNT));
  assert.ok(DEFAULT_ANCHOR_COUNT >= 1 && DEFAULT_ANCHOR_COUNT <= 5);
});
