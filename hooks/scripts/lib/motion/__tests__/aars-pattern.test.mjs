// Run: node --test hooks/scripts/lib/motion/__tests__/aars-pattern.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreAarsPattern } from '../aars-pattern.mjs';

test('linear ramp keyframes score 0.2', () => {
  const src = `
    @keyframes slide {
      from { transform: translateX(0px); }
      to   { transform: translateX(100px); }
    }
  `;
  const result = scoreAarsPattern(src);
  assert.equal(result.score, 0.2);
  assert.equal(result.phases_detected, 1);
});

test('overshoot + settle keyframes score 0.8', () => {
  const src = `
    @keyframes pop {
      0%   { transform: translateX(0px); }
      60%  { transform: translateX(110px); }
      80%  { transform: translateX(95px); }
      100% { transform: translateX(100px); }
    }
  `;
  const result = scoreAarsPattern(src);
  assert.equal(result.score, 0.8);
  assert.equal(result.phases_detected, 3);
  assert.ok(result.evidence.some((e) => e.tier === 'overshoot-settle'));
});

test('spring bounce > 0 implies AARS at >= 0.7', () => {
  const src = `
    const cfg = { type: 'spring', bounce: 0.4, visualDuration: 0.3 };
  `;
  const result = scoreAarsPattern(src);
  assert.ok(result.score >= 0.7);
  assert.ok(result.evidence.some((e) => e.tier === 'spring-implicit-aars'));
});

test('full AARS keyframes score 1.0', () => {
  const src = `
    @keyframes fullAars {
      0%   { transform: translateX(0px); }
      15%  { transform: translateX(-10px); }
      60%  { transform: translateX(110px); }
      85%  { transform: translateX(97px); }
      100% { transform: translateX(100px); }
    }
  `;
  const result = scoreAarsPattern(src);
  assert.equal(result.score, 1.0);
  assert.ok(result.phases_detected >= 4);
  assert.ok(result.evidence.some((e) => e.tier === 'full-aars'));
});

test('motion.div animate array detected', () => {
  const src = `
    <motion.div animate={{ x: [0, -10, 110, 97, 100] }} />
  `;
  const result = scoreAarsPattern(src);
  assert.equal(result.score, 1.0);
  assert.ok(result.evidence.some((e) => e.selector.startsWith('motion.animate')));
});

test('empty source returns baseline 0.2', () => {
  const result = scoreAarsPattern('');
  assert.equal(result.score, 0.2);
  assert.equal(result.phases_detected, 0);
  assert.deepEqual(result.evidence, []);
});
