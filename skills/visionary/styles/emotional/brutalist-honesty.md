# Brutalist Honesty

**Category:** emotional
**Motion tier:** Subtle

## Typography
- **Display font:** Helvetica Neue Black / Arial Black (ubiquitous — brutalism uses default, not exotic)
- **Body font:** Helvetica Neue / Arial (system default)
- **Weight range:** 400–900 (extreme weight contrast, nothing in between)
- **Tracking:** 0em (no affectation)
- **Leading:** 1.1 display, 1.5 body

## Colors
- **Background:** #FFFFFF (raw white) or #D4D4D4 (raw grey)
- **Primary action:** #000000
- **Accent:** none, or one strong flat color (#FF0000 used sparingly)
- **Elevation model:** none — flat. Or hard offset box-shadow only: 4px 4px 0 #000000

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 600, damping: 35, mass: 0.5
- **Enter animation:** immediate opacity snap (100ms or less) — brutalism values honesty over elegance
- **Forbidden:** ease curves (dishonest softening), gradients, rounded corners, hover shadows that suggest depth that doesn't exist

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px everywhere — absolute zero, no exceptions

## Code Pattern
```css
.brutalist-card {
  border: 2px solid #000000;
  border-radius: 0;
  padding: 24px;
  box-shadow: 4px 4px 0 #000000;
  background: #FFFFFF;
  transition: box-shadow 0.1s ease, transform 0.1s ease;
}

.brutalist-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #000000;
}

.brutalist-button {
  background: #000000;
  color: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 0;
  padding: 14px 28px;
  font-family: 'Helvetica Neue', 'Arial', sans-serif;
  font-weight: 900;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}
```

## Slop Watch
- Adding any border-radius; a single rounded corner collapses the brutalist contract with the viewer immediately
- Using a designed sans (Neue Haas, Inter) instead of the default system font; the brutalist honesty IS the use of what's already there, not a designed substitute for it
