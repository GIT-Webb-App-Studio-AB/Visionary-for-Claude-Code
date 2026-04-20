---
id: soft-apocalypse
category: extended
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel]
keywords: [soft, apocalypse, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Soft Apocalypse

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Space Grotesk — neutral modern grotesque that shows through the dust
- **Body font:** Space Grotesk Regular
- **Tracking:** 0.01em | **Leading:** 1.55

## Colors
- **Background:** #C9A8A8 (dusty rose — the world ended gently)
- **Primary action:** #3A2A2A (ash dark)
- **Accent:** #8C7A7A (warm ash)
- **Elevation model:** soft desaturated shadows; the light is diffuse and gray-pink

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 30 }` — tired, not urgent
- **Enter animation:** drift — fade + 4px downward settle, 400ms ease-out; gravity is still working
- **Forbidden:** bright saturated color, sharp contrasts, energetic motion, clean whites

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 6–12px; soft apocalypse has worn edges, not sharp ones

## Code Pattern
```css
.soft-apocalypse-bg {
  background: linear-gradient(180deg, #C9A8A8 0%, #B89898 100%);
  filter: saturate(0.7) brightness(0.9);
}

.ash-card {
  background: rgba(58, 42, 42, 0.15);
  border: 1px solid rgba(58, 42, 42, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(4px);
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
- Global desaturation via `filter: saturate(0.7)` affects all child elements including text — apply it to background layers only, not content containers
- The soft apocalypse is NOT grimdark; avoid black and aggressive reds; the palette is muted, dusty, resigned — not violent
