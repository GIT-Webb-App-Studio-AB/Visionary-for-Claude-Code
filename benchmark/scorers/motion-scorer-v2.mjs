// Motion Scoring 2.0 wrapper — Sprint 9.
//
// Adapts the new 6-sub-dimension scorer to the benchmark runner's
// expected single-number 0..5 contract. Internally calls scoreMotion2
// (0..1 total) and scales to the legacy range. Reports are emitted to
// stderr when VISIONARY_MOTION_VERBOSE is set, including per-dim
// subscores and the Motion Maturity tier.
//
// Toggle: VISIONARY_MOTION_SCORER_V2=0 disables and falls back to v1.

import { scoreMotion } from './motion-scorer.mjs';
import { scoreMotion2 } from '../../hooks/scripts/lib/motion/scorer-2.mjs';

const ENABLED = process.env.VISIONARY_MOTION_SCORER_V2 !== '0';
const VERBOSE = process.env.VISIONARY_MOTION_VERBOSE === '1';

export function scoreMotionV2(source, promptContext) {
  if (!ENABLED) return scoreMotion(source, promptContext);

  const result = scoreMotion2(source);
  const scaled = Math.round(result.total_score * 5 * 2) / 2;

  if (VERBOSE) {
    process.stderr.write(
      `[motion-v2] tier=${result.tier_name} total=${result.total_score} ` +
      `(easing=${result.subscores.easing_provenance}, aars=${result.subscores.aars_pattern}, ` +
      `timing=${result.subscores.timing_consistency}, narrative=${result.subscores.narrative_arc}, ` +
      `rm=${result.subscores.reduced_motion}, cinema=${result.subscores.cinema_easing})\n`
    );
  }

  return Math.max(1, Math.min(5, scaled));
}

export function scoreMotionV2Detailed(source, promptContext) {
  const v2 = scoreMotion2(source);
  const v1 = scoreMotion(source, promptContext);
  return {
    v1_score: v1,
    v2: v2,
  };
}

export { scoreMotion2 };
