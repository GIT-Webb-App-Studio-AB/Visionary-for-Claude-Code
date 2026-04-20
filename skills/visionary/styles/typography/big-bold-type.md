---
id: big-bold-type
category: typography
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [big, bold, type, typography, led]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Big Bold Type

**Category:** typography
**Motion tier:** Expressive

## Typography
- **Display font:** Cabinet Grotesk 900
- **Body font:** Cabinet Grotesk 400
- **Weight range:** 400–900
- **Tracking:** -0.04em on display, 0em on body
- **Leading:** 0.9–1.0 on display headlines, 1.5 on body

## Colors
- **Background:** #FFFFFF or #000000
- **Primary action:** #000000 (on white) / #FFFFFF (on black)
- **Accent:** #FF4D00
- **Elevation model:** none — scale is the elevation metaphor

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 300, damping: 25, mass: 1
- **Enter animation:** scale from 0.85 + opacity 0→1, 400ms
- **Forbidden:** subtle microinteractions, thin type weights, centered alignment

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px on containers, 999px on pill buttons only

## Code Pattern
```css
.big-bold-headline {
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: clamp(4rem, 14vw, 14rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 0.95;
  text-transform: uppercase;
}

.big-bold-hero {
  display: grid;
  grid-template-columns: 1fr;
  padding: 0;
  overflow: hidden;
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
- Reducing tracking to -0.02em — the extreme -0.04em is what makes it feel intentional, not sloppy
- Adding a hero image behind the text; the type must dominate on pure background
