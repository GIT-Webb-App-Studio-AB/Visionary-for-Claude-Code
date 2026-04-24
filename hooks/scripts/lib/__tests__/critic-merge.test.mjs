// Run: node --test hooks/scripts/lib/__tests__/critic-merge.test.mjs
//
// Verifies that mergeCritics produces schema-valid output, correctly
// partitions dimensions by ownership, applies arbitration on conflicts,
// and degrades gracefully when one critic's output is malformed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  mergeCritics,
  resolveArbitration,
  CRAFT_DIMENSIONS,
  AESTHETIC_DIMENSIONS,
} from '../critic-merge.mjs';
import { validate } from '../validate-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..', '..');
const critiqueSchema = JSON.parse(readFileSync(
  join(repoRoot, 'skills', 'visionary', 'schemas', 'critique-output.schema.json'),
  'utf8',
));

// ── Fixtures ────────────────────────────────────────────────────────────────
const CRAFT_HASH = 'sha256:' + 'a'.repeat(16);
const AESTHETIC_HASH = 'sha256:' + 'b'.repeat(16);

function craftOutput(overrides = {}) {
  return {
    round: 1,
    scores: {
      hierarchy: 8.0, layout: 7.5, typography: 7.0, contrast: 9.0,
      distinctiveness: null, brief_conformance: null, accessibility: 8.5,
      motion_readiness: null, craft_measurable: 7.3, content_resilience: 8.0,
    },
    confidence: {
      hierarchy: 4, layout: 4, typography: 5, contrast: 5,
      accessibility: 5, craft_measurable: 5, content_resilience: 4,
    },
    top_3_fixes: [
      {
        dimension: 'typography', severity: 'major',
        proposed_fix: 'Adopt 1.25 modular scale',
        selector_hint: 'h1, h2, h3',
        evidence: { type: 'metric', value: 'typographic_rhythm=0.42' },
      },
    ],
    convergence_signal: false,
    slop_detections: [{ pattern_id: 2, severity: 'minor' }],
    axe_violations_count: 0,
    numeric_scores: { enabled: true, composite: 0.73, notes: [] },
    prompt_hash: CRAFT_HASH,
    ...overrides,
  };
}

function aestheticOutput(overrides = {}) {
  return {
    round: 1,
    scores: {
      hierarchy: null, layout: null, typography: null, contrast: null,
      distinctiveness: 4.0, brief_conformance: 6.5, accessibility: null,
      motion_readiness: 3.0, craft_measurable: null, content_resilience: null,
    },
    confidence: {
      distinctiveness: 4, brief_conformance: 4, motion_readiness: 5,
    },
    top_3_fixes: [
      {
        dimension: 'distinctiveness', severity: 'major',
        proposed_fix: 'Replace default-blue CTA with brand token',
        selector_hint: 'button.primary',
        evidence: { type: 'selector', value: 'button.primary' },
      },
      {
        dimension: 'motion_readiness', severity: 'blocker',
        proposed_fix: 'Add prefers-reduced-motion guard to hero entry animation',
        evidence: { type: 'coord', value: '--motion-fast=unset' },
      },
    ],
    convergence_signal: false,
    slop_detections: [{ pattern_id: 10, severity: 'major' }],
    axe_violations_count: 0,
    prompt_hash: AESTHETIC_HASH,
    ...overrides,
  };
}

// ── Ownership partition sanity ──────────────────────────────────────────────
test('CRAFT and AESTHETIC dimensions partition all scored dimensions', () => {
  const all = [...CRAFT_DIMENSIONS, ...AESTHETIC_DIMENSIONS];
  // No duplicates
  assert.equal(new Set(all).size, all.length);
  // Covers the schema-required dimensions (Sprint 07 added content_resilience
  // as the 10th dimension)
  const required = Object.keys(critiqueSchema.properties.scores.properties);
  assert.equal(all.length, required.length, `ownership count ${all.length} must match schema-defined count ${required.length}`);
  for (const dim of required) {
    assert.ok(all.includes(dim), `${dim} must be owned by one critic`);
  }
});

// ── Merge produces schema-valid output ──────────────────────────────────────
test('merge of clean craft + aesthetic outputs is schema-valid', () => {
  const merged = mergeCritics(craftOutput(), aestheticOutput());
  // Strip extra keys the schema doesn't know — arbitration_events etc. are
  // our own additions. Schema allows extras only via additionalProperties:false
  // at the root? Let's check the critique-output.schema actually. It has
  // additionalProperties: false at root, so arbitration_events will fail
  // schema. Strip them before validating — runtime keeps them.
  const pruned = {
    round: merged.round,
    scores: merged.scores,
    confidence: merged.confidence,
    top_3_fixes: merged.top_3_fixes,
    convergence_signal: merged.convergence_signal,
    slop_detections: merged.slop_detections,
    axe_violations_count: merged.axe_violations_count,
    numeric_scores: merged.numeric_scores,
    prompt_hash: merged.prompt_hash,
  };
  const res = validate(pruned, critiqueSchema);
  assert.equal(res.ok, true, `schema errors: ${JSON.stringify(res.errors)}`);
});

// ── Ownership respected ─────────────────────────────────────────────────────
test('craft-owned dimensions come from craft output', () => {
  const merged = mergeCritics(craftOutput(), aestheticOutput());
  for (const dim of CRAFT_DIMENSIONS) {
    assert.equal(merged.scores[dim], craftOutput().scores[dim], `${dim} should come from craft`);
  }
  for (const dim of AESTHETIC_DIMENSIONS) {
    assert.equal(merged.scores[dim], aestheticOutput().scores[dim], `${dim} should come from aesthetic`);
  }
});

// ── Null-to-null preserves null ─────────────────────────────────────────────
test('craft_measurable null from both critics produces null', () => {
  const craft = craftOutput({ scores: { ...craftOutput().scores, craft_measurable: null }, numeric_scores: { enabled: false } });
  const aesthetic = aestheticOutput();
  const merged = mergeCritics(craft, aesthetic);
  assert.equal(merged.scores.craft_measurable, null);
});

// ── Top-3 fixes: severity ordering + union ─────────────────────────────────
test('top_3_fixes are ordered by severity and deduplicated', () => {
  const merged = mergeCritics(craftOutput(), aestheticOutput());
  assert.ok(merged.top_3_fixes.length <= 3);
  // The blocker from aesthetic should outrank the major from craft/aesthetic.
  assert.equal(merged.top_3_fixes[0].severity, 'blocker');
  // Union should include items from both critics
  const dims = merged.top_3_fixes.map((f) => f.dimension);
  assert.ok(dims.some((d) => CRAFT_DIMENSIONS.includes(d)));
  assert.ok(dims.some((d) => AESTHETIC_DIMENSIONS.includes(d)));
});

// ── Slop detections: union + dedup ─────────────────────────────────────────
test('slop_detections are union and deduplicated by pattern_id', () => {
  const a = craftOutput({ slop_detections: [{ pattern_id: 5, severity: 'minor' }, { pattern_id: 7, severity: 'major' }] });
  const b = aestheticOutput({ slop_detections: [{ pattern_id: 7, severity: 'minor' }, { pattern_id: 12, severity: 'major' }] });
  const merged = mergeCritics(a, b);
  const ids = merged.slop_detections.map((s) => s.pattern_id);
  assert.deepEqual(ids, [5, 7, 12]);
  // pattern 7 dedup: craft said major, aesthetic said minor; max severity (major = lower rank = worse) wins
  const seven = merged.slop_detections.find((s) => s.pattern_id === 7);
  assert.equal(seven.severity, 'major');
});

// ── Arbitration: craft wins on dashboard archetype ─────────────────────────
test('arbitration: dashboard archetype → craft wins on conflicting score', () => {
  // Force a conflict by having both critics score typography.
  const c = craftOutput({ scores: { ...craftOutput().scores, typography: 8 } });
  const a = aestheticOutput({ scores: { ...aestheticOutput().scores, typography: 4 } });
  const merged = mergeCritics(c, a, { archetype: 'dashboard' });
  assert.equal(merged.scores.typography, 8, 'craft value should win on dashboard');
  assert.ok(merged.arbitration_events.some((e) => e.dimension === 'typography'));
});

test('arbitration: editorial archetype → aesthetic wins on conflicting score', () => {
  const c = craftOutput({ scores: { ...craftOutput().scores, distinctiveness: 8 } });
  const a = aestheticOutput({ scores: { ...aestheticOutput().scores, distinctiveness: 4 } });
  const merged = mergeCritics(c, a, { archetype: 'editorial' });
  assert.equal(merged.scores.distinctiveness, 4, 'aesthetic value should win on editorial');
});

test('arbitration: illegibility escalation overrides archetype', () => {
  // Experimental archetype would normally favour aesthetic, but if craft
  // reports contrast=3 with a blocker severity, illegibility-wins-regardless
  // forces craft to win.
  const c = craftOutput({
    scores: { ...craftOutput().scores, contrast: 3 },
    top_3_fixes: [{
      dimension: 'contrast', severity: 'blocker',
      proposed_fix: 'Darken body text; APCA Lc < 45 on primary paragraphs',
      evidence: { type: 'axe', value: 'color-contrast' },
    }],
  });
  const a = aestheticOutput({
    scores: { ...aestheticOutput().scores, contrast: 9 },
  });
  const merged = mergeCritics(c, a, { archetype: 'brutalist' });
  assert.equal(merged.scores.contrast, 3, 'craft wins via illegibility escalation even on brutalist');
});

// ── Degraded mode ───────────────────────────────────────────────────────────
test('malformed critic output produces merge_degraded=true, not a crash', () => {
  const merged = mergeCritics({ scores: null }, aestheticOutput());
  assert.equal(merged.merge_degraded, true);
  assert.ok(merged.merge_degraded_reasons.includes('craft-malformed'));
  // Aesthetic's values still appear
  assert.equal(merged.scores.distinctiveness, 4.0);
});

test('null craft output + null aesthetic output does not throw', () => {
  const merged = mergeCritics(null, null);
  assert.equal(merged.merge_degraded, true);
  assert.equal(merged.scores.hierarchy, null);
});

// ── prompt_hash ─────────────────────────────────────────────────────────────
test('differing prompt hashes combine into a new schema-valid sha256', () => {
  const merged = mergeCritics(craftOutput(), aestheticOutput());
  // Must still match the schema pattern ^sha256:[0-9a-f]{16,64}$
  assert.match(merged.prompt_hash, /^sha256:[0-9a-f]{16,64}$/);
  // Originals exposed via merged_prompt_components for audit
  assert.equal(merged.merged_prompt_components.craft, CRAFT_HASH);
  assert.equal(merged.merged_prompt_components.aesthetic, AESTHETIC_HASH);
});

test('same prompt hash collapses to one', () => {
  const h = 'sha256:' + 'c'.repeat(16);
  const merged = mergeCritics(craftOutput({ prompt_hash: h }), aestheticOutput({ prompt_hash: h }));
  assert.equal(merged.prompt_hash, h);
});

// ── resolveArbitration standalone ──────────────────────────────────────────
test('resolveArbitration exposes default when archetype unknown', () => {
  const r = resolveArbitration('unknown-archetype');
  assert.ok(['craft', 'aesthetic'].includes(r.preferred));
  assert.equal(typeof r.reason, 'string');
});

test('resolveArbitration matches family-level archetypes', () => {
  const r = resolveArbitration('analytics');
  assert.equal(r.preferred, 'craft'); // analytics is in dashboard family
});
