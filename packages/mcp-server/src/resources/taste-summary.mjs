// MCP resource: visionary://taste/summary
//
// Read-only AGGREGATE summary of taste/facts.jsonl — never raw fact rows.
// The flywheel writes are intentionally local to the Claude Code plugin;
// over the MCP wire we only expose counts and top tags so other hosts can
// see the project's accumulated taste shape without ingesting individual
// rejection quotes (which contain user-typed prose).

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../paths.mjs';

const URI = 'visionary://taste/summary';
const FACTS_PATH = join(REPO_ROOT, 'taste', 'facts.jsonl');

const TOP_N = 12;

function summariseFacts() {
  if (!existsSync(FACTS_PATH)) {
    return { facts: 0, available: false, reason: 'taste/facts.jsonl not present' };
  }
  let raw;
  try { raw = readFileSync(FACTS_PATH, 'utf8'); } catch (e) {
    return { facts: 0, available: false, reason: `read error: ${e.message}` };
  }
  const lines = raw.split('\n').filter((l) => l.trim());
  const counts = {
    total: 0,
    by_direction: {},
    by_target_type: {},
    by_flag: {},
    by_scope_level: {},
  };
  const targetCounts = new Map();    // direction → Map<target_value, n>
  let parseErrors = 0;
  let oldestSeen = null;
  let newestSeen = null;

  for (const line of lines) {
    let row;
    try { row = JSON.parse(line); } catch { parseErrors++; continue; }
    if (!row || typeof row !== 'object') { parseErrors++; continue; }
    counts.total++;
    const dir = row?.signal?.direction || 'unknown';
    const tType = row?.signal?.target_type || 'unknown';
    const flag = row?.flag || 'unknown';
    const scope = row?.scope?.level || 'unknown';
    counts.by_direction[dir] = (counts.by_direction[dir] || 0) + 1;
    counts.by_target_type[tType] = (counts.by_target_type[tType] || 0) + 1;
    counts.by_flag[flag] = (counts.by_flag[flag] || 0) + 1;
    counts.by_scope_level[scope] = (counts.by_scope_level[scope] || 0) + 1;

    // Aggregate by short target_value tokens only (style ids, palette tags) —
    // skip free-form rejection quotes so we don't surface user prose.
    if (tType === 'style_id' || tType === 'palette' || tType === 'pattern' || tType === 'motion_tier' || tType === 'typography') {
      const t = typeof row?.signal?.target_value === 'string'
        ? row.signal.target_value.slice(0, 80)
        : null;
      if (t && t.length > 0 && t.length <= 80) {
        const bucketKey = `${dir}::${tType}`;
        let bucket = targetCounts.get(bucketKey);
        if (!bucket) { bucket = new Map(); targetCounts.set(bucketKey, bucket); }
        bucket.set(t, (bucket.get(t) || 0) + 1);
      }
    }

    const seen = row?.last_seen || row?.created_at;
    if (typeof seen === 'string') {
      if (!oldestSeen || seen < oldestSeen) oldestSeen = seen;
      if (!newestSeen || seen > newestSeen) newestSeen = seen;
    }
  }

  // Project top-N for each (direction, target_type) bucket.
  const top = {};
  for (const [bucketKey, bucket] of targetCounts.entries()) {
    const sorted = [...bucket.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
      .map(([target, count]) => ({ target, count }));
    top[bucketKey] = sorted;
  }

  return {
    available: true,
    facts: counts.total,
    parse_errors: parseErrors,
    by_direction: counts.by_direction,
    by_target_type: counts.by_target_type,
    by_flag: counts.by_flag,
    by_scope_level: counts.by_scope_level,
    oldest_seen: oldestSeen,
    newest_seen: newestSeen,
    top_targets: top,
    note: 'Aggregate-only. Raw facts.jsonl rows (which include user prose) are NOT exposed over MCP.',
  };
}

export const resource = {
  matches(uri) { return uri === URI; },

  async list() {
    return [{
      uri: URI,
      name: 'Visionary taste summary',
      mimeType: 'application/json',
      description: 'Aggregate-only summary of the taste flywheel (counts by direction, target_type, flag; top targets per bucket). No raw rejection prose.',
    }];
  },

  async read(uri) {
    const summary = summariseFacts();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(summary, null, 2),
      }],
    };
  },
};
