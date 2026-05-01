// Run: node --test hooks/scripts/lib/motion/__tests__/easing-provenance.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreEasingProvenance } from '../easing-provenance.mjs';

test('default ease shorthand scores 0.2', () => {
  const src = `
    .button {
      transition: opacity 200ms ease;
    }
  `;
  const result = scoreEasingProvenance(src);
  assert.equal(result.score, 0.2);
  assert.ok(result.evidence.length >= 1);
  assert.ok(result.evidence.some((e) => e.value.toLowerCase() === 'ease'));
});

test('Motion v12 spring tokens score 1.0', () => {
  const src = `
    import { motion } from 'motion/react';
    const props = { transition: { bounce: 0.4, visualDuration: 0.3 } };
  `;
  const result = scoreEasingProvenance(src);
  assert.equal(result.score, 1.0);
  assert.ok(result.evidence.some((e) => e.value.includes('bounce: 0.4')));
  assert.ok(result.evidence.some((e) => e.value.includes('visualDuration: 0.3')));
});

test('linear() with 5 stops scores 1.0', () => {
  const src = `
    .panel {
      transition-timing-function: linear(0, 0.4 25%, 0.7 50%, 0.9 75%, 1);
    }
  `;
  const result = scoreEasingProvenance(src);
  assert.equal(result.score, 1.0);
  const linearEvidence = result.evidence.find((e) => e.tier === 'linear-high-fidelity');
  assert.ok(linearEvidence);
  assert.ok(linearEvidence.value.startsWith('linear('));
});

test('custom cubic-bezier overshoot scores 0.6', () => {
  const src = `
    .modal {
      transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  `;
  const result = scoreEasingProvenance(src);
  assert.equal(result.score, 0.6);
  assert.ok(result.evidence.some((e) => e.tier === 'cubic-bezier-custom'));
});

test('evidence array carries selector and actual value', () => {
  const src = `
    .button { transition: opacity 200ms ease; }
    .panel { transition-timing-function: linear(0, 0.4 25%, 0.7 50%, 0.9 75%, 1); }
  `;
  const result = scoreEasingProvenance(src);
  assert.ok(result.evidence.length >= 2);
  for (const item of result.evidence) {
    assert.ok(item.selector, 'selector present');
    assert.ok(item.value, 'value present');
    assert.ok(typeof item.score === 'number');
  }
});

test('empty source falls back to baseline 0.2', () => {
  const result = scoreEasingProvenance('');
  assert.equal(result.score, 0.2);
  assert.deepEqual(result.evidence, []);
});

test('default cubic-bezier (ease-equivalent) classifies as unspecified', () => {
  const src = `.x { transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1); }`;
  const result = scoreEasingProvenance(src);
  assert.equal(result.score, 0.2);
});
