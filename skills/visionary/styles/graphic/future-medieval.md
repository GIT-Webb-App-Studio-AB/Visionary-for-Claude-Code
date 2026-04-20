---
id: future-medieval
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, editorial]
keywords: [future, medieval, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Future Medieval

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** MedievalSharp (or UnifrakturMaguntia) — blackletter authority with digital edge
- **Body font:** Cinzel Regular (readable blackletter-adjacent serif)
- **Tracking:** 0.04em | **Leading:** 1.6

## Colors
- **Background:** #0D0D1A (dark vellum)
- **Primary action:** #C9A84C (illuminated gold)
- **Accent:** #6B1A2A (blood manuscript)
- **Elevation model:** candlelit ambient glow; gold halos on key elements

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 160, damping: 20 }`
- **Enter animation:** illuminate — fade in 400ms with gold edge highlight expansion
- **Forbidden:** neon, blue-white tech colors, clean modern sans-serif

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; vellum is flat, illuminated manuscripts have no rounded corners

## Code Pattern
```css
.illuminated-initial {
  font-family: 'UnifrakturMaguntia', 'MedievalSharp', serif;
  font-size: 4rem;
  color: #C9A84C;
  text-shadow: 0 0 16px rgba(201, 168, 76, 0.5);
  float: left;
  margin-right: 8px;
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
- Blackletter fonts become illegible below 18px at body text; use Cinzel for readable body text and reserve blackletter for display sizes only
- Gold glow must stay ≤ 16px spread radius; larger glows read as digital halo, not candlelight
