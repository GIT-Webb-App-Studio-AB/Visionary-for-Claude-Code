---
id: architecture-inspired
category: hybrid
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [light, neon]
keywords: [architecture, inspired, hybrid]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Architecture Inspired

**Category:** hybrid
**Motion tier:** Subtle

## Typography
- **Display font:** Helvetica Neue (or Neue Haas Grotesk) — the typeface of architectural documentation
- **Body font:** DM Sans
- **Tracking:** 0.01em | **Leading:** 1.5

## Colors
- **Background:** #FFFFFF (white)
- **Primary action:** #3A3A3A (steel)
- **Accent:** #888888 (concrete)
- **Elevation model:** structural reveals; thin 1px borders as load-bearing elements

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 280, damping: 30 }` — precise, no excess movement
- **Enter animation:** structural reveal — elements draw in from edges, 300ms ease-out
- **Forbidden:** organic curves, decorative shadows, warm tones, bounce

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; architecture has no accidental rounding

## Code Pattern
```css
.architectural-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1px;
  background: #3A3A3A; /* grid lines are structural */
}

.architectural-cell {
  background: #FFFFFF;
  padding: 24px;
}

.section-rule {
  border: none;
  border-top: 1px solid #3A3A3A;
  margin: 40px 0;
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
- Grid lines must be achieved via gap + background color, not borders — CSS border gaps are inconsistent at 1px scale across browsers
- Never introduce rounded corners; even 1px rounding signals consumer product design, not architectural precision
