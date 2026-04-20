---
id: goblincore-pixel
category: extended
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, organic]
keywords: [goblincore, pixel, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Goblincore Pixel

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** VT323 (or Press Start 2P) — pixel retro for a creature who found a computer
- **Body font:** VT323 Regular (or system monospace)
- **Tracking:** 0.04em | **Leading:** 1.5

## Colors
- **Background:** #1A2B1A (forest dark)
- **Primary action:** #7A5C3A (mushroom brown)
- **Accent:** #4A8B4A (goblin green)
- **Elevation model:** dim bioluminescent glow; forest floor light

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 14 }` — scurrying, slightly chaotic
- **Enter animation:** scuttle-in — fast translate from corner + fade, 200ms ease-out
- **Forbidden:** clean minimalism, bright whites, professional polish

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2px; goblins work with found materials — imperfect but not organic

## Code Pattern
```css
.goblin-panel {
  background: #1A2B1A;
  border: 2px solid #7A5C3A;
  border-radius: 2px;
  box-shadow:
    0 0 8px rgba(74, 139, 74, 0.3),
    inset 0 0 16px rgba(0,0,0,0.4);
}

.goblin-text {
  font-family: 'VT323', 'Press Start 2P', monospace;
  color: #4A8B4A;
  text-shadow: 0 0 6px rgba(74, 139, 74, 0.5);
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
- VT323 is only readable above 18px — use it for display and UI labels only; body text requires a more readable monospace
- Forest green glow must stay dim (0.3 alpha max) — bright green glow shifts from goblin to Matrix terminal
