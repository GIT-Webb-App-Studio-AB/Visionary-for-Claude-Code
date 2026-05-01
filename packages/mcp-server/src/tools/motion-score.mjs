// MCP tool: visionary.motion_score
//
// Wraps Motion Scoring 2.0 (6 sub-dim weighted aggregator + Maturity Model).
// Returns the full result object including subscores, evidence, detector
// metadata, and tier classification.

import { scoreMotion2, WEIGHTS, TIER_NAMES } from '../../../../hooks/scripts/lib/motion/scorer-2.mjs';

export const tool = {
  name: 'visionary.motion_score',
  description:
    'Run Motion Scoring 2.0 on source code. Returns total_score [0..1], motion_readiness_10 [0..10], a tier 0..4 (None/Subtle/Expressive/Kinetic/Cinematic), six sub-scores (easing_provenance, aars_pattern, timing_consistency, narrative_arc, reduced_motion, cinema_easing), structured evidence per sub-detector, and detector_meta. Deterministic: same input → same output.',
  inputSchema: {
    type: 'object',
    required: ['source'],
    properties: {
      source: {
        type: 'string',
        description: 'Source code (JSX/CSS/HTML) to score for motion craft.',
      },
    },
  },
  async handler(args) {
    const source = typeof args.source === 'string' ? args.source : '';
    const result = scoreMotion2(source);
    // Surface the weights so the caller can interpret subscore impact without
    // a second tool call. Frozen object → safe to spread.
    const enriched = {
      ...result,
      weights: { ...WEIGHTS },
      tier_names: [...TIER_NAMES],
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(enriched, null, 2) }],
    };
  },
};
