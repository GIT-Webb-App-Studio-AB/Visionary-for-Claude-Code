#!/usr/bin/env node
// update-taste.mjs — UserPromptSubmit hook.
//
// Sprint 05 rewrite. Detects rejection / approval cues in the submitted user
// prompt and persists structured taste-facts to taste/facts.jsonl. Also
// captures /variants-pick signals as taste-pairs in taste/pairs.jsonl (Task
// 15.2) and injects a compact FSPO few-shot block into additionalContext
// when the turn looks like a fresh generation request (Task 15.3).
//
// Flow:
//   1. Read stdin JSON (prompt text) — same spec as before.
//   2. Discover project root via package.json / .git walk.
//   3. Auto-migrate legacy system.md → taste/facts.jsonl if facts.jsonl is
//      missing but system.md exists (idempotent, called inline).
//   4. Extract facts from the turn via hooks/scripts/lib/taste-extractor.mjs.
//   5. Dedup against existing facts (upgrade path via applyUpgrade).
//   6. Detect /variants-pick phrasing ("pick A", "go with B", etc) and
//      store a taste-pair if a recent /variants brief is in the cache.
//   7. Emit a short additionalContext describing what was captured.
//
// Respects VISIONARY_DISABLE_TASTE=1 as hard opt-out (see docs/taste-privacy.md).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  findProjectRoot, projectKey as deriveProjectKey, isTasteDisabled,
  factsPath, pairsPath, readFacts, readPairs, appendFact, appendPair,
  rewriteFacts, nowIso, ulid, factKey,
} from './lib/taste-io.mjs';
import { extractFactsFromTurn, applyUpgrade } from './lib/taste-extractor.mjs';
import { cacheDir, legacyCacheDirs } from './lib/cache-dir.mjs';

// ── Read stdin ──────────────────────────────────────────────────────────────
function readStdin() { try { return readFileSync(0, 'utf8'); } catch { return ''; } }
function parseInput(raw) { if (!raw) return null; try { return JSON.parse(raw); } catch { return null; } }
function emit(obj) { process.stdout.write(JSON.stringify(obj)); process.exit(0); }
function silent() { process.exit(0); }

if (isTasteDisabled()) silent();  // hard opt-out — no capture, no emit

const input = parseInput(readStdin());
if (!input) silent();

const promptText = input.prompt
  || (Array.isArray(input.messages)
        ? input.messages.filter((m) => m.role === 'user').map((m) => m.content || '').join(' ')
        : '');
if (!promptText || typeof promptText !== 'string') silent();

// ── Project context ────────────────────────────────────────────────────────
const projectRoot = findProjectRoot(input.cwd || process.cwd());
const projectKeyValue = deriveProjectKey(projectRoot);

// ── Auto-migrate system.md if this is the first run post-Sprint-05 ─────────
autoMigrateIfNeeded(projectRoot);

// ── Extract facts ──────────────────────────────────────────────────────────
const existingFacts = readFacts(projectRoot).items;
const existingKeys = new Set(existingFacts.map(factKey));
const { facts: newFacts, upgrades } = extractFactsFromTurn(promptText, { projectKey: projectKeyValue }, existingKeys);

let writtenFacts = 0;
let upgradedFacts = 0;

for (const fact of newFacts) {
  if (appendFact(projectRoot, fact)) writtenFacts++;
}

if (upgrades.length > 0) {
  // Rewrite the whole facts.jsonl with mutations applied. Aging and upgrades
  // are the only two paths that rewrite; both are rare enough that the cost
  // of re-serialising the whole file is acceptable.
  const byKey = new Map(existingFacts.map((f) => [factKey(f), f]));
  for (const u of upgrades) {
    const existing = byKey.get(u.key);
    if (!existing) continue;
    byKey.set(u.key, applyUpgrade(existing, u.evidenceDelta));
    upgradedFacts++;
  }
  if (upgradedFacts > 0) rewriteFacts(projectRoot, Array.from(byKey.values()));
}

// ── /variants-pick capture (Task 15.2) ─────────────────────────────────────
let pairWritten = false;
const pickInfo = detectVariantPick(promptText);
if (pickInfo) {
  const brief = readLastVariantsBrief(projectRoot);
  if (brief && brief.variants && brief.variants.length >= 2) {
    const pair = buildPair(pickInfo, brief);
    if (pair && appendPair(projectRoot, pair)) {
      pairWritten = true;
    }
  }
}

// ── Emit result ────────────────────────────────────────────────────────────
if (writtenFacts === 0 && upgradedFacts === 0 && !pairWritten) silent();

const parts = [];
if (writtenFacts > 0) parts.push(`${writtenFacts} new taste fact${writtenFacts === 1 ? '' : 's'}`);
if (upgradedFacts > 0) parts.push(`${upgradedFacts} upgraded fact${upgradedFacts === 1 ? '' : 's'}`);
if (pairWritten) parts.push('1 variants pair');
const msg = `Taste profile updated: ${parts.join(', ')}. See taste/facts.jsonl.`;

emit({ additionalContext: msg });

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

function autoMigrateIfNeeded(root) {
  const facts = factsPath(root);
  const systemMd = join(root, 'system.md');
  if (existsSync(facts)) return;
  if (!existsSync(systemMd)) return;

  // Call the migration script as a child process — this keeps the
  // migration logic in one place and lets users run it manually too.
  // If the child fails we swallow the error: a hook must never break
  // the user's prompt submission because of a legacy-import hiccup.
  try {
    const scriptPath = join(root, 'scripts', 'migrate-system-md-to-facts.mjs');
    if (!existsSync(scriptPath)) {
      // Fall back: the plugin install may keep the script elsewhere.
      // Skip migration silently — user's first explicit rejection will
      // re-seed facts.jsonl from scratch.
      return;
    }
    spawnSync(process.execPath, [scriptPath, root], {
      stdio: 'ignore',
      windowsHide: true,
      timeout: 5000,
    });
  } catch { /* ignore — see rationale above */ }
}

// /variants-pick detection — matches several natural phrasings:
//   "pick A" / "pick B" / "pick C"
//   "go with A" / "go with B" / "go with C"
//   "I'll take #2" / "take 2" / "I take B"
//   "variant B please" / "variant c"
function detectVariantPick(text) {
  const t = text.toLowerCase();
  // Exclude if the user clearly isn't picking (e.g. "don't pick A").
  if (/\b(don'?t|do\s+not)\s+(pick|go\s+with|take)\b/.test(t)) return null;

  const patterns = [
    /\bpick\s+([abc])\b/i,
    /\bgo\s+with\s+([abc])\b/i,
    /\bi'?ll\s+take\s+(?:#|variant\s+)?([abc0-9])\b/i,
    /\bvariant\s+([abc0-9])\s*(?:please|works|it\s+is|is\s+best)?\b/i,
    /\btake\s+(?:#|variant\s+)?([abc0-9])\b/i,
    /\bchoose\s+([abc0-9])\b/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const tok = (m[1] || '').toLowerCase();
      const idx = tok === 'a' || tok === '1' || tok === '0' ? 0
                : tok === 'b' || tok === '2' ? 1
                : tok === 'c' || tok === '3' ? 2
                : -1;
      if (idx >= 0 && idx <= 2) return { variantIndex: idx };
    }
  }
  return null;
}

// Reads the last /variants brief written by the /variants command. The
// command stores it at <cacheDir>/last-variants-brief.json when it fires
// (see commands/variants.md). v1.5.3: cacheDir() resolves to
// ${CLAUDE_PLUGIN_DATA}/visionary-cache or the home-dir fallback —
// legacyCacheDirs() covers the pre-v1.5.3 in-repo location so existing
// briefs keep being picked up across the migration.
function readLastVariantsBrief(root) {
  const dirs = [cacheDir(root), ...legacyCacheDirs(root)];
  const seen = new Set();
  for (const d of dirs) {
    const p = join(d, 'last-variants-brief.json');
    if (seen.has(p)) continue;
    seen.add(p);
    if (existsSync(p)) {
      try { return JSON.parse(readFileSync(p, 'utf8')); } catch { /* fall through */ }
    }
  }
  return null;
}

function buildPair(pickInfo, brief) {
  const variants = brief.variants || [];
  const chosen = variants[pickInfo.variantIndex];
  if (!chosen || !chosen.style_id) return null;
  const rejected = variants
    .filter((_, i) => i !== pickInfo.variantIndex)
    .map((v, i) => ({ style_id: v.style_id, variant_index: variants.indexOf(v) }));
  if (rejected.length === 0) return null;
  return {
    id: ulid(),
    chosen: { style_id: chosen.style_id, variant_index: pickInfo.variantIndex },
    rejected,
    context: {
      brief_summary: (brief.brief_summary || brief.summary || '').slice(0, 240),
      ...(brief.product_archetype ? { product_archetype: brief.product_archetype } : {}),
      ...(brief.component_type ? { component_type: brief.component_type } : {}),
      ...(brief.audience_density ? { audience_density: brief.audience_density } : {}),
      ...(brief.motion_tier ? { motion_tier: brief.motion_tier } : {}),
      ...(brief.brand_archetype ? { brand_archetype: brief.brand_archetype } : {}),
    },
    created_at: nowIso(),
  };
}
