#!/usr/bin/env node
// visionary-taste-export.mjs — Sprint 07 Task 20.2.
//
// Emits a `.taste` dotfile (TOML 1.0) from the project's live flywheel data.
// Round-trips with visionary-taste-import.mjs — every non-scrubbed field is
// recoverable.
//
// CLI:
//   node scripts/visionary-taste-export.mjs --handle pawelk-2026-04 \
//     [--out my-taste.taste]          # default: stdout
//     [--author "Pawel K."]
//     [--description "one-line summary"]
//     [--inherits-from dieter-rams,rams-functionalism]
//     [--include-screenshots]         # off by default (privacy)
//     [--include-evidence-quotes]     # off by default (privacy)
//     [--max-pairs 8]                 # cap on FSPO examples (default 8)
//
// Privacy defaults — see docs/taste-dotfile-spec.md § Privacy:
//   - fact.scope.key for level=project → "<project>"
//   - fact.evidence[*].quote_or_diff → dropped unless --include-evidence-quotes
//   - pair.context.brief_summary → truncated to 60 chars
//   - URL-like substrings in reasons → "<url>"

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  findProjectRoot, projectKey as deriveProjectKey,
  readFacts, readPairs, factKey,
} from '../hooks/scripts/lib/taste-io.mjs';
import { stringify as tomlStringify } from '../hooks/scripts/lib/toml-lite.mjs';
import {
  loadEmbeddings, sampleDiversePairs,
} from '../hooks/scripts/lib/pair-sampler.mjs';

// ── CLI parse ────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = {
    handle: null,
    out: null,
    author: null,
    description: null,
    inheritsFrom: [],
    includeScreenshots: false,
    includeEvidenceQuotes: false,
    maxPairs: 8,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--handle': opts.handle = next(); break;
      case '--out': case '-o': opts.out = next(); break;
      case '--author': opts.author = next(); break;
      case '--description': opts.description = next(); break;
      case '--inherits-from': opts.inheritsFrom = next().split(',').map((s) => s.trim()).filter(Boolean); break;
      case '--include-screenshots': opts.includeScreenshots = true; break;
      case '--include-evidence-quotes': opts.includeEvidenceQuotes = true; break;
      case '--max-pairs': opts.maxPairs = parseInt(next(), 10); break;
      case '--help': case '-h':
        printHelpAndExit(0); break;
      default:
        if (a.startsWith('--')) {
          console.error(`Unknown flag: ${a}`);
          printHelpAndExit(1);
        }
    }
  }
  return opts;
}

function printHelpAndExit(code) {
  console.error(`
visionary-taste-export — emit a .taste dotfile from the project's flywheel

Usage:
  node scripts/visionary-taste-export.mjs --handle <handle> [options]

Required:
  --handle <handle>        Lower-case, hyphen-separated. Published identifier.

Optional:
  --out <path>             Output file (default: stdout)
  --author <name>          Human-readable author name
  --description <text>     One-sentence editorial summary
  --inherits-from a,b,c    Comma-separated parent handles
  --include-screenshots    (reserved for future; no-op in v1.0)
  --include-evidence-quotes Preserve evidence quotes (privacy off — opt-in)
  --max-pairs <n>          Cap FSPO examples (default 8)
  --help                   Show this message
`.trim());
  process.exit(code);
}

// ── Handle validation ────────────────────────────────────────────────────────
const HANDLE_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;
function validateHandle(handle) {
  if (!handle) throw new Error('--handle is required');
  if (!HANDLE_RE.test(handle)) {
    throw new Error(`Handle must match [a-z0-9][a-z0-9-]{2,63} — got "${handle}"`);
  }
}

// ── Aggregation: facts → preferences ────────────────────────────────────────
// The `.taste` schema is an *aggregate* view. Individual evidence items stay
// in the source facts.jsonl; we emit one preference entry per deduped fact.
// For a given (direction, target_type, target_value), the highest-confidence
// fact wins — we don't re-sum across scopes.
function aggregatePreferences(facts, { includeEvidenceQuotes }) {
  const byKey = new Map();
  for (const f of facts) {
    if (f.flag === 'decayed') continue; // decayed facts don't export
    const key = factKey(f);
    const prev = byKey.get(key);
    if (!prev || (f.confidence || 0) > (prev.confidence || 0)) byKey.set(key, f);
  }

  const buckets = {
    prefer_styles: [],
    avoid_styles: [],
    prefer_palette_tags: new Set(),
    avoid_palette_tags: new Set(),
    prefer_motion_tiers: new Set(),
    avoid_motion_tiers: new Set(),
    preferred_families: new Set(),
    avoided_families: new Set(),
  };

  for (const f of byKey.values()) {
    const dir = f.signal?.direction;
    const type = f.signal?.target_type;
    const value = f.signal?.target_value;
    const conf = roundTo(f.confidence || 0, 2);
    if (!dir || !type || !value) continue;

    const reason = includeEvidenceQuotes ? reasonFromEvidence(f) : undefined;

    if (type === 'style_id') {
      const entry = { id: value, confidence: conf };
      if (reason) entry.reason = reason;
      if (dir === 'prefer') buckets.prefer_styles.push(entry);
      if (dir === 'avoid') buckets.avoid_styles.push(entry);
    } else if (type === 'palette_tag') {
      (dir === 'prefer' ? buckets.prefer_palette_tags : buckets.avoid_palette_tags).add(value);
    } else if (type === 'motion_tier') {
      (dir === 'prefer' ? buckets.prefer_motion_tiers : buckets.avoid_motion_tiers).add(titleCase(value));
    } else if (type === 'typography_family') {
      (dir === 'prefer' ? buckets.preferred_families : buckets.avoided_families).add(value);
    }
    // density_level and pattern deliberately skipped — they're either too
    // generic (pattern) or don't map to a .taste field in v1.0 (density).
  }

  // Sort by confidence desc so the serialized form is deterministic.
  buckets.prefer_styles.sort((a, b) => b.confidence - a.confidence);
  buckets.avoid_styles.sort((a, b) => b.confidence - a.confidence);

  return buckets;
}

function reasonFromEvidence(fact) {
  const ev = Array.isArray(fact.evidence) ? fact.evidence[0] : null;
  if (!ev || !ev.quote_or_diff) return undefined;
  return scrubReason(String(ev.quote_or_diff).trim().slice(0, 80));
}

// Redact URL-like substrings and trailing punctuation noise.
function scrubReason(s) {
  return s
    .replace(/https?:\/\/\S+/gi, '<url>')
    .replace(/(?:^|\s)\/[^\s]{6,}/g, ' <path>')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase();
}

function roundTo(n, digits) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

// ── FSPO pair extraction ─────────────────────────────────────────────────────
// Use the existing diverse-pair sampler with a neutral brief — the result is
// "top-k most diverse demonstrations of taste" rather than "pairs relevant to
// some specific brief".
function pickExportPairs(pairs, maxPairs, embeddingsPath) {
  if (!Array.isArray(pairs) || pairs.length === 0) return [];
  let embeddings = {};
  try {
    if (existsSync(embeddingsPath)) {
      embeddings = loadEmbeddings(embeddingsPath).embeddings || {};
    }
  } catch { /* sampler tolerates missing embeddings */ }
  const neutralBrief = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  const sample = sampleDiversePairs(pairs, neutralBrief, embeddings, { k: maxPairs });
  return sample.map((p) => ({
    chosen: p?.chosen?.style_id || 'unknown',
    rejected: Array.isArray(p?.rejected) ? p.rejected.map((r) => r.style_id).filter(Boolean) : [],
    context: scrubContext(p?.context?.brief_summary),
  })).filter((p) => p.chosen !== 'unknown' && p.rejected.length);
}

function scrubContext(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return scrubReason(raw.slice(0, 60));
}

// ── Build .taste object ──────────────────────────────────────────────────────
function buildTasteDoc({ opts, prefs, pairs, counts }) {
  const doc = {
    schema_version: '1.0.0',
    handle: opts.handle,
  };
  if (opts.author) doc.author = opts.author;
  if (opts.inheritsFrom.length) doc.inherits_from = opts.inheritsFrom;
  if (opts.description) doc.description = String(opts.description).slice(0, 240);

  doc.metadata = {
    created_at: new Date().toISOString(),
    generations_represented: counts.generations,
    components_kept_in_git: counts.keptInGit,
    rejection_signals: counts.rejections,
  };

  const preferences = {};
  if (prefs.prefer_styles.length) preferences.prefer_styles = prefs.prefer_styles;
  if (prefs.avoid_styles.length) preferences.avoid_styles = prefs.avoid_styles;
  if (prefs.prefer_palette_tags.size) preferences.prefer_palette_tags = Array.from(prefs.prefer_palette_tags);
  if (prefs.avoid_palette_tags.size) preferences.avoid_palette_tags = Array.from(prefs.avoid_palette_tags);
  if (prefs.prefer_motion_tiers.size) preferences.prefer_motion_tiers = Array.from(prefs.prefer_motion_tiers);
  if (prefs.avoid_motion_tiers.size) preferences.avoid_motion_tiers = Array.from(prefs.avoid_motion_tiers);
  if (Object.keys(preferences).length) doc.preferences = preferences;

  const typography = {};
  if (prefs.preferred_families.size) typography.preferred_families = Array.from(prefs.preferred_families);
  if (prefs.avoided_families.size) typography.avoided_families = Array.from(prefs.avoided_families);
  if (Object.keys(typography).length) doc.typography = typography;

  if (pairs.length) doc.pairs = { examples: pairs };

  // v1.0 does not export [constitution] or [privacy] automatically.
  // Hand-maintained .taste files may carry them; round-trip tests use the
  // examples under docs/sprints/artifacts/ for that path.

  return doc;
}

// ── Derived counts for [metadata] ────────────────────────────────────────────
function deriveCounts(facts, pairs) {
  let rejections = 0; let keptInGit = 0;
  for (const f of facts) {
    if (f.signal?.direction === 'avoid') rejections++;
    if (Array.isArray(f.evidence)) {
      for (const ev of f.evidence) {
        if (ev.kind === 'git_kept' || ev.kind === 'passive_approval') keptInGit++;
      }
    }
  }
  // generations is approximated as the count of distinct created_at days —
  // we don't track turn-count directly. Pairs also contribute one generation
  // each. This is a soft estimate; the metadata is informational only.
  const days = new Set();
  for (const f of facts) if (f.created_at) days.add(f.created_at.slice(0, 10));
  for (const p of pairs) if (p.created_at) days.add(p.created_at.slice(0, 10));
  return { rejections, keptInGit, generations: days.size };
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const opts = parseArgs(process.argv.slice(2));
  try {
    validateHandle(opts.handle);
  } catch (e) {
    console.error(e.message); printHelpAndExit(1);
  }

  const projectRoot = findProjectRoot(process.cwd());
  const { items: facts } = readFacts(projectRoot);
  const { items: pairs } = readPairs(projectRoot);
  const counts = deriveCounts(facts, pairs);

  const prefs = aggregatePreferences(facts, { includeEvidenceQuotes: opts.includeEvidenceQuotes });

  // Embeddings file lives under the plugin dir, not the project root.
  const thisFile = fileURLToPath(import.meta.url);
  const pluginRoot = resolve(dirname(thisFile), '..');
  const embeddingsPath = join(pluginRoot, 'skills', 'visionary', 'styles', '_embeddings.json');
  const exportPairs = pickExportPairs(pairs, opts.maxPairs, embeddingsPath);

  const doc = buildTasteDoc({ opts, prefs, pairs: exportPairs, counts });
  const sectionOrder = ['metadata', 'preferences', 'typography', 'pairs', 'constitution', 'privacy'];
  const header = [
    `Generated by visionary-taste-export on ${new Date().toISOString()}.`,
    `Source project: ${deriveProjectKey(projectRoot)}`,
    opts.includeEvidenceQuotes
      ? 'Evidence quotes INCLUDED (privacy opt-in).'
      : 'Privacy-scrubbed — evidence quotes omitted.',
  ].join('\n');

  const toml = tomlStringify(doc, { sectionOrder, headerComment: header });

  if (opts.out) {
    writeFileSync(resolve(opts.out), toml, 'utf8');
    const summary = [
      `Exported ${prefs.prefer_styles.length + prefs.avoid_styles.length} style preferences,`,
      `${prefs.prefer_palette_tags.size + prefs.avoid_palette_tags.size} palette tags,`,
      `${prefs.prefer_motion_tiers.size + prefs.avoid_motion_tiers.size} motion tiers,`,
      `${exportPairs.length} FSPO pairs`,
      `→ ${opts.out}`,
    ].join(' ');
    console.log(summary);
  } else {
    process.stdout.write(toml);
  }
}

// Guard so tests can import this module without triggering main().
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  try { main(); }
  catch (e) { console.error('export failed:', e.message); process.exit(1); }
}

// Export internals for unit tests.
export { aggregatePreferences, buildTasteDoc, scrubReason, scrubContext, validateHandle };
