// Arbitration with designer row — Sprint 15.
// Extends the Sprint 6 craft + aesthetic merge with a designer critic
// row. The designer's per-dim score contributes weighted by
// pack.arbitration.weight_in_table; ties are resolved per
// conflict-resolve.mjs.

import { resolveConflict } from './conflict-resolve.mjs';

export function buildArbitrationTable({ craftCritique, aestheticCritique, designerOutput }) {
  const dims = new Set();
  if (craftCritique?.scores) Object.keys(craftCritique.scores).forEach((k) => dims.add(k));
  if (aestheticCritique?.scores) Object.keys(aestheticCritique.scores).forEach((k) => dims.add(k));
  if (designerOutput?.scores) Object.keys(designerOutput.scores).forEach((k) => dims.add(k));

  const table = {};
  for (const dim of dims) {
    const craft = craftCritique?.scores?.[dim];
    const aesthetic = aestheticCritique?.scores?.[dim];
    const designer = designerOutput?.scores?.[dim];

    const row = {
      craft: typeof craft === 'number' ? craft : null,
      aesthetic: typeof aesthetic === 'number' ? aesthetic : null,
      designer: typeof designer === 'number' ? designer : null,
    };
    table[dim] = row;
  }
  return table;
}

export async function mergeWithDesigner({
  craftCritique,
  aestheticCritique,
  designerOutput,
  judgeRunner,
  judgeContext,
} = {}) {
  const table = buildArbitrationTable({ craftCritique, aestheticCritique, designerOutput });
  const merged = {};
  const conflicts = [];

  const designerWeight = designerOutput?.weight_in_table ?? 0.25;

  for (const [dim, row] of Object.entries(table)) {
    const present = Object.entries(row).filter(([k, v]) => typeof v === 'number');
    if (present.length === 0) {
      merged[dim] = null;
      continue;
    }

    if (present.length === 1) {
      merged[dim] = present[0][1];
      continue;
    }

    const scores = {};
    for (const [k, v] of present) scores[k] = v;

    const resolution = await resolveConflict({
      dim,
      scoresPerCritic: scores,
      judgeRunner,
      judgeContext: judgeContext ? { ...judgeContext, dim } : undefined,
    });

    // Use weighted-mean whenever craft and aesthetic agree (perfect or near
    // tie) AND designer differs — this is the canonical "designer-row pulls
    // the score" path. Otherwise honour resolveConflict's strategy output.
    const craftAesAgree =
      typeof row.craft === 'number' &&
      typeof row.aesthetic === 'number' &&
      Math.abs(row.craft - row.aesthetic) <= 1.0;

    if ((resolution.method === 'avg' || craftAesAgree) && row.designer !== null) {
      // Re-weight: craft + aesthetic averaged at 1.0, designer at designerWeight
      const cra = row.craft;
      const ae = row.aesthetic;
      const de = row.designer;
      let total = 0;
      let weightSum = 0;
      if (typeof cra === 'number') { total += cra * 1.0; weightSum += 1.0; }
      if (typeof ae === 'number') { total += ae * 1.0; weightSum += 1.0; }
      if (typeof de === 'number') { total += de * designerWeight; weightSum += designerWeight; }
      merged[dim] = weightSum > 0 ? +(total / weightSum).toFixed(2) : null;
    } else {
      merged[dim] = resolution.final_score;
    }

    if (resolution.method !== 'avg') {
      conflicts.push({ dim, resolution_method: resolution.method, scores });
    }
  }

  const veto = designerOutput?.can_veto && Array.isArray(designerOutput.vetoes_triggered)
    ? designerOutput.vetoes_triggered
    : [];

  return {
    scores: merged,
    table,
    conflicts,
    designer_vetoes: veto,
    designer_id: designerOutput?.designer_id ?? null,
  };
}
