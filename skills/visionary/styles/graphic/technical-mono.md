# Technical Mono

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** JetBrains Mono — developer-grade monospace clarity
- **Body font:** JetBrains Mono Regular
- **Tracking:** 0em | **Leading:** 1.6

## Colors
- **Background:** #0A0A0A (terminal black)
- **Primary action:** #00FF41 (phosphor green)
- **Accent:** #00FF41 at 40% opacity (dimmed terminal)
- **Elevation model:** none; monochrome depth via opacity only

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 400, damping: 40 }` — immediate, no spring
- **Enter animation:** type-on at 15ms/char or instant fade 100ms
- **Forbidden:** color, gradients, rounded panels, decorative elements

## Spacing
- **Base grid:** 4px (monospace character grid)
- **Border-radius vocabulary:** 0px; terminal is rectilinear

## Code Pattern
```css
.technical-panel {
  font-family: 'JetBrains Mono', monospace;
  color: #00FF41;
  background: #0A0A0A;
  border-left: 2px solid #00FF41;
  padding: 16px 20px;
  white-space: pre;
}
```

## Slop Watch
- Single color only — any second color collapses the monochrome terminal register immediately
- Never exceed 80 character line width; terminal conventions enforce this and breaking it destroys authenticity
