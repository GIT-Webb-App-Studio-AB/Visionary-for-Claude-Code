---
id: korean-k-design
category: graphic
motion_tier: Expressive
density: balanced
locale_fit: [ja, zh, ko]
palette_tags: [light, neon, pastel]
keywords: [korean, design, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Korean K-Design

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Pretendard — the dominant modern Korean UI typeface; correct Hangul proportions
- **Body font:** Noto Sans KR (fallback when Pretendard unavailable)
- **Tracking:** -0.01em | **Leading:** 1.6

## Colors
- **Background:** #FFFFFF (clean white — K-pop staging brightness)
- **Primary action:** #FF2D78 (hot pink — idol era energy)
- **Accent:** #3D5AFE (electric blue — K-drama poster blue)
- **Elevation model:** vivid colored shadows matching primary/accent; no neutral grey shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 280, damping: 18 }` — confident pop
- **Enter animation:** scale 0.92 → 1.02 → 1, 300ms with overshoot; high-energy choreography
- **Forbidden:** muted palettes, slow fade, understated neutral shadows

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–16px; polished product, not raw

## Code Pattern
```css
.k-card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 4px 4px 0 #FF2D78;
  transition: transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 240ms ease;
}

.k-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #FF2D78;
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
- The colored shadow (not grey) is the primary K-design signature — neutral drop shadows immediately shift the register to generic Material Design
- Pretendard must be loaded before Noto Sans KR; they have different Hangul metrics and mixing them mid-page causes visible weight inconsistency

## Cultural Note
**K-pop visual energy:** K-design draws from the highly produced, high-contrast visual language of K-pop album art, K-drama promotional material, and Korean tech product design (Samsung, Kakao, Naver). The vivid primary colors and confident contrast ratios are culturally legible — not loud — within this context.

**Font justification:** Pretendard was specifically designed to address the typographic gaps in Korean web design and correctly handles Hangul syllable block geometry. Noto Sans KR is the reliable Google Fonts alternative. Never substitute with Japanese CJK fonts — Hangul glyph design differs meaningfully from Japanese kana proportions.
