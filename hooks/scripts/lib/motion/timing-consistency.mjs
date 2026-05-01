// Timing consistency detector for Sprint 9 Motion Scoring 2.0.
// Measures variance (sigma) across all transition / animation durations
// found in CSS, JSX inline props, and Tailwind utility classes. Tight
// rhythms feel intentional; scattered durations feel disjunct.
// Zero-dep — Node 18+ regex only.

const TAILWIND_DURATION_MS = {
  '0': 0,
  '75': 75,
  '100': 100,
  '150': 150,
  '200': 200,
  '300': 300,
  '500': 500,
  '700': 700,
  '1000': 1000,
};

function toMs(rawValue, rawUnit) {
  const n = Number(rawValue);
  if (!Number.isFinite(n)) return null;
  if (rawUnit === 's') return n * 1000;
  if (rawUnit === 'ms') return n;
  return null;
}

function stdDev(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / values.length;
  return Math.sqrt(variance);
}

function bucketScore(sigma) {
  if (sigma < 80) return 1.0;
  if (sigma < 200) return 0.8;
  if (sigma < 300) return 0.5;
  if (sigma < 400) return 0.3;
  return 0.2;
}

function collectCssVarReferences(src) {
  const refs = [];
  const reCss = /(?:transition(?:-duration)?|animation(?:-duration)?)\s*:\s*[^;}\n]*?var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g;
  let m;
  while ((m = reCss.exec(src)) !== null) {
    refs.push({ kind: 'css-var', token: m[1] });
  }
  const reJsx = /(?:transitionDuration|animationDuration|duration)\s*:\s*['"`]?\s*var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g;
  while ((m = reJsx.exec(src)) !== null) {
    refs.push({ kind: 'css-var', token: m[1] });
  }
  return refs;
}

function collectCssDurations(src) {
  const out = [];
  let m;
  const reLong = /transition-duration\s*:\s*([0-9.]+)(ms|s)\b/g;
  while ((m = reLong.exec(src)) !== null) {
    const ms = toMs(m[1], m[2]);
    if (ms !== null) out.push({ kind: 'css', value: ms, raw: `${m[1]}${m[2]}` });
  }
  const reShort = /transition\s*:\s*[^;}\n]*?(?:^|\s)([0-9.]+)(ms|s)\b/g;
  while ((m = reShort.exec(src)) !== null) {
    const ms = toMs(m[1], m[2]);
    if (ms !== null) out.push({ kind: 'css', value: ms, raw: `${m[1]}${m[2]}` });
  }
  const reAnimDur = /animation-duration\s*:\s*([0-9.]+)(ms|s)\b/g;
  while ((m = reAnimDur.exec(src)) !== null) {
    const ms = toMs(m[1], m[2]);
    if (ms !== null) out.push({ kind: 'css', value: ms, raw: `${m[1]}${m[2]}` });
  }
  const reAnim = /animation\s*:\s*(?!none\b)[^;}\n]*?(?:^|\s)([0-9.]+)(ms|s)\b/g;
  while ((m = reAnim.exec(src)) !== null) {
    const ms = toMs(m[1], m[2]);
    if (ms !== null) out.push({ kind: 'css', value: ms, raw: `${m[1]}${m[2]}` });
  }
  return out;
}

function collectJsxDurations(src) {
  const out = [];
  const re = /\bduration\s*:\s*([0-9.]+)\b/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const n = Number(m[1]);
    if (!Number.isFinite(n)) continue;
    const ms = n < 50 ? n * 1000 : n;
    out.push({ kind: 'jsx', value: ms, raw: `duration: ${m[1]}` });
  }
  return out;
}

function collectTailwindDurations(src) {
  const out = [];
  const re = /\bduration-(\d+)\b/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1];
    if (TAILWIND_DURATION_MS[key] !== undefined) {
      out.push({ kind: 'tw', value: TAILWIND_DURATION_MS[key], raw: `duration-${key}` });
    }
  }
  return out;
}

export function scoreTimingConsistency(source) {
  const src = source || '';
  const evidence = [];

  const varRefs = collectCssVarReferences(src);
  const cssDurs = collectCssDurations(src);
  const jsxDurs = collectJsxDurations(src);
  const twDurs = collectTailwindDurations(src);

  const numericDurations = [...cssDurs, ...jsxDurs, ...twDurs];

  if (varRefs.length > 0 && numericDurations.length === 0) {
    const distinctTokens = new Set(varRefs.map((r) => r.token));
    evidence.push(...varRefs.map((r) => `var(${r.token})`));
    if (distinctTokens.size === 1) {
      return {
        score: 1.0,
        sigma_ms: 0,
        distinct_durations: 1,
        evidence,
      };
    }
    return {
      score: distinctTokens.size === 2 ? 0.6 : 0.4,
      sigma_ms: 0,
      distinct_durations: distinctTokens.size,
      evidence,
    };
  }

  const values = numericDurations.map((d) => d.value);

  if (values.length === 0) {
    return {
      score: 0.5,
      sigma_ms: 0,
      distinct_durations: 0,
      evidence: [],
    };
  }

  if (values.length === 1) {
    return {
      score: 1.0,
      sigma_ms: 0,
      distinct_durations: 1,
      evidence: [numericDurations[0].raw],
    };
  }

  const sigma = stdDev(values);
  const distinct = new Set(values).size;
  const score = bucketScore(sigma);

  return {
    score,
    sigma_ms: +sigma.toFixed(2),
    distinct_durations: distinct,
    evidence: numericDurations.map((d) => d.raw),
  };
}
