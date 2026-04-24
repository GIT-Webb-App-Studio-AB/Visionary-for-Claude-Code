// content-resilience-scorer.mjs — Sprint 07 Task 21.5.
//
// Tenth critique dimension: how well does a component survive realistic
// data? A component is content-resilient when its layout holds against p95
// content (long names, diacritics, overflow-prone strings), its empty state
// exists and is useful (not a blank rectangle), and its typography stays
// readable across all three states.
//
// Input: up to three DOM snapshots of the same component rendered against:
//   - p50 content (median case from kit.entities[*].sample[0])
//   - p95 content (synthesised worst case derived from constraints[*].p95)
//   - empty state (0 items where component expects collections)
//
// Output: composite 0–10 plus a breakdown the critic can cite in top_3_fixes
// and the numeric scorer can feed into calibration.
//
// Composite formula (Sprint 07 Task 21.5):
//   content_resilience = 0.4 × layout_holds
//                      + 0.4 × empty_state_quality
//                      + 0.2 × typography_robustness
// Each sub-score ∈ [0, 10]; composite is rounded to 1 decimal.
//
// Pure module — no I/O, no Playwright. The hook (capture-and-critique.mjs)
// drives the renders and hands three `{elements:[...]}` snapshots in.

const STATE_KEYS = ['p50', 'p95', 'empty'];

// ── Public entry ────────────────────────────────────────────────────────────
// Shapes:
//   snapshots = { p50: {elements:[…]}, p95: {elements:[…]}, empty: {elements:[…]} }
//   kit       = parsed visionary-kit.json (optional — used for a few heuristics)
//   viewport  = { width, height } — the viewport used at capture time
//     (default 1200×800 — caller should pass the same size used for the
//     real screenshot to avoid bbox misinterpretation).
export function scoreContentResilience({ snapshots, kit = null, viewport = { width: 1200, height: 800 } } = {}) {
  const available = STATE_KEYS.filter((k) => snapshots && snapshots[k] && Array.isArray(snapshots[k].elements));
  const missing = STATE_KEYS.filter((k) => !available.includes(k));

  // If fewer than 2 snapshots are available we can't compare states. Return
  // null so the critic emits null for the dimension (downstream tolerates).
  if (available.length < 2) {
    return {
      score: null,
      breakdown: { layout_holds: null, empty_state_quality: null, typography_robustness: null },
      notes: [`insufficient snapshots: need at least 2 of ${STATE_KEYS.join(',')} (have ${available.join(',') || 'none'})`],
      missing_states: missing,
    };
  }

  const layout_holds = scoreLayoutHolds(snapshots, viewport);
  const empty_state_quality = snapshots.empty
    ? scoreEmptyStateQuality(snapshots.empty, { kit })
    : { score: null, notes: ['no empty snapshot — score skipped'] };
  const typography_robustness = scoreTypographyRobustness(snapshots);

  const parts = [
    { weight: 0.4, score: layout_holds.score },
    { weight: 0.4, score: empty_state_quality.score },
    { weight: 0.2, score: typography_robustness.score },
  ];
  const weighted = parts.filter((p) => typeof p.score === 'number');
  const usedWeight = weighted.reduce((s, p) => s + p.weight, 0);
  const composite = weighted.length === 0 || usedWeight === 0
    ? null
    : roundTo(weighted.reduce((s, p) => s + p.score * p.weight, 0) / usedWeight, 1);

  return {
    score: composite,
    breakdown: {
      layout_holds: layout_holds.score,
      empty_state_quality: empty_state_quality.score,
      typography_robustness: typography_robustness.score,
    },
    notes: [
      ...layout_holds.notes.map((n) => `layout: ${n}`),
      ...(empty_state_quality.notes || []).map((n) => `empty: ${n}`),
      ...typography_robustness.notes.map((n) => `type: ${n}`),
    ],
    missing_states: missing,
  };
}

// ── Sub-score 1: layout holds ───────────────────────────────────────────────
// Compare p50 to p95 (or whichever two we have). Overflow is the primary
// failure mode: child bbox extending past parent, element extending past
// viewport width, or element count diverging (indicating truncation that
// dropped rows silently).
function scoreLayoutHolds(snapshots, viewport) {
  const notes = [];
  const ref = snapshots.p50 || snapshots.empty;
  const stressed = snapshots.p95 || snapshots.populated;
  if (!ref || !stressed) {
    return { score: null, notes: ['missing p50 or p95 snapshot'] };
  }
  const refEl = ref.elements || [];
  const stressedEl = stressed.elements || [];

  let score = 10;

  // 1. Viewport-width overflow on p95 specifically.
  const vp = viewport?.width || 1200;
  const overflowingElements = stressedEl.filter((e) => {
    const right = (e?.bbox?.x ?? 0) + (e?.bbox?.width ?? 0);
    return right > vp + 1; // +1px tolerance for sub-pixel rendering
  });
  if (overflowingElements.length > 0) {
    const n = overflowingElements.length;
    notes.push(`${n} element(s) extend past viewport at p95 (e.g. ${overflowingElements[0].selector || '??'})`);
    score -= Math.min(4, n >= 3 ? 4 : n * 1.5);
  }

  // 2. Horizontal-scroll signal: does any element's x + width exceed 1.5× vp?
  // This catches cases where text wraps but inside a container that itself
  // extended beyond the page.
  const rawBleed = stressedEl.some((e) => ((e?.bbox?.x ?? 0) + (e?.bbox?.width ?? 0)) > vp * 1.5);
  if (rawBleed) { score -= 1.5; notes.push('extreme horizontal bleed at p95 (>1.5× viewport)'); }

  // 3. Element-count collapse: p95 snapshot has substantially fewer visible
  // elements than p50. Signals truncation (hidden overflow) or layout
  // collapse. Allow up to 10% drop for natural variation.
  if (refEl.length > 0) {
    const delta = (refEl.length - stressedEl.length) / refEl.length;
    if (delta > 0.1) {
      score -= Math.min(2, delta * 10);
      notes.push(`element count dropped ${(delta * 100).toFixed(0)}% from p50 to p95`);
    }
  }

  // 4. Vertical collapse: p95 should be at least as tall as p50 (more content
  // ≥ more height). If p95 is shorter, something truncated.
  const refHeight = maxY(refEl);
  const stressedHeight = maxY(stressedEl);
  if (refHeight > 0 && stressedHeight < refHeight * 0.9) {
    score -= 1;
    notes.push(`p95 rendered ${Math.round((1 - stressedHeight / refHeight) * 100)}% shorter than p50 — likely truncation`);
  }

  return { score: clamp(score), notes };
}

function maxY(elements) {
  let m = 0;
  for (const e of elements) {
    const y = (e?.bbox?.y ?? 0) + (e?.bbox?.height ?? 0);
    if (y > m) m = y;
  }
  return m;
}

// ── Sub-score 2: empty state quality ────────────────────────────────────────
// A good empty state has:
//   - text that explains what's missing (not blank, not just a heading)
//   - an action (CTA button, link, upload prompt)
//   - ideally an illustration or icon (img/svg present)
// A failing empty state is a component that just collapses to a thin sliver
// or renders nothing visible.
function scoreEmptyStateQuality(emptySnap, { kit }) {
  const notes = [];
  const elements = emptySnap.elements || [];
  if (elements.length === 0) {
    return { score: 0, notes: ['empty state rendered zero elements'] };
  }

  const totalHeight = maxY(elements);
  if (totalHeight < 40) {
    return { score: 1, notes: [`empty state collapses to ${Math.round(totalHeight)}px high — likely a "display:none on empty" bug`] };
  }

  let score = 4; // baseline: renders something

  // 1. Text presence — look for any element whose selector is a paragraph,
  // heading, or span with non-trivial fontSize.
  const textish = elements.filter((e) => /(^p$|^p\.|^h[1-6]|^span|^div)/.test(e.selector || ''));
  if (textish.length >= 2) score += 2;
  else if (textish.length === 1) score += 1;
  else notes.push('no text-bearing elements detected in empty state');

  // 2. CTA presence — button, anchor-like (<a>), or something with role=button.
  const cta = elements.some((e) => /(^button$|^button\.|^a$|^a\.)/.test(e.selector || ''));
  if (cta) score += 2;
  else notes.push('no CTA (button or link) detected in empty state');

  // 3. Illustration / icon — img, svg, or a decorated block.
  const illustration = elements.some((e) => /(^img$|^img\.|^svg$|^svg\.)/.test(e.selector || ''));
  if (illustration) score += 1.5;
  else notes.push('no illustration or icon detected in empty state');

  // 4. Required-state tracking: if the kit lists "empty" in required_states
  // but the rendered state has < 3 meaningful elements, the component
  // probably forgot to implement it.
  const requiredEmpty = Array.isArray(kit?.required_states) && kit.required_states.includes('empty');
  if (requiredEmpty && elements.length < 3) {
    score = Math.min(score, 3);
    notes.push('kit declares empty as required state but component emits <3 elements');
  }

  return { score: clamp(score), notes };
}

// ── Sub-score 3: typography robustness ──────────────────────────────────────
// Measure font-size / line-height stability across states. A robust component
// does NOT shrink text to cope with p95 content; it wraps, truncates with
// ellipsis, or grows the container. If any element's font-size shrinks by
// >10 % between p50 and p95, we flag it.
function scoreTypographyRobustness(snapshots) {
  const notes = [];
  const ref = snapshots.p50;
  const stressed = snapshots.p95;
  if (!ref || !stressed) {
    return { score: null, notes: ['need p50 + p95 for typography robustness'] };
  }
  const refMap = indexBySelector(ref.elements || []);
  const stressedMap = indexBySelector(stressed.elements || []);

  let score = 10;
  let compared = 0;
  let shrunk = 0;
  let grewExcessively = 0;

  for (const [sel, r] of refMap) {
    const s = stressedMap.get(sel);
    if (!s) continue;
    const rSize = parsePx(r?.style?.fontSize);
    const sSize = parsePx(s?.style?.fontSize);
    if (rSize == null || sSize == null || rSize < 6) continue;
    compared++;
    const ratio = sSize / rSize;
    if (ratio < 0.9) shrunk++;
    if (ratio > 1.2) grewExcessively++;
  }

  if (compared === 0) {
    return { score: null, notes: ['no comparable selectors between p50 and p95'] };
  }

  const shrinkRate = shrunk / compared;
  if (shrinkRate > 0) {
    score -= Math.min(5, shrinkRate * 20);
    notes.push(`${shrunk}/${compared} elements shrank font-size at p95 — use wrapping or ellipsis, not size reduction`);
  }
  if (grewExcessively > 0) {
    score -= Math.min(2, grewExcessively * 0.5);
    notes.push(`${grewExcessively} elements grew >20 % at p95 — check line-height + container fit`);
  }

  // Absent text-truncation is weak but detectable: if we see `p95` content
  // rendered inline with no sibling truncation but obvious overflow at the
  // container level, it's a fail. We don't have the full context here — note
  // for the critic to follow up, but don't penalise hard.

  return { score: clamp(score), notes };
}

function indexBySelector(elements) {
  const m = new Map();
  for (const e of elements) if (e?.selector) m.set(e.selector, e);
  return m;
}

function parsePx(v) {
  if (typeof v !== 'string') return null;
  const m = v.match(/^(-?\d+(?:\.\d+)?)px$/);
  return m ? Number(m[1]) : null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function clamp(n) {
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(10, roundTo(n, 1)));
}

function roundTo(n, digits) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

// ── CLI entry (optional) ────────────────────────────────────────────────────
// Accepts three DOM snapshot files (--p50, --p95, --empty), optional kit,
// and emits a single JSON object to stdout.
// Usage:
//   node content-resilience-scorer.mjs \
//     --p50 dom-p50.json --p95 dom-p95.json --empty dom-empty.json \
//     [--kit visionary-kit.json] [--viewport 1200x800]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

function cli() {
  const argv = process.argv.slice(2);
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? null : argv[i + 1];
  };
  const loadJson = (p) => {
    if (!p) return null;
    try { return JSON.parse(readFileSync(p, 'utf8')); }
    catch (e) { throw new Error(`Failed to read ${p}: ${e.message}`); }
  };
  const snapshots = {};
  for (const k of STATE_KEYS) {
    const p = arg(`--${k}`);
    if (p) snapshots[k] = loadJson(p);
  }
  const kit = loadJson(arg('--kit'));
  let viewport = { width: 1200, height: 800 };
  const vp = arg('--viewport');
  if (vp) {
    const m = vp.match(/^(\d+)x(\d+)$/);
    if (m) viewport = { width: Number(m[1]), height: Number(m[2]) };
  }
  const result = scoreContentResilience({ snapshots, kit, viewport });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  try { cli(); }
  catch (e) { console.error('content-resilience-scorer failed:', e.message); process.exit(1); }
}
