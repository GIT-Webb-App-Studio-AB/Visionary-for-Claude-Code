import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyJudgePolicy, POLICY_CONSTANTS } from '../policy.mjs';

test('judge-skipped → falls back to heuristic preferred', () => {
  const result = applyJudgePolicy({
    judgeOutput: { skipped: true, reason: 'no-api-key' },
    heuristicState: { preferred_winner: 'A' },
  });
  assert.equal(result.chosen_winner, 'A');
  assert.equal(result.used_judge, false);
});

test('judge tie or low-confidence → heuristic wins', () => {
  const result = applyJudgePolicy({
    judgeOutput: { winner: 'tie', confidence: 0.2 },
    heuristicState: { preferred_winner: 'B' },
  });
  assert.equal(result.chosen_winner, 'B');
  assert.equal(result.used_judge, false);
});

test('judge confident + heuristic agrees → judge winner counted', () => {
  const result = applyJudgePolicy({
    judgeOutput: { winner: 'A', confidence: 0.85 },
    heuristicState: { preferred_winner: 'A', margin: 0.5 },
  });
  assert.equal(result.chosen_winner, 'A');
  assert.equal(result.used_judge, true);
});

test('strong heuristic margin overrides judge dissent', () => {
  const result = applyJudgePolicy({
    judgeOutput: { winner: 'A', confidence: 0.9 },
    heuristicState: { preferred_winner: 'B', margin: 2.0 },
  });
  assert.equal(result.chosen_winner, 'B');
  assert.equal(result.used_judge, false);
  assert.equal(result.override_reason, 'heuristic-strong-margin-overrides-judge');
});

test('weak heuristic margin → judge winner stands', () => {
  const result = applyJudgePolicy({
    judgeOutput: { winner: 'A', confidence: 0.85 },
    heuristicState: { preferred_winner: 'B', margin: 0.5 },
  });
  assert.equal(result.chosen_winner, 'A');
  assert.equal(result.used_judge, true);
});
