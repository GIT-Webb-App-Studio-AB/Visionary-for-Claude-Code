// Run: node --test hooks/scripts/lib/__tests__/validate-schema.test.mjs
//
// Verifies the validator accepts realistic critique/style-selection/taste/
// annotate payloads and rejects the obvious violations the JSON schemas are
// meant to catch. Lifts the schemas straight off disk — any schema edit
// must keep these fixtures valid.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from '../validate-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..', '..');
const schemaDir = join(repoRoot, 'skills', 'visionary', 'schemas');

const critiqueSchema  = load('critique-output.schema.json');
const selectionSchema = load('style-selection.schema.json');
const tasteSchema     = load('taste-signal.schema.json');
const annotateSchema  = load('annotate-edit.schema.json');

function load(name) {
  return JSON.parse(readFileSync(join(schemaDir, name), 'utf8'));
}

// ── critique-output ─────────────────────────────────────────────────────────
function cleanCritique() {
  return {
    round: 2,
    scores: {
      hierarchy: 8.5, layout: 8.0, typography: 7.5, contrast: 9.0,
      distinctiveness: 8.2, brief_conformance: 8.8, accessibility: 9.5, motion_readiness: 8.0,
      craft_measurable: 7.6, content_resilience: null,
    },
    confidence: {
      hierarchy: 4, layout: 4, typography: 5, contrast: 5,
      distinctiveness: 4, brief_conformance: 4, accessibility: 5, motion_readiness: 4,
      craft_measurable: 4, content_resilience: 3,
    },
    top_3_fixes: [
      {
        dimension: 'typography',
        severity: 'minor',
        proposed_fix: 'Tighten scale ratio between h1 and body from 3.5 to 2.8',
        evidence: { type: 'selector', value: 'h1' },
      },
    ],
    convergence_signal: false,
    slop_detections: [],
    axe_violations_count: 0,
    prompt_hash: 'sha256:abcd1234abcd1234',
  };
}

// Helper for tests that need a valid hex prompt_hash beyond the 16-char fixture.
const FIXTURE_PROMPT_HASH = 'sha256:abcd1234abcd1234';

test('critique schema: clean critique validates', () => {
  const res = validate(cleanCritique(), critiqueSchema);
  assert.equal(res.ok, true, JSON.stringify(res.errors));
});

test('critique schema: round out of range rejected', () => {
  const bad = { ...cleanCritique(), round: 5 };
  const res = validate(bad, critiqueSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/round'));
});

test('critique schema: missing required score dimension rejected', () => {
  const bad = cleanCritique();
  delete bad.scores.typography;
  const res = validate(bad, critiqueSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/scores/typography'));
});

test('critique schema: score outside 0-10 rejected', () => {
  const bad = cleanCritique();
  bad.scores.hierarchy = 11;
  const res = validate(bad, critiqueSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/scores/hierarchy'));
});

test('critique schema: confidence outside 1-5 rejected', () => {
  const bad = cleanCritique();
  bad.confidence.hierarchy = 0;
  const res = validate(bad, critiqueSchema);
  assert.equal(res.ok, false);
});

test('critique schema: invalid severity enum rejected', () => {
  const bad = cleanCritique();
  bad.top_3_fixes = [{
    dimension: 'typography',
    severity: 'critical',
    proposed_fix: 'Something specific enough',
    evidence: { type: 'selector', value: 'h1' },
  }];
  const res = validate(bad, critiqueSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/top_3_fixes/0/severity'));
});

test('critique schema: proposed_fix too short rejected', () => {
  const bad = cleanCritique();
  bad.top_3_fixes = [{
    dimension: 'typography',
    severity: 'minor',
    proposed_fix: 'short',
    evidence: { type: 'selector', value: 'h1' },
  }];
  const res = validate(bad, critiqueSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/top_3_fixes/0/proposed_fix'));
});

test('critique schema: missing evidence rejected (Sprint 3)', () => {
  const bad = cleanCritique();
  bad.top_3_fixes = [{ dimension: 'typography', severity: 'minor', proposed_fix: 'Tighten scale ratio between h1 and body' }];
  const res = validate(bad, critiqueSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path.startsWith('/top_3_fixes/0/evidence')));
});

test('critique schema: evidence with unknown type rejected (Sprint 3)', () => {
  const bad = cleanCritique();
  bad.top_3_fixes = [{
    dimension: 'typography',
    severity: 'minor',
    proposed_fix: 'Tighten scale ratio between h1 and body',
    evidence: { type: 'feels', value: 'off' },
  }];
  const res = validate(bad, critiqueSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/top_3_fixes/0/evidence/type'));
});

test('critique schema: null craft_measurable accepted (Sprint 3)', () => {
  const c = cleanCritique();
  c.scores.craft_measurable = null;
  const res = validate(c, critiqueSchema);
  assert.equal(res.ok, true, JSON.stringify(res.errors));
});

test('critique schema: numeric_scores block accepted (Sprint 3)', () => {
  const c = cleanCritique();
  c.numeric_scores = {
    enabled: true,
    contrast_entropy: 0.82,
    gestalt_grouping: 0.71,
    typographic_rhythm: 0.90,
    negative_space_ratio: 0.41,
    color_harmony: 0.78,
    composite: 0.76,
    accessibility_axe_score: 9.5,
    notes: [],
  };
  const res = validate(c, critiqueSchema);
  assert.equal(res.ok, true, JSON.stringify(res.errors));
});

test('critique schema: missing prompt_hash rejected (Sprint 3)', () => {
  const bad = cleanCritique();
  delete bad.prompt_hash;
  const res = validate(bad, critiqueSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/prompt_hash'));
});

test('critique schema: slop_detections pattern_id out of range rejected', () => {
  const bad = cleanCritique();
  bad.slop_detections = [{ pattern_id: 99, severity: 'major' }];
  const res = validate(bad, critiqueSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/slop_detections/0/pattern_id'));
});

test('critique schema: additional top-level property rejected', () => {
  const bad = cleanCritique();
  bad.extra_field = 'should not be here';
  const res = validate(bad, critiqueSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/extra_field'));
});

// ── style-selection ─────────────────────────────────────────────────────────
test('style-selection schema: valid selection validates', () => {
  const payload = {
    selected_style_id: 'bauhaus',
    scored_candidates: [
      { id: 'bauhaus',           total: 87, rationale: 'Strong grid-first fit for editorial brief' },
      { id: 'swiss-rationalism', total: 82, rationale: 'Typographically similar, denser fit' },
    ],
    rng_seed: 42,
    blocked_ids: ['neon-dystopia'],
    category_filter: ['historical'],
  };
  const res = validate(payload, selectionSchema);
  assert.equal(res.ok, true, JSON.stringify(res.errors));
});

test('style-selection schema: empty candidates array rejected', () => {
  const bad = { selected_style_id: 'x', scored_candidates: [], rng_seed: 0 };
  const res = validate(bad, selectionSchema);
  assert.equal(res.ok, false);
});

// ── taste-signal ────────────────────────────────────────────────────────────
test('taste-signal schema: reject signal with style scope validates', () => {
  const payload = {
    signal: 'reject',
    scope: 'style',
    evidence_quote: 'too generic, looks like every other SaaS landing',
    detected_at: '2026-04-22',
  };
  const res = validate(payload, tasteSchema);
  assert.equal(res.ok, true, JSON.stringify(res.errors));
});

test('taste-signal schema: bad detected_at format rejected', () => {
  const bad = { signal: 'approve', scope: 'palette', detected_at: '22/04/2026' };
  const res = validate(bad, tasteSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/detected_at'));
});

test('taste-signal schema: unknown signal value rejected', () => {
  const bad = { signal: 'love-it', scope: 'style' };
  const res = validate(bad, tasteSchema);
  assert.equal(res.ok, false);
});

// ── annotate-edit ───────────────────────────────────────────────────────────
test('annotate-edit schema: typical browser pin validates', () => {
  const payload = {
    pin_id: 'pin-3',
    viewport: { width: 1200, height: 800 },
    selector: '[data-testid="hero-cta"]',
    bounding_box: { x: 420, y: 312, width: 180, height: 44 },
    instruction: 'Make this button larger and primary-colored',
    intent: 'resize',
  };
  const res = validate(payload, annotateSchema);
  assert.equal(res.ok, true, JSON.stringify(res.errors));
});

test('annotate-edit schema: instruction too short rejected', () => {
  const bad = {
    pin_id: 'x',
    viewport: { width: 1200, height: 800 },
    selector: '.btn',
    instruction: 'hi',
  };
  const res = validate(bad, annotateSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/instruction'));
});

test('annotate-edit schema: zero-width bbox rejected (exclusiveMinimum)', () => {
  const bad = {
    pin_id: 'x',
    viewport: { width: 1200, height: 800 },
    selector: '.btn',
    bounding_box: { x: 0, y: 0, width: 0, height: 44 },
    instruction: 'fix this somehow',
  };
  const res = validate(bad, annotateSchema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.path === '/bounding_box/width'));
});
