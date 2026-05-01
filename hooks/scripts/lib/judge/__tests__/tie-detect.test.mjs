import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectTies, pickHighestPriorityTie, THRESHOLDS } from '../tie-detect.mjs';

test('detectTies finds composite tie when diff <= 0.3', () => {
  const ties = detectTies({
    candidates: [
      { composite_score: 7.2 },
      { composite_score: 7.4 },
    ],
  });
  assert.ok(ties.find((t) => t.reason === 'composite-diff-<=-0.3'));
});

test('detectTies skips composite tie when diff > 0.3', () => {
  const ties = detectTies({
    candidates: [{ composite_score: 6.5 }, { composite_score: 8.0 }],
  });
  const compositeTies = ties.filter((t) => t.dim === 'composite');
  assert.equal(compositeTies.length, 0);
});

test('detectTies finds low-confidence per dim', () => {
  const ties = detectTies({
    confidence: { hierarchy: 2, layout: 5 },
  });
  const lowConf = ties.find((t) => t.dim === 'hierarchy' && t.reason === 'low-confidence');
  assert.ok(lowConf);
});

test('detectTies finds heuristic-visual conflict', () => {
  const ties = detectTies({
    heuristic_scores: { distinctiveness: 8 },
    visual_scores: { distinctiveness: 4 },
  });
  const conflict = ties.find((t) => t.reason === 'heuristic-visual-conflict');
  assert.ok(conflict);
});

test('pickHighestPriorityTie prefers conflict over composite', () => {
  const tie = pickHighestPriorityTie([
    { reason: 'composite-diff-<=-0.3', dim: 'composite' },
    { reason: 'heuristic-visual-conflict', dim: 'distinctiveness' },
  ]);
  assert.equal(tie.reason, 'heuristic-visual-conflict');
});

test('pickHighestPriorityTie returns null for empty array', () => {
  assert.equal(pickHighestPriorityTie([]), null);
  assert.equal(pickHighestPriorityTie(null), null);
});
