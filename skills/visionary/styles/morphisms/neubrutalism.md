# Neubrutalism

**Category:** morphisms
**Motion tier:** Kinetic

## Typography
- **Display font:** Space Grotesk 700 or higher — grotesque weight that matches the aggressive border treatment
- **Body font:** Space Grotesk 500
- **Tracking:** -0.02em on large type, 0em body | **Leading:** 1.2 (tight, intentionally uncomfortable)

## Colors
- **Background:** #FFFFFF — pure white is canonical; yellow (#FFFF00) and lime (#00FF00) variants acceptable
- **Primary action:** #000000 — black fills with white text
- **Accent:** #FF4500 — saturated orange-red used for hover states and accents
- **Elevation model:** hard offset shadow — never blurred, always solid color, typically black

## Motion
- **Tier:** Kinetic
- **Spring tokens:** snappy (click), bounce (notification in), layout (reorder)
- **Enter animation:** hard translate (element slides from 8px offset to 0 with zero easing curve)
- **Forbidden:** backdrop-filter, border-radius > 0px on rectangles, gradient backgrounds, opacity fades

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px for all rectangular elements, NO radius — this is the defining constraint

## Code Pattern
```css
.neo-card {
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  box-shadow: 4px 4px 0px #000000;
  padding: 24px;
  transition: transform 100ms ease, box-shadow 100ms ease;
}

.neo-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #000000;
}

.neo-button {
  background: #000000;
  color: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  box-shadow: 4px 4px 0px #FF4500;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
```

## Slop Watch
- **Soft shadows:** Adding blur to the offset shadow (box-shadow: 4px 4px 6px) destroys the hard-edge tension that defines neubrutalism
- **Border-radius compromise:** Even 4px rounds on a neubrutalist card reads as ignorance of the style — it exists specifically to reject softness
