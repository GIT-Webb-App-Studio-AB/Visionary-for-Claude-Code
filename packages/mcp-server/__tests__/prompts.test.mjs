import { test } from 'node:test';
import assert from 'node:assert/strict';

import { prompt as aestheticBrief } from '../src/prompts/aesthetic-brief.mjs';
import { prompt as slopExplanation } from '../src/prompts/slop-explanation.mjs';

test('aesthetic_brief renders messages array', () => {
  const result = aestheticBrief.render({
    product_type: 'dashboard',
    audience: 'engineers',
    archetype: 'sage',
  });
  assert.ok(Array.isArray(result.messages));
  assert.equal(result.messages[0].role, 'user');
});

test('slop_explanation accepts pattern_id', () => {
  const result = slopExplanation.render({ pattern_id: 5 });
  assert.ok(Array.isArray(result.messages));
});
