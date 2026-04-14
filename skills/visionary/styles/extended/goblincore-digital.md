# Goblincore Digital

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** VT323 (or Press Start 2P) — pixel retro for a creature who found a computer
- **Body font:** VT323 Regular (or system monospace)
- **Tracking:** 0.04em | **Leading:** 1.5

## Colors
- **Background:** #1A2B1A (forest dark)
- **Primary action:** #7A5C3A (mushroom brown)
- **Accent:** #4A8B4A (goblin green)
- **Elevation model:** dim bioluminescent glow; forest floor light

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 14 }` — scurrying, slightly chaotic
- **Enter animation:** scuttle-in — fast translate from corner + fade, 200ms ease-out
- **Forbidden:** clean minimalism, bright whites, professional polish

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2px; goblins work with found materials — imperfect but not organic

## Code Pattern
```css
.goblin-panel {
  background: #1A2B1A;
  border: 2px solid #7A5C3A;
  border-radius: 2px;
  box-shadow:
    0 0 8px rgba(74, 139, 74, 0.3),
    inset 0 0 16px rgba(0,0,0,0.4);
}

.goblin-text {
  font-family: 'VT323', 'Press Start 2P', monospace;
  color: #4A8B4A;
  text-shadow: 0 0 6px rgba(74, 139, 74, 0.5);
}
```

## Slop Watch
- VT323 is only readable above 18px — use it for display and UI labels only; body text requires a more readable monospace
- Forest green glow must stay dim (0.3 alpha max) — bright green glow shifts from goblin to Matrix terminal
