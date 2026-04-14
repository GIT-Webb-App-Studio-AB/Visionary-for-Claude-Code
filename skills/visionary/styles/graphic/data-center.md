# Data Center

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** JetBrains Mono — monospace authority, terminal readability
- **Body font:** JetBrains Mono Regular
- **Tracking:** 0em | **Leading:** 1.6

## Colors
- **Background:** #0D0D0D (rack black)
- **Primary action:** #00FF41 (server green)
- **Accent:** #1A4A1A (dark chassis)
- **Elevation model:** no shadows; depth from monochrome opacity steps only

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 400, damping: 40 }` — instant, no spring
- **Enter animation:** type-on character-by-character at 20ms/char
- **Forbidden:** color fills, gradients, rounded panels, any decorative element

## Spacing
- **Base grid:** 4px (monospace grid alignment)
- **Border-radius vocabulary:** 0px; server hardware is rectilinear

## Code Pattern
```css
.terminal-output {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  color: #00FF41;
  background: #0D0D0D;
  border-left: 2px solid #00FF41;
  padding: 16px 20px;
  line-height: 1.6;
  white-space: pre;
}
```

## Slop Watch
- Never introduce color beyond green + black + their opacity steps — even a single blue accent collapses the monochrome terminal register
- Type-on animation must use character-step timing, not a CSS width transition; width-based type-on breaks on variable-width containers
