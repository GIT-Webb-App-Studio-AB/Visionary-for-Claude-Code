---
id: awe-sublime
category: extended
motion_tier: Expressive
density: sparse
locale_fit: [all]
palette_tags: [dark, neon, editorial]
keywords: [awe, sublime, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Awe Sublime

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** EB Garamond — classical serif evoking Romantic era wonder and cosmic literature
- **Body font:** EB Garamond Regular
- **Tracking:** 0.01em | **Leading:** 1.7

## Colors
- **Background:** #050508 (deep void)
- **Primary action:** #D4AF37 (gold — celestial)
- **Accent:** #0A3D8F (celestial blue)
- **Elevation model:** radial glow from center; dark edges, luminous core

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 80, damping: 16 }` — slow, inevitable, cosmic scale
- **Enter animation:** sublime-appear — fade in over 3–5s with expanding radial glow; unhurried
- **Forbidden:** fast transitions, bounce, bright saturated UI colors, anything small-scale

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 999px for celestial bodies; 0 for monolithic architectural forms

## Code Pattern
```css
@keyframes sublime-appear {
  from {
    opacity: 0;
    filter: blur(8px);
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
}

.sublime-element {
  animation: sublime-appear 4s cubic-bezier(0.25, 0, 0, 1) forwards;
}

.celestial-glow {
  background: radial-gradient(
    ellipse at center,
    rgba(212, 175, 55, 0.2) 0%,
    rgba(10, 61, 143, 0.1) 40%,
    transparent 70%
  );
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
- Sublime-appear animation must use `cubic-bezier(0.25, 0, 0, 1)` not ease-out — the very slow ease-in then faster settle matches the cognitive experience of awe building then resolving
- Animation duration must be ≥ 3s; anything faster reads as a loading state rather than intentional sublime pacing
