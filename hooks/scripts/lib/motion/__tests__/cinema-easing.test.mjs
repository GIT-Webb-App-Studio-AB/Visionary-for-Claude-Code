// Run: node --test hooks/scripts/lib/motion/__tests__/cinema-easing.test.mjs
//
// Sprint 9 Detector 6. Validates cinema-grade easing detection across
// linear() multi-stop curves, cubic-bezier overshoot, ease-out-heavy
// distributions, Motion v12 spring tokens, and the long-duration
// flat-easing penalty.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scoreCinemaEasing } from '../cinema-easing.mjs';

test('standard cubic-bezier on 200ms → ~0.5 baseline', () => {
  const src = `.card { transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1); }`;
  const result = scoreCinemaEasing(src);
  assert.ok(result.score >= 0.45 && result.score <= 0.55, `score was ${result.score}`);
  assert.equal(result.has_overshoot, false);
});

test('linear() with 5 stops → score ≥ 0.4', () => {
  const src = `.bar { animation: pop 300ms linear(0, 0.2, 0.5, 0.8, 1); }`;
  const result = scoreCinemaEasing(src);
  assert.ok(result.score >= 0.4, `score was ${result.score}`);
  assert.equal(result.linear_stops_max, 5);
});

test('cubic-bezier overshoot (1.56 peak) → score ≥ 0.7', () => {
  const src = `.pop { transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1); }`;
  const result = scoreCinemaEasing(src);
  assert.ok(result.score >= 0.7, `score was ${result.score}`);
  assert.equal(result.has_overshoot, true);
});

test('spring bounce: 0.6 → score ≥ 0.8', () => {
  const src = `const config = { type: 'spring', bounce: 0.6, visualDuration: 0.4 };`;
  const result = scoreCinemaEasing(src);
  assert.ok(result.score >= 0.8, `score was ${result.score}`);
});

test('long animation 600ms with only ease-in-out → score ≤ 0.3', () => {
  const src = `.slow { transition: all 600ms ease-in-out; }`;
  const result = scoreCinemaEasing(src);
  assert.ok(result.score <= 0.3, `score was ${result.score}`);
});

test('empty source / no easing → score 0.0', () => {
  const result = scoreCinemaEasing('');
  assert.equal(result.score, 0.0);
  assert.equal(result.has_overshoot, false);
  assert.equal(result.linear_stops_max, 0);
});

test('cubic-bezier with ease-out-heavy back-loaded distance → bonus', () => {
  const src = `.swoop { transition: transform 400ms cubic-bezier(0.9, 0.1, 0.9, 0.1); }`;
  const result = scoreCinemaEasing(src);
  assert.ok(result.score >= 0.5, `score was ${result.score}`);
});
