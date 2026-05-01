// Conflict resolution — Sprint 15.
// Strategy A: designer-as-tie-breaker for craft-vs-aesthetic ties.
// Strategy B: MLLM judge invocation when A is insufficient (Sprint 12).
// Strategy C: user escalation when both fail.

const TIE_THRESHOLD = 1.0; // craft and aesthetic spread <= 1.0 is a tie
const CONFLICT_THRESHOLD = 2.5; // max-min spread > 2.5 = conflict requiring resolution

export function isConflict(scoresPerCritic) {
  const values = Object.values(scoresPerCritic).filter((v) => typeof v === 'number');
  if (values.length < 2) return false;
  const max = Math.max(...values);
  const min = Math.min(...values);
  return (max - min) > CONFLICT_THRESHOLD;
}

export function strategyA_designerTiebreak({ craft, aesthetic, designer }) {
  if (typeof craft !== 'number' || typeof aesthetic !== 'number') return null;
  if (typeof designer !== 'number') return null;
  if (Math.abs(craft - aesthetic) > TIE_THRESHOLD) return null;

  // Designer breaks the tie
  const tieMid = (craft + aesthetic) / 2;
  const designerInfluence = (designer - tieMid) * 0.5;
  const final = +(tieMid + designerInfluence).toFixed(2);
  return { method: 'tie_break', final_score: final };
}

export async function strategyB_mllmJudge({ dim, judgeRunner, judgeContext }) {
  if (typeof judgeRunner !== 'function') return null;
  try {
    const result = await judgeRunner({ dim, ...judgeContext });
    if (!result || result.skipped) return null;
    return {
      method: 'mllm_judge',
      final_score: typeof result.final_score === 'number' ? result.final_score : null,
      winner: result.winner,
      confidence: result.confidence,
    };
  } catch {
    return null;
  }
}

export function strategyC_userEscalation({ scoresPerCritic, dim }) {
  return {
    method: 'user_escalation',
    final_score: null,
    needs_user_input: true,
    dim,
    scoresPerCritic,
  };
}

export async function resolveConflict({ dim, scoresPerCritic, judgeRunner, judgeContext }) {
  if (!isConflict(scoresPerCritic)) {
    const values = Object.values(scoresPerCritic).filter((v) => typeof v === 'number');
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
    return { method: 'avg', final_score: avg === null ? null : +avg.toFixed(2) };
  }

  const { craft, aesthetic, designer } = scoresPerCritic;
  const a = strategyA_designerTiebreak({ craft, aesthetic, designer });
  if (a) return a;

  const b = await strategyB_mllmJudge({ dim, judgeRunner, judgeContext });
  if (b && b.final_score !== null) return b;

  return strategyC_userEscalation({ scoresPerCritic, dim });
}

export const CONSTANTS = { TIE_THRESHOLD, CONFLICT_THRESHOLD };
