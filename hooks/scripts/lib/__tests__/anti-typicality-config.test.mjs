// Run: node --test hooks/scripts/lib/__tests__/anti-typicality-config.test.mjs
//
// Sprint 16 Task 31.5 — coverage for the anti-typicality config loader.
// Asserts:
//   - Default load (no env, real file) returns parsed config matching defaults.
//   - Missing file falls back to HARDCODED_DEFAULTS without crashing.
//   - Env overrides parse to numbers/booleans correctly.
//   - Bad env values fall back to file/default values silently.
//   - Both VISIONARY_VS_DISABLED and VISIONARY_DISABLE_VS force enabled=false.
//   - validateConfigBlock catches invalid blocks (missing field, out-of-range,
//     wrong type) and accepts a fully-valid block.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  loadConfig,
  validateConfigBlock,
  HARDCODED_DEFAULTS,
  DEFAULT_CONFIG_PATH,
} from '../anti-typicality-config.mjs';

// ── Env-var sandbox ─────────────────────────────────────────────────────────
// Tests must clean up after themselves; node:test runs files serially but
// individual tests can race if anyone forgets to restore.
const TRACKED_ENV_VARS = [
  'VISIONARY_VS_ALPHA',
  'VISIONARY_VS_DISABLED',
  'VISIONARY_DISABLE_VS',
  'VISIONARY_ORIGINALITY_WEIGHT',
  'VISIONARY_HISTORY_WINDOW',
];

function clearEnv() {
  for (const k of TRACKED_ENV_VARS) delete process.env[k];
}

// Snapshot + restore wrapper — every test that touches env should call
// clearEnv() at start AND teardown.
function withCleanEnv(fn) {
  const snapshot = {};
  for (const k of TRACKED_ENV_VARS) snapshot[k] = process.env[k];
  clearEnv();
  try {
    return fn();
  } finally {
    clearEnv();
    for (const [k, v] of Object.entries(snapshot)) {
      if (v != null) process.env[k] = v;
    }
  }
}

// ── Tempfile helpers ────────────────────────────────────────────────────────
function makeTempConfig(payload) {
  const dir = mkdtempSync(join(tmpdir(), 'anti-typicality-config-'));
  const path = join(dir, 'anti-typicality.json');
  writeFileSync(path, JSON.stringify(payload), 'utf8');
  return { dir, path };
}

function cleanupTempConfig(dir) {
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

// ── Default load ────────────────────────────────────────────────────────────
test('loadConfig: default path returns parsed config from skills/visionary', () => {
  withCleanEnv(() => {
    const cfg = loadConfig(); // uses DEFAULT_CONFIG_PATH
    // The shipped file matches HARDCODED_DEFAULTS. If a future maintainer
    // edits the JSON, this assertion needs updating — that's intentional;
    // we want a tripwire on accidental edits.
    for (const key of Object.keys(HARDCODED_DEFAULTS)) {
      assert.equal(cfg[key], HARDCODED_DEFAULTS[key], `field ${key} differs from default`);
    }
  });
});

test('loadConfig: DEFAULT_CONFIG_PATH points at skills/visionary/anti-typicality.json', () => {
  assert.match(DEFAULT_CONFIG_PATH.replace(/\\/g, '/'), /skills\/visionary\/anti-typicality\.json$/);
});

test('loadConfig: missing custom file falls back to HARDCODED_DEFAULTS', () => {
  withCleanEnv(() => {
    const cfg = loadConfig('/nonexistent/does/not/exist/anti-typicality.json');
    for (const key of Object.keys(HARDCODED_DEFAULTS)) {
      assert.equal(cfg[key], HARDCODED_DEFAULTS[key]);
    }
  });
});

test('loadConfig: malformed JSON file falls back to defaults', () => {
  withCleanEnv(() => {
    const dir = mkdtempSync(join(tmpdir(), 'anti-typicality-config-'));
    const path = join(dir, 'broken.json');
    writeFileSync(path, '{ this is not valid json', 'utf8');
    try {
      const cfg = loadConfig(path);
      assert.equal(cfg.vs_alpha, HARDCODED_DEFAULTS.vs_alpha);
      assert.equal(cfg.enabled, HARDCODED_DEFAULTS.enabled);
    } finally {
      cleanupTempConfig(dir);
    }
  });
});

test('loadConfig: file missing anti_typicality block falls back to defaults', () => {
  withCleanEnv(() => {
    const { dir, path } = makeTempConfig({ version: '1.0.0' });
    try {
      const cfg = loadConfig(path);
      for (const key of Object.keys(HARDCODED_DEFAULTS)) {
        assert.equal(cfg[key], HARDCODED_DEFAULTS[key]);
      }
    } finally {
      cleanupTempConfig(dir);
    }
  });
});

test('loadConfig: file with one bad field keeps the rest, falls back on the bad one', () => {
  withCleanEnv(() => {
    const { dir, path } = makeTempConfig({
      anti_typicality: {
        ...HARDCODED_DEFAULTS,
        vs_alpha: 999,             // out of range → fallback
        originality_weight: 1.25,  // valid override
      },
    });
    try {
      const cfg = loadConfig(path);
      assert.equal(cfg.vs_alpha, HARDCODED_DEFAULTS.vs_alpha, 'bad field reverts to default');
      assert.equal(cfg.originality_weight, 1.25, 'good field overrides default');
    } finally {
      cleanupTempConfig(dir);
    }
  });
});

// ── Env overrides ───────────────────────────────────────────────────────────
test('loadConfig: VISIONARY_VS_ALPHA env override applies', () => {
  withCleanEnv(() => {
    process.env.VISIONARY_VS_ALPHA = '0.5';
    const cfg = loadConfig();
    assert.equal(cfg.vs_alpha, 0.5);
  });
});

test('loadConfig: VISIONARY_VS_DISABLED=1 forces enabled=false', () => {
  withCleanEnv(() => {
    process.env.VISIONARY_VS_DISABLED = '1';
    const cfg = loadConfig();
    assert.equal(cfg.enabled, false);
  });
});

test('loadConfig: VISIONARY_DISABLE_VS=1 (alias) also forces enabled=false', () => {
  withCleanEnv(() => {
    process.env.VISIONARY_DISABLE_VS = '1';
    const cfg = loadConfig();
    assert.equal(cfg.enabled, false);
  });
});

test('loadConfig: VISIONARY_VS_DISABLED accepts true / false / yes / no / on / off', () => {
  withCleanEnv(() => {
    for (const truthy of ['1', 'true', 'TRUE', 'yes', 'on']) {
      process.env.VISIONARY_VS_DISABLED = truthy;
      assert.equal(loadConfig().enabled, false, `truthy=${truthy} should disable`);
    }
    for (const falsy of ['0', 'false', 'no', 'off', '']) {
      process.env.VISIONARY_VS_DISABLED = falsy;
      // empty / falsy → leave enabled as default (true)
      assert.equal(loadConfig().enabled, true, `falsy=${falsy} should leave default`);
    }
  });
});

test('loadConfig: VISIONARY_ORIGINALITY_WEIGHT env override applies', () => {
  withCleanEnv(() => {
    process.env.VISIONARY_ORIGINALITY_WEIGHT = '1.5';
    const cfg = loadConfig();
    assert.equal(cfg.originality_weight, 1.5);
  });
});

test('loadConfig: VISIONARY_HISTORY_WINDOW env override applies as integer', () => {
  withCleanEnv(() => {
    process.env.VISIONARY_HISTORY_WINDOW = '25';
    const cfg = loadConfig();
    assert.equal(cfg.originality_history_window, 25);
  });
});

// ── Bad env input → fallback ────────────────────────────────────────────────
test('loadConfig: VISIONARY_VS_ALPHA=notanumber falls back to default, no crash', () => {
  withCleanEnv(() => {
    process.env.VISIONARY_VS_ALPHA = 'notanumber';
    const cfg = loadConfig();
    assert.equal(cfg.vs_alpha, HARDCODED_DEFAULTS.vs_alpha);
  });
});

test('loadConfig: VISIONARY_HISTORY_WINDOW=12.7 (float, not int) falls back to default', () => {
  withCleanEnv(() => {
    process.env.VISIONARY_HISTORY_WINDOW = '12.7';
    const cfg = loadConfig();
    assert.equal(cfg.originality_history_window, HARDCODED_DEFAULTS.originality_history_window);
  });
});

test('loadConfig: out-of-range env value gets clamped to default', () => {
  withCleanEnv(() => {
    process.env.VISIONARY_VS_ALPHA = '999'; // > schema max=2
    const cfg = loadConfig();
    assert.equal(cfg.vs_alpha, HARDCODED_DEFAULTS.vs_alpha);
  });
});

test('loadConfig: empty-string env value is ignored, default preserved', () => {
  withCleanEnv(() => {
    process.env.VISIONARY_VS_ALPHA = '';
    const cfg = loadConfig();
    assert.equal(cfg.vs_alpha, HARDCODED_DEFAULTS.vs_alpha);
  });
});

// ── Env trumps file ─────────────────────────────────────────────────────────
test('loadConfig: env override beats file value', () => {
  withCleanEnv(() => {
    const { dir, path } = makeTempConfig({
      anti_typicality: { ...HARDCODED_DEFAULTS, vs_alpha: 0.7 },
    });
    try {
      process.env.VISIONARY_VS_ALPHA = '0.4';
      const cfg = loadConfig(path);
      assert.equal(cfg.vs_alpha, 0.4, 'env overrides file');
    } finally {
      cleanupTempConfig(dir);
    }
  });
});

// ── validateConfigBlock ────────────────────────────────────────────────────
test('validateConfigBlock: HARDCODED_DEFAULTS is valid', () => {
  const r = validateConfigBlock(HARDCODED_DEFAULTS);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('validateConfigBlock: missing field reported', () => {
  const block = { ...HARDCODED_DEFAULTS };
  delete block.vs_alpha;
  const r = validateConfigBlock(block);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.field === 'vs_alpha' && e.message.includes('missing')));
});

test('validateConfigBlock: out-of-range value reported', () => {
  const block = { ...HARDCODED_DEFAULTS, vs_alpha: 5 };
  const r = validateConfigBlock(block);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.field === 'vs_alpha'));
});

test('validateConfigBlock: wrong type reported', () => {
  const block = { ...HARDCODED_DEFAULTS, enabled: 'yes' };
  const r = validateConfigBlock(block);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.field === 'enabled'));
});

test('validateConfigBlock: non-integer where integer required is rejected', () => {
  const block = { ...HARDCODED_DEFAULTS, vs_concept_count: 4.5 };
  const r = validateConfigBlock(block);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.field === 'vs_concept_count'));
});

test('validateConfigBlock: null / non-object root rejected', () => {
  for (const bad of [null, undefined, 7, 'string', []]) {
    const r = validateConfigBlock(bad);
    assert.equal(r.ok, false, `should reject ${JSON.stringify(bad)}`);
  }
});

// ── HARDCODED_DEFAULTS sanity ───────────────────────────────────────────────
test('HARDCODED_DEFAULTS is frozen', () => {
  assert.equal(Object.isFrozen(HARDCODED_DEFAULTS), true);
});

test('HARDCODED_DEFAULTS covers every constrained field', () => {
  // If a field is added to FIELD_CONSTRAINTS without a default, loadConfig
  // would silently produce an undefined value. Catch that here.
  for (const field of [
    'enabled', 'vs_alpha', 'vs_concept_count', 'vs_convergence_threshold',
    'vs_max_retries_on_schema_fail', 'originality_weight',
    'originality_history_window', 'originality_history_max_age_days',
    'boost_factor_cap', 'boost_factor_floor', 'min_concept_quality_threshold',
  ]) {
    assert.ok(field in HARDCODED_DEFAULTS, `default missing for ${field}`);
  }
});
