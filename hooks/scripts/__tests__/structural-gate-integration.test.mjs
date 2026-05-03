// hooks/scripts/__tests__/structural-gate-integration.test.mjs
//
// End-to-end behaviour test that composes the same helpers capture-and-critique.mjs
// uses on the gate path: evaluate → buildStructuralDirectiveBlock →
// the rejectContext lines. Verifies the final additionalContext shape
// for each of the three observed fixtures.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluate,
  buildStructuralDirectiveBlock,
  buildStructuralWarningsBlock,
} from '../lib/structural-gate.mjs';

const __filename = fileURLToPath(import.meta.url);
const FIXTURES = join(dirname(__filename), '..', 'lib', '__tests__', 'fixtures');
const DESKTOP = { width: 1200, height: 800 };
const EMPTY_WL = { hard_fail_skips: new Set(), warning_skips: new Set() };

function loadFixture(n) { return JSON.parse(readFileSync(join(FIXTURES, n + '.json'), 'utf8')); }

// Mirror of the rejectContext composition in capture-and-critique.mjs.
function composeRejectContext(filePath, round, MAX_ROUNDS, styleId, sgResult) {
  const directive = buildStructuralDirectiveBlock(sgResult.hard_fails);
  return [
    `STRUCTURAL GATE BLOCKED REGEN — Round ${round}/${MAX_ROUNDS}`,
    '',
    `File written: ${filePath}`,
    `Active style: ${styleId || '(no .visionary-generated marker — gate used empty whitelist)'}`,
    `Hard-fails: ${sgResult.hard_fails.length}  ·  warnings (suppressed this round): ${sgResult.warnings.length}  ·  skipped: ${sgResult.skipped.length}`,
    '',
    'NEXT-TURN ACTIONS:',
    '1. Skip the normal critic+screenshot flow — this output has structural defects that must be eliminated before scoring is meaningful.',
    '2. Read the STRUCTURAL DEFECTS block below carefully.',
    '3. Rewrite the component to fix every flagged defect. The hook will re-trigger automatically when you save.',
    '4. To override on a stylistic basis: add the check_id to the active style frontmatter `allows_structural.hard_fail_skips` and document why.',
    '',
    directive,
  ].join('\n');
}

test('philosophy fixture composes a STRUCTURAL GATE BLOCKED context with duplicate-heading', () => {
  const dom = loadFixture('atelier-nord-philosophy');
  const sg = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  assert.ok(sg.hard_fails.length > 0);
  const ctx = composeRejectContext('/tmp/Test.tsx', 2, 3, 'atelier-nord', sg);
  assert.match(ctx, /STRUCTURAL GATE BLOCKED REGEN — Round 2\/3/);
  assert.match(ctx, /duplicate-heading/);
  assert.match(ctx, /Tjänster & takt/);
});

test('footer fixture composes context with footer-grid-collapse + warnings block', () => {
  const dom = loadFixture('atelier-nord-footer');
  const sg = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  const ctx = composeRejectContext('/tmp/Footer.tsx', 2, 3, 'atelier-nord', sg);
  assert.match(ctx, /footer-grid-collapse/);
  assert.match(ctx, /exposed-nav-bullets/);

  // Warnings block goes through the OK path, not the reject path
  const warnBlock = buildStructuralWarningsBlock(sg.warnings);
  assert.match(warnBlock, /mystery-text-node/);
});

test('clean fixture: hard_fails empty, no reject context produced', () => {
  const dom = loadFixture('studio-har-clean');
  const sg = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  assert.deepEqual(sg.hard_fails, []);
  assert.deepEqual(sg.warnings, []);
  // Caller wouldn't compose a rejectContext at all; verify the directive
  // and warning blocks are both empty when nothing's to report.
  assert.equal(buildStructuralDirectiveBlock(sg.hard_fails), '');
  assert.equal(buildStructuralWarningsBlock(sg.warnings), '');
});

test('whitelist allows opting out of duplicate-heading without affecting other checks', () => {
  const dom = loadFixture('atelier-nord-philosophy');
  const wl = { hard_fail_skips: new Set(['duplicate-heading']), warning_skips: new Set() };
  const sg = evaluate(dom, DESKTOP, { styleWhitelist: wl });
  assert.ok(!sg.hard_fails.some((h) => h.check_id === 'duplicate-heading'));
  assert.ok(sg.skipped.some((s) => s.check_id === 'duplicate-heading' && s.reason === 'whitelisted'));
});

test('STRUCTURAL_WARNINGS block contains selector AND check_id for traceability', () => {
  const dom = loadFixture('atelier-nord-footer');
  const sg = evaluate(dom, DESKTOP, { styleWhitelist: EMPTY_WL });
  const block = buildStructuralWarningsBlock(sg.warnings);
  assert.match(block, /mystery-text-node/);
  assert.match(block, /atelier-row|sociala-row/);
});
