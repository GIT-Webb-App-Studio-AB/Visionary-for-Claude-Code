// Vibe-motion before/after scoring — Sprint 13.
import { scoreMotion2 } from '../motion/scorer-2.mjs';

export function scoreBeforeAfter(beforeSource, afterSource) {
  const before = scoreMotion2(beforeSource);
  const after = scoreMotion2(afterSource);

  const subDelta = {};
  for (const key of Object.keys(before.subscores)) {
    subDelta[key] = +(after.subscores[key] - before.subscores[key]).toFixed(3);
  }

  return {
    before,
    after,
    delta: {
      total: +(after.total_score - before.total_score).toFixed(3),
      motion_readiness_10: +(after.motion_readiness_10 - before.motion_readiness_10).toFixed(2),
      tier: after.tier - before.tier,
      tier_name: `${before.tier_name} → ${after.tier_name}`,
      subscores: subDelta,
    },
  };
}

export function formatDiffReport(diff) {
  const arrow = (a, b) => `${(+a).toFixed(2)} → ${(+b).toFixed(2)}`;
  const delta = (d) => (d >= 0 ? `+${d.toFixed(2)}` : d.toFixed(2));

  const lines = [
    `Motion Readiness: ${arrow(diff.before.motion_readiness_10, diff.after.motion_readiness_10)} (${delta(diff.delta.motion_readiness_10)})`,
    `Tier: ${diff.delta.tier_name}`,
    'Subscores:',
  ];

  for (const [key, before] of Object.entries(diff.before.subscores)) {
    const after = diff.after.subscores[key];
    const d = diff.delta.subscores[key];
    lines.push(`  ${key.padEnd(20)} ${arrow(before, after)} (${delta(d)})`);
  }
  return lines.join('\n');
}
