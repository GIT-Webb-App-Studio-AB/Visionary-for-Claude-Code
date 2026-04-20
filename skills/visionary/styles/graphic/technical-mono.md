---
id: technical-mono
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, monochrome, organic]
keywords: [technical, mono, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Technical Mono

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** JetBrains Mono — developer-grade monospace clarity
- **Body font:** JetBrains Mono Regular
- **Tracking:** 0em | **Leading:** 1.6

## Colors
- **Background:** #0A0A0A (terminal black)
- **Primary action:** #00FF41 (phosphor green)
- **Accent:** #00FF41 at 40% opacity (dimmed terminal)
- **Elevation model:** none; monochrome depth via opacity only

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 400, damping: 40 }` — immediate, no spring
- **Enter animation:** type-on at 15ms/char or instant fade 100ms
- **Forbidden:** color, gradients, rounded panels, decorative elements

## Spacing
- **Base grid:** 4px (monospace character grid)
- **Border-radius vocabulary:** 0px; terminal is rectilinear

## Code Pattern
```css
.technical-panel {
  font-family: 'JetBrains Mono', monospace;
  color: #00FF41;
  background: #0A0A0A;
  border-left: 2px solid #00FF41;
  padding: 16px 20px;
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
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- Single color only — any second color collapses the monochrome terminal register immediately
- Never exceed 80 character line width; terminal conventions enforce this and breaking it destroys authenticity
