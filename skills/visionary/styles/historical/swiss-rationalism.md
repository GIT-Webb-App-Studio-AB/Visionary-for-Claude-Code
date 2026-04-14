# Swiss Rationalism

**Category:** historical
**Motion tier:** Subtle

## Typography
- **Display font:** Neue Haas Grotesk (fallback: Helvetica Neue) — the canonical rational sans
- **Body font:** Helvetica Neue Light
- **Tracking:** -0.02em | **Leading:** 1.4 | **Weight range:** 300/400/700

## Colors
- **Background:** #FFFFFF
- **Primary action:** #000000
- **Accent:** #FF0000
- **Elevation model:** none — grid structure replaces visual hierarchy tricks

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 400, damping: 40` — terse, controlled
- **Enter animation:** none preferred; if required, fade 80ms linear
- **Forbidden:** decorative transitions, parallax, scroll-triggered theatrics

## Spacing
- **Base grid:** 12-column strict, 8px unit
- **Border-radius vocabulary:** 0px — geometry is the ornament

## Code Pattern
```css
.swiss-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}
.swiss-heading {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
```

## Slop Watch
Content before motion — information hierarchy is achieved through grid placement, weight contrast, and scale, not animation. Never let a transition distract from reading. If in doubt, remove it.
