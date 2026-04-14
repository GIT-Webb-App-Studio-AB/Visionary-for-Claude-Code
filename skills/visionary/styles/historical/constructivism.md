# Constructivism

**Category:** historical
**Motion tier:** Expressive

## Typography
- **Display font:** Syne Bold — angular, forceful letterforms
- **Body font:** Space Grotesk
- **Tracking:** 0.05em | **Leading:** 1.15 | **Weight range:** 700/900

## Colors
- **Background:** #FFFFFF
- **Primary action:** #CC0000
- **Accent:** #000000
- **Elevation model:** none — layered flat planes create depth

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 200, damping: 20` — deliberate, weighty
- **Enter animation:** slide-diagonal (translateX(-20px) + translateY(-10px) → 0, 300ms)
- **Forbidden:** soft eases, pastel palettes, symmetrical layouts

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — structural rigidity; diagonal lines as decorative element

## Code Pattern
```css
.constructivist-hero {
  position: relative;
  background: #CC0000;
  clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
  padding: 64px 48px;
}
.constructivist-diagonal {
  transform: rotate(-3deg);
  display: inline-block;
  color: #CC0000;
  font-weight: 900;
}
```

## Slop Watch
Diagonal energy must feel intentional, not accidental. Do not apply random rotations — diagonals should cut decisively across a clear grid structure. Avoid symmetry; the movement celebrated dynamic tension.
