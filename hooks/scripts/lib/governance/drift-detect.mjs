// Drift detector — Sprint 14.
// Compares extracted values against locked DTCG tokens. Classifies as
// exact-match / near-match (within tolerance) / drift.

import { extractValues } from './extract-values.mjs';

function flattenTokens(tokens, prefix = '') {
  const out = {};
  if (!tokens || typeof tokens !== 'object') return out;
  for (const [key, val] of Object.entries(tokens)) {
    if (key.startsWith('$')) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && '$value' in val) {
      out[path] = val.$value;
    } else if (val && typeof val === 'object') {
      Object.assign(out, flattenTokens(val, path));
    }
  }
  return out;
}

function normalize(value, kind) {
  if (kind === 'spacing' || kind === 'duration' || kind === 'typography') {
    if (value.endsWith('ms')) return +value.slice(0, -2);
    if (value.endsWith('s')) return +value.slice(0, -1) * 1000;
    if (value.endsWith('px')) return +value.slice(0, -2);
    if (value.endsWith('rem')) return +value.slice(0, -3) * 16;
  }
  if (kind === 'color') {
    return value.toLowerCase().replace(/\s+/g, '');
  }
  return value;
}

function nearMatch(value, lockedValues, tolerance) {
  let best = null;
  for (const lv of lockedValues) {
    if (typeof value !== 'number' || typeof lv !== 'number') continue;
    if (lv === 0) continue;
    const ratio = Math.abs(value - lv) / Math.abs(lv);
    if (ratio <= tolerance && (!best || ratio < best.ratio)) {
      best = { value: lv, ratio };
    }
  }
  return best;
}

export function detectDrift({ source, lockedTokens, tolerance = 0.05, allowedDrifts = [] }) {
  const values = extractValues(source);
  const flat = flattenTokens(lockedTokens || {});
  const lockedByKind = {
    color: [],
    spacing: [],
    duration: [],
    typography: [],
  };

  for (const [path, val] of Object.entries(flat)) {
    if (path.startsWith('color.') || /\b(color|palette|background|fill|stroke)\b/i.test(path)) {
      lockedByKind.color.push({ path, value: typeof val === 'string' ? val.toLowerCase().replace(/\s+/g, '') : val });
    } else if (path.startsWith('spacing.') || /\bspacing|gap|inset/i.test(path)) {
      lockedByKind.spacing.push({ path, value: typeof val === 'number' ? val : +String(val).replace(/px$/, '') });
    } else if (path.startsWith('motion.') || /\bduration|delay\b/i.test(path)) {
      lockedByKind.duration.push({ path, value: typeof val === 'number' ? val : +String(val).replace(/ms$/, '') });
    } else if (/\btypography|font-size|fontSize\b/i.test(path)) {
      lockedByKind.typography.push({ path, value: val });
    }
  }

  const drifts = [];
  const warnings = [];

  for (const v of values) {
    const allowed = allowedDrifts.some((p) => v.value.includes(p));
    if (allowed) continue;

    const baseKind = v.kind.replace(/-tw$/, '');
    const lockedList = lockedByKind[baseKind] || [];
    const norm = normalize(v.value, baseKind);

    const exact = lockedList.find((lv) => lv.value === norm);
    if (exact) continue;

    if (typeof norm === 'number') {
      const near = nearMatch(norm, lockedList.map((l) => l.value), tolerance);
      if (near) {
        warnings.push({ ...v, near_match: near });
        continue;
      }
    }

    drifts.push({ ...v, normalized: norm, suggestion: lockedList.slice(0, 3).map((l) => `${l.path} (${l.value})`) });
  }

  return { ok: drifts.length === 0, drifts, warnings };
}
