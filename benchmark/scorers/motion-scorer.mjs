// Motion readiness scorer — source-level, context-aware.
//
// Scoring is gated on *appropriate* motion for the category or the
// prompt's declared motion_appetite (0 static · 1 subtle · 2 expressive
// · 3 kinetic). Long-form reading surfaces are not penalised for having
// no motion — the absence is correct there. Dashboards want subtle;
// motion-marketing and consumer-mobile want expressive or higher.
//
// Missing context → treat as motion_appetite 2 (expressive default),
// matching the skill's own fallback.

const CATEGORY_APPETITE = {
  editorial:           0, // long-form reading — stillness is correct
  fintech_trust:       1, // restrained
  healthcare:          1, // calm
  accessibility_first: 1, // minimal vestibular triggers
  saas_dashboard:      1, // subtle transitions only
  multi_locale:        2, // neutral
  transplantation:     2,
  creative_portfolio:  3,
  consumer_mobile:     3,
  motion_marketing:    3,
};

function expectedAppetite({ promptContext } = {}) {
  if (promptContext?.constraints?.motion_appetite !== undefined) {
    return promptContext.constraints.motion_appetite;
  }
  if (promptContext?.category && CATEGORY_APPETITE[promptContext.category] !== undefined) {
    return CATEGORY_APPETITE[promptContext.category];
  }
  return 2;
}

export function scoreMotion(source, promptContext) {
  const src = source || '';
  const appetite = expectedAppetite({ promptContext });

  // ── Detect motion signals ──────────────────────────────────────────────
  const signals = {
    springTokens:      /spring\.(micro|snappy|ui|gentle|bounce|layout)\b/.test(src),
    v12TwoParam:       /visualDuration|bounce:\s*0\.\d/.test(src),
    startingStyle:     /@starting-style\b/.test(src),
    animationTimeline: /animation-timeline:\s*(view|scroll)\b/.test(src),
    viewTransition:    /@view-transition\b/.test(src),
    linearEasing:      /linear\(/.test(src),
    reducedMotion:     /@media\s*\(prefers-reduced-motion/.test(src),
    motionReactImport: /from\s+['"]motion\/react['"]/.test(src),
    deprecatedImport:  /from\s+['"]framer-motion['"]/.test(src),
  };

  const hasLongAnimation = /(animation:\s*[^;]*\d+s|duration:\s*(\d{4,}|[5-9]\d+\d*ms))/.test(src);
  const hasPauseControl  = /animation-play-state|pauseAll|pauseMotion|setPaused/.test(src);
  const hardcodedDurations = (src.match(/duration:\s*(100|200|300|400|500)ms/g) || []).length;

  const anyMotion =
    signals.springTokens ||
    signals.v12TwoParam ||
    signals.startingStyle ||
    signals.animationTimeline ||
    signals.viewTransition ||
    signals.motionReactImport ||
    /transition(-|\s|:)/i.test(src);

  // ── Appetite 0 (static) ────────────────────────────────────────────────
  // The correct answer is "no motion". Presence of motion is the defect.
  if (appetite === 0) {
    if (!anyMotion) return 5;
    if (signals.reducedMotion) return 4; // motion but safe
    return 3; // motion present without any safety gate in a static context
  }

  // ── Appetite 1+ — motion is expected. Score by signal quality. ─────────
  let score = 1;

  if (signals.springTokens)      score += 1.5;
  if (signals.v12TwoParam)       score += 0.5;
  if (signals.startingStyle)     score += 0.5;
  if (signals.animationTimeline) score += 0.5;
  if (signals.viewTransition)    score += 0.5;
  if (signals.linearEasing)      score += 0.3;
  if (signals.reducedMotion)     score += 1;
  if (signals.motionReactImport) score += 0.5;
  if (signals.deprecatedImport)  score -= 0.5;

  if (hasLongAnimation) {
    if (hasPauseControl) score += 0.5;
    else score -= 1; // WCAG 2.2.2 fail
  }
  if (hardcodedDurations > 3) score -= 0.5;

  // For subtle-motion categories (appetite 1), don't punish lack of
  // CSS-first escapes — spring tokens + reduced-motion alone is a 5.
  if (appetite === 1 && signals.springTokens && signals.reducedMotion) {
    score = Math.max(score, 4.5);
  }

  // For expressive/kinetic (≥2), require at least ONE CSS-first escape OR
  // a second motion primitive to clear 4.
  if (appetite >= 2) {
    const cssFirstCount = [
      signals.startingStyle,
      signals.animationTimeline,
      signals.viewTransition,
    ].filter(Boolean).length;
    if (!signals.springTokens && cssFirstCount === 0) score = Math.min(score, 2.5);
  }

  return Math.max(1, Math.min(5, Math.round(score * 2) / 2));
}

// ── Sprint 4 Task 13.1 — 2026 modernity bonus ───────────────────────────────
// Rewards generations that use Baseline-2026 web primitives: View Transitions,
// scroll-driven animations (with dual guard), popover + anchor + invoker
// combo, field-sizing, and @layer cascade declarations.
//
// The bonus is additive to the 0-5 motion_readiness scale — the benchmark's
// 9th dimension `craft_measurable` inherits it proportionally. Values sum
// to at most 0.75 (all primitives present) which keeps the score within the
// 0-5 range after Math.min below.
//
// Regex detection is deliberately forgiving: the generator can spread
// primitives across JSX/CSS/inline style, so we scan the full serialised
// source.

const MODERNITY_RULES = Object.freeze([
  {
    id: 'view-transition-name',
    bonus: 0.2,
    // Either CSS (view-transition-name:) or inline style / React prop
    // (viewTransitionName / view-transition-name). Ignore matches inside
    // comments — cheap strip before matching.
    match: (src) => /(view-transition-name\s*:|\bviewTransitionName\b)/.test(src),
  },
  {
    id: 'animation-timeline-guarded',
    bonus: 0.2,
    // Must pair the `animation-timeline: view()` / `scroll()` primitive with a
    // reduced-motion guard (either `@supports (animation-timeline: view())`
    // AND `@media (prefers-reduced-motion: no-preference)` OR the fallback
    // `@media (prefers-reduced-motion: reduce) { ... animation: none }`).
    // Partial detection — exact dual-guard shape is verified by slop-scanner
    // pattern #27+ / the stylesheet linter.
    match: (src) =>
      /animation-timeline:\s*(view|scroll)\b/.test(src)
      && /prefers-reduced-motion/.test(src),
  },
  {
    id: 'popover-anchor-invoker',
    bonus: 0.15,
    // Combo detection: must have AT LEAST TWO of the three primitives present.
    // Detecting all three is too brittle (e.g. some generators emit `popover`
    // on the menu but use a native-dialog opener without `commandfor`).
    match: (src) => {
      const popover = /\bpopover\s*=\s*["']?(auto|manual|hint)/.test(src);
      const anchor = /(anchor-name\s*:|anchorName\s*:|position-anchor\s*:|positionAnchor\s*:)/.test(src);
      const invoker = /\bcommandfor\s*=/.test(src) || /\bpopovertarget\s*=/.test(src);
      return [popover, anchor, invoker].filter(Boolean).length >= 2;
    },
  },
  {
    id: 'field-sizing-content',
    bonus: 0.1,
    match: (src) => /field-sizing\s*:\s*content/.test(src) || /\bfieldSizing\s*:\s*["']content["']/.test(src),
  },
  {
    id: 'at-layer-cascade',
    bonus: 0.1,
    // Requires an explicit layer ordering — bare `@layer foo;` doesn't count
    // because it provides no cascade discipline.
    match: (src) => /@layer\s+[A-Za-z_-]+\s*,\s*[A-Za-z_-]+/.test(src),
  },
]);

export function scoreMotionWithBonus(source, promptContext) {
  const src = source || '';
  const base = scoreMotion(source, promptContext);
  const awarded = [];
  let bonus = 0;
  for (const rule of MODERNITY_RULES) {
    if (rule.match(src)) {
      bonus += rule.bonus;
      awarded.push({ id: rule.id, bonus: rule.bonus });
    }
  }
  bonus = +bonus.toFixed(2);
  const boosted = Math.min(5, +(base + bonus).toFixed(2));
  return {
    score: base,
    modernity_bonus: bonus,
    boosted_score: boosted,
    awarded,
    rules_checked: MODERNITY_RULES.length,
  };
}

