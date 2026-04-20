---
id: sports-analytics
category: hybrid
motion_tier: Expressive
density: dense
locale_fit: [all]
palette_tags: [dark, neon, pastel, earth]
keywords: [sports, analytics, hybrid]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Sports Analytics

**Category:** hybrid
**Motion tier:** Expressive

## Typography
- **Display font:** Bebas Neue — condensed, high-impact, stadium scoreboard energy
- **Body font:** DM Sans (tabular-nums variant for statistics)
- **Tracking:** 0.04em | **Leading:** 1.3

## Colors
- **Background:** #0A0A14 (deep dark)
- **Primary action:** Team primary color (dynamic, no fixed value)
- **Accent:** Electric accent — e.g., #00E5FF or #FF2D78 depending on team
- **Elevation model:** colored glow matching team primary; no neutral shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 300, damping: 20 }` — athletic snap
- **Enter animation:** stat counters count up from 0 on enter; bars animate width; 400ms ease-out
- **Forbidden:** slow gentle transitions, pastels, serif type, warm neutral backgrounds

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4–8px; polished dashboard, not raw data

## Code Pattern
```css
.stat-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: var(--team-primary);
  border-radius: 4px;
  transform-origin: left;
  animation: bar-enter 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes bar-enter {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

.stat-number {
  font-family: 'Bebas Neue', 'Impact', sans-serif;
  font-variant-numeric: tabular-nums;
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
- Stat bar animation must use `transform: scaleX()` not `width` animation — width animation causes layout reflow on every frame, dropping below 60fps on complex dashboards
- `font-variant-numeric: tabular-nums` is mandatory on all numeric displays; proportional numbers cause columns to misalign as values update
