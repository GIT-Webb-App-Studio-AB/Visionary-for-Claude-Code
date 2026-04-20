---
id: legal-editorial
category: extended
motion_tier: Subtle
density: dense
locale_fit: [all]
palette_tags: [light, neon, editorial]
keywords: [legal, editorial, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: static
  touch_target: 44
---

# Legal Editorial

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Times New Roman (or Libre Baskerville) — legal documents have used Times since 1929
- **Body font:** Libre Baskerville Regular
- **Tracking:** 0em | **Leading:** 1.65

## Colors
- **Background:** #FFFFFF (legal documents are white)
- **Primary action:** #1A1A1A (black — legal ink)
- **Accent:** #6B1A2A (law burgundy — case law references, section headers)
- **Elevation model:** none; legal documents have no elevation

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 30 }`
- **Enter animation:** fade 150ms ease-out; legal interfaces don't animate decoratively
- **Forbidden:** bounce, color backgrounds, sans-serif primary type, any decorative motion

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; legal documents are rectilinear

## Code Pattern
```css
.legal-document {
  font-family: 'Libre Baskerville', 'Times New Roman', serif;
  font-size: 12pt; /* legal standard */
  line-height: 2; /* double-spaced for annotation */
  max-width: 8.5in;
  margin: 1in auto;
  padding: 1in;
}

.section-heading {
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  margin: 2em 0 1em;
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
- Line height must be 2.0 (double-spaced) for document body — single spacing is not legally standard and makes annotation impossible
- All caps section headings are a legal convention; applying sentence case reads as non-legal and reduces the professional register
