import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildJudgePrompt, listRubrics } from '../prompt.mjs';

test('listRubrics covers expected dimensions', () => {
  const rubrics = listRubrics();
  for (const dim of ['hierarchy', 'layout', 'typography', 'contrast', 'distinctiveness', 'motion_readiness']) {
    assert.ok(rubrics.includes(dim));
  }
});

test('buildJudgePrompt returns text + images + dimension', () => {
  const out = buildJudgePrompt({
    dimension: 'distinctiveness',
    screenshotA: '/tmp/a.png',
    screenshotB: '/tmp/b.png',
    briefSummary: 'newsroom-style dashboard',
  });
  assert.ok(out.text.includes('distinctiveness'));
  assert.ok(out.text.includes('newsroom-style dashboard'));
  assert.equal(out.images.length, 2);
  assert.equal(out.images[0].label, 'A');
  assert.equal(out.dimension, 'distinctiveness');
});

test('buildJudgePrompt instructs strict JSON', () => {
  const out = buildJudgePrompt({ dimension: 'layout', screenshotA: 'a', screenshotB: 'b' });
  assert.ok(out.text.includes('STRICT JSON'));
  assert.ok(out.text.includes('"winner"'));
  assert.ok(out.text.includes('"rationale"'));
  assert.ok(out.text.includes('"confidence"'));
});

test('unknown dimension still produces a fallback rubric', () => {
  const out = buildJudgePrompt({ dimension: 'unknown_dim', screenshotA: 'a', screenshotB: 'b' });
  assert.ok(out.text.length > 100);
});
