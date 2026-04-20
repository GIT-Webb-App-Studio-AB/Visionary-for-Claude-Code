---
id: retrofuturism
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon]
keywords: [retrofuturism, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Retrofuturism

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Orbitron — the atomic age imagined this letterform; it is period-correct
- **Body font:** Audiowide
- **Tracking:** 0.1em | **Leading:** 1.4

## Colors
- **Background:** #F5F0E0 (atomic cream) — or #0D3B47 (Googie teal) as dark variant
- **Primary action:** #FF6B00 (atomic orange)
- **Accent:** #00B3A4 (turquoise)
- **Elevation model:** hard-edged drop shadows (2-color, no blur); optimistic and geometric

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 12 }` — optimistic bounce; the future was exciting
- **Enter animation:** bounce-in from bottom, overshoot 8px, settle, 360ms
- **Forbidden:** dystopian glitch, desaturation, decay effects

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** mix of 0px (sharp fins) and 999px (boomerang curves); no middle ground

## Code Pattern
```css
.retro-card {
  background: #F5F0E0;
  border: 3px solid #FF6B00;
  box-shadow: 6px 6px 0 #FF6B00;
  border-radius: 0 40px 0 40px; /* boomerang diagonal */
}

.retro-card:hover {
  transform: translate(-3px, -3px);
  box-shadow: 9px 9px 0 #FF6B00;
  transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
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
- The bounce spring (damping 12) on hover must not exceed 1.5 cycles of overshoot — more than 2 bounces reads as broken animation, not optimistic
- Never add weathering or decay textures; retrofuturism imagines the future from the past — it is pristine and enthusiastic
