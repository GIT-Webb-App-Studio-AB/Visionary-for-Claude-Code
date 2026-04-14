# Early Web Geocities

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Comic Sans MS (intentional) or Impact — the authentic 1996–2003 web register
- **Body font:** Times New Roman (browser default era) or Verdana (early web-safe)
- **Tracking:** 0em | **Leading:** 1.2 (cramped by modern standards)

## Colors
- **Background:** Tiled pattern (stars, flames, or animated GIF background)
- **Primary action:** #FF0000 (bright red) or #0000FF (hyperlink blue)
- **Accent:** #FFFF00 (yellow — marquee text standard)
- **Elevation model:** none; everything is flat 1990s web

## Motion
- **Tier:** Kinetic
- **Spring tokens:** N/A — CSS animations only, keyframe-based
- **Enter animation:** blinking marquee text; under construction GIF; visitor counter
- **Forbidden:** smooth transitions, backdrop-filter, CSS Grid, modern layout

## Spacing
- **Base grid:** none — table-based layout, pixel-perfect manual placement
- **Border-radius vocabulary:** 0px; CSS border-radius didn't exist

## Code Pattern
```css
@keyframes blink {
  0%, 100% { visibility: visible; }
  50%       { visibility: hidden; }
}

.blink-text {
  animation: blink 0.5s step-end infinite;
  color: #FF0000;
  text-decoration: underline blink; /* nostalgic non-standard */
}

.marquee-container {
  overflow: hidden;
  white-space: nowrap;
}

.marquee-text {
  display: inline-block;
  animation: marquee 8s linear infinite;
}

@keyframes marquee {
  from { transform: translateX(100%); }
  to   { transform: translateX(-100%); }
}
```

## Slop Watch
- Comic Sans must be used intentionally and consistently — mixing it with modern fonts ironically produces "ironic bad design" which misses the genuine nostalgia register
- Blink animation must use `step-end` timing not smooth easing — smooth blink looks like a fade, not the binary on/off of early browser implementations
