// MLLM Judge prompt builder — Sprint 12.
// Constructs a strict-JSON pairwise judge prompt focused on a single
// critique dimension. Rubrics live as inline strings (not markdown
// imports) so the prompt is self-contained.

const RUBRICS = {
  hierarchy: 'Visual hierarchy: clear focal point, body text reachable in <2s, secondary actions visually subordinate. Score the version where the eye lands first on the right thing.',
  layout: 'Layout: grid alignment, intentional whitespace, balanced composition. Score the version with stronger spatial discipline.',
  typography: 'Typography: type scale rhythm, line-height consistency, deliberate weight contrast. Score the version with more controlled type pairing.',
  contrast: 'Contrast: WCAG AA + APCA Lc compliance for body text and UI. Penalise low contrast on critical elements.',
  distinctiveness: 'Distinctiveness: how visually distinct is this from generic AI output (saas-default-blue, glassmorphism, cyan-on-dark)? Reward decisions that announce a point of view.',
  brief_conformance: 'Brief conformance: does the version answer the brief? Penalise cosmetically polished work that drifts from intent.',
  accessibility: 'Accessibility: focus rings visible, touch targets ≥44px (relax to 24px only for terminal-like dense UIs), reduced-motion fallback.',
  motion_readiness: 'Motion readiness: spring tokens or linear() multi-stop easing > generic ease. AARS 4-phase keyframes > linear ramp. Reduced-motion guard required for any transform > 8px.',
  craft_measurable: 'Craft (mechanical): contrast entropy, gestalt grouping, modular type rhythm, ΔE2000 colour harmony. Reward the version with higher numeric_scores composite.',
  content_resilience: 'Content resilience: layout holds under p95 length, empty states are designed, nullable fields handled. Penalise versions that depend on Lorem-Ipsum-perfect data.',
  visual_style_match: 'Visual style match: how well does the rendered output reflect the declared style identity (oxblood-editorial vs cyan-on-dark drift)? Use cosine similarity intuition.',
};

export function listRubrics() {
  return Object.keys(RUBRICS);
}

export function buildJudgePrompt({ dimension, screenshotA, screenshotB, briefSummary }) {
  const rubric = RUBRICS[dimension] || 'Score the version that better satisfies the implicit craft expectations of this dimension.';

  const promptText = [
    `You are a visual craft adjudicator. You see two renders of the same component, A and B.`,
    `The numeric + heuristic + DINOv2 stack disagrees on the dimension "${dimension}".`,
    ``,
    `Judge ONLY this dimension. Do not comment on other dimensions.`,
    ``,
    `Brief summary: ${briefSummary || '(not provided)'}`,
    ``,
    `Rubric for "${dimension}":`,
    rubric,
    ``,
    `Anti-bias: ignore ambient lighting, shadow opacity, jpeg compression artefacts.`,
    `Focus on dimension-specific craft cues only.`,
    ``,
    `Output STRICT JSON, no prose around it:`,
    `{"winner": "A"|"B"|"tie", "rationale": "<one sentence, max 240 chars>", "confidence": <0..1>}`,
  ].join('\n');

  return {
    text: promptText,
    images: [
      { label: 'A', path: screenshotA },
      { label: 'B', path: screenshotB },
    ],
    dimension,
  };
}
