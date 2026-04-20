---
id: wireframe-aesthetic
category: modern
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [wireframe, aesthetic, modern]
accessibility:
  contrast_floor: 4.5
  reduced_motion: static
  touch_target: 44
---

# Wireframe Aesthetic

**Category:** modern
**Motion tier:** Subtle

## Typography
- **Display font:** Courier New — intentionally lo-fi, references hand-drawn wireframe annotation
- **Body font:** Courier New Regular
- **Tracking:** 0em | **Leading:** 1.5 | **Weight range:** 400/700

## Colors
- **Background:** #FFFFFF
- **Primary action:** #000000
- **Accent:** #767676
- **Elevation model:** 1px solid #000000 borders only — sketch-on-paper aesthetic

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 400, damping: 40`
- **Enter animation:** sketch-draw (SVG stroke-dashoffset on border elements, 200ms)
- **Forbidden:** color fills, gradients, shadows, rounded corners, images (use placeholder rectangles)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — wireframe boxes are rectangular by definition

## Code Pattern
```css
.wireframe-box {
  border: 1px solid #000000;
  padding: 16px;
  background: #FFFFFF;
  position: relative;
}
.wireframe-image-placeholder {
  border: 1px solid #000000;
  background: #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #767676;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}
.wireframe-image-placeholder::before {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(to bottom right, transparent calc(50% - 0.5px), #000 calc(50% - 0.5px), #000 calc(50% + 0.5px), transparent calc(50% + 0.5px)),
              linear-gradient(to bottom left,  transparent calc(50% - 0.5px), #000 calc(50% - 0.5px), #000 calc(50% + 0.5px), transparent calc(50% + 0.5px));
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
No animation by default; static entry and state changes. `prefers-reduced-motion` is already honored because there is nothing to reduce.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
Wireframe aesthetic must signal intentionality — it looks like a wireframe because it IS the interface concept, not because it is unfinished. Include explicit placeholder language ([Image 400×300], [Chart], [User Name]) to complete the intentional lo-fi signal.
