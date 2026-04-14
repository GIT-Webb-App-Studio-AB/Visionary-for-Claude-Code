# Bubblegum Bling

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Fredoka One — round, bouncy, confectionery-adjacent
- **Body font:** Fredoka One Regular
- **Tracking:** 0.01em | **Leading:** 1.5

## Colors
- **Background:** #FFB3E6 (pastel pink)
- **Primary action:** #FF1493 (hot pink)
- **Accent:** #FFD700 (glitter gold) and #B0E0FF (baby blue)
- **Elevation model:** glitter glow; sparkle reflections, no neutral shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 240, damping: 14 }` — bouncy and fun
- **Enter animation:** pop-in with overshoot — scale 0 → 1.15 → 1, 350ms
- **Forbidden:** serious greys, sharp geometry, understated anything

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 999px (pill) or large radius 24–32px; bubblegum has no hard edges

## Code Pattern
```css
.bubblegum-card {
  background: linear-gradient(135deg, #FFB3E6, #FFD6F0);
  border-radius: 24px;
  border: 3px solid #FF1493;
  box-shadow:
    0 4px 0 #CC0070,
    0 8px 16px rgba(255, 20, 147, 0.25);
}

.bling-text {
  font-family: 'Fredoka One', 'Fredoka', sans-serif;
  color: #FF1493;
  text-shadow: 2px 2px 0 rgba(255,255,255,0.5);
}
```

## Slop Watch
- The 3D button effect (bottom border as box-shadow offset) requires `box-shadow: 0 4px 0 [darker-pink]` — CSS `border-bottom` thickness doesn't create the same press effect
- Never use weight below 400; Fredoka One is a single-weight display font and doesn't have lighter variants
