// MCP resource: visionary://traces/...
//
//   visionary://traces/_list           → recent sessions (id, mtime, line count)
//   visionary://traces/<session_id>    → JSONL content for that session
//
// Trace files live under <repo>/.visionary/traces/ when a project root is
// available, or under $CLAUDE_PLUGIN_DATA/visionary/traces/ when running
// as a plugin. We mirror resolveTraceDir from hooks/scripts/lib/trace.mjs
// so output matches what the hooks write.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../paths.mjs';

const PREFIX = 'visionary://traces/';
const LIST_URI = 'visionary://traces/_list';
const RECENT_LIMIT = 20;

function resolveTraceDir() {
  const pluginDataDir = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginDataDir) return join(pluginDataDir, 'visionary', 'traces');
  return join(REPO_ROOT, '.visionary', 'traces');
}

function listSessions() {
  const dir = resolveTraceDir();
  if (!existsSync(dir)) return [];
  let files;
  try { files = readdirSync(dir); } catch { return []; }
  // Group rotated files (<id>.jsonl, <id>.1.jsonl, ...) by session id.
  const bySession = new Map();
  for (const f of files) {
    if (!f.endsWith('.jsonl') && !f.endsWith('.jsonl.gz')) continue;
    const sessionId = f.replace(/\.\d+\.jsonl(\.gz)?$/, '').replace(/\.jsonl(\.gz)?$/, '');
    let stats;
    try { stats = statSync(join(dir, f)); } catch { continue; }
    let entry = bySession.get(sessionId);
    if (!entry) {
      entry = { sessionId, files: [], totalBytes: 0, mtimeMs: 0 };
      bySession.set(sessionId, entry);
    }
    entry.files.push(f);
    entry.totalBytes += stats.size;
    if (stats.mtimeMs > entry.mtimeMs) entry.mtimeMs = stats.mtimeMs;
  }
  return [...bySession.values()].sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function readSession(sessionId) {
  const dir = resolveTraceDir();
  if (!existsSync(dir)) return '';
  let files;
  try { files = readdirSync(dir); } catch { return ''; }
  // Match <id>.jsonl, <id>.N.jsonl. Skip .gz here — let the host read raw
  // files; gzipped rotated traces are an old-archive concern.
  const candidates = files
    .filter((f) => f === `${sessionId}.jsonl`
      || (f.startsWith(`${sessionId}.`) && f.endsWith('.jsonl')))
    .sort();
  let out = '';
  for (const f of candidates) {
    try { out += readFileSync(join(dir, f), 'utf8'); } catch { /* skip */ }
  }
  return out;
}

export const resource = {
  prefix: PREFIX,

  matches(uri) {
    return typeof uri === 'string' && uri.startsWith(PREFIX);
  },

  async list() {
    const sessions = listSessions().slice(0, RECENT_LIMIT);
    const out = [{
      uri: LIST_URI,
      name: 'Recent Visionary sessions',
      mimeType: 'application/json',
      description: `List of up to ${RECENT_LIMIT} most-recent sessions with trace files.`,
    }];
    for (const s of sessions) {
      out.push({
        uri: `${PREFIX}${s.sessionId}`,
        name: `trace ${s.sessionId}`,
        mimeType: 'application/x-ndjson',
        description: `${s.files.length} file(s), ${s.totalBytes} bytes, mtime=${new Date(s.mtimeMs).toISOString()}`,
      });
    }
    return out;
  },

  async read(uri) {
    const tail = uri.slice(PREFIX.length);

    if (tail === '_list') {
      const sessions = listSessions().slice(0, RECENT_LIMIT).map((s) => ({
        session_id: s.sessionId,
        files: s.files,
        total_bytes: s.totalBytes,
        mtime: new Date(s.mtimeMs).toISOString(),
      }));
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            trace_dir: resolveTraceDir(),
            sessions,
            count: sessions.length,
          }, null, 2),
        }],
      };
    }

    // Defensive: only allow ULID-like / safe session ids — no path separators
    // or parent-dir traversal in the slug.
    if (!/^[A-Za-z0-9_.-]+$/.test(tail)) {
      throw new Error(`Invalid session id: ${tail}`);
    }
    const text = readSession(tail);
    if (!text) {
      throw new Error(`No traces found for session: ${tail}`);
    }
    return {
      contents: [{
        uri,
        mimeType: 'application/x-ndjson',
        text,
      }],
    };
  },
};
