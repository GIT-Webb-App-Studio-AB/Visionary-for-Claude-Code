// Vibe-motion diff applier — Sprint 13.
// Three application targets:
//   1. DTCG tokens.json  → patch motion.* keys directly
//   2. Inline JSX motion props (transition={{...}}, animate={{...}})
//   3. CSS shorthand or custom-property values
// Returns { changed: bool, patches: [...], note }.

const DURATION_RE = /(transition[^;]*?)(\d+(?:\.\d+)?)(ms|s)/g;
const BOUNCE_RE = /bounce\s*:\s*(0?\.\d+|1(?:\.0+)?)/g;
const VISUAL_DURATION_RE = /visualDuration\s*:\s*(0?\.\d+|\d+(?:\.\d+)?)/g;

function clamp(v, min, max) {
  if (typeof min === 'number') v = Math.max(min, v);
  if (typeof max === 'number') v = Math.min(max, v);
  return v;
}

function applyOp(current, op, value, opts = {}) {
  if (op === 'set') return value;
  if (op === 'set-max') return Math.min(current ?? value, value);
  if (op === 'add') return clamp((current ?? 0) + value, opts.min, opts.max);
  if (op === 'multiply') return clamp((current ?? 1) * value, opts.min, opts.max);
  if (op === 'enable') return true;
  return current;
}

export function applyAdjustmentsToSource(source, adjustments) {
  if (!source || !adjustments || adjustments.length === 0) {
    return { changed: false, patches: [], source };
  }

  let out = source;
  const patches = [];

  for (const adj of adjustments) {
    if (adj.token === 'duration') {
      out = out.replace(DURATION_RE, (match, prefix, num, unit) => {
        let ms = unit === 's' ? +num * 1000 : +num;
        const newMs = applyOp(ms, adj.op, adj.value, { min: adj.min, max: adj.max });
        const fixed = unit === 's' ? `${(newMs / 1000).toFixed(2)}s` : `${Math.round(newMs)}ms`;
        patches.push({ token: 'duration', from: `${num}${unit}`, to: fixed });
        return prefix + fixed;
      });
    } else if (adj.token === 'bounce') {
      out = out.replace(BOUNCE_RE, (match, num) => {
        const cur = +num;
        const next = applyOp(cur, adj.op, adj.value);
        patches.push({ token: 'bounce', from: cur, to: next });
        return `bounce: ${next.toFixed(2)}`;
      });
    } else if (adj.token === 'visualDuration') {
      out = out.replace(VISUAL_DURATION_RE, (match, num) => {
        const cur = +num;
        const next = applyOp(cur, adj.op, adj.value);
        patches.push({ token: 'visualDuration', from: cur, to: next });
        return `visualDuration: ${next.toFixed(2)}`;
      });
    } else {
      // Unsupported in this regex-based applier; record as a manual hint
      patches.push({ token: adj.token, op: adj.op, manual_hint: 'requires hand-edit' });
    }
  }

  return {
    changed: out !== source,
    patches,
    source: out,
  };
}

export function applyAdjustmentsToTokensJson(tokens, adjustments) {
  if (!tokens || typeof tokens !== 'object') {
    return { changed: false, patches: [], tokens };
  }
  const out = JSON.parse(JSON.stringify(tokens));
  const patches = [];

  for (const adj of adjustments) {
    const path = `motion.${adj.token}`;
    const current = getDeep(out, path);
    if (current === undefined && adj.op !== 'set' && adj.op !== 'enable') {
      patches.push({ token: adj.token, manual_hint: 'token not present in DTCG file' });
      continue;
    }
    const next = applyOp(current?.['$value'] ?? current, adj.op, adj.value, { min: adj.min, max: adj.max });
    setDeep(out, path, { ...(typeof current === 'object' ? current : {}), $value: next });
    patches.push({ token: adj.token, from: current?.['$value'] ?? current, to: next });
  }

  return { changed: patches.length > 0, patches, tokens: out };
}

function getDeep(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

function setDeep(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}
