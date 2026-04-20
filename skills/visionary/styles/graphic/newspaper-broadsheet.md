---
id: newspaper-broadsheet
category: graphic
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [light, neon]
keywords: [newspaper, broadsheet, hybrid]
accessibility:
  contrast_floor: 4.5
  reduced_motion: static
  touch_target: 44
---

# Newspaper Broadsheet

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Libre Baskerville — warm, authoritative, correct weight for broadsheet headlines
- **Body font:** Source Serif 4
- **Tracking:** -0.005em | **Leading:** 1.55

## Colors
- **Background:** #F4EFE4 (newsprint)
- **Primary action:** #1A1008 (ink black)
- **Accent:** #8B1A1A (masthead red)
- **Elevation model:** subtle drop shadows, no glow

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 28 }`
- **Enter animation:** fade-in 200ms ease-out
- **Forbidden:** bounce, scale pop, neon glow

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; broadsheet discipline

## Code Pattern
```css
.broadsheet-layout {
  columns: 3;
  column-gap: 2rem;
  column-rule: 1px solid #C8B89A;
  orphans: 3;
  widows: 3;
}

.broadsheet-headline {
  column-span: all;
  font-family: 'Libre Baskerville', Georgia, serif;
  font-size: clamp(2rem, 5vw, 4rem);
  border-bottom: 3px double #1A1008;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
No animation by default; static entry and state changes. `prefers-reduced-motion` is already honored because there is nothing to reduce.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- Three-column layout requires `column-span: all` on headlines — without it, headlines break awkwardly across columns
- Never use border-radius > 2px; rounded cards completely destroy the broadsheet register
