---
id: neural-network-ai
category: graphic
motion_tier: Kinetic
density: balanced
locale_fit: [all]
palette_tags: [dark, neon]
keywords: [neural, network, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: pause-required
  touch_target: 44
---

# Neural Network AI

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Space Mono — monospace node labels, data precision
- **Body font:** Space Mono Regular
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #020814 (compute black)
- **Primary action:** #4A9EFF (electric node blue)
- **Accent:** #00F5D4 (activation teal)
- **Elevation model:** node pulse glow; connection lines as primary structural element

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 200, damping: 20 }`
- **Enter animation:** nodes activate sequentially layer-by-layer, 40ms stagger, with edge-draw animation
- **Forbidden:** static layout, organic curves, warm palettes

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 999px for nodes; 0 for data panels and connection paths

## Code Pattern
```css
.neural-edge {
  stroke: rgba(74, 158, 255, 0.4);
  stroke-width: 1;
  stroke-dasharray: 4 4;
  animation: edge-flow 2s linear infinite;
}

@keyframes edge-flow {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -8; }
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
This style exposes motion that can run longer than 5 seconds. Ship a visible pause/stop control bound to `animation-play-state` (CSS) or the JS equivalent — required by WCAG 2.2.2 (Level A). Also degrade to opacity-only transitions under `prefers-reduced-motion: reduce`.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- Connection edge animation must use stroke-dashoffset, not CSS transform — transform on SVG path children has inconsistent browser support
- Node activation stagger must propagate input→hidden→output (left to right); reversed or random order destroys the neural network metaphor
