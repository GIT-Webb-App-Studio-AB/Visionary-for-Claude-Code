// cache-dir.mjs — v1.5.3
//
// Centralised resolver for the per-project ephemeral cache directory used by
// SessionStart and PostToolUse hooks (round counters, debounce stamps,
// detected-framework.json, last-critique-*.json, last-git-harvest stamp,
// last-variants-brief.json).
//
// Three-tier resolution (in order):
//
//   1. CLAUDE_PLUGIN_DATA env set
//      → ${CLAUDE_PLUGIN_DATA}/visionary-cache/
//      Claude Code sets this when the plugin is installed via marketplace
//      (~/.claude/plugins/data/<plugin-id>/). Out of the user's repo,
//      durable across plugin updates.
//
//   2. VISIONARY_CACHE_IN_REPO=1|true|TRUE
//      → ${projectRoot}/.visionary-cache/
//      Explicit opt-in for tests, calibrate scripts, or anyone who wants
//      to inspect cache state in-place.
//
//   3. Fallback (dev runs from source, harnesses missing CLAUDE_PLUGIN_DATA)
//      → ${homedir()}/.claude/plugins/data/visionary-claude/visionary-cache/
//        <projectSlug>/
//      Mirrors what Claude Code itself would set CLAUDE_PLUGIN_DATA to for
//      an installed plugin, so dev-from-source behaves identically to a
//      marketplace install. Multiple checkouts of the same source get
//      different subdirs (slug = lowercased basename + 8-char path hash).
//
// Why a helper: three hook scripts had three near-identical copies of the
// CLAUDE_PLUGIN_DATA-or-projectRoot resolution. The fallback always pointed
// at projectRoot, which polluted users' repos when running in dev mode
// without CLAUDE_PLUGIN_DATA. v1.5.3 moves the fallback off-repo.

import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { basename, join, resolve } from 'node:path';

const PLUGIN_ID = 'visionary-claude';
const CACHE_NAME = 'visionary-cache';

// projectSlug — derives a stable, filesystem-safe directory name for the
// project from its absolute root path. Lowercased basename keeps the dir
// readable; an 8-char md5 prefix of the full path disambiguates between
// clones with the same basename (e.g. ~/work/visionary vs ~/dev/visionary).
export function projectSlug(projectRoot) {
  const abs = resolve(projectRoot || process.cwd());
  const name = basename(abs).toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'project';
  const hash = createHash('md5').update(abs).digest('hex').slice(0, 8);
  return `${name}-${hash}`;
}

export function cacheDir(projectRoot) {
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginData && pluginData.length > 0) {
    return join(pluginData, CACHE_NAME);
  }
  const optIn = process.env.VISIONARY_CACHE_IN_REPO;
  if (optIn === '1' || optIn === 'true' || optIn === 'TRUE') {
    return join(projectRoot, '.visionary-cache');
  }
  return join(
    homedir(),
    '.claude',
    'plugins',
    'data',
    PLUGIN_ID,
    CACHE_NAME,
    projectSlug(projectRoot),
  );
}

export function ensureCacheDir(projectRoot) {
  const dir = cacheDir(projectRoot);
  try { mkdirSync(dir, { recursive: true }); } catch { /* EEXIST ok */ }
  return dir;
}

// legacyCacheDirs — additional paths to search (read-only) when looking for
// cached files that may have been written by a previous version of the
// plugin (pre-v1.5.3) or by adjacent processes that follow the marketplace
// convention even when this hook is running in dev mode. Used by
// update-taste.mjs::readLastVariantsBrief() so the /variants → pair-capture
// integration keeps working across the migration.
export function legacyCacheDirs(projectRoot) {
  const dirs = [];
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginData && pluginData.length > 0) {
    dirs.push(join(pluginData, CACHE_NAME));
  }
  if (projectRoot) {
    dirs.push(join(projectRoot, '.visionary-cache'));
  }
  return dirs;
}
