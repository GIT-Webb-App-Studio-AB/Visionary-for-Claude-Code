// Tie detection — Sprint 12.
// Identifies dimensions where the heuristic + numeric + DINOv2 stack
// is uncertain enough to warrant an MLLM judge call. Returns a
// prioritised list; the budget layer decides how many to actually invoke.

const TIE_THRESHOLD_DIFF = 0.3;          // composite-score diff inside which two candidates are a tie
const LOW_CONFIDENCE_THRESHOLD = 0.6;    // critic self-reported confidence below this triggers tie
const CONFLICT_DIFF = 1.5;               // |heuristic - visual| above this triggers conflict-tie

export function detectTies(critiqueState) {
  const ties = [];
  if (!critiqueState) return ties;

  // Case 1: best-of-N candidates with composite-diff <= 0.3
  if (Array.isArray(critiqueState.candidates) && critiqueState.candidates.length >= 2) {
    for (let i = 0; i < critiqueState.candidates.length; i++) {
      for (let j = i + 1; j < critiqueState.candidates.length; j++) {
        const diff = Math.abs(
          (critiqueState.candidates[i].composite_score ?? 0) -
          (critiqueState.candidates[j].composite_score ?? 0)
        );
        if (diff <= TIE_THRESHOLD_DIFF) {
          ties.push({
            dim: 'composite',
            candidates: [i, j],
            reason: 'composite-diff-<=-0.3',
            diff,
          });
        }
      }
    }
  }

  // Case 2: per-dim low confidence
  if (critiqueState.confidence) {
    for (const [dim, conf] of Object.entries(critiqueState.confidence)) {
      const normalized = typeof conf === 'number' ? conf / 5 : null;
      if (normalized !== null && normalized < LOW_CONFIDENCE_THRESHOLD) {
        ties.push({
          dim,
          candidates: null,
          reason: 'low-confidence',
          confidence: normalized,
        });
      }
    }
  }

  // Case 3: heuristic vs visual stack conflict
  if (critiqueState.heuristic_scores && critiqueState.visual_scores) {
    for (const dim of Object.keys(critiqueState.heuristic_scores)) {
      const h = critiqueState.heuristic_scores[dim];
      const v = critiqueState.visual_scores[dim];
      if (typeof h !== 'number' || typeof v !== 'number') continue;
      if (Math.abs(h - v) >= CONFLICT_DIFF) {
        ties.push({
          dim,
          candidates: null,
          reason: 'heuristic-visual-conflict',
          spread: Math.abs(h - v),
        });
      }
    }
  }

  return ties;
}

export function pickHighestPriorityTie(ties) {
  if (!ties || ties.length === 0) return null;
  // Priority: conflict > composite > low-confidence
  const order = { 'heuristic-visual-conflict': 0, 'composite-diff-<=-0.3': 1, 'low-confidence': 2 };
  const sorted = [...ties].sort((a, b) => (order[a.reason] ?? 99) - (order[b.reason] ?? 99));
  return sorted[0];
}

export const THRESHOLDS = {
  TIE_THRESHOLD_DIFF,
  LOW_CONFIDENCE_THRESHOLD,
  CONFLICT_DIFF,
};
