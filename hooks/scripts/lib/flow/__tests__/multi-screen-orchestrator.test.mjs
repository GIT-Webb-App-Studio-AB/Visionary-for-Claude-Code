// Run: node --test hooks/scripts/lib/flow/__tests__/multi-screen-orchestrator.test.mjs
//
// Sprint 22 Task 40.1 — multi-screen-orchestrator.
// Validates: 5 prompts produced, shared-context propagated, generateFn invoked
// once per state, per-state graceful failure isolation.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sep } from 'node:path';

import {
  buildStatePrompts,
  orchestrate,
  STATES,
} from '../multi-screen-orchestrator.mjs';

// ── buildStatePrompts ───────────────────────────────────────────────────────

test('buildStatePrompts returns prompts for all 5 canonical states', () => {
  const prompts = buildStatePrompts('todo-app for designers', { palette: ['oklch(0.7 0.1 220)'] });
  const keys = Object.keys(prompts).sort();
  assert.deepEqual(keys, [...STATES].sort());
  assert.equal(keys.length, 5);
});

test('buildStatePrompts: every prompt contains the feature description', () => {
  const feature = 'admin user-management table';
  const prompts = buildStatePrompts(feature, { tier: 1 });
  for (const state of STATES) {
    assert.ok(
      prompts[state].includes(feature),
      `state '${state}' prompt missing feature description: ${prompts[state]}`,
    );
  }
});

test('buildStatePrompts: every prompt embeds the shared design-context', () => {
  const sharedContext = {
    palette: ['oklch(0.65 0.18 280)'],
    motion_tier: 2,
    typography: 'serif',
  };
  const prompts = buildStatePrompts('messaging inbox', sharedContext);
  // Each prompt should contain the JSON serialisation of sharedContext so the
  // generator sees the same anchor across all 5 states.
  const serialised = JSON.stringify(sharedContext);
  for (const state of STATES) {
    assert.ok(
      prompts[state].includes(serialised),
      `state '${state}' prompt missing shared-context JSON: ${prompts[state]}`,
    );
  }
});

test('buildStatePrompts: state-specific cues are present (list ≠ detail ≠ empty ≠ error ≠ loading)', () => {
  const prompts = buildStatePrompts('fintech dashboard', {});
  assert.match(prompts.list, /list view|multiple items/i);
  assert.match(prompts.detail, /detail view|single item|hierarchy/i);
  assert.match(prompts.empty, /empty state|nothing here yet/i);
  assert.match(prompts.error, /error state|retry/i);
  assert.match(prompts.loading, /loading skeleton|skeleton|pulse|shimmer/i);
});

// ── orchestrate: happy path ─────────────────────────────────────────────────

test('orchestrate invokes generateFn exactly once per state', async () => {
  const calls = [];
  const generateFn = async ({ prompt, state, filepath }) => {
    calls.push({ state, prompt, filepath });
    return { ok: true, state };
  };
  const results = await orchestrate({
    featureDescription: 'todo-app',
    sharedContext: { tier: 1 },
    outputDir: '/tmp/flow-test',
    generateFn,
  });

  assert.equal(calls.length, 5);
  // Each call carries the right state-id and a filepath ending in <state>.tsx
  for (const call of calls) {
    assert.ok(STATES.includes(call.state));
    assert.ok(
      call.filepath.endsWith(`${sep}${call.state}.tsx`) ||
        call.filepath.endsWith(`/${call.state}.tsx`),
      `unexpected filepath for state ${call.state}: ${call.filepath}`,
    );
  }

  for (const state of STATES) {
    assert.deepEqual(results[state], { ok: true, state });
  }
});

test('orchestrate: result map keyed by state, all 5 present even if generateFn returns undefined', async () => {
  const generateFn = async () => undefined;
  const results = await orchestrate({
    featureDescription: 'x',
    sharedContext: {},
    outputDir: '/out',
    generateFn,
  });
  assert.deepEqual(Object.keys(results).sort(), [...STATES].sort());
});

// ── orchestrate: failure isolation ──────────────────────────────────────────

test('orchestrate: a failed state captures error and DOES NOT abort other states', async () => {
  const generateFn = async ({ state }) => {
    if (state === 'error') {
      throw new Error('mocked render failure');
    }
    return { rendered: state };
  };

  const results = await orchestrate({
    featureDescription: 'feature x',
    sharedContext: {},
    outputDir: '/out',
    generateFn,
  });

  // The failed state carries an error envelope.
  assert.ok(results.error);
  assert.equal(results.error.error, 'mocked render failure');

  // The other 4 states resolve normally.
  for (const state of STATES) {
    if (state === 'error') continue;
    assert.deepEqual(results[state], { rendered: state });
  }
});

test('orchestrate: throw with non-Error value still produces a string error message', async () => {
  const generateFn = async ({ state }) => {
    if (state === 'loading') throw 'string-thrown';
    return null;
  };
  const results = await orchestrate({
    featureDescription: 'f',
    sharedContext: {},
    outputDir: '/o',
    generateFn,
  });
  assert.equal(results.loading.error, 'string-thrown');
});

test('orchestrate: filepaths land under outputDir', async () => {
  const seen = new Set();
  const generateFn = async ({ filepath }) => {
    seen.add(filepath);
    return true;
  };
  await orchestrate({
    featureDescription: 'f',
    sharedContext: {},
    outputDir: '/some/output/dir',
    generateFn,
  });
  for (const fp of seen) {
    // Cross-platform: posix or windows separator both acceptable.
    assert.ok(
      fp.includes('output') && fp.includes('dir'),
      `filepath should be under outputDir: ${fp}`,
    );
  }
});
