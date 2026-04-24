// Run: node --test hooks/scripts/lib/__tests__/apply-diff.test.mjs
//
// 10 synthetic (source, diff, expected-output) triplets covering the edge
// cases the sprint calls out: multi-hunk, line-drift, CRLF, trailing
// newline state, unicode, and failure paths.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseUnifiedDiff,
  applyPatch,
  applyUnifiedDiff,
} from '../apply-diff.mjs';

// ── Helpers ────────────────────────────────────────────────────────────────
const nl = '\n';
function unified(src, chunks) {
  // Tiny helper to keep fixtures readable. Not a general-purpose diff builder.
  return [
    '--- a/src.tsx',
    '+++ b/src.tsx',
    ...chunks,
  ].join(nl) + nl;
}

// ── 1. Single-hunk replacement ─────────────────────────────────────────────
test('applies a simple single-hunk replacement', () => {
  const source = [
    'import React from "react";',
    '',
    'export default function App() {',
    '  return <div>hello</div>;',
    '}',
    '',
  ].join(nl);
  const diff = unified(source, [
    '@@ -4,1 +4,1 @@',
    '-  return <div>hello</div>;',
    '+  return <div>world</div>;',
  ]);
  const res = applyUnifiedDiff(source, diff);
  assert.equal(res.ok, true);
  assert.ok(res.content.includes('return <div>world</div>'));
  assert.equal(res.stats.hunksApplied, 1);
});

// ── 2. Multi-hunk patch in one diff ────────────────────────────────────────
test('applies multiple hunks in sequence with correct offset accounting', () => {
  const source = [
    'line 1',
    'line 2',
    'line 3',
    'line 4',
    'line 5',
    'line 6',
    'line 7',
    'line 8',
    '',
  ].join(nl);
  const diff = unified(source, [
    '@@ -2,1 +2,2 @@',
    ' line 2',
    '+INSERTED',
    '@@ -6,1 +7,1 @@',
    '-line 6',
    '+LINE SIX',
  ]);
  const res = applyUnifiedDiff(source, diff);
  assert.equal(res.ok, true);
  const out = res.content.split(nl);
  assert.equal(out[2], 'INSERTED');
  assert.equal(out[6], 'LINE SIX'); // original line 6 shifted by +1 from the first hunk
  assert.equal(res.stats.hunksApplied, 2);
});

// ── 3. Fuzz tolerance: drifted line numbers still match ────────────────────
test('hunk matches when line numbers drift within fuzz', () => {
  const source = [
    // Same content as the expected patch expected, but prefixed with extra
    // lines so the hunk header's oldStart is off by 3.
    'PREAMBLE 1',
    'PREAMBLE 2',
    'PREAMBLE 3',
    'const x = 1;',
    'const y = 2;',
    'const z = 3;',
    '',
  ].join(nl);
  // Hunk expects starting at line 1 even though the match is at line 4.
  const diff = unified(source, [
    '@@ -1,3 +1,3 @@',
    ' const x = 1;',
    '-const y = 2;',
    '+const y = 20;',
    ' const z = 3;',
  ]);
  const res = applyUnifiedDiff(source, diff, { fuzz: 5 });
  assert.equal(res.ok, true, `parse/apply failed: ${res.reason}`);
  assert.ok(res.content.includes('const y = 20;'));
  assert.ok(res.content.includes('PREAMBLE 1')); // untouched preamble
});

// ── 4. CRLF line endings preserved ─────────────────────────────────────────
test('preserves CRLF line endings when source uses them', () => {
  const crlf = '\r\n';
  const source = ['first', 'second', 'third', ''].join(crlf);
  const diff = [
    '--- a/src.tsx',
    '+++ b/src.tsx',
    '@@ -2,1 +2,1 @@',
    '-second',
    '+SECOND',
    '',
  ].join('\n');
  const res = applyUnifiedDiff(source, diff);
  assert.equal(res.ok, true);
  assert.ok(res.content.includes(`SECOND${crlf}third`));
  assert.ok(res.content.endsWith(crlf));
});

// ── 5. Trailing newline preserved when original had one ────────────────────
test('preserves trailing newline when source ends with it', () => {
  const source = 'alpha\nbeta\ngamma\n';
  const diff = unified(source, [
    '@@ -2,1 +2,1 @@',
    '-beta',
    '+BETA',
  ]);
  const res = applyUnifiedDiff(source, diff);
  assert.equal(res.ok, true);
  assert.equal(res.content.endsWith('\n'), true);
  assert.equal(res.content, 'alpha\nBETA\ngamma\n');
});

// ── 6. No-trailing-newline marker respected ────────────────────────────────
test('removes trailing newline when patch declares "\\ No newline at end of file" on +', () => {
  const source = 'alpha\nbeta\n';
  const diff = [
    '--- a/src.tsx',
    '+++ b/src.tsx',
    '@@ -2,1 +2,1 @@',
    '-beta',
    '+beta-without-nl',
    '\\ No newline at end of file',
    '',
  ].join('\n');
  const res = applyUnifiedDiff(source, diff);
  assert.equal(res.ok, true);
  assert.equal(res.content.endsWith('\n'), false);
  assert.equal(res.content, 'alpha\nbeta-without-nl');
});

// ── 7. Unicode content survives round-trip ─────────────────────────────────
test('unicode content (emoji + diacritics) survives apply', () => {
  const source = 'Löschen\nSchließen\n日本語\n';
  const diff = unified(source, [
    '@@ -2,1 +2,1 @@',
    '-Schließen',
    '+Öffnen — 打开',
  ]);
  const res = applyUnifiedDiff(source, diff);
  assert.equal(res.ok, true);
  assert.equal(res.content, 'Löschen\nÖffnen — 打开\n日本語\n');
});

// ── 8. Hunk that cannot be matched returns a failure, not garbage ──────────
test('returns failure when hunk context cannot be located', () => {
  const source = 'alpha\nbeta\ngamma\n';
  const diff = unified(source, [
    '@@ -1,1 +1,1 @@',
    '-delta',  // does not appear in source
    '+DELTA',
  ]);
  const res = applyUnifiedDiff(source, diff);
  assert.equal(res.ok, false);
  assert.equal(res.hunkIndex, 0);
  assert.ok(res.reason.includes('hunk #1 did not match'));
});

// ── 9. dryRun returns original content plus stats ──────────────────────────
test('dryRun reports stats without mutating the output', () => {
  const source = 'one\ntwo\nthree\n';
  const parsed = parseUnifiedDiff(unified(source, [
    '@@ -2,1 +2,1 @@',
    '-two',
    '+TWO',
  ]));
  assert.equal(parsed.ok, true);
  const res = applyPatch(source, parsed.patch, { dryRun: true });
  assert.equal(res.ok, true);
  assert.equal(res.content, source); // unchanged
  assert.equal(res.stats.hunksApplied, 1);
  assert.equal(res.dryRun, true);
});

// ── 10. parseUnifiedDiff rejects malformed input with actionable reasons ───
test('parseUnifiedDiff surfaces clear reasons for malformed inputs', () => {
  assert.equal(parseUnifiedDiff('').ok, false);
  const noHeader = parseUnifiedDiff('just some random text\nwith no diff markers\n');
  assert.equal(noHeader.ok, false);
  assert.ok(noHeader.reason.includes('no --- header'));

  const badHunkHeader = parseUnifiedDiff([
    '--- a/x',
    '+++ b/x',
    '@@ bad @@',
    '',
  ].join('\n'));
  assert.equal(badHunkHeader.ok, false);
  assert.ok(badHunkHeader.reason.includes('invalid hunk header'));
});
