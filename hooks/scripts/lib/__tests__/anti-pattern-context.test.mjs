// Run: node --test hooks/scripts/lib/__tests__/anti-pattern-context.test.mjs
//
// Sprint 16 Task 31.4 — anti-pattern context builder. Exercises:
//   - Round 1 short-circuit (no history injection)
//   - Missing / empty / corrupt facts.jsonl → fallback message
//   - Top-N sort by last_seen DESC
//   - Window-size cap
//   - Age + flag + signal-direction + evidence-kind filtering
//   - Token-budget cap on pathologically large inputs
//   - Cache reuse (same round + mtime → same result; mtime change busts cache)
//
// Real tmpdir, real fs writes — no mocks. The cache check uses statSync's
// mtimeMs which on some Windows builds has 1 ms resolution, so the
// "cache busts on mtime change" test sleeps long enough to guarantee a
// different timestamp.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  utimesSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildAntiPatternContext,
  resetCache,
} from '../anti-pattern-context.mjs';

// ── Fixtures ────────────────────────────────────────────────────────────────

let counter = 0;
function nextId() {
  // 26-char ULID-shaped string. The schema regex requires Crockford-base32
  // minus I/L/O/U; we just need something stable + unique for tests.
  const c = String(counter++).padStart(6, '0');
  return ('01HXY' + 'ABCDEFGHJKMNPQRSTV'.repeat(2)).slice(0, 20) + c;
}

function makeFact({
  id,
  direction = 'prefer',
  target_type = 'palette_tag',
  target_value = 'oxblood',
  flag = 'active',
  evidenceKind = 'git_kept',
  last_seen,
  created_at,
  confidence = 0.7,
  evidence,
} = {}) {
  const now = new Date().toISOString();
  return {
    id: id || nextId(),
    scope: { level: 'project', key: 'demo-project' },
    signal: { direction, target_type, target_value },
    evidence: evidence || [
      { kind: evidenceKind, quote_or_diff: 'kept after 24h', at: last_seen || now },
    ],
    confidence,
    created_at: created_at || now,
    last_seen: last_seen || now,
    flag,
  };
}

function isoDaysAgo(days, fromMs = Date.now()) {
  return new Date(fromMs - days * 86400_000).toISOString();
}

function mkProject() {
  return mkdtempSync(join(tmpdir(), 'antipat-test-'));
}

function writeFacts(dir, facts) {
  const path = join(dir, 'facts.jsonl');
  writeFileSync(path, facts.map((f) => JSON.stringify(f)).join('\n') + (facts.length ? '\n' : ''));
  return path;
}

beforeEach(() => {
  // Each test starts with a clean module cache so cache-bust assertions
  // are deterministic regardless of test ordering.
  resetCache();
});

// ── Round 1 short-circuit ───────────────────────────────────────────────────
test('round 1 returns empty context, used_method skipped_round_1', () => {
  const dir = mkProject();
  try {
    const path = writeFacts(dir, [makeFact()]);
    const r = buildAntiPatternContext({ round: 1, factsJsonlPath: path });
    assert.equal(r.context, '');
    assert.equal(r.used_method, 'skipped_round_1');
    assert.equal(r.history_count, 0);
    assert.equal(r.history_window_days, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('round 0 / undefined → also skipped_round_1', () => {
  const dir = mkProject();
  try {
    const path = writeFacts(dir, [makeFact()]);
    assert.equal(buildAntiPatternContext({ round: 0, factsJsonlPath: path }).used_method, 'skipped_round_1');
    assert.equal(buildAntiPatternContext({ factsJsonlPath: path }).used_method, 'skipped_round_1');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Missing / empty fallback ────────────────────────────────────────────────
test('round 2 + missing facts.jsonl → fallback context', () => {
  const r = buildAntiPatternContext({
    round: 2,
    factsJsonlPath: join(tmpdir(), 'does-not-exist-12345', 'facts.jsonl'),
  });
  assert.equal(r.used_method, 'fallback');
  assert.equal(r.history_count, 0);
  assert.match(r.context, /ANTI-PATTERN CONTEXT \(round 2\)/);
  assert.match(r.context, /No user history available yet/);
  assert.match(r.context, /global aesthetic priors/i);
});

test('round 2 + empty facts.jsonl → fallback context, no crash', () => {
  const dir = mkProject();
  try {
    const path = join(dir, 'facts.jsonl');
    writeFileSync(path, '');
    const r = buildAntiPatternContext({ round: 2, factsJsonlPath: path });
    assert.equal(r.used_method, 'fallback');
    assert.equal(r.history_count, 0);
    assert.match(r.context, /No user history available yet/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('round 2 + facts.jsonl with only malformed lines → fallback, no throw', () => {
  const dir = mkProject();
  try {
    const path = join(dir, 'facts.jsonl');
    writeFileSync(path, '{not valid json\n{"also broken\n');
    const r = buildAntiPatternContext({ round: 2, factsJsonlPath: path });
    assert.equal(r.used_method, 'fallback');
    assert.equal(r.history_count, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Happy path ──────────────────────────────────────────────────────────────
test('round 2 + 5 valid entries → context with 5 rows, properly formatted', () => {
  const dir = mkProject();
  try {
    const facts = [
      makeFact({ target_value: 'oxblood', last_seen: isoDaysAgo(1) }),
      makeFact({ target_value: 'sage-mint', last_seen: isoDaysAgo(2) }),
      makeFact({ target_value: 'graphite', last_seen: isoDaysAgo(3) }),
      makeFact({ target_value: 'champagne', last_seen: isoDaysAgo(4) }),
      makeFact({ target_value: 'midnight-blue', last_seen: isoDaysAgo(5) }),
    ];
    const path = writeFacts(dir, facts);
    const r = buildAntiPatternContext({ round: 2, factsJsonlPath: path });

    assert.equal(r.used_method, 'embedding-8d');
    assert.equal(r.history_count, 5);
    assert.equal(r.history_window_days, 90);
    assert.match(r.context, /ANTI-PATTERN CONTEXT \(round 2\)/);
    assert.match(r.context, /accepted these 5 designs/);
    assert.match(r.context, /Reference signatures \(top-5\)/);
    // All five values appear, indexed 1..5.
    for (const v of ['oxblood', 'sage-mint', 'graphite', 'champagne', 'midnight-blue']) {
      assert.ok(r.context.includes(v), `expected "${v}" in context`);
    }
    for (let i = 1; i <= 5; i++) {
      assert.ok(r.context.includes(`${i}. id:`), `expected row ${i}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('round 2 + 50 entries → cap at windowSize=10, sorted by last_seen DESC', () => {
  const dir = mkProject();
  try {
    // Build 50 facts spread across 0..49 days back. Newest first when
    // sorted by last_seen DESC means the entries with smallest day-offset
    // win the top-10 slots.
    const facts = [];
    for (let i = 0; i < 50; i++) {
      facts.push(makeFact({
        target_value: `palette-${String(i).padStart(2, '0')}`,
        last_seen: isoDaysAgo(i),
      }));
    }
    const path = writeFacts(dir, facts);
    const r = buildAntiPatternContext({ round: 2, factsJsonlPath: path });

    assert.equal(r.history_count, 10);
    // Top-10 should be palette-00..palette-09 (smallest day-offsets).
    for (let i = 0; i < 10; i++) {
      assert.ok(
        r.context.includes(`palette-${String(i).padStart(2, '0')}`),
        `expected palette-${String(i).padStart(2, '0')} in top-10`,
      );
    }
    // Older entries should NOT appear.
    assert.ok(!r.context.includes('palette-30'));
    assert.ok(!r.context.includes('palette-49'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Filtering ───────────────────────────────────────────────────────────────
test('decayed and avoid-direction facts excluded from context', () => {
  const dir = mkProject();
  try {
    const facts = [
      makeFact({ target_value: 'keep-me', flag: 'active' }),
      makeFact({ target_value: 'permanent-keep', flag: 'permanent' }),
      makeFact({ target_value: 'decayed-skip', flag: 'decayed' }),
      makeFact({ target_value: 'avoid-skip', direction: 'avoid' }),
    ];
    const path = writeFacts(dir, facts);
    const r = buildAntiPatternContext({ round: 2, factsJsonlPath: path });

    assert.equal(r.history_count, 2);
    assert.ok(r.context.includes('keep-me'));
    assert.ok(r.context.includes('permanent-keep'));
    assert.ok(!r.context.includes('decayed-skip'));
    assert.ok(!r.context.includes('avoid-skip'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('facts older than maxAgeDays excluded', () => {
  const dir = mkProject();
  try {
    const facts = [
      makeFact({ target_value: 'recent', last_seen: isoDaysAgo(10) }),
      makeFact({ target_value: 'too-old', last_seen: isoDaysAgo(120) }),
    ];
    const path = writeFacts(dir, facts);
    const r = buildAntiPatternContext({ round: 2, factsJsonlPath: path, maxAgeDays: 90 });
    assert.equal(r.history_count, 1);
    assert.ok(r.context.includes('recent'));
    assert.ok(!r.context.includes('too-old'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('facts without positive evidence kind excluded', () => {
  const dir = mkProject();
  try {
    const facts = [
      makeFact({ target_value: 'has-git-kept', evidenceKind: 'git_kept' }),
      makeFact({ target_value: 'has-pairwise', evidenceKind: 'pairwise_pick' }),
      makeFact({ target_value: 'has-explicit-approval', evidenceKind: 'explicit_approval' }),
      makeFact({
        target_value: 'only-rejection',
        evidence: [{
          kind: 'explicit_rejection',
          quote_or_diff: 'no thanks',
          at: new Date().toISOString(),
        }],
      }),
      makeFact({
        target_value: 'only-git-delete',
        evidence: [{
          kind: 'git_delete',
          quote_or_diff: 'rm component',
          at: new Date().toISOString(),
        }],
      }),
    ];
    const path = writeFacts(dir, facts);
    const r = buildAntiPatternContext({ round: 2, factsJsonlPath: path });

    assert.equal(r.history_count, 3);
    assert.ok(r.context.includes('has-git-kept'));
    assert.ok(r.context.includes('has-pairwise'));
    assert.ok(r.context.includes('has-explicit-approval'));
    assert.ok(!r.context.includes('only-rejection'));
    assert.ok(!r.context.includes('only-git-delete'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('windowSize override caps even when more accepted facts exist', () => {
  const dir = mkProject();
  try {
    const facts = Array.from({ length: 8 }, (_, i) =>
      makeFact({ target_value: `pal-${i}`, last_seen: isoDaysAgo(i) }),
    );
    const path = writeFacts(dir, facts);
    const r = buildAntiPatternContext({ round: 2, factsJsonlPath: path, windowSize: 3 });
    assert.equal(r.history_count, 3);
    assert.ok(r.context.includes('pal-0'));
    assert.ok(r.context.includes('pal-1'));
    assert.ok(r.context.includes('pal-2'));
    assert.ok(!r.context.includes('pal-7'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Token-budget cap ────────────────────────────────────────────────────────
test('token-cap: 50 entries with long target_values → trimmed to ~1500 tokens', () => {
  const dir = mkProject();
  try {
    // 50 facts each with a 150-char target_value, windowSize huge so the
    // budget cap is what enforces the limit, not the windowSize.
    const longValue = 'a-very-long-palette-name-with-lots-of-tokens-'.repeat(4); // ~180 chars
    const facts = Array.from({ length: 50 }, (_, i) =>
      makeFact({ target_value: longValue + i, last_seen: isoDaysAgo(i) }),
    );
    const path = writeFacts(dir, facts);
    const r = buildAntiPatternContext({
      round: 2,
      factsJsonlPath: path,
      windowSize: 50,
    });

    // Hard cap at TOKEN_BUDGET * 4 = 6000 chars.
    assert.ok(r.context.length <= 6000, `expected <=6000 chars, got ${r.context.length}`);
    // If truncation happened, marker should be present.
    if (r.context.length > 5000) {
      assert.match(r.context, /truncated/);
    }
    // Header still present even after trim.
    assert.match(r.context, /ANTI-PATTERN CONTEXT/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Cache behaviour ─────────────────────────────────────────────────────────
test('cache: same round + same mtime → identical result returned twice', () => {
  const dir = mkProject();
  try {
    const path = writeFacts(dir, [
      makeFact({ target_value: 'cached-value', last_seen: isoDaysAgo(1) }),
    ]);
    const a = buildAntiPatternContext({ round: 2, factsJsonlPath: path });
    const b = buildAntiPatternContext({ round: 2, factsJsonlPath: path });
    // Same string AND same object identity (cache returns the cached result).
    assert.equal(a.context, b.context);
    assert.equal(a, b);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('cache: mtime change busts cache (rewrite produces fresh result)', () => {
  const dir = mkProject();
  try {
    const path = writeFacts(dir, [
      makeFact({ target_value: 'first', last_seen: isoDaysAgo(1) }),
    ]);
    const a = buildAntiPatternContext({ round: 2, factsJsonlPath: path });
    assert.ok(a.context.includes('first'));

    // Rewrite with different content + bumped mtime. Use utimesSync to
    // guarantee mtime advances even if the host clock has 1s resolution.
    writeFacts(dir, [
      makeFact({ target_value: 'second', last_seen: isoDaysAgo(1) }),
    ]);
    const future = new Date(Date.now() + 60_000);
    utimesSync(path, future, future);

    const b = buildAntiPatternContext({ round: 2, factsJsonlPath: path });
    assert.notEqual(a, b);
    assert.ok(b.context.includes('second'));
    assert.ok(!b.context.includes('first'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('cache: useCache=false skips the cache entirely', () => {
  const dir = mkProject();
  try {
    const path = writeFacts(dir, [
      makeFact({ target_value: 'no-cache', last_seen: isoDaysAgo(1) }),
    ]);
    const a = buildAntiPatternContext({ round: 2, factsJsonlPath: path, useCache: false });
    const b = buildAntiPatternContext({ round: 2, factsJsonlPath: path, useCache: false });
    // Same content because facts haven't changed, but different objects
    // because cache is bypassed.
    assert.equal(a.context, b.context);
    assert.notEqual(a, b);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('cache: different round numbers produce different cached entries', () => {
  const dir = mkProject();
  try {
    const path = writeFacts(dir, [makeFact({ target_value: 'shared' })]);
    const r2 = buildAntiPatternContext({ round: 2, factsJsonlPath: path });
    const r3 = buildAntiPatternContext({ round: 3, factsJsonlPath: path });
    assert.match(r2.context, /round 2/);
    assert.match(r3.context, /round 3/);
    assert.notEqual(r2, r3);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Schema robustness ───────────────────────────────────────────────────────
test('malformed facts mixed with valid → only valid ones surface', () => {
  const dir = mkProject();
  try {
    const path = join(dir, 'facts.jsonl');
    const validLine = JSON.stringify(makeFact({ target_value: 'valid-keep' }));
    const lines = [
      validLine,
      '{not even close to json}',
      JSON.stringify({ no_signal_field: true }), // valid JSON but missing signal
      JSON.stringify(makeFact({ target_value: 'second-valid', last_seen: isoDaysAgo(2) })),
    ];
    writeFileSync(path, lines.join('\n') + '\n');
    const r = buildAntiPatternContext({ round: 2, factsJsonlPath: path });
    assert.equal(r.history_count, 2);
    assert.ok(r.context.includes('valid-keep'));
    assert.ok(r.context.includes('second-valid'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
