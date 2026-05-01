// Run: node --test hooks/scripts/lib/motion/__tests__/timing-consistency.test.mjs
//
// Sprint 9 Motion Scoring 2.0 — timing-consistency detector AC.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreTimingConsistency } from '../timing-consistency.mjs';

test('tight cluster [200ms, 220ms, 180ms] -> score 1.0', () => {
  const src = `
    .a { transition-duration: 200ms; }
    .b { transition-duration: 220ms; }
    .c { transition-duration: 180ms; }
  `;
  const result = scoreTimingConsistency(src);
  assert.equal(result.score, 1.0);
  assert.ok(result.sigma_ms < 80, `expected sigma < 80 ms, got ${result.sigma_ms}`);
  assert.equal(result.distinct_durations, 3);
});

test('moderate spread [100ms, 500ms, 300ms] -> score 0.8', () => {
  const src = `
    .a { transition-duration: 100ms; }
    .b { transition-duration: 500ms; }
    .c { transition-duration: 300ms; }
  `;
  const result = scoreTimingConsistency(src);
  assert.equal(result.score, 0.8);
  assert.ok(result.sigma_ms >= 80 && result.sigma_ms < 200, `expected 80 <= sigma < 200, got ${result.sigma_ms}`);
});

test('all reference same CSS variable token -> score 1.0', () => {
  const src = `
    .a { transition-duration: var(--motion-base); }
    .b { transition-duration: var(--motion-base); }
    .c { transition-duration: var(--motion-base); }
  `;
  const result = scoreTimingConsistency(src);
  assert.equal(result.score, 1.0);
  assert.equal(result.distinct_durations, 1);
});

test('Tailwind duration-300 duration-500 duration-200 -> score 0.8', () => {
  const src = `
    <div className="duration-300">A</div>
    <div className="duration-500">B</div>
    <div className="duration-200">C</div>
  `;
  const result = scoreTimingConsistency(src);
  assert.equal(result.score, 0.8);
  assert.ok(result.sigma_ms >= 80 && result.sigma_ms < 200, `expected 80 <= sigma < 200, got ${result.sigma_ms}`);
});

test('empty source -> neutral score 0.5', () => {
  const result = scoreTimingConsistency('');
  assert.equal(result.score, 0.5);
  assert.equal(result.distinct_durations, 0);
  assert.deepEqual(result.evidence, []);
});

test('null/undefined source -> neutral score 0.5', () => {
  const r1 = scoreTimingConsistency(null);
  const r2 = scoreTimingConsistency(undefined);
  assert.equal(r1.score, 0.5);
  assert.equal(r2.score, 0.5);
});

test('single transition (n=1) -> trivial 1.0', () => {
  const src = `.a { transition-duration: 250ms; }`;
  const result = scoreTimingConsistency(src);
  assert.equal(result.score, 1.0);
  assert.equal(result.distinct_durations, 1);
});

test('JSX duration in seconds (framer-motion style)', () => {
  const src = `
    <motion.div transition={{ duration: 0.2 }} />
    <motion.div transition={{ duration: 0.22 }} />
    <motion.div transition={{ duration: 0.18 }} />
  `;
  const result = scoreTimingConsistency(src);
  assert.equal(result.score, 1.0);
});

test('mixed CSS + JSX + Tailwind durations are pooled', () => {
  const src = `
    .a { transition-duration: 200ms; }
    <motion.div transition={{ duration: 0.22 }} />
    <span className="duration-200">X</span>
  `;
  const result = scoreTimingConsistency(src);
  assert.equal(result.score, 1.0);
});

test('huge spread -> score 0.2', () => {
  const src = `
    .a { transition-duration: 50ms; }
    .b { transition-duration: 1000ms; }
    .c { transition-duration: 100ms; }
  `;
  const result = scoreTimingConsistency(src);
  assert.ok(result.sigma_ms >= 400, `expected sigma >= 400, got ${result.sigma_ms}`);
  assert.equal(result.score, 0.2);
});
