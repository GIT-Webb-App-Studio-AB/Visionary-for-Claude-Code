#!/usr/bin/env node
// infer-kit-from-ts.mjs — Sprint 07 Task 21.2.
//
// Scans a project's TypeScript sources for exported `interface` and `type`
// declarations and emits a visionary-kit.json draft. The kit is a starting
// point, not a finished artifact — the caller is expected to hand-edit
// sample values and tune constraints before committing.
//
// Scope (MVP): regex-based extraction suitable for the common case:
//   - `export interface Foo { field: Type; ... }`
//   - `export type Bar = { field: Type; ... }`
//   - simple/primitive field types: string, number, boolean, Date, arrays
//   - nullable via `field?:` or `| null`
//
// NOT supported in v1.0 (falls back to sampler.sampleByType):
//   - unions beyond `T | null`
//   - intersections
//   - generics (parameters stripped)
//   - imports / cross-file resolution
//
// These limitations are acceptable because the kit is a starting point; the
// advanced cases almost always need hand-authored samples anyway.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, basename, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findProjectRoot } from '../hooks/scripts/lib/taste-io.mjs';
import { sampleFor, constraintsFor } from '../hooks/scripts/lib/kit-sampler.mjs';

const DEFAULT_EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next', 'coverage',
  '__tests__', 'test', 'tests', 'spec', 'specs', '.turbo', '.cache',
]);
const TS_EXT = new Set(['.ts', '.tsx']);

// ── CLI ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = {
    root: null,
    tsconfig: null,
    entityPattern: null,
    maxFiles: 500,
    locale: null,
    write: false,
    force: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--root': opts.root = next(); break;
      case '--tsconfig': opts.tsconfig = next(); break;
      case '--entity-pattern': opts.entityPattern = new RegExp(next()); break;
      case '--max-files': opts.maxFiles = parseInt(next(), 10); break;
      case '--locale': opts.locale = next(); break;
      case '--write': opts.write = true; break;
      case '--force': opts.force = true; break;
      case '--help': case '-h':
        console.error(`
infer-kit-from-ts — extract visionary-kit.json from TS exports

Usage: node scripts/infer-kit-from-ts.mjs [options]

Options:
  --root <dir>            Project to scan (default: cwd)
  --tsconfig <path>       tsconfig.json (default: <root>/tsconfig.json)
  --entity-pattern <re>   Filter by entity name (regex)
  --max-files <n>         File-count safety cap (default 500)
  --locale <tag>          sv|de|fr|es|en (default: detect)
  --write                 Write visionary-kit.json (default: stdout)
  --force                 Overwrite existing kit
`.trim());
        process.exit(0);
    }
  }
  return opts;
}

// ── File discovery ──────────────────────────────────────────────────────────
// Very lightweight tsconfig support: we honour `include` and `exclude` if
// present, otherwise scan everything outside DEFAULT_EXCLUDE_DIRS.

function loadTsconfigDirs(tsconfigPath) {
  if (!tsconfigPath || !existsSync(tsconfigPath)) {
    return { include: null, exclude: null };
  }
  try {
    // tsconfig.json typically has comments/trailing commas; strip them
    // before JSON.parse. For gnarly cases the user can pass explicit flags.
    let raw = readFileSync(tsconfigPath, 'utf8');
    raw = raw.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/,(\s*[}\]])/g, '$1');
    const cfg = JSON.parse(raw);
    return {
      include: Array.isArray(cfg.include) ? cfg.include : null,
      exclude: Array.isArray(cfg.exclude) ? cfg.exclude : null,
    };
  } catch { return { include: null, exclude: null }; }
}

function walkFiles(root, opts, tsconfigDirs) {
  const files = [];
  const queue = [root];
  const isExcluded = (path) => {
    const rel = relative(root, path).split(/[\\/]/)[0];
    if (!rel) return false;
    if (DEFAULT_EXCLUDE_DIRS.has(rel)) return true;
    if (Array.isArray(tsconfigDirs.exclude)) {
      for (const e of tsconfigDirs.exclude) {
        if (path.includes(e.replace(/[*?].*$/, ''))) return true;
      }
    }
    return false;
  };
  while (queue.length && files.length < opts.maxFiles) {
    const dir = queue.shift();
    let entries;
    try { entries = readdirSync(dir); } catch { continue; }
    for (const e of entries) {
      const full = join(dir, e);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) {
        if (isExcluded(full)) continue;
        queue.push(full);
      } else if (st.isFile()) {
        if (!TS_EXT.has(extname(full))) continue;
        if (full.endsWith('.d.ts')) continue;
        files.push(full);
      }
    }
  }
  return files;
}

// ── Type declaration extractor ──────────────────────────────────────────────
// Regex-based, scoped to exported interface + type-alias-with-object-literal.

const INTERFACE_RE = /\bexport\s+interface\s+([A-Za-z_]\w*)(?:<[^>]*>)?\s*(?:extends\s+[^{]*)?\{([\s\S]*?)\n\}/g;
const TYPE_ALIAS_RE = /\bexport\s+type\s+([A-Za-z_]\w*)(?:<[^>]*>)?\s*=\s*\{([\s\S]*?)\n\}/g;

function extractEntitiesFromFile(source, filePath) {
  const out = [];
  for (const [, name, body] of source.matchAll(INTERFACE_RE)) {
    out.push({ name, fields: parseBody(body), from: filePath });
  }
  for (const [, name, body] of source.matchAll(TYPE_ALIAS_RE)) {
    out.push({ name, fields: parseBody(body), from: filePath });
  }
  return out;
}

function parseBody(body) {
  const fields = [];
  // Strip nested braces to simplify field parsing (nested → "object").
  const flat = body.replace(/\{[^}]*\}/g, 'object');
  const lines = flat.split(/[\n;]+/);
  const FIELD_LINE = /^(?:readonly\s+)?(['"]?)([A-Za-z_]\w*)\1\s*(\??):\s*(.+)$/;
  for (const raw of lines) {
    const line = raw.trim().replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!line) continue;
    const m = line.match(FIELD_LINE);
    if (!m) continue;
    const [, , name, optional, type] = m;
    const isOptional = optional === '?';
    const normType = normaliseType(type, isOptional);
    fields.push({ name, type: normType, optional: isOptional });
  }
  return fields;
}

function normaliseType(type, isOptional) {
  let t = type.trim().replace(/;\s*$/, '').trim();
  t = t.replace(/,$/, '').trim();
  // `T | null` → nullable T
  if (/\|\s*null\b/.test(t)) {
    t = t.replace(/\s*\|\s*null\b/g, '').trim();
    isOptional = true;
  }
  if (/\|\s*undefined\b/.test(t)) {
    t = t.replace(/\s*\|\s*undefined\b/g, '').trim();
    isOptional = true;
  }
  // Arrays: T[] / Array<T>
  const arrayMatch = t.match(/^Array\s*<(.+)>$/);
  if (arrayMatch) {
    const inner = arrayMatch[1].trim();
    return (isOptional ? inner + '?' : inner) + '[]';
  }
  if (t.endsWith('[]')) return isOptional ? t.slice(0, -2) + '?[]' : t;
  return isOptional ? t + '?' : t;
}

// ── Entity → kit-entity mapper ──────────────────────────────────────────────
function entityToKitEntity({ name, fields, locale, sampleCount = 3 }) {
  const sample = [];
  for (let i = 0; i < sampleCount; i++) {
    const row = {};
    for (const f of fields) {
      row[f.name] = sampleFor({
        entityName: name, fieldName: f.name, type: f.type,
        locale, index: i,
      });
    }
    sample.push(row);
  }
  const constraints = {};
  for (const f of fields) {
    const c = constraintsFor({ fieldName: f.name, type: f.type, locale });
    if (c) constraints[f.name] = c;
  }
  const out = { sample };
  if (Object.keys(constraints).length) out.constraints = constraints;
  return out;
}

// ── Main ────────────────────────────────────────────────────────────────────
function main() {
  const opts = parseArgs(process.argv.slice(2));
  const root = resolve(opts.root || findProjectRoot(process.cwd()));
  const tsconfigPath = resolve(opts.tsconfig || join(root, 'tsconfig.json'));
  const tsconfigDirs = loadTsconfigDirs(tsconfigPath);
  const files = walkFiles(root, opts, tsconfigDirs);

  if (!files.length) {
    console.error(`No .ts/.tsx files found under ${root}`);
    process.exit(1);
  }

  const seen = new Map();
  for (const f of files) {
    let src;
    try { src = readFileSync(f, 'utf8'); } catch { continue; }
    const entities = extractEntitiesFromFile(src, f);
    for (const e of entities) {
      if (opts.entityPattern && !opts.entityPattern.test(e.name)) continue;
      if (!seen.has(e.name)) seen.set(e.name, e);
    }
  }

  if (seen.size === 0) {
    console.error(`No exported interface/type declarations found in ${files.length} file(s).`);
    console.error('Tip: --entity-pattern lets you narrow or widen the match.');
    process.exit(1);
  }

  const locale = opts.locale || detectLocale(root) || 'en';

  const kit = {
    $schema: 'https://visionary-claude.dev/schemas/visionary-kit.schema.json',
    schema_version: '1.0.0',
    locale,
    inferred_from: 'ts',
    entities: {},
    component_constraints: {
      table: { p50_rows: 12, p95_rows: 47, max_rows: 500 },
      list: { empty_rate: 0.18, p95_rows: 30 },
    },
    required_states: ['loading', 'empty', 'error', 'populated'],
  };
  for (const { name, fields } of seen.values()) {
    kit.entities[name] = entityToKitEntity({ name, fields, locale });
  }

  const outJson = JSON.stringify(kit, null, 2) + '\n';
  if (opts.write) {
    const target = join(root, 'visionary-kit.json');
    if (existsSync(target) && !opts.force) {
      console.error(`visionary-kit.json already exists at ${target}. Re-run with --force to overwrite.`);
      process.exit(1);
    }
    writeFileSync(target, outJson, 'utf8');
    console.log(`Inferred ${seen.size} entities from ${files.length} file(s) → ${target}`);
    console.log('Review and hand-edit before first generation. See docs/content-kits.md.');
  } else {
    process.stdout.write(outJson);
  }
}

function detectLocale(root) {
  const existingKit = join(root, 'visionary-kit.json');
  if (existsSync(existingKit)) {
    try {
      const k = JSON.parse(readFileSync(existingKit, 'utf8'));
      if (k?.locale) return k.locale;
    } catch { /* ignore */ }
  }
  const pkgPath = join(root, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      if (pkg?.language) return pkg.language;
    } catch { /* ignore */ }
  }
  return null;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  try { main(); }
  catch (e) { console.error('ts inference failed:', e.message); process.exit(1); }
}

export {
  extractEntitiesFromFile, parseBody, normaliseType, entityToKitEntity,
};
