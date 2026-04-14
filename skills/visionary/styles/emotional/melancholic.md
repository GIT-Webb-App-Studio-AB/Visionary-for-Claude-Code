# Melancholic

**Category:** emotional
**Motion tier:** Subtle

## Typography
- **Display font:** Libre Baskerville 400 (weight restrained — sadness is not dramatic)
- **Body font:** Libre Baskerville 400
- **Weight range:** 300–500 (no bold — melancholy doesn't shout)
- **Tracking:** 0.03em (slightly open — wistful breathing room)
- **Leading:** 1.8 body (slow, deliberate reading pace)

## Colors
- **Background:** #1C1C1E (deep grey, not black — melancholy has texture)
- **Primary action:** #7A8A9A (muted blue-grey — faded, not vibrant)
- **Accent:** #4A5568 (deeper grey for secondary elements)
- **Elevation model:** none — melancholy is flat

## Motion
- **Tier:** Subtle (slow, deliberate)
- **Spring tokens:** stiffness: 80, damping: 30, mass: 2.0
- **Enter animation:** opacity 0→0.85 over 1000ms — elements never reach full opacity in melancholic design
- **Forbidden:** bright saturated colors, bouncy springs, any motion that communicates joy or urgency

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px or 2px — no softening; melancholy doesn't round its edges

## Code Pattern
```css
.melancholic-surface {
  background: #1C1C1E;
  color: rgba(255, 255, 255, 0.7); /* never full opacity */
  padding: 48px;
}

.melancholic-headline {
  font-family: 'Libre Baskerville', 'Georgia', serif;
  font-size: clamp(1.75rem, 4vw, 3.5rem);
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 32px;
}

.melancholic-body {
  font-family: 'Libre Baskerville', 'Georgia', serif;
  font-size: 1rem;
  line-height: 1.8;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.55);
  max-width: 62ch;
}
```

## Slop Watch
- Setting text to full white opacity — melancholic text should never be at full contrast; the faded opacity IS the emotional signal of incompleteness
- Using a dark background that is pure #000000 black; true melancholy has warmth in its darkness — pure black reads as void or aggressive, not sad
