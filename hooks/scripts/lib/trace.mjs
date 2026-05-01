// trace.mjs — Sprint 06 Task 19.2
//
// Central emitter for structured events into .visionary/traces/<session_id>.jsonl.
// Used by capture-and-critique.mjs, update-taste.mjs, harvest-git-signal.mjs,
// and any future hook that wants its work to show up in
// `scripts/visionary-stats.mjs --session <id>` output.
//
// Design:
//   - Opt-out via VISIONARY_NO_TRACES=1 (same convention as taste opt-out).
//   - Session id derived deterministically per process: CLAUDE_SESSION_ID env
//     wins, then a stable fallback based on the day + hostname + plugin-data-
//     dir hash so two concurrent hooks in the same Claude Code session write
//     to the same file. Each emitter is also tagged with `emitter` so the
//     reader can demux.
//   - Writes are atomic-append + fsync, same discipline as taste-io. A
//     corrupt line from a crashed hook is tolerated by readers (one log
//     line skipped, never fatal).
//   - Rotation: size-based (default 50 MB per session file). When exceeded,
//     the file is rotated to <session_id>.<N>.jsonl and the active file
//     starts fresh. Gzip-compression is deferred to sessionEnd cleanup
//     (docs/taste-privacy.md Sprint 06 update).
//   - Retention: files older than VISIONARY_TRACE_RETENTION_DAYS (default 90)
//     are deleted by rotateOldTraces(). Called from SessionStart hook.
//
// API:
//   import { trace, rotateOldTraces, currentSessionId, resolveTraceDir } from './lib/trace.mjs'
//   await trace('critic_craft_output', { scores, top_3_fixes, duration_ms })
//   trace.sync('patch_applied', { file: 'src/Foo.tsx', lines: 42 })
//
// Zero dependencies. Node 18+.

import {
  appendFileSync,
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { hostname } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 50 * 1024 * 1024;          // 50 MB per session file
const DEFAULT_RETENTION_DAYS = 90;
const COMPRESS_AFTER_DAYS = 7;                    // marker only — gzip happens
                                                  // in rotateOldTraces via
                                                  // platform-safe fallback
                                                  // (no gzip dep; use zlib).

// Closed enum mirroring skills/visionary/schemas/trace-entry.schema.json.
// Kept in sync by hand — a mismatch here is a validator failure.
const KNOWN_EVENTS = new Set([
  'style_selected',
  'brief_embedded',
  'rag_retrieval',
  'critic_craft_output',
  'critic_aesthetic_output',
  'critic_output',
  'numeric_scorer_output',
  'axe_output',
  'slop_scan_output',
  'slop_blocked',
  'slop_whitelisted',
  'fix_candidate_generated',
  'verifier_picked',
  'patch_applied',
  'patch_fallback',
  'early_exit',
  'escalate_reroll',
  'accepted',
  'rejected',
  'api_call',
  'arbitration',
  'error',
]);

// ── Opt-out gate ─────────────────────────────────────────────────────────────
export function isTracesDisabled() {
  const v = process.env.VISIONARY_NO_TRACES;
  return v === '1' || v === 'true' || v === 'TRUE';
}

// ── Project root discovery ───────────────────────────────────────────────────
// Same walk as taste-io.findProjectRoot but inlined so trace.mjs has zero
// intra-repo deps (it gets called from ALL hooks, including ones that don't
// import taste-io).
function findProjectRoot(start) {
  let dir = resolve(start || process.cwd());
  while (true) {
    if (existsSync(join(dir, 'package.json')) || existsSync(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(start || process.cwd());
    dir = parent;
  }
}

// ── Session id ───────────────────────────────────────────────────────────────
// Preference order:
//   1. CLAUDE_SESSION_ID — Claude Code harness exposes this for hooks.
//   2. VISIONARY_SESSION_ID — manual override (tests, CI).
//   3. Deterministic fallback: sha256(day + hostname + plugin-data-dir)[:16].
//      Not cryptographically strong — just stable for ~24 h so sibling hooks
//      in the same Claude Code session share a file.
let _cachedSessionId = null;

export function currentSessionId() {
  if (_cachedSessionId) return _cachedSessionId;
  const explicit = process.env.CLAUDE_SESSION_ID || process.env.VISIONARY_SESSION_ID;
  if (explicit && explicit.length) {
    _cachedSessionId = explicit.replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 64) || 'unknown';
    return _cachedSessionId;
  }
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const seed = `${day}::${hostname()}::${process.env.CLAUDE_PLUGIN_DATA || process.cwd()}`;
  _cachedSessionId = 'sess-' + createHash('sha256').update(seed).digest('hex').slice(0, 16);
  return _cachedSessionId;
}

// Tests inject a synthetic id via resetCacheForTest. Never call from runtime.
export function _resetCachedSessionForTest(id = null) {
  _cachedSessionId = id;
}

// ── Trace directory ──────────────────────────────────────────────────────────
// Preference order (same pattern as capture-and-critique.mjs cacheDir):
//   1. Explicit projectRoot argument — tests and calibrate scripts pass this.
//   2. CLAUDE_PLUGIN_DATA env var — Claude Code harness sets this; keeps
//      traces out of the user's repo when running as a plugin.
//   3. Nearest package.json / .git ancestor of cwd — legacy fallback.
export function resolveTraceDir(projectRoot) {
  if (projectRoot) return join(projectRoot, '.visionary', 'traces');
  const pluginDataDir = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginDataDir) return join(pluginDataDir, 'visionary', 'traces');
  return join(findProjectRoot(), '.visionary', 'traces');
}

export function ensureTraceDir(projectRoot) {
  const dir = resolveTraceDir(projectRoot);
  try { mkdirSync(dir, { recursive: true }); } catch { /* EEXIST ok */ }
  return dir;
}

// ── Entry construction ───────────────────────────────────────────────────────
// Every call produces a full schema-valid entry. We do NOT run the entry
// through validate-schema.mjs on the hot path — trace emission must be
// cheap enough to call from any hook without budget concerns. Instead,
// a test reads-back-and-validates and we trust the producer.
function buildEntry(event, payload, opts) {
  const sessionId = opts.sessionId || currentSessionId();
  const entry = {
    session_id: sessionId,
    generation_id: opts.generationId || 'no-gen',
    round: Number.isFinite(opts.round) ? opts.round : 0,
    ts: new Date().toISOString(),
    event,
  };
  if (opts.emitter)   entry.emitter = String(opts.emitter).slice(0, 128);
  if (opts.durationMs != null && Number.isFinite(opts.durationMs)) {
    entry.duration_ms = Math.max(0, Math.floor(opts.durationMs));
  }
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    // Shallow clone so we don't accidentally serialise mutable fields the
    // caller still holds a reference to. Payload-specific validation is
    // done by the consumer (visionary-stats.mjs) — here we only care that
    // JSON.stringify succeeds.
    entry.payload = payload;
  }
  return entry;
}

// ── File routing + rotation ──────────────────────────────────────────────────
function activeTracePath(sessionId, projectRoot) {
  return join(resolveTraceDir(projectRoot), `${sessionId}.jsonl`);
}

// Rotate ACTIVE file when it crosses MAX_FILE_BYTES. We rename it to
// <session>.<N>.jsonl and let the next append open a fresh file. Callers
// don't care which file they wrote to — readers glob the dir anyway.
function rotateIfOversize(filePath) {
  if (!existsSync(filePath)) return;
  let size;
  try { size = statSync(filePath).size; } catch { return; }
  if (size < MAX_FILE_BYTES) return;
  let n = 1;
  while (existsSync(filePath.replace(/\.jsonl$/, `.${n}.jsonl`))) n++;
  const target = filePath.replace(/\.jsonl$/, `.${n}.jsonl`);
  try { renameSync(filePath, target); } catch { /* best effort */ }
}

// ── Atomic append + fsync ────────────────────────────────────────────────────
// Same discipline as taste-io.atomicAppend; inlined here so this module has
// no intra-repo dependencies. On Windows fsync maps to FlushFileBuffers;
// some FS (network mounts) don't support it — we swallow the error.
function atomicAppend(filePath, text) {
  let fd;
  try {
    fd = openSync(filePath, 'a');
    appendFileSync(fd, text, 'utf8');
    try { fsyncSync(fd); } catch { /* best effort on exotic FS */ }
    return true;
  } catch { return false; }
  finally { if (fd !== undefined) { try { closeSync(fd); } catch { /* ignore */ } } }
}

// ── Public: emit ─────────────────────────────────────────────────────────────
// Designed so the callsite reads naturally:
//   await trace('accepted', { brief_summary, composite }, { generationId, round: 2, emitter: 'capture-and-critique' })
// Sync variant for hot paths:
//   trace.sync('patch_applied', { file: 'Foo.tsx' })
function emitSync(event, payload, opts = {}) {
  if (isTracesDisabled()) return false;
  if (!KNOWN_EVENTS.has(event)) {
    // Unknown events are a developer error. Log once to stderr, don't throw
    // — taking down the hook for a typo is worse than a stray log line.
    if (!emitSync._warned) {
      emitSync._warned = new Set();
    }
    if (!emitSync._warned.has(event)) {
      emitSync._warned.add(event);
      try { process.stderr.write(`[trace] unknown event "${event}" — add to KNOWN_EVENTS\n`); } catch { /* ignore */ }
    }
    return false;
  }
  const projectRoot = opts.projectRoot;
  const sessionId = opts.sessionId || currentSessionId();
  const entry = buildEntry(event, payload, { ...opts, sessionId });
  const line = JSON.stringify(entry);
  if (line.length > 64 * 1024) {
    // 64 KB single line is wildly oversized — a payload with a screenshot
    // inlined, almost certainly a bug. Truncate rather than refuse so we
    // still preserve the event signal, but flag it so downstream tooling
    // can see the truncation happened.
    const truncated = { ...entry, payload: { _truncated: true, _original_bytes: line.length } };
    return writeLine(truncated, sessionId, projectRoot);
  }
  return writeLine(entry, sessionId, projectRoot);
}

function writeLine(entry, sessionId, projectRoot) {
  ensureTraceDir(projectRoot);
  const filePath = activeTracePath(sessionId, projectRoot);
  rotateIfOversize(filePath);
  return atomicAppend(filePath, JSON.stringify(entry) + '\n');
}

// Async wrapper returned as the default export — hooks can `await trace(...)`
// without caring whether the write is actually synchronous. Future-proof for
// swapping in a batched writer without callsite changes.
export async function trace(event, payload, opts) {
  return emitSync(event, payload, opts);
}
trace.sync = emitSync;

// ── Read-back for tests and visionary-stats.mjs ─────────────────────────────
// Returns { items, skipped } matching the taste-io.readJsonl contract. A
// corrupt line is logged and skipped. Globs across rotated files so a
// caller asking for "all events from session X" gets the full set.
export function readSessionTraces(sessionId, projectRoot) {
  const dir = resolveTraceDir(projectRoot);
  if (!existsSync(dir)) return { items: [], skipped: 0 };
  const prefix = `${sessionId}.`;
  let files;
  try { files = readdirSync(dir); } catch { return { items: [], skipped: 0 }; }
  // Match <id>.jsonl, <id>.1.jsonl, <id>.2.jsonl, <id>.jsonl.gz, …
  const candidates = files
    .filter((f) => f === `${sessionId}.jsonl` || (f.startsWith(prefix) && (f.endsWith('.jsonl') || f.endsWith('.jsonl.gz'))))
    .sort(); // deterministic order so the reader sees rotated-then-active
  const items = [];
  let skipped = 0;
  for (const f of candidates) {
    const full = join(dir, f);
    const { items: part, skipped: partSkip } = readOneTraceFile(full);
    items.push(...part);
    skipped += partSkip;
  }
  return { items, skipped };
}

function readOneTraceFile(filePath) {
  // Gzip support engages only when the filename ends in .gz. Uncompressed
  // is the common case; gzipped files come from rotateOldTraces() after
  // COMPRESS_AFTER_DAYS. zlib is in Node core so we pay nothing for the dep.
  let raw;
  try {
    raw = filePath.endsWith('.gz')
      ? gunzipSync(readFileSync(filePath)).toString('utf8')
      : readFileSync(filePath, 'utf8');
  } catch { return { items: [], skipped: 0 }; }
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

// ── Cross-session listing ───────────────────────────────────────────────────
// Used by visionary-stats.mjs --all and by rotateOldTraces.
export function listAllTraceFiles(projectRoot) {
  const dir = resolveTraceDir(projectRoot);
  if (!existsSync(dir)) return [];
  let files;
  try { files = readdirSync(dir); } catch { return []; }
  return files
    .filter((f) => f.endsWith('.jsonl') || f.endsWith('.jsonl.gz'))
    .map((f) => {
      const full = join(dir, f);
      let mtimeMs = 0;
      try { mtimeMs = statSync(full).mtimeMs; } catch { /* ignore */ }
      return { name: f, path: full, mtimeMs };
    });
}

// ── Retention + compression ─────────────────────────────────────────────────
// Called from SessionStart hook (see Sprint 06 Task 19.5). Compresses files
// older than COMPRESS_AFTER_DAYS (and not yet gzipped); deletes files older
// than VISIONARY_TRACE_RETENTION_DAYS (default 90).
export function rotateOldTraces(projectRoot, { nowMs = Date.now(), retentionDays, compressAfterDays } = {}) {
  if (isTracesDisabled()) return { compressed: 0, deleted: 0 };
  const ret = Number.isFinite(retentionDays) ? retentionDays : (
    Number.parseInt(process.env.VISIONARY_TRACE_RETENTION_DAYS || '', 10) || DEFAULT_RETENTION_DAYS
  );
  const cmp = Number.isFinite(compressAfterDays) ? compressAfterDays : COMPRESS_AFTER_DAYS;
  const files = listAllTraceFiles(projectRoot);
  let compressed = 0;
  let deleted = 0;
  for (const f of files) {
    const ageDays = (nowMs - f.mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageDays > ret) {
      try { unlinkSync(f.path); deleted++; } catch { /* best effort */ }
      continue;
    }
    if (ageDays > cmp && !f.name.endsWith('.gz')) {
      if (compressFile(f.path)) compressed++;
    }
  }
  return { compressed, deleted };
}

function compressFile(filePath) {
  try {
    const body = readFileSync(filePath);
    writeFileSync(filePath + '.gz', gzipSync(body));
    unlinkSync(filePath);
    return true;
  } catch { return false; }
}

// ── Default export (convenience) ────────────────────────────────────────────
export default trace;
