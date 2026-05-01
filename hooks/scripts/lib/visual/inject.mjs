// Visual style-match inject — Sprint 11.
// Reads a screenshot, computes the DINOv2 embedding, and produces
// an additionalContext block describing match score, anchor similarity,
// and OOD classification. Empty when the visual stack is unavailable.

import { existsSync } from 'node:fs';
import { extractEmbedding } from './dinov2-embed.mjs';
import { scoreStyleMatch } from './style-match.mjs';
import { detectOod } from './ood-detect.mjs';

// v1.4.0: opt-in by default. Set VISIONARY_VISUAL_EMBED=1 (or "on") after
// running scripts/download-dinov2.mjs + curating anchors. The stack
// no-ops gracefully when off so the rest of the critique is unaffected.
const ENABLED = (() => {
  const v = process.env.VISIONARY_VISUAL_EMBED;
  return v === '1' || v === 'on' || v === 'true' || v === 'TRUE';
})();

export async function buildVisualContextBlock({ screenshotPath, styleId }) {
  if (!ENABLED) return '';
  if (!screenshotPath || !styleId) return '';
  if (!existsSync(screenshotPath)) return '';

  const embedding = await extractEmbedding(screenshotPath);
  if (!embedding) {
    return [
      '',
      '── Visual style match (Sprint 11) ────────────────────────────────',
      'Visual embedding unavailable — onnxruntime-web or DINOv2 model not loaded.',
      'Skipping visual_style_match dimension. Run scripts/download-dinov2.mjs to enable.',
      '──────────────────────────────────────────────────────────────────',
    ].join('\n');
  }

  const match = await scoreStyleMatch({ embedding, styleId });
  const ood = await detectOod({ embedding, styleId });

  if (match.score === null && ood.in_distribution === null) {
    return [
      '',
      `── Visual style match (Sprint 11) — ${styleId} ───────────────────`,
      `No anchors curated for "${styleId}". Reason: ${match.reason}.`,
      'visual_style_match dimension will be null (10-dim weighting applies).',
      '──────────────────────────────────────────────────────────────────',
    ].join('\n');
  }

  return [
    '',
    `── Visual style match (Sprint 11) — ${styleId} ───────────────────`,
    `visual_style_match score: ${match.score ?? 'null'}/10 (cosine ${match.sim ?? 'n/a'})`,
    `OOD classification: ${ood.classification ?? 'unknown'}`,
    ood.distance_sigma !== null && ood.distance_sigma !== undefined
      ? `Mahalanobis distance: ${ood.distance_sigma}σ from style centroid`
      : '',
    `If visual_style_match < 6, cite which visual aspect (color-temperature,`,
    `density, decoration) deviates. Use evidence.type='metric'.`,
    '──────────────────────────────────────────────────────────────────',
  ].filter(Boolean).join('\n');
}

export async function getVisualSummary({ screenshotPath, styleId }) {
  if (!ENABLED) return null;
  if (!screenshotPath || !existsSync(screenshotPath)) return null;
  const embedding = await extractEmbedding(screenshotPath);
  if (!embedding) return null;
  const match = await scoreStyleMatch({ embedding, styleId });
  const ood = await detectOod({ embedding, styleId });
  return { match, ood };
}
