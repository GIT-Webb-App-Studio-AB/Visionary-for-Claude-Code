---
id: vertical-cjk
category: typography
motion_tier: Subtle
density: balanced
locale_fit: [ja, zh, ko]
palette_tags: [light]
keywords: [vertical, cjk, typography, led]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Vertical CJK

**Category:** typography
**Motion tier:** Subtle

## Typography
- **Display font:** Noto Serif CJK SC (Simplified) / JP (Japanese)
- **Body font:** Noto Sans CJK SC / JP
- **Weight range:** 300–700
- **Tracking:** 0.05em vertical mode
- **Leading:** 1.8 (generous inter-character spacing in vertical mode)

## Colors
- **Background:** #FAFAF6
- **Primary action:** #1A1208
- **Accent:** #C0392B
- **Elevation model:** subtle shadows (0 1px 4px rgba(0,0,0,0.06))

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 280, damping: 35, mass: 0.9
- **Enter animation:** columns slide right-to-left into place, 200ms stagger per column
- **Forbidden:** horizontal scroll for vertical text, breaking vertical writing-mode mid-page, Western left-to-right dominance

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2px subtle — restrained, respects East Asian design conventions

## Code Pattern
```css
.vertical-cjk-block {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: 'Noto Serif CJK SC', 'Source Han Serif SC', serif;
  font-size: clamp(1.25rem, 3vw, 2rem);
  line-height: 1.8;
  letter-spacing: 0.05em;
  column-gap: 2em;
  columns: auto 1.5em;
}

.vertical-cjk-headline {
  font-weight: 700;
  font-size: 2.5em;
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
- Mixing Western horizontal layout with a single vertical text block as decoration — vertical CJK must structure the entire layout
- Using Japanese fonts for Simplified Chinese content; character sets are different and the rendering shows
