---
id: data-center
category: graphic
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [dark, light, monochrome, organic]
keywords: [data, center, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 24
---

# Data Center

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** JetBrains Mono — monospace authority, terminal readability
- **Body font:** JetBrains Mono Regular
- **Tracking:** 0em | **Leading:** 1.6

## Colors
- **Background:** #0D0D0D (rack black)
- **Primary action:** #00FF41 (server green)
- **Accent:** #1A4A1A (dark chassis)
- **Elevation model:** no shadows; depth from monochrome opacity steps only

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 400, damping: 40 }` — instant, no spring
- **Enter animation:** type-on character-by-character at 20ms/char
- **Forbidden:** color fills, gradients, rounded panels, any decorative element

## Spacing
- **Base grid:** 4px (monospace grid alignment)
- **Border-radius vocabulary:** 0px; server hardware is rectilinear

## Code Pattern
```css
.terminal-output {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  color: #00FF41;
  background: #0D0D0D;
  border-left: 2px solid #00FF41;
  padding: 16px 20px;
  line-height: 1.6;
  white-space: pre;
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
Touch targets may drop to 24×24 px (WCAG 2.5.8 floor) because this style is information-dense by design. Document the density in the brief so the critic doesn't flag it.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- Never introduce color beyond green + black + their opacity steps — even a single blue accent collapses the monochrome terminal register
- Type-on animation must use character-step timing, not a CSS width transition; width-based type-on breaks on variable-width containers
