# Guochao New Chinese

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** Noto Serif SC (or Source Han Serif) — traditional stroke authority for display
- **Body font:** Noto Sans SC
- **Tracking:** 0.05em | **Leading:** 1.75

## Colors
- **Background:** #FAF0E6 (rice paper)
- **Primary action:** #C0222B (imperial red)
- **Accent:** #C9A84C (imperial gold)
- **Elevation model:** warm ink-wash shadow; no cold greys

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 20 }`
- **Enter animation:** scroll-reveal — slide from right 20px + fade, 280ms ease-out
- **Forbidden:** cold blues, mechanical easing, Western minimalism signals

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–4px; traditional + contemporary hybrid

## Code Pattern
```css
.guochao-display {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  writing-mode: horizontal-tb; /* or vertical-rl for traditional vertical layout */
  color: #C0222B;
}

.guochao-vertical-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 0.1em;
}

.guochao-divider {
  border-top: 3px solid #C0222B;
  position: relative;
}

.guochao-divider::after {
  content: '';
  display: block;
  height: 1px;
  background: #C9A84C;
  margin-top: 4px;
}
```

## Slop Watch
- Vertical text layout requires `writing-mode: vertical-rl` — `text-orientation: upright` vs `mixed` changes whether Latin characters rotate; choose intentionally
- Never use this style without loading Noto Serif SC; all CJK content will render as boxes on systems without the font installed

## Cultural Note
**Guochao (国潮):** See chinese-guochao.md for full cultural context. This extended variant emphasizes contemporary brand applications and vertical typography layouts traditional to Chinese publishing.
