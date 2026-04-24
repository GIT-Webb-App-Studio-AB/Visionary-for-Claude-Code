// Run: node --test hooks/scripts/lib/__tests__/validate-evidence.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectSelectorQueries,
  applyValidation,
  shouldRetryCritic,
  formatInvalidWarning,
  validateSelectorsInBrowser,
  BROWSER_EVAL_VALIDATION_FN,
} from '../validate-evidence.mjs';

function fix(dim, type, value, extra = {}) {
  return {
    dimension: dim,
    severity: 'major',
    proposed_fix: `fix ${dim} because reasons and more reasons`,
    evidence: { type, value },
    ...extra,
  };
}

function critique(fixes) {
  return {
    round: 1,
    scores: {
      hierarchy: 8, layout: 8, typography: 8, contrast: 8,
      distinctiveness: 8, brief_conformance: 8, accessibility: 8, motion_readiness: 8,
      craft_measurable: 8,
    },
    confidence: {
      hierarchy: 5, layout: 5, typography: 5, contrast: 5,
      distinctiveness: 5, brief_conformance: 5, accessibility: 5, motion_readiness: 5,
      craft_measurable: 5,
    },
    top_3_fixes: fixes,
    convergence_signal: false,
    prompt_hash: 'sha256:test',
  };
}

test('collectSelectorQueries returns only selector-type evidence with stable indexing', () => {
  const c = critique([
    fix('typography', 'selector', '.hero h1'),
    fix('accessibility', 'axe', 'color-contrast'),
    fix('craft_measurable', 'metric', 'contrast_entropy=0.4'),
  ]);
  const q = collectSelectorQueries(c);
  assert.equal(q.length, 1);
  assert.deepEqual(q[0], { fixIndex: 0, selector: '.hero h1' });
});

test('collectSelectorQueries skips empty / non-string values', () => {
  const c = critique([
    fix('typography', 'selector', ''),
    fix('layout', 'selector', '   '),
    { dimension: 'hierarchy', severity: 'minor', proposed_fix: 'x...', evidence: { type: 'selector', value: null } },
    fix('contrast', 'selector', '.real'),
  ]);
  const q = collectSelectorQueries(c);
  assert.equal(q.length, 1);
  assert.equal(q[0].selector, '.real');
});

test('applyValidation marks fixes whose selectors matched nothing', () => {
  const c = critique([
    fix('typography', 'selector', '.hero h1'),
    fix('layout', 'selector', '.sidebar'),
  ]);
  const { critique: patched, summary } = applyValidation(c, [
    { fixIndex: 0, matched: false },
    { fixIndex: 1, matched: true },
  ]);
  assert.equal(patched.top_3_fixes[0].evidence_invalid, true);
  assert.equal(patched.top_3_fixes[1].evidence_invalid, undefined);
  assert.equal(summary.invalid_count, 1);
  assert.equal(summary.verified_count, 1);
});

test('applyValidation leaves untouched fixes when no result provided (unverified)', () => {
  const c = critique([
    fix('typography', 'selector', '.missing-result'),
  ]);
  const { critique: patched, summary } = applyValidation(c, []);
  assert.equal(patched.top_3_fixes[0].evidence_invalid, undefined);
  assert.equal(summary.unverified_count, 1);
});

test('applyValidation is pure — input critique not mutated', () => {
  const c = critique([fix('typography', 'selector', '.x')]);
  const beforeJson = JSON.stringify(c);
  applyValidation(c, [{ fixIndex: 0, matched: false }]);
  assert.equal(JSON.stringify(c), beforeJson);
});

test('shouldRetryCritic fires at 2 invalid', () => {
  const c = critique([
    fix('a', 'selector', '.x', { evidence_invalid: true }),
    fix('b', 'selector', '.y', { evidence_invalid: true }),
    fix('c', 'selector', '.z'),
  ]);
  const r = shouldRetryCritic(c);
  assert.equal(r.retry, true);
  assert.equal(r.invalidCount, 2);
});

test('shouldRetryCritic does not fire at 1 invalid', () => {
  const c = critique([
    fix('a', 'selector', '.x', { evidence_invalid: true }),
    fix('b', 'selector', '.y'),
  ]);
  const r = shouldRetryCritic(c);
  assert.equal(r.retry, false);
  assert.equal(r.invalidCount, 1);
});

test('shouldRetryCritic accepts a pre-computed summary', () => {
  const r = shouldRetryCritic({ invalid_count: 3, verified_count: 1, unverified_count: 0, invalid: [], unverified: [], verified: [] });
  assert.equal(r.retry, true);
});

test('formatInvalidWarning is empty when nothing is invalid', () => {
  const c = critique([fix('a', 'selector', '.x')]);
  assert.equal(formatInvalidWarning(c), '');
});

test('formatInvalidWarning lists every invalid selector', () => {
  const c = critique([
    fix('a', 'selector', '.hero h1', { evidence_invalid: true }),
    fix('b', 'selector', '.cta', { evidence_invalid: true }),
  ]);
  const out = formatInvalidWarning(c);
  assert.match(out, /\.hero h1/);
  assert.match(out, /\.cta/);
  assert.match(out, /EVIDENCE VALIDATION WARNING/);
});

test('validateSelectorsInBrowser returns matched+count for each selector against a mock DOM', () => {
  globalThis.document = {
    querySelectorAll(sel) {
      if (sel === '.exists') return { length: 3 };
      if (sel === '.empty')  return { length: 0 };
      if (sel === 'boom')    throw new Error('bad selector');
      return { length: 0 };
    },
  };
  try {
    const results = validateSelectorsInBrowser(['.exists', '.empty', 'boom']);
    assert.deepEqual(results, [
      { selector: '.exists', matched: true, count: 3 },
      { selector: '.empty', matched: false, count: 0 },
      { selector: 'boom', matched: false, count: 0, error: 'bad selector' },
    ]);
  } finally {
    delete globalThis.document;
  }
});

test('BROWSER_EVAL_VALIDATION_FN is derived from validateSelectorsInBrowser', () => {
  // We assert the serialisation is the function itself, not a drifted copy.
  assert.equal(BROWSER_EVAL_VALIDATION_FN, validateSelectorsInBrowser.toString());
  assert.match(BROWSER_EVAL_VALIDATION_FN, /querySelectorAll/);
});

test('handles malformed input without throwing', () => {
  assert.deepEqual(collectSelectorQueries(null), []);
  assert.deepEqual(collectSelectorQueries({}), []);
  assert.deepEqual(collectSelectorQueries({ top_3_fixes: 'x' }), []);
  const { critique: patched, summary } = applyValidation(null, [{ fixIndex: 0, matched: false }]);
  assert.equal(patched, null);
  assert.equal(summary.invalid_count, 0);
});
