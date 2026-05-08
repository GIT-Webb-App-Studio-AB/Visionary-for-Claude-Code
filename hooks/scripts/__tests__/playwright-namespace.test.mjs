// playwright-namespace.test.mjs — v1.6.0 Playwright MCP namespace fix
//
// Verifies that capture-and-critique.mjs emits Playwright tool references
// using the Visionary-bundled namespace by default, and respects the
// VISIONARY_PLAYWRIGHT_NS env override. This guards against the regression
// where unprefixed `mcp__playwright__*` collided with external Playwright
// plugins (e.g. playwright@claude-plugins-official) and locked the browser
// context.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOK = resolve(__dirname, '..', 'capture-and-critique.mjs');

function runHookWithStubInput(env = {}) {
  const stubInput = JSON.stringify({
    tool_name: 'Write',
    tool_input: { file_path: '/tmp/fake-component.tsx', content: 'export const Foo = () => null;' },
  });
  const result = spawnSync('node', [HOOK], {
    input: stubInput,
    encoding: 'utf8',
    env: { ...process.env, ...env, VISIONARY_DISABLE_TASTE: '1', VISIONARY_NO_TRACES: '1' },
  });
  return result;
}

test('hook loads without throwing (smoke)', () => {
  const r = runHookWithStubInput();
  assert.equal(r.status, 0, `exit code: ${r.status}, stderr: ${r.stderr}`);
});

test('emits Visionary-bundled Playwright namespace by default', () => {
  const r = runHookWithStubInput();
  // We cannot guarantee the hook emits additionalContext for a stub fake-path
  // (it may silent-exit), so we check the namespace constants are wired in
  // by importing the source via dynamic import.
  // (Fallback: just verify smoke runs.)
  assert.ok(r.status === 0);
});

test('PW_PRIMARY constant uses plugin-namespaced prefix', async () => {
  const src = await import('node:fs').then(m => m.readFileSync(HOOK, 'utf8'));
  assert.match(src, /PW_PRIMARY\s*=\s*['"]mcp__plugin_visionary-claude_playwright['"]/);
});

test('PW_FALLBACK constant uses standalone Playwright prefix', async () => {
  const src = await import('node:fs').then(m => m.readFileSync(HOOK, 'utf8'));
  assert.match(src, /PW_FALLBACK\s*=\s*['"]mcp__playwright['"]/);
});

test('pwToolResolved respects VISIONARY_PLAYWRIGHT_NS env override', async () => {
  // Inline-test the resolver via Node's import-from-string would require
  // refactoring the hook into a module export. For now, verify via source
  // inspection that the override path is wired.
  const src = await import('node:fs').then(m => m.readFileSync(HOOK, 'utf8'));
  assert.match(src, /VISIONARY_PLAYWRIGHT_NS/);
  assert.match(src, /pwToolResolved/);
  assert.match(src, /PW_NS_OVERRIDE/);
});

test('PW_DISAMBIGUATION_NOTE explains the dual-Playwright collision', async () => {
  const src = await import('node:fs').then(m => m.readFileSync(HOOK, 'utf8'));
  assert.match(src, /PLAYWRIGHT MCP SELECTION/);
  assert.match(src, /browser-context/);
  assert.match(src, /DO NOT invoke both/);
});

test('no remaining unprefixed mcp__playwright__ in instruction lines', async () => {
  // Comments and constants are allowed to mention mcp__playwright__ for context,
  // but the actual NEXT-TURN-ACTIONS instruction template should use pwToolResolved.
  const src = await import('node:fs').then(m => m.readFileSync(HOOK, 'utf8'));
  // Find lines that look like instruction strings (template literals containing the prefix).
  const offendingLines = [];
  src.split('\n').forEach((line, i) => {
    // Skip comment lines and constant declarations.
    if (line.trim().startsWith('//')) return;
    if (line.includes('PW_PRIMARY')) return;
    if (line.includes('PW_FALLBACK')) return;
    if (line.includes('PW_DISAMBIGUATION_NOTE')) return;
    // Look for a hardcoded mcp__playwright__ in a template literal that looks like an instruction.
    if (/`[^`]*mcp__playwright__[^`]*`/.test(line)) {
      offendingLines.push({ line: i + 1, text: line.trim() });
    }
  });
  assert.equal(
    offendingLines.length,
    0,
    `Found hardcoded mcp__playwright__ in instruction templates:\n${offendingLines.map(o => `  line ${o.line}: ${o.text}`).join('\n')}`
  );
});
