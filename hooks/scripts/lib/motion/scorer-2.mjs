// Motion Scoring 2.0 aggregator — Sprint 9.
//
// Combines six sub-detectors into a weighted total in [0..1] and a
// 5-level Motion Maturity Model classification (0=None .. 4=Cinematic).
// Sub-scores are returned alongside so the critic prompt can cite the
// exact dim that drags the total down. Replaces the legacy single-shot
// motion-readiness heuristic when VISIONARY_MOTION_SCORER_V2 != 0.

import { scoreEasingProvenance } from './easing-provenance.mjs';
import { scoreAarsPattern } from './aars-pattern.mjs';
import { scoreTimingConsistency } from './timing-consistency.mjs';
import { scoreNarrativeArc } from './narrative-arc.mjs';
import { scoreReducedMotionCompliance } from './reduced-motion-compliance.mjs';
import { scoreCinemaEasing } from './cinema-easing.mjs';

export const WEIGHTS = Object.freeze({
  easing_provenance: 0.20,
  aars_pattern: 0.20,
  timing_consistency: 0.15,
  narrative_arc: 0.15,
  reduced_motion: 0.15,
  cinema_easing: 0.15,
});

export const TIER_NAMES = ['None', 'Subtle', 'Expressive', 'Kinetic', 'Cinematic'];

const ANY_MOTION_RE = /(transition\s*:|@keyframes|animation\s*:|animate\s*=|motion\.(div|span|button|nav|header|footer|section|article|aside|main|form|p|h1|h2|h3|h4|h5|h6|ul|ol|li|a|img|svg)|spring\.(snappy|bounce|micro|gentle|ui|layout)|bounce\s*:|visualDuration\s*:)/i;

function classifyTier(total, subscores) {
  if (!ANY_MOTION_RE.test(subscores.__src || '')) {
    return { tier: 0, name: TIER_NAMES[0] };
  }
  if (total < 0.4) return { tier: 1, name: TIER_NAMES[1] };
  if (total < 0.65) return { tier: 2, name: TIER_NAMES[2] };

  const meetsKinetic =
    subscores.aars_pattern >= 0.6 &&
    subscores.cinema_easing >= 0.5;
  if (total < 0.85 || !meetsKinetic) {
    return meetsKinetic
      ? { tier: 3, name: TIER_NAMES[3] }
      : { tier: 2, name: TIER_NAMES[2] };
  }

  const meetsCinematic = Object.keys(WEIGHTS).every((key) => subscores[key] >= 0.6);
  return meetsCinematic
    ? { tier: 4, name: TIER_NAMES[4] }
    : { tier: 3, name: TIER_NAMES[3] };
}

export function scoreMotion2(source) {
  const src = source || '';

  const easing = scoreEasingProvenance(src);
  const aars = scoreAarsPattern(src);
  const timing = scoreTimingConsistency(src);
  const narrative = scoreNarrativeArc(src);
  const reducedMotion = scoreReducedMotionCompliance(src);
  const cinema = scoreCinemaEasing(src);

  const subscores = {
    easing_provenance: easing.score,
    aars_pattern: aars.score,
    timing_consistency: timing.score,
    narrative_arc: narrative.score,
    reduced_motion: reducedMotion.score,
    cinema_easing: cinema.score,
  };

  const totalRaw =
    subscores.easing_provenance * WEIGHTS.easing_provenance +
    subscores.aars_pattern * WEIGHTS.aars_pattern +
    subscores.timing_consistency * WEIGHTS.timing_consistency +
    subscores.narrative_arc * WEIGHTS.narrative_arc +
    subscores.reduced_motion * WEIGHTS.reduced_motion +
    subscores.cinema_easing * WEIGHTS.cinema_easing;

  const total = +totalRaw.toFixed(3);
  const tier = classifyTier(total, { ...subscores, __src: src });

  const evidence = [
    ...easing.evidence.map((e) => ({ ...e, dim: 'easing_provenance' })),
    ...aars.evidence.map((e) => ({ ...e, dim: 'aars_pattern' })),
    ...timing.evidence.map((e) => ({ ...e, dim: 'timing_consistency' })),
    ...narrative.evidence.map((e) => ({ ...e, dim: 'narrative_arc' })),
    ...reducedMotion.evidence.map((e) => ({ ...e, dim: 'reduced_motion' })),
    ...cinema.evidence.map((e) => ({ ...e, dim: 'cinema_easing' })),
  ];

  return {
    total_score: total,
    motion_readiness_10: +(total * 10).toFixed(2),
    tier: tier.tier,
    tier_name: tier.name,
    subscores,
    evidence,
    detector_meta: {
      aars_phases_detected: aars.phases_detected,
      timing_sigma_ms: timing.sigma_ms,
      timing_distinct_durations: timing.distinct_durations,
      narrative_layered_count: narrative.layered_count,
      narrative_has_stagger: narrative.has_stagger,
      reduced_motion_has_guard: reducedMotion.has_guard,
      cinema_has_overshoot: cinema.has_overshoot,
      cinema_linear_stops_max: cinema.linear_stops_max,
    },
  };
}

export function applyCalibration(result, calibration) {
  if (!calibration || !calibration.subscores) return result;
  const calibrated = { ...result, subscores: { ...result.subscores } };
  for (const key of Object.keys(WEIGHTS)) {
    const fit = calibration.subscores[key];
    if (!fit) continue;
    const raw = result.subscores[key];
    const adj = (fit.slope ?? 1) * raw + (fit.intercept ?? 0);
    calibrated.subscores[key] = Math.max(0, Math.min(1, +adj.toFixed(3)));
  }
  let total = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    total += calibrated.subscores[key] * weight;
  }
  calibrated.total_score = +total.toFixed(3);
  calibrated.motion_readiness_10 = +(total * 10).toFixed(2);
  const tier = classifyTier(calibrated.total_score, {
    ...calibrated.subscores,
    __src: '',
  });
  calibrated.tier = tier.tier;
  calibrated.tier_name = tier.name;
  return calibrated;
}
