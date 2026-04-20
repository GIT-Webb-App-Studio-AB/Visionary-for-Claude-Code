---
id: scandinavian-nordic
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, organic, trust]
keywords: [scandinavian, nordic, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Scandinavian Nordic

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Söhne (or Aktiv Grotesk as alternative) — weight 300/400 only; restraint is mandatory
- **Body font:** Söhne Regular (300)
- **Tracking:** -0.01em | **Leading:** 1.55

## Colors
- **Background:** #F7F7F5 (warm grey-white — not pure white)
- **Primary action:** #1A1A1A (near-black)
- **Accent:** #4A7A9B (coastal blue — desaturated) or #4A7A5A (forest green — desaturated)
- **Elevation model:** 0 1px 8px rgba(0,0,0,0.06); shadow as whisper

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 26 }` — controlled, no excess
- **Enter animation:** fade 200ms ease-out; 2px Y only
- **Forbidden:** bold weights, bright saturated color, decorative animation, visual excess of any kind

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4–8px; functional, not expressive

## Code Pattern
```css
.nordic-card {
  background: #F7F7F5;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  padding: 32px;
}

.nordic-card h2 {
  font-weight: 300;
  letter-spacing: -0.01em;
  color: #1A1A1A;
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
- Weight 300 is non-negotiable for display text; weight 500+ immediately shifts to German engineering or Swiss corporate, not Nordic domestic warmth
- Accent color must be desaturated — a vivid blue or green reads as Scandinavian flag imagery, not the subdued coastal/forest color language of Nordic design

## Cultural Note
This style draws from Scandinavian interior design tradition (Muuto, HAY, &Tradition) and the typographic sensibility of studios like Snøhetta and Norm Architects. It is not Finnish (which has distinct darker, more dramatic influences) or Icelandic (which skews more dramatic). The warmth of #F7F7F5 over pure white is specifically Danish/Swedish domestic — not clinical.
