// Tests for circadian.mjs — Sprint 23 Task 42.1
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  approximateSolarTimes,
  getCurrentPhase,
  generateCircadianRuntimeSnippet,
  PHASES,
} from '../circadian.mjs';

const PALETTES = {
  dawn:  { 'circadian-bg': '#fef3c7', 'circadian-fg': '#7c2d12' },
  day:   { 'circadian-bg': '#ffffff', 'circadian-fg': '#0f172a' },
  dusk:  { 'circadian-bg': '#fed7aa', 'circadian-fg': '#431407' },
  night: { 'circadian-bg': '#0f172a', 'circadian-fg': '#e2e8f0' },
};

test('PHASES exposes all four phase names', () => {
  assert.deepEqual([...PHASES].sort(), ['dawn', 'day', 'dusk', 'night']);
});

test('approximateSolarTimes returns four boundaries in ascending order at equinox', () => {
  // Spring equinox ~ March 20.
  const t = approximateSolarTimes(new Date('2026-03-20T12:00:00Z'), 60);
  assert.ok(t.dawn < t.day, 'dawn before day');
  assert.ok(t.day < t.dusk, 'day before dusk');
  assert.ok(t.dusk < t.night, 'dusk before night');
});

test('seasonal swing differs between summer and winter at high latitude', () => {
  const summer = approximateSolarTimes(new Date('2026-06-21T12:00:00Z'), 60);
  const winter = approximateSolarTimes(new Date('2026-12-21T12:00:00Z'), 60);
  // Summer dawn earlier than winter dawn.
  assert.ok(summer.dawn < winter.dawn, `summer dawn ${summer.dawn} should precede winter dawn ${winter.dawn}`);
  // Summer dusk later than winter dusk.
  assert.ok(summer.dusk > winter.dusk, `summer dusk ${summer.dusk} should follow winter dusk ${winter.dusk}`);
});

test('getCurrentPhase returns 4 distinct phases across the day', () => {
  // At the equinox with lat=60 the seasonal swing is ~0, so boundaries are
  // dawn=6, day=9, dusk=18, night=22. Sample mid-phase for each band.
  const day = '2026-03-20'; // equinox so boundaries are predictable
  const phases = ['07:30', '12:00', '19:00', '23:00'].map((hhmm) =>
    getCurrentPhase(new Date(`${day}T${hhmm}:00`), 60),
  );
  // Expect each timestamp to map to a different phase.
  const unique = new Set(phases);
  assert.equal(unique.size, 4, `expected 4 distinct phases, got ${[...unique].join(',')}`);
  assert.ok(phases.every((p) => PHASES.includes(p)));
});

test('generateCircadianRuntimeSnippet emits a <script> block containing the palette JSON', () => {
  const snippet = generateCircadianRuntimeSnippet({ palettes: PALETTES, lat: 60 });
  assert.match(snippet, /^<script>/);
  assert.match(snippet, /<\/script>$/);
  assert.ok(snippet.includes('circadian-bg'));
  assert.ok(snippet.includes('dawn'));
  assert.ok(snippet.includes('15 * 60 * 1000'), 'should set 15-minute interval');
  assert.ok(snippet.includes('visibilitychange'), 'should listen for visibility changes');
});

test('generateCircadianRuntimeSnippet inner JS parses without syntax error', () => {
  const snippet = generateCircadianRuntimeSnippet({ palettes: PALETTES, lat: 60 });
  // Strip the <script> wrapper.
  const inner = snippet.replace(/^<script>/, '').replace(/<\/script>$/, '');
  // vm.Script throws on parse errors. We don't run it (no DOM) — just parse.
  assert.doesNotThrow(() => new vm.Script(inner));
});

test('generateCircadianRuntimeSnippet throws when a phase palette is missing', () => {
  const partial = { ...PALETTES };
  delete partial.dusk;
  assert.throws(() => generateCircadianRuntimeSnippet({ palettes: partial }), /missing palette/);
});

test('generateCircadianRuntimeSnippet throws on missing palettes argument', () => {
  assert.throws(() => generateCircadianRuntimeSnippet({}), /palettes is required/);
});
