---
id: scientific-journal
category: graphic
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [dark, light, neon, trust]
keywords: [scientific, journal, hybrid]
accessibility:
  contrast_floor: 4.5
  reduced_motion: static
  touch_target: 44
---

# Scientific Journal

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** STIX Two Text (or Computer Modern via web) — mathematical serif with correct equation support
- **Body font:** Source Serif 4
- **Tracking:** 0em | **Leading:** 1.6

## Colors
- **Background:** #FFFFFF (clinical white)
- **Primary action:** #1A1A1A (publication black)
- **Accent:** #003087 (academic blue — link and figure reference)
- **Elevation model:** none; flat academic layout, no elevation metaphors

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 28 }`
- **Enter animation:** fade 150ms ease-out; no movement
- **Forbidden:** decorative animation, gradients, rounded cards, any visual element without informational purpose

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; academic publishing has no rounding

## Code Pattern
```css
.journal-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 40px;
  max-width: 960px;
  margin: 0 auto;
  font-family: 'STIX Two Text', 'Computer Modern', Georgia, serif;
}

.figure-caption {
  font-size: 0.85rem;
  color: #555555;
  margin-top: 8px;
  text-align: left;
}

.equation-block {
  font-family: 'STIX Two Math', serif;
  text-align: center;
  margin: 24px 0;
  overflow-x: auto;
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
- Two-column layout must collapse to single column at < 768px — academic readers use desktop; mobile two-column at 375px is illegible
- STIX Two requires explicit font-loading; without it equations fall back to system serif which lacks mathematical symbols
