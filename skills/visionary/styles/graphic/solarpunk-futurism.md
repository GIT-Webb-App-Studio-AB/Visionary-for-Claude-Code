---
id: solarpunk-futurism
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [all]
palette_tags: [dark, neon, pastel, editorial, organic]
keywords: [solarpunk, futurism, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Solarpunk Futurism

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito — rounded, communal, optimistic weight
- **Body font:** Nunito Regular
- **Tracking:** -0.005em | **Leading:** 1.65

## Colors
- **Background:** #F0F7E6 (sunlit leaf)
- **Primary action:** #4A7C59 (deep botanical green)
- **Accent:** #E8B84B (solar gold)
- **Elevation model:** warm ambient shadow; soft botanical blur

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 160, damping: 16 }` — gentle, growing
- **Enter animation:** grow from 0.95 scale + fade, 320ms ease-out; organic, not mechanical
- **Forbidden:** dystopian grit, neon, hard geometric edges, dark backgrounds

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 12–24px; organic growth curves

## Code Pattern
```css
.solarpunk-card {
  background: linear-gradient(135deg, #F0F7E6 0%, #E8F5DA 100%);
  border: 1px solid rgba(74, 124, 89, 0.2);
  border-radius: 20px;
  box-shadow:
    0 4px 24px rgba(74, 124, 89, 0.12),
    0 1px 4px rgba(74, 124, 89, 0.08);
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
- Solarpunk is optimistic ecology, not nature photography — avoid literal leaf/plant imagery in CSS; the palette carries the register
- Gold accent must stay warm (#E8B84B range); a cool yellow reads as caution/warning and undermines the solar warmth
