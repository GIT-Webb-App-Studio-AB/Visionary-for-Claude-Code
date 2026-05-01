// Judge policy — Sprint 12.
// Applies the hard rule: judge cannot single-handedly reject. It can
// (1) break a heuristic tie, (2) raise confidence on a heuristic-favoured
// candidate, or (3) be overridden when its vote contradicts a strong
// heuristic signal.

const STRONG_HEURISTIC_MARGIN = 1.5;  // dim-score units

export function applyJudgePolicy({ judgeOutput, heuristicState }) {
  if (!judgeOutput || judgeOutput.skipped) {
    return { chosen_winner: heuristicState?.preferred_winner ?? null, used_judge: false, override_reason: null };
  }

  if (judgeOutput.winner === 'tie' || (judgeOutput.confidence ?? 0) < 0.5) {
    return {
      chosen_winner: heuristicState?.preferred_winner ?? null,
      used_judge: false,
      override_reason: 'judge-low-confidence',
    };
  }

  // Heuristic strongly disagrees → heuristic wins, judge becomes metadata
  const judgeWinner = judgeOutput.winner;
  const heuristicWinner = heuristicState?.preferred_winner;
  const heuristicMargin = heuristicState?.margin ?? 0;

  if (heuristicWinner && heuristicWinner !== judgeWinner && heuristicMargin >= STRONG_HEURISTIC_MARGIN) {
    return {
      chosen_winner: heuristicWinner,
      used_judge: false,
      override_reason: 'heuristic-strong-margin-overrides-judge',
      judge_dissent: judgeWinner,
    };
  }

  return {
    chosen_winner: judgeWinner,
    used_judge: true,
    override_reason: null,
    confidence: judgeOutput.confidence,
  };
}

export const POLICY_CONSTANTS = { STRONG_HEURISTIC_MARGIN };
