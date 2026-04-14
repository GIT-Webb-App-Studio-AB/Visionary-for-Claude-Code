# Zine DIY

**Category:** hybrid
**Motion tier:** Minimal

## Typography
- **Display font:** Mixed/collage — no single font; deliberate font mixing is the aesthetic
- **Body font:** Courier New (xerox authenticity) or system monospace
- **Tracking:** varies intentionally | **Leading:** 1.4

## Colors
- **Background:** #1A1A1A (xerox black) or white
- **Primary action:** #1A1A1A
- **Accent:** #FF2D78 (hot pink) or #E8FF00 (neon yellow) — one, not both
- **Elevation model:** none; flat, photocopied, zero depth illusion

## Motion
- **Tier:** Minimal
- **Spring tokens:** `{ stiffness: 400, damping: 40 }` — no spring; zines are static
- **Enter animation:** cut — instant appear; or 60ms opacity only
- **Forbidden:** smooth transitions, depth effects, gradients, anything that suggests digital polish

## Spacing
- **Base grid:** irregular; intentional misalignment is structural
- **Border-radius vocabulary:** 0px; scissors cut straight

## Code Pattern
```css
.zine-collage {
  position: relative;
  background: white;
  padding: 16px;
  transform: rotate(-1.5deg);
  border: 2px solid #1A1A1A;
}

.zine-collage--offset {
  transform: rotate(0.8deg) translateX(4px);
}

.zine-text-cut {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  /* Deliberate imperfection: slight misregistration */
  text-shadow: 1px 0 0 rgba(0,0,0,0.15);
}
```

## Slop Watch
- Rotation angles must be varied and small (±0.5–2deg) — identical rotations across all elements read as a design template, not genuine DIY aesthetic
- Never add box-shadow to zine elements; drop shadows signal digital precision, destroying the photocopied material reference
