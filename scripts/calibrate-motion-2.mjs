#!/usr/bin/env node
// Sprint 9 Task 24.9 — per-sub-dim linear calibration for Motion Scoring 2.0.
//
// Reads benchmark/gold-set/*.motion.json (an array of {source, human_subscores})
// and fits ridge regression per sub-dim against scoreMotion2 outputs. Saves
// the fit to skills/visionary/calibration/motion-2.json so scorer-2 can apply
// it at runtime via applyCalibration.
//
// Usage:
//   node scripts/calibrate-motion-2.mjs            # fit + save
//   node scripts/calibrate-motion-2.mjs --report   # print R² + residual stats
//   node scripts/calibrate-motion-2.mjs --dry-run  # fit but don't save

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreMotion2 } from '../hooks/scripts/lib/motion/scorer-2.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO = dirname(dirname(__filename));
const GOLD_DIR = join(REPO, 'benchmark', 'gold-set');
const OUT_DIR = join(REPO, 'skills', 'visionary', 'calibration');
const OUT_PATH = join(OUT_DIR, 'motion-2.json');

const SUB_DIMS = [
  'easing_provenance',
  'aars_pattern',
  'timing_consistency',
  'narrative_arc',
  'reduced_motion',
  'cinema_easing',
];

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const REPORT_ONLY = args.has('--report');

async function loadGoldSet() {
  if (!existsSync(GOLD_DIR)) return [];
  const entries = [];
  const files = await readdir(GOLD_DIR);
  for (const f of files) {
    if (!f.endsWith('.motion.json')) continue;
    try {
      const raw = await readFile(join(GOLD_DIR, f), 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) entries.push(...data);
      else entries.push(data);
    } catch (err) {
      process.stderr.write(`[skip] ${f}: ${err.message}\n`);
    }
  }
  return entries;
}

function fitLinear(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 1, intercept: 0, r2: null };
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denomX = 0, denomY = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    denomX += (xs[i] - meanX) ** 2;
    denomY += (ys[i] - meanY) ** 2;
  }
  if (denomX === 0) return { slope: 0, intercept: meanY, r2: 0 };
  const slope = num / denomX;
  const intercept = meanY - slope * meanX;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * xs[i] + intercept;
    ssRes += (ys[i] - pred) ** 2;
  }
  const r2 = denomY === 0 ? null : 1 - ssRes / denomY;
  return {
    slope: +slope.toFixed(4),
    intercept: +intercept.toFixed(4),
    r2: r2 === null ? null : +r2.toFixed(3),
  };
}

async function main() {
  const goldSet = await loadGoldSet();
  if (goldSet.length === 0) {
    const fallback = {
      mode: 'identity_fallback',
      reason: 'no gold-set entries found at benchmark/gold-set/*.motion.json',
      n: 0,
      generated_at: new Date().toISOString(),
      subscores: Object.fromEntries(
        SUB_DIMS.map((d) => [d, { slope: 1, intercept: 0, r2: null }]),
      ),
    };
    if (!DRY_RUN && !REPORT_ONLY) {
      await mkdir(OUT_DIR, { recursive: true });
      await writeFile(OUT_PATH, JSON.stringify(fallback, null, 2));
    }
    process.stderr.write(
      `Identity fallback (no gold-set). ${DRY_RUN ? '(dry-run)' : 'Saved.'}\n`,
    );
    return;
  }

  const xs = Object.fromEntries(SUB_DIMS.map((d) => [d, []]));
  const ys = Object.fromEntries(SUB_DIMS.map((d) => [d, []]));

  for (const entry of goldSet) {
    if (!entry.source || !entry.human_subscores) continue;
    const machine = scoreMotion2(entry.source);
    for (const dim of SUB_DIMS) {
      const human = entry.human_subscores[dim];
      if (typeof human !== 'number') continue;
      xs[dim].push(machine.subscores[dim]);
      ys[dim].push(human);
    }
  }

  const fit = {
    mode: goldSet.length >= 10 ? 'fitted' : 'degraded',
    n: goldSet.length,
    generated_at: new Date().toISOString(),
    subscores: {},
  };

  process.stderr.write(`Calibrating against n=${goldSet.length} gold-set entries\n`);
  for (const dim of SUB_DIMS) {
    fit.subscores[dim] = fitLinear(xs[dim], ys[dim]);
    process.stderr.write(
      `  ${dim}: slope=${fit.subscores[dim].slope} intercept=${fit.subscores[dim].intercept} r²=${fit.subscores[dim].r2}\n`,
    );
  }

  if (REPORT_ONLY) return;
  if (DRY_RUN) {
    process.stderr.write('(dry-run, not saving)\n');
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(fit, null, 2));
  process.stderr.write(`Saved to ${OUT_PATH}\n`);
}

main().catch((err) => {
  process.stderr.write(`[error] ${err.message}\n`);
  process.exit(1);
});
