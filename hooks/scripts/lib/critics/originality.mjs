// originality.mjs — Sprint 16 Task 31.3.
//
// Implements the 9th critic dimension `originality_vs_history`. Compares
// the current generation's 8D-aesthetic-embedding (or DINOv2 thumbnail
// when Sprint 11 is active) against the user's last N accepted entries
// from taste/facts.jsonl. Score = 10 - (max_similarity * 10).
//
// Round-gated: round 1 returns null (no history to compare), round 2+
// activates. Empty-history fallback is handled by the caller via the
// global priors file at skills/visionary/priors/global-aesthetic-history.json.
//
// Zero dependencies. Cross-platform. Reused by capture-and-critique and
// the agents/critic-originality.md persona during multi-critic merge.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Public: read recent accepted entries from facts.jsonl ───────────────────
//
// Filters to status ∈ {active, permanent} and signal-shape ∈ {git_kept,
// picked, accepted}. Sort by last_seen DESC, take the first topN. Each
// entry is expected to carry an embedding_8d block produced by the critic
// pipeline at fact-write time; entries without one are skipped (they cannot
// participate in cosine).
//
// Returns an array; never throws on malformed lines (one corrupt line is
// logged-and-skipped).
export function readRecentAccepted(factsJsonlPath, topN = 10) {
  if (!factsJsonlPath || !existsSync(factsJsonlPath)) return [];
  let raw;
  try { raw = readFileSync(factsJsonlPath, 'utf8'); } catch { return []; }
  const lines = raw.split('\n');
  const accepted = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let fact;
    try { fact = JSON.parse(trimmed); } catch { continue; }
    if (!fact || typeof fact !== 'object') continue;
    if (!isAcceptedFact(fact)) continue;
    if (!fact.embedding_8d || typeof fact.embedding_8d !== 'object') continue;
    accepted.push(fact);
  }
  // Sort DESC by last_seen (ISO-8601 strings sort lexically as dates).
  accepted.sort((a, b) => {
    const at = String(a.last_seen || '');
    const bt = String(b.last_seen || '');
    if (at < bt) return 1;
    if (at > bt) return -1;
    return 0;
  });
  return accepted.slice(0, Math.max(0, topN));
}

function isAcceptedFact(fact) {
  const status = fact.status || (fact.scope && fact.scope.status);
  if (status && !['active', 'permanent'].includes(status)) return false;
  const signal = fact.signal || {};
  // Treat any of these as accepted: explicit signal type, or direction='positive'
  // on a target that survived through git_kept/picked/accepted lifecycle.
  const t = signal.type || signal.kind || signal.shape;
  if (t && ['git_kept', 'picked', 'accepted'].includes(t)) return true;
  // Fallback: positive direction signals (extracted from kept artefacts).
  if (signal.direction === 'positive') return true;
  return false;
}

// ── Public: 8D cosine similarity ────────────────────────────────────────────
// Inputs are objects with the 8 standard dim keys; missing keys default to 0.
// Cosine = (a · b) / (|a| * |b|), clamped to [0, 1] (negative cosines treated
// as 0 — for aesthetic embeddings, opposite-direction vectors should not
// register as "similar but inverted", they should register as "dissimilar").
const EMBEDDING_DIMS = [
  'hierarchy',
  'layout',
  'typography',
  'contrast',
  'accessibility',
  'distinctiveness',
  'brief_conformance',
  'motion_readiness',
];

export function cosineSimilarity8D(a, b) {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return 0;
  let dot = 0, magA = 0, magB = 0;
  for (const dim of EMBEDDING_DIMS) {
    const av = toFiniteNumber(a[dim]);
    const bv = toFiniteNumber(b[dim]);
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  const cos = dot / denom;
  if (!Number.isFinite(cos)) return 0;
  return Math.max(0, Math.min(1, cos));
}

function toFiniteNumber(v) {
  return (typeof v === 'number' && Number.isFinite(v)) ? v : 0;
}

// ── Public: load global priors (fallback when user history < 5) ─────────────
const __filename = fileURLToPath(import.meta.url);
// __filename: <repo>/hooks/scripts/lib/critics/originality.mjs
// Walk up 5 levels to repo root.
const REPO_ROOT = dirname(dirname(dirname(dirname(dirname(__filename)))));
const DEFAULT_PRIORS_PATH = join(
  REPO_ROOT, 'skills', 'visionary', 'priors', 'global-aesthetic-history.json',
);

export function loadGlobalPriors(customPath) {
  const path = customPath || DEFAULT_PRIORS_PATH;
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.entries)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ── Public: score the originality dimension ─────────────────────────────────
//
// Inputs:
//   round            — round counter (1 = no history; 2+ = active).
//   currentEmbedding — 8D embedding of the current generation.
//   history          — array of accepted facts, each carrying embedding_8d
//                      and a generation_id/last_seen.
//   method           — 'embedding-8d' (default) or 'dinov2' (only the trace
//                      label changes; the cosine math is identical because
//                      the caller pre-computes vectors in either case).
//   priorsPath       — override for global priors file (testing).
//
// Returns:
//   {
//     score: number | null,
//     reason?: string,
//     top_collisions?: [{ generation_id, similarity, timestamp }],
//     method: 'embedding-8d' | 'dinov2' | 'fallback' | 'fallback-unavailable',
//   }
export function calculateOriginalityScore({
  round,
  currentEmbedding,
  history,
  method = 'embedding-8d',
  priorsPath,
} = {}) {
  // Round 1: no history to compare against. Caller MUST emit null on the
  // dimension and let the merge skip it.
  if (!Number.isInteger(round) || round < 2) {
    return { score: null, reason: 'round_1_no_history', method };
  }

  const safeHistory = Array.isArray(history) ? history.filter((h) => h && h.embedding_8d) : [];

  // Empty-history fallback: when fewer than 5 accepted entries are available,
  // try the global priors file. If it's also missing, fall back to score 7
  // (rule-of-seven: no evidence, no sub-7).
  if (safeHistory.length < 5) {
    const priors = loadGlobalPriors(priorsPath);
    if (!priors || !Array.isArray(priors.entries) || priors.entries.length === 0) {
      return {
        score: 7,
        reason: 'empty_history_fallback',
        method: 'fallback-unavailable',
        top_collisions: [],
      };
    }
    const fallbackEntries = priors.entries
      .filter((e) => e && e.embedding_8d)
      .map((e) => ({
        generation_id: e.generation_id || 'global-prior',
        embedding_8d: e.embedding_8d,
        last_seen: e.last_seen || null,
      }));
    return scoreAgainstHistory({
      currentEmbedding,
      history: fallbackEntries,
      method: 'fallback',
    });
  }

  return scoreAgainstHistory({ currentEmbedding, history: safeHistory, method });
}

function scoreAgainstHistory({ currentEmbedding, history, method }) {
  const similarities = history.map((h) => ({
    generation_id: h.generation_id || h.id || 'unknown',
    similarity: cosineSimilarity8D(currentEmbedding, h.embedding_8d),
    timestamp: h.last_seen || null,
  }));

  // Sort DESC by similarity. Stable on ties (preserves history order).
  similarities.sort((a, b) => b.similarity - a.similarity);

  const maxSim = similarities[0]?.similarity ?? 0;
  const rawScore = 10 - maxSim * 10;
  const score = Math.max(0, Math.min(10, +rawScore.toFixed(2)));
  const top_collisions = similarities.slice(0, 3);

  return { score, top_collisions, method };
}

// Default export aliases the main scoring function for ergonomic imports.
export default calculateOriginalityScore;
