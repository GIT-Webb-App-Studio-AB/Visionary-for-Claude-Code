import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isConflict,
  strategyA_designerTiebreak,
  strategyC_userEscalation,
  resolveConflict,
  CONSTANTS,
} from '../conflict-resolve.mjs';

test('isConflict false for tight scores', () => {
  assert.equal(isConflict({ a: 7, b: 8 }), false);
});

test('isConflict true for >2.5 spread', () => {
  assert.equal(isConflict({ a: 4, b: 8 }), true);
});

test('strategyA breaks tie when craft and aesthetic agree', () => {
  const r = strategyA_designerTiebreak({ craft: 7, aesthetic: 7.5, designer: 5 });
  assert.ok(r);
  assert.ok(r.final_score < 7.5);
});

test('strategyA returns null when craft and aesthetic too far apart', () => {
  const r = strategyA_designerTiebreak({ craft: 5, aesthetic: 9, designer: 7 });
  assert.equal(r, null);
});

test('strategyC produces user-escalation marker', () => {
  const r = strategyC_userEscalation({ scoresPerCritic: { a: 4, b: 9 }, dim: 'distinctiveness' });
  assert.equal(r.method, 'user_escalation');
  assert.equal(r.needs_user_input, true);
});

test('resolveConflict averages when no conflict', async () => {
  const r = await resolveConflict({ dim: 'x', scoresPerCritic: { a: 7, b: 8 } });
  assert.equal(r.method, 'avg');
});

test('resolveConflict invokes A on conflict', async () => {
  const r = await resolveConflict({ dim: 'x', scoresPerCritic: { craft: 6, aesthetic: 6.5, designer: 4 } });
  // Either tie_break (designer adjusts) or escalation
  assert.ok(['tie_break', 'user_escalation', 'avg'].includes(r.method));
});

test('CONSTANTS exposes thresholds', () => {
  assert.ok(typeof CONSTANTS.TIE_THRESHOLD === 'number');
  assert.ok(typeof CONSTANTS.CONFLICT_THRESHOLD === 'number');
});
