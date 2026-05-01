import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAdjustmentsToSource, applyAdjustmentsToTokensJson } from '../apply-diff.mjs';

test('multiplies duration in CSS', () => {
  const src = '.x { transition: opacity 200ms ease }';
  const r = applyAdjustmentsToSource(src, [
    { token: 'duration', op: 'multiply', value: 0.7, min: 100 },
  ]);
  assert.ok(r.changed);
  assert.ok(r.source.includes('140ms'));
});

test('floors duration at min', () => {
  const src = '.x { transition: 80ms ease }';
  const r = applyAdjustmentsToSource(src, [
    { token: 'duration', op: 'multiply', value: 0.7, min: 100 },
  ]);
  assert.ok(r.source.includes('100ms'));
});

test('ceilings duration at max', () => {
  const src = '.x { transition: 700ms ease }';
  const r = applyAdjustmentsToSource(src, [
    { token: 'duration', op: 'multiply', value: 1.4, max: 800 },
  ]);
  assert.ok(r.source.includes('800ms'));
});

test('adds to bounce in JSX', () => {
  const src = 'transition={{ bounce: 0.3, visualDuration: 0.3 }}';
  const r = applyAdjustmentsToSource(src, [
    { token: 'bounce', op: 'add', value: 0.2 },
  ]);
  assert.ok(r.source.includes('bounce: 0.50'));
});

test('no-op when nothing matches', () => {
  const src = 'plain text';
  const r = applyAdjustmentsToSource(src, [
    { token: 'duration', op: 'multiply', value: 0.7 },
  ]);
  assert.equal(r.changed, false);
});

test('DTCG tokens patch', () => {
  const tokens = { motion: { duration: { '$value': 200, '$type': 'duration' } } };
  const r = applyAdjustmentsToTokensJson(tokens, [
    { token: 'duration', op: 'multiply', value: 0.7, min: 100 },
  ]);
  assert.ok(r.changed);
  assert.equal(r.tokens.motion.duration['$value'], 140);
});

test('handles seconds notation', () => {
  const src = '.x { transition: 0.3s ease }';
  const r = applyAdjustmentsToSource(src, [
    { token: 'duration', op: 'multiply', value: 0.5 },
  ]);
  // 300ms × 0.5 = 150ms = 0.15s
  assert.ok(r.source.includes('0.15s') || r.source.includes('150ms'));
});
