# Type Collage

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** Mixed variable — deliberate font mixing is structural; no single font
- **Body font:** Variable; contrast of weights, styles, and faces is the design
- **Tracking:** varies intentionally | **Leading:** varies; collage has no uniform leading

## Colors
- **Background:** #F0EBE0 (newsprint off-white)
- **Primary action:** #1A1A1A (cut-out black)
- **Accent:** CMYK-limited accent (single saturated color: #FF0000 or #0000FF or #FFFF00)
- **Elevation model:** paper layer shadows; physical depth from pasted elements

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 18 }`
- **Enter animation:** elements cut-in from edges or appear with a placement snap, 200ms
- **Forbidden:** typographic hierarchy, consistent font usage, smooth uniform layout

## Spacing
- **Base grid:** irregular; collage intentionally breaks grids
- **Border-radius vocabulary:** 0px; cut paper has clean edges

## Code Pattern
```css
.collage-element {
  position: absolute;
  transform: rotate(var(--rotation));
  box-shadow: 2px 3px 0 rgba(0,0,0,0.12);
}

.collage-word {
  font-family: var(--mixed-font);
  font-size: var(--varied-size);
  line-height: 1;
  display: inline-block;
}
```

## Slop Watch
- Rotation angles must vary per element — all elements at the same rotation reads as a template, not genuine collage
- Limit to one accent color; multi-color accents shift from graphic collage into rainbow chaos
