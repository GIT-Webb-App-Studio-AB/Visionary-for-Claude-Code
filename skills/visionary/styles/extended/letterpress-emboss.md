---
id: letterpress-emboss
category: extended
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: []
keywords: [letterpress, emboss, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Letterpress Emboss

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Playfair Display — high-contrast serif whose hairlines read beautifully as blind emboss
- **Body font:** Crimson Pro
- **Tracking:** 0.01em | **Leading:** 1.65

## Colors
- **Background:** #F0EBE1 (cotton stock)
- **Primary action:** #1A1410 (deep ink)
- **Accent:** Blind emboss (no color — depth only)
- **Elevation model:** inset text shadow simulating letterpress impression

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 30 }`
- **Enter animation:** fade 200ms ease-out; letterpress does not animate
- **Forbidden:** bright colors, glow, bounce, anything that contradicts physical printing

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; letterpress is rectilinear

## Code Pattern
```css
.letterpress-text {
  font-family: 'Playfair Display', Georgia, serif;
  color: #1A1410;
  text-shadow:
    1px 1px 0 rgba(255, 255, 255, 0.5),
    -1px -1px 0 rgba(0, 0, 0, 0.2);
}

.blind-emboss {
  color: transparent;
  text-shadow:
    2px 2px 3px rgba(255, 255, 255, 0.8),
    -1px -1px 2px rgba(0, 0, 0, 0.15);
  /* Text visible only as relief impression */
}

.letterpress-card {
  background: #F0EBE1;
  border: 1px solid rgba(26, 20, 16, 0.15);
  box-shadow:
    inset 0 1px 3px rgba(0,0,0,0.1),
    0 2px 4px rgba(0,0,0,0.08);
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
- Blind emboss text-shadow values must be extremely subtle — heavy shadows make type look extruded, not pressed; keep alpha ≤ 0.5 on highlights and ≤ 0.2 on shadows
- Never apply letterpress effect to body text at < 16px; the impression detail disappears and the doubled shadow makes text harder to read
