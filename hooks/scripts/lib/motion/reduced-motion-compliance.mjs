// Reduced-motion compliance detector — Sprint 9 Motion Scoring 2.0.
//
// Static proxy for WCAG 2.3.3 Animation from Interactions: does the
// source ship a `prefers-reduced-motion: reduce` guard that disables
// or degrades motion? Also covers the JS surface (useReducedMotion,
// motion.config.reducedMotion) and the scroll-driven `animation-timeline:
// view()` dual-guard requirement.

const REDUCED_MOTION_MEDIA = /@media[^{]*prefers-reduced-motion\s*:\s*reduce[^{]*\{([\s\S]*?)\}\s*\}/gi;

const FULL_DISABLE_PATTERNS = [
  /animation\s*:\s*none\b/i,
  /animation-duration\s*:\s*0(?:s|ms)?\b/i,
  /transition\s*:\s*none\b/i,
  /transition-duration\s*:\s*0(?:s|ms)?\b/i,
];

const DEGRADE_PATTERNS = [
  /transform\s*:\s*none\b/i,
  /animation-name\s*:\s*none\b/i,
  /animation-iteration-count\s*:\s*1\b/i,
];

const MOTION_PRESENCE_PATTERNS = [
  /\btransition\s*:/i,
  /\banimation\s*:/i,
  /\btransform\s*:\s*(?!none)/i,
  /\b@keyframes\b/i,
  /\bmotion\.[a-z]+\b/i,
  /\banimate\s*[:=]/i,
  /\bwhileHover\b/i,
  /\bwhileTap\b/i,
  /\banimation-timeline\s*:/i,
];

const JSX_GUARD_PATTERNS = [
  /useReducedMotion\s*\(/,
  /prefersReducedMotion/,
  /motion\.config\.reducedMotion/,
  /reducedMotion\s*:\s*['"](?:always|user)['"]/,
];

function hasMotion(src) {
  return MOTION_PRESENCE_PATTERNS.some((re) => re.test(src));
}

function hasScrollDrivenAnimation(src) {
  return /animation-timeline\s*:\s*view\s*\(/i.test(src)
    || /animation-timeline\s*:\s*scroll\s*\(/i.test(src);
}

function hasSupportsGuard(src) {
  return /@supports[^{]*animation-timeline/i.test(src);
}

function analyzeMediaBlocks(src) {
  let fullDisable = false;
  let degrade = false;
  let blockCount = 0;
  const evidence = [];

  let match;
  REDUCED_MOTION_MEDIA.lastIndex = 0;
  while ((match = REDUCED_MOTION_MEDIA.exec(src)) !== null) {
    blockCount += 1;
    const body = match[1] || '';
    const hitsFull = FULL_DISABLE_PATTERNS.some((re) => re.test(body));
    const hitsDegrade = DEGRADE_PATTERNS.some((re) => re.test(body));
    if (hitsFull) {
      fullDisable = true;
      evidence.push({ kind: 'media-full-disable', snippet: match[0].slice(0, 160) });
    } else if (hitsDegrade) {
      degrade = true;
      evidence.push({ kind: 'media-degrade', snippet: match[0].slice(0, 160) });
    } else {
      evidence.push({ kind: 'media-empty', snippet: match[0].slice(0, 160) });
    }
  }

  return { fullDisable, degrade, blockCount, evidence };
}

function analyzeJsxGuards(src) {
  const evidence = [];
  let hookFound = false;
  let conditionalFound = false;

  for (const pattern of JSX_GUARD_PATTERNS) {
    if (pattern.test(src)) {
      hookFound = true;
      evidence.push({ kind: 'jsx-hook', pattern: pattern.source });
    }
  }

  if (hookFound) {
    const conditionalRegex = /(prefersReducedMotion|reducedMotion|shouldReduceMotion)\s*\?\s*[^:]+:\s*[^;]+/;
    if (conditionalRegex.test(src)) {
      conditionalFound = true;
      evidence.push({ kind: 'jsx-conditional' });
    } else if (/if\s*\(\s*(prefersReducedMotion|reducedMotion|shouldReduceMotion)\s*\)/.test(src)) {
      conditionalFound = true;
      evidence.push({ kind: 'jsx-if-guard' });
    }
  }

  return { hookFound, conditionalFound, evidence };
}

export function scoreReducedMotionCompliance(source) {
  const src = source || '';
  const evidence = [];

  const motionPresent = hasMotion(src);
  if (!motionPresent) {
    return {
      score: 1.0,
      has_guard: false,
      has_full_disable: false,
      evidence: [{ kind: 'no-motion-trivial' }],
    };
  }

  const media = analyzeMediaBlocks(src);
  evidence.push(...media.evidence);

  const jsx = analyzeJsxGuards(src);
  evidence.push(...jsx.evidence);

  const hasFullDisable = media.fullDisable;
  const hasDegrade = media.degrade;
  const jsxGuardActive = jsx.hookFound && jsx.conditionalFound;
  const hasGuard = hasFullDisable || hasDegrade || jsxGuardActive || media.blockCount > 0;

  let score;
  if (hasFullDisable || jsxGuardActive) {
    score = 1.0;
  } else if (hasDegrade) {
    score = 0.7;
  } else if (media.blockCount > 0) {
    score = 0.4;
  } else {
    score = 0.0;
  }

  if (hasScrollDrivenAnimation(src)) {
    const supportsOk = hasSupportsGuard(src);
    const reducedMotionOk = media.blockCount > 0 || jsxGuardActive;
    if (!supportsOk || !reducedMotionOk) {
      score = Math.max(0, +(score - 0.3).toFixed(2));
      evidence.push({
        kind: 'scroll-driven-missing-dual-guard',
        supports: supportsOk,
        reducedMotion: reducedMotionOk,
      });
    }
  }

  return {
    score: +score.toFixed(2),
    has_guard: hasGuard,
    has_full_disable: hasFullDisable,
    evidence,
  };
}
