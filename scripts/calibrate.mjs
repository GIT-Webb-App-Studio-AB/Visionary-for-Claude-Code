#!/usr/bin/env node
// scripts/calibrate.mjs — Sprint 3 Task 8.2
//
// Fits per-dimension linear calibration (slope + intercept) between the
// visual-critic subagent's raw scores and human consensus from
// benchmark/gold-set/. Emits skills/visionary/calibration.json.
//
// Three modes:
//
//   identity_fallback  — No gold-set entries with human_scores + .critique.json
//                        present. Emits slope=1, intercept=0, spearman_rho=null
//                        for every dimension so the runtime applies no
//                        transform. The runtime respects this: calibration
//                        with status:identity_fallback is treated as "no fit".
//
//   degraded           — 1..9 valid entries. Enough to compute a slope but
//                        not a trustworthy Spearman ρ. Slopes are fit, ρ is
//                        reported when >= 3 pairs, and warnings appear per
//                        dimension whose fit leans on <= 5 entries.
//
//   fitted             — 10+ valid entries. Full fit + ρ. The runtime
//                        applies the per-dimension linear calibration before
//                        threshold gating. Dimensions with ρ < 0.6 are
//                        flagged `low_correlation: true` and the fit is
//                        retained but a warning is raised — the critic is
//                        untrustworthy on that dimension.
//
// Usage:
//   node scripts/calibrate.mjs                   # write calibration.json
//   node scripts/calibrate.mjs --out <path>      # alternate output path
//   node scripts/calibrate.mjs --dry-run         # print to stdout only
//   node scripts/calibrate.mjs --check           # fail if on-disk != fresh
//   node scripts/calibrate.mjs --verbose         # per-dimension diagnostics
//
// Exit codes: 0 ok · 1 fatal · 2 drift detected (--check only).

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Paths ───────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));
const goldSetDir = join(repoRoot, 'benchmark', 'gold-set');
const criticAgentPath = join(repoRoot, 'agents', 'visual-critic.md');
const critiqueSchemaPath = join(repoRoot, 'skills', 'visionary', 'schemas', 'critique-output.schema.json');
const DEFAULT_OUT = join(repoRoot, 'skills', 'visionary', 'calibration.json');

// ── Sprint 6 Task 18.4: per-critic identity + frontier tracking ─────────────
// When --critic-identity craft|aesthetic is passed, we fit only the
// dimensions the specified critic owns, and emit to calibration.<identity>.json
// by default. The other dimensions are emitted with slope=1/intercept=0
// (identity passthrough) so apply-calibration.mjs can apply the file
// uniformly without knowing which critic was active.
//
// The ownership partition must stay in sync with critic-merge.mjs — we
// duplicate it here (rather than import) to keep calibrate.mjs runnable
// as a standalone node script without needing to parse .mjs imports in
// a CJS-ish environment.
const CRAFT_DIMENSIONS = [
  'hierarchy', 'layout', 'typography', 'contrast',
  'accessibility', 'craft_measurable', 'content_resilience',
];
const AESTHETIC_DIMENSIONS = [
  'distinctiveness', 'brief_conformance', 'motion_readiness',
];

// ── Config ──────────────────────────────────────────────────────────────────
const DIMENSIONS_UNIFIED = [
  'hierarchy', 'layout', 'typography', 'contrast',
  'distinctiveness', 'brief_conformance', 'accessibility', 'motion_readiness',
  'craft_measurable', 'content_resilience',
];
// Backwards-compat alias: pre-Sprint-6 code referenced DIMENSIONS directly.
const DIMENSIONS = DIMENSIONS_UNIFIED;
const FITTED_MIN_ENTRIES = 10;
const SPEARMAN_WARN_THRESHOLD = 0.6;

// ── CLI parsing ─────────────────────────────────────────────────────────────
function hasFlag(n) { return process.argv.includes(`--${n}`); }
function flagValue(n) {
  const i = process.argv.indexOf(`--${n}`);
  return i === -1 ? null : process.argv[i + 1];
}
const CRITIC_IDENTITY = (flagValue('critic-identity') || 'unified').toLowerCase();
if (!['unified', 'craft', 'aesthetic'].includes(CRITIC_IDENTITY)) {
  console.error(`[calibrate] unknown --critic-identity "${CRITIC_IDENTITY}" (expected unified|craft|aesthetic)`);
  process.exit(1);
}
const OWNED_DIMENSIONS = CRITIC_IDENTITY === 'craft'
  ? CRAFT_DIMENSIONS
  : (CRITIC_IDENTITY === 'aesthetic' ? AESTHETIC_DIMENSIONS : DIMENSIONS_UNIFIED);
const OUT_PATH = flagValue('out') || defaultOutForIdentity(CRITIC_IDENTITY);
const DRY_RUN = hasFlag('dry-run');
const CHECK_MODE = hasFlag('check');
const VERBOSE = hasFlag('verbose');
const UPDATE_FRONTIER = !hasFlag('no-frontier') && !DRY_RUN && !CHECK_MODE;

function defaultOutForIdentity(id) {
  if (id === 'unified') return DEFAULT_OUT;
  return join(repoRoot, 'skills', 'visionary', `calibration.${id}.json`);
}

// ── Prompt hash — must match the hash the hook emits so runtime can trust the fit ──
function computePromptHash() {
  try {
    const critic = readFileSync(criticAgentPath, 'utf8');
    const schema = readFileSync(critiqueSchemaPath, 'utf8');
    const h = createHash('sha256');
    h.update(critic);
    h.update('\n---schema---\n');
    h.update(schema);
    return 'sha256:' + h.digest('hex').slice(0, 16);
  } catch (err) {
    console.error(`warn: prompt hash unavailable — ${err.message}`);
    return 'sha256:unknown';
  }
}

// ── Load gold-set entries ───────────────────────────────────────────────────
// An entry is "valid for fitting" when:
//   - gs-NNN.meta.json exists AND has a complete consensus object
//   - gs-NNN.critique.json exists AND contains a scores block
function loadGoldSet() {
  if (!existsSync(goldSetDir)) return [];
  const entries = [];
  for (const name of readdirSync(goldSetDir)) {
    if (!name.endsWith('.meta.json') || name.startsWith('_')) continue;
    const id = name.slice(0, -'.meta.json'.length);
    const metaPath = join(goldSetDir, name);
    const critiquePath = join(goldSetDir, `${id}.critique.json`);
    const entry = { id, metaPath, critiquePath };
    try {
      entry.meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    } catch (err) {
      entry.skip = `meta parse failed: ${err.message}`;
      entries.push(entry);
      continue;
    }
    if (!entry.meta || !entry.meta.consensus || typeof entry.meta.consensus !== 'object') {
      entry.skip = 'consensus missing';
      entries.push(entry);
      continue;
    }
    if (!existsSync(critiquePath)) {
      entry.skip = 'critique.json not captured yet';
      entries.push(entry);
      continue;
    }
    try {
      entry.critique = JSON.parse(readFileSync(critiquePath, 'utf8'));
    } catch (err) {
      entry.skip = `critique parse failed: ${err.message}`;
      entries.push(entry);
      continue;
    }
    if (!entry.critique.scores || typeof entry.critique.scores !== 'object') {
      entry.skip = 'critique.scores missing';
      entries.push(entry);
      continue;
    }
    entries.push(entry);
  }
  return entries;
}

// ── Spearman rank correlation ───────────────────────────────────────────────
// Implemented as Pearson correlation of ranks. Ties get the average rank of
// the tied group (standard midrank procedure). Returns null if there are
// fewer than 3 pairs or zero variance on either side.
function spearman(xs, ys) {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const rx = ranks(xs);
  const ry = ranks(ys);
  return pearson(rx, ry);
}

function ranks(arr) {
  const idx = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const out = new Array(arr.length);
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1].v === idx[i].v) j++;
    const avgRank = (i + j) / 2 + 1; // 1-indexed midrank
    for (let k = i; k <= j; k++) out[idx[k].i] = avgRank;
    i = j + 1;
  }
  return out;
}

function pearson(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xi = xs[i] - mx;
    const yi = ys[i] - my;
    num += xi * yi;
    dx += xi * xi;
    dy += yi * yi;
  }
  const den = Math.sqrt(dx * dy);
  if (den === 0) return null;
  return num / den;
}

// ── OLS linear fit: y = slope * x + intercept, minimising MSE ──────────────
function linearFit(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 1, intercept: 0, mse: null };
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 1 : num / den;
  const intercept = my - slope * mx;
  let mse = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * xs[i] + intercept;
    mse += (ys[i] - pred) ** 2;
  }
  return { slope, intercept, mse: mse / n };
}

// ── Fit one dimension ───────────────────────────────────────────────────────
function fitDimension(dim, entries) {
  const pairs = [];
  const skipped = [];
  for (const e of entries) {
    if (!e.meta || !e.critique) continue;
    // Divergent entries (raters disagree > 2 on any dimension) are excluded
    // from Spearman but may still inform the slope — we use them as "likely
    // noisy ground truth" by including them in the linear fit but not in ρ.
    const human = e.meta.consensus?.[dim];
    const raw = e.critique.scores?.[dim];
    if (typeof human !== 'number' || typeof raw !== 'number') {
      skipped.push(e.id);
      continue;
    }
    pairs.push({ id: e.id, raw, human, divergent: e.meta.consensus_confidence === 'divergent' });
  }
  const tightPairs = pairs.filter((p) => !p.divergent);
  const fit = linearFit(pairs.map((p) => p.raw), pairs.map((p) => p.human));
  const rho = tightPairs.length >= 3
    ? spearman(tightPairs.map((p) => p.raw), tightPairs.map((p) => p.human))
    : null;
  return {
    slope: roundTo(fit.slope, 4),
    intercept: roundTo(fit.intercept, 4),
    spearman_rho: rho === null ? null : roundTo(rho, 4),
    mse: fit.mse === null ? null : roundTo(fit.mse, 4),
    pair_count: pairs.length,
    tight_pair_count: tightPairs.length,
    low_correlation: rho !== null && rho < SPEARMAN_WARN_THRESHOLD,
    skipped,
  };
}

function roundTo(v, p) {
  const m = 10 ** p;
  return Math.round(v * m) / m;
}

// ── Build calibration.json ──────────────────────────────────────────────────
// When critic-identity != 'unified', non-owned dimensions get identity
// passthrough (slope=1/intercept=0/ρ=null). This lets apply-calibration.mjs
// consume the file without caring which critic produced the scores.
function buildCalibration(entries, promptHash) {
  const usable = entries.filter((e) => !e.skip);
  const status = usable.length === 0
    ? 'identity_fallback'
    : (usable.length >= FITTED_MIN_ENTRIES ? 'fitted' : 'degraded');

  const perDimension = {};
  const warnings = [];

  for (const dim of DIMENSIONS_UNIFIED) {
    const owned = OWNED_DIMENSIONS.includes(dim);
    if (!owned || status === 'identity_fallback') {
      perDimension[dim] = {
        slope: 1, intercept: 0,
        spearman_rho: null,
        mse: null,
        pair_count: 0,
        tight_pair_count: 0,
        low_correlation: false,
        ...(owned ? {} : { not_owned_by: CRITIC_IDENTITY }),
      };
      continue;
    }
    const fit = fitDimension(dim, usable);
    perDimension[dim] = fit;
    if (fit.low_correlation) {
      warnings.push(`${dim}: Spearman ρ=${fit.spearman_rho} < ${SPEARMAN_WARN_THRESHOLD} — critic unreliable on this dimension`);
    }
    if (status === 'degraded' && fit.pair_count < 5) {
      warnings.push(`${dim}: only ${fit.pair_count} pair(s) — slope is directional, not fitted`);
    }
  }

  return {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    status,
    critic_identity: CRITIC_IDENTITY,
    entry_counts: {
      total: entries.length,
      usable: usable.length,
      skipped: entries.filter((e) => e.skip).map((e) => ({ id: e.id, reason: e.skip })),
    },
    critic_prompt_hash: promptHash,
    warnings,
    per_dimension: perDimension,
  };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const promptHash = computePromptHash();
  const entries = loadGoldSet();
  const calibration = buildCalibration(entries, promptHash);

  const serialised = JSON.stringify(calibration, null, 2) + '\n';

  if (VERBOSE) {
    console.error(`[calibrate] status: ${calibration.status}`);
    console.error(`[calibrate] entries: ${calibration.entry_counts.usable} usable / ${calibration.entry_counts.total} total`);
    console.error(`[calibrate] prompt hash: ${promptHash}`);
    if (calibration.warnings.length) {
      console.error('[calibrate] warnings:');
      for (const w of calibration.warnings) console.error(`  - ${w}`);
    }
    console.error('[calibrate] per-dimension:');
    for (const [dim, fit] of Object.entries(calibration.per_dimension)) {
      const rho = fit.spearman_rho === null ? '—' : fit.spearman_rho.toFixed(2);
      console.error(`  ${dim.padEnd(18)} slope=${fit.slope.toFixed(2)}  intercept=${fit.intercept.toFixed(2)}  ρ=${rho}  n=${fit.pair_count}`);
    }
  }

  if (CHECK_MODE) {
    if (!existsSync(OUT_PATH)) {
      console.error(`[check] calibration.json missing — run calibrate.mjs`);
      process.exit(2);
    }
    const existing = readFileSync(OUT_PATH, 'utf8');
    // Normalise by re-serialising with the same tool so trailing-whitespace
    // drift doesn't produce false positives.
    const existingObj = JSON.parse(existing);
    // Ignore timestamps when comparing — the nightly run bumps generated_at
    // every time and would otherwise always fail --check.
    const a = { ...existingObj, generated_at: null };
    const b = { ...calibration, generated_at: null };
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      console.error(`[check] calibration.json is stale — regenerate with calibrate.mjs`);
      if (VERBOSE) {
        console.error('on-disk:', JSON.stringify(a, null, 2));
        console.error('fresh:',   JSON.stringify(b, null, 2));
      }
      process.exit(2);
    }
    console.error(`[check] calibration.json is fresh (${calibration.status}, ${calibration.entry_counts.usable} usable entries)`);
    process.exit(0);
  }

  if (DRY_RUN) {
    process.stdout.write(serialised);
    return;
  }

  writeFileSync(OUT_PATH, serialised, 'utf8');
  console.error(`[calibrate] wrote ${OUT_PATH} (${calibration.status}, ${calibration.entry_counts.usable} usable entries)`);

  // ── Sprint 6 Task 19.4: Pareto frontier update ─────────────────────────
  // Only propose a frontier update when we have a real fit — identity
  // fallback tells us nothing about prompt quality. The frontier module
  // handles its own deduplication and supersession bookkeeping.
  if (UPDATE_FRONTIER && calibration.status !== 'identity_fallback') {
    try {
      // Dynamic import to avoid loading the pareto module when the user
      // ran --dry-run / --check — those paths shouldn't touch project-
      // local state.
      const { proposeFrontierUpdate } = await import(join(repoRoot, 'hooks', 'scripts', 'lib', 'pareto.mjs').replace(/\\/g, '/'));
      const rhoMap = {};
      for (const [dim, fit] of Object.entries(calibration.per_dimension)) {
        if (typeof fit.spearman_rho === 'number') rhoMap[dim] = fit.spearman_rho;
      }
      const result = proposeFrontierUpdate({
        criticIdentity: CRITIC_IDENTITY,
        promptHash,
        sampleCount: calibration.entry_counts.usable,
        spearmanRhoPerDim: rhoMap,
        calibrationPath: OUT_PATH,
        notes: calibration.warnings.slice(0, 5),
      });
      if (VERBOSE) {
        if (result.added) {
          console.error(`[calibrate] pareto: added entry ${result.entry.id} wins on ${result.entry.wins_on_dimensions.join(', ')}`);
          if (result.superseded.length) console.error(`[calibrate] pareto: superseded ${result.superseded.join(', ')}`);
        } else {
          console.error(`[calibrate] pareto: skipped (${result.skipped_reason})`);
        }
      }
    } catch (err) {
      console.error(`[calibrate] pareto: non-fatal — ${err.message}`);
    }
  }
}

main();
