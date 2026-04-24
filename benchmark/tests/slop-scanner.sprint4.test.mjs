// Run: node --test benchmark/tests/slop-scanner.sprint4.test.mjs
//
// Sprint 4 Task 13.2 — verifies slop-patterns #27–#31 fire on artificial
// test cases. The existing patterns 1-20 are covered by the Sprint 1-2
// test suite; this file scopes tightly to the new ones.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanSlop } from '../scorers/slop-scanner.mjs';

// ── #27: missing @layer ─────────────────────────────────────────────────────
test('#27 missing-layer-cascade fires on stylesheet without layers', () => {
  const src = [
    'const css = `',
    '  :root { --bg: white; }',
    '  .card { padding: 16px; }',
    '`;',
    'export function App(){return <div className="card">x</div>;}',
  ].join('\n');
  const { flags } = scanSlop(src);
  assert.ok(flags.includes('missing-layer-cascade'), JSON.stringify(flags));
});

test('#27 skips when @layer ordering is present', () => {
  const src = [
    'const css = `',
    '  @layer reset, tokens, base, components;',
    '  :root { --bg: white; }',
    '  .card { padding: 16px; }',
    '`;',
    'export function App(){return <div className="card">x</div>;}',
  ].join('\n');
  const { flags } = scanSlop(src);
  assert.ok(!flags.includes('missing-layer-cascade'), JSON.stringify(flags));
});

// ── #28: @floating-ui imports ──────────────────────────────────────────────
test('#28 floating-ui-import fires on react subpackage', () => {
  const src = "import { useFloating } from '@floating-ui/react';";
  const { flags } = scanSlop(src);
  assert.ok(flags.includes('floating-ui-import'));
});

test('#28 floating-ui-import fires on dom subpackage', () => {
  const src = 'import { computePosition } from "@floating-ui/dom";';
  const { flags } = scanSlop(src);
  assert.ok(flags.includes('floating-ui-import'));
});

test('#28 skips non-floating-ui imports', () => {
  const src = "import { useState } from 'react';";
  const { flags } = scanSlop(src);
  assert.ok(!flags.includes('floating-ui-import'));
});

// ── #29: textarea rows without field-sizing ─────────────────────────────────
test('#29 textarea-rows-no-field-sizing fires', () => {
  const src = '<textarea rows={6} placeholder="x" />';
  const { flags } = scanSlop(src);
  assert.ok(flags.includes('textarea-rows-no-field-sizing'));
});

test('#29 skips when field-sizing: content is present', () => {
  const src = "<textarea rows={6} style={{ fieldSizing: 'content' }} />";
  const { flags } = scanSlop(src);
  assert.ok(!flags.includes('textarea-rows-no-field-sizing'));
});

test('#29 skips when no textarea', () => {
  const src = '<input rows={6} />';
  const { flags } = scanSlop(src);
  assert.ok(!flags.includes('textarea-rows-no-field-sizing'));
});

// ── #30: onClick modal without commandfor ──────────────────────────────────
test('#30 modal-onclick-no-invoker fires on useState + onClick toggle', () => {
  const src = [
    'const [isModalOpen, setOpen] = useState(false);',
    'return <button onClick={() => setOpen(true)}>Open</button>;',
  ].join('\n');
  const { flags } = scanSlop(src);
  assert.ok(flags.includes('modal-onclick-no-invoker'), JSON.stringify(flags));
});

test('#30 skips when commandfor is present alongside state', () => {
  const src = [
    'const [isModalOpen, setOpen] = useState(false);',
    'return <button commandfor="modal" command="show-popover">Open</button>;',
  ].join('\n');
  const { flags } = scanSlop(src);
  assert.ok(!flags.includes('modal-onclick-no-invoker'));
});

// ── #31: useRef for dropdown position ──────────────────────────────────────
test('#31 useref-dropdown-position fires', () => {
  const src = [
    'const dropdownRef = useRef(null);',
    'useEffect(() => {',
    '  const rect = dropdownRef.current.getBoundingClientRect();',
    '}, []);',
  ].join('\n');
  const { flags } = scanSlop(src);
  assert.ok(flags.includes('useref-dropdown-position'), JSON.stringify(flags));
});

test('#31 skips when anchor CSS is present', () => {
  const src = [
    'const dropdownRef = useRef(null);',
    "return <menu style={{ positionAnchor: '--btn' }}>x</menu>;",
  ].join('\n');
  const { flags } = scanSlop(src);
  assert.ok(!flags.includes('useref-dropdown-position'));
});

// ── Full-file smoke test ────────────────────────────────────────────────────
test('Baseline-2026 model component triggers none of #27–31', () => {
  const src = [
    "import { motion } from 'motion/react';",
    'const css = `',
    '  @layer reset, tokens, base, components;',
    '  .card { field-sizing: content; view-transition-name: card-1; }',
    '`;',
    'export function Card() {',
    '  return (',
    '    <>',
    '      <button popovertarget="menu" commandfor="menu" command="show-popover">Open</button>',
    "      <menu id=\"menu\" popover=\"auto\" style={{ anchorName: '--b', positionAnchor: '--b' }}>",
    '        <li><button commandfor="menu" command="close">Item</button></li>',
    '      </menu>',
    "      <textarea style={{ fieldSizing: 'content' }} />",
    '    </>',
    '  );',
    '}',
  ].join('\n');
  const { flags } = scanSlop(src);
  const sprint4Flags = flags.filter((f) => [
    'missing-layer-cascade',
    'floating-ui-import',
    'textarea-rows-no-field-sizing',
    'modal-onclick-no-invoker',
    'useref-dropdown-position',
  ].includes(f));
  assert.deepEqual(sprint4Flags, [], `baseline component should hit 0 sprint-4 flags, got ${JSON.stringify(sprint4Flags)}`);
});
