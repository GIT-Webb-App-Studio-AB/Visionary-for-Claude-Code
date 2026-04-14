# Cosmic Astronomical

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Space Grotesk — the name is apt; geometric precision for celestial scale
- **Body font:** Space Grotesk Regular
- **Tracking:** 0.04em | **Leading:** 1.5

## Colors
- **Background:** #00010D (deep space indigo-black)
- **Primary action:** #FFFFFF (star white)
- **Accent:** #9B59FF (nebula violet)
- **Elevation model:** radial glow emanation; no hard shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 60, damping: 12 }` — slow, orbital drift
- **Enter animation:** scale 0 → 1 from center with nebula-purple glow bloom, 800ms ease-out
- **Forbidden:** warm tones, hard edges, fast snap animations

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 999px for celestial bodies; 0 for viewport panels

## Code Pattern
```css
.nebula-glow {
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(155, 89, 255, 0.3) 0%,
    rgba(0, 1, 13, 0) 70%
  );
  animation: nebula-pulse 6s ease-in-out infinite alternate;
}

@keyframes nebula-pulse {
  from { opacity: 0.6; transform: scale(1); }
  to   { opacity: 1;   transform: scale(1.08); }
}
```

## Slop Watch
- The nebula pulse must use `ease-in-out` with a duration ≥ 5s — faster pulses read as UI interaction feedback, not cosmic breathing
- Star-field backgrounds must be CSS/canvas, not a JPEG — JPEG compression artifacts break the point-light illusion
