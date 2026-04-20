---
id: witchcore-ui
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [neon, pastel, editorial]
keywords: [witchcore, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Witchcore UI

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Cinzel Decorative — classical serif with occult gravity
- **Body font:** Cinzel Regular (or IM Fell English for body)
- **Tracking:** 0.06em | **Leading:** 1.65

## Colors
- **Background:** #1A0A2E (deep purple void)
- **Primary action:** #7B2FBE (amethyst purple)
- **Accent:** #C9A84C (spell gold)
- **Elevation model:** mystical glow; purple + gold halos only

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 160, damping: 18 }` — ritual-slow, deliberate
- **Enter animation:** shimmer-in — opacity 0→1 with subtle scale 0.96→1, 500ms ease-out
- **Forbidden:** blood red #8B0000 as primary (reserved for accent-only), neon, sanitized pastels

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4–12px with occasional 999px for cauldron/orb shapes

## Code Pattern
```css
.ritual-card {
  background: linear-gradient(160deg, #1A0A2E, #2D1050);
  border: 1px solid rgba(201, 168, 76, 0.3);
  box-shadow:
    0 0 30px rgba(123, 47, 190, 0.3),
    inset 0 0 20px rgba(201, 168, 76, 0.05);
}

.spell-text {
  font-family: 'Cinzel Decorative', 'Times New Roman', serif;
  color: #C9A84C;
  text-shadow: 0 0 12px rgba(201, 168, 76, 0.4);
  letter-spacing: 0.06em;
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
- Glow effects must use `box-shadow` with large spread + low opacity, not `filter: blur()` — filter blur affects all child elements and creates compositing issues
- Never make blood red the primary color; it shifts from witchcore into horror-gore territory; use it as accent maximum 1 element per view
