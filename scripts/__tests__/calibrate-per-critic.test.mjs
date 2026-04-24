// Run: node --test scripts/__tests__/calibrate-per-critic.test.mjs
//
// Verifies that calibrate.mjs produces per-critic calibration files with
// the right dimension partitioning. We don't seed a real gold-set — we
// test against the identity_fallback path by running with an empty
// gold-set directory, which is enough to verify the shape of the output.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const cli = join(repoRoot, 'scripts', 'calibrate.mjs');

function runCalibrate(args) {
  const res = spawnSync(process.execPath, [cli, '--dry-run', ...args], { encoding: 'utf8' });
  return { stdout: res.stdout || '', stderr: res.stderr || '', status: res.status };
}

function parse(out) {
  // Find the JSON body in the dry-run output (prefixed by stderr logs).
  const jsonStart = out.indexOf('{\n');
  if (jsonStart < 0) return null;
  try { return JSON.parse(out.slice(jsonStart)); } catch { return null; }
}

// ── Identity fallback shape ─────────────────────────────────────────────────
test('unified default emits all 10 dimensions owned', () => {
  const { stdout, status } = runCalibrate([]);
  assert.equal(status, 0);
  const c = parse(stdout);
  assert.ok(c, 'output should be parseable JSON');
  assert.equal(c.critic_identity, 'unified');
  for (const dim of Object.keys(c.per_dimension)) {
    assert.equal(c.per_dimension[dim].not_owned_by, undefined, `${dim} must be owned by unified`);
  }
});

test('--critic-identity craft: non-craft dimensions are marked not_owned_by=craft', () => {
  const { stdout, status } = runCalibrate(['--critic-identity', 'craft']);
  assert.equal(status, 0);
  const c = parse(stdout);
  assert.equal(c.critic_identity, 'craft');
  // Craft owns these
  for (const dim of ['hierarchy', 'layout', 'typography', 'contrast', 'accessibility', 'craft_measurable', 'content_resilience']) {
    assert.equal(c.per_dimension[dim].not_owned_by, undefined, `${dim} should be craft-owned`);
  }
  // Aesthetic dimensions should be marked
  for (const dim of ['distinctiveness', 'brief_conformance', 'motion_readiness']) {
    assert.equal(c.per_dimension[dim].not_owned_by, 'craft', `${dim} should be marked not owned by craft`);
  }
});

test('--critic-identity aesthetic: non-aesthetic dimensions are marked not_owned_by=aesthetic', () => {
  const { stdout, status } = runCalibrate(['--critic-identity', 'aesthetic']);
  assert.equal(status, 0);
  const c = parse(stdout);
  assert.equal(c.critic_identity, 'aesthetic');
  for (const dim of ['distinctiveness', 'brief_conformance', 'motion_readiness']) {
    assert.equal(c.per_dimension[dim].not_owned_by, undefined, `${dim} should be aesthetic-owned`);
  }
  for (const dim of ['hierarchy', 'layout', 'typography', 'contrast', 'accessibility', 'craft_measurable', 'content_resilience']) {
    assert.equal(c.per_dimension[dim].not_owned_by, 'aesthetic', `${dim} should be marked not owned by aesthetic`);
  }
});

test('--critic-identity bogus exits non-zero', () => {
  const { stderr, status } = runCalibrate(['--critic-identity', 'bogus']);
  assert.notEqual(status, 0);
  assert.match(stderr, /unknown --critic-identity/);
});

test('every dimension always has slope + intercept (identity passthrough when not owned)', () => {
  const { stdout } = runCalibrate(['--critic-identity', 'craft']);
  const c = parse(stdout);
  for (const [dim, fit] of Object.entries(c.per_dimension)) {
    assert.equal(fit.slope, 1, `${dim} slope should be identity (1)`);
    assert.equal(fit.intercept, 0, `${dim} intercept should be identity (0)`);
  }
});
