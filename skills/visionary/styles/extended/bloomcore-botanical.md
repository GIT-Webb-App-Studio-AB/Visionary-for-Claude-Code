---
id: bloomcore-botanical
category: extended
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel, earth, organic]
keywords: [bloomcore, botanical, extended]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Bloomcore Botanical

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Playfair Display Italic — flows like botanical illustration labels
- **Body font:** Lora Regular
- **Tracking:** 0.01em | **Leading:** 1.7

## Colors
- **Background:** #F0F7EE (tender leaf white)
- **Primary action:** #3A6B35 (botanical green)
- **Accent:** #8B4E2E (earth terracotta) or #B5749C (pressed flower mauve)
- **Elevation model:** soft pressed-flower depth; no hard shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 160, damping: 28 }` — growing, unhurried
- **Enter animation:** bloom — scale 0.95 → 1 + fade, 400ms ease-out; like a flower opening
- **Forbidden:** bright neon, dark backgrounds, fast animations, geometric sharpness

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–20px; botanical forms have organic edges

## Code Pattern
```css
.botanical-card {
  background: #F0F7EE;
  border: 1px solid rgba(58, 107, 53, 0.2);
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(58, 107, 53, 0.08);
}

.pressed-flower-divider {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, #B5749C 30%, #B5749C 70%, transparent);
  margin: 24px 0;
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
- Botanical green must maintain 4.5:1 contrast on the light background — #3A6B35 on #F0F7EE passes; lighter greens may not without checking
- Never fill backgrounds with literal floral imagery — the palette carries the register; actual flowers in backgrounds compete with content
