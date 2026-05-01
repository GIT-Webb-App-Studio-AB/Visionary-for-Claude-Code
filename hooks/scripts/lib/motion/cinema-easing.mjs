// Cinema-grade easing detector — Sprint 9 Motion Scoring 2.0.
//
// Looks for advanced easing signals: linear() with >=5 stops, cubic-bezier
// curves with overshoot (peak > 1.0), ease-out-heavy distributions on
// long animations, and Motion v12 spring tokens with `bounce > 0`.
// Penalises long animations that ship only `ease-in-out`.

const SAMPLE_TS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

function bezierY(t, p1y, p2y) {
  const u = 1 - t;
  return 3 * u * u * t * p1y + 3 * u * t * t * p2y + t * t * t;
}

function analyzeBezier(p1x, p1y, p2x, p2y) {
  const samples = SAMPLE_TS.map((t) => bezierY(t, p1y, p2y));
  const peak = Math.max(...samples);
  const last = samples[samples.length - 1];
  const overshoot = peak > 1.0001;

  const valueAt07 = bezierY(0.7, p1y, p2y);
  const distanceLast30 = last - valueAt07;
  const easeOutHeavy = distanceLast30 > 0.5;

  return { peak, overshoot, easeOutHeavy };
}

function parseBezierArgs(raw) {
  const parts = raw.split(',').map((s) => Number(s.trim()));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
  return parts;
}

function countLinearStops(raw) {
  return raw.split(',').map((s) => s.trim()).filter(Boolean).length;
}

function findLinearStops(src) {
  const out = [];
  const re = /\blinear\(\s*([^)]+)\)/gi;
  let match;
  while ((match = re.exec(src)) !== null) {
    out.push(countLinearStops(match[1]));
  }
  return out;
}

function findBeziers(src) {
  const out = [];
  const re = /cubic-bezier\(\s*([^)]+)\)/gi;
  let match;
  while ((match = re.exec(src)) !== null) {
    const args = parseBezierArgs(match[1]);
    if (args) out.push({ args, raw: match[0] });
  }
  return out;
}

function findSpringBounce(src) {
  const re = /bounce\s*[:=]\s*(0?\.\d+|1(?:\.0+)?)/g;
  const out = [];
  let match;
  while ((match = re.exec(src)) !== null) {
    const v = Number(match[1]);
    if (!Number.isNaN(v) && v > 0) out.push(v);
  }
  return out;
}

function findDurations(src) {
  const out = [];
  const re = /(?:transition|animation)(?:-duration)?\s*:\s*([^;]+);?/gi;
  let match;
  while ((match = re.exec(src)) !== null) {
    const value = match[1];
    const durMatch = value.match(/(\d+(?:\.\d+)?)\s*(ms|s)\b/i);
    if (!durMatch) continue;
    const num = Number(durMatch[1]);
    const unit = durMatch[2].toLowerCase();
    const ms = unit === 's' ? num * 1000 : num;
    out.push({ ms, raw: match[0] });
  }
  return out;
}

function hasOnlyEaseInOut(src) {
  const hasEaseInOut = /\bease-in-out\b/i.test(src);
  const hasCubic = /cubic-bezier\(/i.test(src);
  const hasLinearFn = /\blinear\(/i.test(src);
  const hasSpring = /\bspring\b/i.test(src) || /bounce\s*[:=]/i.test(src);
  return hasEaseInOut && !hasCubic && !hasLinearFn && !hasSpring;
}

export function scoreCinemaEasing(source) {
  const src = source || '';
  const evidence = [];

  const linearCounts = findLinearStops(src);
  const linearStopsMax = linearCounts.length ? Math.max(...linearCounts) : 0;

  const beziers = findBeziers(src);
  const bounces = findSpringBounce(src);
  const durations = findDurations(src);

  const hasAnyEasing = linearCounts.length > 0
    || beziers.length > 0
    || bounces.length > 0
    || /\b(?:ease-in-out|ease-in|ease-out|ease|linear)\b/.test(src);

  if (!hasAnyEasing) {
    return {
      score: 0.0,
      has_overshoot: false,
      has_long_easeout: false,
      linear_stops_max: 0,
      evidence: [{ kind: 'no-easing' }],
    };
  }

  if (bounces.length > 0) {
    evidence.push({ kind: 'spring-bounce', values: bounces });
    return {
      score: 1.0,
      has_overshoot: bounces.some((b) => b > 0),
      has_long_easeout: false,
      linear_stops_max: linearStopsMax,
      evidence,
    };
  }

  let hasOvershoot = false;
  let hasLongEaseout = false;
  let bezierBonus = 0;

  for (const bz of beziers) {
    const [p1x, p1y, p2x, p2y] = bz.args;
    const analysis = analyzeBezier(p1x, p1y, p2x, p2y);
    if (analysis.overshoot) {
      hasOvershoot = true;
      evidence.push({ kind: 'bezier-overshoot', raw: bz.raw, peak: +analysis.peak.toFixed(3) });
    }
    if (analysis.easeOutHeavy) {
      hasLongEaseout = true;
      evidence.push({ kind: 'bezier-easeout-heavy', raw: bz.raw });
    }
  }

  if (hasOvershoot) bezierBonus += 0.4;
  if (hasLongEaseout) bezierBonus += 0.3;

  let linearBonus = 0;
  if (linearStopsMax >= 5) linearBonus = 0.4;
  else if (linearStopsMax >= 3) linearBonus = 0.2;
  if (linearBonus > 0) {
    evidence.push({ kind: 'linear-stops', max: linearStopsMax });
  }

  let baseline = 0;
  if (beziers.length > 0) {
    baseline = 0.5;
    evidence.push({ kind: 'cubic-bezier-present', count: beziers.length });
  } else if (linearStopsMax > 0) {
    baseline = 0.3;
  } else if (hasAnyEasing) {
    baseline = 0.3;
  }

  let score = Math.min(1.0, baseline + bezierBonus + linearBonus);

  const longDurations = durations.filter((d) => d.ms >= 400);
  if (longDurations.length > 0 && hasOnlyEaseInOut(src)) {
    score = Math.min(score, 0.3);
    evidence.push({ kind: 'long-duration-flat-easing', durations: longDurations.map((d) => d.ms) });
  }

  return {
    score: +score.toFixed(2),
    has_overshoot: hasOvershoot,
    has_long_easeout: hasLongEaseout,
    linear_stops_max: linearStopsMax,
    evidence,
  };
}
