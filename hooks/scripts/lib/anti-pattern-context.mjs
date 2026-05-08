// anti-pattern-context.mjs — Sprint 16 Task 31.4
//
// Builds a dynamic "anti-pattern context" string that the critic prompt
// receives in round 2+. Goal: break the Self-Refine echo chamber (Madaan
// 2023) by telling the critic "do NOT reward convergence toward designs
// the user already accepted — reward novelty against THIS history".
//
// Read primitives come from taste-io.mjs (readJsonl + factsPath +
// tasteDir). Filter rules:
//   - flag ∈ {active, permanent}            (skip decayed)
//   - signal.direction === 'prefer'          (skip "avoid" facts)
//   - evidence has at least one positive
//     kind: git_kept | pairwise_pick |       (the schema's positive signals
//     explicit_approval                       — sprint doc calls these
//                                              "git_kept | picked | accepted")
//   - last_seen within maxAgeDays
//
// Token budget: ~1500 tokens (≈ 6000 chars at 4 chars/token).
// Cache key: round + factsPath-mtime so identical re-asks within a session
// don't re-do the JSONL parse + sort.
//
// Zero deps beyond taste-io.mjs. Node 18+.

import { existsSync, statSync } from 'node:fs';

import { readJsonl, isoDaysAgo } from './taste-io.mjs';

// ── Tunables ────────────────────────────────────────────────────────────────
// 4 chars/token is the standard estimate for English/JSON-ish text. The cap
// is enforced as a hard char limit on the final string after assembly so we
// don't blow the critic's context budget even if a malicious facts file has
// pathologically long target_values.
const TOKEN_BUDGET = 1500;
const CHARS_PER_TOKEN = 4;
const CHAR_BUDGET = TOKEN_BUDGET * CHARS_PER_TOKEN; // ≈ 6000 chars

// Per-row line budget. Rows are formatted as one line each — this caps any
// single fact's target_value length so a 400-char "rationale" can't crowd
// out the rest of the rows. Applied during row formatting, before the
// global CHAR_BUDGET trim.
const ROW_CHAR_BUDGET = 150 * CHARS_PER_TOKEN; // 150 tokens ≈ 600 chars per row

// Positive evidence kinds — sprint doc says "git_kept | picked | accepted",
// schema enum is git_kept | pairwise_pick | explicit_approval. We treat
// any of these as "the user accepted this design pattern".
const POSITIVE_EVIDENCE_KINDS = new Set([
  'git_kept',
  'pairwise_pick',
  'explicit_approval',
]);

// ── Cache ───────────────────────────────────────────────────────────────────
// Key: `${round}::${factsJsonlPath}::${mtime_ms}` → context-string result.
// Mtime is the freshness signal — append a new fact to facts.jsonl and the
// mtime advances, busting this cache automatically.
const cache = new Map();

/**
 * Build anti-pattern context string for round N.
 *
 * @param {object} opts
 * @param {number} opts.round - Critique round number (must be >= 2 to produce content)
 * @param {string} opts.factsJsonlPath - Absolute path to taste/facts.jsonl
 * @param {number} [opts.windowSize=10] - Top-N most recent accepted entries
 * @param {number} [opts.maxAgeDays=90] - Filter out entries older than this
 * @param {boolean} [opts.useCache=true] - Cache by round + mtime
 * @param {number} [opts.nowMs] - Override clock (testing)
 * @returns {{ context: string, used_method: string, history_count: number, history_window_days: number }}
 */
export function buildAntiPatternContext({
  round,
  factsJsonlPath,
  windowSize = 10,
  maxAgeDays = 90,
  useCache = true,
  nowMs,
} = {}) {
  // ── Round 1 short-circuit ─────────────────────────────────────────────
  // Round 1 has no critic-loop history to break out of yet. The critic
  // runs against global priors only.
  if (typeof round !== 'number' || round < 2) {
    return {
      context: '',
      used_method: 'skipped_round_1',
      history_count: 0,
      history_window_days: 0,
    };
  }

  if (typeof factsJsonlPath !== 'string' || factsJsonlPath.length === 0) {
    return buildFallback(round);
  }

  // ── Cache lookup ──────────────────────────────────────────────────────
  // Mtime is reasonable freshness signal — append-only writes bump mtime,
  // and rewrite (aging / forget) does too via rename.
  let mtimeMs = 0;
  let factsExists = false;
  try {
    if (existsSync(factsJsonlPath)) {
      mtimeMs = statSync(factsJsonlPath).mtimeMs;
      factsExists = true;
    }
  } catch { /* treat as missing */ }

  if (!factsExists) {
    return buildFallback(round);
  }

  const cacheKey = `${round}::${factsJsonlPath}::${mtimeMs}::${windowSize}::${maxAgeDays}`;
  if (useCache && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // ── Read + filter + sort ──────────────────────────────────────────────
  // readJsonl tolerates corrupt lines (logs skipped count) so a half-line
  // from a crashed hook doesn't crash us.
  const { items } = readJsonl(factsJsonlPath);
  const accepted = filterAcceptedFacts(items, { maxAgeDays, nowMs });

  if (accepted.length === 0) {
    const result = buildEmptyHistoryFallback(round);
    if (useCache) cache.set(cacheKey, result);
    return result;
  }

  // Sort by last_seen DESC (most recent first), then take top-N.
  accepted.sort((a, b) => String(b.last_seen).localeCompare(String(a.last_seen)));
  const topN = accepted.slice(0, Math.max(1, windowSize));

  // ── Format rows ──────────────────────────────────────────────────────
  // Each row is one line, indexed 1..N. Per-row char budget keeps any
  // single fact from blowing up the prompt.
  const rows = topN.map((fact, idx) => formatRow(fact, idx + 1));

  // ── Assemble context ─────────────────────────────────────────────────
  // 8D-embedding fallback is the default used_method — Sprint 11 (DINOv2)
  // would override this when active, but Task 31.4 itself only owns the
  // facts.jsonl path. The critic invocation that consumes this string can
  // override used_method if it has visual embeddings available.
  const context = assembleContext({ round, rows, count: topN.length });

  // Hard cap to CHAR_BUDGET. We trim from the END of the rows section so
  // the most-recent (top-1) entry survives. Add an explicit truncation
  // marker so the critic doesn't think the list ends there organically.
  const trimmed = trimToBudget(context);

  const result = {
    context: trimmed,
    used_method: 'embedding-8d',
    history_count: topN.length,
    history_window_days: maxAgeDays,
  };

  if (useCache) cache.set(cacheKey, result);
  return result;
}

/**
 * Reset the module-level cache. Test-only.
 */
export function resetCache() {
  cache.clear();
}

// ── Internals ───────────────────────────────────────────────────────────────

function filterAcceptedFacts(items, { maxAgeDays, nowMs }) {
  const out = [];
  const clock = typeof nowMs === 'number' ? nowMs : Date.now();
  for (const fact of items) {
    if (!fact || typeof fact !== 'object') continue;
    if (fact.flag !== 'active' && fact.flag !== 'permanent') continue;
    const sig = fact.signal;
    if (!sig || sig.direction !== 'prefer') continue;
    // Sanity-check the structural fields we'll format. Missing → skip
    // (don't crash, just exclude).
    if (typeof sig.target_type !== 'string' || typeof sig.target_value !== 'string') continue;
    if (typeof fact.last_seen !== 'string') continue;

    // Age filter via taste-io.isoDaysAgo (returns +Infinity for unparseable).
    const ageDays = isoDaysAgo(fact.last_seen, clock);
    if (!Number.isFinite(ageDays)) continue;
    if (ageDays > maxAgeDays) continue;

    // Evidence must include at least one positive kind.
    if (!Array.isArray(fact.evidence) || fact.evidence.length === 0) continue;
    const hasPositive = fact.evidence.some(
      (e) => e && typeof e.kind === 'string' && POSITIVE_EVIDENCE_KINDS.has(e.kind),
    );
    if (!hasPositive) continue;

    out.push(fact);
  }
  return out;
}

function formatRow(fact, idx) {
  const id = typeof fact.id === 'string' ? fact.id : 'unknown';
  const sig = fact.signal || {};
  const targetType = String(sig.target_type || 'pattern');
  const targetValue = String(sig.target_value || '').trim();
  const lastSeen = typeof fact.last_seen === 'string'
    ? fact.last_seen.slice(0, 10)
    : 'unknown';

  // Pull a representative evidence quote (first positive one) so the critic
  // sees what kind of signal classified this fact as accepted. Truncate
  // hard so a long diff summary can't crowd the row.
  const positiveEv = (fact.evidence || []).find(
    (e) => e && POSITIVE_EVIDENCE_KINDS.has(e.kind),
  );
  const evKind = positiveEv ? positiveEv.kind : 'unknown';

  // generation_id field is a Sprint 16 contract: facts produced by the
  // current pipeline carry a generation_id in evidence.quote_or_diff or as
  // a top-level meta field. We surface fact.id as a stable handle either
  // way — that's what /visionary-taste show uses.
  const line = `${idx}. id: ${id} | ${targetType}: ${truncate(targetValue, 60)} | evidence: ${evKind} | last_seen: ${lastSeen}`;
  if (line.length > ROW_CHAR_BUDGET) return line.slice(0, ROW_CHAR_BUDGET - 1) + '…';
  return line;
}

function truncate(s, max) {
  if (typeof s !== 'string') return '';
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

function assembleContext({ round, rows, count }) {
  return [
    `ANTI-PATTERN CONTEXT (round ${round}):`,
    `The user has previously accepted these ${count} designs (their taste pattern is stabilized).`,
    `Do NOT reward this generation for converging toward those patterns. Reward it ONLY when`,
    `it explores territory the user has not yet seen. Score originality_vs_history accordingly.`,
    '',
    `Reference signatures (top-${count}):`,
    ...rows,
    '',
  ].join('\n');
}

function trimToBudget(text) {
  if (text.length <= CHAR_BUDGET) return text;
  // Trim from the end, preserving the header + earliest rows. We append a
  // truncation marker so the critic understands the list was cut.
  const marker = '\n… (truncated)\n';
  const head = text.slice(0, CHAR_BUDGET - marker.length);
  // Snap back to last newline so we don't end mid-row.
  const lastNl = head.lastIndexOf('\n');
  const safe = lastNl > 0 ? head.slice(0, lastNl) : head;
  return safe + marker;
}

function buildFallback(round) {
  return {
    context:
      `ANTI-PATTERN CONTEXT (round ${round}):\n` +
      `No user history available yet. Use global aesthetic priors. Reward originality across the catalog's archetype range.\n`,
    used_method: 'fallback',
    history_count: 0,
    history_window_days: 0,
  };
}

function buildEmptyHistoryFallback(round) {
  // Distinct from buildFallback only for trace clarity — file existed but
  // contained no usable accepted facts. Same payload, same used_method
  // ('fallback'), so callers don't have to branch.
  return {
    context:
      `ANTI-PATTERN CONTEXT (round ${round}):\n` +
      `No user history available yet. Use global aesthetic priors. Reward originality across the catalog's archetype range.\n`,
    used_method: 'fallback',
    history_count: 0,
    history_window_days: 0,
  };
}
