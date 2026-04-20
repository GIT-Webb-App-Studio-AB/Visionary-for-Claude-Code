---
id: variable-font
category: typography
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [pastel]
keywords: [variable, font, typography, led]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Variable Font

**Category:** typography
**Motion tier:** Expressive

## Typography
- **Display font:** Fraunces (variable: opsz, wght, SOFT, WONK axes)
- **Body font:** Inter (variable: wght, slnt axes)
- **Weight range:** 100–900 (continuous variable)
- **Tracking:** -0.02em display, 0.01em body
- **Leading:** 1.1 display, 1.6 body

## Colors
- **Background:** #F5F0E8
- **Primary action:** #1A1A1A
- **Accent:** #7C3AED
- **Elevation model:** subtle shadows (0 2px 8px rgba(0,0,0,0.08))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 200, damping: 30, mass: 1
- **Enter animation:** font-weight interpolates from 100→700 on scroll intersection
- **Forbidden:** snapping between weight values, ignoring variable axes beyond weight

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 6px default, 12px cards, 999px tags — consistent rounding

## Code Pattern
```css
@supports (font-variation-settings: normal) {
  .variable-headline {
    font-family: 'Fraunces', serif;
    font-variation-settings: 'wght' 300, 'SOFT' 50, 'opsz' 72;
    transition: font-variation-settings 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .variable-headline:hover {
    font-variation-settings: 'wght' 800, 'SOFT' 100, 'opsz' 144;
  }
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
- Only using the weight axis — SOFT and WONK axes on Fraunces are what differentiate this from regular bold/thin
- Animating on every scroll pixel instead of at intersection thresholds — produces motion sickness, not delight
