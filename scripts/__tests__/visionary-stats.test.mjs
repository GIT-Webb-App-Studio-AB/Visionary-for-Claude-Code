// Run: node --test scripts/__tests__/visionary-stats.test.mjs
//
// Verifies --recurring-fixes clusters repeated fixes correctly. Simulates 20+
// synthetic traces into a tmpdir, shells out to the CLI, and parses the
// markdown output.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const cliPath = join(repoRoot, 'scripts', 'visionary-stats.mjs');

function mkProjectWithTraces() {
  const dir = mkdtempSync(join(tmpdir(), 'vstats-test-'));
  writeFileSync(join(dir, 'package.json'), '{}');
  const traceDir = join(dir, '.visionary', 'traces');
  mkdirSync(traceDir, { recursive: true });

  // 20 simulated critique events across 4 sessions. Three clear recurring
  // clusters:
  //   A: "line-height too tight on .hero h1"   × 7
  //   B: "default-blue CTA needs brand token"  × 5
  //   C: "focus-visible missing on buttons"    × 4
  //   + 4 unique one-offs
  const events = [];
  const now = Date.now();
  const iso = (offsetMin = 0) => new Date(now - offsetMin * 60_000).toISOString();

  // Cluster A: 7 occurrences, spread across 3 sessions
  for (let i = 0; i < 7; i++) {
    events.push({
      session: `sess-${i % 3}`,
      entry: {
        session_id: `sess-${i % 3}`,
        generation_id: `gen-a-${i}`,
        round: 1,
        ts: iso(i * 10),
        event: 'critic_craft_output',
        emitter: 'critic-craft',
        payload: {
          top_3_fixes: [
            {
              dimension: 'typography',
              severity: 'major',
              proposed_fix: 'Increase line-height on hero h1; current value is too tight for 48px display size',
              selector_hint: '.hero h1',
              evidence: { type: 'metric', value: 'line-height=24px' },
            },
          ],
        },
      },
    });
  }

  // Cluster B: 5 occurrences
  for (let i = 0; i < 5; i++) {
    events.push({
      session: `sess-${i % 2}`,
      entry: {
        session_id: `sess-${i % 2}`,
        generation_id: `gen-b-${i}`,
        round: 1,
        ts: iso(i * 15 + 5),
        event: 'critic_aesthetic_output',
        emitter: 'critic-aesthetic',
        payload: {
          top_3_fixes: [
            {
              dimension: 'distinctiveness',
              severity: 'major',
              proposed_fix: 'Replace default-blue CTA button with brand-token accent color',
              selector_hint: 'button.primary',
              evidence: { type: 'selector', value: 'button.primary' },
            },
          ],
        },
      },
    });
  }

  // Cluster C: 4 occurrences
  for (let i = 0; i < 4; i++) {
    events.push({
      session: `sess-${i % 3}`,
      entry: {
        session_id: `sess-${i % 3}`,
        generation_id: `gen-c-${i}`,
        round: 2,
        ts: iso(i * 20 + 8),
        event: 'critic_craft_output',
        emitter: 'critic-craft',
        payload: {
          top_3_fixes: [
            {
              dimension: 'accessibility',
              severity: 'blocker',
              proposed_fix: 'Add focus-visible outline to all interactive buttons',
              selector_hint: 'button',
              evidence: { type: 'axe', value: 'focus-order-semantics' },
            },
          ],
        },
      },
    });
  }

  // 4 one-offs (unique fixes — should NOT cluster)
  const oneOffs = [
    { dim: 'typography',  fix: 'Swap Inter for a serif display pairing',       sel: 'body',   ev: { type: 'selector', value: 'body' } },
    { dim: 'contrast',    fix: 'Darken grey text labels to meet WCAG AA ratio', sel: '.meta',  ev: { type: 'axe', value: 'color-contrast' } },
    { dim: 'layout',      fix: 'Align card edges on 8-pixel grid',             sel: '.card',  ev: { type: 'selector', value: '.card' } },
    { dim: 'brief_conformance', fix: 'Add missing testimonial section',        sel: 'main',   ev: { type: 'selector', value: 'main' } },
  ];
  oneOffs.forEach((f, i) => {
    events.push({
      session: 'sess-odd',
      entry: {
        session_id: 'sess-odd',
        generation_id: `gen-x-${i}`,
        round: 1,
        ts: iso(i * 30 + 40),
        event: 'critic_output',
        emitter: 'visual-critic',
        payload: {
          top_3_fixes: [
            { dimension: f.dim, severity: 'minor', proposed_fix: f.fix, selector_hint: f.sel, evidence: f.ev },
          ],
        },
      },
    });
  });

  // Write per-session JSONL files.
  const bySession = new Map();
  for (const e of events) {
    if (!bySession.has(e.session)) bySession.set(e.session, []);
    bySession.get(e.session).push(e.entry);
  }
  for (const [sid, list] of bySession) {
    const body = list.map((e) => JSON.stringify(e)).join('\n') + '\n';
    writeFileSync(join(traceDir, `${sid}.jsonl`), body);
  }

  return { dir, total: events.length };
}

function runCli(args) {
  const res = spawnSync(process.execPath, [cliPath, ...args], { encoding: 'utf8' });
  return { stdout: res.stdout || '', stderr: res.stderr || '', status: res.status };
}

// ── Tests ───────────────────────────────────────────────────────────────────
test('--recurring-fixes reports >= 2 patterns on a 20-trace test fixture', () => {
  const { dir, total } = mkProjectWithTraces();
  assert.ok(total >= 20, `expected >= 20 events, got ${total}`);
  const { stdout, stderr, status } = runCli(['--recurring-fixes', '--project', dir, '--min-count', '3']);
  assert.equal(status, 0, `CLI failed: ${stderr}`);
  assert.ok(/# Recurring fixes/.test(stdout), 'report header present');
  const patternCount = (stdout.match(/## Pattern:/g) || []).length;
  assert.ok(patternCount >= 2, `expected >= 2 recurring patterns, got ${patternCount}: ${stdout}`);
  // The A-cluster (line-height) and B-cluster (default-blue CTA) are both
  // well above the threshold and should appear explicitly.
  assert.ok(/line-height/i.test(stdout), 'A-cluster should surface');
  assert.ok(/default-blue|brand-token/i.test(stdout), 'B-cluster should surface');
});

test('--recurring-fixes respects --min-count', () => {
  const { dir } = mkProjectWithTraces();
  // Bump min-count so only the 7-occurrence cluster survives.
  const { stdout, status } = runCli(['--recurring-fixes', '--project', dir, '--min-count', '7']);
  assert.equal(status, 0);
  const patternCount = (stdout.match(/## Pattern:/g) || []).length;
  assert.equal(patternCount, 1, 'only A-cluster should survive min-count=7');
});

test('--session prints a per-generation timeline', () => {
  const { dir } = mkProjectWithTraces();
  const { stdout, status } = runCli(['--session', 'sess-0', '--project', dir]);
  assert.equal(status, 0);
  assert.ok(/# Session sess-0/.test(stdout));
  assert.ok(/## Generation/.test(stdout));
  // Timeline table header
  assert.ok(/Round \| Event \| Emitter/.test(stdout));
});

test('--all summarises every session with event counts', () => {
  const { dir } = mkProjectWithTraces();
  const { stdout, status } = runCli(['--all', '--project', dir]);
  assert.equal(status, 0);
  assert.ok(/# All sessions/.test(stdout));
  // Session table header
  assert.ok(/Events \| Critiques/.test(stdout));
});

test('empty trace dir returns a no-events message, not a crash', () => {
  const dir = mkdtempSync(join(tmpdir(), 'vstats-empty-'));
  writeFileSync(join(dir, 'package.json'), '{}');
  const { stdout, status } = runCli(['--all', '--project', dir]);
  assert.equal(status, 0);
  assert.ok(/No trace files/.test(stdout));
});
