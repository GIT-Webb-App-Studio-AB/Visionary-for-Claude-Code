// Run: node --test hooks/scripts/lib/__tests__/fork-candidate.test.mjs
//
// Predicate-matrix + fixture coverage for Best-of-N fork helpers. Tests fall
// into three groups: pure predicates (isBonEnabled, shouldBonRound2Exit,
// selectFallbackPolicy), artefact-path builders (buildCandidateArtefactPaths,
// concurrencyLimit), and data shapers (prepareVerifierInput,
// parseVerifierOutput, collectBonStats).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANDIDATE_PROFILES,
  MAX_CANDIDATES,
  BON_ROUND2_EXIT_CRAFT,
  WINDOWS_CONCURRENCY_LIMIT,
  DEFAULT_CONCURRENCY_LIMIT,
  isBonEnabled,
  buildCandidateArtefactPaths,
  concurrencyLimit,
  buildFanOutInstructions,
  prepareVerifierInput,
  parseVerifierOutput,
  selectFallbackPolicy,
  shouldBonRound2Exit,
  collectBonStats,
  computeVerifierPromptHash,
} from '../fork-candidate.mjs';

// ── Fixtures ────────────────────────────────────────────────────────────────
function scoresAt(v) {
  return {
    hierarchy: v, layout: v, typography: v, contrast: v,
    distinctiveness: v, brief_conformance: v, accessibility: v,
    motion_readiness: v, craft_measurable: v,
  };
}

function candidate(id, { scoreBase = 8, missing = false } = {}) {
  const profile = CANDIDATE_PROFILES.find((p) => p.id === id);
  if (missing) return { id, index: profile.index, missing: true };
  return {
    id,
    index: profile.index,
    screenshot_path: `/tmp/candidate-${id}.png`,
    applied_diff: `--- a/f\n+++ b/f\n@@ -1,1 +1,1 @@\n-old-${id}\n+new-${id}\n`,
    calibrated_scores: scoresAt(scoreBase),
    raw_scores: scoresAt(scoreBase - 0.3),
    numeric_scores: { enabled: true, composite: scoreBase / 10 },
    axe_violations_count: 0,
  };
}

// ── isBonEnabled ────────────────────────────────────────────────────────────
test('isBonEnabled: disabled when VISIONARY_DISABLE_BON=1', () => {
  const r = isBonEnabled({ env: { VISIONARY_DISABLE_BON: '1' }, round: 2 });
  assert.equal(r.enabled, false);
  assert.equal(r.reason, 'disabled_by_env');
});

test('isBonEnabled: disabled when VISIONARY_DISABLE_BON=true', () => {
  const r = isBonEnabled({ env: { VISIONARY_DISABLE_BON: 'true' }, round: 2 });
  assert.equal(r.enabled, false);
});

test('isBonEnabled: "0" and "false" treated as not-disabled', () => {
  const r = isBonEnabled({ env: { VISIONARY_DISABLE_BON: '0' }, round: 2, previousCritique: { top_3_fixes: [{ dimension: 'layout' }] } });
  assert.equal(r.enabled, true);
});

test('isBonEnabled: disabled on round 1', () => {
  const r = isBonEnabled({ env: {}, round: 1 });
  assert.equal(r.enabled, false);
  assert.equal(r.reason, 'round_below_threshold');
});

test('isBonEnabled: disabled on previous convergence_signal', () => {
  const r = isBonEnabled({
    env: {}, round: 2,
    previousCritique: { convergence_signal: true, top_3_fixes: [] },
  });
  assert.equal(r.enabled, false);
  assert.equal(r.reason, 'previous_convergence');
});

test('isBonEnabled: disabled when previous critique had no fixes', () => {
  const r = isBonEnabled({
    env: {}, round: 2,
    previousCritique: { convergence_signal: false, top_3_fixes: [] },
  });
  assert.equal(r.enabled, false);
  assert.equal(r.reason, 'no_fixes_to_apply');
});

test('isBonEnabled: enabled when round>=2 and there are fixes', () => {
  const r = isBonEnabled({
    env: {}, round: 2,
    previousCritique: { convergence_signal: false, top_3_fixes: [{ dimension: 'layout' }] },
  });
  assert.equal(r.enabled, true);
  assert.equal(r.reason, 'bon_active');
});

// ── buildCandidateArtefactPaths ─────────────────────────────────────────────
test('buildCandidateArtefactPaths: produces A/B/C with correct ids', () => {
  const paths = buildCandidateArtefactPaths({ fileHash: 'abc123', round: 2, tmpDirOverride: '/tmp' });
  assert.deepEqual(Object.keys(paths).sort(), ['A', 'B', 'C']);
  for (const id of ['A', 'B', 'C']) {
    assert.equal(paths[id].id, id);
    assert.ok(paths[id].source_copy.includes(`abc123-2-${id}`));
    assert.ok(paths[id].screenshot.endsWith('.png'));
    assert.ok(paths[id].diff.endsWith('.diff'));
    assert.ok(paths[id].critique.endsWith('.critique.json'));
  }
});

test('buildCandidateArtefactPaths: throws without fileHash', () => {
  assert.throws(() => buildCandidateArtefactPaths({ round: 2 }), /fileHash required/);
});

test('buildCandidateArtefactPaths: throws on non-positive round', () => {
  assert.throws(() => buildCandidateArtefactPaths({ fileHash: 'x', round: 0 }), /positive integer/);
  assert.throws(() => buildCandidateArtefactPaths({ fileHash: 'x', round: -1 }), /positive integer/);
});

test('buildCandidateArtefactPaths: respects tmpDirOverride', () => {
  const paths = buildCandidateArtefactPaths({ fileHash: 'x', round: 1, tmpDirOverride: '/my/custom' });
  assert.ok(paths.A.screenshot.startsWith('/my/custom') || paths.A.screenshot.startsWith('\\my\\custom'));
});

// ── concurrencyLimit ────────────────────────────────────────────────────────
test('concurrencyLimit: windows caps to 2', () => {
  assert.equal(concurrencyLimit({ platform: 'win32' }), WINDOWS_CONCURRENCY_LIMIT);
});

test('concurrencyLimit: linux/mac get default 3', () => {
  assert.equal(concurrencyLimit({ platform: 'linux' }), DEFAULT_CONCURRENCY_LIMIT);
  assert.equal(concurrencyLimit({ platform: 'darwin' }), DEFAULT_CONCURRENCY_LIMIT);
});

// ── buildFanOutInstructions ─────────────────────────────────────────────────
test('buildFanOutInstructions: throws on missing required args', () => {
  assert.throws(() => buildFanOutInstructions({}), /filePath, scorerCli, verifierAgentPath required/);
});

test('buildFanOutInstructions: throws when artefactPaths missing candidates', () => {
  assert.throws(
    () => buildFanOutInstructions({
      filePath: '/f.tsx',
      scorerCli: '/s',
      verifierAgentPath: '/v',
      artefactPaths: { A: {}, B: {} }, // missing C
      topFixes: [],
    }),
    /artefactPaths must carry A, B, C/,
  );
});

test('buildFanOutInstructions: references protocol doc + all three candidate stems', () => {
  const paths = buildCandidateArtefactPaths({ fileHash: 'xyz', round: 2, tmpDirOverride: '/tmp' });
  const out = buildFanOutInstructions({
    filePath: '/src/foo.tsx',
    scorerCli: '/repo/benchmark/scorers/numeric-aesthetic-scorer.mjs',
    verifierAgentPath: '/repo/agents/visual-verifier.md',
    artefactPaths: paths,
    topFixes: [{ dimension: 'layout', severity: 'major', proposed_fix: 'tighten grid', evidence: { type: 'selector', value: 'body' } }],
    promptHash: 'sha256:abcdef0123456789',
    calibrationPath: '/repo/skills/visionary/calibration.json',
  });
  assert.ok(out.includes('skills/visionary/bon-fanout.md'), 'references protocol doc');
  assert.ok(out.includes('A (t=0.2)'), 'candidate A stem');
  assert.ok(out.includes('B (t=0.5)'), 'candidate B stem');
  assert.ok(out.includes('C (t=0.8)'), 'candidate C stem');
  assert.ok(out.includes('sha256:abcdef0123456789'), 'prompt hash present');
  assert.ok(out.includes('visual-verifier.md'), 'verifier path');
  assert.ok(out.includes('selector:body'), 'fix evidence included');
  // Smaller than the fat version — load-bearing for context budget
  assert.ok(out.length < 2000, `fan-out block should stay under 2 KB, got ${out.length}`);
});

test('buildFanOutInstructions: fanoutDocPath override respected', () => {
  const paths = buildCandidateArtefactPaths({ fileHash: 'xyz', round: 2 });
  const out = buildFanOutInstructions({
    filePath: '/src/foo.tsx',
    scorerCli: '/s',
    verifierAgentPath: '/v',
    artefactPaths: paths,
    topFixes: [],
    fanoutDocPath: 'custom/path.md',
  });
  assert.ok(out.includes('custom/path.md'));
});

// ── prepareVerifierInput ────────────────────────────────────────────────────
test('prepareVerifierInput: full set gives complete_count=3', () => {
  const input = prepareVerifierInput({
    round: 2,
    originatingTopFixes: [],
    candidates: [candidate('A'), candidate('B'), candidate('C')],
    promptHash: 'sha256:abc',
  });
  assert.equal(input.complete_count, 3);
  assert.equal(input.candidates.length, 3);
  assert.equal(input.candidates[0].candidate, 'A');
  assert.equal(input.candidates[2].candidate, 'C');
});

test('prepareVerifierInput: missing candidates marked missing=true', () => {
  const input = prepareVerifierInput({
    round: 2,
    candidates: [candidate('A'), candidate('C')],
  });
  assert.equal(input.complete_count, 2);
  assert.equal(input.candidates[1].missing, true);
  assert.equal(input.candidates[1].candidate, 'B');
});

test('prepareVerifierInput: throws on non-integer round', () => {
  assert.throws(() => prepareVerifierInput({ round: 'x', candidates: [] }), /round must be integer/);
});

// ── parseVerifierOutput ─────────────────────────────────────────────────────
test('parseVerifierOutput: accepts valid JSON string', () => {
  const raw = JSON.stringify({ round: 2, winner_index: 2, margin: 'decisive', escalate_to_user: false });
  const r = parseVerifierOutput(raw);
  assert.equal(r.ok, true);
  assert.equal(r.winner_index, 2);
  assert.equal(r.winner_id, 'C');
  assert.equal(r.margin, 'decisive');
});

test('parseVerifierOutput: accepts parsed object', () => {
  const r = parseVerifierOutput({ round: 2, winner_index: 0, margin: 'NARROW', escalate_to_user: true });
  assert.equal(r.ok, true);
  assert.equal(r.margin, 'narrow'); // lowercased
  assert.equal(r.escalate_to_user, true);
});

test('parseVerifierOutput: rejects null', () => {
  assert.equal(parseVerifierOutput(null).ok, false);
});

test('parseVerifierOutput: rejects invalid JSON string', () => {
  const r = parseVerifierOutput('not json {');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'invalid_json');
});

test('parseVerifierOutput: rejects out-of-range winner_index', () => {
  const r = parseVerifierOutput({ winner_index: 5, margin: 'narrow' });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'invalid_winner_index');
});

test('parseVerifierOutput: rejects invalid margin', () => {
  const r = parseVerifierOutput({ winner_index: 0, margin: 'clear' });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'invalid_margin');
});

test('parseVerifierOutput: string winner_index parsed to int', () => {
  const r = parseVerifierOutput({ winner_index: '1', margin: 'narrow' });
  assert.equal(r.ok, true);
  assert.equal(r.winner_index, 1);
});

// ── selectFallbackPolicy ────────────────────────────────────────────────────
test('selectFallbackPolicy: all complete → bon', () => {
  const r = selectFallbackPolicy({ candidates: [candidate('A'), candidate('B'), candidate('C')] });
  assert.equal(r.policy, 'bon');
  assert.equal(r.complete_count, 3);
});

test('selectFallbackPolicy: two complete → still bon', () => {
  const r = selectFallbackPolicy({ candidates: [candidate('A'), candidate('B'), candidate('C', { missing: true })] });
  assert.equal(r.policy, 'bon');
});

test('selectFallbackPolicy: one complete → single_winner', () => {
  const r = selectFallbackPolicy({
    candidates: [candidate('A'), candidate('B', { missing: true }), candidate('C', { missing: true })],
  });
  assert.equal(r.policy, 'single_winner');
  assert.equal(r.winner_index, 0);
});

test('selectFallbackPolicy: zero complete → sequential', () => {
  const r = selectFallbackPolicy({
    candidates: [candidate('A', { missing: true }), candidate('B', { missing: true }), candidate('C', { missing: true })],
  });
  assert.equal(r.policy, 'sequential');
  assert.equal(r.reason, 'all_candidates_failed');
});

test('selectFallbackPolicy: non-array → sequential', () => {
  assert.equal(selectFallbackPolicy({ candidates: null }).policy, 'sequential');
});

// ── shouldBonRound2Exit ─────────────────────────────────────────────────────
test('shouldBonRound2Exit: exits when round=2, decisive, craft>=7.5', () => {
  const r = shouldBonRound2Exit({
    round: 2,
    verifierResult: { ok: true, margin: 'decisive' },
    winnerCalibrated: scoresAt(BON_ROUND2_EXIT_CRAFT + 0.1),
  });
  assert.equal(r.exit, true);
});

test('shouldBonRound2Exit: never on round 1', () => {
  const r = shouldBonRound2Exit({
    round: 1,
    verifierResult: { ok: true, margin: 'decisive' },
    winnerCalibrated: scoresAt(9),
  });
  assert.equal(r.exit, false);
  assert.equal(r.reason, 'not_round_2');
});

test('shouldBonRound2Exit: blocked on indistinguishable margin', () => {
  const r = shouldBonRound2Exit({
    round: 2,
    verifierResult: { ok: true, margin: 'indistinguishable' },
    winnerCalibrated: scoresAt(9),
  });
  assert.equal(r.exit, false);
  assert.equal(r.reason, 'indistinguishable_margin');
});

test('shouldBonRound2Exit: blocked when craft below floor', () => {
  const r = shouldBonRound2Exit({
    round: 2,
    verifierResult: { ok: true, margin: 'narrow' },
    winnerCalibrated: scoresAt(BON_ROUND2_EXIT_CRAFT - 0.5),
  });
  assert.equal(r.exit, false);
  assert.equal(r.reason, 'craft_below_threshold');
});

test('shouldBonRound2Exit: blocked when verifier result unavailable', () => {
  const r = shouldBonRound2Exit({
    round: 2,
    verifierResult: { ok: false, reason: 'invalid_json' },
    winnerCalibrated: scoresAt(9),
  });
  assert.equal(r.exit, false);
  assert.equal(r.reason, 'verifier_unavailable');
});

// ── collectBonStats ─────────────────────────────────────────────────────────
test('collectBonStats: empty input → zeros and nulls', () => {
  const stats = collectBonStats({});
  assert.equal(stats.rounds_using_bon, 0);
  assert.equal(stats.escalations_to_user, 0);
  assert.equal(stats.candidate_failures, 0);
  assert.equal(stats.winner_score_lift_vs_seq, null);
});

test('collectBonStats: winner_score_lift computed from baseline', () => {
  const stats = collectBonStats({
    verifierResults: [{ ok: true, winner_index: 2, margin: 'decisive', escalate_to_user: false }],
    candidatesByRound: {
      2: [candidate('A', { scoreBase: 7 }), candidate('B', { scoreBase: 7.2 }), candidate('C', { scoreBase: 8.5 })],
    },
    sequentialBaselineComposite: 7.5,
  });
  assert.equal(stats.rounds_using_bon, 1);
  assert.equal(stats.winner_score_lift_vs_seq, 1.0);
  assert.equal(stats.margin_histogram.decisive, 1);
});

test('collectBonStats: counts candidate failures', () => {
  const stats = collectBonStats({
    verifierResults: [],
    candidatesByRound: {
      2: [candidate('A'), candidate('B', { missing: true }), candidate('C', { missing: true })],
    },
  });
  assert.equal(stats.candidate_failures, 2);
});

test('collectBonStats: counts escalations', () => {
  const stats = collectBonStats({
    verifierResults: [
      { ok: true, winner_index: 0, margin: 'indistinguishable', escalate_to_user: true },
      { ok: true, winner_index: 1, margin: 'indistinguishable', escalate_to_user: true },
    ],
  });
  assert.equal(stats.escalations_to_user, 2);
  assert.equal(stats.margin_histogram.indistinguishable, 2);
});

// ── computeVerifierPromptHash ───────────────────────────────────────────────
test('computeVerifierPromptHash: deterministic', () => {
  const a = computeVerifierPromptHash('verifier body');
  const b = computeVerifierPromptHash('verifier body');
  assert.equal(a, b);
  assert.match(a, /^sha256:[0-9a-f]{16}$/);
});

test('computeVerifierPromptHash: different input → different hash', () => {
  const a = computeVerifierPromptHash('x');
  const b = computeVerifierPromptHash('y');
  assert.notEqual(a, b);
});

test('computeVerifierPromptHash: empty → sha256:unknown', () => {
  assert.equal(computeVerifierPromptHash(''), 'sha256:unknown');
  assert.equal(computeVerifierPromptHash(null), 'sha256:unknown');
});

// ── Candidate profiles invariants ───────────────────────────────────────────
test('CANDIDATE_PROFILES: exactly 3 profiles with ascending temperature', () => {
  assert.equal(CANDIDATE_PROFILES.length, MAX_CANDIDATES);
  const temps = CANDIDATE_PROFILES.map((p) => p.temperature);
  for (let i = 1; i < temps.length; i++) assert.ok(temps[i] > temps[i - 1]);
});

test('CANDIDATE_PROFILES: frozen to prevent runtime mutation', () => {
  assert.throws(() => { CANDIDATE_PROFILES[0].temperature = 99; });
});
