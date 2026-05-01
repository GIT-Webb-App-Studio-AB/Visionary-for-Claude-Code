import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getGovernanceConfig, GOVERNANCE_DEFAULTS } from '../threshold.mjs';

test('returns defaults for missing config', () => {
  const cfg = getGovernanceConfig({});
  assert.equal(cfg.drift_threshold, GOVERNANCE_DEFAULTS.drift_threshold);
});

test('reads $visionary.governance', () => {
  const tokens = {
    $visionary: { governance: { drift_threshold: 'warn', near_match_tolerance: 0.1 } },
  };
  const cfg = getGovernanceConfig(tokens);
  assert.equal(cfg.drift_threshold, 'warn');
  assert.equal(cfg.near_match_tolerance, 0.1);
});

test('handles partial config', () => {
  const tokens = { $visionary: { governance: { drift_threshold: 'off' } } };
  const cfg = getGovernanceConfig(tokens);
  assert.equal(cfg.drift_threshold, 'off');
  assert.equal(cfg.near_match_tolerance, GOVERNANCE_DEFAULTS.near_match_tolerance);
});

test('null tokens returns defaults', () => {
  const cfg = getGovernanceConfig(null);
  assert.equal(cfg.drift_threshold, GOVERNANCE_DEFAULTS.drift_threshold);
});
