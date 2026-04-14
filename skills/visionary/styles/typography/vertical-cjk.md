# Vertical CJK

**Category:** typography-led
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

## Slop Watch
- Mixing Western horizontal layout with a single vertical text block as decoration — vertical CJK must structure the entire layout
- Using Japanese fonts for Simplified Chinese content; character sets are different and the rendering shows
