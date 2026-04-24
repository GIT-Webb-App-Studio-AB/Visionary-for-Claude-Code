// taste-aging.mjs — Sprint 05 Task 14.3.
//
// Pure functions that implement the active → permanent → decayed lifecycle
// rules for taste facts. No I/O: the runner (see agingRun below) orchestrates
// read / rewrite / log, but the decision logic is 100% deterministic from
// the input fact and a reference timestamp.
//
// Rules (verbatim from sprint plan):
//
//   PROMOTION: active → permanent
//     IF confidence ≥ 0.9
//     AND evidence.length ≥ 3
//     AND unique(evidence.kind) ≥ 2
//     THEN flag = "permanent"
//
//   DECAY: active → decayed
//     IF last_seen > 30 days ago
//     AND no new evidence since last_seen
//     THEN flag = "decayed", confidence *= 0.5
//     IF confidence < 0.2 → delete
//
//   REACTIVATION: decayed → active
//     (handled in taste-extractor.applyUpgrade — when new evidence arrives
//      on a decayed fact, it flips back to active with confidence boosted
//      to max(existing, 0.5). Kept there to keep the mutation atomic with
//      the evidence append.)
//
// Promotion is non-reversible in this module: a permanent fact stays
// permanent even if evidence ages. That is deliberate — a user who has
// rejected something 3 times across 2+ evidence kinds doesn't need the
// system to second-guess them every 30 days.

import { readFacts, rewriteFacts, agingLogPath, nowIso, isoDaysAgo, isTasteDisabled } from './taste-io.mjs';
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// ── Tunables — exposed for tests and /visionary-taste debugging ────────────
export const AGING = Object.freeze({
  PROMOTION_CONFIDENCE: 0.9,
  PROMOTION_EVIDENCE_COUNT: 3,
  PROMOTION_UNIQUE_KINDS: 2,

  DECAY_DAYS: 30,
  DECAY_MULTIPLIER: 0.5,
  DELETE_THRESHOLD: 0.2,

  REACTIVATION_FLOOR: 0.5,  // consumed by taste-extractor.applyUpgrade
});

// ── Decision functions (pure) ───────────────────────────────────────────────
export function shouldPromote(fact) {
  if (!fact || fact.flag !== 'active') return false;
  if ((fact.confidence || 0) < AGING.PROMOTION_CONFIDENCE) return false;
  const evidence = Array.isArray(fact.evidence) ? fact.evidence : [];
  if (evidence.length < AGING.PROMOTION_EVIDENCE_COUNT) return false;
  const uniqueKinds = new Set(evidence.map((e) => e && e.kind).filter(Boolean));
  if (uniqueKinds.size < AGING.PROMOTION_UNIQUE_KINDS) return false;
  return true;
}

export function shouldDecay(fact, nowMs = Date.now()) {
  if (!fact || fact.flag !== 'active') return false;
  const days = isoDaysAgo(fact.last_seen, nowMs);
  return days > AGING.DECAY_DAYS;
}

// Apply the decay mutation. Returns { fact, deleted }: if the post-decay
// confidence falls below the DELETE_THRESHOLD the fact is flagged for
// removal (the caller filters those out of the written set).
export function applyDecay(fact) {
  const nextConfidence = (fact.confidence || 0) * AGING.DECAY_MULTIPLIER;
  if (nextConfidence < AGING.DELETE_THRESHOLD) {
    return { fact, deleted: true, reason: 'confidence-below-delete-threshold' };
  }
  return {
    fact: { ...fact, flag: 'decayed', confidence: Number(nextConfidence.toFixed(4)) },
    deleted: false,
    reason: 'decay',
  };
}

export function applyPromotion(fact) {
  return { ...fact, flag: 'permanent' };
}

// ── Batch orchestrator (pure — takes facts in, returns facts out) ───────────
// Returns { kept, removed, promoted, decayed, unchanged } so agingRun can log
// per-run statistics. The caller writes `kept` back to disk and appends a
// summary line to aging.log.
export function ageFacts(facts, nowMs = Date.now()) {
  const kept = [];
  const removed = [];
  const stats = { promoted: 0, decayed: 0, unchanged: 0, deleted: 0 };

  for (const fact of facts) {
    if (!fact || !fact.flag) { stats.unchanged++; kept.push(fact); continue; }

    // Permanent facts are not re-evaluated.
    if (fact.flag === 'permanent') { stats.unchanged++; kept.push(fact); continue; }

    // Decayed facts remain decayed until new evidence arrives
    // (reactivation is handled on the evidence-append path, not here).
    if (fact.flag === 'decayed') { stats.unchanged++; kept.push(fact); continue; }

    if (shouldPromote(fact)) {
      kept.push(applyPromotion(fact));
      stats.promoted++;
      continue;
    }

    if (shouldDecay(fact, nowMs)) {
      const r = applyDecay(fact);
      if (r.deleted) {
        removed.push(fact);
        stats.deleted++;
      } else {
        kept.push(r.fact);
        stats.decayed++;
      }
      continue;
    }

    kept.push(fact);
    stats.unchanged++;
  }

  return { kept, removed, stats };
}

// ── Runner (orchestrates read, age, write, log) ─────────────────────────────
// Called by the SessionStart hook once per week (rate-limited via stamp in
// CLAUDE_PLUGIN_DATA — same pattern as check-for-updates.mjs). Also callable
// directly from /visionary-taste for manual re-aging.
//
// Returns the stats object so callers can emit status messages.
export async function agingRun(projectRoot, { now = Date.now(), dryRun = false } = {}) {
  if (isTasteDisabled()) return { skipped: 'disabled', stats: null };

  const { items: facts } = readFacts(projectRoot);
  if (facts.length === 0) return { skipped: 'empty', stats: null };

  const { kept, removed, stats } = ageFacts(facts, now);

  if (!dryRun && (stats.promoted + stats.decayed + stats.deleted > 0)) {
    rewriteFacts(projectRoot, kept);
  }

  logAgingRun(projectRoot, { now, stats, removedCount: removed.length, dryRun });
  return { skipped: null, stats, kept: kept.length, removed: removed.length };
}

// ── Aging log ───────────────────────────────────────────────────────────────
// One line per run, tab-separated, so `grep` + `awk` work cleanly:
//   <iso>\tpromoted=N\tdecayed=N\tdeleted=N\tunchanged=N\tdry-run=bool
// Written to taste/aging.log (same dir as facts.jsonl).
function logAgingRun(projectRoot, { now, stats, removedCount, dryRun }) {
  try {
    const logPath = agingLogPath(projectRoot);
    const logDir = dirname(logPath);
    if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
    const line = [
      new Date(now).toISOString(),
      `promoted=${stats.promoted}`,
      `decayed=${stats.decayed}`,
      `deleted=${stats.deleted}`,
      `unchanged=${stats.unchanged}`,
      `removed=${removedCount}`,
      `dry-run=${dryRun ? 'true' : 'false'}`,
    ].join('\t') + '\n';
    appendFileSync(logPath, line, 'utf8');
  } catch { /* logging failure must not block the aging run */ }
}

// ── Unused-but-exported reference for the sprint plan's REACTIVATION rule ─
// Kept as a named export so any future code that reactivates facts directly
// (as opposed to via taste-extractor.applyUpgrade) has one source of truth.
export function applyReactivation(fact) {
  if (fact.flag !== 'decayed') return fact;
  return {
    ...fact,
    flag: 'active',
    confidence: Math.max(fact.confidence || 0, AGING.REACTIVATION_FLOOR),
  };
}

// Used by nowIso export for test reproducibility without importing twice.
export { nowIso };
