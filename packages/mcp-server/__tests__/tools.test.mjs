import { test } from 'node:test';
import assert from 'node:assert/strict';

// Importera tools — sökvägar relativt packages/mcp-server/__tests__/
import { tool as slopGate } from '../src/tools/slop-gate.mjs';
import { tool as motionScore } from '../src/tools/motion-score.mjs';
import { tool as validateEvidence } from '../src/tools/validate-evidence.mjs';

test('slop_gate has correct schema', () => {
  assert.equal(slopGate.name, 'visionary.slop_gate');
  assert.ok(slopGate.inputSchema);
  assert.ok(typeof slopGate.handler === 'function');
});

test('slop_gate returns content array', async () => {
  const result = await slopGate.handler({ source: 'div { color: cyan }' });
  assert.ok(Array.isArray(result.content));
  const parsed = JSON.parse(result.content[0].text);
  assert.ok(typeof parsed.rejected === 'boolean' || parsed.rejected === undefined);
});

test('motion_score has correct schema', () => {
  assert.equal(motionScore.name, 'visionary.motion_score');
});

test('motion_score returns motion result', async () => {
  const result = await motionScore.handler({
    source: '.x { transition: all 200ms ease }',
  });
  const parsed = JSON.parse(result.content[0].text);
  assert.ok(typeof parsed.total_score === 'number');
  assert.ok(typeof parsed.tier === 'number');
  assert.ok(parsed.subscores);
});

test('validate_evidence has correct schema', () => {
  assert.equal(validateEvidence.name, 'visionary.validate_evidence');
});
