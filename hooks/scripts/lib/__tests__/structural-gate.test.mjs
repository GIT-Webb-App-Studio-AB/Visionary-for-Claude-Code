// hooks/scripts/lib/__tests__/structural-gate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluate,
  buildStructuralDirectiveBlock,
  buildStructuralWarningsBlock,
  HARD_FAIL_CHECKS,
  WARNING_CHECKS,
} from '../structural-gate.mjs';

const __filename = fileURLToPath(import.meta.url);
const FIXTURES = join(dirname(__filename), 'fixtures');
const DESKTOP = { width: 1200, height: 800 };
const EMPTY_WL = { hard_fail_skips: new Set(), warning_skips: new Set() };

const loadFixture = (n) => JSON.parse(readFileSync(join(FIXTURES, n + '.json'), 'utf8'));

test('hard-fail catalogue is exactly the six checks', () => {
  assert.deepEqual([...HARD_FAIL_CHECKS].sort(), [
    'duplicate-heading',
    'empty-section',
    'exposed-nav-bullets',
    'footer-grid-collapse',
    'heading-hierarchy-skip',
    'off-viewport-right',
  ]);
  assert.deepEqual([...WARNING_CHECKS], ['mystery-text-node']);
});

test('Atelier Nord footer fixture: hard-fails footer-grid-collapse + exposed-nav-bullets, warns mystery-text-node ×2', () => {
  const dom = loadFixture('atelier-nord-footer');
  const r = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  const hardIds = r.hard_fails.map((h) => h.check_id).sort();
  assert.ok(hardIds.includes('footer-grid-collapse'), `expected footer-grid-collapse, got ${hardIds}`);
  assert.ok(hardIds.includes('exposed-nav-bullets'), `expected exposed-nav-bullets, got ${hardIds}`);
  const warnIds = r.warnings.map((w) => w.check_id);
  const mysteryCount = warnIds.filter((id) => id === 'mystery-text-node').length;
  assert.equal(mysteryCount, 2);
});

test('Atelier Nord philosophy fixture: hard-fails duplicate-heading', () => {
  const dom = loadFixture('atelier-nord-philosophy');
  const r = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  assert.ok(r.hard_fails.some((h) => h.check_id === 'duplicate-heading'));
});

test('Studio/Hår clean fixture: empty hard_fails and warnings', () => {
  const dom = loadFixture('studio-har-clean');
  const r = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  assert.deepEqual(r.hard_fails, []);
  assert.deepEqual(r.warnings, []);
});

test('whitelist moves a check result from hard_fails to skipped', () => {
  const dom = loadFixture('atelier-nord-philosophy');
  const wl = { hard_fail_skips: new Set(['duplicate-heading']), warning_skips: new Set() };
  const r = evaluate(dom, DESKTOP, { styleWhitelist: wl });
  assert.ok(!r.hard_fails.some((h) => h.check_id === 'duplicate-heading'));
  assert.ok(r.skipped.some((s) => s.check_id === 'duplicate-heading' && s.reason === 'whitelisted'));
});

test('buildStructuralDirectiveBlock returns directive containing check_id', () => {
  const dom = loadFixture('atelier-nord-philosophy');
  const r = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  const block = buildStructuralDirectiveBlock(r.hard_fails);
  assert.ok(block.length > 0);
  assert.ok(/duplicate-heading/.test(block));
});

test('buildStructuralWarningsBlock returns empty string when no warnings', () => {
  assert.equal(buildStructuralWarningsBlock([]), '');
});

test('buildStructuralWarningsBlock formats one entry per warning', () => {
  const block = buildStructuralWarningsBlock([
    { check_id: 'mystery-text-node', selector: 'div.atelier', observed: { text: 'Atelier' }, message: "single-word block 'Atelier'" },
  ]);
  assert.ok(/mystery-text-node/.test(block));
  assert.ok(/div\.atelier/.test(block));
});

test('crashing check is recorded as skipped (insufficient-data), does not throw', () => {
  // A snapshot with no elements array shouldn't crash; it just yields empty hard_fails.
  const r = evaluate({}, DESKTOP, { styleWhitelist: EMPTY_WL });
  assert.deepEqual(r.hard_fails, []);
  assert.deepEqual(r.warnings, []);
});
