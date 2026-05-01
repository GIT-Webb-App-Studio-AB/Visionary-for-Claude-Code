// Run: node --test hooks/scripts/lib/__tests__/slop-gate.test.mjs
//
// Exercises threshold logic, whitelist substring-matching, frontmatter
// parsing, and the synthesised-critique builder.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  shouldReject,
  resolveThreshold,
  parseStyleAllowsSlop,
  synthesiseRejectCritique,
  DEFAULT_REJECT_THRESHOLD,
} from '../slop-gate.mjs';
import { validate } from '../validate-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..', '..');
const critiqueSchema = JSON.parse(readFileSync(
  join(repoRoot, 'skills', 'visionary', 'schemas', 'critique-output.schema.json'),
  'utf8',
));

// ── Threshold resolution ────────────────────────────────────────────────────
test('resolveThreshold defaults to 2', () => {
  assert.equal(resolveThreshold({}), 2);
  assert.equal(DEFAULT_REJECT_THRESHOLD, 2);
});

test('resolveThreshold honours env var', () => {
  assert.equal(resolveThreshold({ VISIONARY_SLOP_REJECT_THRESHOLD: '5' }), 5);
  assert.equal(resolveThreshold({ VISIONARY_SLOP_REJECT_THRESHOLD: '0' }), 0);
  assert.equal(resolveThreshold({ VISIONARY_SLOP_REJECT_THRESHOLD: '99' }), 99);
});

test('resolveThreshold falls back on garbage env', () => {
  assert.equal(resolveThreshold({ VISIONARY_SLOP_REJECT_THRESHOLD: 'abc' }), 2);
  assert.equal(resolveThreshold({ VISIONARY_SLOP_REJECT_THRESHOLD: '' }), 2);
});

// ── shouldReject ────────────────────────────────────────────────────────────
test('zero slop flags never rejects', () => {
  const r = shouldReject({ slopFlags: [] });
  assert.equal(r.rejected, false);
  assert.equal(r.blocking_count, 0);
});

test('single flag below default threshold does not reject', () => {
  const r = shouldReject({ slopFlags: ['Default Tailwind blue #3B82F6 as primary color detected'] });
  assert.equal(r.rejected, false);
  assert.equal(r.blocking_count, 1);
});

test('two flags at default threshold rejects', () => {
  const r = shouldReject({
    slopFlags: [
      'Default Tailwind blue #3B82F6 as primary color detected',
      'Cyan-on-dark color scheme detected',
    ],
  });
  assert.equal(r.rejected, true);
  assert.equal(r.blocking_count, 2);
  assert.match(r.reason, /2 blocking slop patterns/);
});

test('threshold=0 disables rejection (guard against misconfigured env)', () => {
  const r = shouldReject({
    slopFlags: ['a', 'b', 'c'],
    threshold: 0,
  });
  assert.equal(r.rejected, false);
  assert.equal(r.threshold_used, 0);
});

test('custom threshold applies', () => {
  const r = shouldReject({
    slopFlags: ['one', 'two'],
    threshold: 3,
  });
  assert.equal(r.rejected, false);
  assert.equal(r.blocking_count, 2);
});

// ── Whitelist ───────────────────────────────────────────────────────────────
test('whitelisted patterns do not count toward rejection', () => {
  const r = shouldReject({
    slopFlags: [
      'Default Tailwind blue #3B82F6 as primary color detected',  // whitelisted
      'Cyan-on-dark color scheme detected',                        // whitelisted
      'Uniform border-radius on all elements detected',            // NOT whitelisted
    ],
    styleWhitelist: ['default tailwind blue', 'cyan-on-dark'],
  });
  assert.equal(r.rejected, false);
  assert.equal(r.blocking_count, 1);
  assert.equal(r.whitelisted_count, 2);
  assert.deepEqual(r.whitelisted_patterns.length, 2);
});

test('whitelist is case-insensitive substring match', () => {
  const r = shouldReject({
    slopFlags: ['Default Tailwind Blue #3B82F6 as primary color detected'],
    styleWhitelist: ['DEFAULT TAILWIND BLUE'],
  });
  assert.equal(r.whitelisted_count, 1);
});

test('empty whitelist behaves like no whitelist', () => {
  const r = shouldReject({
    slopFlags: ['a', 'b'],
    styleWhitelist: [],
  });
  assert.equal(r.blocking_count, 2);
});

// ── parseStyleAllowsSlop ────────────────────────────────────────────────────
test('parseStyleAllowsSlop: inline array form', () => {
  const fm = `name: brutalism\nallows_slop: ["default tailwind blue", "cyan-on-dark"]\nmotion_tier: Subtle`;
  const { patterns } = parseStyleAllowsSlop(fm);
  assert.deepEqual(patterns, ['default tailwind blue', 'cyan-on-dark']);
});

test('parseStyleAllowsSlop: multi-line list form', () => {
  const fm = `name: brutalism
allows_slop:
  - "default tailwind blue"
  - "cyan-on-dark color scheme"
motion_tier: Subtle`;
  const { patterns } = parseStyleAllowsSlop(fm);
  assert.deepEqual(patterns, ['default tailwind blue', 'cyan-on-dark color scheme']);
});

test('parseStyleAllowsSlop: extracts reason', () => {
  const fm = `allows_slop: ["foo"]\nallows_slop_reason: "deliberate default-tool ironi"`;
  const { patterns, reason } = parseStyleAllowsSlop(fm);
  assert.deepEqual(patterns, ['foo']);
  assert.equal(reason, 'deliberate default-tool ironi');
});

test('parseStyleAllowsSlop: missing field returns empty', () => {
  const fm = `name: something-else\nmotion_tier: Subtle`;
  const { patterns, reason } = parseStyleAllowsSlop(fm);
  assert.deepEqual(patterns, []);
  assert.equal(reason, null);
});

// ── synthesiseRejectCritique ────────────────────────────────────────────────
test('synthesiseRejectCritique produces schema-valid output', () => {
  const critique = synthesiseRejectCritique({
    round: 1,
    blocking_patterns: ['Cyan-on-dark color scheme detected', 'Default Tailwind blue #3B82F6 detected'],
    promptHash: 'sha256:' + 'a'.repeat(16),
  });
  // Strip the non-schema field before validation — schema has additionalProperties: false
  const pruned = { ...critique };
  delete pruned.synthesised_by;
  const res = validate(pruned, critiqueSchema);
  assert.equal(res.ok, true, `schema errors: ${JSON.stringify(res.errors)}`);
  assert.equal(critique.synthesised_by, 'slop-gate');
});

test('synthesiseRejectCritique: scored dims = 0, nullable dims = null', () => {
  const critique = synthesiseRejectCritique({ round: 1, blocking_patterns: ['x'], promptHash: '' });
  const scoredAsZero = ['hierarchy', 'layout', 'typography', 'contrast', 'distinctiveness', 'brief_conformance', 'accessibility', 'motion_readiness'];
  for (const d of scoredAsZero) {
    assert.equal(critique.scores[d], 0, `${d} should be 0 (not worth scoring)`);
  }
  assert.equal(critique.scores.craft_measurable, null);
  assert.equal(critique.scores.content_resilience, null);
});

test('synthesiseRejectCritique: top_3_fixes caps at 3 even for many patterns', () => {
  const critique = synthesiseRejectCritique({
    round: 2,
    blocking_patterns: ['a', 'b', 'c', 'd', 'e'],
    promptHash: 'sha256:' + 'f'.repeat(16),
  });
  assert.equal(critique.top_3_fixes.length, 3);
});

test('synthesiseRejectCritique: invalid prompt_hash falls back to zero-pattern', () => {
  const critique = synthesiseRejectCritique({
    round: 1,
    blocking_patterns: ['x'],
    promptHash: 'not-valid',
  });
  assert.equal(critique.prompt_hash, 'sha256:0000000000000000');
  // Still schema-valid (meets the pattern constraint)
  assert.match(critique.prompt_hash, /^sha256:[0-9a-f]{16,64}$/);
});

test('synthesiseRejectCritique: dimension mapping routes patterns sensibly', () => {
  const c1 = synthesiseRejectCritique({ round: 1, blocking_patterns: ['Low contrast detected'], promptHash: '' });
  assert.equal(c1.top_3_fixes[0].dimension, 'contrast');
  const c2 = synthesiseRejectCritique({ round: 1, blocking_patterns: ['Poppins as typeface'], promptHash: '' });
  assert.equal(c2.top_3_fixes[0].dimension, 'typography');
  const c3 = synthesiseRejectCritique({ round: 1, blocking_patterns: ['Uniform border-radius'], promptHash: '' });
  assert.equal(c3.top_3_fixes[0].dimension, 'layout');
  const c4 = synthesiseRejectCritique({ round: 1, blocking_patterns: ['Lorem ipsum placeholder'], promptHash: '' });
  assert.equal(c4.top_3_fixes[0].dimension, 'content_resilience');
  const c5 = synthesiseRejectCritique({ round: 1, blocking_patterns: ['Gratuitous gradient hero'], promptHash: '' });
  assert.equal(c5.top_3_fixes[0].dimension, 'distinctiveness');
});
