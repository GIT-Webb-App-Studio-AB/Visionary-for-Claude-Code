// Motion Scoring 2.0 inject — Sprint 9 Task 24.10.
//
// Builds a compact additionalContext block for the visual-critic that
// shows the 6 sub-scores + tier so the critic can cite the exact
// dimension that drags motion_readiness down. Returns empty string when
// disabled via VISIONARY_MOTION_SCORER_V2=0 so the existing prose-only
// path is unchanged.

import { scoreMotion2 } from './scorer-2.mjs';

const ENABLED = process.env.VISIONARY_MOTION_SCORER_V2 !== '0';

export function buildMotionContextBlock(source) {
  if (!ENABLED) return '';
  if (!source) return '';

  const result = scoreMotion2(source);

  const subscoreLines = [
    `  easing_provenance:   ${result.subscores.easing_provenance.toFixed(2)}`,
    `  aars_pattern:        ${result.subscores.aars_pattern.toFixed(2)}`,
    `  timing_consistency:  ${result.subscores.timing_consistency.toFixed(2)}`,
    `  narrative_arc:       ${result.subscores.narrative_arc.toFixed(2)}`,
    `  reduced_motion:      ${result.subscores.reduced_motion.toFixed(2)}`,
    `  cinema_easing:       ${result.subscores.cinema_easing.toFixed(2)}`,
  ].join('\n');

  return [
    '',
    '── Motion Scoring 2.0 (Sprint 9) ─────────────────────────────────',
    `Aggregate motion_readiness_10 = ${result.motion_readiness_10}`,
    `Maturity tier: ${result.tier} (${result.tier_name})`,
    `Subscores (each 0..1, weighted into the 0..10 dim):`,
    subscoreLines,
    '',
    `If you score motion_readiness < 7, you MUST cite which sub-dim drags it down`,
    `(use evidence.type='metric' with value like 'motion.aars_pattern=0.32').`,
    `Tier interpretation: 0=None · 1=Subtle · 2=Expressive · 3=Kinetic · 4=Cinematic.`,
    'Do NOT over-rely on this aggregate — combine with rendered behaviour from screenshots.',
    '──────────────────────────────────────────────────────────────────',
  ].join('\n');
}

export function getMotionScoreSummary(source) {
  if (!ENABLED) return null;
  return scoreMotion2(source || '');
}
