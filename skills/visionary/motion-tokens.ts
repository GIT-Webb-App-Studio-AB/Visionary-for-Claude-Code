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
