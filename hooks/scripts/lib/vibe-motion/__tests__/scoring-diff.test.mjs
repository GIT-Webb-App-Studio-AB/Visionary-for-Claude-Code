import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreBeforeAfter, formatDiffReport } from '../scoring-diff.mjs';

test('scores improvement when motion gets better', () => {
  const before = '.x { transition: 200ms ease }';
  const after = '.x { transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); transition-duration: 200ms; }\n@media (prefers-reduced-motion: reduce) { .x { transition: none } }';
  const diff = scoreBeforeAfter(before, after);
  assert.ok(diff.delta.total > 0);
  assert.ok(diff.after.tier >= diff.before.tier);
});

test('formatDiffReport produces multi-line text', () => {
  const before = '.x { transition: 200ms ease }';
  const after = '.x { transition: 100ms cubic-bezier(0.34, 1.56, 0.64, 1) }';
  const diff = scoreBeforeAfter(before, after);
  const report = formatDiffReport(diff);
  assert.ok(report.includes('Motion Readiness'));
  assert.ok(report.includes('Tier:'));
  assert.ok(report.includes('Subscores:'));
});

test('returns delta of 0 for identical sources', () => {
  const src = '.x { transition: 200ms ease }';
  const diff = scoreBeforeAfter(src, src);
  assert.equal(diff.delta.total, 0);
});
