---
id: type-collage
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel]
keywords: [type, collage, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Type Collage

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Mixed variable — deliberate font mixing is structural; no single font
- **Body font:** Variable; contrast of weights, styles, and faces is the design
- **Tracking:** varies intentionally | **Leading:** varies; collage has no uniform leading

## Colors
- **Background:** #F0EBE0 (newsprint off-white)
- **Primary action:** #1A1A1A (cut-out black)
- **Accent:** CMYK-limited accent (single saturated color: #FF0000 or #0000FF or #FFFF00)
- **Elevation model:** paper layer shadows; physical depth from pasted elements

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 18 }`
- **Enter animation:** elements cut-in from edges or appear with a placement snap, 200ms
- **Forbidden:** typographic hierarchy, consistent font usage, smooth uniform layout

## Spacing
- **Base grid:** irregular; collage intentionally breaks grids
- **Border-radius vocabulary:** 0px; cut paper has clean edges

## Code Pattern
```css
.collage-element {
  position: absolute;
  transform: rotate(var(--rotation));
  box-shadow: 2px 3px 0 rgba(0,0,0,0.12);
}

.collage-word {
  font-family: var(--mixed-font);
  font-size: var(--varied-size);
  line-height: 1;
  display: inline-block;
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
- Rotation angles must vary per element — all elements at the same rotation reads as a template, not genuine collage
- Limit to one accent color; multi-color accents shift from graphic collage into rainbow chaos
