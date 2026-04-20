---
id: glass-dashboard
category: modern
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark]
keywords: [glass, dashboard, modern]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Glass Dashboard

**Category:** modern
**Motion tier:** Expressive

## Typography
- **Display font:** Syne — futuristic, pairs with depth-layer aesthetic
- **Body font:** DM Sans Regular
- **Tracking:** -0.01em | **Leading:** 1.4 | **Weight range:** 400/500/700

## Colors
- **Background:** #080B14
- **Primary action:** #22D3EE (cyan-400)
- **Accent:** #A78BFA (violet-400)
- **Elevation model:** glassmorphism — backdrop-filter blur, semi-transparent surfaces

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 160, damping: 18`
- **Enter animation:** glass-reveal (backdrop-filter blur 20px→4px + opacity 0→1, 400ms)
- **Forbidden:** opaque cards on dark bg (defeats glass effect), low contrast text on blurred surfaces

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 16px standard panels; 24px featured panels; 8px chips/badges

## Code Pattern
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.glass-metric {
  color: #22D3EE;
  font-size: 2.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
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
Glass only works over content — a glass card over a flat color background is just a semi-transparent div. Ensure there is genuinely complex content behind glass surfaces (a gradient, pattern, or imagery). Text on glass must meet 4.5:1 contrast against the actual rendered backdrop, not theoretical color values.
