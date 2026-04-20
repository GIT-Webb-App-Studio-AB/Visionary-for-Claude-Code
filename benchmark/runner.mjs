#!/usr/bin/env node
// Visionary Aesthetic Benchmark — runner harness.
//
// Orchestrates: load prompts → invoke skill adapter → collect output per prompt
// → score against the 4 dimensions → write a JSON result file.
//
// Usage:
//   node benchmark/runner.mjs --skill visionary --out results/visionary-1.3.0.json
//   node benchmark/runner.mjs --skill frontend-design \
//       --adapter benchmark/adapters/frontend-design.mjs \
//       --out results/frontend-design.json
//   node benchmark/runner.mjs --compare a.json b.json
//
// The runner does NOT generate code directly — it delegates to an adapter
// that knows how to invoke the target skill. The default adapter expects a
// local Claude Code harness that can accept {prompt, constraints} and return
// {files: [{path, content}]}.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argv, exit } from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const benchmarkDir = dirname(__filename);
const repoRoot = dirname(benchmarkDir);

// ── CLI parsing ─────────────────────────────────────────────────────────────
function flag(name) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? null : argv[i + 1];
}
function hasFlag(name) { return argv.includes(`--${name}`); }

const skill      = flag('skill');
const outPath    = flag('out');
const adapterPath = flag('adapter');
const samples    = parseInt(flag('samples') || '1', 10);
const compareA   = hasFlag('compare') ? argv[argv.indexOf('--compare') + 1] : null;
const compareB   = hasFlag('compare') ? argv[argv.indexOf('--compare') + 2] : null;
const categoryFilter = flag('category');
const stagedDir  = flag('staged-dir') || '.staged';  // relative to benchmark/
const skipMissing = !hasFlag('no-skip-missing');      // default on — only score prompts that have a staged file

if (compareA && compareB) {
  compare(compareA, compareB);
  exit(0);
}

if (!skill || !outPath) {
  console.error('usage: runner.mjs --skill NAME --out FILE [--adapter FILE] [--samples N] [--category CATEGORY]');
  console.error('       runner.mjs --compare A.json B.json');
  exit(1);
}

// ── Load prompts ────────────────────────────────────────────────────────────
const promptsFile = JSON.parse(readFileSync(join(benchmarkDir, 'prompts', 'prompts.json'), 'utf8'));
const allPrompts = [];
for (const [category, block] of Object.entries(promptsFile.categories)) {
  if (categoryFilter && category !== categoryFilter) continue;
  for (const p of block.prompts) {
    allPrompts.push({ ...p, category });
  }
}
console.error(`Loaded ${allPrompts.length} prompts${categoryFilter ? ` (filtered to ${categoryFilter})` : ''}.`);

// ── Load adapter ────────────────────────────────────────────────────────────
// The adapter must export `run({ prompt, constraints }) => Promise<{ files: [{path, content}] }>`.
let adapter;
if (adapterPath) {
  adapter = await import(join(repoRoot, adapterPath));
} else {
  // Default adapter: reads output from a caller that has already generated
  // the file to a staged location. Useful when you run the benchmark against
  // Claude Code interactively — generate each prompt into
  // `benchmark/.staged/{id}.{ext}` and the runner scores them offline.
  adapter = {
    run: async ({ prompt }) => {
      const staged = join(benchmarkDir, stagedDir, `${prompt.id}.tsx`);
      if (!existsSync(staged)) {
        return { files: [], error: `not staged: ${staged}` };
      }
      return { files: [{ path: staged, content: readFileSync(staged, 'utf8') }] };
    },
  };
}

// ── Scoring: deterministic dimensions ───────────────────────────────────────
import { scanSlop } from './scorers/slop-scanner.mjs';
import { scoreA11y } from './scorers/a11y-scorer.mjs';
import { scoreMotion } from './scorers/motion-scorer.mjs';
import { scoreCoherence } from './scorers/coherence-scorer.mjs';

async function scorePrompt(prompt, generated) {
  if (generated.error) {
    return {
      id: prompt.id,
      category: prompt.category,
      error: generated.error,
      scores: { distinctiveness: 0, coherence: 0, accessibility: 0, motion_readiness: 0 },
      total: 0,
    };
  }
  const src = generated.files.map((f) => f.content).join('\n\n');
  const slop = scanSlop(src);
  const distinctiveness = Math.max(1, 5 - Math.min(4, Math.floor(slop.count / 2.5)));
  const a11y = await scoreA11y(src, generated.files);
  const motion = scoreMotion(src);
  const coherence = await scoreCoherence(src, generated.files);

  const scores = { distinctiveness, coherence, accessibility: a11y, motion_readiness: motion };
  const total = scores.distinctiveness + scores.coherence + scores.accessibility + scores.motion_readiness;
  return { id: prompt.id, category: prompt.category, scores, total, slop_flags: slop.flags };
}

// ── Run ─────────────────────────────────────────────────────────────────────
const results = [];
const skipped = [];
for (const prompt of allPrompts) {
  const perSample = [];
  for (let i = 0; i < samples; i++) {
    const generated = await adapter.run({ prompt, constraints: prompt.constraints });
    perSample.push(await scorePrompt(prompt, generated));
  }
  perSample.sort((a, b) => a.total - b.total);
  const median = perSample[Math.floor(perSample.length / 2)];
  if (median.error && skipMissing) {
    skipped.push(median.id);
    continue;
  }
  process.stderr.write(`  ${prompt.id} … ${median.total.toFixed(1)}\n`);
  results.push(median);
}

if (skipped.length > 0) {
  console.error(`  (${skipped.length} prompts skipped — no staged sample)`);
}

// ── Aggregate ───────────────────────────────────────────────────────────────
const byCat = {};
for (const r of results) {
  byCat[r.category] ??= [];
  byCat[r.category].push(r);
}

const summary = {
  skill,
  version: process.env.VISIONARY_VERSION || 'unknown',
  timestamp: new Date().toISOString(),
  prompts_run: results.length,
  prompts_skipped: skipped.length,
  prompts_skipped_ids: skipped,
  samples_per_prompt: samples,
  mean_total: results.length ? results.reduce((s, r) => s + r.total, 0) / results.length : 0,
  mean_by_dimension: {
    distinctiveness:   mean(results.map((r) => r.scores.distinctiveness)),
    coherence:         mean(results.map((r) => r.scores.coherence)),
    accessibility:     mean(results.map((r) => r.scores.accessibility)),
    motion_readiness:  mean(results.map((r) => r.scores.motion_readiness)),
  },
  mean_by_category: Object.fromEntries(
    Object.entries(byCat).map(([cat, arr]) => [cat, mean(arr.map((r) => r.total))])
  ),
  per_prompt: results,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.error('');
console.error(`  Mean total:         ${summary.mean_total.toFixed(2)}`);
console.error(`    distinctiveness:  ${summary.mean_by_dimension.distinctiveness.toFixed(2)}`);
console.error(`    coherence:        ${summary.mean_by_dimension.coherence.toFixed(2)}`);
console.error(`    accessibility:    ${summary.mean_by_dimension.accessibility.toFixed(2)}`);
console.error(`    motion_readiness: ${summary.mean_by_dimension.motion_readiness.toFixed(2)}`);
console.error('');
console.error(`  Wrote: ${outPath}`);

// ── Helpers ─────────────────────────────────────────────────────────────────
function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function compare(a, b) {
  const A = JSON.parse(readFileSync(a, 'utf8'));
  const B = JSON.parse(readFileSync(b, 'utf8'));
  const delta = A.mean_total - B.mean_total;
  console.log('Dimension            A          B          delta');
  for (const dim of ['distinctiveness', 'coherence', 'accessibility', 'motion_readiness']) {
    const aV = A.mean_by_dimension[dim].toFixed(2);
    const bV = B.mean_by_dimension[dim].toFixed(2);
    const dV = (A.mean_by_dimension[dim] - B.mean_by_dimension[dim]).toFixed(2);
    console.log(`  ${dim.padEnd(20)} ${aV.padStart(6)}    ${bV.padStart(6)}    ${dV.padStart(6)}`);
  }
  console.log('');
  console.log(`  Total                ${A.mean_total.toFixed(2)}      ${B.mean_total.toFixed(2)}      ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`);
  console.log('');
  console.log(`  ${basename(a, '.json')} vs ${basename(b, '.json')}: ${delta >= 0 ? 'A wins' : 'B wins'} by ${Math.abs(delta).toFixed(2)} points`);
}
