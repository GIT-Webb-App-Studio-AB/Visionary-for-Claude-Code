// Run: node --test hooks/scripts/lib/__tests__/accepted-store.test.mjs
//
// Exercises acceptance detection + on-disk storage + rotation against a
// real tmpdir. No mocks — we want the fsync + rename dance to run.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  detectAcceptance,
  recordAcceptance,
  listAcceptedExamples,
  rotateAcceptedExamples,
  acceptedExamplesPath,
  screenshotsDir,
  MAX_ENTRIES,
  IMPLICIT_COMPOSITE_THRESHOLD,
} from '../accepted-store.mjs';

// ── Helpers ─────────────────────────────────────────────────────────────────
function mkProject() {
  const dir = mkdtempSync(join(tmpdir(), 'accstore-test-'));
  writeFileSync(join(dir, 'package.json'), '{}');
  return dir;
}

function fakeScreenshot(dir) {
  const path = join(dir, 'fake-shot.png');
  // 1-byte PNG-ish file — we don't verify contents, just existence.
  writeFileSync(path, Buffer.from([0x89, 0x50, 0x4E, 0x47]));
  return path;
}

function fakeCritique(overrides = {}) {
  return {
    round: 2,
    scores: {
      hierarchy: 8.5, layout: 8.0, typography: 8.5, contrast: 9.0,
      distinctiveness: 8.0, brief_conformance: 9.0, accessibility: 9.0,
      motion_readiness: 7.5, craft_measurable: 8.3, content_resilience: 8.0,
    },
    ...overrides,
  };
}

// ── detectAcceptance ────────────────────────────────────────────────────────
test('detectAcceptance: explicit phrase wins over implicit composite', () => {
  const r = detectAcceptance({
    critique: fakeCritique(),
    userText: 'ship it',
    pairwisePick: false,
  });
  assert.equal(r.accepted, true);
  assert.equal(r.kind, 'explicit');
});

test('detectAcceptance: pairwise_pick outranks implicit', () => {
  const r = detectAcceptance({
    critique: fakeCritique({ scores: { hierarchy: 9, layout: 9, typography: 9, contrast: 9, distinctiveness: 9, brief_conformance: 9, accessibility: 9, motion_readiness: 9, craft_measurable: 9, content_resilience: 9 } }),
    pairwisePick: true,
  });
  assert.equal(r.accepted, true);
  assert.equal(r.kind, 'pairwise_pick');
});

test('detectAcceptance: implicit fires above threshold', () => {
  const r = detectAcceptance({ critique: fakeCritique() });
  assert.equal(r.accepted, true);
  assert.equal(r.kind, 'implicit');
  assert.ok(r.composite >= IMPLICIT_COMPOSITE_THRESHOLD);
});

test('detectAcceptance: low-composite rejection', () => {
  const r = detectAcceptance({
    critique: fakeCritique({ scores: { hierarchy: 4, layout: 5, typography: 5, contrast: 5, distinctiveness: 4, brief_conformance: 5, accessibility: 4, motion_readiness: 3, craft_measurable: 4, content_resilience: 5 } }),
  });
  assert.equal(r.accepted, false);
});

test('detectAcceptance: no critique returns accepted=false gracefully', () => {
  const r = detectAcceptance({});
  assert.equal(r.accepted, false);
});

// ── recordAcceptance ────────────────────────────────────────────────────────
test('recordAcceptance writes JSONL entry with embedding + copies screenshot', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  const shotPath = fakeScreenshot(root);
  const result = recordAcceptance({
    projectRoot: root,
    briefSummary: 'A pricing page for B2B SaaS with three tiers',
    screenshotSourcePath: shotPath,
    critique: fakeCritique(),
    styleId: 'editorial-serif-revival',
    productArchetype: 'marketing',
    componentType: 'pricing',
    acceptanceKind: 'implicit',
  });
  assert.ok(result.id, `got ${JSON.stringify(result)}`);
  assert.equal(result.screenshot_copied, true);
  // JSONL file created
  const body = readFileSync(acceptedExamplesPath(root), 'utf8');
  const line = JSON.parse(body.trim());
  assert.equal(line.style_id, 'editorial-serif-revival');
  assert.equal(line.product_archetype, 'marketing');
  assert.equal(line.embedder_id, 'hashed-ngram-v1');
  assert.equal(line.brief_embedding.length, 384);
  assert.ok(line.screenshot_path.includes('taste/screenshots/'));
  // Screenshot copied to target
  assert.equal(existsSync(join(root, line.screenshot_path)), true);
});

test('recordAcceptance skips when VISIONARY_DISABLE_TASTE=1', () => {
  const root = mkProject();
  process.env.VISIONARY_DISABLE_TASTE = '1';
  try {
    const result = recordAcceptance({
      projectRoot: root,
      briefSummary: 'brief',
      critique: fakeCritique(),
      styleId: 'x',
    });
    assert.equal(result.skipped, 'taste-disabled');
    assert.equal(existsSync(acceptedExamplesPath(root)), false);
  } finally {
    delete process.env.VISIONARY_DISABLE_TASTE;
  }
});

test('recordAcceptance tolerates missing screenshot source', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  const result = recordAcceptance({
    projectRoot: root,
    briefSummary: 'brief',
    screenshotSourcePath: join(root, 'does-not-exist.png'),
    critique: fakeCritique(),
    styleId: 's',
  });
  assert.ok(result.id);
  assert.equal(result.screenshot_copied, false);
});

// ── Rotation ────────────────────────────────────────────────────────────────
test('rotateAcceptedExamples evicts oldest entry from overrepresented archetype', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  // Seed 55 entries: 30 marketing, 15 dashboard, 10 editorial. Marketing
  // should lose the oldest 5 entries when rotation trims to 50.
  const totals = { marketing: 30, dashboard: 15, editorial: 10 };
  let dayIdx = 0;
  for (const [arch, n] of Object.entries(totals)) {
    for (let i = 0; i < n; i++) {
      dayIdx++;
      const now = new Date(Date.UTC(2026, 3, dayIdx));
      recordAcceptance({
        projectRoot: root,
        briefSummary: `${arch} brief ${i}`,
        critique: fakeCritique(),
        styleId: `${arch}-style`,
        productArchetype: arch,
        now,
      });
    }
  }
  // After 55 appends, rotation has run automatically as part of each recordAcceptance.
  // But each recordAcceptance call evicts *down to 50*, not all at once — let's force
  // a final rotation and verify the invariant holds.
  const result = rotateAcceptedExamples(root);
  const { items } = listAcceptedExamples(root);
  assert.ok(items.length <= MAX_ENTRIES, `expected <= ${MAX_ENTRIES}, got ${items.length}`);
  const counts = items.reduce((acc, e) => { acc[e.product_archetype] = (acc[e.product_archetype] || 0) + 1; return acc; }, {});
  // Marketing should have lost entries — not be the only archetype represented.
  assert.ok(counts.marketing < 30);
  // Diversity preserved: all three archetypes still present.
  assert.ok(counts.dashboard > 0);
  assert.ok(counts.editorial > 0);
  // Result metadata reflects the rotation
  assert.ok(result.before >= result.after);
});

// ── listAcceptedExamples ────────────────────────────────────────────────────
test('listAcceptedExamples filters entries by embedder_id', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  // Write one current-embedder entry via recordAcceptance and one old-embedder
  // entry directly.
  recordAcceptance({
    projectRoot: root,
    briefSummary: 'current',
    critique: fakeCritique(),
    styleId: 'x',
    productArchetype: 'marketing',
  });
  const line = {
    id: 'LEGACY',
    brief_summary: 'legacy',
    brief_embedding: new Array(768).fill(0), // wrong dim, wrong id
    embedder_id: 'legacy-embedder',
    style_id: 'old',
    final_scores: {},
    screenshot_path: 'taste/screenshots/LEGACY.png',
    accepted_at: new Date().toISOString(),
  };
  const body = readFileSync(acceptedExamplesPath(root), 'utf8') + JSON.stringify(line) + '\n';
  writeFileSync(acceptedExamplesPath(root), body, 'utf8');

  const current = listAcceptedExamples(root);
  assert.equal(current.items.length, 1);
  assert.equal(current.skipped, 1);

  const all = listAcceptedExamples(root, { allEmbedders: true });
  assert.equal(all.items.length, 2);
});
