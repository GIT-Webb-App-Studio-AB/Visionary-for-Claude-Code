# Serif Revival

**Category:** typography-led
**Motion tier:** Subtle

## Typography
- **Display font:** Cormorant Garamond 600–700
- **Body font:** Source Serif 4 400
- **Weight range:** 300–700
- **Tracking:** 0.01em display, 0em body
- **Leading:** 1.65 body, 1.1 display headlines

## Colors
- **Background:** #FFFDF7
- **Primary action:** #1A1208
- **Accent:** #8B1A1A
- **Elevation model:** subtle shadows (0 1px 3px rgba(0,0,0,0.07))

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 220, damping: 38, mass: 1.0
- **Enter animation:** opacity 0→1 over 500ms, translate Y 8px → 0 — nothing faster, nothing bouncier
- **Forbidden:** bounce springs, scale animations, anything that would appear in a tech startup context

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2px buttons and cards — near-zero, period-appropriate restraint

## Code Pattern
```css
.serif-revival-body {
  font-family: 'Source Serif 4', 'Georgia', serif;
  font-size: 1.125rem;
  line-height: 1.65;
  color: #1A1208;
  max-width: 68ch;
}

.serif-revival-display {
  font-family: 'Cormorant Garamond', 'Garamond', serif;
  font-size: clamp(2.5rem, 6vw, 5.5rem);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: 0.01em;
}
```

## Slop Watch
- Pairing Cormorant Garamond with a geometric sans for body — the serif revival aesthetic requires serif-on-serif tension
- Using Cormorant at a light weight for display; the contrast between 600 weight display and 400 body is what makes it feel editorial rather than decorative
