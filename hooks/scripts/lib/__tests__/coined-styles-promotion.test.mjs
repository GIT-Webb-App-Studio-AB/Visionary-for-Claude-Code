// Run: node --test hooks/scripts/lib/__tests__/coined-styles-promotion.test.mjs
//
// Sprint 21 Task 38.4 — promotion logic on top of Sprint 17 stub.
//
// Covers:
//   - updateAcceptanceCount: similarity dedup vs new-entry path
//   - checkPromotion: count + maturity gates, already-promoted skip
//   - generateAutoName: deterministic kebab name
//   - promoteToCatalog: markdown + index update + JSONL promoted_at mark
//   - ejectFromCatalog: file removed, JSONL kept (promoted_at cleared)
//   - renameCoinedEntry: file renamed, index updated
//   - listCoinedEntries: enriched with age_days + ready_for_promotion
//
// Tests use os.tmpdir() for both the JSONL path and a synthetic stylesDir
// so we never touch the real catalog under skills/visionary/styles/.

import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  existsSync,
  writeFileSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  updateAcceptanceCount,
  checkPromotion,
  generateAutoName,
  promoteToCatalog,
  ejectFromCatalog,
  renameCoinedEntry,
  listCoinedEntries,
  readCoinedStyles,
  PROMOTION_THRESHOLD_COUNT,
  PROMOTION_MATURITY_DAYS,
} from '../coined-styles.mjs';

let tmpRoot;
let stylesDir;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'coined-promo-test-'));
  stylesDir = mkdtempSync(join(tmpdir(), 'coined-styles-dir-'));
  mkdirSync(join(stylesDir, 'extended'), { recursive: true });
  // Seed a minimal _index.md so append/remove are exercised.
  writeFileSync(
    join(stylesDir, '_index.md'),
    '# Visual Style Index\n\n## Existing\n- **paper-cut** — sample\n',
    'utf8',
  );
  delete process.env.VISIONARY_COINED_STYLES_PATH;
  delete process.env.VISIONARY_STYLES_DIR;
});

afterEach(() => {
  for (const dir of [tmpRoot, stylesDir]) {
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  }
  delete process.env.VISIONARY_COINED_STYLES_PATH;
  delete process.env.VISIONARY_STYLES_DIR;
});

// VECTOR_A: chroma is the most extreme axis (|0.95-0.5|=0.45), all others ≤
// 0.2 from 0.5. So generateAutoName → "vibrant-<anchor-suffix>".
const VECTOR_A = {
  density: 0.5,
  chroma: 0.95,
  formality: 0.5,
  motion_intensity: 0.4,
  historicism: 0.6,
  texture: 0.45,
  contrast_energy: 0.55,
  type_drama: 0.5,
};

// Visually-equivalent vector — small perturbation, same direction in 8D, so
// cosine ≥ 0.85 to trigger the dedup path in updateAcceptanceCount.
const VECTOR_A_SIMILAR = {
  density: 0.51,
  chroma: 0.94,
  formality: 0.5,
  motion_intensity: 0.4,
  historicism: 0.59,
  texture: 0.45,
  contrast_energy: 0.56,
  type_drama: 0.5,
};

// Distinctly different vector — high motion + low formality + texture, so
// cosine < 0.85 and we get a new entry, not a count bump.
const VECTOR_B = {
  density: 0.2,
  chroma: 0.2,
  formality: 0.1,
  motion_intensity: 0.95,
  historicism: 0.1,
  texture: 0.9,
  contrast_energy: 0.2,
  type_drama: 0.9,
};

const RECIPE_A = [
  { id: 'swiss-rationalism', weight: 0.7 },
  { id: 'liminal-space', weight: 0.3 },
];

const RECIPE_B = [
  { id: 'synthwave', weight: 0.6 },
  { id: 'cottagecore', weight: 0.4 },
];

// ── 1. updateAcceptanceCount — new vector creates entry ────────────────────

test('updateAcceptanceCount: new vector creates a new entry', () => {
  const r = updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-01T00:00:00Z'),
  });
  assert.equal(r.mode, 'created');
  assert.ok(r.entry.id.startsWith('coined-'));
  assert.equal(r.entry.accepted_count, 1);

  const all = readCoinedStyles(tmpRoot);
  assert.equal(all.length, 1);
});

// ── 2. updateAcceptanceCount — similar vector bumps count ──────────────────

test('updateAcceptanceCount: vector-similar acceptance bumps count, not new entry', () => {
  // First acceptance.
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-01T00:00:00Z'),
  });
  // Second acceptance with a slightly perturbed vector.
  const r2 = updateAcceptanceCount({
    vector: VECTOR_A_SIMILAR,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-08T00:00:00Z'),
  });
  assert.equal(r2.mode, 'updated', `expected updated, got ${r2.mode}`);
  assert.equal(r2.entry.accepted_count, 2);
  assert.equal(r2.entry.last_seen, '2026-05-08T00:00:00.000Z');
  assert.equal(r2.entry.first_seen, '2026-05-01T00:00:00.000Z');

  const all = readCoinedStyles(tmpRoot);
  assert.equal(all.length, 1, 'similar vector should not create second entry');
});

// ── 3. updateAcceptanceCount — distinct vector creates separate entry ──────

test('updateAcceptanceCount: distinct vector creates a separate entry', () => {
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
  });
  updateAcceptanceCount({
    vector: VECTOR_B,
    anchor_recipe: RECIPE_B,
    projectRoot: tmpRoot,
  });
  const all = readCoinedStyles(tmpRoot);
  assert.equal(all.length, 2);
});

// ── 4. checkPromotion — count below threshold → not eligible ───────────────

test('checkPromotion: count below threshold → entry not eligible', () => {
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-04-01T00:00:00Z'),
  });
  // Only 1 acceptance → never eligible regardless of age.
  const eligible = checkPromotion(tmpRoot, new Date('2026-06-01T00:00:00Z'));
  assert.equal(eligible.length, 0);
});

// ── 5. checkPromotion — age below maturity → not eligible ──────────────────

test('checkPromotion: 3 acceptances within 1 day → not eligible (maturity gate)', () => {
  const day = '2026-05-01T';
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date(day + '08:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A_SIMILAR,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date(day + '12:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date(day + '20:00:00Z'),
  });
  const all = readCoinedStyles(tmpRoot);
  assert.equal(all.length, 1);
  assert.equal(all[0].accepted_count, 3, 'should be 3 acceptances');

  // Same day — maturity gate fails.
  const eligible = checkPromotion(tmpRoot, new Date('2026-05-01T23:00:00Z'));
  assert.equal(eligible.length, 0, 'maturity gate should reject same-day promotion');
});

// ── 6. checkPromotion — both gates met → eligible ──────────────────────────

test('checkPromotion: count≥3 AND age≥7d → eligible', () => {
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-01T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A_SIMILAR,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-05T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-09T00:00:00Z'),
  });
  // 8 days after first_seen.
  const eligible = checkPromotion(tmpRoot, new Date('2026-05-09T01:00:00Z'));
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].accepted_count, 3);
});

// ── 7. checkPromotion — already-promoted entries are skipped ───────────────

test('checkPromotion: entries with promoted_at are skipped', () => {
  // Build a JSONL by hand with a promoted entry that would otherwise qualify.
  const path = join(tmpRoot, 'taste', 'coined-styles.jsonl');
  mkdirSync(join(tmpRoot, 'taste'), { recursive: true });
  const promoted = {
    id: 'coined-promoted',
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    accepted_count: 5,
    first_seen: '2026-04-01T00:00:00Z',
    last_seen: '2026-04-20T00:00:00Z',
    promoted_at: '2026-04-25T00:00:00Z',
    name: 'vibrant-rationalism',
  };
  const ready = {
    id: 'coined-ready',
    vector: VECTOR_B,
    anchor_recipe: RECIPE_B,
    accepted_count: 3,
    first_seen: '2026-04-01T00:00:00Z',
    last_seen: '2026-04-20T00:00:00Z',
    name: null,
  };
  writeFileSync(
    path,
    JSON.stringify(promoted) + '\n' + JSON.stringify(ready) + '\n',
    'utf8',
  );
  const eligible = checkPromotion(tmpRoot, new Date('2026-05-01T00:00:00Z'));
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].id, 'coined-ready');
});

// ── 8. generateAutoName — deterministic + kebab-case 2-word name ───────────

test('generateAutoName: deterministic kebab name from dominant axis + anchor', () => {
  // Chroma is the most extreme axis (0.7 → 0.2 from 0.5). It maps to "vibrant".
  // Heaviest anchor is swiss-rationalism, last segment "rationalism".
  const entry = { id: 'coined-x', vector: VECTOR_A, anchor_recipe: RECIPE_A };
  const n1 = generateAutoName(entry);
  const n2 = generateAutoName(entry);
  assert.equal(n1, n2, 'deterministic');
  assert.match(n1, /^[a-z]+-[a-z]+$/, 'two-word kebab');
  assert.equal(n1, 'vibrant-rationalism');
});

test('generateAutoName: high motion → kinetic, low chroma → muted', () => {
  // VECTOR_B: motion_intensity 0.95 is most extreme (|0.95-0.5|=0.45 vs others).
  // Heaviest anchor synthwave → suffix "synthwave".
  const entry = { id: 'coined-y', vector: VECTOR_B, anchor_recipe: RECIPE_B };
  const n = generateAutoName(entry);
  assert.equal(n, 'kinetic-synthwave');
});

test('generateAutoName: degrades gracefully on missing anchor_recipe', () => {
  const entry = { id: 'coined-z', vector: VECTOR_A, anchor_recipe: [] };
  const n = generateAutoName(entry);
  // descriptor still computed, suffix falls back to "blend".
  assert.equal(n, 'vibrant-blend');
});

// ── 9. promoteToCatalog — happy path ───────────────────────────────────────

test('promoteToCatalog: writes markdown + updates _index.md + marks JSONL', () => {
  // Seed a ready-to-promote entry (3 acceptances, 8 days old).
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-01T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A_SIMILAR,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-05T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-09T00:00:00Z'),
  });

  const eligible = checkPromotion(tmpRoot, new Date('2026-05-10T00:00:00Z'));
  assert.equal(eligible.length, 1);

  const result = promoteToCatalog({
    entry: eligible[0],
    projectRoot: tmpRoot,
    stylesDir,
    now: new Date('2026-05-10T00:00:00Z'),
  });
  assert.equal(result.mode, 'promoted');
  assert.ok(result.path.endsWith('coined-vibrant-rationalism.md'));
  assert.ok(existsSync(result.path), 'markdown file should exist');

  // Front-matter sanity.
  const md = readFileSync(result.path, 'utf8');
  assert.match(md, /^---\n/);
  assert.match(md, /id: coined-vibrant-rationalism/);
  assert.match(md, /category: extended/);
  assert.match(md, /motion_tier: (Static|Subtle|Expressive|Kinetic)/);

  // _index.md updated with bullet line.
  const indexAfter = readFileSync(join(stylesDir, '_index.md'), 'utf8');
  assert.match(indexAfter, /## Coined Styles/);
  assert.match(indexAfter, /\*\*coined-vibrant-rationalism\*\*/);

  // JSONL: the entry now has promoted_at and name.
  const post = readCoinedStyles(tmpRoot);
  assert.equal(post.length, 1);
  assert.equal(post[0].name, 'vibrant-rationalism');
  assert.equal(post[0].promoted_at, '2026-05-10T00:00:00.000Z');
  assert.equal(post[0].promoted_filename, 'coined-vibrant-rationalism.md');
});

// ── 10. promoteToCatalog — re-promotion is blocked by checkPromotion ───────

test('promoteToCatalog: already-promoted entries skipped on next checkPromotion', () => {
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-01T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A_SIMILAR,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-05T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-09T00:00:00Z'),
  });
  const [entry] = checkPromotion(tmpRoot, new Date('2026-05-10T00:00:00Z'));
  promoteToCatalog({
    entry,
    projectRoot: tmpRoot,
    stylesDir,
    now: new Date('2026-05-10T00:00:00Z'),
  });
  // Second pass should find nothing.
  const eligible2 = checkPromotion(tmpRoot, new Date('2026-05-15T00:00:00Z'));
  assert.equal(eligible2.length, 0);
});

// ── 11. ejectFromCatalog — removes file, keeps JSONL entry ─────────────────

test('ejectFromCatalog: removes file + index line, keeps JSONL entry', () => {
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-01T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A_SIMILAR,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-05T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-09T00:00:00Z'),
  });
  const [entry] = checkPromotion(tmpRoot, new Date('2026-05-10T00:00:00Z'));
  const promoteResult = promoteToCatalog({
    entry,
    projectRoot: tmpRoot,
    stylesDir,
    now: new Date('2026-05-10T00:00:00Z'),
  });
  assert.equal(promoteResult.mode, 'promoted');

  const ejectResult = ejectFromCatalog({
    entryId: entry.id,
    projectRoot: tmpRoot,
    stylesDir,
  });
  assert.equal(ejectResult.mode, 'ejected');

  // File gone, _index line gone.
  assert.equal(existsSync(promoteResult.path), false);
  const indexAfter = readFileSync(join(stylesDir, '_index.md'), 'utf8');
  assert.equal(indexAfter.includes('**coined-vibrant-rationalism**'), false);

  // JSONL entry still there but promoted_at cleared.
  const post = readCoinedStyles(tmpRoot);
  assert.equal(post.length, 1);
  assert.equal(post[0].promoted_at, undefined);
});

// ── 12. renameCoinedEntry — file + index updated ───────────────────────────

test('renameCoinedEntry: renames file, updates index, keeps id stable', () => {
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-01T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A_SIMILAR,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-05T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-09T00:00:00Z'),
  });
  const [entry] = checkPromotion(tmpRoot, new Date('2026-05-10T00:00:00Z'));
  promoteToCatalog({
    entry,
    projectRoot: tmpRoot,
    stylesDir,
    now: new Date('2026-05-10T00:00:00Z'),
  });

  const renameResult = renameCoinedEntry({
    entryId: entry.id,
    newName: 'My Custom Name',
    projectRoot: tmpRoot,
    stylesDir,
  });
  assert.equal(renameResult.mode, 'renamed');
  assert.equal(renameResult.newFilename, 'coined-my-custom-name.md');

  // Old file gone, new file present.
  const oldPath = join(stylesDir, 'extended', 'coined-vibrant-rationalism.md');
  const newPath = join(stylesDir, 'extended', 'coined-my-custom-name.md');
  assert.equal(existsSync(oldPath), false);
  assert.equal(existsSync(newPath), true);

  // Index updated.
  const indexAfter = readFileSync(join(stylesDir, '_index.md'), 'utf8');
  assert.match(indexAfter, /\*\*coined-my-custom-name\*\*/);
  assert.equal(indexAfter.includes('**coined-vibrant-rationalism**'), false);

  // JSONL entry id stable, name updated.
  const post = readCoinedStyles(tmpRoot);
  assert.equal(post[0].id, entry.id);
  assert.equal(post[0].name, 'my-custom-name');
});

// ── 13. listCoinedEntries — enriches with age_days + ready_for_promotion ───

test('listCoinedEntries: returns enriched entries with age + readiness', () => {
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-01T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A_SIMILAR,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-05T00:00:00Z'),
  });
  updateAcceptanceCount({
    vector: VECTOR_A,
    anchor_recipe: RECIPE_A,
    projectRoot: tmpRoot,
    now: new Date('2026-05-09T00:00:00Z'),
  });
  const list = listCoinedEntries(tmpRoot, new Date('2026-05-10T00:00:00Z'));
  assert.equal(list.length, 1);
  assert.ok(list[0].age_days >= 9);
  assert.equal(list[0].ready_for_promotion, true);
  assert.equal(list[0].accepted_count, 3);
});

// ── 14. Sanity: PROMOTION_THRESHOLD_COUNT and DAYS exported ────────────────

test('exported constants match spec', () => {
  assert.equal(PROMOTION_THRESHOLD_COUNT, 3);
  assert.equal(PROMOTION_MATURITY_DAYS, 7);
});
