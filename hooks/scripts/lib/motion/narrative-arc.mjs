// Narrative arc detector for Sprint 9 Motion Scoring 2.0.
// Measures whether elements are sequenced via stagger or transition-delay
// in a meaningful way. Header -> body -> CTA is an arc; everything firing
// at once is the default AI output.
// Zero-dep — Node 18+ regex only.

const TAILWIND_DELAY_MS = {
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

function collectCssDelays(src) {
  const out = [];
  let m;
  const reLong = /transition-delay\s*:\s*([0-9.]+)(ms|s)\b/g;
  while ((m = reLong.exec(src)) !== null) {
    const ms = toMs(m[1], m[2]);
    if (ms !== null) out.push({ value: ms, raw: `transition-delay:${m[1]}${m[2]}` });
  }
  const reAnim = /animation-delay\s*:\s*([0-9.]+)(ms|s)\b/g;
  while ((m = reAnim.exec(src)) !== null) {
    const ms = toMs(m[1], m[2]);
    if (ms !== null) out.push({ value: ms, raw: `animation-delay:${m[1]}${m[2]}` });
  }
  return out;
}

function collectJsxDelays(src) {
  const out = [];
  const re = /\bdelay\s*:\s*([0-9.]+)\b/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const n = Number(m[1]);
    if (!Number.isFinite(n)) continue;
    const ms = n < 50 ? n * 1000 : n;
    out.push({ value: ms, raw: `delay: ${m[1]}` });
  }
  return out;
}

function collectTailwindDelays(src) {
  const out = [];
  const re = /\bdelay-(\d+)\b/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1];
    if (TAILWIND_DELAY_MS[key] !== undefined) {
      out.push({ value: TAILWIND_DELAY_MS[key], raw: `delay-${key}` });
    }
  }
  return out;
}

function detectStaggerChildren(src) {
  const re = /\bstaggerChildren\s*:\s*([0-9.]+)\b/;
  const m = re.exec(src);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function isMonotonicNonDecreasing(values) {
  if (values.length < 2) return false;
  let strict = false;
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) return false;
    if (values[i] > values[i - 1]) strict = true;
  }
  return strict;
}

export function scoreNarrativeArc(source) {
  const src = source || '';
  const evidence = [];

  const stagger = detectStaggerChildren(src);
  if (stagger !== null) {
    evidence.push(`staggerChildren: ${stagger}`);
    return {
      score: 1.0,
      layered_count: 3,
      has_stagger: true,
      evidence,
    };
  }

  const cssDelays = collectCssDelays(src);
  const jsxDelays = collectJsxDelays(src);
  const twDelays = collectTailwindDelays(src);

  const allDelays = [...cssDelays, ...jsxDelays, ...twDelays];
  evidence.push(...allDelays.map((d) => d.raw));

  if (allDelays.length === 0) {
    return {
      score: 0.2,
      layered_count: 1,
      has_stagger: false,
      evidence,
    };
  }

  const values = allDelays.map((d) => d.value);
  const distinct = [...new Set(values)];
  const layeredCount = distinct.length + 1;

  if (allDelays.length === 1) {
    return {
      score: 0.6,
      layered_count: layeredCount,
      has_stagger: false,
      evidence,
    };
  }

  if (distinct.length >= 3) {
    if (isMonotonicNonDecreasing(values)) {
      return {
        score: 1.0,
        layered_count: layeredCount,
        has_stagger: false,
        evidence,
      };
    }
    return {
      score: 0.4,
      layered_count: layeredCount,
      has_stagger: false,
      evidence,
    };
  }

  if (distinct.length === 2) {
    if (isMonotonicNonDecreasing(values)) {
      return {
        score: 1.0,
        layered_count: layeredCount,
        has_stagger: false,
        evidence,
      };
    }
    return {
      score: 0.6,
      layered_count: layeredCount,
      has_stagger: false,
      evidence,
    };
  }

  return {
    score: 0.6,
    layered_count: layeredCount,
    has_stagger: false,
    evidence,
  };
}
