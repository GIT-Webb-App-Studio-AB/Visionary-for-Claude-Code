import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVisualContextBlock, getVisualSummary } from '../inject.mjs';

test('buildVisualContextBlock returns empty when args missing', async () => {
  assert.equal(await buildVisualContextBlock({ screenshotPath: '', styleId: 'x' }), '');
  assert.equal(await buildVisualContextBlock({ screenshotPath: 'x', styleId: '' }), '');
});

test('buildVisualContextBlock returns empty for non-existent screenshot', async () => {
  const result = await buildVisualContextBlock({
    screenshotPath: '/nonexistent/file.png',
    styleId: 'rams',
  });
  assert.equal(result, '');
});

test('getVisualSummary returns null when stack unavailable', async () => {
  const result = await getVisualSummary({
    screenshotPath: '/nonexistent.png',
    styleId: 'rams',
  });
  assert.equal(result, null);
});
