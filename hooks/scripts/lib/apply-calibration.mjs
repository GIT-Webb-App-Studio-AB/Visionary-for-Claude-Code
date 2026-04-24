// Runtime calibration — Sprint 3 Task 8.3.
//
// Applies the per-dimension linear fit from skills/visionary/calibration.json
// to a critique's raw scores BEFORE the loop-control threshold gates run.
// Pure function; the hook or Claude can call either the function or the CLI
// to transform a critique.
//
// Contract:
//
//   applyCalibration(critique, calibration)
//     → {
//         critique: <new critique with raw_scores preserved + scores replaced
//                    by calibrated values when calibration was applied;
//                    unchanged when calibration was skipped>,
//         applied: boolean,
//         reason: "ok" | "identity_fallback" | "absent" | "prompt_hash_mismatch"
//                 | "corrupt_critique" | "corrupt_calibration",
//         warnings: string[]
//       }
//
// Design rules:
//
//   1. Raw scores are preserved under `raw_scores` whenever calibration is
//      applied. `scores` becomes the calibrated view — this is what the
//      runtime gates on (early-exit, escalation, convergence).
//
//   2. Calibration is only applied when calibration.status === "fitted" AND
//      calibration.critic_prompt_hash matches critique.prompt_hash. All
//      other paths (absent, identity_fallback, stale hash, corrupt file)
//      return the critique untouched with a reason and warnings.
//
//   3. Null-valued scores (legitimate null for craft_measurable when the
//      numeric scorer was disabled) survive calibration untouched.
//
//   4. Clamp to [0, 10] after fitting — calibrations can produce values
//      outside the original range, but downstream consumers assume the
//      scale is preserved.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const CORE_DIMENSIONS = Object.freeze([
  'hierarchy', 'layout', 'typography', 'contrast',
  'distinctiveness', 'brief_conformance', 'accessibility', 'motion_readiness',
]);
export const OPTIONAL_DIMENSIONS = Object.freeze(['craft_measurable']);
export const DIMENSIONS = Object.freeze([...CORE_DIMENSIONS, ...OPTIONAL_DIMENSIONS]);

export function applyCalibration(critique, calibration) {
  const warnings = [];

  if (!critique || typeof critique !== 'object' || !critique.scores || typeof critique.scores !== 'object') {
    return { critique, applied: false, reason: 'corrupt_critique', warnings: ['critique shape invalid'] };
  }
  if (!calibration || typeof calibration !== 'object') {
    return { critique, applied: false, reason: 'absent', warnings: ['calibration absent — running uncalibrated'] };
  }
  if (!calibration.per_dimension || typeof calibration.per_dimension !== 'object') {
    return { critique, applied: false, reason: 'corrupt_calibration', warnings: ['calibration.per_dimension missing'] };
  }

  const status = calibration.status;
  if (status === 'identity_fallback') {
    return {
      critique,
      applied: false,
      reason: 'identity_fallback',
      warnings: ['calibration in identity_fallback mode (gold-set empty) — running uncalibrated'],
    };
  }

  const calibHash = calibration.critic_prompt_hash;
  const critHash = critique.prompt_hash;
  if (typeof calibHash === 'string' && typeof critHash === 'string' && calibHash !== critHash) {
    return {
      critique,
      applied: false,
      reason: 'prompt_hash_mismatch',
      warnings: [
        `prompt_hash mismatch (critique=${critHash}, calibration=${calibHash}) — running uncalibrated; nightly CI will refit against the new prompt.`,
      ],
    };
  }

  const calibrated = {};
  const rawScores = {};
  for (const dim of DIMENSIONS) {
    const raw = critique.scores[dim];
    rawScores[dim] = raw;
    if (raw === null || raw === undefined) {
      calibrated[dim] = raw;
      continue;
    }
    if (typeof raw !== 'number') {
      calibrated[dim] = raw;
      warnings.push(`${dim}: non-numeric raw score preserved as-is`);
      continue;
    }
    const cal = calibration.per_dimension[dim];
    if (!cal || typeof cal.slope !== 'number' || typeof cal.intercept !== 'number') {
      calibrated[dim] = raw;
      warnings.push(`${dim}: calibration entry missing — raw value kept`);
      continue;
    }
    if (cal.low_correlation) {
      warnings.push(`${dim}: calibration.spearman_rho < 0.6 — applied but untrustworthy`);
    }
    const fitted = cal.slope * raw + cal.intercept;
    calibrated[dim] = clamp(fitted, 0, 10);
  }

  return {
    critique: {
      ...critique,
      raw_scores: rawScores,
      scores: calibrated,
      calibration_applied: true,
      calibration_status: status || null,
    },
    applied: true,
    reason: 'ok',
    warnings,
  };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ── CLI ─────────────────────────────────────────────────────────────────────
// Usage:
//   node apply-calibration.mjs --critique <path> --calibration <path> [--out <path>]
//
// Exits 0 on success (whether or not calibration was applied — the JSON
// always emits); exits 1 on parse errors.

function _cliMain() {
  const flag = (n) => {
    const i = process.argv.indexOf(`--${n}`);
    return i === -1 ? null : process.argv[i + 1];
  };
  const critiquePath = flag('critique');
  const calibrationPath = flag('calibration');
  const outPath = flag('out');

  if (!critiquePath || !calibrationPath) {
    process.stderr.write('usage: apply-calibration.mjs --critique <path> --calibration <path> [--out <path>]\n');
    process.exit(2);
  }
  const critique = safeReadJson(critiquePath);
  const calibration = existsSync(calibrationPath) ? safeReadJson(calibrationPath) : null;
  if (!critique) { process.stderr.write(`critique parse failed: ${critiquePath}\n`); process.exit(1); }

  const result = applyCalibration(critique, calibration);
  const out = JSON.stringify(result, null, 2) + '\n';
  if (outPath) writeFileSync(outPath, out, 'utf8');
  else process.stdout.write(out);

  if (result.warnings.length) {
    for (const w of result.warnings) process.stderr.write(`[apply-calibration] ${w}\n`);
  }
}

function safeReadJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch { return null; }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  _cliMain();
}
