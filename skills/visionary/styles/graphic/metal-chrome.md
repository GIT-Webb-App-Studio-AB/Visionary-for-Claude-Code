---
id: metal-chrome
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [pastel]
keywords: [metal, chrome, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Metal Chrome

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Syncopate — geometric, hard-edged, industrial rhythm
- **Body font:** Audiowide
- **Tracking:** 0.08em | **Leading:** 1.3

## Colors
- **Background:** #1A1A1A (blackened steel)
- **Primary action:** #E8E8E8 (polished chrome)
- **Accent:** #6AABFF (specular blue highlight)
- **Elevation model:** metallic gradient sheen; layered specular highlights

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 280, damping: 22 }`
- **Enter animation:** scale 0.97 → 1 with specular flash 240ms
- **Forbidden:** warm tones, soft ease-in-out, organic curves

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–3px; machined precision, minimal rounding

## Code Pattern
```css
.chrome-surface {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 40%, #3a3a3a 50%, #2d2d2d 60%, #1a1a1a 100%);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.15),
    0 -1px 0 rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.08);
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
- Specular highlight must be a single thin line (1px), not a wide gradient band — wide bands read as plastic
- Avoid Orbitron here; Syncopate's uniform stroke weight better matches machined metal
