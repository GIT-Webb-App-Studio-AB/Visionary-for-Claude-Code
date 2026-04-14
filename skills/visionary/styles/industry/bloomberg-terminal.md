# Bloomberg Terminal

**Category:** industry
**Motion tier:** Subtle

## Typography
- **Display font:** JetBrains Mono 700
- **Body font:** JetBrains Mono 400
- **Weight range:** 400–700
- **Tracking:** 0.02em
- **Leading:** 1.4 (tight for data density)

## Colors
- **Background:** #000000
- **Primary action:** #FFB300 (amber) or #00FF00 (green) — pick one, never both
- **Accent:** #333333
- **Elevation model:** none — terminal has no elevation; panels are delineated by 1px lines only

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 600, damping: 40, mass: 0.5
- **Enter animation:** data cells count up from 0 to value over 400ms; no positional animation
- **Forbidden:** rounded corners, gradient backgrounds, any animation that interrupts data scanning

## Spacing
- **Base grid:** 8px (character-grid aligned)
- **Border-radius vocabulary:** 0px — terminals have no curves; every pixel is data

## Code Pattern
```css
.terminal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1px;
  background: #1A1A1A; /* gap color = grid line color */
}

.terminal-cell {
  background: #000000;
  padding: 8px 12px;
  border-radius: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  font-feature-settings: 'tnum' 1;
}

.terminal-positive { color: #00FF00; }
.terminal-negative { color: #FF3333; }
.terminal-neutral  { color: #FFB300; }
```

## Slop Watch
- Adding hover card shadows — the terminal aesthetic rejects elevation entirely
- Using both amber and green; the single accent color is the terminal's signature, not a palette
