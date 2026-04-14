# Monochrome

**Category:** modern
**Motion tier:** Expressive

## Typography
- **Display font:** Syne Bold — strong enough to carry visual weight without color
- **Body font:** Space Grotesk Regular
- **Tracking:** -0.01em | **Leading:** 1.5 | **Weight range:** 300/400/700/900

## Colors
- **Background:** #0A0A0A
- **Primary action:** #FFFFFF
- **Accent:** #888888 (single hue midpoint)
- **Elevation model:** grey scale layers — #0A0A0A → #141414 → #1E1E1E → #2A2A2A

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 180, damping: 20`
- **Enter animation:** luminance-fade (from grey mid-tone to target value, 250ms)
- **Forbidden:** any color introduction (not even desaturated blue links), gradients with hue shift

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** designer's choice — monochrome works with any radius vocabulary; radius should be consistent within the project

## Code Pattern
```css
/* Monochrome: saturate(0) as baseline filter, then build luminance range */
.monochrome-root {
  filter: saturate(0);
  /* Remove to reveal — everything is greyscale by architecture */
}
.monochrome-scale {
  --m-100: #FFFFFF;
  --m-200: #E0E0E0;
  --m-300: #BBBBBB;
  --m-500: #888888;
  --m-700: #444444;
  --m-900: #1A1A1A;
  --m-950: #0A0A0A;
}
.monochrome-primary {
  background: var(--m-100);
  color: var(--m-950);
}
.monochrome-secondary {
  background: var(--m-900);
  color: var(--m-300);
}
```

## Slop Watch
Monochrome must be intentional — using greyscale because you lack a color palette is not monochrome design, it is unfinished design. The single hue should be pushed to its full luminance range: deep black, full white, rich grey midtones. Flat grey without contrast range is just grey.
