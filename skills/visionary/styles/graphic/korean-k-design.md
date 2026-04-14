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

## Slop Watch
- The colored shadow (not grey) is the primary K-design signature — neutral drop shadows immediately shift the register to generic Material Design
- Pretendard must be loaded before Noto Sans KR; they have different Hangul metrics and mixing them mid-page causes visible weight inconsistency

## Cultural Note
**K-pop visual energy:** K-design draws from the highly produced, high-contrast visual language of K-pop album art, K-drama promotional material, and Korean tech product design (Samsung, Kakao, Naver). The vivid primary colors and confident contrast ratios are culturally legible — not loud — within this context.

**Font justification:** Pretendard was specifically designed to address the typographic gaps in Korean web design and correctly handles Hangul syllable block geometry. Noto Sans KR is the reliable Google Fonts alternative. Never substitute with Japanese CJK fonts — Hangul glyph design differs meaningfully from Japanese kana proportions.
