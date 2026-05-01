import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resetForSession, startRound, canInvoke, recordInvocation, getStats } from '../budget.mjs';

test('canInvoke ok before any invocations', () => {
  resetForSession('test-1');
  const r = canInvoke();
  assert.equal(r.ok, true);
});

test('canInvoke blocks after per-round limit reached', () => {
  resetForSession('test-2');
  recordInvocation();
  const r = canInvoke({ maxPerRound: 1 });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'budget-per-round-exceeded');
});

test('startRound resets per-round counter', () => {
  resetForSession('test-3');
  recordInvocation();
  startRound();
  const r = canInvoke({ maxPerRound: 1 });
  assert.equal(r.ok, true);
});

test('canInvoke blocks at per-session limit even with fresh round', () => {
  resetForSession('test-4');
  for (let i = 0; i < 5; i++) {
    startRound();
    recordInvocation();
  }
  startRound();
  const r = canInvoke({ maxPerSession: 5 });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'budget-per-session-exceeded');
});

test('getStats reports cumulative cost', () => {
  resetForSession('test-5');
  recordInvocation(0.5);
  recordInvocation(0.5);
  const stats = getStats();
  assert.ok(stats.costEstimateUsd >= 1.0);
  assert.equal(stats.perSession, 2);
});
