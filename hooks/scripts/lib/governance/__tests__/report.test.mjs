import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDriftReport } from '../report.mjs';

test('formats empty report', () => {
  const r = formatDriftReport({ byFile: [] });
  assert.ok(r.includes('Token Drift Report'));
  assert.ok(r.includes('0 drift'));
});

test('formats drift entries with file and line', () => {
  const byFile = [{
    path: 'src/Card.tsx',
    result: {
      drifts: [
        { kind: 'color', value: '#06b6d4', line: 12, suggestion: ['color.primary (#7c2d12)'] },
      ],
      warnings: [],
    },
  }];
  const r = formatDriftReport({ lockedTokensPath: 'tokens/x.tokens.json', byFile });
  assert.ok(r.includes('src/Card.tsx'));
  assert.ok(r.includes('Line 12'));
  assert.ok(r.includes('#06b6d4'));
  assert.ok(r.includes('color.primary'));
});
