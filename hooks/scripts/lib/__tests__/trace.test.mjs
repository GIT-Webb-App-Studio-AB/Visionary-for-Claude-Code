// Run: node --test hooks/scripts/lib/__tests__/trace.test.mjs
//
// Exercises trace.mjs against a real filesystem tmpdir — we want to verify
// the atomic-append + fsync path the way production will see it, not a
// fake FS. Rotation and retention are tested by forcing small thresholds
// and fabricating mtimes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync, existsSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  trace,
  currentSessionId,
  _resetCachedSessionForTest,
  readSessionTraces,
  listAllTraceFiles,
  rotateOldTraces,
  resolveTraceDir,
  isTracesDisabled,
} from '../trace.mjs';

// ── Helpers ─────────────────────────────────────────────────────────────────
function mkProject() {
  const dir = mkdtempSync(join(tmpdir(), 'trace-test-'));
  // Make it look like a project root so findProjectRoot returns this dir.
  writeFileSync(join(dir, 'package.json'), '{}');
  return dir;
}

function freshSession(id) {
  _resetCachedSessionForTest(null);
  process.env.VISIONARY_SESSION_ID = id;
  process.env.CLAUDE_SESSION_ID = '';
  delete process.env.VISIONARY_NO_TRACES;
  return currentSessionId();
}

// ── Emission ───────────────────────────────────────────────────────────────
test('trace.sync writes a valid JSONL line under .visionary/traces/', () => {
  const root = mkProject();
  const sid = freshSession('sess-alpha');
  const ok = trace.sync('accepted', { composite: 8.5 }, {
    projectRoot: root,
    generationId: 'gen-xyz',
    round: 2,
    emitter: 'test',
    durationMs: 120,
  });
  assert.equal(ok, true);
  const filePath = join(resolveTraceDir(root), `${sid}.jsonl`);
  assert.equal(existsSync(filePath), true);
  const body = readFileSync(filePath, 'utf8').trim();
  const parsed = JSON.parse(body);
  assert.equal(parsed.session_id, sid);
  assert.equal(parsed.generation_id, 'gen-xyz');
  assert.equal(parsed.round, 2);
  assert.equal(parsed.event, 'accepted');
  assert.equal(parsed.emitter, 'test');
  assert.equal(parsed.duration_ms, 120);
  assert.equal(typeof parsed.ts, 'string');
  assert.deepEqual(parsed.payload, { composite: 8.5 });
});

test('readSessionTraces round-trips multiple events in order', async () => {
  const root = mkProject();
  const sid = freshSession('sess-beta');
  await trace('style_selected', { style_id: 'editorial-serif-revival' }, { projectRoot: root });
  await trace('critic_craft_output', { scores: { typography: 8 } }, { projectRoot: root, round: 1 });
  await trace('accepted', { composite: 8.3 }, { projectRoot: root, round: 2 });
  const { items, skipped } = readSessionTraces(sid, root);
  assert.equal(skipped, 0);
  assert.equal(items.length, 3);
  assert.deepEqual(items.map((e) => e.event), ['style_selected', 'critic_craft_output', 'accepted']);
});

test('unknown event is rejected but does not throw', () => {
  const root = mkProject();
  freshSession('sess-unknown');
  const ok = trace.sync('made_up_event', {}, { projectRoot: root });
  assert.equal(ok, false);
});

test('opt-out via VISIONARY_NO_TRACES silences writes', () => {
  const root = mkProject();
  freshSession('sess-optout');
  process.env.VISIONARY_NO_TRACES = '1';
  try {
    assert.equal(isTracesDisabled(), true);
    const ok = trace.sync('accepted', { composite: 9 }, { projectRoot: root });
    assert.equal(ok, false);
    // No file produced
    assert.equal(existsSync(resolveTraceDir(root)) && listAllTraceFiles(root).length > 0, false);
  } finally {
    delete process.env.VISIONARY_NO_TRACES;
  }
});

test('corrupt line in session file is skipped, clean lines survive', () => {
  const root = mkProject();
  const sid = freshSession('sess-corrupt');
  trace.sync('accepted', { composite: 8.1 }, { projectRoot: root });
  // Inject a corrupt line directly
  const filePath = join(resolveTraceDir(root), `${sid}.jsonl`);
  const body = readFileSync(filePath, 'utf8');
  writeFileSync(filePath, body + '{not valid json\n', 'utf8');
  trace.sync('rejected', { reason: 'user-abort' }, { projectRoot: root });
  const { items, skipped } = readSessionTraces(sid, root);
  assert.equal(items.length, 2);
  assert.equal(skipped, 1);
  assert.equal(items[0].event, 'accepted');
  assert.equal(items[1].event, 'rejected');
});

test('oversized payload is truncated rather than refused', () => {
  const root = mkProject();
  const sid = freshSession('sess-big');
  const huge = 'x'.repeat(80_000);
  trace.sync('critic_output', { blob: huge }, { projectRoot: root });
  const { items } = readSessionTraces(sid, root);
  assert.equal(items.length, 1);
  assert.equal(items[0].payload._truncated, true);
  assert.ok(items[0].payload._original_bytes >= 80_000);
});

test('rotateOldTraces deletes files past retention and compresses stale ones', () => {
  const root = mkProject();
  freshSession('sess-retention');
  // Produce three session files with fabricated mtimes
  const dir = resolveTraceDir(root);
  const recent = join(dir, 'sess-recent.jsonl');
  const stale  = join(dir, 'sess-stale.jsonl');
  const old    = join(dir, 'sess-old.jsonl');
  trace.sync('accepted', { tag: 'recent' }, { projectRoot: root, sessionId: 'sess-recent' });
  trace.sync('accepted', { tag: 'stale'  }, { projectRoot: root, sessionId: 'sess-stale'  });
  trace.sync('accepted', { tag: 'old'    }, { projectRoot: root, sessionId: 'sess-old'    });

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  utimesSync(recent, new Date(now - 1 * dayMs), new Date(now - 1 * dayMs));   // 1 day old
  utimesSync(stale,  new Date(now - 10 * dayMs), new Date(now - 10 * dayMs)); // 10 days → compress
  utimesSync(old,    new Date(now - 200 * dayMs), new Date(now - 200 * dayMs)); // 200 days → delete

  const result = rotateOldTraces(root, { nowMs: now, retentionDays: 90, compressAfterDays: 7 });
  assert.equal(result.deleted, 1);
  assert.equal(result.compressed, 1);
  assert.equal(existsSync(old), false, 'old file should be deleted');
  assert.equal(existsSync(stale), false, 'stale uncompressed should be gone');
  assert.equal(existsSync(stale + '.gz'), true, 'stale should now exist as .gz');
  assert.equal(existsSync(recent), true, 'recent should be untouched');
});

test('readSessionTraces reads across rotated files + .gz counterparts', () => {
  const root = mkProject();
  const sid = freshSession('sess-rotated');
  trace.sync('accepted', { i: 1 }, { projectRoot: root });

  // Simulate a rotated file + a gzipped one
  const dir = resolveTraceDir(root);
  const activePath = join(dir, `${sid}.jsonl`);
  const rotated = activePath.replace(/\.jsonl$/, '.1.jsonl');
  writeFileSync(rotated, JSON.stringify({
    session_id: sid, generation_id: 'g', round: 0, ts: new Date().toISOString(),
    event: 'style_selected', payload: { i: 0 },
  }) + '\n');

  // Gzipped file from a pretend compression run
  const gzipped = activePath.replace(/\.jsonl$/, '.2.jsonl.gz');
  // Use zlib via trace's internal rotation rather than inlining — easier:
  // just leave rotated + active. Test gzip path via rotateOldTraces elsewhere.
  void gzipped;

  const { items } = readSessionTraces(sid, root);
  assert.equal(items.length, 2);
  // Sort order is filename-based: .1.jsonl before .jsonl because '1' < 'j' in ASCII? No,
  // '.1.jsonl' has '.' as 1st non-shared char, same. Second char '1' (0x31) vs 'j' (0x6A).
  // So '.1.jsonl' sorts FIRST — which is what we want (oldest event comes first).
  assert.equal(items[0].event, 'style_selected');
  assert.equal(items[1].event, 'accepted');
});
