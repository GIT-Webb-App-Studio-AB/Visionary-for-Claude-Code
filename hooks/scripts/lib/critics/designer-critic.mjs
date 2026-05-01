// Designer critic — Sprint 15.
//
// Loads a designer pack from designers/<id>.json, validates the
// critic_persona block, and produces a per-dim scoring contribution
// based on the pack's priorities + a heuristic interpretation of the
// component source. The actual LLM-driven critique is invoked by the
// host (capture-and-critique) via the agents/designer-critic.md agent
// when an MLLM pass is desired; this module produces a deterministic
// baseline that the LLM round can override.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
// __filename: <repo>/hooks/scripts/lib/critics/designer-critic.mjs
// Walk up 5 levels to reach the repo root.
const REPO_ROOT = dirname(dirname(dirname(dirname(dirname(__filename)))));
const DESIGNERS_DIR = join(REPO_ROOT, 'designers');

const KNOWN_DIMS = [
  'hierarchy', 'layout', 'typography', 'contrast', 'distinctiveness',
  'brief_conformance', 'accessibility', 'motion_readiness', 'craft_measurable',
  'content_resilience', 'visual_style_match',
];

export async function loadDesignerPack(designerId) {
  if (!designerId) return null;
  const path = join(DESIGNERS_DIR, `${designerId}.json`);
  if (!existsSync(path)) return null;
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasCriticPersona(pack) {
  return !!(pack && pack.critic_persona && Array.isArray(pack.critic_persona.scoring_priorities));
}

function scoreFromPriority(priority, sourceContext = {}) {
  // Heuristic: a "strict hierarchy" prefers components with clear focal points
  // and clear secondary/tertiary structure. We approximate via the source's
  // existing critique signals if available.
  const baseScore = sourceContext.scores?.[priority.dim] ?? 6;
  const direction = priority.direction || '';
  let score = baseScore;

  if (direction.includes('demand') || direction.includes('strict')) {
    score = baseScore < 7 ? Math.max(0, baseScore - 1.5) : baseScore;
  } else if (direction.includes('prefer') && direction.includes('subtle')) {
    if (priority.dim === 'distinctiveness' && baseScore > 7) score = baseScore - 1.5;
  } else if (direction.includes('reward') || direction.includes('prefer high')) {
    score = baseScore;
  }

  return Math.max(0, Math.min(10, +score.toFixed(2)));
}

export async function runDesignerCritic({ designerId, sourceContext }) {
  const pack = await loadDesignerPack(designerId);
  if (!pack || !hasCriticPersona(pack)) {
    return { skipped: true, reason: 'no-critic-persona' };
  }

  const persona = pack.critic_persona;
  const scores = {};
  const rationale = {};
  const confidence = {};
  for (const dim of KNOWN_DIMS) {
    scores[dim] = null;
    confidence[dim] = null;
  }

  const vetoes = [];
  for (const priority of persona.scoring_priorities) {
    if (!KNOWN_DIMS.includes(priority.dim)) continue;
    scores[priority.dim] = scoreFromPriority(priority, sourceContext);
    confidence[priority.dim] = 4;
    rationale[priority.dim] = `${persona.role}: ${priority.direction || 'standard reading'}`;
  }

  if (pack.arbitration?.can_veto && Array.isArray(persona.veto_conditions)) {
    for (const condition of persona.veto_conditions) {
      if (sourceContext?.detected_patterns?.includes(condition)) {
        vetoes.push(condition);
      }
    }
  }

  return {
    designer_id: designerId,
    scores,
    confidence,
    rationale,
    vetoes_triggered: vetoes,
    weight_in_table: pack.arbitration?.weight_in_table ?? 0.25,
    can_veto: pack.arbitration?.can_veto === true,
  };
}
