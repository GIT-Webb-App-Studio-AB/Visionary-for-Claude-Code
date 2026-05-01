// pareto.mjs — Sprint 06 Task 19.4
//
// Pareto frontier persistence for critic-prompt evolution. The frontier is
// the set of critic prompts that each hold the current best Spearman ρ on
// at least one scoring dimension. Sprint 6 ships the skeleton: schema,
// on-disk JSONL writer, and a proposeUpdate function that calibration
// scripts (Sprint 6 Task 18.4 — scripts/calibrate.mjs) call with new
// per-dimension ρ values. Sprint 7+ adds the evolver that mutates
// prompts and walks up the frontier.
//
// On-disk layout:
//   .visionary/pareto/frontier.jsonl   — append-only, one entry per line
//
// Schema: skills/visionary/schemas/pareto-frontier-entry.schema.json
//
// Entries are per critic_identity ('craft' | 'aesthetic' | 'unified').
// An entry WINS on a dimension when its Spearman ρ is strictly greater
// than the current frontier's best ρ on that dimension (ties go to the
// older entry — stability over churn).
//
// Zero dependencies. Node 18+.

import {
  appendFileSync,
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { ulid, nowIso, findProjectRoot, isTasteDisabled } from './taste-io.mjs';

export const ALL_DIMENSIONS = [
  'hierarchy', 'layout', 'typography', 'contrast',
  'distinctiveness', 'brief_conformance', 'accessibility',
  'motion_readiness', 'craft_measurable', 'content_resilience',
];

export const CRITIC_IDENTITIES = ['craft', 'aesthetic', 'unified'];

// ── Paths ────────────────────────────────────────────────────────────────────
// Preference order (same pattern as capture-and-critique.mjs cacheDir):
//   1. Explicit projectRoot argument — calibrate scripts pass this.
//   2. CLAUDE_PLUGIN_DATA env var — Claude Code harness sets this; keeps
//      pareto data out of the user's repo when running as a plugin.
//   3. Nearest package.json / .git ancestor of cwd — legacy fallback.
export function paretoDir(projectRoot) {
  if (projectRoot) return join(projectRoot, '.visionary', 'pareto');
  const pluginDataDir = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginDataDir) return join(pluginDataDir, 'visionary', 'pareto');
  return join(findProjectRoot(), '.visionary', 'pareto');
}

export function frontierPath(projectRoot) {
  return join(paretoDir(projectRoot), 'frontier.jsonl');
}

function ensureDir(projectRoot) {
  const dir = paretoDir(projectRoot);
  try { mkdirSync(dir, { recursive: true }); } catch { /* EEXIST ok */ }
  return dir;
}

// ── Public: read frontier ───────────────────────────────────────────────────
// Returns { items, skipped }. Items grouped by critic_identity with the
// newest superseded_by lineage intact.
export function readFrontier(projectRoot) {
  const path = frontierPath(projectRoot);
  if (!existsSync(path)) return { items: [], skipped: 0 };
  let raw;
  try { raw = readFileSync(path, 'utf8'); } catch { return { items: [], skipped: 0 }; }
  const items = [];
  let skipped = 0;
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try { items.push(JSON.parse(trimmed)); } catch { skipped++; }
  }
  return { items, skipped };
}

// ── Public: propose update ──────────────────────────────────────────────────
// Called by calibrate.mjs after fitting a new prompt's per-dimension ρ.
// Determines which dimensions (if any) this prompt WINS on, writes a
// frontier entry, and marks any superseded entries.
//
// Arguments:
//   {
//     criticIdentity: 'craft' | 'aesthetic' | 'unified',
//     promptHash: 'sha256:...',
//     sampleCount: <int>,
//     spearmanRhoPerDim: { hierarchy: 0.72, layout: null, ... },
//     calibrationPath: relative path to calibration.json,
//     notes: [...],
//     projectRoot: override (tests)
//   }
//
// Returns:
//   {
//     added: boolean,
//     entry: { id, wins_on_dimensions, ... } | null,
//     superseded: [id, id, ...]  // ids whose formerly-winning dims were taken over
//     skipped_reason: string | null
//   }
export function proposeFrontierUpdate(args) {
  if (isTasteDisabled()) {
    return { added: false, entry: null, superseded: [], skipped_reason: 'taste-disabled' };
  }
  const {
    criticIdentity, promptHash, sampleCount, spearmanRhoPerDim,
    calibrationPath, notes = [], projectRoot, now = new Date(),
  } = args || {};

  if (!CRITIC_IDENTITIES.includes(criticIdentity)) {
    return { added: false, entry: null, superseded: [], skipped_reason: `unknown critic_identity "${criticIdentity}"` };
  }
  if (!isValidSha256(promptHash)) {
    return { added: false, entry: null, superseded: [], skipped_reason: 'invalid prompt_hash' };
  }
  if (!Number.isInteger(sampleCount) || sampleCount < 3) {
    return { added: false, entry: null, superseded: [], skipped_reason: `sample_count ${sampleCount} < 3` };
  }
  if (!spearmanRhoPerDim || typeof spearmanRhoPerDim !== 'object') {
    return { added: false, entry: null, superseded: [], skipped_reason: 'no per-dimension ρ provided' };
  }

  const { items } = readFrontier(projectRoot);
  // Only compare against active entries (superseded_by not set) for this identity.
  const relevant = items.filter((e) => e.critic_identity === criticIdentity && !e.superseded_by);

  const wins = [];
  const supersededIds = new Set();
  const tookOverPerEntry = new Map(); // id -> Set<dim>

  for (const dim of ALL_DIMENSIONS) {
    const rho = spearmanRhoPerDim[dim];
    if (typeof rho !== 'number' || !Number.isFinite(rho)) continue;
    // Find current best for this dim
    let bestRho = null;
    let bestEntryId = null;
    for (const entry of relevant) {
      const prev = entry.spearman_rho_per_dim?.[dim];
      if (typeof prev !== 'number' || !Number.isFinite(prev)) continue;
      if (bestRho === null || prev > bestRho) {
        bestRho = prev;
        bestEntryId = entry.id;
      }
    }
    // Strict >: ties stay with the incumbent.
    if (bestRho === null || rho > bestRho) {
      wins.push(dim);
      if (bestEntryId) {
        if (!tookOverPerEntry.has(bestEntryId)) tookOverPerEntry.set(bestEntryId, new Set());
        tookOverPerEntry.get(bestEntryId).add(dim);
      }
    }
  }

  if (!wins.length) {
    return { added: false, entry: null, superseded: [], skipped_reason: 'new prompt wins no dimensions' };
  }

  const newEntry = {
    id: ulid(),
    critic_identity: criticIdentity,
    prompt_hash: promptHash,
    wins_on_dimensions: wins,
    sample_count: sampleCount,
    spearman_rho_per_dim: spearmanRhoPerDim,
    added_at: now.toISOString(),
    notes: Array.isArray(notes) ? notes : [],
  };
  // Schema forbids null for calibration_path — include only when provided
  // to keep entries schema-valid.
  if (calibrationPath) newEntry.calibration_path = calibrationPath;
  appendFrontierLine(projectRoot, newEntry);

  // Check which entries have been FULLY superseded (all their wins taken).
  for (const [entryId, takenDims] of tookOverPerEntry.entries()) {
    const entry = relevant.find((e) => e.id === entryId);
    if (!entry) continue;
    const remaining = (entry.wins_on_dimensions || []).filter((d) => !takenDims.has(d));
    if (remaining.length === 0) {
      supersededIds.add(entryId);
    }
  }

  if (supersededIds.size) {
    markSuperseded(projectRoot, supersededIds, newEntry.id);
  }

  return {
    added: true,
    entry: newEntry,
    superseded: [...supersededIds],
    skipped_reason: null,
  };
}

// ── Writers ─────────────────────────────────────────────────────────────────
function appendFrontierLine(projectRoot, entry) {
  ensureDir(projectRoot);
  const path = frontierPath(projectRoot);
  let fd;
  try {
    fd = openSync(path, 'a');
    appendFileSync(fd, JSON.stringify(entry) + '\n', 'utf8');
    try { fsyncSync(fd); } catch { /* best-effort */ }
    return true;
  } catch { return false; }
  finally { if (fd !== undefined) { try { closeSync(fd); } catch { /* ignore */ } } }
}

// Mark old entries as superseded by rewriting the whole file. This is a
// rare path (only when a new prompt fully dominates an old one) so the
// rewrite cost is acceptable.
function markSuperseded(projectRoot, supersededIds, newEntryId) {
  const path = frontierPath(projectRoot);
  if (!existsSync(path)) return;
  const { items } = readFrontier(projectRoot);
  for (const e of items) {
    if (supersededIds.has(e.id)) e.superseded_by = newEntryId;
  }
  atomicRewrite(path, items.map((e) => JSON.stringify(e)).join('\n') + '\n');
}

function atomicRewrite(filePath, body) {
  const tmp = filePath + '.tmp';
  try {
    writeFileSync(tmp, body, 'utf8');
    if (process.platform === 'win32' && existsSync(filePath)) {
      try { unlinkSync(filePath); } catch { /* ignore */ }
    }
    renameSync(tmp, filePath);
    return true;
  } catch {
    try { if (existsSync(tmp)) unlinkSync(tmp); } catch { /* ignore */ }
    return false;
  }
}

function isValidSha256(s) { return typeof s === 'string' && /^sha256:[0-9a-f]{16,64}$/.test(s); }
