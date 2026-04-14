# Handwritten Gestural

**Category:** typography-led
**Motion tier:** Expressive

## Typography
- **Display font:** Caveat 700 (casual) or Reenie Beanie (loose gestural)
- **Body font:** Plus Jakarta Sans 400 (contrast: structured body anchors the gestural display)
- **Weight range:** 400–700
- **Tracking:** -0.01em display, 0.01em body
- **Leading:** 1.2 display, 1.6 body

## Colors
- **Background:** #FFFEF7
- **Primary action:** #1A1A1A
- **Accent:** #2D6A4F
- **Elevation model:** none — texture and paper-like background do the work

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 200, damping: 20, mass: 1.1
- **Enter animation:** SVG path draw-on for decorative underlines, text appears with slight rotation correction (2deg → 0deg)
- **Forbidden:** pixel-perfect alignment, drop shadows, rigid grid for handwritten elements

## Spacing
- **Base grid:** 8px (body) — gestural elements break the grid intentionally
- **Border-radius vocabulary:** organic variation — 4px, 8px, 12px mixed to suggest hand-drawn elements

## Code Pattern
```css
.handwritten-display {
  font-family: 'Caveat', cursive;
  font-size: clamp(2.5rem, 7vw, 6rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
  transform: rotate(-1.5deg);
  display: inline-block;
}

.gestural-underline {
  text-decoration: none;
  background-image: url("data:image/svg+xml,..."); /* hand-drawn SVG underline */
  background-repeat: no-repeat;
  background-position: bottom;
}
```

## Slop Watch
- Centering handwritten text — gestural type reads left-aligned with organic margin variance
- Choosing a handwriting font that is too legible and uniform; true gestural style has inconsistency in letterform
