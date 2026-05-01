import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildArbitrationTable, mergeWithDesigner } from '../arbitration-with-designer.mjs';

test('table includes all critics that scored a dim', () => {
  const table = buildArbitrationTable({
    craftCritique: { scores: { hierarchy: 7 } },
    aestheticCritique: { scores: { hierarchy: 8 } },
    designerOutput: { scores: { hierarchy: 9 } },
  });
  assert.equal(table.hierarchy.craft, 7);
  assert.equal(table.hierarchy.aesthetic, 8);
  assert.equal(table.hierarchy.designer, 9);
});

test('mergeWithDesigner respects weight_in_table', async () => {
  const result = await mergeWithDesigner({
    craftCritique: { scores: { hierarchy: 8 } },
    aestheticCritique: { scores: { hierarchy: 8 } },
    designerOutput: { scores: { hierarchy: 4 }, weight_in_table: 0.25 },
  });
  // Designer at 0.25 weight should pull merged slightly below 8
  assert.ok(result.scores.hierarchy < 8);
  assert.ok(result.scores.hierarchy > 6.5);
});

test('mergeWithDesigner ignores designer rows that are null', async () => {
  const result = await mergeWithDesigner({
    craftCritique: { scores: { layout: 7 } },
    aestheticCritique: { scores: { layout: 7 } },
    designerOutput: { scores: { layout: null } },
  });
  assert.equal(result.scores.layout, 7);
});

test('mergeWithDesigner reports conflicts', async () => {
  const result = await mergeWithDesigner({
    craftCritique: { scores: { distinctiveness: 4 } },
    aestheticCritique: { scores: { distinctiveness: 9 } },
    designerOutput: { scores: { distinctiveness: 5 }, weight_in_table: 0.25 },
  });
  assert.ok(Array.isArray(result.conflicts));
});

test('mergeWithDesigner passes through veto list', async () => {
  const result = await mergeWithDesigner({
    craftCritique: { scores: {} },
    aestheticCritique: { scores: {} },
    designerOutput: {
      designer_id: 'rams',
      scores: {},
      vetoes_triggered: ['ornament without function'],
      can_veto: true,
    },
  });
  assert.deepEqual(result.designer_vetoes, ['ornament without function']);
  assert.equal(result.designer_id, 'rams');
});
