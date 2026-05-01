---
id: brutalist-honesty
category: emotional
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [dark, light, neon, pastel]
keywords: [brutalist, honesty, emotional]
accessibility:
  contrast_floor: 4.5
  reduced_motion: static
  touch_target: 44
allows_slop:
  - "default tailwind blue"
  - "uniform border-radius"
  - "symmetric padding everywhere"
allows_slop_reason: "Brutalism uses default tooling as a deliberate aesthetic statement — raw, unstyled, honestly-what-the-framework-ships-with. Refusing defaults here would violate the style's thesis."
---

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

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
No animation by default; static entry and state changes. `prefers-reduced-motion` is already honored because there is nothing to reduce.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- Adding any border-radius; a single rounded corner collapses the brutalist contract with the viewer immediately
- Using a designed sans (Neue Haas, Inter) instead of the default system font; the brutalist honesty IS the use of what's already there, not a designed substitute for it
