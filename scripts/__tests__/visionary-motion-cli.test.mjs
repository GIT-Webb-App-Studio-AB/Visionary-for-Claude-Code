import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CLI = 'scripts/visionary-motion-cli.mjs';

function run(args) {
  const r = spawnSync('node', [CLI, ...args], { encoding: 'utf8' });
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch {}
  return { stdout: r.stdout, stderr: r.stderr, code: r.status, json: parsed };
}

test('missing intent → exit 2 with error', () => {
  const r = run([]);
  assert.equal(r.code, 2);
  assert.equal(r.json.error, 'missing-intent');
});

test('unknown intent → suggestions', () => {
  const r = run(['--intent', 'flerfärgad sjösko']);
  assert.equal(r.code, 2);
  assert.equal(r.json.error, 'unknown-intent');
  assert.ok(Array.isArray(r.json.suggestions));
});

test('missing component → manual hint', () => {
  const r = run(['--intent', 'snabbare']);
  assert.equal(r.code, 2);
  assert.equal(r.json.error, 'missing-component');
});

test('preview flag does not modify file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'vibe-motion-'));
  const file = join(dir, 'test.tsx');
  writeFileSync(file, '.x { transition: 200ms ease }');
  const r = run(['--intent', 'snabbare', '--component', file, '--preview']);
  assert.equal(r.code, 0);
  assert.equal(r.json.preview, true);
  // Verify source not written
  assert.equal(r.json.written, undefined);
});
