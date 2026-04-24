#!/usr/bin/env node
// migrate-system-md-to-facts.mjs — Sprint 05 Task 14.4.
//
// One-shot migration from the legacy `system.md` taste profile (Sprint 04
// and earlier) to the Sprint 05 `taste/facts.jsonl` storage. Idempotent:
// re-running after migration is a no-op (detects via header marker).
//
// What it does:
//   1. Read system.md at the given project root.
//   2. Parse the five markdown sections (Rejected styles, Rejected
//      typography, Rejected motion patterns, Rejected colors, Positive
//      signals) into candidate facts.
//   3. Stamp each with scope.level="project", scope.key=<projectKey>,
//      confidence=0.7 for generic rejections or 0.9 if the entry is marked
//      "PERMANENTLY FLAGGED".
//   4. Append to taste/facts.jsonl via the same atomic writer the hook uses.
//   5. Rewrite system.md with a MIGRATED header so it stays readable as a
//      legacy artefact but is no longer consulted at runtime.
//
// Runtime fallback is enforced in the read path (see context-inference.md
// Step 4.5): if taste/facts.jsonl exists, system.md is ignored. If only
// system.md exists, a one-shot auto-migration runs on the next hook tick.
//
// CLI:
//   node scripts/migrate-system-md-to-facts.mjs                # migrate current project
//   node scripts/migrate-system-md-to-facts.mjs /path/to/proj  # migrate specific project
//   node scripts/migrate-system-md-to-facts.mjs --dry-run      # print planned facts, do not write
//   node scripts/migrate-system-md-to-facts.mjs --verbose      # per-line trace

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { appendFact, factsPath, nowIso, ulid, projectKey as deriveProjectKey, findProjectRoot, factKey, readFacts } from '../hooks/scripts/lib/taste-io.mjs';

const ARGS = process.argv.slice(2);
const dryRun = ARGS.includes('--dry-run');
const verbose = ARGS.includes('--verbose');
const positional = ARGS.filter((a) => !a.startsWith('--'));
const startDir = positional[0] || process.cwd();

const MIGRATED_HEADER = '<!-- MIGRATED — do not edit, see taste/facts.jsonl -->';

// ── Section → (signal.direction, signal.target_type) table ─────────────────
const SECTION_MAP = {
  'Rejected styles':          { direction: 'avoid', target_type: 'style_id' },
  'Rejected typography':      { direction: 'avoid', target_type: 'typography_family' },
  'Rejected motion patterns': { direction: 'avoid', target_type: 'motion_tier' },
  'Rejected colors':          { direction: 'avoid', target_type: 'color' },
  'Positive signals':         { direction: 'prefer', target_type: 'pattern' },
  'Design DNA':               { direction: 'prefer', target_type: 'pattern' },  // "(confirmed)"
};

// ── Main ────────────────────────────────────────────────────────────────────
function main() {
  const projectRoot = findProjectRoot(resolve(startDir));
  const systemMdPath = join(projectRoot, 'system.md');
  const projectKeyValue = deriveProjectKey(projectRoot);

  if (!existsSync(systemMdPath)) {
    console.log(`[migrate] no system.md at ${systemMdPath} — nothing to do`);
    process.exit(0);
  }

  const raw = readFileSync(systemMdPath, 'utf8');
  if (raw.includes(MIGRATED_HEADER)) {
    console.log(`[migrate] ${systemMdPath} already migrated — skipping`);
    process.exit(0);
  }

  const existingFactKeys = new Set(readFacts(projectRoot).items.map(factKey));
  const candidates = parseSystemMd(raw, projectKeyValue);

  let newCount = 0;
  let skippedCount = 0;
  for (const fact of candidates) {
    if (existingFactKeys.has(factKey(fact))) {
      skippedCount++;
      if (verbose) console.log(`[migrate] skip (duplicate): ${factKey(fact)}`);
      continue;
    }
    if (dryRun) {
      if (verbose) console.log(`[migrate] would write: ${factKey(fact)} conf=${fact.confidence}`);
      newCount++;
      continue;
    }
    const ok = appendFact(projectRoot, fact);
    if (ok) {
      newCount++;
      if (verbose) console.log(`[migrate] wrote: ${factKey(fact)}`);
    } else {
      console.warn(`[migrate] FAILED to append fact: ${factKey(fact)}`);
    }
  }

  if (!dryRun && newCount > 0) {
    markAsMigrated(systemMdPath, raw);
  }

  console.log(`[migrate] facts_written=${newCount} duplicates_skipped=${skippedCount} target=${factsPath(projectRoot)} dry-run=${dryRun}`);
}

// ── Parser ──────────────────────────────────────────────────────────────────
// system.md lines of interest look like:
//   - AVOID: glassmorphism — user rejected 2026-04-10
//   - (detected rejection — 2026-04-22: "quote goes here")
//   - *** PERMANENTLY FLAGGED — rejected 3+ times. ***
//   - SomeStyleId  (under a "Rejected styles" header)
//
// We walk the document top-down, track the current section header, and
// emit one fact per non-empty list item. "PERMANENTLY FLAGGED" markers
// promote the most recent fact in the same section to flag=permanent
// instead of emitting a new fact.
function parseSystemMd(content, projectKeyValue) {
  const facts = [];
  const lines = content.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const headerMatch = line.match(/^###\s+(.+?)\s*$/);
    if (headerMatch) {
      currentSection = normalizeSection(headerMatch[1]);
      continue;
    }
    if (!currentSection || !SECTION_MAP[currentSection]) continue;

    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('-')) continue;

    const entry = trimmed.replace(/^-+\s*/, '').trim();
    if (!entry) continue;

    // Promotion marker — upgrade the most recent fact in this section.
    if (/PERMANENTLY\s+FLAGGED/i.test(entry)) {
      if (facts.length > 0) {
        const last = facts[facts.length - 1];
        if (last && last.scope.key === projectKeyValue) {
          last.flag = 'permanent';
          last.confidence = 0.9;
        }
      }
      continue;
    }

    const parsed = parseEntry(entry, SECTION_MAP[currentSection], projectKeyValue);
    if (parsed) facts.push(parsed);
  }

  return facts;
}

function normalizeSection(raw) {
  // "Positive signals (reinforce)" → "Positive signals"
  // "Design DNA (confirmed)" → "Design DNA"
  return raw.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function parseEntry(entry, { direction, target_type }, projectKeyValue) {
  // Extract the date if present (YYYY-MM-DD format).
  const dateMatch = entry.match(/(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : null;
  const isoAt = date ? `${date}T00:00:00.000Z` : nowIso();

  // Detect-phrase format: "(detected rejection — YYYY-MM-DD: "quote")"
  const detected = entry.match(/detected\s+(rejection|approval)\s*[—-]\s*\d{4}-\d{2}-\d{2}\s*:\s*"([^"]*)"/i);
  let targetValue;
  let quote;
  if (detected) {
    quote = detected[2].trim();
    targetValue = quote.slice(0, 60) || 'unspecified';
  } else {
    // Plain-entry format: "AVOID: <style> — <reason>" or just "<style>".
    // Strip common prefixes and date suffixes to isolate the target value.
    let cleaned = entry
      .replace(/^\s*(AVOID|PREFER|DNA|AVOID\s+STYLE|AVOID\s+FONT)\s*:\s*/i, '')
      .replace(/\s*[—-]\s*user\s+(rejected|approved)\s+\d{4}-\d{2}-\d{2}\s*$/i, '')
      .replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '')
      .trim();
    // Strip trailing reason ("— too generic", etc).
    cleaned = cleaned.replace(/\s*[—-]\s*[^—-]+$/, '').trim();
    targetValue = cleaned || entry.slice(0, 60);
    quote = entry.slice(0, 160);
  }

  if (!targetValue) return null;

  const isPermanent = /PERMANENTLY\s+FLAGGED/i.test(entry);
  return {
    id: ulid(),
    scope: { level: 'project', key: projectKeyValue },
    signal: { direction, target_type, target_value: targetValue.slice(0, 160) },
    evidence: [{
      kind: direction === 'avoid' ? 'explicit_rejection' : 'explicit_approval',
      quote_or_diff: (quote || '').slice(0, 240),
      at: isoAt,
    }],
    confidence: isPermanent ? 0.9 : 0.7,
    created_at: isoAt,
    last_seen: isoAt,
    flag: isPermanent ? 'permanent' : 'active',
  };
}

// ── Legacy-marker write-back ────────────────────────────────────────────────
function markAsMigrated(systemMdPath, originalContent) {
  const today = nowIso().slice(0, 10);
  const header = `${MIGRATED_HEADER}\n<!-- Migrated ${today}. New taste data lives in taste/facts.jsonl. -->\n\n`;
  writeFileSync(systemMdPath, header + originalContent, 'utf8');
}

main();
