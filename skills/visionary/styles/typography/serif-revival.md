---
id: serif-revival
category: typography
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [light, neon, editorial]
keywords: [serif, revival, typography, led]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Serif Revival

**Category:** typography
**Motion tier:** Subtle

## Typography
- **Display font:** Cormorant Garamond 600–700
- **Body font:** Source Serif 4 400
- **Weight range:** 300–700
- **Tracking:** 0.01em display, 0em body
- **Leading:** 1.65 body, 1.1 display headlines

## Colors
- **Background:** #FFFDF7
- **Primary action:** #1A1208
- **Accent:** #8B1A1A
- **Elevation model:** subtle shadows (0 1px 3px rgba(0,0,0,0.07))

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 220, damping: 38, mass: 1.0
- **Enter animation:** opacity 0→1 over 500ms, translate Y 8px → 0 — nothing faster, nothing bouncier
- **Forbidden:** bounce springs, scale animations, anything that would appear in a tech startup context

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2px buttons and cards — near-zero, period-appropriate restraint

## Code Pattern
```css
.serif-revival-body {
  font-family: 'Source Serif 4', 'Georgia', serif;
  font-size: 1.125rem;
  line-height: 1.65;
  color: #1A1208;
  max-width: 68ch;
}

.serif-revival-display {
  font-family: 'Cormorant Garamond', 'Garamond', serif;
  font-size: clamp(2.5rem, 6vw, 5.5rem);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: 0.01em;
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
- Pairing Cormorant Garamond with a geometric sans for body — the serif revival aesthetic requires serif-on-serif tension
- Using Cormorant at a light weight for display; the contrast between 600 weight display and 400 body is what makes it feel editorial rather than decorative
