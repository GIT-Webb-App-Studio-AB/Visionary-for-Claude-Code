// accepted-store.mjs — Sprint 06 Task 17.3
//
// On-disk store for accepted generation examples, used by the DesignPref
// RAG loop (Sprint 6 Item 17). Given a critique + brief + screenshot, this
// module:
//
//   1. Decides whether the generation counts as "accepted" (explicit
//      approval phrase, implicit high-score auto-close, or pairwise pick).
//   2. Copies the screenshot to taste/screenshots/<id>.png.
//   3. Embeds the brief summary via embed-brief.mjs.
//   4. Appends an entry to taste/accepted-examples.jsonl.
//   5. Rotates the set down to MAX_ENTRIES (50) by evicting the oldest
//      entry from the most-overrepresented product_archetype.
//
// Cross-platform atomic writes (fsync-then-rename). Same opt-out as the
// rest of the taste flywheel: VISIONARY_DISABLE_TASTE=1 short-circuits
// everything.
//
// Zero dependencies beyond sibling lib modules (embed-brief, taste-io).
// Node 18+.

import {
  appendFileSync,
  closeSync,
  copyFileSync,
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

import { findProjectRoot, isTasteDisabled, ulid, nowIso, tasteDir as libTasteDir } from './taste-io.mjs';
import { embedBrief, embedderId as EMBEDDER_ID, EMBEDDING_DIMS } from './embed-brief.mjs';

export const MAX_ENTRIES = 50;
export const IMPLICIT_COMPOSITE_THRESHOLD = 8.0;

// ── Paths ────────────────────────────────────────────────────────────────────
export function acceptedExamplesPath(projectRoot) {
  return join(libTasteDir(projectRoot), 'accepted-examples.jsonl');
}

export function screenshotsDir(projectRoot) {
  return join(libTasteDir(projectRoot), 'screenshots');
}

function ensureScreenshotsDir(projectRoot) {
  const dir = screenshotsDir(projectRoot);
  try { mkdirSync(dir, { recursive: true }); } catch { /* EEXIST ok */ }
  return dir;
}

// ── Public: detectAcceptance ────────────────────────────────────────────────
// Inputs:
//   critique        — merged critique object, must include scores
//   userText        — most recent user turn (optional; enables explicit detection)
//   pairwisePick    — truthy when this generation was picked via /variants
//
// Returns { accepted, kind, composite, reason } where kind is one of:
//   'explicit' — user typed an approval phrase
//   'implicit' — critique auto-closed with composite ≥ IMPLICIT_COMPOSITE_THRESHOLD
//   'pairwise_pick' — user selected this variant via /variants
//
// Explicit > pairwise_pick > implicit. If multiple kinds apply, the most
// authoritative wins so that downstream ranking favours user-stated
// preference over auto-derived signal.
const APPROVAL_PHRASES = [
  /\b(looks? (great|good|perfect|fine)|this is (great|perfect|good))\b/i,
  /\b(ship it|i'?ll take (it|this)|keep (it|this))\b/i,
  /\b(approved?|accept(ed)?|yes[,.!]? (do|use|keep))\b/i,
  /\/(ok|accept|ship)\b/i,
];

export function detectAcceptance({ critique, userText, pairwisePick } = {}) {
  const composite = getComposite(critique);
  if (pairwisePick) {
    return { accepted: true, kind: 'pairwise_pick', composite, reason: 'picked via /variants' };
  }
  if (userText && typeof userText === 'string') {
    for (const pattern of APPROVAL_PHRASES) {
      if (pattern.test(userText)) {
        return { accepted: true, kind: 'explicit', composite, reason: `matched "${pattern.source}"` };
      }
    }
  }
  if (typeof composite === 'number' && composite >= IMPLICIT_COMPOSITE_THRESHOLD) {
    return { accepted: true, kind: 'implicit', composite, reason: `composite ${composite.toFixed(2)} >= ${IMPLICIT_COMPOSITE_THRESHOLD}` };
  }
  return { accepted: false, kind: null, composite, reason: 'no acceptance signal' };
}

function getComposite(critique) {
  if (!critique || typeof critique !== 'object') return null;
  if (typeof critique.composite === 'number') return critique.composite;
  const scores = critique.scores || {};
  const vals = Object.values(scores).filter((v) => typeof v === 'number');
  if (!vals.length) return null;
  // Mean of present dimensions — matches the runtime early-exit gating,
  // which uses min() for hard thresholds but mean() for composite tracking.
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

// ── Public: recordAcceptance ────────────────────────────────────────────────
// Side-effects: writes screenshot, appends JSONL, triggers rotation.
// Returns { id, path, rotation } or { skipped: reason } on opt-out / no-op.
export function recordAcceptance({
  projectRoot,
  briefSummary,
  screenshotSourcePath,
  critique,
  styleId,
  productArchetype,
  componentType,
  codePath,
  acceptanceKind = 'implicit',
  now = new Date(),
} = {}) {
  if (isTasteDisabled()) return { skipped: 'taste-disabled' };
  if (!briefSummary || typeof briefSummary !== 'string') return { skipped: 'no-brief-summary' };
  if (!styleId) return { skipped: 'no-style-id' };

  const root = projectRoot || findProjectRoot();
  ensureScreenshotsDir(root);

  const id = ulid();
  const shotExt = (screenshotSourcePath || '').toLowerCase().endsWith('.jpg') ? 'jpg' : 'png';
  const screenshotRelative = join('screenshots', `${id}.${shotExt}`);
  const screenshotTarget = join(libTasteDir(root), screenshotRelative);

  // Copy the screenshot if the source exists. Missing screenshot is
  // tolerated — the entry still records the brief + scores so the RAG
  // ranker can use it, just without the image anchor.
  let screenshotCopied = false;
  if (screenshotSourcePath && existsSync(screenshotSourcePath)) {
    try {
      copyFileSync(screenshotSourcePath, screenshotTarget);
      screenshotCopied = true;
    } catch { /* leave unset; entry records the intended path */ }
  }

  // Embed the truncated brief summary.
  const trimmed = briefSummary.slice(0, 500);
  const embedding = embedBrief(trimmed);
  // Convert typed array → plain array for JSON round-trip.
  const embeddingArr = Array.from(embedding);

  const entry = {
    id,
    brief_summary: trimmed,
    brief_embedding: embeddingArr,
    embedder_id: EMBEDDER_ID,
    style_id: styleId,
    final_scores: critique?.scores || {},
    composite: getComposite(critique),
    screenshot_path: screenshotRelative.replace(/\\/g, '/'),
    code_path: codePath || null,
    product_archetype: productArchetype || null,
    component_type: componentType || null,
    accepted_at: now.toISOString(),
    acceptance_kind: acceptanceKind,
  };

  appendExampleLine(root, entry);
  const rotation = rotateAcceptedExamples(root);
  return { id, path: acceptedExamplesPath(root), screenshot_copied: screenshotCopied, rotation };
}

// ── Public: list entries ────────────────────────────────────────────────────
// Reads the JSONL and returns parsed entries. Corrupt lines are skipped.
// Filter out entries whose embedding dim doesn't match the current embedder
// — cross-embedder cosine is meaningless. Callers that want the full set
// (for debugging) should pass { allEmbedders: true }.
export function listAcceptedExamples(projectRoot, { allEmbedders = false } = {}) {
  const root = projectRoot || findProjectRoot();
  const path = acceptedExamplesPath(root);
  if (!existsSync(path)) return { items: [], skipped: 0 };
  let raw;
  try { raw = readFileSync(path, 'utf8'); } catch { return { items: [], skipped: 0 }; }
  const items = [];
  let skipped = 0;
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const entry = JSON.parse(trimmed);
      if (!allEmbedders) {
        const eid = entry.embedder_id || 'hashed-ngram-v1';
        if (eid !== EMBEDDER_ID) { skipped++; continue; }
        if (!Array.isArray(entry.brief_embedding) || entry.brief_embedding.length !== EMBEDDING_DIMS) { skipped++; continue; }
      }
      items.push(entry);
    } catch { skipped++; }
  }
  return { items, skipped };
}

// ── Public: rotation ────────────────────────────────────────────────────────
// Called after every append. When the set exceeds MAX_ENTRIES, evict the
// oldest entry whose product_archetype is the most common. This keeps the
// set diverse: a user who's built 20 dashboards won't crowd out their
// single accepted editorial page.
//
// Returns { before, after, evicted: [{ id, reason }] } so the caller can
// log the rotation outcome.
export function rotateAcceptedExamples(projectRoot, { max = MAX_ENTRIES } = {}) {
  const root = projectRoot || findProjectRoot();
  const path = acceptedExamplesPath(root);
  if (!existsSync(path)) return { before: 0, after: 0, evicted: [] };
  // Read with allEmbedders=true so rotation sees the full set; evicting
  // based only on current-embedder entries would silently preserve stale
  // vectors from old embedders.
  const { items } = listAcceptedExamples(root, { allEmbedders: true });
  if (items.length <= max) return { before: items.length, after: items.length, evicted: [] };

  const evicted = [];
  // Loop in case multiple evictions are needed (new install importing a
  // large accepted-examples file).
  while (items.length > max) {
    const counts = countByArchetype(items);
    const [overArchetype] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    // Oldest entry with that archetype (lowest accepted_at).
    const sorted = items
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => (e.product_archetype || null) === overArchetype)
      .sort((a, b) => String(a.e.accepted_at).localeCompare(String(b.e.accepted_at)));
    if (!sorted.length) break;
    const { e, i } = sorted[0];
    items.splice(i, 1);
    evicted.push({ id: e.id, reason: `rotation: oldest in overrepresented archetype "${overArchetype}"` });
    // Delete the screenshot file too (best-effort).
    if (typeof e.screenshot_path === 'string') {
      const shotPath = resolveScreenshotPath(root, e.screenshot_path);
      if (shotPath) {
        try { if (existsSync(shotPath)) unlinkSync(shotPath); } catch { /* ignore */ }
      }
    }
  }

  rewriteExamples(root, items);
  return { before: items.length + evicted.length, after: items.length, evicted };
}

function countByArchetype(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = e.product_archetype || '__none__';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

// ── Atomic append ────────────────────────────────────────────────────────────
function appendExampleLine(projectRoot, entry) {
  if (isTasteDisabled()) return false;
  const path = acceptedExamplesPath(projectRoot);
  try { mkdirSync(dirname(path), { recursive: true }); } catch { /* ignore */ }
  let fd;
  try {
    fd = openSync(path, 'a');
    appendFileSync(fd, JSON.stringify(entry) + '\n', 'utf8');
    try { fsyncSync(fd); } catch { /* best-effort */ }
    return true;
  } catch { return false; }
  finally { if (fd !== undefined) { try { closeSync(fd); } catch { /* ignore */ } } }
}

// Resolve a screenshot_path stored in the JSONL back to an absolute filesystem
// path. Strips the legacy 'taste/' prefix for entries written before
// screenshot_path became tasteDir-relative.
function resolveScreenshotPath(projectRoot, storedPath) {
  if (typeof storedPath !== 'string') return null;
  let p = storedPath;
  if (p.startsWith('taste/') || p.startsWith('taste\\')) {
    p = p.slice('taste/'.length);
  }
  return join(libTasteDir(projectRoot), p);
}

// ── Atomic rewrite (rotation) ───────────────────────────────────────────────
// Same rename-dance as taste-io.atomicRewrite but inlined to keep this
// module independent.
function rewriteExamples(projectRoot, entries) {
  if (isTasteDisabled()) return false;
  const path = acceptedExamplesPath(projectRoot);
  try { mkdirSync(dirname(path), { recursive: true }); } catch { /* ignore */ }
  const tmp = path + '.tmp';
  const body = entries.map((e) => JSON.stringify(e)).join('\n') + (entries.length ? '\n' : '');
  try {
    writeFileSync(tmp, body, 'utf8');
    if (process.platform === 'win32' && existsSync(path)) {
      try { unlinkSync(path); } catch { /* ignore */ }
    }
    renameSync(tmp, path);
    return true;
  } catch {
    try { if (existsSync(tmp)) unlinkSync(tmp); } catch { /* ignore */ }
    return false;
  }
}
