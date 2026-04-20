---
id: uncanny-valley
category: extended
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, neon, pastel]
keywords: [uncanny, valley, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Uncanny Valley

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** System-ui — deliberately familiar but slightly wrong (letter-spacing: -0.5px + wrong weight)
- **Body font:** System-ui at slightly-off metrics
- **Tracking:** -0.03em (intentionally uncomfortable) | **Leading:** 1.48 (slightly wrong)

## Colors
- **Background:** #F5F5F3 (almost-white — not quite right)
- **Primary action:** #1A1A18 (almost-black — slightly warm)
- **Accent:** Almost-right skin tones (#E8C8B0) or desaturated primaries
- **Elevation model:** shadows at wrong angles; light source inconsistency is intentional

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 15 }` — slightly over-responsive
- **Enter animation:** deliberately uncomfortable micro-delays (40ms inconsistent stagger)
- **Forbidden:** correct typography, comfortable motion, fully coherent design systems

## Spacing
- **Base grid:** 8px (but occasionally off by 1px intentionally)
- **Border-radius vocabulary:** 5px (non-standard, slightly wrong)

## Code Pattern
```css
.uncanny-element {
  transition-timing-function: cubic-bezier(0.68, -0.6, 0.32, 1.6);
  /* Slight overcorrection — like a person smiling too hard */
}

.uncanny-hover:hover {
  transform: scale(1.01) rotate(0.1deg); /* wrong amount */
  transition-duration: 180ms; /* slightly too fast */
}

.uncanny-text {
  letter-spacing: -0.03em;
  font-weight: 450; /* non-standard weight — browser interpolates */
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
Under `prefers-reduced-motion: reduce`, keep opacity transitions but drop transform/scale/translate — transform is a vestibular trigger. No autoplay exceeds 5 s without a pause control.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- Off-by-one design must be intentional and controlled — random sloppiness reads as incompetence, not uncanny; each "wrong" element needs deliberate rationale
- Never apply uncanny valley to critical UI (forms, error states, CTAs) — users may genuinely misread intentional wrongness as broken software
