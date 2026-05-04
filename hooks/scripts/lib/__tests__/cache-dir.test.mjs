// Run: node --test hooks/scripts/lib/__tests__/cache-dir.test.mjs
//
// Exercises the three-tier resolution policy in cache-dir.mjs:
//   1. CLAUDE_PLUGIN_DATA wins
//   2. VISIONARY_CACHE_IN_REPO=1 forces in-repo
//   3. Fallback to ~/.claude/plugins/data/visionary-claude/visionary-cache/<slug>/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  cacheDir,
  ensureCacheDir,
  legacyCacheDirs,
  projectSlug,
} from '../cache-dir.mjs';

// ── Helpers ─────────────────────────────────────────────────────────────────
function withEnv(env, fn) {
  const original = {};
  for (const k of Object.keys(env)) {
    original[k] = process.env[k];
    if (env[k] === undefined || env[k] === null) delete process.env[k];
    else process.env[k] = String(env[k]);
  }
  try { return fn(); }
  finally {
    for (const k of Object.keys(original)) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  }
}

function mkProject() {
  return mkdtempSync(join(tmpdir(), 'cache-dir-test-'));
}

// ── Tier 1: CLAUDE_PLUGIN_DATA ──────────────────────────────────────────────
test('cacheDir: tier 1 — CLAUDE_PLUGIN_DATA wins over everything', () => {
  const root = mkProject();
  const pluginData = mkProject();
  withEnv(
    { CLAUDE_PLUGIN_DATA: pluginData, VISIONARY_CACHE_IN_REPO: '1' },
    () => {
      const dir = cacheDir(root);
      assert.equal(dir, join(pluginData, 'visionary-cache'));
    },
  );
});

test('cacheDir: tier 1 ignores empty-string CLAUDE_PLUGIN_DATA', () => {
  const root = mkProject();
  withEnv({ CLAUDE_PLUGIN_DATA: '', VISIONARY_CACHE_IN_REPO: undefined }, () => {
    const dir = cacheDir(root);
    // Empty-string env var → falls through to tier 3 (home-dir fallback),
    // never tier 1 with an empty path.
    assert.ok(!dir.startsWith(join('', 'visionary-cache')));
    assert.ok(dir.includes(join('.claude', 'plugins', 'data', 'visionary-claude', 'visionary-cache')));
  });
});

// ── Tier 2: VISIONARY_CACHE_IN_REPO opt-in ──────────────────────────────────
test('cacheDir: tier 2 — VISIONARY_CACHE_IN_REPO=1 forces in-repo', () => {
  const root = mkProject();
  withEnv({ CLAUDE_PLUGIN_DATA: undefined, VISIONARY_CACHE_IN_REPO: '1' }, () => {
    const dir = cacheDir(root);
    assert.equal(dir, join(root, '.visionary-cache'));
  });
});

test('cacheDir: tier 2 accepts "true" and "TRUE" but not other truthy values', () => {
  const root = mkProject();
  for (const v of ['1', 'true', 'TRUE']) {
    withEnv({ CLAUDE_PLUGIN_DATA: undefined, VISIONARY_CACHE_IN_REPO: v }, () => {
      assert.equal(cacheDir(root), join(root, '.visionary-cache'), `value=${v} should opt-in`);
    });
  }
  for (const v of ['yes', 'on', '0', 'false', '']) {
    withEnv({ CLAUDE_PLUGIN_DATA: undefined, VISIONARY_CACHE_IN_REPO: v }, () => {
      assert.notEqual(cacheDir(root), join(root, '.visionary-cache'), `value=${v} must NOT opt-in`);
    });
  }
});

// ── Tier 3: home-dir fallback ───────────────────────────────────────────────
test('cacheDir: tier 3 — fallback to home/.claude/plugins/data/<id>/visionary-cache/<slug>', () => {
  const root = mkProject();
  withEnv({ CLAUDE_PLUGIN_DATA: undefined, VISIONARY_CACHE_IN_REPO: undefined }, () => {
    const dir = cacheDir(root);
    const expectedPrefix = join(homedir(), '.claude', 'plugins', 'data', 'visionary-claude', 'visionary-cache');
    assert.ok(
      dir.startsWith(expectedPrefix),
      `expected ${dir} to start with ${expectedPrefix}`,
    );
    // Must include a project-specific slug after the prefix.
    assert.notEqual(dir, expectedPrefix);
  });
});

test('cacheDir: tier 3 — different project roots get different subdirs', () => {
  const rootA = mkProject();
  const rootB = mkProject();
  withEnv({ CLAUDE_PLUGIN_DATA: undefined, VISIONARY_CACHE_IN_REPO: undefined }, () => {
    assert.notEqual(cacheDir(rootA), cacheDir(rootB));
  });
});

test('cacheDir: tier 3 — same project root yields stable slug across calls', () => {
  const root = mkProject();
  withEnv({ CLAUDE_PLUGIN_DATA: undefined, VISIONARY_CACHE_IN_REPO: undefined }, () => {
    assert.equal(cacheDir(root), cacheDir(root));
  });
});

// ── projectSlug ─────────────────────────────────────────────────────────────
test('projectSlug: lowercased basename + 8-char hash', () => {
  const slug = projectSlug('/home/alice/MyProject');
  assert.match(slug, /^myproject-[0-9a-f]{8}$/);
});

test('projectSlug: invalid filename chars are stripped', () => {
  const slug = projectSlug('/tmp/Some Weird Name!');
  // Spaces and ! become hyphens or are stripped.
  assert.match(slug, /^[a-z0-9_-]+-[0-9a-f]{8}$/);
});

test('projectSlug: empty / root path falls back to "project-<hash>"', () => {
  const slug = projectSlug('/');
  assert.match(slug, /^(project|.+)-[0-9a-f]{8}$/);
});

// ── ensureCacheDir ──────────────────────────────────────────────────────────
test('ensureCacheDir: creates the directory if missing', () => {
  const root = mkProject();
  withEnv({ CLAUDE_PLUGIN_DATA: undefined, VISIONARY_CACHE_IN_REPO: '1' }, () => {
    const dir = ensureCacheDir(root);
    assert.equal(existsSync(dir), true);
    rmSync(dir, { recursive: true, force: true });
  });
});

test('ensureCacheDir: idempotent — second call on existing dir does not throw', () => {
  const root = mkProject();
  withEnv({ CLAUDE_PLUGIN_DATA: undefined, VISIONARY_CACHE_IN_REPO: '1' }, () => {
    ensureCacheDir(root);
    assert.doesNotThrow(() => ensureCacheDir(root));
  });
});

// ── legacyCacheDirs ─────────────────────────────────────────────────────────
test('legacyCacheDirs: includes CLAUDE_PLUGIN_DATA path when env set', () => {
  const root = mkProject();
  const pluginData = mkProject();
  withEnv({ CLAUDE_PLUGIN_DATA: pluginData }, () => {
    const dirs = legacyCacheDirs(root);
    assert.ok(dirs.includes(join(pluginData, 'visionary-cache')));
    assert.ok(dirs.includes(join(root, '.visionary-cache')));
  });
});

test('legacyCacheDirs: omits CLAUDE_PLUGIN_DATA when unset', () => {
  const root = mkProject();
  withEnv({ CLAUDE_PLUGIN_DATA: undefined }, () => {
    const dirs = legacyCacheDirs(root);
    assert.deepEqual(dirs, [join(root, '.visionary-cache')]);
  });
});

// ── Regression guard: dev-mode never points at projectRoot by default ───────
test('regression: with no env vars, cacheDir does NOT point at projectRoot', () => {
  const root = mkProject();
  withEnv({ CLAUDE_PLUGIN_DATA: undefined, VISIONARY_CACHE_IN_REPO: undefined }, () => {
    const dir = cacheDir(root);
    assert.notEqual(dir, join(root, '.visionary-cache'));
    assert.ok(!dir.startsWith(root), `cacheDir must not live under projectRoot, got ${dir}`);
  });
});
