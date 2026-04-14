# Deconstructed Type

**Category:** typography-led
**Motion tier:** Kinetic

## Typography
- **Display font:** Helvetica Neue (fragments scattered) + Neue Haas Grotesk Display
- **Body font:** Helvetica Neue 400
- **Weight range:** 100–900 (extreme contrast between fragments)
- **Tracking:** variable — fragments have -0.05em to 0.2em intentionally
- **Leading:** 0.8–1.0 for display fragments (overlapping is intentional)

## Colors
- **Background:** #F0EEE8
- **Primary action:** #0A0A0A
- **Accent:** #FF2D20
- **Elevation model:** none — z-index and overlap of type fragments create all hierarchy

## Motion
- **Tier:** Kinetic
- **Spring tokens:** stiffness: 600, damping: 15, mass: 0.6
- **Enter animation:** fragments scatter from center point and settle into reading-order positions over 800ms
- **Forbidden:** readable linear text in hero (fragments are the aesthetic), accessibility contexts, enterprise B2B

## Spacing
- **Base grid:** none — intentional chaos mapped to an invisible 8px grid on body content only
- **Border-radius vocabulary:** 0px — deconstruction is rectilinear

## Code Pattern
```css
.deconstructed-fragment {
  position: absolute;
  font-family: 'Helvetica Neue', 'Arial', sans-serif;
  mix-blend-mode: multiply;
  pointer-events: none;
}

.fragment-large {
  font-size: clamp(6rem, 20vw, 20rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  opacity: 0.9;
}

.fragment-ghost {
  font-size: clamp(4rem, 12vw, 14rem);
  font-weight: 100;
  letter-spacing: 0.15em;
  opacity: 0.15;
}
```

## Slop Watch
- Making the deconstruction so complete it becomes illegible — one word must anchor the composition at full legibility
- Adding color to the fragments; deconstruction works in near-black on light or near-white on dark, not multicolor
