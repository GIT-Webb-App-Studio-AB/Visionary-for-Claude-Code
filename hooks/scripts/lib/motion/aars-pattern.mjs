// AARS pattern detector — Sprint 9 Motion Scoring 2.0.
//
// Anticipation -> Action -> Reaction -> Settle. Detects 4-phase
// keyframe choreography by counting sign changes in the delta sequence
// of transform / opacity values across @keyframes blocks and
// motion.div animate arrays. Cinema-grade motion narrative scores
// highest; spring tokens with bounce > 0 imply AARS implicitly.

const KEYFRAMES_HEADER = /@keyframes\s+[A-Za-z_][\w-]*\s*\{/g;
const STOP_BLOCK = /(from|to|\d+(?:\.\d+)?%)\s*\{([^}]*)\}/gi;

const TRANSFORM_FN = /(translateX|translateY|translateZ|translate|scale|scaleX|scaleY|rotate|rotateX|rotateY|rotateZ|skew|skewX|skewY)\(([^)]+)\)/g;

function parseStopKey(key) {
  const lower = key.toLowerCase().trim();
  if (lower === 'from') return 0;
  if (lower === 'to') return 100;
  return parseFloat(lower);
}

function extractScalarValue(input) {
  const match = String(input).trim().match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  return parseFloat(match[0]);
}

function pickKeyValue(body) {
  const transformMatch = body.match(/transform\s*:\s*([^;]+);?/i);
  if (transformMatch) {
    TRANSFORM_FN.lastIndex = 0;
    const fn = TRANSFORM_FN.exec(transformMatch[1]);
    if (fn) {
      const value = extractScalarValue(fn[2]);
      if (value !== null) return value;
    }
  }
  const opacityMatch = body.match(/opacity\s*:\s*([^;]+);?/i);
  if (opacityMatch) {
    return extractScalarValue(opacityMatch[1]);
  }
  return null;
}

function parseKeyframesBody(body) {
  const stops = [];
  let match;
  STOP_BLOCK.lastIndex = 0;
  while ((match = STOP_BLOCK.exec(body)) !== null) {
    const pct = parseStopKey(match[1]);
    const value = pickKeyValue(match[2]);
    if (Number.isFinite(pct) && value !== null) {
      stops.push({ pct, value });
    }
  }
  stops.sort((a, b) => a.pct - b.pct);
  return stops;
}

function countSignChanges(stops) {
  if (stops.length < 2) return 0;
  const deltas = [];
  for (let i = 1; i < stops.length; i++) {
    deltas.push(stops[i].value - stops[i - 1].value);
  }
  let changes = 0;
  let prevSign = 0;
  for (const delta of deltas) {
    const sign = delta > 0.0001 ? 1 : delta < -0.0001 ? -1 : 0;
    if (sign === 0) continue;
    if (prevSign !== 0 && sign !== prevSign) changes += 1;
    prevSign = sign;
  }
  return changes;
}

function classifyByChanges(changes, stops) {
  const phases = changes + 1;
  if (changes >= 3) return { score: 1.0, tier: 'full-aars', phases };
  if (changes === 2) return { score: 0.8, tier: 'overshoot-settle', phases };
  if (changes === 1) return { score: 0.5, tier: 'ease-out-only', phases };
  if (stops.length >= 2) return { score: 0.2, tier: 'linear-ramp', phases: 1 };
  return { score: 0.2, tier: 'none', phases: 0 };
}

function extractBracedBody(src, startIndex) {
  let depth = 1;
  let i = startIndex;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    i += 1;
  }
  if (depth !== 0) return null;
  return { body: src.slice(startIndex, i - 1), endIndex: i };
}

function scanCssKeyframes(src) {
  const findings = [];
  KEYFRAMES_HEADER.lastIndex = 0;
  let match;
  while ((match = KEYFRAMES_HEADER.exec(src)) !== null) {
    const bodyStart = KEYFRAMES_HEADER.lastIndex;
    const extracted = extractBracedBody(src, bodyStart);
    if (!extracted) break;
    KEYFRAMES_HEADER.lastIndex = extracted.endIndex;
    const stops = parseKeyframesBody(extracted.body);
    if (stops.length < 2) continue;
    const changes = countSignChanges(stops);
    findings.push({
      selector: '@keyframes',
      stops,
      changes,
      evidence: stops.map((s) => `${s.pct}%:${s.value}`).join(' -> '),
    });
  }
  return findings;
}

function parseInlineArray(arrayLiteral) {
  const numbers = [];
  const tokenRegex = /-?\d+(?:\.\d+)?/g;
  let match;
  while ((match = tokenRegex.exec(arrayLiteral)) !== null) {
    numbers.push(parseFloat(match[0]));
  }
  return numbers;
}

function scanMotionAnimate(src) {
  const findings = [];

  const animateRegex = /animate\s*=\s*\{\{([\s\S]*?)\}\}/g;
  let match;
  while ((match = animateRegex.exec(src)) !== null) {
    const body = match[1];
    const propRegex = /\b(x|y|opacity|scale|rotate)\s*:\s*\[([^\]]+)\]/g;
    let prop;
    while ((prop = propRegex.exec(body)) !== null) {
      const numbers = parseInlineArray(prop[2]);
      if (numbers.length < 2) continue;
      const stops = numbers.map((value, index) => ({
        pct: (index / (numbers.length - 1)) * 100,
        value,
      }));
      const changes = countSignChanges(stops);
      findings.push({
        selector: `motion.animate.${prop[1]}`,
        stops,
        changes,
        evidence: numbers.join(' -> '),
      });
    }
  }

  const keyframesArrayRegex = /keyframes\s*:\s*\[([^\]]+)\]/g;
  while ((match = keyframesArrayRegex.exec(src)) !== null) {
    const numbers = parseInlineArray(match[1]);
    if (numbers.length < 2) continue;
    const stops = numbers.map((value, index) => ({
      pct: (index / (numbers.length - 1)) * 100,
      value,
    }));
    const changes = countSignChanges(stops);
    findings.push({
      selector: 'transition.keyframes',
      stops,
      changes,
      evidence: numbers.join(' -> '),
    });
  }

  return findings;
}

function detectSpringBounce(src) {
  const bounceRegex = /bounce\s*:\s*(0?\.\d+|1(?:\.0+)?)/g;
  const matches = [];
  let match;
  while ((match = bounceRegex.exec(src)) !== null) {
    const value = parseFloat(match[1]);
    if (value > 0) {
      matches.push({ selector: 'spring.bounce', value: `bounce: ${match[1]}` });
    }
  }
  return matches;
}

export function scoreAarsPattern(source) {
  const src = source || '';
  const evidence = [];

  const cssFindings = scanCssKeyframes(src);
  const motionFindings = scanMotionAnimate(src);
  const springBounces = detectSpringBounce(src);

  let bestScore = 0;
  let bestPhases = 0;

  for (const finding of [...cssFindings, ...motionFindings]) {
    const classification = classifyByChanges(finding.changes, finding.stops);
    evidence.push({
      selector: finding.selector,
      value: finding.evidence,
      tier: classification.tier,
      score: classification.score,
      phases: classification.phases,
    });
    if (classification.score > bestScore) {
      bestScore = classification.score;
      bestPhases = classification.phases;
    }
  }

  if (springBounces.length > 0) {
    const springScore = 0.7;
    for (const bounce of springBounces) {
      evidence.push({
        selector: bounce.selector,
        value: bounce.value,
        tier: 'spring-implicit-aars',
        score: springScore,
        phases: 3,
      });
    }
    if (bestScore < springScore) {
      bestScore = springScore;
      bestPhases = Math.max(bestPhases, 3);
    }
  }

  if (evidence.length === 0) {
    return { score: 0.2, phases_detected: 0, evidence: [] };
  }

  return {
    score: +bestScore.toFixed(2),
    phases_detected: bestPhases,
    evidence,
  };
}
