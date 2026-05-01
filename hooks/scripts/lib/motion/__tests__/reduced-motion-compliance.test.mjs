// Run: node --test hooks/scripts/lib/motion/__tests__/reduced-motion-compliance.test.mjs
//
// Sprint 9 Detector 5. Validates static-proxy detection of WCAG 2.3.3
// reduced-motion guards across CSS @media blocks, JSX hooks, and the
// scroll-driven dual-guard rule.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scoreReducedMotionCompliance } from '../reduced-motion-compliance.mjs';

test('motion + full-disable @media block → 1.0', () => {
  const src = `
    .card { transition: transform 200ms ease-out; }
    @media (prefers-reduced-motion: reduce) {
      .card { transform: none; animation: none; transition: none; }
    }
  `;
  const result = scoreReducedMotionCompliance(src);
  assert.equal(result.score, 1.0);
  assert.equal(result.has_full_disable, true);
  assert.equal(result.has_guard, true);
});

test('motion present + no reduced-motion guard → 0.0', () => {
  const src = `
    .card { transition: transform 200ms ease-out; }
    .card:hover { transform: translateY(-4px); }
  `;
  const result = scoreReducedMotionCompliance(src);
  assert.equal(result.score, 0.0);
  assert.equal(result.has_guard, false);
  assert.equal(result.has_full_disable, false);
});

test('useReducedMotion hook + ternary conditional → 1.0', () => {
  const src = `
    import { useReducedMotion } from 'motion/react';
    function Card() {
      const prefersReducedMotion = useReducedMotion();
      return prefersReducedMotion ? <div /> : <motion.div animate={{ y: 0 }} />;
    }
  `;
  const result = scoreReducedMotionCompliance(src);
  assert.equal(result.score, 1.0);
  assert.equal(result.has_guard, true);
});

test('component without any motion → 1.0 trivial', () => {
  const src = `
    function Static() {
      return <div className="card">hello</div>;
    }
  `;
  const result = scoreReducedMotionCompliance(src);
  assert.equal(result.score, 1.0);
  assert.equal(result.has_guard, false);
  assert.ok(result.evidence.some((e) => e.kind === 'no-motion-trivial'));
});

test('@media reduce block but only degrade (transform: none) → 0.7', () => {
  const src = `
    .ring { animation: spin 4s linear infinite; }
    @media (prefers-reduced-motion: reduce) {
      .ring { transform: none; }
    }
  `;
  const result = scoreReducedMotionCompliance(src);
  assert.equal(result.score, 0.7);
  assert.equal(result.has_full_disable, false);
  assert.equal(result.has_guard, true);
});

test('animation-timeline: view() without dual-guard → score reduced by 0.3', () => {
  const src = `
    .scrolly {
      animation-timeline: view();
      animation: fade linear both;
    }
    @media (prefers-reduced-motion: reduce) {
      .scrolly { animation: none; }
    }
  `;
  const result = scoreReducedMotionCompliance(src);
  assert.equal(result.score, 0.7);
  assert.ok(result.evidence.some((e) => e.kind === 'scroll-driven-missing-dual-guard'));
});

test('animation-timeline: view() with @supports + reduced-motion guard → 1.0', () => {
  const src = `
    @supports (animation-timeline: view()) {
      .scrolly {
        animation-timeline: view();
        animation: fade linear both;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .scrolly { animation: none; }
    }
  `;
  const result = scoreReducedMotionCompliance(src);
  assert.equal(result.score, 1.0);
});

test('@media reduce block with no recognized effect → 0.4', () => {
  const src = `
    .card { transition: opacity 200ms; }
    @media (prefers-reduced-motion: reduce) {
      .card { color: red; }
    }
  `;
  const result = scoreReducedMotionCompliance(src);
  assert.equal(result.score, 0.4);
});
