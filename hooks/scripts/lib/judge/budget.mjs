// Judge budget — Sprint 12.
// Enforces per-round and per-session caps on MLLM judge invocations.
// State is in-process; capture-and-critique resets per session.

const PER_ROUND_DEFAULT = 1;
const PER_SESSION_DEFAULT = 5;

const _state = {
  perRound: 0,
  perSession: 0,
  sessionId: null,
  costEstimateUsd: 0,
};

export function resetForSession(sessionId) {
  _state.perRound = 0;
  _state.perSession = 0;
  _state.sessionId = sessionId;
  _state.costEstimateUsd = 0;
}

export function startRound() {
  _state.perRound = 0;
}

export function canInvoke({
  maxPerRound = Number(process.env.VISIONARY_JUDGE_MAX_PER_ROUND) || PER_ROUND_DEFAULT,
  maxPerSession = Number(process.env.VISIONARY_JUDGE_MAX_PER_SESSION) || PER_SESSION_DEFAULT,
} = {}) {
  if (_state.perRound >= maxPerRound) {
    return { ok: false, reason: 'budget-per-round-exceeded' };
  }
  if (_state.perSession >= maxPerSession) {
    return { ok: false, reason: 'budget-per-session-exceeded' };
  }
  return { ok: true };
}

export function recordInvocation(costUsd = 0.5) {
  _state.perRound++;
  _state.perSession++;
  _state.costEstimateUsd += costUsd;
}

export function getStats() {
  return { ...(_state) };
}
