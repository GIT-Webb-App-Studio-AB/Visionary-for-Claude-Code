# Neon Dystopia

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Syne Bold — grotesque with tension, sits between elegance and aggression
- **Body font:** Syne Regular
- **Tracking:** 0.06em | **Leading:** 1.3

## Colors
- **Background:** #080808 (near-black city night)
- **Primary action:** #FF2079 (hot pink neon)
- **Accent:** #00FFCC (toxic cyan)
- **Elevation model:** dual-color neon glow; pink + cyan halos that bleed into each other

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 180, damping: 12 }` — springy, unnerving
- **Enter animation:** glitch-flicker: random X offset ±3px, 60ms, then settle
- **Forbidden:** pastels, rounded friendly corners > 4px, warm neutrals

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–4px; dystopia is angular with rare soft concession

## Code Pattern
```css
@keyframes glitch-enter {
  0%   { transform: translateX(-3px); opacity: 0.5; }
  20%  { transform: translateX(3px);  opacity: 0.8; }
  40%  { transform: translateX(-1px); opacity: 1;   }
  100% { transform: translateX(0);    opacity: 1;   }
}

.dystopia-element {
  animation: glitch-enter 180ms ease-out forwards;
  text-shadow: 1px 0 #00FFCC, -1px 0 #FF2079;
}
```

## Slop Watch
- The dual text-shadow chromatic aberration (1px offset R+G) must be subtle — large offsets read as 3D, not glitch
- Spring tension must stay loose (damping ≤ 15); a well-damped spring reads as clean tech, not dystopian anxiety
