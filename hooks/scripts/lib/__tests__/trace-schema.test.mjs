// Run: node --test hooks/scripts/lib/__tests__/trace-schema.test.mjs
//
// Cross-validates that entries emitted by trace.mjs validate against the
// published JSON schema. Catches divergence between the Set KNOWN_EVENTS
// and the enum in trace-entry.schema.json — they must stay in sync.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validate } from '../validate-schema.mjs';
import { trace, _resetCachedSessionForTest, readSessionTraces, resolveTraceDir } from '../trace.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..', '..');
const schemaPath = join(repoRoot, 'skills', 'visionary', 'schemas', 'trace-entry.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

function mkProject() {
  const dir = mkdtempSync(join(tmpdir(), 'trace-schema-'));
  writeFileSync(join(dir, 'package.json'), '{}');
  return dir;
}

test('all events emitted by trace.mjs validate against trace-entry.schema.json', () => {
  const root = mkProject();
  _resetCachedSessionForTest(null);
  process.env.VISIONARY_SESSION_ID = 'sess-schema';
  delete process.env.VISIONARY_NO_TRACES;

  const sample = [
    ['style_selected',          { style_id: 'editorial-serif-revival' }],
    ['brief_embedded',          { dims: 384, embedder_id: 'hashed-ngram-v1' }],
    ['rag_retrieval',           { top_k: 3, scores: [0.82, 0.71, 0.55] }],
    ['critic_craft_output',     { scores: { typography: 8 } }],
    ['critic_aesthetic_output', { scores: { distinctiveness: 7 } }],
    ['critic_output',           { scores: { hierarchy: 9 } }],
    ['numeric_scorer_output',   { composite: 0.73 }],
    ['axe_output',              { violations: 0 }],
    ['slop_scan_output',        { flags: [] }],
    ['fix_candidate_generated', { count: 3 }],
    ['verifier_picked',         { idx: 2 }],
    ['patch_applied',           { fuzz_lines: 0 }],
    ['patch_fallback',          { reason: 'hunk-mismatch' }],
    ['early_exit',              { reason: 'min-scores-ok' }],
    ['escalate_reroll',         { reason: '3-dims-below-4' }],
    ['accepted',                { composite: 8.2 }],
    ['rejected',                { reason: 'user-aborted' }],
    ['api_call',                { model: 'claude-sonnet-4-6', tokens_in: 3200 }],
    ['arbitration',             { winner: 'craft' }],
    ['error',                   { message: 'example' }],
  ];
  for (const [event, payload] of sample) {
    trace.sync(event, payload, { projectRoot: root, generationId: 'g-1', round: 1, emitter: 'test' });
  }
  const { items, skipped } = readSessionTraces('sess-schema', root);
  assert.equal(skipped, 0);
  assert.equal(items.length, sample.length);
  for (const entry of items) {
    const res = validate(entry, schema);
    assert.equal(res.ok, true, `event ${entry.event} should validate: ${JSON.stringify(res.errors)}`);
  }
});

test('entry without required fields fails schema', () => {
  const broken = { session_id: 's', generation_id: 'g', round: 0, ts: new Date().toISOString() };
  // event missing
  const res = validate(broken, schema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.message === 'required property missing'));
});

test('entry with non-enum event fails schema', () => {
  const entry = {
    session_id: 's', generation_id: 'g', round: 0, ts: new Date().toISOString(), event: 'bogus',
  };
  const res = validate(entry, schema);
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => /not in enum/.test(e.message)));
});
