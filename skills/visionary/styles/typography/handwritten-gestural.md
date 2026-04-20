---
id: handwritten-gestural
category: typography
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, neon]
keywords: [handwritten, gestural, typography, led]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Handwritten Gestural

**Category:** typography
**Motion tier:** Expressive

## Typography
- **Display font:** Caveat 700 (casual) or Reenie Beanie (loose gestural)
- **Body font:** Plus Jakarta Sans 400 (contrast: structured body anchors the gestural display)
- **Weight range:** 400–700
- **Tracking:** -0.01em display, 0.01em body
- **Leading:** 1.2 display, 1.6 body

## Colors
- **Background:** #FFFEF7
- **Primary action:** #1A1A1A
- **Accent:** #2D6A4F
- **Elevation model:** none — texture and paper-like background do the work

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 200, damping: 20, mass: 1.1
- **Enter animation:** SVG path draw-on for decorative underlines, text appears with slight rotation correction (2deg → 0deg)
- **Forbidden:** pixel-perfect alignment, drop shadows, rigid grid for handwritten elements

## Spacing
- **Base grid:** 8px (body) — gestural elements break the grid intentionally
- **Border-radius vocabulary:** organic variation — 4px, 8px, 12px mixed to suggest hand-drawn elements

## Code Pattern
```css
.handwritten-display {
  font-family: 'Caveat', cursive;
  font-size: clamp(2.5rem, 7vw, 6rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
  transform: rotate(-1.5deg);
  display: inline-block;
}

.gestural-underline {
  text-decoration: none;
  background-image: url("data:image/svg+xml,..."); /* hand-drawn SVG underline */
  background-repeat: no-repeat;
  background-position: bottom;
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
- Centering handwritten text — gestural type reads left-aligned with organic margin variance
- Choosing a handwriting font that is too legible and uniform; true gestural style has inconsistency in letterform
