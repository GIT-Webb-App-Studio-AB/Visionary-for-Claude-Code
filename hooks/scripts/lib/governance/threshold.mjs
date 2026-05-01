// Governance threshold — Sprint 14.
// Reads the per-style governance config from a DTCG tokens file:
//   tokens.$visionary.governance = { drift_threshold, near_match_tolerance, allowed_drifts }

const DEFAULTS = {
  drift_threshold: 'block',     // 'block' | 'warn' | 'off'
  near_match_tolerance: 0.05,
  allowed_drifts: [],
};

export function getGovernanceConfig(tokens) {
  if (!tokens || typeof tokens !== 'object') return { ...DEFAULTS };
  const cfg = tokens?.$visionary?.governance;
  if (!cfg || typeof cfg !== 'object') return { ...DEFAULTS };
  return {
    drift_threshold: cfg.drift_threshold ?? DEFAULTS.drift_threshold,
    near_match_tolerance: typeof cfg.near_match_tolerance === 'number'
      ? cfg.near_match_tolerance
      : DEFAULTS.near_match_tolerance,
    allowed_drifts: Array.isArray(cfg.allowed_drifts) ? cfg.allowed_drifts : DEFAULTS.allowed_drifts,
  };
}

export const GOVERNANCE_DEFAULTS = DEFAULTS;
