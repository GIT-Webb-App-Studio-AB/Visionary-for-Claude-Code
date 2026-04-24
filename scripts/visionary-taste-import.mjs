#!/usr/bin/env node
// visionary-taste-import.mjs — Sprint 07 Task 20.3.
//
// Imports a `.taste` dotfile into the current project's flywheel. Handles:
//   - local paths, http(s) URLs, and bare handles
//   - inherits_from resolution with cycle detection
//   - merge semantics: local user facts always win on conflict
//   - URL fetches with allowlist + 50 KB cap + redirect cap
//   - dry-run mode
//
// Also exposes the `browse` subcommand (Task 20.5 MVP).
//
// CLI:
//   node scripts/visionary-taste-import.mjs <source> [options]
//   node scripts/visionary-taste-import.mjs browse [--search <query>]
//
//   <source> is one of:
//     ./local/path.taste         # file on disk
//     https://host/path.taste    # remote (must pass allowlist)
//     pawelk-2026-04              # bare handle (resolved via community index)
//
//   Options:
//     --dry-run                   Print the plan, do not write
//     --allow <domain>            Add domain to URL allowlist (single use)
//     --no-network                Forbid URL + handle resolution
//     --multiplier <0.1-1.0>      Override IMPORT_MULTIPLIER (default 0.6)
//     --help                      Show this message

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

import {
  findProjectRoot, projectKey as deriveProjectKey,
  readFacts, readPairs, factKey, ulid, nowIso,
  ensureTasteDir, atomicAppend, factsPath, pairsPath,
} from '../hooks/scripts/lib/taste-io.mjs';
import { parse as tomlParse } from '../hooks/scripts/lib/toml-lite.mjs';

// ── Constants ────────────────────────────────────────────────────────────────
const IMPORT_MULTIPLIER_DEFAULT = 0.6;
const URL_MAX_BYTES = 50 * 1024;           // 50 KB
const URL_MAX_REDIRECTS = 3;
const URL_TIMEOUT_MS = 10_000;
const DEFAULT_URL_ALLOWLIST = [
  'github.com', 'raw.githubusercontent.com',
  'gist.github.com', 'gist.githubusercontent.com',
];
const SUPPORTED_SCHEMA_MAJOR = 1;

// Handle regex — must match exporter.
const HANDLE_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;

// ── CLI parse ────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = {
    subcommand: 'import',
    source: null,
    dryRun: false,
    allowDomains: [],
    noNetwork: false,
    multiplier: IMPORT_MULTIPLIER_DEFAULT,
    searchQuery: null,
  };

  // First positional is either the source (import) or the subcommand.
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--dry-run': opts.dryRun = true; break;
      case '--allow': opts.allowDomains.push(normaliseDomain(next())); break;
      case '--no-network': opts.noNetwork = true; break;
      case '--multiplier': opts.multiplier = parseFloat(next()); break;
      case '--search': opts.searchQuery = next(); break;
      case '--help': case '-h': printHelpAndExit(0); break;
      default:
        if (a.startsWith('--')) {
          console.error(`Unknown flag: ${a}`); printHelpAndExit(1);
        }
        positionals.push(a);
    }
  }

  if (positionals[0] === 'browse') {
    opts.subcommand = 'browse';
  } else {
    opts.source = positionals[0] || null;
  }

  if (!Number.isFinite(opts.multiplier) || opts.multiplier < 0.1 || opts.multiplier > 1.0) {
    console.error('--multiplier must be between 0.1 and 1.0');
    printHelpAndExit(1);
  }
  return opts;
}

function printHelpAndExit(code) {
  console.error(`
visionary-taste-import — import a .taste dotfile into the project flywheel

Usage:
  node scripts/visionary-taste-import.mjs <source> [options]
  node scripts/visionary-taste-import.mjs browse [--search <query>]

Sources:
  ./local/path.taste      Local file
  https://…/file.taste    URL (https only, allowlist-gated)
  <handle>                Bare handle (community index lookup)

Options:
  --dry-run               Preview without writing
  --allow <domain>        Extend URL allowlist (repeatable)
  --no-network            Local paths only
  --multiplier <0.1-1.0>  Override import confidence multiplier
  --search <query>        Filter browse output
`.trim());
  process.exit(code);
}

// ── Source loading ───────────────────────────────────────────────────────────
// Returns { raw, displayName, trail } where trail is the list of sources
// visited (for cycle detection messages).

async function loadSource(source, { noNetwork, allowDomains, projectRoot, pluginRoot, resolveFromDir }) {
  if (!source) throw new Error('No source provided. See --help.');

  if (/^https?:\/\//i.test(source)) {
    if (noNetwork) throw new Error(`--no-network forbids URL fetch: ${source}`);
    const raw = await fetchWithPolicy(source, { allowDomains });
    return { raw, displayName: source };
  }

  // Local-path test: the string starts with ./, ../, or an absolute path.
  const looksLikePath = source.startsWith('.') || source.startsWith('/')
    || /^[A-Za-z]:[\\/]/.test(source); // Windows drive letter
  if (looksLikePath) {
    // Relative paths resolve against the importing file's directory, not
    // cwd — matches the behaviour documented in docs/taste-dotfile-spec.md
    // § Inheritance.
    const base = resolveFromDir || process.cwd();
    const abs = resolve(base, source);
    if (!existsSync(abs)) throw new Error(`Local file not found: ${abs}`);
    return { raw: readFileSync(abs, 'utf8'), displayName: abs };
  }

  // Bare handle — look it up. Order:
  //   1. <projectRoot>/designers/<handle>.taste
  //   2. <pluginRoot>/designers/<handle>.taste
  //   3. Community index (only if !noNetwork)
  if (!HANDLE_RE.test(source)) {
    throw new Error(`Not a path, URL, or handle: "${source}". Handles match ${HANDLE_RE}`);
  }

  const candidates = [
    join(projectRoot, 'designers', `${source}.taste`),
    join(pluginRoot, 'designers', `${source}.taste`),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return { raw: readFileSync(p, 'utf8'), displayName: p };
  }

  if (noNetwork) {
    throw new Error(`Handle "${source}" not found locally and --no-network is set.`);
  }

  // Community-index resolution (Task 20.5 MVP).
  const indexUrl = process.env.VISIONARY_TASTE_INDEX
    || 'https://raw.githubusercontent.com/screamm/visionary-tastes/main/index.json';
  const indexRaw = await fetchWithPolicy(indexUrl, { allowDomains, label: 'community index' });
  let index;
  try { index = JSON.parse(indexRaw); }
  catch (e) { throw new Error(`Community index is not valid JSON: ${e.message}`); }
  const entry = Array.isArray(index?.entries) ? index.entries.find((e) => e.handle === source) : null;
  if (!entry || !entry.url) {
    throw new Error(`Handle "${source}" not listed in community index at ${indexUrl}`);
  }
  const raw = await fetchWithPolicy(entry.url, { allowDomains });
  return { raw, displayName: `${source} (${entry.url})` };
}

function normaliseDomain(d) {
  return String(d || '').toLowerCase().replace(/^www\./, '');
}

// ── URL fetcher with policy ──────────────────────────────────────────────────
// Uses globalThis.fetch (Node 18+). Policy enforcement:
//   - scheme must be https
//   - host must be in DEFAULT_URL_ALLOWLIST or --allow list
//   - response size capped at URL_MAX_BYTES (reader aborts)
//   - timeout after URL_TIMEOUT_MS
//   - redirects capped at URL_MAX_REDIRECTS, same-domain only

async function fetchWithPolicy(url, { allowDomains = [], label = 'taste file', redirects = 0 } = {}) {
  const u = new URL(url);
  if (u.protocol !== 'https:') {
    throw new Error(`Refused non-https URL for ${label}: ${u.protocol}//${u.host}`);
  }
  const host = normaliseDomain(u.hostname);
  const allowed = new Set([...DEFAULT_URL_ALLOWLIST, ...allowDomains].map(normaliseDomain));
  if (!allowed.has(host)) {
    throw new Error(`Host "${host}" is not in the URL allowlist. Use --allow ${host} to permit it.`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), URL_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'visionary-taste-import/1.0' },
    });
  } finally { clearTimeout(timer); }

  // Manual redirect handling with same-domain check.
  if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
    if (redirects >= URL_MAX_REDIRECTS) {
      throw new Error(`Too many redirects (${redirects}) for ${label}`);
    }
    const nextUrl = new URL(res.headers.get('location'), url).toString();
    const nextHost = normaliseDomain(new URL(nextUrl).hostname);
    if (nextHost !== host) {
      throw new Error(`Refusing cross-domain redirect: ${host} → ${nextHost}`);
    }
    return fetchWithPolicy(nextUrl, { allowDomains, label, redirects: redirects + 1 });
  }

  if (!res.ok) {
    throw new Error(`${label} fetch failed: HTTP ${res.status} ${res.statusText}`);
  }

  // Stream the body so we can abort past the size cap without pulling the
  // whole payload into memory.
  const reader = res.body?.getReader ? res.body.getReader() : null;
  if (!reader) {
    // Node < 18.17 doesn't have body.getReader — fall back to .text() with
    // a post-read size check. This is the safe-but-lazy path.
    const txt = await res.text();
    if (txt.length > URL_MAX_BYTES) {
      throw new Error(`${label} exceeds ${URL_MAX_BYTES}-byte cap (got ${txt.length})`);
    }
    return txt;
  }
  const chunks = []; let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > URL_MAX_BYTES) {
      try { reader.cancel(); } catch { /* noop */ }
      throw new Error(`${label} exceeds ${URL_MAX_BYTES}-byte cap`);
    }
    chunks.push(value);
  }
  const buf = chunks.length ? concatU8(chunks) : new Uint8Array();
  return new TextDecoder('utf-8').decode(buf);
}

function concatU8(chunks) {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.byteLength; }
  return out;
}

// ── Schema validation ────────────────────────────────────────────────────────
// Permissive validator — required keys are enforced, unknown keys are kept
// with a warning (forward-compat with minor version bumps).

function validateTaste(doc, displayName) {
  const errors = [];
  const warnings = [];
  if (!doc || typeof doc !== 'object') errors.push('Root is not an object');
  if (!doc.schema_version || typeof doc.schema_version !== 'string') {
    errors.push('Missing or invalid schema_version');
  } else {
    const major = parseInt(String(doc.schema_version).split('.')[0], 10);
    if (!Number.isFinite(major)) errors.push(`Invalid schema_version: ${doc.schema_version}`);
    else if (major > SUPPORTED_SCHEMA_MAJOR) {
      errors.push(`Unsupported major version ${major} (this tool understands up to ${SUPPORTED_SCHEMA_MAJOR})`);
    }
  }
  if (!doc.handle || typeof doc.handle !== 'string') errors.push('Missing handle');
  else if (!HANDLE_RE.test(doc.handle)) errors.push(`Handle does not match ${HANDLE_RE}: "${doc.handle}"`);

  if (doc.inherits_from !== undefined && !Array.isArray(doc.inherits_from)) {
    errors.push('inherits_from must be an array');
  }

  if (doc.preferences && typeof doc.preferences !== 'object') {
    errors.push('preferences must be a table');
  }

  if (errors.length) {
    throw new Error(`Invalid .taste (${displayName}):\n  - ${errors.join('\n  - ')}`);
  }
  return { warnings };
}

// ── Inheritance resolution ───────────────────────────────────────────────────
// Left-to-right, depth-first, cycle-detected. Returns the fully merged doc
// with the child's values overriding the parents'.

async function resolveInheritance(doc, { stack, ctx }) {
  const handle = doc.handle;
  if (stack.includes(handle)) {
    throw new Error(`Inheritance cycle detected: ${[...stack, handle].join(' → ')}`);
  }
  const parents = Array.isArray(doc.inherits_from) ? doc.inherits_from : [];
  if (parents.length === 0) return doc;

  let merged = { preferences: {}, typography: {}, pairs: { examples: [] }, constitution: { principles: '' } };

  for (const parentRef of parents) {
    const { raw: parentRaw, displayName: parentName } = await loadSource(parentRef, ctx);
    const parentDoc = tomlParse(parentRaw);
    validateTaste(parentDoc, parentName);
    // Nested parents resolve relative to THEIR file's dir, so thread the
    // discovered displayName through ctx for the recursive call.
    const parentCtx = { ...ctx, resolveFromDir: dirname(parentName) };
    const parentResolved = await resolveInheritance(parentDoc, { stack: [...stack, handle], ctx: parentCtx });
    merged = mergeTwo(merged, parentResolved);
  }

  return mergeTwo(merged, doc);
}

// Layer `child` on top of `parent`. Rules mirror docs/taste-dotfile-spec.md.
function mergeTwo(parent, child) {
  const out = { ...parent, ...child };

  // preferences.*_styles — override by id
  const preferences = { ...(parent.preferences || {}), ...(child.preferences || {}) };
  for (const field of ['prefer_styles', 'avoid_styles']) {
    const merged = new Map();
    for (const e of parent.preferences?.[field] || []) merged.set(e.id, e);
    for (const e of child.preferences?.[field] || []) merged.set(e.id, e);
    if (merged.size) preferences[field] = Array.from(merged.values());
  }
  // Tag arrays — UNION (child can only add, see spec).
  for (const field of [
    'prefer_palette_tags', 'avoid_palette_tags',
    'prefer_motion_tiers', 'avoid_motion_tiers',
  ]) {
    const set = new Set([
      ...(parent.preferences?.[field] || []),
      ...(child.preferences?.[field] || []),
    ]);
    if (set.size) preferences[field] = Array.from(set);
  }
  if (Object.keys(preferences).length) out.preferences = preferences;

  // typography — preferred_families replaces when child provides it,
  // avoided_families unions.
  const typography = { ...(parent.typography || {}), ...(child.typography || {}) };
  if (parent.typography?.avoided_families || child.typography?.avoided_families) {
    typography.avoided_families = Array.from(new Set([
      ...(parent.typography?.avoided_families || []),
      ...(child.typography?.avoided_families || []),
    ]));
  }
  if (Object.keys(typography).length) out.typography = typography;

  // pairs.examples — concat
  const pairs = [
    ...(parent.pairs?.examples || []),
    ...(child.pairs?.examples || []),
  ];
  if (pairs.length) out.pairs = { examples: pairs };

  // constitution — append with header comment identifying the source.
  const pp = (parent.constitution?.principles || '').trim();
  const cp = (child.constitution?.principles || '').trim();
  let combined = pp;
  if (cp) {
    const header = `# ── from ${child.handle || 'child'} ─────────────────────────────`;
    combined = combined
      ? `${combined}\n\n${header}\n${cp}`
      : cp;
  }
  if (combined) out.constitution = { principles: combined };

  return out;
}

// ── Facts materialisation ────────────────────────────────────────────────────
// Given a fully-resolved taste doc, produce the fact records that should be
// merged into facts.jsonl. The caller decides how to apply them (dry-run vs
// write).

function docToFacts(doc, { multiplier, sourceHandle }) {
  const facts = [];
  const at = nowIso();
  const ctx = { sourceHandle };

  const addStyle = (dir, entry) => {
    if (!entry || !entry.id) return;
    const conf = Math.min(1.0, Math.max(0.01,
      (typeof entry.confidence === 'number' ? entry.confidence : 0.5) * multiplier));
    facts.push(buildImportedFact({
      direction: dir, target_type: 'style_id', target_value: entry.id,
      confidence: conf, reason: entry.reason, ctx, at,
    }));
  };
  for (const e of doc.preferences?.prefer_styles || []) addStyle('prefer', e);
  for (const e of doc.preferences?.avoid_styles || []) addStyle('avoid', e);

  const addTag = (dir, type, value) => {
    facts.push(buildImportedFact({
      direction: dir, target_type: type, target_value: value,
      confidence: 0.5 * multiplier, ctx, at,
    }));
  };
  for (const t of doc.preferences?.prefer_palette_tags || []) addTag('prefer', 'palette_tag', t);
  for (const t of doc.preferences?.avoid_palette_tags || []) addTag('avoid', 'palette_tag', t);
  for (const t of doc.preferences?.prefer_motion_tiers || []) addTag('prefer', 'motion_tier', String(t).toLowerCase());
  for (const t of doc.preferences?.avoid_motion_tiers || []) addTag('avoid', 'motion_tier', String(t).toLowerCase());

  for (const f of doc.typography?.preferred_families || []) addTag('prefer', 'typography_family', f);
  for (const f of doc.typography?.avoided_families || []) addTag('avoid', 'typography_family', f);

  return facts;
}

function buildImportedFact({ direction, target_type, target_value, confidence, reason, ctx, at }) {
  return {
    id: ulid(),
    scope: { level: 'global', key: '*' },
    signal: { direction, target_type, target_value },
    evidence: [{
      kind: 'imported_from',
      quote_or_diff: `imported_from:${ctx.sourceHandle}${reason ? ` — ${reason}` : ''}`,
      at,
    }],
    confidence: Number(confidence.toFixed(3)),
    created_at: at,
    last_seen: at,
    flag: 'active',
  };
}

function docToPairs(doc, { sourceHandle }) {
  const pairs = [];
  const at = nowIso();
  for (const ex of doc.pairs?.examples || []) {
    if (!ex?.chosen || !Array.isArray(ex.rejected) || ex.rejected.length === 0) continue;
    pairs.push({
      id: ulid(),
      chosen: { style_id: ex.chosen },
      rejected: ex.rejected.map((r) => ({ style_id: r })),
      context: {
        brief_summary: ex.context || '',
        source: `import:${sourceHandle}`,
      },
      created_at: at,
    });
  }
  return pairs;
}

// ── Merge plan ───────────────────────────────────────────────────────────────
// Compare the to-import fact list against what already exists. Local wins:
// if existingFacts has the same dedup key, we discard the imported one and
// log a conflict.

function planMerge(importedFacts, existingFacts) {
  const existingKeys = new Set(existingFacts.map(factKey));
  const toWrite = [];
  const conflicts = [];
  for (const f of importedFacts) {
    const k = factKey(f);
    if (existingKeys.has(k)) conflicts.push(f);
    else toWrite.push(f);
  }
  return { toWrite, conflicts };
}

// ── Apply ────────────────────────────────────────────────────────────────────
function applyFacts(projectRoot, facts) {
  if (!facts.length) return 0;
  ensureTasteDir(projectRoot);
  const p = factsPath(projectRoot);
  const text = facts.map((f) => JSON.stringify(f)).join('\n') + '\n';
  atomicAppend(p, text);
  return facts.length;
}

function applyPairs(projectRoot, pairs) {
  if (!pairs.length) return 0;
  ensureTasteDir(projectRoot);
  const p = pairsPath(projectRoot);
  const text = pairs.map((pair) => JSON.stringify(pair)).join('\n') + '\n';
  atomicAppend(p, text);
  return pairs.length;
}

function logImport(projectRoot, summary) {
  ensureTasteDir(projectRoot);
  const p = join(projectRoot, 'taste', 'import.log');
  const line = `${new Date().toISOString()}\t${summary}\n`;
  try { atomicAppend(p, line); } catch { /* non-fatal */ }
}

// ── Browse subcommand ────────────────────────────────────────────────────────
async function runBrowse(opts, ctx) {
  if (opts.noNetwork) {
    console.log('--no-network is set — listing local `designers/` only.\n');
    const pluginDir = join(ctx.pluginRoot, 'designers');
    const projectDir = join(ctx.projectRoot, 'designers');
    const locals = [];
    for (const dir of [projectDir, pluginDir]) {
      if (!existsSync(dir)) continue;
      try {
        const { readdirSync } = await import('node:fs');
        for (const f of readdirSync(dir)) {
          if (f.endsWith('.taste')) locals.push({ handle: basename(f, '.taste'), from: dir });
        }
      } catch { /* ignore */ }
    }
    if (!locals.length) {
      console.log('No local `.taste` files found.');
    } else {
      for (const l of locals) console.log(`- ${l.handle}  (${l.from})`);
    }
    return;
  }

  const indexUrl = process.env.VISIONARY_TASTE_INDEX
    || 'https://raw.githubusercontent.com/screamm/visionary-tastes/main/index.json';
  let raw;
  try {
    raw = await fetchWithPolicy(indexUrl, { allowDomains: opts.allowDomains, label: 'community index' });
  } catch (e) {
    console.error(`Could not reach community index: ${e.message}`);
    console.error('Tip: set VISIONARY_TASTE_INDEX to a mirror, or run with --no-network for local-only listing.');
    process.exit(1);
  }
  let idx;
  try { idx = JSON.parse(raw); }
  catch (e) { console.error('Community index is not valid JSON:', e.message); process.exit(1); }
  const entries = Array.isArray(idx?.entries) ? idx.entries : [];
  const filtered = opts.searchQuery
    ? entries.filter((e) => JSON.stringify(e).toLowerCase().includes(opts.searchQuery.toLowerCase()))
    : entries;
  if (!filtered.length) {
    console.log('No entries match.');
    return;
  }
  console.log(`# Taste profiles available (${filtered.length})\n`);
  for (const e of filtered) {
    const inh = Array.isArray(e.inherits_from) && e.inherits_from.length ? ` inherits ${e.inherits_from.join('+')}` : '';
    console.log(`- **${e.handle}** — ${e.author || '(unnamed)'}${inh}`);
    if (e.description) console.log(`  ${e.description}`);
    if (e.url) console.log(`  ${e.url}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function runImport(opts, ctx) {
  const { raw, displayName } = await loadSource(opts.source, ctx);
  const rootDoc = tomlParse(raw);
  validateTaste(rootDoc, displayName);
  const rootCtx = { ...ctx, resolveFromDir: dirname(displayName) };
  const resolved = await resolveInheritance(rootDoc, { stack: [], ctx: rootCtx });

  const importedFacts = docToFacts(resolved, {
    multiplier: opts.multiplier, sourceHandle: rootDoc.handle,
  });
  const importedPairs = docToPairs(resolved, { sourceHandle: rootDoc.handle });

  const { items: existingFacts } = readFacts(ctx.projectRoot);
  const { toWrite: factsToWrite, conflicts } = planMerge(importedFacts, existingFacts);

  const summary = [
    `source: ${displayName}`,
    `handle: ${rootDoc.handle}`,
    `inherits_from: ${(rootDoc.inherits_from || []).join('+') || '(none)'}`,
    `imported preferences: ${factsToWrite.length}`,
    `conflicts (local wins): ${conflicts.length}`,
    `FSPO pairs appended: ${importedPairs.length}`,
    `multiplier: ${opts.multiplier}`,
    opts.dryRun ? 'mode: DRY RUN (no writes)' : 'mode: applied',
  ];

  if (opts.dryRun) {
    console.log('# Import plan (dry-run)\n');
    for (const line of summary) console.log(`- ${line}`);
    console.log('\n## First 5 imported facts (preview):');
    for (const f of factsToWrite.slice(0, 5)) {
      console.log(`- ${f.signal.direction} ${f.signal.target_type}::${f.signal.target_value} (confidence ${f.confidence})`);
    }
    return;
  }

  applyFacts(ctx.projectRoot, factsToWrite);
  applyPairs(ctx.projectRoot, importedPairs);
  logImport(ctx.projectRoot, summary.join(' | '));

  console.log('Import complete.');
  for (const line of summary) console.log(`- ${line}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const thisFile = fileURLToPath(import.meta.url);
  const pluginRoot = resolve(dirname(thisFile), '..');
  const projectRoot = findProjectRoot(process.cwd());
  const ctx = {
    projectRoot, pluginRoot,
    allowDomains: opts.allowDomains, noNetwork: opts.noNetwork,
  };

  if (opts.subcommand === 'browse') {
    await runBrowse(opts, ctx);
    return;
  }
  if (!opts.source) {
    console.error('No source given. See --help.');
    process.exit(1);
  }
  await runImport(opts, ctx);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main().catch((e) => { console.error('import failed:', e.message); process.exit(1); });
}

export {
  parseArgs, validateTaste, resolveInheritance, mergeTwo,
  docToFacts, docToPairs, planMerge, fetchWithPolicy,
  DEFAULT_URL_ALLOWLIST, URL_MAX_BYTES, IMPORT_MULTIPLIER_DEFAULT,
};
