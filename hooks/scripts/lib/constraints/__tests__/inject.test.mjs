// inject.test.mjs — Sprint 21 Task 38.2
//
// Verifies sampleConstraints + formatPromptInvariants against a fixture
// catalogue (so tests don't depend on the on-disk skill catalogue state).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  sampleConstraints,
  formatPromptInvariants,
  loadCatalog,
} from '../inject.mjs';

// Build a temporary fixture catalogue. Each constraint is a YAML
// frontmatter file matching the production schema.
function buildFixtureDir(constraints) {
  const dir = mkdtempSync(join(tmpdir(), 'visionary-constraints-test-'));
  for (const c of constraints) {
    const lines = ['---'];
    lines.push(`id: ${c.id}`);
    lines.push(`category: ${c.category}`);
    lines.push('css_rules:');
    for (const r of c.css_rules || ['rule']) lines.push(`  - "${r}"`);
    lines.push('invariants:');
    for (const r of c.invariants || ['inv']) lines.push(`  - "${r}"`);
    if (c.conflict_set && c.conflict_set.length > 0) {
      lines.push(
        `conflict_set: [${c.conflict_set.map((s) => `"${s}"`).join(', ')}]`,
      );
    } else {
      lines.push('conflict_set: []');
    }
    lines.push(`rationale: "${c.rationale || 'why this matters'}"`);
    lines.push('examples:');
    for (const e of c.examples || ['example']) lines.push(`  - "${e}"`);
    lines.push('---');
    lines.push('');
    lines.push('# Body');
    lines.push('');
    lines.push('Free-text manifest goes here.');
    writeFileSync(join(dir, `${c.id}.md`), lines.join('\n'));
  }
  return dir;
}

function deterministicRng(values) {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i += 1;
    return v;
  };
}

// ── 1. sampleConstraints with k=1 returns 1 ───────────────────────────────

test('sampleConstraints: k=1 returns exactly 1', () => {
  const dir = buildFixtureDir([
    { id: 'no-rectangles', category: 'form' },
    { id: 'single-color', category: 'color' },
    { id: 'monospace-headlines', category: 'typography' },
  ]);
  try {
    const result = sampleConstraints({ k: 1, customDir: dir });
    assert.equal(result.length, 1);
    assert.ok(typeof result[0].id === 'string');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── 2. sampleConstraints with k=3 returns 3 non-conflicting ───────────────

test('sampleConstraints: k=3 returns 3 non-conflicting constraints', () => {
  const dir = buildFixtureDir([
    { id: 'no-rectangles', category: 'form', conflict_set: [] },
    { id: 'single-color', category: 'color', conflict_set: [] },
    { id: 'monospace-headlines', category: 'typography', conflict_set: [] },
    { id: 'asymmetry-only', category: 'layout', conflict_set: [] },
    { id: 'no-transitions', category: 'motion', conflict_set: [] },
  ]);
  try {
    const result = sampleConstraints({ k: 3, customDir: dir });
    assert.equal(result.length, 3);
    const ids = result.map((c) => c.id);
    assert.equal(new Set(ids).size, 3, 'all picks must be distinct');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── 3. excludeIds skipped ─────────────────────────────────────────────────

test('sampleConstraints: excludeIds is honored', () => {
  const dir = buildFixtureDir([
    { id: 'a', category: 'form' },
    { id: 'b', category: 'color' },
    { id: 'c', category: 'layout' },
  ]);
  try {
    const result = sampleConstraints({
      k: 2,
      excludeIds: ['a'],
      customDir: dir,
    });
    assert.equal(result.length, 2);
    for (const c of result) assert.notEqual(c.id, 'a');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── 4. Conflict_set respected ─────────────────────────────────────────────

test('sampleConstraints: conflict_set is enforced', () => {
  const dir = buildFixtureDir([
    {
      id: 'no-rectangles',
      category: 'form',
      conflict_set: ['pixel-perfect-grid'],
    },
    { id: 'pixel-perfect-grid', category: 'layout', conflict_set: [] },
    { id: 'single-color', category: 'color', conflict_set: [] },
  ]);
  try {
    // Force the RNG to pick no-rectangles first (index 0), then attempt
    // to pick from a 1-item pool (only single-color remains; pixel-perfect-grid
    // is forbidden by no-rectangles' conflict_set).
    const rng = deterministicRng([0, 0]);
    const result = sampleConstraints({ k: 2, rng, customDir: dir });
    const ids = result.map((c) => c.id);
    assert.ok(ids.includes('no-rectangles'), 'no-rectangles should be picked');
    assert.ok(
      !ids.includes('pixel-perfect-grid'),
      'pixel-perfect-grid must be excluded by conflict_set',
    );
    // With 3 fixture entries and 1 conflict, the remaining candidate after
    // no-rectangles should be single-color.
    assert.equal(result.length, 2);
    assert.ok(ids.includes('single-color'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Symmetric conflict — even if B doesn't list A, picking A (which lists B)
// should still forbid B. This guards against asymmetric authoring.
test('sampleConstraints: conflict relations are symmetric', () => {
  const dir = buildFixtureDir([
    { id: 'a', category: 'form', conflict_set: ['b'] },
    { id: 'b', category: 'color', conflict_set: [] },     // doesn't list a
    { id: 'c', category: 'layout', conflict_set: [] },
  ]);
  try {
    // Pick 'a' first, then verify 'b' is excluded.
    const rng = deterministicRng([0, 0, 0]);
    const result = sampleConstraints({ k: 3, rng, customDir: dir });
    const ids = result.map((c) => c.id);
    if (ids.includes('a')) {
      assert.ok(!ids.includes('b'), 'b must be forbidden when a is picked');
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── 5. formatPromptInvariants returns non-empty for 2+ constraints ────────

test('formatPromptInvariants: returns non-empty for 2 constraints', () => {
  const constraints = [
    {
      id: 'no-rectangles',
      category: 'form',
      css_rules: ['border-radius >= 12px'],
      invariants: ['no element with radius < 12px and rect aspect'],
      rationale: 'Forces organic forms over default rectangles.',
    },
    {
      id: 'single-color',
      category: 'color',
      css_rules: ['one hue + neutrals'],
      invariants: ['1 chromatic hue-bin'],
      rationale: 'Visceral coherence comes from one-hue commitment.',
    },
  ];
  const text = formatPromptInvariants(constraints);
  assert.ok(text.length > 0);
  assert.ok(text.includes('no-rectangles'));
  assert.ok(text.includes('single-color'));
  assert.ok(text.includes('CONSTRAINT-INJECTION'));
  assert.ok(text.includes('HARD INVARIANTS'));
});

// ── 6. Empty catalog → empty array, no crash ─────────────────────────────

test('sampleConstraints: empty catalogue returns empty array', () => {
  const dir = mkdtempSync(join(tmpdir(), 'visionary-empty-'));
  try {
    const result = sampleConstraints({ k: 3, customDir: dir });
    assert.deepEqual(result, []);
    const text = formatPromptInvariants(result);
    assert.equal(text, '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('loadCatalog: non-existent dir returns []', () => {
  const result = loadCatalog('/this/path/does/not/exist/anywhere');
  assert.deepEqual(result, []);
});

// Regression: previously the parser crashed on a file with empty
// frontmatter. Make sure the malformed file is silently skipped.
test('loadCatalog: malformed file is skipped, not thrown', () => {
  const dir = mkdtempSync(join(tmpdir(), 'visionary-malformed-'));
  try {
    writeFileSync(join(dir, 'good.md'), [
      '---',
      'id: good',
      'category: form',
      'css_rules:',
      '  - "rule"',
      'invariants:',
      '  - "inv"',
      'rationale: "ok"',
      'examples:',
      '  - "ex"',
      '---',
      '',
      'body',
    ].join('\n'));
    writeFileSync(join(dir, 'bad.md'), 'no frontmatter at all');
    const result = loadCatalog(dir);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'good');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
