---
id: chinese-guochao
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [ja, zh, ko]
palette_tags: [light, editorial]
keywords: [chinese, guochao, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Chinese Guochao

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Noto Serif SC — traditional serif stroke relationships for Simplified Chinese
- **Body font:** Noto Sans SC
- **Tracking:** 0.05em | **Leading:** 1.75

## Colors
- **Background:** #FAF0E6 (rice paper cream)
- **Primary action:** #C0222B (imperial red)
- **Accent:** #C9A84C (imperial gold)
- **Elevation model:** warm drop shadow echoing ink wash; no cold greys

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 20 }`
- **Enter animation:** slide in from right 20px + fade, 280ms ease-out; scroll-unfurl reference
- **Forbidden:** cold blues, mechanical easing, Western minimalism signals

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–4px; traditional forms and contemporary product hybrid

## Code Pattern
```css
.guochao-hero {
  background: linear-gradient(180deg, #FAF0E6 0%, #F5E6D0 100%);
  border-top: 4px solid #C0222B;
  padding: 48px;
  position: relative;
}

.guochao-hero::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent);
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
- The double-line top border (4px red + 2px gold inset) is a Guochao structural pattern — reducing it to a single line loses the cultural layering
- Noto Serif SC must be loaded for display text; substituting with Latin serifs for CJK content will render square fallback boxes on all Chinese characters

## Cultural Note
**Guochao (国潮):** Literally "China chic" or "national tide" — a cultural movement beginning ~2018 where Chinese brands reclaim and reinterpret traditional Chinese visual language for contemporary product design. It is NOT heritage costume; it is a living, commercially active design movement. Key references: Li-Ning, Huawei's traditional motif campaigns, Palace Museum merchandise collaborations.

**Font justification:** Noto Serif SC (Simplified Chinese) covers the GB18030 character set required for mainland Chinese content. Traditional Chinese markets (Taiwan, HK) require Noto Serif TC instead. Never mix SC and TC fonts — their character shapes differ and the mismatch is immediately visible to native readers.

**Sensitivity:** Avoid using this style for non-Chinese brands without deep cultural collaboration. Imperial color symbolism carries specific meanings; misapplication reads as cultural appropriation, not appreciation.
