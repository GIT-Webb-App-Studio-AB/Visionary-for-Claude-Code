---
id: light-mode-sanctuary
category: modern
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [light, mode, sanctuary, modern]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Light Mode Sanctuary

**Category:** modern
**Motion tier:** Subtle

## Typography
- **Display font:** Inter (or system-ui) — optimized for light subpixel rendering
- **Body font:** Inter Regular
- **Tracking:** -0.01em | **Leading:** 1.6 | **Weight range:** 400/500/600

## Colors
- **Background:** #FAFAF8 (warm white — not pure white)
- **Primary action:** #18181B
- **Accent:** #6366F1
- **Elevation model:** warm diffuse (0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06))

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 300, damping: 28` — calm, measured
- **Enter animation:** gentle fade (opacity 0→1, 150ms ease-out); no scale transforms
- **Forbidden:** bounce, Kinetic motion, high-contrast flashes, dark overlays

## Spacing
- **Base grid:** 8px; generous — minimum 48px vertical rhythm between sections
- **Border-radius vocabulary:** 12px standard; 8px inputs; 20px cards in hero areas

## Code Pattern
```css
.sanctuary-layout {
  background: #FAFAF8;
  min-height: 100vh;
  padding: 48px 24px;
}
.sanctuary-card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06);
  padding: 32px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.sanctuary-heading {
  color: #18181B;
  font-weight: 600;
  letter-spacing: -0.01em;
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
Pure white (#FFFFFF) as a page background creates harsh eye strain — use warm off-white (#FAFAF8, #FAF9F7) for the canvas and reserve #FFFFFF for card surfaces. This creates natural depth without shadows. Generous spacing is the design, not padding to fill space.
