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

## Slop Watch
- **Ignoring oklch:** Using rgb() for color mixing produces muddy intermediates — oklch is the whole point
- **Adding glow:** iOS 26 Liquid Glass has no glow — glows are glassmorphism, not liquid glass
