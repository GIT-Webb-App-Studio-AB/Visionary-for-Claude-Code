# Postmodern

**Category:** historical
**Motion tier:** Expressive

## Typography
- **Display font:** Playfair Display — used ironically, with deliberate tension against surrounding elements
- **Body font:** JetBrains Mono (unexpected pairing, rule-breaking)
- **Tracking:** variable — 0em body, 0.15em display | **Leading:** 1.6 | **Weight range:** 400/700/900

## Colors
- **Background:** #F8F4EE
- **Primary action:** #1A1A2E
- **Accent:** #E8424A
- **Elevation model:** none — visual hierarchy via ironic juxtaposition

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 160, damping: 14` — theatrical but knowing
- **Enter animation:** unexpected — elements enter from off-grid directions (translateX(40px) OR translateY(-30px), randomized per element)
- **Forbidden:** predictable grids, earnest design, visual harmony for its own sake

## Spacing
- **Base grid:** 8px (deliberately broken — some elements intentionally misalign)
- **Border-radius vocabulary:** wildly inconsistent — 0px elements beside 999px pills beside 24px cards

## Code Pattern
```css
/* Postmodern: the rules exist to be broken knowingly */
.pm-heading {
  font-family: 'Playfair Display', serif;
  font-size: clamp(3rem, 10vw, 8rem);
  line-height: 0.9;
  mix-blend-mode: multiply;
}
.pm-code-body {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: #E8424A;
}
.pm-disruption {
  margin-left: -5%; /* intentional overflow */
  position: relative;
  z-index: 2;
}
```

## Slop Watch
Rule-breaking must be legible — the joke only lands if the audience can tell a rule is being broken. Incoherent chaos without detectable intent reads as amateur, not postmodern. Design the break, not the accident.
