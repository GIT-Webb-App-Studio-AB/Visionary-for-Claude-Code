---
id: glass-crystal
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [light, neon]
keywords: [glass, crystal, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Glass Crystal

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Space Grotesk — clean, refracts well over complex backgrounds
- **Body font:** Inter
- **Tracking:** -0.01em | **Leading:** 1.5

## Colors
- **Background:** rgba(255,255,255,0.08) (clear glass panel)
- **Primary action:** rgba(255,255,255,0.9) (frosted white)
- **Accent:** rgba(100,200,255,0.6) (refracted cyan)
- **Elevation model:** backdrop-filter blur + prismatic edge highlights

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 260, damping: 20 }`
- **Enter animation:** scale 0.98 → 1 + blur 8px → 0, 280ms
- **Forbidden:** opaque backgrounds on glass panels, hard shadows, warm tones

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 12–20px; glass is formed, not machined

## Code Pattern
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
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
- backdrop-filter requires a non-opaque background — setting background to a solid color defeats the effect entirely
- Refraction accent must stay at ≤0.6 opacity; saturated solid color on glass reads as paint, not light
