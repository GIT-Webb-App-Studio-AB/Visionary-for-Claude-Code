// taste-io.mjs — Shared I/O primitives for the taste flywheel (Sprint 05).
//
// Owns the on-disk layout for taste/facts.jsonl and taste/pairs.jsonl:
//   - ULID generation (time-sortable, 26-char Crockford base32, dep-free)
//   - Project-root discovery (same walk as update-taste.mjs)
//   - Atomic append + fsync for JSONL files (so a crashed hook can't write
//     a half-line that breaks the next reader)
//   - Streaming read with permissive parse — a single corrupt line is
//     logged and skipped, never fatal
//   - Scope-level matching (project vs global vs component_type vs archetype)
//   - ISO-8601 helpers and the opt-out env check
//
// Zero dependencies. Node 18+. Callable from hooks with fsync discipline
// that is cross-platform (Windows path separators handled).

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, openSync, closeSync, fsyncSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// ── Opt-out gate ─────────────────────────────────────────────────────────────
// Hooks that call into this module MUST check isTasteDisabled() before doing
// any write. Read paths should also short-circuit — a disabled profile should
// behave as if taste/ did not exist, even when files are present on disk.
export function isTasteDisabled() {
  const v = process.env.VISIONARY_DISABLE_TASTE;
  return v === '1' || v === 'true' || v === 'TRUE';
}

// ── Project root discovery ───────────────────────────────────────────────────
// Mirrors update-taste.mjs: walk up until we find package.json or .git. Falls
// back to the start directory if neither marker is found. The discovered root
// is used to derive the taste storage location — see tasteDir() below for the
// four-tier policy (CLAUDE_PLUGIN_DATA default, in-repo opt-in, legacy detection).
export function findProjectRoot(start) {
  let dir = resolve(start || process.cwd());
  while (true) {
    if (existsSync(join(dir, 'package.json')) || existsSync(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(start || process.cwd());
    dir = parent;
  }
}

// Four-tier path-resolution policy (in order):
//   1. Existing ${projectRoot}/taste/  — legacy users with committed profiles
//   2. VISIONARY_TASTE_IN_REPO=1|true  — explicit team-share opt-in
//   3. CLAUDE_PLUGIN_DATA env set      — plugin convention default, see
//      https://code.claude.com/docs/en/plugins-reference (state lives at
//      ~/.claude/plugins/data/<plugin-id>/), namespaced by project slug
//   4. Fallback to ${projectRoot}/taste/  — test/dev when no harness env
export function tasteDir(projectRoot) {
  const inRepo = join(projectRoot, 'taste');
  if (existsSync(inRepo)) return inRepo;
  const optIn = process.env.VISIONARY_TASTE_IN_REPO;
  if (optIn === '1' || optIn === 'true' || optIn === 'TRUE') return inRepo;
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginData && pluginData.length > 0) {
    return join(pluginData, 'taste', slugifyProjectKey(projectKey(projectRoot)));
  }
  return inRepo;
}

export function slugifyProjectKey(key) {
  return String(key || 'unknown').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
}

export function factsPath(projectRoot) {
  return join(tasteDir(projectRoot), 'facts.jsonl');
}

export function pairsPath(projectRoot) {
  return join(tasteDir(projectRoot), 'pairs.jsonl');
}

export function agingLogPath(projectRoot) {
  return join(tasteDir(projectRoot), 'aging.log');
}

export function ensureTasteDir(projectRoot) {
  const dir = tasteDir(projectRoot);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

// ── ULID generation ──────────────────────────────────────────────────────────
// Crockford base32 alphabet minus I/L/O/U (ambiguous). Prefix = millis since
// epoch in base32 (10 chars = ~9.3 years of headroom from 2026 before a roll);
// suffix = 16 chars of cryptographic randomness. Monotonicity within the same
// millisecond is not guaranteed — callers that need strict ordering should
// serialize on Date.now() before calling.
const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function ulid(now = Date.now()) {
  const time = encodeTime(now, 10);
  const rand = encodeRandom(16);
  return time + rand;
}

function encodeTime(ms, len) {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  let out = '';
  for (let i = len - 1; i >= 0; i--) {
    out = ULID_ALPHABET[ms % 32] + out;
    ms = Math.floor(ms / 32);
  }
  return out;
}

function encodeRandom(len) {
  let out = '';
  // Prefer crypto.getRandomValues when available (Node 19+ exposes it on
  // globalThis; older versions fall back to Math.random, which is OK here
  // — ULID suffix collisions in the same millisecond don't break anything
  // downstream because (scope + signal) is what dedup keys off, not the id).
  const buf = new Uint8Array(len);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(buf);
    for (let i = 0; i < len; i++) out += ULID_ALPHABET[buf[i] % 32];
    return out;
  }
  for (let i = 0; i < len; i++) out += ULID_ALPHABET[Math.floor(Math.random() * 32)];
  return out;
}

// ── Timestamp helpers ────────────────────────────────────────────────────────
export function nowIso() {
  return new Date().toISOString();
}

export function isoDaysAgo(isoString, nowMs = Date.now()) {
  const then = Date.parse(isoString);
  if (!Number.isFinite(then)) return Number.POSITIVE_INFINITY;
  return (nowMs - then) / (1000 * 60 * 60 * 24);
}

// ── Streaming read ───────────────────────────────────────────────────────────
// JSONL readers must tolerate corruption — a crashed hook might have written
// half a line, and the next reader shouldn't crash on it. We log skipped
// lines but never throw.
//
// Returns { facts: [...], skipped: number } so callers can emit diagnostics
// when corruption is suspected.
export function readFacts(projectRoot) {
  return readJsonl(factsPath(projectRoot));
}

export function readPairs(projectRoot) {
  return readJsonl(pairsPath(projectRoot));
}

export function readJsonl(filePath) {
  if (!existsSync(filePath)) return { items: [], skipped: 0 };
  let raw;
  try { raw = readFileSync(filePath, 'utf8'); } catch { return { items: [], skipped: 0 }; }
  const lines = raw.split('\n');
  const items = [];
  let skipped = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try { items.push(JSON.parse(trimmed)); } catch { skipped++; }
  }
  return { items, skipped };
}

// ── Atomic append + fsync ────────────────────────────────────────────────────
// JSONL is append-only by design. Each record is a single line terminated by
// \n. We open-append-fsync-close to give the OS a chance to flush — on
// Linux/macOS this is fsync(2), on Windows it's FlushFileBuffers under the
// hood. Without fsync, a power loss mid-hook could leave facts.jsonl with
// a trailing partial line that the reader would skip silently.
export function appendFact(projectRoot, fact) {
  if (isTasteDisabled()) return false;
  ensureTasteDir(projectRoot);
  return atomicAppend(factsPath(projectRoot), JSON.stringify(fact) + '\n');
}

export function appendPair(projectRoot, pair) {
  if (isTasteDisabled()) return false;
  ensureTasteDir(projectRoot);
  return atomicAppend(pairsPath(projectRoot), JSON.stringify(pair) + '\n');
}

export function atomicAppend(filePath, text) {
  let fd;
  try {
    fd = openSync(filePath, 'a');
    appendFileSync(fd, text, 'utf8');
    try { fsyncSync(fd); } catch { /* fsync not always available on all FS — best-effort */ }
    return true;
  } catch { return false; }
  finally { if (fd !== undefined) { try { closeSync(fd); } catch { /* ignore */ } } }
}

// ── Rewrite (for aging + forget) ─────────────────────────────────────────────
// JSONL is append-only in the normal case but aging and /visionary-taste
// forget need to rewrite the whole file. We write to a sibling .tmp and
// rename (atomic on POSIX; best-effort on Windows where rename over an
// existing file requires both to be on the same volume).
export function rewriteFacts(projectRoot, facts) {
  if (isTasteDisabled()) return false;
  ensureTasteDir(projectRoot);
  const target = factsPath(projectRoot);
  const body = facts.map((f) => JSON.stringify(f)).join('\n') + (facts.length ? '\n' : '');
  return atomicRewrite(target, body);
}

export function atomicRewrite(filePath, body) {
  const tmp = filePath + '.tmp';
  try {
    writeFileSync(tmp, body, 'utf8');
    // rename() over an existing file is atomic on POSIX and best-effort on
    // Windows. Unlink the target first on Windows because rename silently
    // fails if the destination exists.
    if (process.platform === 'win32' && existsSync(filePath)) {
      try { unlinkSync(filePath); } catch { /* ignore */ }
    }
    renameSync(tmp, filePath);
    return true;
  } catch {
    // Cleanup tmp so we don't leave stale .tmp files lying around.
    try { if (existsSync(tmp)) unlinkSync(tmp); } catch { /* ignore */ }
    return false;
  }
}

// ── Scope matching ───────────────────────────────────────────────────────────
// A fact applies if its scope is global (key='*') OR if the scope level + key
// match the current context. Callers pass the runtime context as:
//   { projectKey, componentType, archetype }
// Any field may be undefined — missing context downgrades to global-only
// matches for that dimension.
export function factMatchesScope(fact, ctx) {
  if (!fact || !fact.scope) return false;
  const { level, key } = fact.scope;
  if (level === 'global' || key === '*') return true;
  if (level === 'project' && ctx.projectKey && ctx.projectKey === key) return true;
  if (level === 'component_type' && ctx.componentType && ctx.componentType === key) return true;
  if (level === 'archetype' && ctx.archetype && ctx.archetype.toLowerCase() === key.toLowerCase()) return true;
  return false;
}

// ── Dedup key ────────────────────────────────────────────────────────────────
// Two facts are duplicates if they share the same scope + signal. When the
// extractor produces a fact whose key already exists, the right move is to
// APPEND evidence to the existing fact (and bump last_seen / confidence),
// not to write a second fact. Dedup by scope-level + scope-key + direction +
// target-type + normalized target-value.
export function factKey(fact) {
  const s = fact.scope || {};
  const sig = fact.signal || {};
  const value = (sig.target_value || '').toLowerCase().trim();
  return `${s.level || ''}::${s.key || ''}::${sig.direction || ''}::${sig.target_type || ''}::${value}`;
}

// ── Project key derivation ───────────────────────────────────────────────────
// The project "key" for scope-matching is the basename of the project root.
// Two different clones of the same repo share a key, so taste travels.
export function projectKey(projectRoot) {
  const parts = projectRoot.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] || 'unknown';
}
