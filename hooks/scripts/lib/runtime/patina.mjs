// patina.mjs — Sprint 23 Task 42.3
// Designen åldras med projektet. Token-drift via git blame on the source file.
// Hard-floor on APCA Lc 60 (chroma cannot fall past minimum that breaks contrast).
//
// All drift rates are per month. Floors clamp the result so an old file never
// degenerates beyond legibility.

import { execFileSync } from 'node:child_process';
import { dirname, basename } from 'node:path';

/** Drift rates per month (compound additively, not multiplicatively). */
export const DRIFT_RATES = {
  chroma:           -0.02, // -2% chroma per month
  border_radius:     0.5,  // +0.5px radius per month
  motion_duration:   5,    // +5ms motion duration per month
  edge_sharpness:   -0.01, // -1% edge-sharpness per month
};

/** Hard floors — drifted tokens must not pass these. */
export const FLOORS = {
  chroma: 0.05,           // chroma never below 0.05 (APCA Lc 60 ≈ chroma >= ~0.05)
  edge_sharpness: 0.3,    // never softer than 30% sharp
  apca_lc: 60,            // referenced by other modules
};

/**
 * getFileAgeMonths(filePath) → number of months since the first commit of `filePath`.
 *
 * Uses `git log --follow --format=%ad --date=iso --reverse -- <file>` (via execFileSync,
 * no shell) to find the earliest commit timestamp. Returns 0 on any failure
 * (untracked file, no git, etc.).
 */
export function getFileAgeMonths(filePath) {
  try {
    const cwd = dirname(filePath);
    const file = basename(filePath);
    // execFileSync — argv array, no shell, no injection surface.
    const stdout = execFileSync(
      'git',
      ['log', '--follow', '--format=%ad', '--date=iso', '--reverse', '--', file],
      { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const firstLine = stdout.split(/\r?\n/).find((l) => l.trim().length > 0);
    if (!firstLine) return 0;
    const date = new Date(firstLine.trim());
    if (Number.isNaN(date.getTime())) return 0;
    const monthsAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return Math.max(0, monthsAgo);
  } catch {
    return 0;
  }
}

/**
 * applyPatina({ baseTokens, ageMonths, freezeAt? }) → { drifted, effectiveAge, drifts_applied, floors_hit }
 *
 * Applies drift rates additively to numeric tokens. Tokens absent from baseTokens are
 * not invented. `freezeAt` (months) caps the effective age — used by the freeze-mechanism
 * for stable releases.
 */
export function applyPatina({ baseTokens, ageMonths, freezeAt = null }) {
  if (!baseTokens || typeof baseTokens !== 'object') {
    throw new Error('applyPatina: baseTokens object required');
  }
  if (typeof ageMonths !== 'number' || Number.isNaN(ageMonths)) {
    throw new Error('applyPatina: ageMonths must be a finite number');
  }

  const effectiveAge = freezeAt !== null && freezeAt !== undefined
    ? Math.min(ageMonths, freezeAt)
    : ageMonths;

  const drifted = { ...baseTokens };
  const drifts_applied = [];
  const floors_hit = [];

  if (typeof drifted.chroma === 'number') {
    const before = drifted.chroma;
    let next = before + DRIFT_RATES.chroma * effectiveAge;
    if (next < FLOORS.chroma) {
      next = FLOORS.chroma;
      floors_hit.push({ token: 'chroma', floor: FLOORS.chroma });
    }
    drifted.chroma = next;
    if (before !== next) drifts_applied.push('chroma');
  }

  if (typeof drifted.border_radius === 'number') {
    const before = drifted.border_radius;
    drifted.border_radius = before + DRIFT_RATES.border_radius * effectiveAge;
    if (before !== drifted.border_radius) drifts_applied.push('border_radius');
  }

  if (typeof drifted.motion_duration === 'number') {
    const before = drifted.motion_duration;
    drifted.motion_duration = before + DRIFT_RATES.motion_duration * effectiveAge;
    if (before !== drifted.motion_duration) drifts_applied.push('motion_duration');
  }

  if (typeof drifted.edge_sharpness === 'number') {
    const before = drifted.edge_sharpness;
    let next = before + DRIFT_RATES.edge_sharpness * effectiveAge;
    if (next < FLOORS.edge_sharpness) {
      next = FLOORS.edge_sharpness;
      floors_hit.push({ token: 'edge_sharpness', floor: FLOORS.edge_sharpness });
    }
    drifted.edge_sharpness = next;
    if (before !== next) drifts_applied.push('edge_sharpness');
  }

  return { drifted, effectiveAge, drifts_applied, floors_hit };
}

/**
 * patinaStatus(filePath) — summary used by `/visionary-patina status`.
 * Returns the file age, the rates per month, and the *projected* total drift
 * if the file's tokens were all defaulted.
 */
export function patinaStatus(filePath) {
  const age = getFileAgeMonths(filePath);
  return {
    file: filePath,
    age_months: Math.round(age * 10) / 10,
    estimated_drifts: Object.entries(DRIFT_RATES).map(([token, rate]) => ({
      token,
      rate_per_month: rate,
      total_drift: rate * age,
    })),
  };
}
