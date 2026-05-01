import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDesignerPack, hasCriticPersona, runDesignerCritic } from '../designer-critic.mjs';

test('loads existing pack', async () => {
  const pack = await loadDesignerPack('dieter-rams');
  assert.ok(pack);
  assert.ok(pack.name);
});

test('returns null for unknown pack', async () => {
  const pack = await loadDesignerPack('does-not-exist');
  assert.equal(pack, null);
});

test('hasCriticPersona detects updated packs', async () => {
  const pack = await loadDesignerPack('dieter-rams');
  assert.equal(hasCriticPersona(pack), true);
});

test('runDesignerCritic returns scores for prioritised dims', async () => {
  const result = await runDesignerCritic({
    designerId: 'dieter-rams',
    sourceContext: { scores: { hierarchy: 7, distinctiveness: 8 } },
  });
  assert.equal(result.skipped, undefined);
  assert.ok(result.scores.hierarchy !== null);
  assert.equal(result.scores.layout, null);
});

test('runDesignerCritic emits null for non-prioritised dims', async () => {
  const result = await runDesignerCritic({
    designerId: 'dieter-rams',
    sourceContext: { scores: {} },
  });
  // Layout is not in Rams's priorities → null
  assert.equal(result.scores.layout, null);
});

test('skipped when pack lacks critic_persona', async () => {
  const result = await runDesignerCritic({ designerId: 'no-such-pack', sourceContext: {} });
  assert.equal(result.skipped, true);
});
