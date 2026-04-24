#!/usr/bin/env node
// Builds skills/visionary/styles/_index.json from every style .md file.
//
// The index exists so Stages 1–3 of the 8-step style-selection algorithm can
// filter on small, structured metadata (category, motion_tier, density,
// locale_fit, palette_tags) instead of loading 200+ full style markdowns into
// every LLM call. Only the winning style's full body needs to be loaded later.
//
// Guarantees:
//   - Deterministic: same inputs → bit-identical output (stable key order,
//     sorted arrays, sorted entry order by id).
//   - Idempotent: running 2× in a row produces an identical file.
//   - Atomic: writes to a temp file then renames, so a crashed run cannot
//     leave a half-written index for readers to consume.
//   - Zero runtime deps beyond Node stdlib — intentional, this repo has no
//     package.json and we are not adding one for this script.
//
// Usage:
//   node scripts/build-styles-index.mjs [--check]
//
//   --check  Build the index in memory and diff against the on-disk file.
//            Exits 0 if identical, 1 otherwise. Intended for CI / pre-commit.

import { readFileSync, writeFileSync, renameSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const stylesRoot = join(repoRoot, 'skills', 'visionary', 'styles');
const outPath = join(stylesRoot, '_index.json');

const checkOnly = process.argv.includes('--check');

// ── File discovery ──────────────────────────────────────────────────────────
function walkMarkdown(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      out.push(...walkMarkdown(full));
    } else if (s.isFile() && entry.endsWith('.md') && entry !== '_index.md') {
      out.push(full);
    }
  }
  return out;
}

// ── Minimal YAML frontmatter parser ─────────────────────────────────────────
// Only supports the subset used in this repo's style frontmatter:
//   - flat `key: value` pairs with string / number / boolean scalars
//   - inline arrays: `key: [a, b, c]`
//   - single-level nested maps (e.g. `accessibility:` with indented children)
//
// We intentionally do not pull in a full YAML parser — the frontmatter schema
// is uniform across every file (enforced by scripts/enrich-styles.mjs) and a
// dependency-free parser keeps this script runnable on a fresh clone with
// nothing but Node installed.
function parseFrontmatter(src) {
  if (!src.startsWith('---')) return null;
  const end = src.indexOf('\n---', 3);
  if (end === -1) return null;
  const body = src.slice(3, end).replace(/^\r?\n/, '');
  const lines = body.split(/\r?\n/);

  const result = {};
  let currentKey = null;
  let currentMap = null;

  for (const rawLine of lines) {
    if (rawLine.trim() === '' || rawLine.trim().startsWith('#')) continue;

    // Nested child line: 2-space (or more) indent under a map-opening key.
    if (/^\s{2,}\S/.test(rawLine) && currentMap) {
      const m = rawLine.trim().match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (m) currentMap[m[1]] = parseScalar(m[2]);
      continue;
    }

    // Top-level `key: value` or `key:` (map opener).
    const m = rawLine.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    currentKey = key;

    if (rawVal === '' || rawVal === undefined) {
      // Map opener — subsequent indented lines populate this object.
      const obj = {};
      result[key] = obj;
      currentMap = obj;
    } else {
      result[key] = parseScalar(rawVal);
      currentMap = null;
    }
  }

  return result;
}

function parseScalar(raw) {
  const s = raw.trim();
  if (s === '' || s === 'null' || s === '~') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;

  // Inline array: [a, b, c]  or  [a,b,c]  — no nested arrays supported.
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map((item) => parseScalar(item));
  }

  // Quoted string.
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }

  // Number.
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);

  return s;
}

// ── Scoring hints extraction from body ──────────────────────────────────────
// Style files are not yet required to carry explicit scoring_hints in their
// frontmatter. To keep the index useful for the selection algorithm's scoring
// stage (Step 4), we derive hints from conventional body headings when
// present: "## Best for", "## Product fit", "### Product fit", etc.
//
// If none of the patterns match, scoring_hints is omitted entirely from the
// entry (kept out of JSON rather than written as empty object) to minimise
// index size.
const HINT_HEADING_PATTERNS = [
  /^#{2,3}\s*Best\s+for\s*$/i,
  /^#{2,3}\s*Product\s+fit\s*$/i,
  /^#{2,3}\s*Scoring\s+hints\s*$/i,
];

// Keywords we look for inside the hint-section body and what axis they map to.
// Matching is case-insensitive whole-word within bullet-list lines.
const ARCHETYPE_TOKENS = new Set([
  'saas', 'consumer', 'editorial', 'developer', 'luxury', 'playful', 'ecommerce',
  'fintech', 'healthcare', 'enterprise', 'creative', 'agency', 'portfolio',
]);
const DENSITY_TOKENS = new Set(['sparse', 'balanced', 'dense', 'power', 'casual']);
const TONE_TOKENS = new Set([
  'corporate', 'neutral', 'warm', 'bold', 'irreverent', 'serious',
  'friendly', 'minimal', 'maximal',
]);

function extractScoringHints(body) {
  const lines = body.split(/\r?\n/);
  let insideHintSection = false;
  let hintLines = [];

  for (const line of lines) {
    if (HINT_HEADING_PATTERNS.some((re) => re.test(line.trim()))) {
      insideHintSection = true;
      continue;
    }
    // Any new heading closes the current hint section.
    if (insideHintSection && /^#{1,6}\s/.test(line)) {
      insideHintSection = false;
      continue;
    }
    if (insideHintSection) hintLines.push(line.toLowerCase());
  }

  if (hintLines.length === 0) return null;

  const words = hintLines
    .join(' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const archetypes = [...new Set(words.filter((w) => ARCHETYPE_TOKENS.has(w)))];
  const densities = [...new Set(words.filter((w) => DENSITY_TOKENS.has(w)))];
  const tones = [...new Set(words.filter((w) => TONE_TOKENS.has(w)))];

  if (archetypes.length === 0 && densities.length === 0 && tones.length === 0) return null;

  const out = {};
  if (archetypes.length) out.product_archetypes = archetypes.sort();
  if (densities.length) out.audience_density = densities.sort();
  if (tones.length) out.brand_tones = tones.sort();
  return out;
}

// ── Per-file entry builder ──────────────────────────────────────────────────
function buildEntry(absPath) {
  const src = readFileSync(absPath, 'utf8');
  const fm = parseFrontmatter(src);
  if (!fm) return { error: 'no-frontmatter', path: absPath };

  // Derive path-relative to repo root, with forward slashes so the index is
  // portable across OSes (Windows backslashes would leak into JSON otherwise).
  const rel = relative(repoRoot, absPath).split(sep).join('/');

  const id = fm.id || null;
  if (!id) return { error: 'no-id', path: absPath };

  // Category: prefer frontmatter, fall back to parent directory name.
  const parentDir = absPath.split(sep).slice(-2, -1)[0];
  const category = fm.category || parentDir;

  const entry = {
    id,
    category,
    path: rel,
  };

  if (fm.motion_tier) entry.motion_tier = fm.motion_tier;
  if (fm.density) entry.density = fm.density;
  if (Array.isArray(fm.locale_fit) && fm.locale_fit.length) {
    entry.locale_fit = [...fm.locale_fit].sort();
  }
  if (Array.isArray(fm.palette_tags) && fm.palette_tags.length) {
    entry.palette_tags = [...fm.palette_tags].sort();
  }
  if (Array.isArray(fm.keywords) && fm.keywords.length) {
    entry.keywords = [...fm.keywords].sort();
  }

  if (fm.accessibility && typeof fm.accessibility === 'object') {
    const a = {};
    if (fm.accessibility.contrast_floor != null) a.contrast_floor = fm.accessibility.contrast_floor;
    if (fm.accessibility.contrast_floor_apca != null) a.apca_body_lc = fm.accessibility.contrast_floor_apca;
    if (fm.accessibility.touch_target != null) a.touch_target_px = fm.accessibility.touch_target;
    if (fm.accessibility.reduced_motion != null) a.reduced_motion = fm.accessibility.reduced_motion;
    if (Object.keys(a).length) entry.accessibility = a;
  }

  // Body-derived scoring hints (optional — omit the field if nothing found).
  const bodyStart = src.indexOf('\n---', 3);
  if (bodyStart !== -1) {
    const body = src.slice(bodyStart + 4);
    const hints = extractScoringHints(body);
    if (hints) entry.scoring_hints = hints;
  }

  return entry;
}

// ── Deterministic JSON serialisation ───────────────────────────────────────
// Minified (no pretty-printing): this file is meant to be fed into LLM
// prompts where every byte is a token fragment. Use `jq .` locally if you
// need to read it by eye. JSON.stringify preserves insertion order for
// string keys on modern engines (Node 18+), so by building every entry with
// a fixed key sequence we get a stable serialisation without needing a
// custom replacer.
function stableStringify(value) {
  return JSON.stringify(value) + '\n';
}

// ── Main ───────────────────────────────────────────────────────────────────
function main() {
  if (!existsSync(stylesRoot)) {
    console.error(`styles root not found: ${stylesRoot}`);
    process.exit(1);
  }

  const files = walkMarkdown(stylesRoot).sort();
  const entries = [];
  const errors = [];

  for (const f of files) {
    const e = buildEntry(f);
    if (e.error) errors.push(e);
    else entries.push(e);
  }

  // Sort entries by id for a deterministic, human-diffable index.
  entries.sort((a, b) => a.id.localeCompare(b.id));

  const serialised = stableStringify(entries);
  const sizeBytes = Buffer.byteLength(serialised, 'utf8');

  if (checkOnly) {
    if (!existsSync(outPath)) {
      console.error(`[check] index does not exist — run without --check first`);
      process.exit(1);
    }
    const onDisk = readFileSync(outPath, 'utf8');
    if (onDisk === serialised) {
      console.error(`[check] OK — index is up to date (${entries.length} entries, ${sizeBytes}B)`);
      process.exit(0);
    } else {
      console.error(`[check] DRIFT — index out of sync with style files`);
      console.error(`        run: node scripts/build-styles-index.mjs`);
      process.exit(1);
    }
  }

  // Atomic write: temp file in the same directory, then rename.
  const tmp = outPath + '.tmp';
  writeFileSync(tmp, serialised, 'utf8');
  renameSync(tmp, outPath);

  const avgEntryBytes = Math.round(sizeBytes / Math.max(entries.length, 1));
  const largestEntry = entries
    .map((e) => ({ id: e.id, bytes: Buffer.byteLength(JSON.stringify(e), 'utf8') }))
    .sort((a, b) => b.bytes - a.bytes)[0];

  console.error(`Indexed ${entries.length} styles → ${relative(repoRoot, outPath).split(sep).join('/')}`);
  console.error(`  total size:      ${sizeBytes}B (${(sizeBytes / 1024).toFixed(1)}KB)`);
  console.error(`  avg per entry:   ${avgEntryBytes}B`);
  console.error(`  largest entry:   ${largestEntry.id} (${largestEntry.bytes}B)`);
  if (errors.length) {
    console.error(`  skipped:         ${errors.length} file(s) with parse errors:`);
    for (const e of errors) {
      console.error(`    - ${relative(repoRoot, e.path)}: ${e.error}`);
    }
    process.exit(2);
  }

  // Soft warnings against the sprint's stated targets. We do not fail the
  // build — the build is useful even if a target is missed; the warning lets
  // a future sprint decide whether to tighten.
  if (sizeBytes > 25 * 1024) {
    console.error(`  WARN: total exceeds 25KB token budget target (actual: ${(sizeBytes / 1024).toFixed(1)}KB)`);
  }
  if (largestEntry.bytes > 500) {
    console.error(`  WARN: largest entry exceeds 500B cap (${largestEntry.id}: ${largestEntry.bytes}B)`);
  }
}

main();
