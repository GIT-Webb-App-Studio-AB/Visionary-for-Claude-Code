// Run: node --test hooks/scripts/lib/__tests__/rag-anchors.test.mjs
//
// Exercises RAG anchor production: cold-start fallback when history is
// small, top-k retrieval when history is sufficient, opt-out behaviour.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildAnchors, MIN_EXAMPLES_FOR_RAG } from '../rag-anchors.mjs';
import { recordAcceptance } from '../accepted-store.mjs';

function mkProject() {
  const dir = mkdtempSync(join(tmpdir(), 'rag-anchor-test-'));
  writeFileSync(join(dir, 'package.json'), '{}');
  return dir;
}

function sampleCritique() {
  return {
    round: 2,
    scores: {
      hierarchy: 8.5, layout: 8.0, typography: 8.5, contrast: 9.0,
      distinctiveness: 8.0, brief_conformance: 9.0, accessibility: 9.0,
      motion_readiness: 7.5, craft_measurable: 8.3, content_resilience: 8.0,
    },
  };
}

function seedExamples(root, briefs) {
  briefs.forEach((info, i) => {
    recordAcceptance({
      projectRoot: root,
      briefSummary: info.brief,
      critique: sampleCritique(),
      styleId: info.styleId || 'editorial-serif-revival',
      productArchetype: info.archetype || 'marketing',
      now: new Date(Date.UTC(2026, 3, i + 1)),
    });
  });
}

// ── Cold-start ──────────────────────────────────────────────────────────────
test('buildAnchors: cold-start returns designer-pack fallback below threshold', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  // 2 entries, threshold is 5
  seedExamples(root, [
    { brief: 'first brief' },
    { brief: 'second brief' },
  ]);
  const result = buildAnchors({
    briefSummary: 'pricing page for B2B SaaS',
    projectRoot: root,
  });
  assert.equal(result.mode, 'cold-start');
  assert.equal(result.example_count, 2);
  assert.ok(/Rams|principles of good design/i.test(result.anchor_text));
  assert.ok(result.anchor_text.length > 0);
});

test('buildAnchors: designer override changes cold-start pack', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  const result = buildAnchors({
    briefSummary: 'x',
    projectRoot: root,
    designerOverride: 'vignelli',
  });
  assert.equal(result.mode, 'cold-start');
  assert.ok(/Vignelli|Helvetica|grid/i.test(result.anchor_text));
});

test('buildAnchors: VISIONARY_RAG_MIN_EXAMPLES override lowers threshold', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  process.env.VISIONARY_RAG_MIN_EXAMPLES = '2';
  try {
    seedExamples(root, [
      { brief: 'pricing page for b2b saas' },
      { brief: 'b2b saas pricing tiers comparison' },
    ]);
    const result = buildAnchors({
      briefSummary: 'pricing page for a b2b saas',
      projectRoot: root,
    });
    assert.equal(result.mode, 'rag');
    assert.ok(result.anchors.length >= 1);
  } finally {
    delete process.env.VISIONARY_RAG_MIN_EXAMPLES;
  }
});

// ── RAG mode ────────────────────────────────────────────────────────────────
test('buildAnchors: ranks pricing briefs above unrelated briefs', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  seedExamples(root, [
    { brief: 'admin dashboard for server monitoring with live charts',  archetype: 'dashboard' },
    { brief: 'pricing page for B2B SaaS with three tiers',              archetype: 'marketing' },
    { brief: 'pricing comparison table for enterprise SaaS',            archetype: 'marketing' },
    { brief: 'hero section for a consumer mobile app',                  archetype: 'marketing' },
    { brief: '404 error page with retro pixel art aesthetic',           archetype: 'marketing' },
  ]);
  const result = buildAnchors({
    briefSummary: 'pricing page for B2B SaaS',
    projectRoot: root,
    k: 3,
  });
  assert.equal(result.mode, 'rag');
  assert.equal(result.anchors.length, 3);
  const topBriefs = result.anchors.map((a) => a.brief_summary.toLowerCase());
  // At least two of the top-3 should be pricing-related
  const pricing = topBriefs.filter((b) => /pricing|saas/.test(b)).length;
  assert.ok(pricing >= 2, `expected >=2 pricing anchors, got ${pricing}: ${topBriefs.join(' | ')}`);
  assert.ok(result.anchor_text.includes('RAG anchors'));
  assert.ok(result.anchor_text.includes('similarity='));
});

test('buildAnchors: empty brief + RAG-sufficient history returns no anchors', () => {
  const root = mkProject();
  delete process.env.VISIONARY_DISABLE_TASTE;
  seedExamples(root, Array.from({ length: 6 }).map((_, i) => ({ brief: `brief ${i}` })));
  const result = buildAnchors({ briefSummary: '', projectRoot: root });
  assert.equal(result.mode, 'rag');
  assert.equal(result.anchors.length, 0);
});

// ── Opt-out ─────────────────────────────────────────────────────────────────
test('buildAnchors: VISIONARY_DISABLE_TASTE short-circuits to disabled', () => {
  const root = mkProject();
  process.env.VISIONARY_DISABLE_TASTE = '1';
  try {
    const result = buildAnchors({ briefSummary: 'x', projectRoot: root });
    assert.equal(result.mode, 'disabled');
    assert.equal(result.anchor_text, '');
  } finally {
    delete process.env.VISIONARY_DISABLE_TASTE;
  }
});

// ── MIN_EXAMPLES_FOR_RAG constant ───────────────────────────────────────────
test('MIN_EXAMPLES_FOR_RAG is a sensible small integer', () => {
  assert.ok(Number.isInteger(MIN_EXAMPLES_FOR_RAG));
  assert.ok(MIN_EXAMPLES_FOR_RAG >= 3 && MIN_EXAMPLES_FOR_RAG <= 10);
});
