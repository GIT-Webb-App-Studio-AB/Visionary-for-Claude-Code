// anti-anchors.mjs — Sprint 08 Task 23.2
//
// Reads curated negative-reference screenshots from docs/slop-anchors/ and
// builds a "DO NOT reproduce these" prompt-block for injection into the
// generation context. Counterpart to rag-anchors.mjs — positive examples
// calibrate the critic, negative examples calibrate the generator.
//
// Data layout on disk:
//
//   docs/slop-anchors/
//     README.md                                — curation process + policy
//     <category>/
//       manifest.json                          — metadata + image file list
//       example-1.png, example-2.png, …        — the actual references
//       PLACEHOLDER.md                         — present when images not yet curated
//
// Loader behaviour:
//   - A category with manifest.json but missing image files is listed as
//     "incomplete" and contributes no anchors. PLACEHOLDER.md is the signal
//     that manual curation is pending; the category stays in the loader so
//     callers can ship a partial catalogue without breaking the pipeline.
//   - A category whose manifest has `excludes_styles` that matches the
//     current style id is skipped entirely — telling a brutalist style
//     "don't look like brutalism" is counterproductive.
//   - Selection for a given style prefers categories whose `avoid_families`
//     overlap with the style's family/keywords, falling back to
//     non-overlapping categories to ensure variety when no match exists.
//
// Zero dependencies. Node 18+.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __repoRoot = resolve(dirname(__filename), '..', '..', '..');

export const DEFAULT_ANCHORS_DIR = join(__repoRoot, 'docs', 'slop-anchors');
export const DEFAULT_ANCHOR_COUNT = 2;

let _cache = null;

// ── Public: load the full anti-anchor catalogue ────────────────────────────
// Returns an array of category objects:
//   [{
//     category: string,
//     description: string,
//     avoid_reasoning: string,
//     avoid_families: string[],
//     excludes_styles: string[],
//     images: [{ file, caption, path, exists }],
//     complete: boolean,
//   }, ...]
//
// `complete` is true only when at least one image file actually exists on
// disk. Callers should filter on `complete` before surfacing to the generator.
export function loadAntiAnchors(dir) {
  const root = dir || DEFAULT_ANCHORS_DIR;
  if (_cache && _cache.root === root) return _cache.categories;
  if (!existsSync(root)) {
    _cache = { root, categories: [] };
    return _cache.categories;
  }

  const entries = [];
  let subdirs;
  try { subdirs = readdirSync(root); } catch {
    _cache = { root, categories: [] };
    return _cache.categories;
  }

  for (const name of subdirs) {
    const dirPath = join(root, name);
    let st;
    try { st = statSync(dirPath); } catch { continue; }
    if (!st.isDirectory()) continue;
    const manifestPath = join(dirPath, 'manifest.json');
    if (!existsSync(manifestPath)) continue;
    let manifest;
    try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); } catch { continue; }

    const images = Array.isArray(manifest.images) ? manifest.images : [];
    const imagesResolved = images.map((img) => {
      const file = typeof img.file === 'string' ? img.file : null;
      const fullPath = file ? join(dirPath, file) : null;
      const exists = !!(fullPath && existsSync(fullPath));
      return {
        file,
        caption: typeof img.caption === 'string' ? img.caption : '',
        path: fullPath,
        exists,
      };
    });

    const category = {
      category: manifest.category || name,
      description: typeof manifest.description === 'string' ? manifest.description : '',
      avoid_reasoning: typeof manifest.avoid_reasoning === 'string' ? manifest.avoid_reasoning : '',
      avoid_families: Array.isArray(manifest.avoid_families)
        ? manifest.avoid_families.filter((s) => typeof s === 'string').map((s) => s.toLowerCase())
        : [],
      excludes_styles: Array.isArray(manifest.excludes_styles)
        ? manifest.excludes_styles.filter((s) => typeof s === 'string')
        : [],
      images: imagesResolved,
      complete: imagesResolved.some((i) => i.exists),
    };
    entries.push(category);
  }

  _cache = { root, categories: entries };
  return entries;
}

export function _clearCacheForTest() { _cache = null; }

// ── Public: select categories for a given style ────────────────────────────
// Arguments:
//   styleId      — the active style id (matches `excludes_styles`)
//   styleFamily  — an array of family tags, e.g. ['saas', 'b2b', 'marketing'].
//                  Derived from the style's category + keywords by the
//                  caller. Order doesn't matter; matching is set-intersection.
//   count        — how many categories to surface (default 2)
//
// Returns a subset of categories. Algorithm:
//   1. Start from all `complete` categories
//   2. Drop those whose excludes_styles contains styleId
//   3. Score: +2 for each family overlap, +0 for no overlap
//   4. Sort by score descending, then by name for determinism
//   5. Return top N; if fewer than N complete categories exist, return what we have
//
// Empty / no-complete case: returns [].
export function selectForStyle({ styleId, styleFamily, count = DEFAULT_ANCHOR_COUNT, anchors } = {}) {
  const all = anchors || loadAntiAnchors();
  const completeOnly = all.filter((c) => c.complete);
  const wantedFamilies = Array.isArray(styleFamily)
    ? styleFamily.filter((f) => typeof f === 'string').map((f) => f.toLowerCase())
    : [];

  const scored = completeOnly
    .filter((c) => !styleId || !c.excludes_styles.includes(styleId))
    .map((c) => {
      const overlap = c.avoid_families.filter((f) => wantedFamilies.includes(f)).length;
      return { c, score: overlap };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.c.category.localeCompare(b.c.category);
    });

  return scored.slice(0, count).map((s) => s.c);
}

// ── Public: build the prompt-block ────────────────────────────────────────
// Produces markdown ready to splice into additionalContext. Format:
//
//   === NEGATIVE visual anchors ===
//   Do NOT produce output that resembles these references. They are
//   canonical examples of generic AI-default design.
//
//   1. <category-title>: <description>
//      Why it's slop: <avoid_reasoning>
//      Reference images: docs/slop-anchors/<category>/example-1.png (caption)
//
// We deliberately reference images BY PATH rather than embedding them —
// the harness can decide whether to load them into the model's context
// (vision-model call) or just pass the paths through (text-only mode).
// Token cost is always bounded this way.
export function buildAntiAnchorBlock(selected, { includeImagePaths = true } = {}) {
  if (!Array.isArray(selected) || !selected.length) return '';
  const lines = [
    '',
    '=== NEGATIVE visual anchors — DO NOT produce anything that resembles these ===',
    '',
    'The following categories are canonical examples of AI-default output. Your generation must be visually distinct from them:',
    '',
  ];
  selected.forEach((cat, i) => {
    lines.push(`${i + 1}. **${cat.category}** — ${cat.description || '(no description)'}`);
    if (cat.avoid_reasoning) {
      lines.push(`   Why it's slop: ${cat.avoid_reasoning}`);
    }
    if (includeImagePaths) {
      const shipped = cat.images.filter((img) => img.exists);
      if (shipped.length) {
        lines.push('   Reference images:');
        for (const img of shipped) {
          const caption = img.caption ? ` — ${img.caption}` : '';
          lines.push(`     · ${img.path}${caption}`);
        }
      }
    }
    lines.push('');
  });
  lines.push('If your output aligns with any of these references, you have failed the distinctiveness bar. Diverge before emitting.');
  return lines.join('\n');
}

// ── Public: top-level convenience ──────────────────────────────────────────
// One-call wrapper: "give me the anti-anchor block for this style".
// Returns '' when no complete categories exist (graceful — generator runs
// without negative anchors in bootstrap phase when no images have been
// curated yet).
export function buildBlockForStyle({ styleId, styleFamily, count, anchorsDir, includeImagePaths } = {}) {
  const anchors = loadAntiAnchors(anchorsDir);
  const selected = selectForStyle({ styleId, styleFamily, count, anchors });
  return buildAntiAnchorBlock(selected, { includeImagePaths });
}

export default buildBlockForStyle;
