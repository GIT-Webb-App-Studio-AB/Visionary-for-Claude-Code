import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tryLoadOrt, getStatus, defaultModelPath } from '../onnx-runtime.mjs';

test('tryLoadOrt returns null gracefully when package missing', async () => {
  const result = await tryLoadOrt();
  // null is correct when onnxruntime-web is not installed; non-null when it is
  assert.ok(result === null || typeof result === 'object');
});

test('getStatus reports state', () => {
  const s = getStatus();
  assert.ok(['unloaded', 'loaded', 'unavailable'].includes(s));
});

test('defaultModelPath returns path containing dinov2', () => {
  const p = defaultModelPath();
  assert.ok(p.includes('dinov2'));
  assert.ok(p.includes('.onnx'));
});
