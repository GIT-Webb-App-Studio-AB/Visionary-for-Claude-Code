#!/usr/bin/env node
// inject-taste-context.mjs — UserPromptSubmit hook.
//
// Sprint 05 Task 14.5 + 15.3. Reads taste/facts.jsonl and taste/pairs.jsonl
// and injects a compact summary into additionalContext when the turn looks
// like a Visionary generation request. This is how Step 4.5 (taste-score
// adjustment) and the FSPO few-shot block reach the LLM.
//
// Why a separate hook: update-taste.mjs CAPTURES signals from the current
// turn; this hook READS persistent state and surfaces it. Keeping them
// apart means a reject signal is stored first and injected on the NEXT
// turn — not the current one — which matches the sprint model.
//
// Payload shape injected as additionalContext (markdown, compact):
//   ## Taste profile (N active, M permanent)
//   - [avoid|prefer] target_type::target_value (conf X.XX, N evidence)
//   - ...
//   ## Prior variant picks (K examples under similar context)
//   - brief: "..." → picked <chosen>; passed on <rejected>
//   - ...
//
// Injected-turn budget is bounded: at most 12 facts + 8 pairs. Facts are
// prioritised by (flag=permanent first, then active with confidence * recency).
// Pairs are picked via the diversity sampler (Task 15.4).
//
// Skipped when:
//   - VISIONARY_DISABLE_TASTE=1
//   - No generation cue in the prompt
//   - taste/facts.jsonl and taste/pairs.jsonl both absent

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  findProjectRoot, projectKey as deriveProjectKey, isTasteDisabled,
  readFacts, readPairs, isoDaysAgo, factsPath, pairsPath, factMatchesScope,
} from './lib/taste-io.mjs';
import { sampleDiversePairs, loadEmbeddings } from './lib/pair-sampler.mjs';

// ── Stdin ──────────────────────────────────────────────────────────────────
function readStdin() { try { return readFileSync(0, 'utf8'); } catch { return ''; } }
function parseInput(raw) { if (!raw) return null; try { return JSON.parse(raw); } catch { return null; } }
function silent() { process.exit(0); }
function emit(obj) { process.stdout.write(JSON.stringify(obj)); process.exit(0); }

if (isTasteDisabled()) silent();

const input = parseInput(readStdin());
if (!input) silent();

const promptText = input.prompt || '';
if (typeof promptText !== 'string' || !promptText.trim()) silent();
if (!looksLikeGenerationRequest(promptText)) silent();

// ── Project context ────────────────────────────────────────────────────────
const projectRoot = findProjectRoot(input.cwd || process.cwd());
const projectKeyValue = deriveProjectKey(projectRoot);

const facts = readFacts(projectRoot).items;
const pairs = readPairs(projectRoot).items;
// Fall-through to kit injection: the combined silent-guard below handles the
// all-absent case after we've also checked for a content kit.

// ── Fact selection & ranking ────────────────────────────────────────────────
// Scope-match first (global + current-project only — component_type and
// archetype would require the StyleBrief which we don't have at this
// stage). Then order: permanent (top), then active by confidence * recency.
const scopedFacts = facts
  .filter((f) => f.flag !== 'decayed')
  .filter((f) => factMatchesScope(f, { projectKey: projectKeyValue }));

const now = Date.now();
function rankFact(f) {
  if (f.flag === 'permanent') return 1e9;
  const ageDays = isoDaysAgo(f.last_seen, now);
  const recencyScore = Math.max(0.1, 1 - Math.min(ageDays, 30) / 30);
  return (f.confidence || 0) * recencyScore;
}
scopedFacts.sort((a, b) => rankFact(b) - rankFact(a));
const topFacts = scopedFacts.slice(0, 12);

// ── Pair selection via diversity sampler ────────────────────────────────────
let topPairs = [];
if (pairs.length > 0) {
  try {
    const embeddingsPath = join(projectRoot, 'skills', 'visionary', 'styles', '_embeddings.json');
    if (existsSync(embeddingsPath)) {
      const { embeddings } = loadEmbeddings(embeddingsPath);
      // No brief vector yet — use the most-common chosen style as anchor.
      const anchorStyle = mostCommonChosenStyleId(pairs);
      topPairs = sampleDiversePairs(pairs, anchorStyle || [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5], embeddings, { k: 8 });
    }
  } catch { /* embeddings missing → skip pair injection, facts still inject */ }
}

// ── Kit injection (Sprint 07 Task 21.6) ─────────────────────────────────────
// If the project declares a visionary-kit.json, summarise it inline so the
// generator writes components against realistic data shapes. We inject an
// excerpt (not the full kit) to stay within the prompt budget.
const kitBlock = buildKitBlock(projectRoot);

if (topFacts.length === 0 && topPairs.length === 0 && !kitBlock) silent();

// ── Render ──────────────────────────────────────────────────────────────────
const blocks = [];

if (topFacts.length > 0) {
  const permanent = topFacts.filter((f) => f.flag === 'permanent').length;
  const active = topFacts.filter((f) => f.flag === 'active').length;
  const lines = [`## Taste profile (${active} active, ${permanent} permanent)`];
  lines.push('Apply in context-inference.md Step 4.5:');
  lines.push('- `permanent` + `avoid` → hard-block (candidate removed)');
  lines.push('- `active` + `avoid` → score -25 * confidence');
  lines.push('- `active` + `prefer` → score +15 * confidence');
  lines.push('');
  for (const f of topFacts) {
    const evidenceCount = Array.isArray(f.evidence) ? f.evidence.length : 0;
    const flag = f.flag === 'permanent' ? ' [permanent]' : '';
    lines.push(`- ${f.signal.direction} ${f.signal.target_type}::${f.signal.target_value} (conf ${(f.confidence || 0).toFixed(2)}, ${evidenceCount} evidence${flag})`);
  }
  blocks.push(lines.join('\n'));
}

if (topPairs.length > 0) {
  const lines = [`## Prior variant picks (${topPairs.length} examples — use as FSPO anchors in Step 4)`];
  lines.push('User previously picked these when given alternatives under similar context. Bias Step 4 scoring toward patterns matching these picks:');
  lines.push('');
  for (const p of topPairs) {
    const brief = (p.context && p.context.brief_summary) || '(no brief)';
    const rejectedIds = (p.rejected || []).map((r) => r.style_id).join(', ');
    lines.push(`- "${brief}" → picked **${p.chosen.style_id}**; passed on ${rejectedIds || '(none)'}`);
  }
  blocks.push(lines.join('\n'));
}

if (kitBlock) blocks.push(kitBlock);

emit({ additionalContext: blocks.join('\n\n') });

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

// Matches a turn that likely triggers Visionary generation. The SKILL.md
// activation cues are the source of truth; this is a pragmatic subset that
// avoids false positives on unrelated turns.
function looksLikeGenerationRequest(text) {
  const t = text.toLowerCase();
  // Slash-commands are strong signals.
  if (/\/(visionary|variants|visionary-variants|apply|ui|design|component|motion|import-artifact|designer)\b/.test(t)) return true;
  // Generation verbs paired with UI nouns.
  const verbs = ['build', 'create', 'design', 'generate', 'make', 'write', 'give me', 'show me'];
  const nouns = ['component', 'page', 'dashboard', 'landing', 'hero', 'form', 'ui', 'layout', 'interface', 'website', 'site', 'app', 'screen'];
  for (const v of verbs) {
    if (!t.includes(v)) continue;
    for (const n of nouns) {
      if (t.includes(n)) return true;
    }
  }
  // Vague generation cues.
  if (/\b(make it (look|feel) [a-z]+|improve the design|redesign)\b/.test(t)) return true;
  return false;
}

// ── Kit builder (Sprint 07 Task 21.6) ───────────────────────────────────────
// Compact, prompt-safe summary of visionary-kit.json. Caps at ~800 chars so
// it doesn't crowd out taste signals in the injected context.
function buildKitBlock(projectRoot) {
  const kitPath = join(projectRoot, 'visionary-kit.json');
  if (!existsSync(kitPath)) return null;
  let kit;
  try { kit = JSON.parse(readFileSync(kitPath, 'utf8')); }
  catch { return null; }
  if (!kit || typeof kit !== 'object') return null;

  const entities = Object.entries(kit.entities || {});
  if (entities.length === 0) return null;

  const lines = [];
  lines.push('## Content kit (visionary-kit.json — required data shapes)');
  lines.push('This project declares realistic data shapes the component MUST render against. **Do NOT use placeholder names like "Jane Doe" or "Acme Corp". Do NOT use `example.com` emails.** Use the shapes below for both initial sample data and prop types.');
  if (kit.locale) lines.push(`Locale: \`${kit.locale}\``);
  if (Array.isArray(kit.required_states) && kit.required_states.length) {
    lines.push(`Required render states: ${kit.required_states.map((s) => `\`${s}\``).join(', ')}`);
  }
  lines.push('');
  for (const [name, entity] of entities.slice(0, 6)) {
    const firstSample = Array.isArray(entity.sample) ? entity.sample[0] : null;
    const fields = firstSample ? Object.keys(firstSample) : [];
    lines.push(`### ${name}`);
    if (fields.length) lines.push(`Fields: ${fields.slice(0, 10).join(', ')}`);
    if (firstSample) {
      const compact = JSON.stringify(firstSample).slice(0, 160);
      lines.push(`Sample: \`${compact}\``);
    }
    const c = entity.constraints || {};
    const interesting = Object.entries(c)
      .filter(([_, v]) => v && (v.p95_length || v.may_contain_diacritics || v.nullable || v.enum))
      .slice(0, 4);
    if (interesting.length) {
      lines.push(`Constraints:`);
      for (const [f, v] of interesting) {
        const parts = [];
        if (v.p95_length) parts.push(`p95_length=${v.p95_length}`);
        if (v.may_contain_diacritics) parts.push('diacritics');
        if (v.nullable) parts.push(`nullable (null_rate≈${v.null_rate ?? 0.1})`);
        if (v.enum) parts.push(`enum=[${v.enum.slice(0, 3).join(',')}${v.enum.length > 3 ? ',…' : ''}]`);
        lines.push(`  - ${f}: ${parts.join(', ')}`);
      }
    }
  }
  if (entities.length > 6) lines.push(`… and ${entities.length - 6} more entities (run \`/visionary-kit preview\` to see all).`);

  const cc = kit.component_constraints || {};
  if (Object.keys(cc).length) {
    lines.push('');
    lines.push('Component density hints:');
    for (const [type, v] of Object.entries(cc)) {
      const hints = [];
      if (v.p95_rows) hints.push(`p95_rows=${v.p95_rows}`);
      if (v.empty_rate !== undefined) hints.push(`empty_rate=${v.empty_rate}`);
      if (v.p95_cols) hints.push(`p95_cols=${v.p95_cols}`);
      if (hints.length) lines.push(`  - ${type}: ${hints.join(', ')}`);
    }
  }

  const blob = lines.join('\n');
  // Hard cap at 1200 chars so we don't starve the taste block.
  return blob.length > 1200 ? blob.slice(0, 1200 - 1) + '…' : blob;
}

function mostCommonChosenStyleId(pairs) {
  const counts = new Map();
  for (const p of pairs) {
    const id = p?.chosen?.style_id;
    if (id) counts.set(id, (counts.get(id) || 0) + 1);
  }
  let best = null; let bestCount = 0;
  for (const [id, c] of counts) if (c > bestCount) { best = id; bestCount = c; }
  return best;
}
