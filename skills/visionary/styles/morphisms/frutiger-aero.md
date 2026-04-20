---
id: frutiger-aero
category: morphisms
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [organic]
keywords: [frutiger, aero, morphisms]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Frutiger Aero

**Category:** morphisms
**Motion tier:** Expressive

## Typography
- **Display font:** Frutiger (or Myriad Pro as fallback) — the style takes its name partly from Adrian Frutiger's typefaces
- **Body font:** Trebuchet MS, Tahoma, system-ui (2006-era web fonts)
- **Tracking:** 0.01em | **Leading:** 1.5

## Colors
- **Background:** #C8E8F4 — sky blue gradient that evokes Windows Vista Aero
- **Primary action:** #4A90D9 — Vista-era button blue with glass sheen
- **Accent:** #72C152 — nature green used for life/growth metaphors
- **Elevation model:** glows + reflections — elements have specular highlights, glass sheen overlays, diffuse blue glows

## Motion
- **Tier:** Expressive
- **Spring tokens:** gentle (panel open), ui (hover lift)
- **Enter animation:** scale from 0.95 + vertical drop with glass sheen reveal
- **Forbidden:** flat transitions, hard edges, anything that looks "post-2014 flat"

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8px cards, 4px inputs, 999px pills — moderate rounding that predates the very-round era

## Code Pattern
```css
.aero-panel {
  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.6) 0%,
    rgba(180,220,255,0.3) 50%,
    rgba(255,255,255,0.1) 100%
  );
  backdrop-filter: blur(8px) brightness(1.05);
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0,100,200,0.2),
    inset 0 1px 0 rgba(255,255,255,0.8);
}

/* Characteristic lens flare / specular overlay */
.aero-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.4), transparent);
  border-radius: 8px 8px 0 0;
  pointer-events: none;
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
- **Too modern the typography:** Using Inter or DM Sans destroys the period feel — lean into Trebuchet MS or Myriad Pro clones
- **Missing the specular highlight:** Frutiger Aero without the top-half glass sheen just looks like early glassmorphism — the reflection overlay is the signature
