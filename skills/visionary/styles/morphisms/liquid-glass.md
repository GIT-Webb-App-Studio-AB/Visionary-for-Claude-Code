---
id: liquid-glass
category: morphisms
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light]
keywords: [liquid, glass, morphisms]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Liquid Glass

**Category:** morphisms
**Motion tier:** Subtle

## Typography
- **Display font:** system-ui — Apple's intent is native coherence, not font personality
- **Body font:** -apple-system, BlinkMacSystemFont, system-ui
- **Tracking:** 0em | **Leading:** 1.5 (platform default)

## Colors
- **Background:** adaptive — pulls from wallpaper via color-mix(in oklch, ...)
- **Primary action:** color-mix(in oklch, #007AFF 85%, transparent) — system blue with adaptive tint
- **Accent:** oklch(70% 0.2 var(--hue-from-context)) — contextually derived
- **Elevation model:** none (flat z-axis) — depth comes from translucency alone, no drop shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** micro (tap feedback), ui (modal appear)
- **Enter animation:** scale from 0.96 + opacity 0→1, system easing curve only
- **Forbidden:** custom spring bounces, transform: rotate, anything that fights the platform physics

## Spacing
- **Base grid:** 4px (matches HIG grid)
- **Border-radius vocabulary:** 16px containers, 10px controls, 999px toggles — follows Apple HIG exactly

## Code Pattern
```css
.liquid-glass {
  background: color-mix(in oklch, var(--wallpaper-dominant) 15%, transparent);
  backdrop-filter: blur(20px) brightness(1.1);
  border: 0.5px solid color-mix(in oklch, white 30%, transparent);
  border-radius: 16px;
  /* oklch gives perceptually uniform color mixing */
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
- **Ignoring oklch:** Using rgb() for color mixing produces muddy intermediates — oklch is the whole point
- **Adding glow:** iOS 26 Liquid Glass has no glow — glows are glassmorphism, not liquid glass
