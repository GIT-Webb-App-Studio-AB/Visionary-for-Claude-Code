// Run: node --test hooks/scripts/lib/__tests__/slop-gate-integration.test.mjs
//
// Sprint 08 Task 22.5 — end-to-end. Invokes capture-and-critique.mjs as a
// subprocess with a crafted stdin payload + a written .tsx file containing
// known slop patterns. Verifies that the hook's additionalContext carries
// regen directives rather than critic-invocation instructions.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..', '..');
const hookPath = join(repoRoot, 'hooks', 'scripts', 'capture-and-critique.mjs');

function mkProject() {
  const dir = mkdtempSync(join(tmpdir(), 'slop-int-'));
  // Pretend to be a project root so findProjectRoot anchors here.
  writeFileSync(join(dir, 'package.json'), '{"name":"slop-int"}');
  mkdirSync(join(dir, 'src'), { recursive: true });
  return dir;
}

// Runs the hook with a given input payload and returns parsed output.
function runHook(input, envOverrides = {}) {
  const res = spawnSync(
    process.execPath,
    [hookPath],
    {
      input: JSON.stringify(input),
      encoding: 'utf8',
      env: { ...process.env, ...envOverrides },
    },
  );
  const out = (res.stdout || '').trim();
  return { status: res.status, stdout: out, stderr: res.stderr || '', parsed: out ? safeParse(out) : null };
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

// A .tsx source that hits at least 2 blocking slop patterns:
//   - Default Tailwind blue #3B82F6 (bg-blue-500)
//   - Cyan-on-dark (text-cyan-* on bg-gray-900)
const SLOPPY_SOURCE = `
export default function Hero() {
  return (
    <div className="bg-gray-900">
      <h1 className="text-cyan-400">Welcome</h1>
      <button className="bg-blue-500">Get started</button>
    </div>
  );
}
`;

// A clean .tsx source with no slop patterns.
const CLEAN_SOURCE = `
export default function Hero() {
  return (
    <article>
      <h1 style={{ fontFamily: 'Bricolage Grotesque', color: '#1A1614' }}>Welcome</h1>
      <button style={{ background: '#5B2A2A', color: '#F4EFE6' }}>Get started</button>
    </article>
  );
}
`;

// ── Tests ───────────────────────────────────────────────────────────────────
test('integration: ≥ 2 slop patterns trigger reject-context instead of critique', () => {
  const dir = mkProject();
  const filePath = join(dir, 'src', 'hero.tsx');
  writeFileSync(filePath, SLOPPY_SOURCE);

  const { status, parsed, stderr } = runHook({
    tool_name: 'Write',
    tool_input: { file_path: filePath },
    cwd: dir,
  }, {
    // Force a deterministic session id so trace paths are predictable.
    VISIONARY_SESSION_ID: 'sess-int-reject',
    // Ensure no previous-round debounce/cache interferes.
    CLAUDE_PLUGIN_DATA: join(dir, '.cache'),
  });
  assert.equal(status, 0, `hook failed: ${stderr}`);
  assert.ok(parsed, 'hook should emit JSON');
  assert.ok(parsed.additionalContext, 'additionalContext should exist');
  assert.match(parsed.additionalContext, /VISUAL CRITIQUE BLOCKED BY SLOP GATE/,
    `expected reject banner, got: ${parsed.additionalContext.slice(0, 200)}`);
  assert.match(parsed.additionalContext, /REGEN REQUIRED/);
  // Pattern names mentioned
  assert.match(parsed.additionalContext, /Default Tailwind blue|Cyan-on-dark/);
  // Critic invocation instructions should NOT be present
  assert.doesNotMatch(parsed.additionalContext, /Invoke the visual-critic subagent/);
});

test('integration: trace file has slop_blocked entry', () => {
  const dir = mkProject();
  const filePath = join(dir, 'src', 'hero2.tsx');
  writeFileSync(filePath, SLOPPY_SOURCE);

  runHook({
    tool_name: 'Write',
    tool_input: { file_path: filePath },
    cwd: dir,
  }, {
    VISIONARY_SESSION_ID: 'sess-int-trace',
    CLAUDE_PLUGIN_DATA: join(dir, '.cache'),
  });

  // v1.5.2+: traces follow CLAUDE_PLUGIN_DATA when set (no '.' prefix on the
  // 'visionary' segment because the path lives outside the user's project).
  const traceFile = join(dir, '.cache', 'visionary', 'traces', 'sess-int-trace.jsonl');
  assert.ok(existsSync(traceFile), `trace file should exist at ${traceFile}`);
  const body = readFileSync(traceFile, 'utf8');
  const lines = body.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const blocked = lines.find((e) => e.event === 'slop_blocked');
  assert.ok(blocked, `should have slop_blocked event, got events: ${lines.map((l) => l.event).join(', ')}`);
  assert.ok(blocked.payload.blocking_count >= 2);
  assert.ok(Array.isArray(blocked.payload.blocking_patterns));
});

test('integration: clean source passes gate → normal critic context emitted', () => {
  const dir = mkProject();
  const filePath = join(dir, 'src', 'clean.tsx');
  writeFileSync(filePath, CLEAN_SOURCE);

  const { parsed, stderr } = runHook({
    tool_name: 'Write',
    tool_input: { file_path: filePath },
    cwd: dir,
  }, {
    VISIONARY_SESSION_ID: 'sess-int-clean',
    CLAUDE_PLUGIN_DATA: join(dir, '.cache'),
  });
  assert.ok(parsed, stderr);
  // Should NOT contain reject banner
  assert.doesNotMatch(parsed.additionalContext, /BLOCKED BY SLOP GATE/);
  // Should contain normal critic flow
  assert.match(parsed.additionalContext, /VISUAL CRITIQUE REQUESTED|Invoke the visual-critic/);
});

test('integration: VISIONARY_SLOP_REJECT_THRESHOLD=99 disables the gate', () => {
  const dir = mkProject();
  const filePath = join(dir, 'src', 'hero3.tsx');
  writeFileSync(filePath, SLOPPY_SOURCE);

  const { parsed } = runHook({
    tool_name: 'Write',
    tool_input: { file_path: filePath },
    cwd: dir,
  }, {
    VISIONARY_SESSION_ID: 'sess-int-disabled',
    VISIONARY_SLOP_REJECT_THRESHOLD: '99',
    CLAUDE_PLUGIN_DATA: join(dir, '.cache'),
  });
  assert.ok(parsed);
  assert.doesNotMatch(parsed.additionalContext, /BLOCKED BY SLOP GATE/);
  assert.match(parsed.additionalContext, /VISUAL CRITIQUE REQUESTED/);
});

test('integration: file with whitelisted style does not block', () => {
  const dir = mkProject();
  const filePath = join(dir, 'src', 'brutalist-hero.tsx');
  // Add the .visionary-generated marker for brutalist-honesty (which
  // whitelists "default tailwind blue" + "uniform border-radius" + "symmetric padding").
  // Our source hits default-blue + cyan-on-dark: only default-blue is whitelisted,
  // so blocking_count should drop from 2 to 1 → gate does NOT trigger (threshold=2).
  const withMarker = `/**
 * .visionary-generated
 * style: brutalist-honesty
 * brief: "hero for punk zine"
 * generated_at: 2026-04-24T10:00:00Z
 * generation_id: test-brutalist
 */
${SLOPPY_SOURCE}`;
  writeFileSync(filePath, withMarker);

  const { parsed } = runHook({
    tool_name: 'Write',
    tool_input: { file_path: filePath },
    cwd: dir,
  }, {
    VISIONARY_SESSION_ID: 'sess-int-whitelist',
    CLAUDE_PLUGIN_DATA: join(dir, '.cache'),
  });
  assert.ok(parsed);
  // With only 1 blocking pattern (cyan-on-dark; blue is whitelisted), gate
  // should NOT trigger at default threshold 2.
  assert.doesNotMatch(parsed.additionalContext, /BLOCKED BY SLOP GATE/,
    `whitelist should reduce blocking_count below threshold; got: ${parsed.additionalContext.slice(0, 300)}`);
});
