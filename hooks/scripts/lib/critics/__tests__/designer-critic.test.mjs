import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadDesignerPack,
  hasCriticPersona,
  runDesignerCritic,
  translateDim,
  parseYamlFrontmatter,
} from '../designer-critic.mjs';

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

// ---------------------------------------------------------------------------
// Sprint 20 cinematic-pack support: .md frontmatter loader + dim translation.
// ---------------------------------------------------------------------------

test('parseYamlFrontmatter handles scalars, lists, nested mappings, flow', () => {
  const text = `---
id: test
name: Test Pack
era: "1990-2000"
films:
  - "A (1990)"
  - "B (1995)"
cinema_palette:
  primary:
    name: warm-amber
    oklch: "oklch(0.78 0.14 65)"
arbitration:
  weight_in_table: 0.25
  can_veto: false
critic_persona:
  role: "design auditor"
  scoring_priorities:
    - { dim: motion_coherence, weight: 1.6, direction: "prefer trail" }
    - { dim: hierarchy, weight: 1.5, direction: "strict" }
  veto_conditions:
    - "snap-only motion"
---
body content here`;
  const parsed = parseYamlFrontmatter(text);
  assert.equal(parsed.id, 'test');
  assert.equal(parsed.name, 'Test Pack');
  assert.equal(parsed.era, '1990-2000');
  assert.deepEqual(parsed.films, ['A (1990)', 'B (1995)']);
  assert.equal(parsed.cinema_palette.primary.name, 'warm-amber');
  assert.equal(parsed.cinema_palette.primary.oklch, 'oklch(0.78 0.14 65)');
  assert.equal(parsed.arbitration.weight_in_table, 0.25);
  assert.equal(parsed.arbitration.can_veto, false);
  assert.equal(parsed.critic_persona.role, 'design auditor');
  assert.equal(parsed.critic_persona.scoring_priorities.length, 2);
  assert.equal(parsed.critic_persona.scoring_priorities[0].dim, 'motion_coherence');
  assert.equal(parsed.critic_persona.scoring_priorities[0].weight, 1.6);
  assert.equal(parsed.critic_persona.scoring_priorities[0].direction, 'prefer trail');
  assert.deepEqual(parsed.critic_persona.veto_conditions, ['snap-only motion']);
});

test('parseYamlFrontmatter returns null for missing frontmatter', () => {
  assert.equal(parseYamlFrontmatter('just markdown content'), null);
  assert.equal(parseYamlFrontmatter('---\nno-close\n'), null);
});

test('translateDim maps cinematic dims to runtime-canonical dims', () => {
  assert.equal(translateDim('motion_coherence'),     'motion_readiness');
  assert.equal(translateDim('emotional_resonance'),  'distinctiveness');
  assert.equal(translateDim('color_harmony'),        'contrast');
  assert.equal(translateDim('density'),              'layout');
  assert.equal(translateDim('whitespace'),           'layout');
  assert.equal(translateDim('structural_integrity'), 'hierarchy');
  assert.equal(translateDim('brand_fit'),            'brief_conformance');
  // Identity mappings.
  assert.equal(translateDim('hierarchy'),       'hierarchy');
  assert.equal(translateDim('typography'),      'typography');
  assert.equal(translateDim('accessibility'),   'accessibility');
  assert.equal(translateDim('distinctiveness'), 'distinctiveness');
  // Sprint 15 dims that match runtime list.
  assert.equal(translateDim('motion_readiness'),  'motion_readiness');
  assert.equal(translateDim('contrast'),          'contrast');
  assert.equal(translateDim('brief_conformance'), 'brief_conformance');
  // Unknown dim passes through untouched (caller filters via KNOWN_DIMS).
  assert.equal(translateDim('not_a_real_dim'), 'not_a_real_dim');
});

test('loadDesignerPack reads cinematic .md packs (Sprint 20)', async () => {
  const pack = await loadDesignerPack('wong-kar-wai');
  assert.ok(pack, 'wong-kar-wai pack should load');
  assert.equal(pack.id, 'wong-kar-wai');
  assert.equal(pack.name, 'Wong Kar-wai');
  assert.equal(pack.category, 'filmmaker');
  assert.ok(pack.philosophy, 'philosophy field present');
  assert.ok(Array.isArray(pack.prompt_bias), 'prompt_bias is a list');
  assert.ok(pack.critic_persona, 'critic_persona block present');
  assert.ok(Array.isArray(pack.critic_persona.scoring_priorities));
  assert.ok(pack.arbitration, 'arbitration block present');
  assert.equal(typeof pack.arbitration.weight_in_table, 'number');
  assert.equal(typeof pack.arbitration.can_veto, 'boolean');
});

test('hasCriticPersona accepts loaded cinematic packs', async () => {
  const pack = await loadDesignerPack('wong-kar-wai');
  assert.equal(hasCriticPersona(pack), true);
});

test('runDesignerCritic translates cinematic dim → runtime dim', async () => {
  // wong-kar-wai prioritises motion_coherence which must map to motion_readiness.
  const result = await runDesignerCritic({
    designerId: 'wong-kar-wai',
    sourceContext: { scores: { motion_readiness: 6, distinctiveness: 7 } },
  });
  assert.equal(result.skipped, undefined, 'should not skip — pack has critic_persona');
  assert.ok(
    result.scores.motion_readiness !== null,
    'motion_coherence priority should populate motion_readiness slot',
  );
  // emotional_resonance → distinctiveness — should also be populated.
  assert.ok(
    result.scores.distinctiveness !== null,
    'emotional_resonance priority should populate distinctiveness slot',
  );
  // The cinematic-named slot itself does NOT exist on the runtime score row.
  assert.equal(
    result.scores.motion_coherence,
    undefined,
    'no cinematic-named slot should leak onto the runtime score row',
  );
});

test('json packs continue to load and run unchanged', async () => {
  // Regression guard: Sprint 15 .json loader path must still work.
  const pack = await loadDesignerPack('dieter-rams');
  assert.ok(pack);
  assert.equal(pack.name, 'Dieter Rams');
  const result = await runDesignerCritic({
    designerId: 'dieter-rams',
    sourceContext: { scores: { hierarchy: 7, distinctiveness: 8 } },
  });
  assert.equal(result.skipped, undefined);
  assert.ok(result.scores.hierarchy !== null);
});
