// Easing provenance detector — Sprint 9 Motion Scoring 2.0.
//
// Measures how intentional the easing choices are. Default `ease` /
// `ease-in-out` without further qualification scores low; spring tokens
// (Motion v12 `bounce` + `visualDuration`) and `linear()` curves with
// many stops score high. Output is { score, evidence } where evidence
// captures the actual easing values that contributed.

const DEFAULT_BEZIERS = new Set([
  '0.25,0.1,0.25,1',
  '0,0,1,1',
  '0,0,0.58,1',
  '0.42,0,1,1',
  '0.42,0,0.58,1',
]);

const TRIVIAL_TIMING_KEYWORDS = new Set([
  'ease',
  'ease-in-out',
  'linear',
  'ease-in',
  'ease-out',
  'step-start',
  'step-end',
]);

function normalizeBezier(args) {
  return args
    .split(',')
    .map((part) => part.trim())
    .map((part) => part.replace(/^0+(\d)/, '$1'))
    .join(',');
}

function countLinearStops(args) {
  return args.split(',').length;
}

function classifyTimingValue(rawValue) {
  const value = rawValue.trim().replace(/;$/, '');
  const lower = value.toLowerCase();

  if (TRIVIAL_TIMING_KEYWORDS.has(lower)) {
    return { tier: 'unspecified', score: 0.2, value };
  }

  const linearMatch = lower.match(/^linear\(([^)]+)\)$/);
  if (linearMatch) {
    const stops = countLinearStops(linearMatch[1]);
    if (stops >= 5) return { tier: 'linear-high-fidelity', score: 1.0, value };
    if (stops >= 3) return { tier: 'linear-multi-stop', score: 0.8, value };
    return { tier: 'linear-low-fidelity', score: 0.4, value };
  }

  const cubicMatch = lower.match(/^cubic-bezier\(([^)]+)\)$/);
  if (cubicMatch) {
    const normalized = normalizeBezier(cubicMatch[1]);
    if (DEFAULT_BEZIERS.has(normalized)) {
      return { tier: 'unspecified', score: 0.2, value };
    }
    return { tier: 'cubic-bezier-custom', score: 0.6, value };
  }

  return { tier: 'unknown', score: 0.4, value };
}

function findCssTimingFunctions(src) {
  const evidence = [];
  const propRegex = /(?:transition-timing-function|animation-timing-function)\s*:\s*([^;]+);?/gi;
  let match;
  while ((match = propRegex.exec(src)) !== null) {
    const classification = classifyTimingValue(match[1]);
    evidence.push({
      selector: 'timing-function',
      value: classification.value,
      tier: classification.tier,
      score: classification.score,
    });
  }

  const shorthandRegex = /\btransition\s*:\s*([^;]+);/gi;
  while ((match = shorthandRegex.exec(src)) !== null) {
    const value = match[1];
    const cubic = value.match(/cubic-bezier\([^)]+\)/i);
    const linear = value.match(/\blinear\([^)]+\)/i);
    if (cubic) {
      const classification = classifyTimingValue(cubic[0]);
      evidence.push({
        selector: 'transition',
        value: classification.value,
        tier: classification.tier,
        score: classification.score,
      });
      continue;
    }
    if (linear) {
      const classification = classifyTimingValue(linear[0]);
      evidence.push({
        selector: 'transition',
        value: classification.value,
        tier: classification.tier,
        score: classification.score,
      });
      continue;
    }
    const keywordMatch = value.match(/\b(ease-in-out|ease-in|ease-out|ease|linear)\b/i);
    if (keywordMatch) {
      const classification = classifyTimingValue(keywordMatch[1]);
      evidence.push({
        selector: 'transition',
        value: classification.value,
        tier: classification.tier,
        score: classification.score,
      });
    }
  }

  return evidence;
}

function findSpringEvidence(src) {
  const evidence = [];

  const bounceRegex = /bounce\s*:\s*(0?\.\d+|1(?:\.0+)?)/g;
  let match;
  while ((match = bounceRegex.exec(src)) !== null) {
    evidence.push({
      selector: 'spring.bounce',
      value: `bounce: ${match[1]}`,
      tier: 'spring-token',
      score: 1.0,
    });
  }

  const visualDurationRegex = /visualDuration\s*:\s*(0?\.\d+|\d+(?:\.\d+)?)/g;
  while ((match = visualDurationRegex.exec(src)) !== null) {
    evidence.push({
      selector: 'spring.visualDuration',
      value: `visualDuration: ${match[1]}`,
      tier: 'spring-token',
      score: 1.0,
    });
  }

  const tokenRegex = /\bspring\.(snappy|bounce|micro|gentle|ui|layout)\b/g;
  while ((match = tokenRegex.exec(src)) !== null) {
    evidence.push({
      selector: 'spring-token',
      value: `spring.${match[1]}`,
      tier: 'spring-token',
      score: 1.0,
    });
  }

  return evidence;
}

export function scoreEasingProvenance(source) {
  const src = source || '';
  const evidence = [];

  evidence.push(...findCssTimingFunctions(src));
  evidence.push(...findSpringEvidence(src));

  if (evidence.length === 0) {
    return { score: 0.2, evidence: [] };
  }

  const maxScore = evidence.reduce((acc, item) => Math.max(acc, item.score), 0);
  return { score: +maxScore.toFixed(2), evidence };
}
