---
id: high-contrast-a11y
category: modern
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [high, contrast, a11y, modern]
accessibility:
  contrast_floor: 7
  reduced_motion: opacity-only
  touch_target: 44
---

# High Contrast / A11y First

**Category:** modern
**Motion tier:** Subtle

## Typography
- **Display font:** Atkinson Hyperlegible — engineered for maximum character distinction
- **Body font:** Atkinson Hyperlegible Regular
- **Tracking:** 0.01em | **Leading:** 1.6 | **Weight range:** 400/700 (no intermediate weights — ambiguity reduces)

## Colors
- **Background:** #FFFFFF
- **Primary action:** #000000
- **Accent:** #0000EE (pure link blue — accessible by convention)
- **Elevation model:** 2px solid #000000 borders replace all shadow-based elevation

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 400, damping: 40` — immediate, no overshoot
- **Enter animation:** none by default — `prefers-reduced-motion: reduce` respected universally
- **Forbidden:** motion that conveys meaning (flashing, animated state indicators); always pair motion with text/icon fallback

## Spacing
- **Base grid:** 8px; touch targets minimum 44×44px
- **Border-radius vocabulary:** 4px only — universally consistent, never interferes with focus-visible outline

## Code Pattern
```css
/* 7:1 AAA contrast enforced */
:root {
  --hc-bg:     #FFFFFF;
  --hc-text:   #000000;
  --hc-link:   #0000EE;
  --hc-border: #000000;
}
.hc-button {
  background: #000000;
  color: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 4px;
  padding: 12px 24px;
  font-family: 'Atkinson Hyperlegible', sans-serif;
}
.hc-button:focus-visible {
  outline: 3px solid #0000EE;
  outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Accessibility

### Contrast
Body text must clear 7:1 (WCAG AAA) AND APCA Lc ≥ 90. Verify in both light and dark variants.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
Under `prefers-reduced-motion: reduce`, keep opacity transitions but drop transform/scale/translate — transform is a vestibular trigger. No autoplay exceeds 5 s without a pause control.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
7:1 AAA is the floor, not a target — it must be verified with a contrast checker on every foreground/background combination, including placeholder text, disabled states, and focus indicators. `prefers-reduced-motion` must be respected universally, not just on hero animations. Focus-visible must always be present; never `outline: none` without an explicit replacement.
