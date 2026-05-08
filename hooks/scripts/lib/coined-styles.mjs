// coined-styles.mjs — Sprint 17 Task 33.6 (stub) + Sprint 21 Task 38.4 (full).
//
// Two layers, intentional separation:
//
//   Sprint 17 surface (preserved exactly, do not break):
//     getCoinedStylesPath, readCoinedStyles, persistCoinedBlend, _internals
//
//   Sprint 21 expansion (this file adds):
//     updateAcceptanceCount  — vector-similarity dedup + count++
//     checkPromotion         — find entries ready for promotion
//     generateAutoName       — deterministic 2-word kebab name from vector
//     promoteToCatalog       — write styles/extended/coined-<name>.md + _index update
//     ejectFromCatalog       — remove file but keep jsonl entry
//     renameCoinedEntry      — rename file + index, keep entry id stable
//     listCoinedEntries      — read + augment with ageDays/promoted flags
//
// Storage convention (per Sprint 15 + Sprint 17 spec):
//   - JSONL lives at `${CLAUDE_PLUGIN_DATA}/taste/coined-styles.jsonl` when env set
//   - Else `${projectRoot}/taste/coined-styles.jsonl` (test/dev fallback)
//   - VISIONARY_COINED_STYLES_PATH env override beats both for tests
//
// Promotion thresholds:
//   - 3+ acceptances of vector-similar (≥0.85 cosine) blend
//   - Maturity gate: ≥7 days between first_seen and now (guards user-noise
//     from rapid same-session acceptances)
//
// Auto-naming: deterministic v1 (pure-function over vector + anchor recipe).
// Sprint 22 may swap in a Haiku-batch call; the deterministic name remains a
// safe fallback if the LLM hop fails or produces a profanity hit.

import {
  readFileSync,
  writeFileSync,
  existsSync,
  appendFileSync,
  mkdirSync,
  unlinkSync,
  renameSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cosine8D, AXES } from './style-blend.mjs';

// ── Public constants ──────────────────────────────────────────────────────

export const PROMOTION_THRESHOLD_COUNT = 3;
export const PROMOTION_MATURITY_DAYS = 7;
export const VECTOR_SIMILARITY_THRESHOLD = 0.85;

// ── Path resolution ───────────────────────────────────────────────────────
//
// Resolve the JSONL location. ENV override wins so tests can isolate fixtures
// in os.tmpdir(). Default: <projectRoot>/taste/coined-styles.jsonl.
// We read process.env at call time (not module load) so callers can flip the
// override per-invocation — important for tests and for any future per-tenant
// routing that runtime-configures the path.
export function getCoinedStylesPath(projectRoot) {
  const envPath = process.env.VISIONARY_COINED_STYLES_PATH;
  if (envPath) return envPath;
  return join(projectRoot, 'taste', 'coined-styles.jsonl');
}

// Resolve the on-disk styles dir. Coined styles live in the same
// `styles/extended/` directory as catalog extended styles by default, with an
// env override for tests so we don't mutate the real catalog.
export function getStylesDir(opts = {}) {
  if (opts.stylesDir) return opts.stylesDir;
  const envDir = process.env.VISIONARY_STYLES_DIR;
  if (envDir) return envDir;
  const __filename = fileURLToPath(import.meta.url);
  return resolve(dirname(__filename), '..', '..', '..', 'skills', 'visionary', 'styles');
}

// ── Sprint 17 surface — preserved verbatim ────────────────────────────────

// READ. Sprint 17 returns the parsed file as-is. Sprint 21 layers
// `accepted_count`, `first_seen`, `last_seen`, `name`, `promoted_at` on top
// without changing the read shape — old entries written by Sprint 17 still
// parse and gain default values transparently in checkPromotion().
export function readCoinedStyles(projectRoot) {
  const path = getCoinedStylesPath(projectRoot);
  if (!existsSync(path)) return [];
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return [];
  }
  const out = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (entry && typeof entry === 'object') out.push(entry);
    } catch {
      // Drop malformed lines silently. Sprint 21 may add a quarantine path.
    }
  }
  return out;
}

// PERSIST (append-only). Sprint 17 contract: same id may appear multiple
// times — Sprint 21 dedup happens via updateAcceptanceCount(), not here.
// Tests for Sprint 17 still pass because nothing in the append path changes.
export function persistCoinedBlend({
  vector,
  anchor_recipe,
  projectRoot,
  now = new Date(),
}) {
  if (!vector || typeof vector !== 'object') {
    return { error: 'persistCoinedBlend: vector required' };
  }
  if (!Array.isArray(anchor_recipe)) {
    return { error: 'persistCoinedBlend: anchor_recipe must be an array' };
  }

  const path = getCoinedStylesPath(projectRoot);
  const id = 'coined-' + simpleHash(stableStringify(vector)).slice(0, 12);
  const isoNow = (now instanceof Date ? now : new Date(now)).toISOString();

  const entry = {
    id,
    vector,
    anchor_recipe,
    accepted_count: 1,
    first_seen: isoNow,
    last_seen: isoNow,
    name: null,
  };

  try {
    const dir = dirname(path);
    if (dir && dir !== '.' && dir !== '/') {
      try {
        mkdirSync(dir, { recursive: true });
      } catch {
        // mkdirSync({recursive: true}) doesn't throw on EEXIST; permission
        // failure surfaces from the appendFileSync below.
      }
    }
    appendFileSync(path, JSON.stringify(entry) + '\n', 'utf8');
    return entry;
  } catch (err) {
    return { error: err.message };
  }
}

// ── Sprint 21 surface — promotion logic ───────────────────────────────────

// updateAcceptanceCount — the smarter persist. If a vector-similar entry
// already exists (cosine ≥ 0.85), bump its count + last_seen and rewrite the
// JSONL. Otherwise fall back to persistCoinedBlend (Sprint 17 path).
//
// We rewrite the file when bumping an existing entry rather than appending
// a "delta" line because (a) the file is small (≤100 entries by design,
// LRU-evicted) and (b) downstream readers expect at most one entry per id.
export function updateAcceptanceCount({
  vector,
  anchor_recipe,
  projectRoot,
  now = new Date(),
}) {
  if (!vector || typeof vector !== 'object') {
    return { error: 'updateAcceptanceCount: vector required' };
  }
  if (!Array.isArray(anchor_recipe)) {
    return { error: 'updateAcceptanceCount: anchor_recipe must be an array' };
  }

  const isoNow = (now instanceof Date ? now : new Date(now)).toISOString();
  const existing = readCoinedStyles(projectRoot);

  // Find a vector-similar entry. We use cosine over the 8D axis space — the
  // same metric blend.mjs uses to detect near-antipodal pairs. Threshold 0.85
  // is empirically the boundary where two blends produce visually-equivalent
  // generations (per Sprint 17 calibration notes).
  let matchIdx = -1;
  for (let i = 0; i < existing.length; i++) {
    const e = existing[i];
    if (!e || !e.vector) continue;
    if (cosine8D(vector, e.vector) >= VECTOR_SIMILARITY_THRESHOLD) {
      matchIdx = i;
      break;
    }
  }

  if (matchIdx >= 0) {
    const match = existing[matchIdx];
    match.accepted_count = (match.accepted_count || 1) + 1;
    match.last_seen = isoNow;
    // Carry forward fields that may be undefined on Sprint 17-era entries.
    if (!match.first_seen) match.first_seen = isoNow;
    if (!('name' in match)) match.name = null;
    const result = rewriteAllEntries(projectRoot, existing);
    if (result.error) return { error: result.error };
    return { mode: 'updated', entry: match };
  }

  // No match → new entry via Sprint 17 path.
  const fresh = persistCoinedBlend({ vector, anchor_recipe, projectRoot, now });
  if (fresh.error) return { error: fresh.error };
  return { mode: 'created', entry: fresh };
}

// checkPromotion — surface entries that have crossed the count + maturity
// gates AND have not been promoted yet. Returns an array (possibly empty);
// the orchestrator decides whether to call promoteToCatalog on each.
export function checkPromotion(projectRoot, now = new Date()) {
  const all = readCoinedStyles(projectRoot);
  const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
  return all.filter((e) => {
    if (!e || typeof e !== 'object') return false;
    if ((e.accepted_count || 0) < PROMOTION_THRESHOLD_COUNT) return false;
    if (e.promoted_at) return false; // already promoted
    if (!e.first_seen) return false;
    const firstSeenMs = new Date(e.first_seen).getTime();
    if (Number.isNaN(firstSeenMs)) return false;
    const ageDays = (nowMs - firstSeenMs) / (1000 * 60 * 60 * 24);
    return ageDays >= PROMOTION_MATURITY_DAYS;
  });
}

// generateAutoName — deterministic 2-word kebab name from the dominant axis
// + the heaviest anchor's last hyphen-segment.
//
// Strategy:
//   1. Pick the axis whose value is farthest from 0.5 (most "opinionated").
//      Ties broken by AXES order — this keeps the function deterministic even
//      when two axes have identical extremity.
//   2. Map that axis to a high/low descriptor (e.g. chroma high → "vibrant",
//      density low → "spacious").
//   3. Suffix with the last hyphen-segment of the heaviest anchor's id
//      (e.g. "swiss-rationalism" → "rationalism", "frutiger-aero" → "aero").
//   4. Compose `<descriptor>-<suffix>`, lowercase, kebab-case.
//
// Examples (from real test fixtures):
//   { density: 0.2, chroma: 0.5, ..., anchor: liminal-space } → "spacious-space"
//   { density: 0.5, chroma: 0.9, ..., anchor: vaporwave }      → "vibrant-vaporwave"
//   { density: 0.5, motion_intensity: 0.95, anchor: synthwave }→ "kinetic-synthwave"
//
// If multiple axes tie for "most extreme" we prefer the earliest in AXES
// (canonical order) so two callers with identical inputs always get the same
// name. No randomness — promotion must be reproducible.
const AXIS_DESCRIPTORS = {
  density: { high: 'dense', low: 'spacious' },
  chroma: { high: 'vibrant', low: 'muted' },
  formality: { high: 'formal', low: 'casual' },
  motion_intensity: { high: 'kinetic', low: 'still' },
  historicism: { high: 'retro', low: 'modern' },
  texture: { high: 'tactile', low: 'smooth' },
  contrast_energy: { high: 'sharp', low: 'soft' },
  type_drama: { high: 'expressive', low: 'restrained' },
};

export function generateAutoName(entry) {
  if (!entry || !entry.vector || typeof entry.vector !== 'object') {
    return 'coined-blend';
  }
  const v = entry.vector;

  // 1. Find the axis farthest from 0.5. AXES order breaks ties.
  let bestAxis = null;
  let bestExtremity = -1;
  for (const axis of AXES) {
    const val = typeof v[axis] === 'number' ? v[axis] : 0.5;
    const extremity = Math.abs(val - 0.5);
    if (extremity > bestExtremity) {
      bestExtremity = extremity;
      bestAxis = axis;
    }
  }
  if (!bestAxis) return 'coined-blend';

  const axisVal = typeof v[bestAxis] === 'number' ? v[bestAxis] : 0.5;
  const direction = axisVal > 0.5 ? 'high' : 'low';
  const descriptor = (AXIS_DESCRIPTORS[bestAxis] || {})[direction] || 'coined';

  // 2. Heaviest anchor's last hyphen-segment.
  let suffix = 'blend';
  if (Array.isArray(entry.anchor_recipe) && entry.anchor_recipe.length > 0) {
    const sorted = [...entry.anchor_recipe].sort(
      (a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0),
    );
    const primary = sorted[0];
    if (primary && typeof primary.id === 'string' && primary.id.length > 0) {
      const parts = primary.id.split('-').filter(Boolean);
      if (parts.length > 0) suffix = parts[parts.length - 1];
    }
  }

  return `${descriptor}-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

// promoteToCatalog — write the markdown file + update _index.md, then mark
// the JSONL entry's `promoted_at` so subsequent checkPromotion calls skip it.
//
// Atomicity: we write the markdown via a tmp file + rename, append to
// _index.md only after the rename succeeds, and only THEN rewrite the JSONL.
// Worst-case partial state: markdown exists without index entry (visible but
// not searchable). That's recoverable; the inverse (index entry without file)
// would 404 the loader.
export function promoteToCatalog({
  entry,
  projectRoot,
  stylesDir,
  now = new Date(),
}) {
  if (!entry || !entry.vector) {
    return { error: 'promoteToCatalog: entry with vector required' };
  }

  const dir = stylesDir || getStylesDir();
  const extDir = join(dir, 'extended');

  const name = (entry.name && typeof entry.name === 'string' && entry.name.length > 0)
    ? entry.name
    : generateAutoName(entry);
  const filename = `coined-${name}.md`;
  const filePath = join(extDir, filename);

  // Refuse to overwrite an existing catalog file. Two coined entries that
  // hash to the same name (rare but possible if descriptor + anchor segment
  // collide) get suffixed with a short id slice for disambiguation.
  let finalPath = filePath;
  let finalFilename = filename;
  if (existsSync(finalPath)) {
    const idSlice = (entry.id || 'coined').replace(/^coined-/, '').slice(0, 6);
    finalFilename = `coined-${name}-${idSlice}.md`;
    finalPath = join(extDir, finalFilename);
  }

  try {
    mkdirSync(extDir, { recursive: true });
  } catch {
    // EEXIST is fine.
  }

  const md = renderMarkdown({ entry, name, now });

  // tmp + rename for atomicity on the markdown write.
  const tmpPath = finalPath + '.tmp';
  try {
    writeFileSync(tmpPath, md, 'utf8');
    renameSync(tmpPath, finalPath);
  } catch (err) {
    return { error: `promoteToCatalog: write failed: ${err.message}` };
  }

  // Append to _index.md (line-based) IF it exists. We don't try to keep the
  // _index.md sectioned; we add a `## Coined Styles` section at the bottom
  // if missing, then add a single bullet line. Idempotent — repeated promotes
  // of the same entry won't add duplicate lines.
  const indexResult = appendIndexEntry({
    stylesDir: dir,
    filename: finalFilename,
    entry,
    name,
  });
  if (indexResult.error) {
    // Roll back the markdown write if index update fails — partial state
    // would confuse the loader.
    try {
      unlinkSync(finalPath);
    } catch {
      // best-effort
    }
    return { error: `promoteToCatalog: index update failed: ${indexResult.error}` };
  }

  // Mark the JSONL entry as promoted. Look up the entry by id to be safe —
  // the caller may have mutated the entry locally without persisting.
  const all = readCoinedStyles(projectRoot);
  const idx = all.findIndex((e) => e && e.id === entry.id);
  if (idx >= 0) {
    all[idx].promoted_at = (now instanceof Date ? now : new Date(now)).toISOString();
    all[idx].name = name;
    all[idx].promoted_filename = finalFilename;
    const rw = rewriteAllEntries(projectRoot, all);
    if (rw.error) {
      // Markdown + index already written; the JSONL update failure means we
      // could re-promote on the next pass. checkPromotion guards against
      // re-promoting via the file existence check too. Surface the error.
      return {
        mode: 'promoted-no-jsonl-update',
        path: finalPath,
        filename: finalFilename,
        name,
        warning: rw.error,
      };
    }
  }

  return {
    mode: 'promoted',
    path: finalPath,
    filename: finalFilename,
    name,
    promoted_at: all[idx] ? all[idx].promoted_at : undefined,
  };
}

// ejectFromCatalog — remove the markdown file from styles/extended/ but keep
// the JSONL entry (with promoted_at cleared) so the user can re-promote
// later if they change their mind. Also strips the index line.
export function ejectFromCatalog({ entryId, projectRoot, stylesDir }) {
  if (!entryId || typeof entryId !== 'string') {
    return { error: 'ejectFromCatalog: entryId (string) required' };
  }
  const dir = stylesDir || getStylesDir();
  const all = readCoinedStyles(projectRoot);
  const idx = all.findIndex((e) => e && e.id === entryId);
  if (idx < 0) return { error: `ejectFromCatalog: id "${entryId}" not found` };
  const entry = all[idx];
  if (!entry.promoted_at) {
    return { error: `ejectFromCatalog: id "${entryId}" is not promoted` };
  }
  const filename = entry.promoted_filename || `coined-${entry.name}.md`;
  const filePath = join(dir, 'extended', filename);
  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath);
    } catch (err) {
      return { error: `ejectFromCatalog: unlink failed: ${err.message}` };
    }
  }
  // Strip the _index.md line.
  const indexResult = removeIndexEntry({ stylesDir: dir, filename });
  if (indexResult.error) return { error: indexResult.error };

  // Clear promoted_at + promoted_filename so user can re-promote later.
  delete entry.promoted_at;
  delete entry.promoted_filename;
  const rw = rewriteAllEntries(projectRoot, all);
  if (rw.error) return { error: rw.error };
  return { mode: 'ejected', filename };
}

// renameCoinedEntry — rename the markdown file + update the index line.
// JSONL `name` field is updated too. The entry id stays stable (it's a
// hash of the vector).
export function renameCoinedEntry({ entryId, newName, projectRoot, stylesDir }) {
  if (!entryId) return { error: 'renameCoinedEntry: entryId required' };
  if (!newName || typeof newName !== 'string') {
    return { error: 'renameCoinedEntry: newName (string) required' };
  }
  const sanitized = newName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!sanitized) return { error: 'renameCoinedEntry: newName had no usable chars' };

  const dir = stylesDir || getStylesDir();
  const all = readCoinedStyles(projectRoot);
  const idx = all.findIndex((e) => e && e.id === entryId);
  if (idx < 0) return { error: `renameCoinedEntry: id "${entryId}" not found` };
  const entry = all[idx];
  if (!entry.promoted_at) {
    return { error: `renameCoinedEntry: id "${entryId}" is not promoted` };
  }

  const oldFilename = entry.promoted_filename || `coined-${entry.name}.md`;
  const oldPath = join(dir, 'extended', oldFilename);
  const newFilename = `coined-${sanitized}.md`;
  const newPath = join(dir, 'extended', newFilename);

  if (existsSync(newPath) && newPath !== oldPath) {
    return { error: `renameCoinedEntry: target file already exists: ${newFilename}` };
  }

  if (existsSync(oldPath)) {
    try {
      renameSync(oldPath, newPath);
    } catch (err) {
      return { error: `renameCoinedEntry: rename failed: ${err.message}` };
    }
  }
  // Index update: remove old line, add new.
  const removeRes = removeIndexEntry({ stylesDir: dir, filename: oldFilename });
  if (removeRes.error) return { error: removeRes.error };
  const addRes = appendIndexEntry({
    stylesDir: dir,
    filename: newFilename,
    entry,
    name: sanitized,
  });
  if (addRes.error) return { error: addRes.error };

  entry.name = sanitized;
  entry.promoted_filename = newFilename;
  const rw = rewriteAllEntries(projectRoot, all);
  if (rw.error) return { error: rw.error };
  return { mode: 'renamed', oldFilename, newFilename, name: sanitized };
}

// listCoinedEntries — read JSONL and decorate each entry with a couple of
// computed fields the management command surfaces (ageDays, ready_for_promo).
export function listCoinedEntries(projectRoot, now = new Date()) {
  const all = readCoinedStyles(projectRoot);
  const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
  return all.map((e) => {
    const out = { ...e };
    if (e.first_seen) {
      const firstMs = new Date(e.first_seen).getTime();
      if (!Number.isNaN(firstMs)) {
        out.age_days = (nowMs - firstMs) / (1000 * 60 * 60 * 24);
      }
    }
    out.ready_for_promotion =
      (e.accepted_count || 0) >= PROMOTION_THRESHOLD_COUNT &&
      !e.promoted_at &&
      typeof out.age_days === 'number' &&
      out.age_days >= PROMOTION_MATURITY_DAYS;
    return out;
  });
}

// ── Internal helpers ──────────────────────────────────────────────────────

// rewriteAllEntries — atomic-ish (tmp + rename) full rewrite of the JSONL.
// Required because updateAcceptanceCount and promoteToCatalog need to MUTATE
// existing entries, not just append.
function rewriteAllEntries(projectRoot, entries) {
  const path = getCoinedStylesPath(projectRoot);
  const tmp = path + '.tmp';
  try {
    const dir = dirname(path);
    if (dir && dir !== '.' && dir !== '/') {
      try {
        mkdirSync(dir, { recursive: true });
      } catch {
        // EEXIST ok
      }
    }
    const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
    writeFileSync(tmp, lines, 'utf8');
    renameSync(tmp, path);
    return { ok: true };
  } catch (err) {
    return { error: err.message };
  }
}

// renderMarkdown — produce the catalog-shaped style file from an entry.
// Mirrors the front-matter + section structure of styles/extended/*.md so
// the loader treats coined styles identically.
function renderMarkdown({ entry, name, now }) {
  const v = entry.vector || {};
  const isoNow = (now instanceof Date ? now : new Date(now)).toISOString();
  const motionTier = vectorToMotionTier(v.motion_intensity);
  const density = v.density >= 0.66 ? 'dense' : v.density <= 0.33 ? 'spacious' : 'balanced';
  const paletteTags = derivePaletteTags(v);
  const recipeBullets = (entry.anchor_recipe || [])
    .map(
      (a) =>
        `- **${a.id}**: weight ${typeof a.weight === 'number' ? a.weight.toFixed(2) : a.weight}`,
    )
    .join('\n') || '- (no recipe recorded)';

  const axisLines = AXES
    .map((axis) => `- **${axis}**: ${typeof v[axis] === 'number' ? v[axis].toFixed(2) : 'n/a'}`)
    .join('\n');

  return `---
id: coined-${name}
category: extended
motion_tier: ${motionTier}
density: ${density}
locale_fit: [all]
palette_tags: [${paletteTags.join(', ')}]
keywords: [coined, auto-promoted, ${name.replace(/-/g, ', ')}]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
coined:
  promoted_at: "${isoNow}"
  source_id: ${entry.id}
  accepted_count: ${entry.accepted_count || 1}
---

# Coined: ${name}

**Category:** extended (auto-promoted from accepted blends)
**Motion tier:** ${motionTier}
**Source id:** \`${entry.id}\`

## Origin

This style was promoted automatically after the user accepted a vector-similar
blend ${entry.accepted_count || 1}+ times across at least 7 days. It is not a
hand-authored catalog style; it is a **coined** style — an emergent point in
the 8D embedding space the user keeps converging on.

The recipe (anchor → weight) the blend started from:

${recipeBullets}

## 8D Embedding

${axisLines}

## How to use

This style is loaded by the catalog like any other extended style. To
inspect, rename or eject it, use \`/visionary-coined\`:

\`\`\`
/visionary-coined view ${entry.id}
/visionary-coined rename ${entry.id} <new-name>
/visionary-coined eject ${entry.id}
\`\`\`

## Provenance

Coined styles live in \`\${CLAUDE_PLUGIN_DATA}/taste/coined-styles.jsonl\` and
are personal to the user — they are not project-scoped and are not committed
to a project repo. See \`docs/coined-styles.md\` for the full lifecycle.
`;
}

// Map motion_intensity ∈ [0,1] to one of the 4 tiers used by the catalog.
function vectorToMotionTier(mi) {
  if (typeof mi !== 'number') return 'Subtle';
  if (mi <= 0.165) return 'Static';
  if (mi <= 0.495) return 'Subtle';
  if (mi <= 0.83) return 'Expressive';
  return 'Kinetic';
}

// Derive palette tags from chroma + historicism + texture. Conservative —
// the resolver downstream uses these only as candidate-pool hints, not as
// absolute classification.
function derivePaletteTags(v) {
  const tags = [];
  if (typeof v.chroma === 'number' && v.chroma >= 0.6) tags.push('vibrant');
  if (typeof v.chroma === 'number' && v.chroma < 0.3) tags.push('muted');
  if (typeof v.historicism === 'number' && v.historicism >= 0.6) tags.push('retro');
  if (typeof v.contrast_energy === 'number' && v.contrast_energy >= 0.7) tags.push('high-contrast');
  if (tags.length === 0) tags.push('neutral');
  return tags;
}

// _index.md append — idempotent line-add under a `## Coined Styles` section.
// We only touch _index.md if it exists; tests that pass a synthetic
// stylesDir without _index.md should still get a "no-op success" rather than
// an error.
function appendIndexEntry({ stylesDir, filename, entry, name }) {
  const indexPath = join(stylesDir, '_index.md');
  if (!existsSync(indexPath)) return { ok: true, skipped: 'no _index.md' };

  let raw;
  try {
    raw = readFileSync(indexPath, 'utf8');
  } catch (err) {
    return { error: err.message };
  }

  const id = `coined-${name}`;
  const bulletLine = `- **${id}** — Coined: ${name}, auto-promoted from blend ${entry.id}`;

  // If the line is already there (idempotency), do nothing.
  if (raw.includes(bulletLine)) return { ok: true, idempotent: true };

  let next;
  if (raw.includes('## Coined Styles')) {
    // Insert right after the section header.
    next = raw.replace(
      /(## Coined Styles\s*\n)/,
      `$1${bulletLine}\n`,
    );
  } else {
    // Append section at the end. Make sure trailing newline.
    const sep = raw.endsWith('\n') ? '\n' : '\n\n';
    next = raw + `${sep}## Coined Styles\n${bulletLine}\n`;
  }

  try {
    writeFileSync(indexPath, next, 'utf8');
  } catch (err) {
    return { error: err.message };
  }
  return { ok: true };
}

// _index.md remove — strip the line that mentions <filename>'s id. Keeps
// the section even if it becomes empty, since users may eject + re-promote.
function removeIndexEntry({ stylesDir, filename }) {
  const indexPath = join(stylesDir, '_index.md');
  if (!existsSync(indexPath)) return { ok: true, skipped: 'no _index.md' };

  // Derive the id we wrote — coined-<name>.md → coined-<name>.
  const idMatch = filename.match(/^(coined-[a-z0-9-]+)\.md$/i);
  if (!idMatch) return { ok: true, skipped: 'filename not coined-shape' };
  const id = idMatch[1];

  let raw;
  try {
    raw = readFileSync(indexPath, 'utf8');
  } catch (err) {
    return { error: err.message };
  }

  const lines = raw.split('\n');
  const filtered = lines.filter((line) => !line.includes(`**${id}**`));
  if (filtered.length === lines.length) {
    return { ok: true, idempotent: true };
  }
  try {
    writeFileSync(indexPath, filtered.join('\n'), 'utf8');
  } catch (err) {
    return { error: err.message };
  }
  return { ok: true };
}

// ── Stable hash helpers (Sprint 17 surface, unchanged) ────────────────────

// Stable-key JSON stringify so that two equivalent vectors with different key
// orders hash to the same id. We canonicalize the AXES order explicitly.
function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k]));
  return '{' + parts.join(',') + '}';
}

// FNV-1a 32-bit. Synchronous, no crypto-import overhead. We're hashing a small
// object — no need for SHA-256-grade collision resistance, just stable across
// runs and platforms.
function simpleHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8);
}

// Test helper — exposed so the suite can verify hash stability without
// reaching into module privates via a separate file.
export const _internals = {
  simpleHash,
  stableStringify,
  rewriteAllEntries,
  renderMarkdown,
  vectorToMotionTier,
  derivePaletteTags,
  appendIndexEntry,
  removeIndexEntry,
};
