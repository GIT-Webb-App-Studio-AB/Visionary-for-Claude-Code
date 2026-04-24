// Run: node --test benchmark/tests/loop-integration.mjs
//
// End-to-end loop scenarios required by Sprint 02 DoD. Exercises the
// interaction between loop-control predicates and apply-diff in the five
// scenarios the plan calls out, without needing a live LLM. Each scenario
// drives the flow by swapping in a scripted critique output per round.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  shouldEarlyExit,
  shouldEscalateToReroll,
  shouldUseDiffRegen,
  DIMENSIONS,
} from '../../hooks/scripts/lib/loop-control.mjs';
import { applyUnifiedDiff } from '../../hooks/scripts/lib/apply-diff.mjs';
import { validate } from '../../hooks/scripts/lib/validate-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const critiqueSchema = JSON.parse(
  readFileSync(join(repoRoot, 'skills', 'visionary', 'schemas', 'critique-output.schema.json'), 'utf8')
);

// ── Scripted-critique harness ──────────────────────────────────────────────
// simulateLoop plays back a sequence of critique outputs as if they came
// from the visual-critic subagent. Each entry in `plan` describes a round:
//   { critique, diff? }
// We validate every critique against the schema (Task 4.1 AC), apply the
// diff where one is supplied, and assert the caller gets the correct
// terminating signal (early-exit / escalate / convergence / final round).
function simulateLoop({ initialSource, plan, options = {} }) {
  const trace = [];
  let source = initialSource;
  let previousCritique = null;
  let diffFallbackEvents = 0;

  for (let idx = 0; idx < plan.length; idx++) {
    const step = plan[idx];
    const round = step.critique.round;

    // Every critique MUST pass schema validation — Sprint 02 schema
    // violations must trip the retry path, not the integration test's
    // success path.
    const schemaResult = validate(step.critique, critiqueSchema);
    if (!schemaResult.ok) {
      trace.push({ round, event: 'schema_violation', errors: schemaResult.errors });
      if (step.allowSchemaFailure) continue;
      throw new Error(`schema violation at round ${round}: ${JSON.stringify(schemaResult.errors)}`);
    }

    // Escalation only fires on round 1.
    const esc = shouldEscalateToReroll(step.critique);
    if (esc.escalate) {
      trace.push({ round, event: 'escalated_reroll', reason: esc.reason, bad: esc.badDimensions });
      return { trace, terminal: 'escalated_reroll', source, diffFallbackEvents };
    }

    // Early exit: wins over diff-regen for the next round.
    const ee = shouldEarlyExit(step.critique, options);
    if (ee.exit) {
      trace.push({ round, event: 'early_exit', reason: ee.reason });
      return { trace, terminal: 'early_exit', source, diffFallbackEvents };
    }

    // Convergence: caller reverts to previous round's output.
    if (step.critique.convergence_signal) {
      trace.push({ round, event: 'convergence_signal' });
      return { trace, terminal: 'convergence', source, diffFallbackEvents };
    }

    // Otherwise queue the next round's regeneration strategy.
    const useDiff = shouldUseDiffRegen(round + 1, {
      previousConvergenceSignal: step.critique.convergence_signal,
    });
    trace.push({ round, event: 'refine_next', nextRound: round + 1, regen: useDiff ? 'diff' : 'full' });

    // If the plan provided a diff for the NEXT round, apply it now to the
    // source to simulate Claude emitting a patch.
    if (useDiff && step.diff) {
      const res = applyUnifiedDiff(source, step.diff);
      if (!res.ok) {
        diffFallbackEvents++;
        trace.push({ round: round + 1, event: 'diff_fallback', reason: res.reason });
        // Fallback: swap in the fullReplacement for the next round.
        if (step.fullReplacement) {
          source = step.fullReplacement;
          trace.push({ round: round + 1, event: 'full_regen_after_fallback' });
        }
      } else {
        source = res.content;
      }
    } else if (!useDiff && step.fullReplacement) {
      source = step.fullReplacement;
    }

    previousCritique = step.critique;
  }

  return { trace, terminal: 'max_rounds', source, diffFallbackEvents };
}

function mkCritique(round, { min = 9, confidence = 5, axe = 0, slop = [], convergence = false } = {}) {
  const scores = {};
  const conf = {};
  for (const d of DIMENSIONS) {
    scores[d] = min;
    conf[d] = confidence;
  }
  return {
    round,
    scores,
    confidence: conf,
    top_3_fixes: [],
    convergence_signal: convergence,
    slop_detections: slop,
    axe_violations_count: axe,
  };
}

// ── Scenario 1: Round 1 is already great → early exit, no diff round ──────
test('scenario 1: high-quality round 1 early-exits without a diff round', () => {
  const result = simulateLoop({
    initialSource: 'const Hello = () => <div>hi</div>;\n',
    plan: [
      { critique: mkCritique(1, { min: 9, confidence: 5, axe: 0 }) },
    ],
    // calibrationMode off so round 1 can exit.
  });
  assert.equal(result.terminal, 'early_exit');
  assert.equal(result.trace[0].event, 'early_exit');
});

// ── Scenario 2: Medium round 1 → diff round 2 → early exit ─────────────────
test('scenario 2: medium round 1 refines via diff, round 2 early-exits', () => {
  const source = ['line 1', 'line 2', 'line 3', ''].join('\n');
  const diff = [
    '--- a/x.tsx',
    '+++ b/x.tsx',
    '@@ -2,1 +2,1 @@',
    '-line 2',
    '+line TWO',
    '',
  ].join('\n');

  const result = simulateLoop({
    initialSource: source,
    plan: [
      {
        critique: {
          ...mkCritique(1, { min: 6.5, confidence: 4, axe: 0 }),
          top_3_fixes: [
            { dimension: 'typography', severity: 'minor', proposed_fix: 'Rename line 2 to LINE TWO for specificity' },
          ],
        },
        diff,
      },
      { critique: mkCritique(2, { min: 9, confidence: 5, axe: 0 }) },
    ],
  });
  assert.equal(result.terminal, 'early_exit');
  assert.equal(result.trace.find((t) => t.event === 'refine_next').regen, 'diff');
  assert.ok(result.source.includes('line TWO'));
});

// ── Scenario 3: Low round 1 escalates to reroll ────────────────────────────
test('scenario 3: low-quality round 1 escalates to reroll', () => {
  const critique = mkCritique(1, { min: 2.5, confidence: 3, axe: 0 });
  // Confirm >= 3 dims are < 4 to satisfy escalate rule:
  critique.scores.hierarchy = 2;
  critique.scores.layout = 3.5;
  critique.scores.typography = 3.9;
  const result = simulateLoop({
    initialSource: '<div/>',
    plan: [{ critique }],
  });
  assert.equal(result.terminal, 'escalated_reroll');
});

// ── Scenario 4: Round 1 OK → round 2 diff fails → fallback → round 3 ───────
test('scenario 4: round 2 diff fails → full-regen fallback → round 3 diff succeeds', () => {
  const source = ['alpha', 'beta', 'gamma', ''].join('\n');
  const badDiff = [
    '--- a/x.tsx',
    '+++ b/x.tsx',
    '@@ -1,1 +1,1 @@',
    '-NONEXISTENT',
    '+whatever',
    '',
  ].join('\n');
  const fullReplacement = ['alpha', 'BETA', 'gamma', ''].join('\n');
  const goodDiff = [
    '--- a/x.tsx',
    '+++ b/x.tsx',
    '@@ -3,1 +3,1 @@',
    '-gamma',
    '+GAMMA',
    '',
  ].join('\n');

  const result = simulateLoop({
    initialSource: source,
    plan: [
      {
        critique: {
          ...mkCritique(1, { min: 7, confidence: 4, axe: 1 }),
          top_3_fixes: [
            { dimension: 'accessibility', severity: 'major', proposed_fix: 'Raise heading contrast ratio to 4.8:1' },
          ],
        },
        diff: badDiff,
        fullReplacement,
      },
      {
        critique: {
          ...mkCritique(2, { min: 7.5, confidence: 4, axe: 1 }),
          top_3_fixes: [
            { dimension: 'typography', severity: 'minor', proposed_fix: 'Uppercase gamma label for hierarchy emphasis' },
          ],
        },
        diff: goodDiff,
      },
      { critique: mkCritique(3, { min: 9, confidence: 5, axe: 0 }) },
    ],
  });
  assert.equal(result.terminal, 'early_exit');
  assert.equal(result.diffFallbackEvents, 1);
  assert.ok(result.source.includes('BETA'));
  assert.ok(result.source.includes('GAMMA'));
});

// ── Scenario 5: Schema violation forces retry ──────────────────────────────
test('scenario 5: schema-violating critique is flagged before loop acts on it', () => {
  const bad = { round: 1, scores: { hierarchy: 99 }, confidence: {}, top_3_fixes: [], convergence_signal: false };
  const result = simulateLoop({
    initialSource: '<div/>',
    plan: [
      { critique: bad, allowSchemaFailure: true },
      { critique: mkCritique(1, { min: 9, confidence: 5, axe: 0 }) }, // retry succeeds
    ],
  });
  assert.equal(result.terminal, 'early_exit');
  const violation = result.trace.find((t) => t.event === 'schema_violation');
  assert.ok(violation, 'expected a schema_violation trace event');
  assert.ok(violation.errors.length > 0);
});
