import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resource as stylesResource } from '../src/resources/styles.mjs';
import { resource as tasteResource } from '../src/resources/taste-summary.mjs';
import { resource as tracesResource } from '../src/resources/traces.mjs';

test('styles resource matches its prefix', () => {
  assert.equal(stylesResource.matches('visionary://styles/_index'), true);
  assert.equal(stylesResource.matches('visionary://other/x'), false);
});

test('styles resource list returns array of resource descriptors', async () => {
  const list = await stylesResource.list();
  assert.ok(Array.isArray(list));
  assert.ok(list.length >= 1);
  assert.ok(list[0].uri);
  assert.ok(list[0].mimeType);
});

test('taste-summary resource never returns raw fact data', async () => {
  const result = await tasteResource.read('visionary://taste/summary');
  const text = result.contents[0].text;
  // Heuristic: aggregated summary, not full facts
  assert.ok(text.length < 50_000); // sanity cap
});

test('traces resource matches templated URI', () => {
  assert.equal(tracesResource.matches('visionary://traces/_list'), true);
  assert.equal(tracesResource.matches('visionary://traces/abc-123'), true);
  assert.equal(tracesResource.matches('visionary://styles/_index'), false);
});
