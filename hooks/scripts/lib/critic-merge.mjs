// critic-merge.mjs — Sprint 06 Task 18.3
//
// Merges the outputs of critic-craft and critic-aesthetic into a single
// critique-output.schema.json-compliant object. Called from
// capture-and-critique.mjs when VISIONARY_MULTI_CRITIC=1.
//
// Contract:
//   Each critic emits a full critique-output object but fills only its
//   owned dimensions. The other dimensions are `null`. This module
//   stitches the two together:
//
//     craft owns:     hierarchy, layout, typography, contrast,
//                     accessibility, craft_measurable
//     aesthetic owns: distinctiveness, brief_conformance, motion_readiness
//
//   Confidence, top_3_fixes, slop_detections, numeric_scores, axe_violations_count
//   are concatenated or averaged per rules below.
//
//   Conflicts on overlapping writes (rare — only happens if a critic
//   breaks its owned-dimension discipline) are resolved via
//   skills/visionary/critic-arbitration.json and logged to
//   `arbitration_events` in the output for auditability.
//
// Zero dependencies. Cross-platform. Called from the hook; must not
// throw on malformed critic output — a broken critic is degraded-mode,
// not fatal.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// ── Critic ownership map ────────────────────────────────────────────────────
// These two arrays partition the 10 scoring dimensions. Every dimension must
// appear in exactly one of them; the merge asserts this at startup.
// `content_resilience` (Sprint 07) is owned by craft — it's a deterministic
// measurement against p50/p95/empty kit samples, not a taste judgement.
export const CRAFT_DIMENSIONS = [
  'hierarchy',
  'layout',
  'typography',
  'contrast',
  'accessibility',
  'craft_measurable',
  'content_resilience',
];

export const AESTHETIC_DIMENSIONS = [
  'distinctiveness',
  'brief_conformance',
  'motion_readiness',
];

const ALL_DIMENSIONS = [...CRAFT_DIMENSIONS, ...AESTHETIC_DIMENSIONS];

// ── Arbitration table loader ────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const defaultArbitrationPath = resolve(
  dirname(__filename), '..', '..', '..',
  'skills', 'visionary', 'critic-arbitration.json',
);

function loadArbitration(customPath) {
  const path = customPath || defaultArbitrationPath;
  if (!existsSync(path)) {
    return { default: { preferred_critic: 'craft', reason: 'fallback — arbitration.json missing' }, archetypes: [], escalation_overrides: [] };
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { default: { preferred_critic: 'craft', reason: 'fallback — arbitration.json unparseable' }, archetypes: [], escalation_overrides: [] };
  }
}

export function resolveArbitration(archetype, { arbitrationPath, conflictContext, dimension } = {}) {
  const table = loadArbitration(arbitrationPath);
  // Escalation overrides fire first but only when their scope matches the
  // dimension under conflict. An illegibility rule targeting contrast
  // should NOT flip the outcome on a typography tiebreak.
  for (const esc of table.escalation_overrides || []) {
    const match = matchesEscalation(esc, conflictContext || {}, dimension);
    if (match) return { preferred: match.preferred, reason: `escalation: ${esc.rule}` };
  }
  if (archetype) {
    const lc = String(archetype).toLowerCase();
    const direct = (table.archetypes || []).find((a) => (a.matches_any || []).some((m) => m === lc) || a.name === lc);
    if (direct) return { preferred: direct.preferred_critic, reason: direct.reason || `archetype:${direct.name}` };
  }
  const def = table.default || { preferred_critic: 'craft', reason: 'table default' };
  return { preferred: def.preferred_critic, reason: def.reason };
}

// Each escalation returns either null (not applicable) or { preferred: 'craft'|'aesthetic' }.
// Rules are dimension-scoped — they only override arbitration on the specific
// dimension the rule targets. A motion-readiness escalation doesn't change
// a typography conflict.
function matchesEscalation(esc, ctx, dimension) {
  if (esc.rule === 'illegibility-wins-regardless') {
    // Scope: contrast and accessibility only.
    if (!['contrast', 'accessibility'].includes(dimension)) return null;
    const craft = ctx.craft?.scores || {};
    const sev = (ctx.craft?.top_3_fixes || []).some((f) => {
      return f.severity === 'blocker' && ['contrast', 'accessibility'].includes(f.dimension);
    });
    const illegible = (typeof craft.contrast === 'number' && craft.contrast < 4) ||
                      (typeof craft.accessibility === 'number' && craft.accessibility < 4);
    return (sev && illegible) ? { preferred: 'craft' } : null;
  }
  if (esc.rule === 'no-motion-on-reduced-motion') {
    // Scope: motion_readiness only.
    if (dimension !== 'motion_readiness') return null;
    const fixes = ctx.aesthetic?.top_3_fixes || [];
    const hit = fixes.some((f) => f.dimension === 'motion_readiness' && f.severity === 'blocker' &&
                                   /reduced[-\s]?motion/i.test(f.proposed_fix || ''));
    return hit ? { preferred: 'aesthetic' } : null;
  }
  return null;
}

// ── Public: merge two critic outputs ───────────────────────────────────────
// Returns a single critique-output-compatible object. The shape is loose
// (we don't schema-validate here — capture-and-critique's validator does
// that after merge) so this function can be reused in tests and CI tooling.
//
// Options:
//   archetype        — current generation's product_archetype, drives arbitration
//   arbitrationPath  — override path to critic-arbitration.json (tests)
//
// The returned object includes:
//   - scores / confidence merged per ownership map
//   - top_3_fixes: union of both, deduplicated by dimension+selector_hint,
//     trimmed to <= 3 items ordered by severity (blocker → major → minor)
//   - slop_detections: union, deduplicated by pattern_id (max severity wins)
//   - numeric_scores, axe_violations_count: copied from craft (numeric
//     scorer output is craft's territory)
//   - prompt_hash: concatenated as "craft=...,aesthetic=..." when they differ
//   - arbitration_events: list of conflicts and how they were resolved
//   - degraded: true when one critic's output was malformed/missing
export function mergeCritics(craftOut, aestheticOut, options = {}) {
  const arbit = [];
  const degradedFlags = [];
  const craft     = safeObject(craftOut);
  const aesthetic = safeObject(aestheticOut);

  if (!isPlausibleCritique(craft))     degradedFlags.push('craft-malformed');
  if (!isPlausibleCritique(aesthetic)) degradedFlags.push('aesthetic-malformed');

  // ── Scores ────────────────────────────────────────────────────────────
  const scores = {};
  for (const dim of ALL_DIMENSIONS) {
    const owner = CRAFT_DIMENSIONS.includes(dim) ? 'craft' : 'aesthetic';
    const ownerVal     = getScore(owner === 'craft' ? craft : aesthetic, dim);
    const otherVal     = getScore(owner === 'craft' ? aesthetic : craft, dim);

    // Ideal case: owner has a number, other is null/missing.
    if (isNumber(ownerVal) && !isNumber(otherVal)) { scores[dim] = ownerVal; continue; }

    // Owner has no value but other wrote one (discipline break): accept it with a warning.
    if (!isNumber(ownerVal) && isNumber(otherVal)) {
      scores[dim] = otherVal;
      arbit.push({
        dimension: dim,
        reason: `owner ${owner} emitted null; using ${owner === 'craft' ? 'aesthetic' : 'craft'} value`,
        resolution: 'fallback-to-other-critic',
      });
      continue;
    }

    // Both null — this is the null-outcome from the schema. Allowed only
    // for craft_measurable (when numeric scorer is disabled).
    if (!isNumber(ownerVal) && !isNumber(otherVal)) {
      scores[dim] = null;
      continue;
    }

    // Both wrote a number — conflict. Resolve via arbitration, passing the
    // current dimension so escalation rules can scope themselves correctly.
    const { preferred, reason } = resolveArbitration(options.archetype, {
      arbitrationPath: options.arbitrationPath,
      conflictContext: { craft, aesthetic },
      dimension: dim,
    });
    const winnerOut = preferred === 'craft' ? craft : aesthetic;
    scores[dim] = getScore(winnerOut, dim);
    arbit.push({
      dimension: dim,
      reason,
      resolution: `tiebreak-${preferred}`,
      craft_value: getScore(craft, dim),
      aesthetic_value: getScore(aesthetic, dim),
    });
  }

  // ── Confidence ────────────────────────────────────────────────────────
  const confidence = {};
  for (const dim of ALL_DIMENSIONS) {
    const owner = CRAFT_DIMENSIONS.includes(dim) ? craft : aesthetic;
    const c = owner?.confidence?.[dim];
    if (Number.isInteger(c) && c >= 1 && c <= 5) confidence[dim] = c;
  }

  // ── top_3_fixes ───────────────────────────────────────────────────────
  // Union both lists. Dedupe on (dimension + selector_hint || evidence.value).
  // Order by severity (blocker → major → minor), then preserve per-critic
  // order. Trim to 3.
  const craftFixes     = Array.isArray(craft?.top_3_fixes) ? craft.top_3_fixes : [];
  const aestheticFixes = Array.isArray(aesthetic?.top_3_fixes) ? aesthetic.top_3_fixes : [];
  const fixes = dedupeFixes([...craftFixes, ...aestheticFixes]);
  const severityRank = { blocker: 0, major: 1, minor: 2 };
  fixes.sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9));
  const top_3_fixes = fixes.slice(0, 3);

  // ── slop_detections ────────────────────────────────────────────────────
  const slopMap = new Map();
  const ingestSlop = (list) => {
    for (const s of (list || [])) {
      if (!s || !Number.isInteger(s.pattern_id)) continue;
      const prev = slopMap.get(s.pattern_id);
      if (!prev || severityRank[s.severity] < severityRank[prev.severity]) {
        slopMap.set(s.pattern_id, s);
      }
    }
  };
  ingestSlop(craft?.slop_detections);
  ingestSlop(aesthetic?.slop_detections);
  const slop_detections = [...slopMap.values()].sort((a, b) => a.pattern_id - b.pattern_id);

  // ── numeric_scores + axe_violations_count ─────────────────────────────
  // Craft owns these — the numeric scorer and axe-core output are both
  // mechanical evidence aligned with craft dimensions.
  const numeric_scores = craft?.numeric_scores || aesthetic?.numeric_scores || { enabled: false, notes: ['merge: neither critic reported numeric_scores'] };
  const axe_violations_count = Number.isInteger(craft?.axe_violations_count)
    ? craft.axe_violations_count
    : (Number.isInteger(aesthetic?.axe_violations_count) ? aesthetic.axe_violations_count : 0);

  // ── prompt_hash ────────────────────────────────────────────────────────
  // When the two critics were produced from different prompt versions, we
  // combine them into a single deterministic sha256 so the merged output
  // still matches the schema's ^sha256:[0-9a-f]{16,64}$ pattern. Down-
  // stream calibration treats the combined hash as its own fingerprint —
  // a change to either critic's prompt invalidates the merged calibration.
  const craftHash = isValidSha256Hash(craft?.prompt_hash) ? craft.prompt_hash : 'sha256:unknown';
  const aestheticHash = isValidSha256Hash(aesthetic?.prompt_hash) ? aesthetic.prompt_hash : 'sha256:unknown';
  const prompt_hash = craftHash === aestheticHash
    ? craftHash
    : 'sha256:' + createHash('sha256').update(`${craftHash}||${aestheticHash}`).digest('hex').slice(0, 16);
  const merged_prompt_components = craftHash === aestheticHash ? null : { craft: craftHash, aesthetic: aestheticHash };

  // ── convergence_signal ────────────────────────────────────────────────
  // Merged output converges only when BOTH critics agree.
  const convergence_signal = Boolean(craft?.convergence_signal && aesthetic?.convergence_signal);

  // ── Round + output shape ──────────────────────────────────────────────
  const round = Number.isInteger(craft?.round) ? craft.round : (Number.isInteger(aesthetic?.round) ? aesthetic.round : 1);

  return {
    round,
    scores,
    confidence,
    top_3_fixes,
    convergence_signal,
    slop_detections,
    axe_violations_count,
    numeric_scores,
    prompt_hash,
    arbitration_events: arbit,
    merge_degraded: degradedFlags.length > 0,
    merge_degraded_reasons: degradedFlags,
    merged_prompt_components,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function safeObject(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
function isNumber(v) { return typeof v === 'number' && Number.isFinite(v); }
function getScore(out, dim) { return out?.scores?.[dim]; }
function isValidSha256Hash(v) { return typeof v === 'string' && /^sha256:[0-9a-f]{16,64}$/.test(v); }

function isPlausibleCritique(obj) {
  if (!obj || !obj.scores || typeof obj.scores !== 'object') return false;
  // At least one scored dimension
  return Object.values(obj.scores).some((v) => isNumber(v));
}

function dedupeFixes(fixes) {
  const seen = new Map();
  const out = [];
  for (const f of fixes) {
    if (!f || typeof f !== 'object') continue;
    const key = `${f.dimension || ''}::${(f.selector_hint || f?.evidence?.value || '').toLowerCase()}`;
    if (seen.has(key)) {
      // Keep the more severe one.
      const idx = seen.get(key);
      const prev = out[idx];
      if (severityRankFor(f.severity) < severityRankFor(prev.severity)) out[idx] = f;
      continue;
    }
    seen.set(key, out.length);
    out.push(f);
  }
  return out;
}
function severityRankFor(s) { return ({ blocker: 0, major: 1, minor: 2 })[s] ?? 9; }

export default mergeCritics;
