# Big Bold Type

**Category:** typography-led
**Motion tier:** Expressive

## Typography
- **Display font:** Cabinet Grotesk 900
- **Body font:** Cabinet Grotesk 400
- **Weight range:** 400–900
- **Tracking:** -0.04em on display, 0em on body
- **Leading:** 0.9–1.0 on display headlines, 1.5 on body

## Colors
- **Background:** #FFFFFF or #000000
- **Primary action:** #000000 (on white) / #FFFFFF (on black)
- **Accent:** #FF4D00
- **Elevation model:** none — scale is the elevation metaphor

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 300, damping: 25, mass: 1
- **Enter animation:** scale from 0.85 + opacity 0→1, 400ms
- **Forbidden:** subtle microinteractions, thin type weights, centered alignment

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px on containers, 999px on pill buttons only

## Code Pattern
```css
.big-bold-headline {
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: clamp(4rem, 14vw, 14rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 0.95;
  text-transform: uppercase;
}

.big-bold-hero {
  display: grid;
  grid-template-columns: 1fr;
  padding: 0;
  overflow: hidden;
}
```

## Slop Watch
- Reducing tracking to -0.02em — the extreme -0.04em is what makes it feel intentional, not sloppy
- Adding a hero image behind the text; the type must dominate on pure background
