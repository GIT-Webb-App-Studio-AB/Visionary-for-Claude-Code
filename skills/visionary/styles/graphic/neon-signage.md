# Neon Signage

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Bungee — condensed, signage-forward, built for vertical and horizontal display
- **Body font:** Bungee Inline (for secondary) or system sans for readable body copy
- **Tracking:** 0.04em | **Leading:** 1.2

## Colors
- **Background:** #0A0A0A (night street)
- **Primary action:** #FF2D78 (neon pink)
- **Accent:** #00E5FF (neon cyan)
- **Elevation model:** colored glow shadows only; no neutral drop shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 120, damping: 10 }` — loose flicker rhythm
- **Enter animation:** flicker-on: opacity pulses 0→0.6→0.3→1 over 400ms
- **Forbidden:** smooth linear fade, white backgrounds, serif body text

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 999px for pill shapes (tube glass); 0 for rectangular sign frames

## Code Pattern
```css
@keyframes neon-flicker {
  0%, 100% { opacity: 1; }
  4%        { opacity: 0.8; }
  8%        { opacity: 1; }
  15%       { opacity: 0.6; }
  20%       { opacity: 1; }
}

.neon-text {
  color: #FF2D78;
  text-shadow:
    0 0 7px #FF2D78,
    0 0 21px #FF2D78,
    0 0 42px rgba(255,45,120,0.6);
  animation: neon-flicker 3s infinite;
}
```

## Slop Watch
- Multi-layer text-shadow is mandatory — a single shadow layer reads as a CSS glow filter, not glass tube
- Never animate at a fixed 60fps-synced interval; irregular timing (3s, 2.7s, 4.1s) is what makes it feel analog
