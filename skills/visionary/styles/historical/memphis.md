# Memphis

**Category:** historical
**Motion tier:** Kinetic

## Typography
- **Display font:** Futura Heavy — bold, geometric, unapologetically loud
- **Body font:** Futura Medium
- **Tracking:** 0em | **Leading:** 1.2 | **Weight range:** 700/900

## Colors
- **Background:** #FFFFFF
- **Primary action:** #FF0080
- **Accent:** #FFFF00
- **Elevation model:** none — flat + pattern fills replace depth

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `stiffness: 180, damping: 12, mass: 0.8` — bouncy, irreverent
- **Enter animation:** bounce-in (scale 0 → 1.1 → 0.95 → 1, 400ms)
- **Forbidden:** restraint, quiet color combinations, grid alignment (intentional misalignment is correct)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** deliberately inconsistent — mix 0px sharp elements with 50% pill shapes; never uniform

## Code Pattern
```css
.memphis-card {
  background: #FFFFFF;
  border: 3px solid #000000;
  position: relative;
  padding: 32px;
}
.memphis-card::after {
  content: '';
  position: absolute;
  inset: 4px -4px -4px 4px;
  background: #FF0080;
  z-index: -1;
}
.memphis-pattern {
  background-image:
    repeating-linear-gradient(45deg, #FFFF00 0, #FFFF00 2px, transparent 0, transparent 50%),
    repeating-linear-gradient(-45deg, #0055FF 0, #0055FF 2px, transparent 0, transparent 50%);
  background-size: 20px 20px;
}
```

## Slop Watch
Memphis chaos must be compositionally intentional — it breaks rules on purpose, not randomly. Avoid making it look like a mistake. Patterns should clash loudly; muted Memphis is not Memphis.
