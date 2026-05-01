// Run: node --test hooks/scripts/lib/motion/__tests__/narrative-arc.test.mjs
//
// Sprint 9 Motion Scoring 2.0 — narrative-arc detector AC.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreNarrativeArc } from '../narrative-arc.mjs';

test('three elements without delay -> default 0.2', () => {
  const src = `
    <div>Header</div>
    <div>Body</div>
    <div>CTA</div>
  `;
  const result = scoreNarrativeArc(src);
  assert.equal(result.score, 0.2);
  assert.equal(result.has_stagger, false);
});

test('header=0, body=100, CTA=200 (monotonic delays) -> 1.0', () => {
  const src = `
    <motion.div transition={{ delay: 0 }} />
    <motion.div transition={{ delay: 100 }} />
    <motion.div transition={{ delay: 200 }} />
  `;
  const result = scoreNarrativeArc(src);
  assert.equal(result.score, 1.0);
  assert.equal(result.has_stagger, false);
});

test('staggerChildren on parent -> 1.0 directly', () => {
  const src = `
    <motion.div variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
      <motion.div />
      <motion.div />
    </motion.div>
  `;
  const result = scoreNarrativeArc(src);
  assert.equal(result.score, 1.0);
  assert.equal(result.has_stagger, true);
});

test('random delays [300, 50, 200] -> 0.4', () => {
  const src = `
    .a { transition-delay: 300ms; }
    .b { transition-delay: 50ms; }
    .c { transition-delay: 200ms; }
  `;
  const result = scoreNarrativeArc(src);
  assert.equal(result.score, 0.4);
  assert.equal(result.has_stagger, false);
});

test('only 1 element with delay -> 0.6', () => {
  const src = `
    .a { transition-delay: 200ms; }
  `;
  const result = scoreNarrativeArc(src);
  assert.equal(result.score, 0.6);
});

test('Tailwind delay-0 delay-100 delay-200 -> 1.0', () => {
  const src = `
    <div className="delay-0">Header</div>
    <div className="delay-100">Body</div>
    <div className="delay-200">CTA</div>
  `;
  const result = scoreNarrativeArc(src);
  assert.equal(result.score, 1.0);
  assert.equal(result.has_stagger, false);
});

test('empty source -> 0.2 (no delays at all)', () => {
  const result = scoreNarrativeArc('');
  assert.equal(result.score, 0.2);
  assert.equal(result.has_stagger, false);
  assert.equal(result.layered_count, 1);
});

test('JSX delay in seconds gets normalised to ms', () => {
  const src = `
    <motion.div transition={{ delay: 0 }} />
    <motion.div transition={{ delay: 0.1 }} />
    <motion.div transition={{ delay: 0.2 }} />
  `;
  const result = scoreNarrativeArc(src);
  assert.equal(result.score, 1.0);
});

test('staggerChildren=0 should NOT trigger bonus', () => {
  const src = `
    <motion.div variants={{ visible: { transition: { staggerChildren: 0 } } }}>
      <div>A</div>
      <div>B</div>
    </motion.div>
  `;
  const result = scoreNarrativeArc(src);
  assert.equal(result.has_stagger, false);
  assert.equal(result.score, 0.2);
});

test('CSS animation-delay also counted', () => {
  const src = `
    .a { animation-delay: 0ms; }
    .b { animation-delay: 100ms; }
    .c { animation-delay: 200ms; }
  `;
  const result = scoreNarrativeArc(src);
  assert.equal(result.score, 1.0);
});
