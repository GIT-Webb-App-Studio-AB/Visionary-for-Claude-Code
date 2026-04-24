/**
 * motion-tokens.ts — Canonical Motion Token System (Motion v12 baseline, 2026)
 *
 * Used by all visionary styles. Import by name, never hardcode durations/easings.
 *
 * CRITICAL: Use 'motion/react' — NOT 'framer-motion' (deprecated package name).
 *   import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
 *
 * Motion v12 introduces two-parameter springs (`bounce` + `visualDuration`) that
 * describe perceived timing directly instead of raw physics. Prefer those for
 * new code. The legacy stiffness/damping/mass table is kept for styles / projects
 * that haven't upgraded.
 */

// ─── Spring Token System (v12, preferred) ─────────────────────────────────

export const spring = {
  /** Hover states, toggles, icon swaps — instant response */
  micro:   { type: 'spring' as const, bounce: 0.0,  visualDuration: 0.15 },

  /** Modals, drawers, dropdowns — snappy, small overshoot */
  snappy:  { type: 'spring' as const, bounce: 0.15, visualDuration: 0.25 },

  /** Page transitions, card entrances — canonical UI feel */
  ui:      { type: 'spring' as const, bounce: 0.2,  visualDuration: 0.35 },

  /** Health / wellness / clinical — deliberately slow settle */
  gentle:  { type: 'spring' as const, bounce: 0.1,  visualDuration: 0.6 },

  /** Consumer / playful / social — visible bounce */
  bounce:  { type: 'spring' as const, bounce: 0.55, visualDuration: 0.5 },

  /** Reorder / resize / layout shifts — predictable repositioning */
  layout:  { type: 'spring' as const, bounce: 0.18, visualDuration: 0.4 },
} as const;

// ─── Spring Tokens (v11 / legacy, stiffness-damping-mass) ────────────────
// Keep until every project has migrated to Motion v12. Functionally close to
// the v12 tokens above; Motion's own migration guide treats them as equivalent.

export const springLegacy = {
  micro:   { type: 'spring' as const, stiffness: 500, damping: 35, mass: 0.5 },
  snappy:  { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.8 },
  ui:      { type: 'spring' as const, stiffness: 300, damping: 25, mass: 1 },
  gentle:  { type: 'spring' as const, stiffness: 180, damping: 22, mass: 1 },
  bounce:  { type: 'spring' as const, stiffness: 400, damping: 10, mass: 0.8 },
  layout:  { type: 'spring' as const, stiffness: 250, damping: 28, mass: 1 },
} as const;

// ─── Easing catalogue (CSS `linear()` for complex curves) ─────────────────
// `linear()` is Baseline 2024. Use it inline in CSS for curves too complex for
// cubic-bezier without dropping to JS animation.

export const cssEasing = {
  /** Default: almost linear but with a touch of ease-out at the tail */
  out:         'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Brisk, used on large motion */
  outSnappy:   'cubic-bezier(0.2, 0, 0, 1)',
  /** Decent bounce */
  bounce:      'linear(0, 0.11 8%, 0.34 14%, 0.58 19%, 0.81 25%, 0.93 29%, 1.02 33%, 1.06 37%, 1.05 43%, 1.00 54%, 1.00 100%)',
  /** Soft organic settle */
  settle:      'linear(0, 0.33 20%, 0.66 35%, 0.88 50%, 0.97 65%, 1 100%)',
  /** Anticipation + release (pull-back then forward) */
  anticipate:  'linear(0, -0.04 17%, -0.07 27%, 0 38%, 0.5 60%, 1 100%)',
} as const;

// ─── Variant Architecture ─────────────────────────────────────────────────

/** Standard card variant state machine */
export const cardVariants = {
  hidden:  { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: spring.ui },
  hover:   { y: -4, scale: 1.02, transition: spring.micro },
  tap:     { scale: 0.97, transition: spring.micro },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

/** Stagger container for list entrances */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

// ─── Motion Tier Mapping ──────────────────────────────────────────────────

export type MotionTier = 'Static' | 'Subtle' | 'Expressive' | 'Kinetic';

export const tierDefaults: Record<MotionTier, {
  enterDuration: number;
  enterEase: string;
  hoverScale: number;
  spring: typeof spring[keyof typeof spring] | null;
}> = {
  Static: {
    enterDuration: 0,
    enterEase: 'linear',
    hoverScale: 1.0,
    spring: null, // no spring — state change is instant or opacity-only
  },
  Subtle: {
    enterDuration: 200,
    enterEase: cssEasing.out,
    hoverScale: 1.01,
    spring: spring.gentle,
  },
  Expressive: {
    enterDuration: 350,
    enterEase: cssEasing.bounce,
    hoverScale: 1.03,
    spring: spring.ui,
  },
  Kinetic: {
    enterDuration: 500,
    enterEase: cssEasing.outSnappy,
    hoverScale: 1.05,
    spring: spring.bounce,
  },
};

// ─── Reduced Motion Safety ────────────────────────────────────────────────

/**
 * WCAG 2.3.3 — always provide reduced-motion alternatives.
 *
 * Use useReducedMotion() from motion/react:
 *   const prefersReducedMotion = useReducedMotion();
 *   const transition = prefersReducedMotion ? reducedMotion.safe : spring.ui;
 */
export const reducedMotion = {
  /** Safe: opacity only, no movement */
  safe: { opacity: [0, 1], transition: { duration: 0.2 } },
  /** No animation at all */
  none: { transition: { duration: 0 } },
};

// ─── CSS-First Motion Snippets (Baseline 2024+) ───────────────────────────
// Drop these into CSS when the animation doesn't need JS state — cheaper,
// more declarative, and the browser can optimize them.

// ─── View Transitions helpers (Sprint 4 Task 12.3) ─────────────────────────
// Same-document API. `document.startViewTransition` lives in Chrome/Edge 111+,
// Safari 18.2+, Firefox 142+. The helpers below degrade to a no-op when the
// API is absent — safe to call from every stack.

/**
 * Attach a stable `view-transition-name` to an element so it morphs across
 * navigations. Usage:
 *
 *   <article {...useViewTransition(`post-${post.id}`)}>...</article>
 *
 * The name MUST be unique per page — if two cards share the same name, the
 * browser won't know which is the "from" and which is the "to".
 */
export function useViewTransition(name: string) {
  return { style: { viewTransitionName: name } as import('react').CSSProperties };
}

/**
 * Wrap a route-change callback in a View Transition when available.
 * Stack-agnostic — works with Next.js App Router, Vue Router,
 * SvelteKit `goto`, SolidRouter, etc. Caller passes the navigation thunk.
 */
export async function sameDocumentViewTransition(navigate: () => void | Promise<void>) {
  if (typeof document === 'undefined' || typeof (document as any).startViewTransition !== 'function') {
    await navigate();
    return;
  }
  const transition = (document as any).startViewTransition(async () => {
    await navigate();
  });
  try {
    await transition.finished;
  } catch {
    /* user-initiated skip — treat as success */
  }
}

// ─── Scroll-driven animation presets (Sprint 4 Task 12.6) ───────────────────
// `animation-timeline` lives in Chrome/Edge 115+, Safari 26+, Firefox under
// flag. The helpers emit CSS inside `@supports (animation-timeline: view())`
// so pre-Baseline browsers just see the final state.

export const scrollTimelines = {
  /** Card reveal — fade + translate as the element enters. */
  revealEntry:    'entry 0% cover 30%',
  /** Parallax slow — low-velocity movement across the full viewport pass. */
  parallaxSlow:   'contain 0% contain 100%',
  /** Pinned-scrub — animation runs over the full cover range (hero sections). */
  pinnedScrub:    'cover 0% cover 100%',
  /** Exit fade — element fades as it leaves the viewport. */
  exitFade:       'exit 0% exit 100%',
} as const;

/**
 * Wraps scroll-timeline CSS in the dual @supports + prefers-reduced-motion
 * guard pattern required by Sprint 4 Task 12.6 AC (slop-scanner flags
 * scroll-animations without the reduce-motion guard).
 */
export function scrollAnimationCss(opts: {
  selector: string;
  keyframes: string;      // raw `@keyframes foo { ... }` string
  keyframesName: string;
  timeline?: keyof typeof scrollTimelines;
  range?: string;         // override the preset range if non-standard
}) {
  const range = opts.range ?? scrollTimelines[opts.timeline ?? 'revealEntry'];
  return `
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    ${opts.selector} {
      animation: ${opts.keyframesName} linear both;
      animation-timeline: view();
      animation-range: ${range};
    }
    ${opts.keyframes}
  }
}
@media (prefers-reduced-motion: reduce) {
  ${opts.selector} {
    animation: none;
    opacity: 1;
    translate: 0 0;
  }
}
`.trim();
}

// ─── Shape presets (Sprint 4 Task 12.5) ─────────────────────────────────────
// The CSS `shape()` function is Baseline 2026 in Chrome/Edge 139+ and
// Safari 18.4+. Exposed as CSS custom properties so style files can drop
// them straight into `clip-path` declarations. Fallback polygon() versions
// are emitted inside an `@supports not` block by the generator.

export const shapePresets = {
  /** Gentle wave across the full width — section dividers, hero bottom edge */
  wave:         'shape(from 0% 40%, curve to 100% 40% with 50% 0%)',
  /** Arch/dome — hero tops, modal tops, card banner cut-outs */
  arch:         'shape(from 0% 100%, curve to 100% 100% with 50% 0%)',
  /** Asymmetric notch — newspaper/editorial section breaks */
  notch:        'shape(from 0% 0%, line to 30% 0%, line to 50% 10%, line to 70% 0%, line to 100% 0%, line to 100% 100%, line to 0% 100%, close)',
  /** Scalloped edge — coupon / ticket / retro vibes */
  scalloped:    'shape(from 0% 10%, curve to 8% 0% with 4% 10%, curve to 16% 10% with 12% 0%, curve to 24% 0% with 20% 10%, curve to 32% 10% with 28% 0%, curve to 40% 0% with 36% 10%, curve to 48% 10% with 44% 0%, curve to 56% 0% with 52% 10%, curve to 64% 10% with 60% 0%, curve to 72% 0% with 68% 10%, curve to 80% 10% with 76% 0%, curve to 88% 0% with 84% 10%, curve to 100% 10% with 96% 0%, line to 100% 100%, line to 0% 100%, close)',
  /** Angled slash — editorial/brutalist diagonal transitions */
  slash:        'shape(from 0% 0%, line to 100% 0%, line to 85% 100%, line to 0% 100%, close)',
} as const;

/**
 * Emits a CSS custom-property block for dropping into `:root`. Consumers
 * reference via `clip-path: var(--shape-wave)` inside their components.
 * A polygon() fallback is emitted inside `@supports not (clip-path: shape(...))`.
 */
export function shapePresetsCss() {
  return `
:root {
  --shape-wave: ${shapePresets.wave};
  --shape-arch: ${shapePresets.arch};
  --shape-notch: ${shapePresets.notch};
  --shape-scalloped: ${shapePresets.scalloped};
  --shape-slash: ${shapePresets.slash};
}

@supports not (clip-path: shape(from 0% 0%, line to 100% 0%)) {
  :root {
    --shape-wave: polygon(0 40%, 25% 20%, 50% 40%, 75% 60%, 100% 40%, 100% 100%, 0 100%);
    --shape-arch: polygon(0 100%, 0 50%, 50% 0%, 100% 50%, 100% 100%);
    --shape-notch: polygon(0 0, 30% 0, 50% 10%, 70% 0, 100% 0, 100% 100%, 0 100%);
    --shape-scalloped: polygon(0 10%, 100% 10%, 100% 100%, 0 100%);
    --shape-slash: polygon(0 0, 100% 0, 85% 100%, 0 100%);
  }
}
`.trim();
}

export const cssSnippets = {
  /**
   * @starting-style — Baseline 2024. Gives any element an entry animation
   * without JS, including display: none → block transitions and popovers.
   */
  startingStyleFadeUp: `
/* @starting-style — Baseline 2024 */
.enter {
  transition: opacity 220ms var(--ease-out), translate 220ms var(--ease-out);
  opacity: 1;
  translate: 0 0;
}
@starting-style {
  .enter {
    opacity: 0;
    translate: 0 16px;
  }
}
`.trim(),

  /**
   * animation-timeline: scroll() — Baseline. Hook any keyframe animation to
   * the page scroll without IntersectionObserver boilerplate.
   */
  scrollTimelineProgress: `
/* animation-timeline: scroll() */
.progress-bar {
  animation: grow linear;
  animation-timeline: scroll(root block);
}
@keyframes grow { from { scale: 0 1; } to { scale: 1 1; } }
`.trim(),

  /**
   * animation-timeline: view() — Baseline. Animate elements as they enter the
   * viewport without scroll listeners. Perfect for reveal-on-scroll cards.
   */
  viewTimelineReveal: `
/* animation-timeline: view() */
.reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 20% cover 40%;
}
@keyframes reveal {
  from { opacity: 0; translate: 0 24px; }
  to   { opacity: 1; translate: 0 0; }
}
`.trim(),

  /**
   * Cross-document View Transitions — perfect for MPA stacks (Astro, Laravel,
   * Nuxt multipage, plain HTML). Chrome 126+, Safari 18.2+.
   */
  crossDocumentViewTransition: `
/* Cross-document View Transitions — MPA stacks (Astro/Laravel/Nuxt) */
@view-transition { navigation: auto; }
/* On same-document SPA navigations, trigger manually: */
/*   document.startViewTransition(() => { /* update DOM */ /* }); */
`.trim(),

  /**
   * Anchor positioning — ~91 % coverage. Tooltips, popovers, dropdowns that
   * track their trigger without JS.
   */
  anchorPopover: `
/* CSS anchor positioning (Baseline 2024 in Chromium; polyfill elsewhere) */
.trigger { anchor-name: --trigger-1; }
.popover {
  position-anchor: --trigger-1;
  top: anchor(bottom); left: anchor(center);
  translate: -50% 8px;
}
`.trim(),

  /**
   * Reduced-motion gate for CSS-first animations.
   */
  reducedMotionCssGate: `
/* WCAG 2.3.3 — reduce transform, keep opacity */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  /* Keep the state visible by preserving opacity transitions where possible */
}
`.trim(),
} as const;
