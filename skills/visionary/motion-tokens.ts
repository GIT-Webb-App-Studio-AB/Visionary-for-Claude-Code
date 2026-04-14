/**
 * motion-tokens.ts — Canonical Motion Token System
 * 
 * Used by all 186 design styles. Import spring tokens by name, never hardcode.
 * 
 * CRITICAL: Use 'motion/react' — NOT 'framer-motion' (deprecated package name).
 * import { motion } from 'motion/react'
 */

// ─── Spring Token System ───────────────────────────────────────────────────

export const spring = {
  /** Hover states, toggles, icon swaps — instant response */
  micro:   { type: "spring" as const, stiffness: 500, damping: 35, mass: 0.5 },
  
  /** Modals, drawers, dropdowns — snappy but controlled */
  snappy:  { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.8 },
  
  /** Page transitions, card entrances — standard UI feel */
  ui:      { type: "spring" as const, stiffness: 300, damping: 25, mass: 1 },
  
  /** Health apps, calm UIs, medical, wellness — deliberately slow */
  gentle:  { type: "spring" as const, stiffness: 180, damping: 22, mass: 1 },
  
  /** Consumer apps, playful UI, social — visible bounce */
  bounce:  { type: "spring" as const, stiffness: 400, damping: 10, mass: 0.8 },
  
  /** Reorder, resize, layout shifts — predictable repositioning */
  layout:  { type: "spring" as const, stiffness: 250, damping: 28, mass: 1 },
} as const;

// ─── Duration-Based Alternative ───────────────────────────────────────────

export const springDuration = {
  micro:  { type: "spring" as const, duration: 0.2,  bounce: 0.1 },
  snappy: { type: "spring" as const, duration: 0.35, bounce: 0.15 },
  ui:     { type: "spring" as const, duration: 0.5,  bounce: 0.2 },
  gentle: { type: "spring" as const, duration: 0.7,  bounce: 0.1 },
  bounce: { type: "spring" as const, duration: 0.5,  bounce: 0.4 },
} as const;

// ─── Variant Architecture ─────────────────────────────────────────────────

/** Standard card variant state machine */
export const cardVariants = {
  hidden:  { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0,  filter: "blur(0px)", transition: spring.ui },
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

export type MotionTier = 'Subtle' | 'Expressive' | 'Kinetic';

export const tierDefaults: Record<MotionTier, {
  enterDuration: number;
  enterEase: string;
  hoverScale: number;
  spring: typeof spring[keyof typeof spring];
}> = {
  Subtle: {
    enterDuration: 200,
    enterEase: 'ease-out',
    hoverScale: 1.01,
    spring: spring.gentle,
  },
  Expressive: {
    enterDuration: 350,
    enterEase: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    hoverScale: 1.03,
    spring: spring.ui,
  },
  Kinetic: {
    enterDuration: 500,
    enterEase: 'cubic-bezier(0.16, 1, 0.3, 1)',
    hoverScale: 1.05,
    spring: spring.bounce,
  },
};

// ─── Reduced Motion Safety ────────────────────────────────────────────────

/**
 * WCAG 2.3.3 — Always provide reduced-motion alternatives.
 * 
 * Use this hook to conditionally apply motion:
 * const prefersReducedMotion = useReducedMotion();
 * const transition = prefersReducedMotion ? { duration: 0 } : spring.ui;
 */
export const reducedMotionFallback = {
  /** Safe: opacity only, no movement */
  safe: { opacity: [0, 1], transition: { duration: 0.2 } },
  /** No animation at all */
  none: { transition: { duration: 0 } },
};
