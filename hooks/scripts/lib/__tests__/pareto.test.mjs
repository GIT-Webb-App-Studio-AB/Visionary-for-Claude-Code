// Run: node --test hooks/scripts/lib/__tests__/pareto.test.mjs
//
// Verifies frontier add/supersede semantics on a real tmpdir. Cross-checks
// the emitted entries against the pareto-frontier-entry schema.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  proposeFrontierUpdate,
  readFrontier,
  frontierPath,
  ALL_DIMENSIONS,
} from '../pareto.mjs';
import { validate } from '../validate-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..', '..');
const schema = JSON.parse(readFileSync(
  join(repoRoot, 'skills', 'visionary', 'schemas', 'pareto-frontier-entry.schema.json'),
  'utf8',
));

function mkProject() {
  const dir = mkdtempSync(join(tmpdir(), 'pareto-test-'));
  writeFileSync(join(dir, 'package.json'), '{}');
  return dir;
}

const HASH_A = 'sha256:' + 'a'.repeat(16);
const HASH_B = 'sha256:' + 'b'.repeat(16);
const HASH_C = 'sha256:' + 'c'.repeat(16);

// ── First entry ─────────────────────────────────────────────────────────────
test('first entry wins on all provided dimensions', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  const result = proposeFrontierUpdate({
    criticIdentity: 'craft',
    promptHash: HASH_A,
    sampleCount: 12,
    spearmanRhoPerDim: { hierarchy: 0.7, layout: 0.6, typography: 0.75 },
    projectRoot: root,
  });
  assert.equal(result.added, true);
  assert.deepEqual(result.entry.wins_on_dimensions.sort(), ['hierarchy', 'layout', 'typography']);
});

test('entry schema matches pareto-frontier-entry.schema.json', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  proposeFrontierUpdate({
    criticIdentity: 'aesthetic',
    promptHash: HASH_A,
    sampleCount: 8,
    spearmanRhoPerDim: { distinctiveness: 0.55, motion_readiness: 0.7 },
    projectRoot: root,
    notes: ['fit on sprint 6 gold-set'],
  });
  const { items } = readFrontier(root);
  for (const entry of items) {
    const res = validate(entry, schema);
    assert.equal(res.ok, true, `schema errors for ${entry.id}: ${JSON.stringify(res.errors)}`);
  }
});

// ── Beats on some dimensions ────────────────────────────────────────────────
test('second entry wins only on dimensions where rho exceeds incumbent', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  proposeFrontierUpdate({
    criticIdentity: 'craft', promptHash: HASH_A, sampleCount: 10,
    spearmanRhoPerDim: { hierarchy: 0.7, layout: 0.6, typography: 0.75 },
    projectRoot: root,
  });
  const result = proposeFrontierUpdate({
    criticIdentity: 'craft', promptHash: HASH_B, sampleCount: 10,
    spearmanRhoPerDim: { hierarchy: 0.8, layout: 0.5, typography: 0.75 }, // wins only hierarchy
    projectRoot: root,
  });
  assert.equal(result.added, true);
  assert.deepEqual(result.entry.wins_on_dimensions, ['hierarchy']);
  // Incumbent's layout win survives
  const { items } = readFrontier(root);
  const first = items.find((e) => e.prompt_hash === HASH_A);
  assert.ok(first.wins_on_dimensions.includes('layout'));
});

// ── Full supersession ───────────────────────────────────────────────────────
test('new entry that beats on ALL incumbent wins marks incumbent as superseded', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  proposeFrontierUpdate({
    criticIdentity: 'craft', promptHash: HASH_A, sampleCount: 10,
    spearmanRhoPerDim: { hierarchy: 0.7, layout: 0.6 },
    projectRoot: root,
  });
  const result = proposeFrontierUpdate({
    criticIdentity: 'craft', promptHash: HASH_B, sampleCount: 10,
    spearmanRhoPerDim: { hierarchy: 0.8, layout: 0.7 },  // beats both
    projectRoot: root,
  });
  assert.equal(result.added, true);
  assert.equal(result.superseded.length, 1);
  const { items } = readFrontier(root);
  const superseded = items.find((e) => e.prompt_hash === HASH_A);
  assert.equal(superseded.superseded_by, result.entry.id);
});

// ── No-win path ─────────────────────────────────────────────────────────────
test('proposal that wins nothing is not added', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  proposeFrontierUpdate({
    criticIdentity: 'craft', promptHash: HASH_A, sampleCount: 10,
    spearmanRhoPerDim: { hierarchy: 0.8, layout: 0.7, typography: 0.75 },
    projectRoot: root,
  });
  const result = proposeFrontierUpdate({
    criticIdentity: 'craft', promptHash: HASH_B, sampleCount: 10,
    spearmanRhoPerDim: { hierarchy: 0.5, layout: 0.3 },   // worse on all
    projectRoot: root,
  });
  assert.equal(result.added, false);
  assert.match(result.skipped_reason || '', /wins no dimensions/);
});

// ── Ties go to incumbent ────────────────────────────────────────────────────
test('tied rho values do not unseat the incumbent', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  proposeFrontierUpdate({
    criticIdentity: 'craft', promptHash: HASH_A, sampleCount: 10,
    spearmanRhoPerDim: { hierarchy: 0.7 },
    projectRoot: root,
  });
  const result = proposeFrontierUpdate({
    criticIdentity: 'craft', promptHash: HASH_B, sampleCount: 10,
    spearmanRhoPerDim: { hierarchy: 0.7 },  // exact tie
    projectRoot: root,
  });
  assert.equal(result.added, false);
});

// ── Identity isolation ──────────────────────────────────────────────────────
test('craft and aesthetic frontiers are independent', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  proposeFrontierUpdate({
    criticIdentity: 'craft', promptHash: HASH_A, sampleCount: 10,
    spearmanRhoPerDim: { typography: 0.8 },
    projectRoot: root,
  });
  const result = proposeFrontierUpdate({
    criticIdentity: 'aesthetic', promptHash: HASH_B, sampleCount: 10,
    spearmanRhoPerDim: { typography: 0.5 },  // lower than craft but aesthetic frontier is empty
    projectRoot: root,
  });
  assert.equal(result.added, true);
});

// ── Input validation ────────────────────────────────────────────────────────
test('invalid prompt_hash is rejected', () => {
  const root = mkProject();
  const result = proposeFrontierUpdate({
    criticIdentity: 'craft', promptHash: 'not-a-valid-hash', sampleCount: 10,
    spearmanRhoPerDim: { hierarchy: 0.8 },
    projectRoot: root,
  });
  assert.equal(result.added, false);
  assert.match(result.skipped_reason, /prompt_hash/);
});

test('sample_count < 3 is rejected', () => {
  const root = mkProject();
  const result = proposeFrontierUpdate({
    criticIdentity: 'craft', promptHash: HASH_A, sampleCount: 2,
    spearmanRhoPerDim: { hierarchy: 0.8 },
    projectRoot: root,
  });
  assert.equal(result.added, false);
  assert.match(result.skipped_reason, /sample_count/);
});

test('unknown critic_identity is rejected', () => {
  const root = mkProject();
  const result = proposeFrontierUpdate({
    criticIdentity: 'made-up', promptHash: HASH_A, sampleCount: 10,
    spearmanRhoPerDim: { hierarchy: 0.8 },
    projectRoot: root,
  });
  assert.equal(result.added, false);
  assert.match(result.skipped_reason, /critic_identity/);
});

// ── opt-out ────────────────────────────────────────────────────────────────
test('VISIONARY_DISABLE_TASTE short-circuits the proposal', () => {
  const root = mkProject();
  process.env.VISIONARY_DISABLE_TASTE = '1';
  try {
    const result = proposeFrontierUpdate({
      criticIdentity: 'craft', promptHash: HASH_A, sampleCount: 10,
      spearmanRhoPerDim: { hierarchy: 0.8 },
      projectRoot: root,
    });
    assert.equal(result.added, false);
    assert.equal(result.skipped_reason, 'taste-disabled');
  } finally {
    delete process.env.VISIONARY_DISABLE_TASTE;
  }
});
