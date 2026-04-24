#!/usr/bin/env node
// Builds skills/visionary/styles/_embeddings.json — 8-dimensional aesthetic
// embeddings for every style in the catalogue. Sprint 4 Task 11.1.
//
// Consumed by the orthogonal-variants selection in commands/variants.md
// (Task 11.2): the runtime picks variant 1 via the normal weighted scoring,
// then filters candidates for variants 2 and 3 by cosine distance >= 0.6
// from already-picked variants. Without a meaningful embedding space, the
// three variants converge onto near-neighbours and fail the sprint-4 DoD
// "three variants feel meaningfully different" test.
//
// Axes (all 0..1):
//   1. density            spacious (0) → data-dense (1)
//   2. chroma             muted (0) → saturated (1)
//   3. formality          playful (0) → corporate (1)
//   4. motion_intensity   static (0) → kinetic (1)
//   5. historicism        ahistorical (0) → period-specific (1)
//   6. texture            clean (0) → material (1)
//   7. contrast_energy    low-contrast (0) → high-contrast (1)
//   8. type_drama         neutral-typography (0) → expressive-typography (1)
//
// Two modes:
//   default         — heuristic. Frontmatter + keyword + body-keyword scoring.
//                     Deterministic, dep-free, instant. Used for every CI run.
//                     Good-enough spot-check: neobrutalism-softened neighbours
//                     bauhaus-dessau closer than glassmorphism.
//   --llm <path>    — (future) invoke Haiku batch against each style body for
//                     finer-grained values. Reads API key from ANTHROPIC_API_KEY.
//                     Stubbed today — the callsite emits a warning and falls
//                     back to the heuristic. Kept in the signature so Sprint 5
//                     can wire it without rewriting the entrypoint.
//
// Overrides:
//   scripts/style-embedding-overrides.json (optional, git-tracked)
//   { "<style-id>": [0.8, 0.3, 0.2, 0.9, 0.2, 0.5, 0.8, 0.7], ... }
//   Any style present in this file gets its vector replaced wholesale. Used
//   when a heuristic mis-classifies and a human wants to lock the value.
//
// Usage:
//   node scripts/build-style-embeddings.mjs
//   node scripts/build-style-embeddings.mjs --check    # drift-guard
//   node scripts/build-style-embeddings.mjs --verbose  # per-style breakdown
//   node scripts/build-style-embeddings.mjs --llm haiku  # stub (falls back)

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const stylesRoot = join(repoRoot, 'skills', 'visionary', 'styles');
const outPath = join(stylesRoot, '_embeddings.json');
const overridesPath = join(repoRoot, 'scripts', 'style-embedding-overrides.json');

const checkOnly = process.argv.includes('--check');
const verbose = process.argv.includes('--verbose');
const llmFlag = process.argv.includes('--llm');

// Axis order — MUST stay stable; downstream consumers rely on position.
export const AXES = Object.freeze([
  'density',
  'chroma',
  'formality',
  'motion_intensity',
  'historicism',
  'texture',
  'contrast_energy',
  'type_drama',
]);

const clamp01 = (n) => Math.max(0, Math.min(1, n));

// ── File walker ─────────────────────────────────────────────────────────────
function walkMarkdown(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walkMarkdown(full));
    else if (s.isFile() && entry.endsWith('.md') && entry !== '_index.md') out.push(full);
  }
  return out;
}

// ── Minimal YAML frontmatter parser ─────────────────────────────────────────
// Duplicated from build-styles-index.mjs deliberately. The repo has no
// package.json and we do not pull in a full YAML parser for one script.
function parseFrontmatter(src) {
  if (!src.startsWith('---')) return { fm: null, body: src };
  const end = src.indexOf('\n---', 3);
  if (end === -1) return { fm: null, body: src };
  const body = src.slice(end + 4);
  const fmText = src.slice(3, end).replace(/^\r?\n/, '');
  const lines = fmText.split(/\r?\n/);
  const result = {};
  let currentMap = null;
  for (const raw of lines) {
    if (raw.trim() === '' || raw.trim().startsWith('#')) continue;
    if (/^\s{2,}\S/.test(raw) && currentMap) {
      const m = raw.trim().match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (m) currentMap[m[1]] = parseScalar(m[2]);
      continue;
    }
    const m = raw.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) { currentMap = null; continue; }
    const [, key, rest] = m;
    if (rest === '') {
      currentMap = result[key] = {};
    } else {
      result[key] = parseScalar(rest);
      currentMap = null;
    }
  }
  return { fm: result, body };
}

function parseScalar(raw) {
  const t = raw.trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t.startsWith('[') && t.endsWith(']')) {
    return t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean).map(parseScalar);
  }
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

// ── Axis scorers ────────────────────────────────────────────────────────────
// Every scorer returns a 0..1 number. They are intentionally simple — the
// override file catches mis-classifications; we optimise for debuggability
// over cleverness.

function scoreDensity({ fm }) {
  if (fm?.density === 'dense') return 0.85;
  if (fm?.density === 'sparse') return 0.2;
  return 0.5;
}

function scoreChroma({ fm, body, keywords }) {
  const tags = fm?.palette_tags || [];
  const saturated = ['neon', 'vibrant', 'dopamine', 'technicolor', 'saturated'];
  const muted = ['muted', 'monochrome', 'grayscale', 'pastel', 'earth', 'neutral'];
  let s = 0.5;
  for (const t of tags) {
    if (saturated.includes(t)) s += 0.2;
    if (muted.includes(t)) s -= 0.2;
  }
  if (/\bneon\b|\bsaturation:\s*high/i.test(body)) s += 0.1;
  if (/\bpastel\b|\bmuted\b|\bdesaturated\b/i.test(body)) s -= 0.1;
  if (keywords.some((k) => saturated.some((sat) => k.includes(sat)))) s += 0.1;
  return clamp01(s);
}

function scoreFormality({ fm, body, keywords }) {
  const playful = ['playful', 'whimsical', 'dopamine', 'bubblegum', 'goblincore', 'naive', 'storybook', 'disco', 'fiesta'];
  const formal = ['corporate', 'corpcore', 'legal', 'bloomberg', 'fintech', 'enterprise', 'b2b', 'clinical', 'pharmaceutical', 'editorial-legal'];
  let s = 0.5;
  for (const k of keywords) {
    if (playful.some((p) => k.includes(p))) s -= 0.2;
    if (formal.some((f) => k.includes(f))) s += 0.2;
  }
  if (fm?.category === 'industry') s += 0.1;
  if (fm?.category === 'emotional' && !keywords.some((k) => formal.some((f) => k.includes(f)))) s -= 0.05;
  if (/\bbrutal(ist|ism)?\b/i.test(body) && !/\bcorporate-brutalist\b/i.test(body)) s -= 0.15;
  return clamp01(s);
}

function scoreMotionIntensity({ fm }) {
  const tier = fm?.motion_tier;
  if (tier === 'Static') return 0.05;
  if (tier === 'Subtle') return 0.33;
  if (tier === 'Expressive') return 0.67;
  if (tier === 'Kinetic') return 0.95;
  return 0.5;
}

function scoreHistoricism({ fm, body, keywords }) {
  if (fm?.category === 'historical') return 0.9;
  const periodMarkers = [
    'victorian', 'art-deco', 'art-nouveau', 'retrofuturism', 'y2k', 'dada', 'constructivism',
    'bauhaus', 'memphis', 'swiss', 'psychedelic', 'pop-art', 'postmodern', 'de-stijl',
    'zoetrope', 'early-cinema', 'letterpress', 'microfilm', 'archive', 'catalog-archive',
    'zoetrope', 'op-art', 'futurism', 'new-wave', 'dieter-rams', 'eastern-european-brutalist',
  ];
  const kwJoined = keywords.join(' ');
  let s = 0.15;
  for (const marker of periodMarkers) {
    if (kwJoined.includes(marker)) s = Math.max(s, 0.7);
  }
  if (fm?.category === 'modern') s = Math.min(s, 0.2);
  if (/\b(heritage|vintage|archival|period-specific)\b/i.test(body)) s += 0.1;
  return clamp01(s);
}

function scoreTexture({ fm, body, keywords }) {
  const textural = [
    'grainy', 'grain', 'letterpress', 'emboss', 'paper', 'wood', 'stone', 'terrazzo',
    'clay', 'ceramic', 'metal', 'chrome', 'glass', 'marble', 'fabric', 'risograph',
    'screen-print', 'blob', 'mycelium', 'mineral', 'smoked-glass',
  ];
  const clean = [
    'minimalism', 'minimal', 'flat', 'swiss', 'dieter-rams', 'clinical',
    'pharmaceutical', 'editorial', 'japanese-minimalism', 'developer-tools',
  ];
  const kwJoined = keywords.join(' ');
  let s = 0.3;
  for (const t of textural) if (kwJoined.includes(t)) s += 0.15;
  for (const c of clean) if (kwJoined.includes(c)) s -= 0.1;
  const bodyTextural = (body.match(/\b(noise|grain|texture|crosshatch|stipple|emboss|bevel|film-grain)\b/gi) || []).length;
  s += Math.min(0.15, bodyTextural * 0.03);
  if (fm?.category === 'morphisms') s += 0.1;
  return clamp01(s);
}

function scoreContrastEnergy({ fm, body, keywords }) {
  const highEnergy = [
    'brutalist', 'brutalism', 'brutalist-honesty', 'anxiety', 'urgency', 'dopamine',
    'neon', 'cyberpunk', 'synthwave', 'bold', 'op-art', 'pop-art',
    'new-wave', 'punk', 'y2k', 'dystopia', 'dada', 'psychedelic',
  ];
  const lowEnergy = [
    'soft', 'pastel', 'muted', 'coastal', 'hygge', 'zen', 'romantic',
    'calm', 'clinical', 'pharmaceutical', 'melancholic', 'nordic', 'quiet',
    'japanese-minimalism',
  ];
  const kwJoined = keywords.join(' ');
  let s = 0.5;
  for (const h of highEnergy) if (kwJoined.includes(h)) s += 0.15;
  for (const l of lowEnergy) if (kwJoined.includes(l)) s -= 0.12;
  const cf = fm?.accessibility?.contrast_floor;
  if (typeof cf === 'number' && cf >= 7) s += 0.1;
  return clamp01(s);
}

function scoreTypeDrama({ fm, body, keywords }) {
  const dramatic = [
    'editorial', 'serif-revival', 'calligraphic', 'arabic-calligraphic',
    'letterpress', 'expressive', 'display', 'dada', 'memphis',
    'psychedelic', 'brutalist', 'zoetrope', 'typography', 'newspaper-editorial',
    'poster', 'chaos', 'packaging-collage',
  ];
  const neutral = [
    'dieter-rams', 'swiss-rationalism', 'developer-tools', 'bloomberg',
    'clinical', 'pharmaceutical', 'minimalism',
  ];
  const kwJoined = keywords.join(' ');
  let s = 0.4;
  for (const d of dramatic) if (kwJoined.includes(d)) s += 0.18;
  for (const n of neutral) if (kwJoined.includes(n)) s -= 0.18;
  if (/Display font:\s*\*\*(Fraktur|Playfair|Bodoni|Didot|Marcellus|Cinzel|Unifraktur|Bebas|Archivo Black|Big Shoulders|Redaction)/i.test(body)) {
    s += 0.1;
  }
  if (fm?.category === 'typography') s += 0.1;
  return clamp01(s);
}

const SCORERS = Object.freeze({
  density:          scoreDensity,
  chroma:           scoreChroma,
  formality:        scoreFormality,
  motion_intensity: scoreMotionIntensity,
  historicism:      scoreHistoricism,
  texture:          scoreTexture,
  contrast_energy:  scoreContrastEnergy,
  type_drama:       scoreTypeDrama,
});

// ── Main computation ────────────────────────────────────────────────────────
function computeEmbedding({ fm, body, keywords, id }) {
  const ctx = { fm, body, keywords, id };
  return AXES.map((axis) => {
    const v = SCORERS[axis](ctx);
    if (typeof v !== 'number' || Number.isNaN(v)) return 0.5;
    return +v.toFixed(3);
  });
}

function extractKeywords({ fm, id, body }) {
  // Frontmatter-declared keywords are weakest — many style files only list 2-3,
  // which leaves heuristic scorers stranded at the 0.5 default. Augment with:
  //   - the style id itself + every hyphen-segment
  //   - category
  //   - palette tags
  //   - top-level body markers (display font name, elevation model, etc.)
  // This is a *signal expansion* pass, not a taxonomy — duplicates are fine.
  const kw = new Set();
  for (const k of Array.isArray(fm?.keywords) ? fm.keywords : []) kw.add(String(k));
  kw.add(id);
  for (const seg of id.split('-')) if (seg.length >= 3) kw.add(seg);
  if (fm?.category) kw.add(String(fm.category));
  for (const tag of Array.isArray(fm?.palette_tags) ? fm.palette_tags : []) kw.add(String(tag));

  // Body scraper — only pick well-known signal tokens. Cheap ~O(body_len).
  const bodyTokens = [
    'brutalist', 'brutalism', 'maximalist', 'maximalism', 'minimalist', 'minimalism',
    'editorial', 'playful', 'whimsical', 'corporate', 'enterprise', 'clinical',
    'letterpress', 'grain', 'grainy', 'emboss', 'textural', 'tactile',
    'neon', 'saturated', 'muted', 'pastel', 'monochrome', 'desaturated',
    'expressive', 'dramatic', 'display-face', 'serif-revival',
    'kinetic', 'static', 'ambient',
    'historical', 'period-specific', 'retrofuturism', 'heritage',
    'dense', 'spacious', 'data-dense', 'compact',
    'glass', 'chrome', 'metal', 'wood', 'stone', 'paper', 'marble', 'fabric',
    'high-contrast', 'low-contrast', 'punchy',
  ];
  const lowered = body.toLowerCase();
  for (const token of bodyTokens) {
    if (lowered.includes(token)) kw.add(token);
  }
  return [...kw];
}

// ── Overrides ───────────────────────────────────────────────────────────────
function loadOverrides() {
  if (!existsSync(overridesPath)) return {};
  try {
    const raw = JSON.parse(readFileSync(overridesPath, 'utf8'));
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      if (Array.isArray(v) && v.length === AXES.length && v.every((n) => typeof n === 'number')) {
        out[k] = v.map((n) => +clamp01(n).toFixed(3));
      }
    }
    return out;
  } catch {
    return {};
  }
}

// ── Build ───────────────────────────────────────────────────────────────────
function buildEmbeddings() {
  const files = walkMarkdown(stylesRoot);
  const overrides = loadOverrides();
  const embeddings = {};
  const breakdown = [];

  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    const { fm, body } = parseFrontmatter(src);
    if (!fm || !fm.id) continue;
    const id = String(fm.id);
    const keywords = extractKeywords({ fm, id, body });

    if (overrides[id]) {
      embeddings[id] = overrides[id];
      if (verbose) breakdown.push({ id, source: 'override', vector: overrides[id] });
    } else {
      const vec = computeEmbedding({ fm, body, keywords, id });
      embeddings[id] = vec;
      if (verbose) breakdown.push({ id, source: 'heuristic', vector: vec });
    }

    // Debug — expose keyword pool when verbose
    if (verbose && breakdown.length <= 3) {
      breakdown[breakdown.length - 1].keywords = keywords.slice(0, 12);
    }
  }

  // Stable sort by id so serialisation is deterministic.
  const sorted = {};
  for (const id of Object.keys(embeddings).sort()) sorted[id] = embeddings[id];

  return { embeddings: sorted, breakdown };
}

function stableStringify(obj) {
  const meta = {
    schema_version: '1.0.0',
    axes: AXES,
    count: Object.keys(obj).length,
    generated_by: 'scripts/build-style-embeddings.mjs',
  };
  // Emit meta + embeddings in a predictable top-level shape.
  return JSON.stringify({ meta, embeddings: obj }) + '\n';
}

// ── Cosine helper (exported for tests / variants runtime) ───────────────────
export function cosineDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 1;
  if (a.length !== b.length) return 1;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 1;
  const sim = dot / (Math.sqrt(na) * Math.sqrt(nb));
  return 1 - sim;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function main() {
  if (llmFlag) {
    console.error('[warn] --llm mode is not yet wired (Sprint 5 scope). Falling back to heuristic.');
  }

  const { embeddings, breakdown } = buildEmbeddings();
  const json = stableStringify(embeddings);

  if (checkOnly) {
    if (!existsSync(outPath)) {
      console.error('[check] FAIL — _embeddings.json missing');
      process.exit(1);
    }
    const onDisk = readFileSync(outPath, 'utf8');
    if (onDisk !== json) {
      console.error('[check] FAIL — regenerated embeddings differ from committed file');
      console.error('        run: node scripts/build-style-embeddings.mjs');
      process.exit(1);
    }
    console.log(`[check] OK — embeddings up to date (${Object.keys(embeddings).length} styles, ${json.length}B)`);
    return;
  }

  writeFileSync(outPath, json);
  console.log(`Built embeddings for ${Object.keys(embeddings).length} styles → ${relative(repoRoot, outPath).split(sep).join('/')}`);
  console.log(`  axes:         ${AXES.length} — ${AXES.join(', ')}`);
  console.log(`  total size:   ${json.length}B (${(json.length / 1024).toFixed(1)}KB)`);
  console.log(`  overrides:    ${Object.keys(loadOverrides()).length}`);
  if (verbose) {
    for (const b of breakdown.slice(0, 5)) {
      console.log(`  ${b.id.padEnd(32)} [${b.source}]`);
      b.vector.forEach((v, i) => {
        console.log(`    ${AXES[i].padEnd(18)} ${v.toFixed(3)}`);
      });
    }
    console.log(`  ... (truncated at 5 of ${breakdown.length})`);
  }
}

// Only run main when invoked directly — not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/') || process.argv[1]?.endsWith('build-style-embeddings.mjs')) {
  main();
}
