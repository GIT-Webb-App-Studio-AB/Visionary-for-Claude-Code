# Newspaper Broadsheet

**Category:** hybrid
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

## Slop Watch
- Three-column layout requires `column-span: all` on headlines — without it, headlines break awkwardly across columns
- Never use border-radius > 2px; rounded cards completely destroy the broadsheet register
