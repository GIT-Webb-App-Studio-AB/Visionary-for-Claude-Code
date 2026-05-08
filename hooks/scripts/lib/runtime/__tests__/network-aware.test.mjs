// Tests for network-aware.mjs — Sprint 23 Task 42.2
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  generateBudgetCss,
  generateAllTierCss,
  generateNetworkRuntimeSnippet,
  BUDGET_TIERS,
  TIERS,
} from '../network-aware.mjs';

const BASE = { solid_fallback: '#eeeeee', low_res_url: '/img/low.jpg' };

test('BUDGET_TIERS exposes the three tier configurations', () => {
  assert.deepEqual(Object.keys(BUDGET_TIERS).sort(), ['degraded', 'full', 'minimal']);
});

test('generateBudgetCss for full tier emits no motion overrides', () => {
  const css = generateBudgetCss({ baseTokens: BASE, budget: 'full' });
  assert.ok(!css.includes('animation: none'), 'full tier must not kill animation');
  assert.ok(!css.includes('animation-duration: 200ms'), 'full tier must not cap durations');
  assert.match(css, /full/);
});

test('generateBudgetCss for degraded tier caps motion to 200ms', () => {
  const css = generateBudgetCss({ baseTokens: BASE, budget: 'degraded' });
  assert.ok(css.includes('animation-duration: 200ms !important'));
  assert.ok(css.includes('transition-duration: 200ms !important'));
});

test('generateBudgetCss for minimal tier disables motion + flattens gradients + replaces blur', () => {
  const css = generateBudgetCss({ baseTokens: BASE, budget: 'minimal' });
  assert.ok(css.includes('animation: none !important'));
  assert.ok(css.includes('transition: none !important'));
  assert.ok(css.includes('background: #eeeeee'));
  assert.ok(css.includes('filter: none !important'));
  assert.ok(css.includes('backdrop-filter: none !important'));
  assert.ok(css.includes('prefers-reduced-data: reduce'), 'minimal tier should also emit media-query block');
});

test('three tiers produce three distinct outputs', () => {
  const full = generateBudgetCss({ baseTokens: BASE, budget: 'full' });
  const degraded = generateBudgetCss({ baseTokens: BASE, budget: 'degraded' });
  const minimal = generateBudgetCss({ baseTokens: BASE, budget: 'minimal' });
  assert.notEqual(full, degraded);
  assert.notEqual(degraded, minimal);
  assert.notEqual(full, minimal);
});

test('generateBudgetCss throws on unknown tier', () => {
  assert.throws(() => generateBudgetCss({ baseTokens: BASE, budget: 'glass' }), /unknown budget tier/);
});

test('generateAllTierCss concatenates all 3 tiers', () => {
  const css = generateAllTierCss({ baseTokens: BASE });
  assert.ok(css.includes('vis-network-full'));
  assert.ok(css.includes('vis-network-degraded'));
  assert.ok(css.includes('vis-network-minimal'));
});

test('generateNetworkRuntimeSnippet emits a script block referencing navigator.connection', () => {
  const snippet = generateNetworkRuntimeSnippet();
  assert.match(snippet, /^<script>/);
  assert.match(snippet, /<\/script>$/);
  assert.ok(snippet.includes('navigator.connection'));
  assert.ok(snippet.includes('saveData'));
  assert.ok(snippet.includes('effectiveType'));
  assert.ok(snippet.includes('vis-network-'));
});

test('generateNetworkRuntimeSnippet inner JS parses without syntax error', () => {
  const snippet = generateNetworkRuntimeSnippet();
  const inner = snippet.replace(/^<script>/, '').replace(/<\/script>$/, '');
  assert.doesNotThrow(() => new vm.Script(inner));
});

test('TIERS array enumerates the three known tiers', () => {
  assert.deepEqual([...TIERS].sort(), ['degraded', 'full', 'minimal']);
});
