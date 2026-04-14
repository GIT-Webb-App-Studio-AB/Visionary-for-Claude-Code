# Awe Sublime

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** EB Garamond — classical serif evoking Romantic era wonder and cosmic literature
- **Body font:** EB Garamond Regular
- **Tracking:** 0.01em | **Leading:** 1.7

## Colors
- **Background:** #050508 (deep void)
- **Primary action:** #D4AF37 (gold — celestial)
- **Accent:** #0A3D8F (celestial blue)
- **Elevation model:** radial glow from center; dark edges, luminous core

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 80, damping: 16 }` — slow, inevitable, cosmic scale
- **Enter animation:** sublime-appear — fade in over 3–5s with expanding radial glow; unhurried
- **Forbidden:** fast transitions, bounce, bright saturated UI colors, anything small-scale

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 999px for celestial bodies; 0 for monolithic architectural forms

## Code Pattern
```css
@keyframes sublime-appear {
  from {
    opacity: 0;
    filter: blur(8px);
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
}

.sublime-element {
  animation: sublime-appear 4s cubic-bezier(0.25, 0, 0, 1) forwards;
}

.celestial-glow {
  background: radial-gradient(
    ellipse at center,
    rgba(212, 175, 55, 0.2) 0%,
    rgba(10, 61, 143, 0.1) 40%,
    transparent 70%
  );
}
```

## Slop Watch
- Sublime-appear animation must use `cubic-bezier(0.25, 0, 0, 1)` not ease-out — the very slow ease-in then faster settle matches the cognitive experience of awe building then resolving
- Animation duration must be ≥ 3s; anything faster reads as a loading state rather than intentional sublime pacing
