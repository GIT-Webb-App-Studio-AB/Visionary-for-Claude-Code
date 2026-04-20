---
id: eastern-european-brutalist
category: graphic
motion_tier: Subtle
density: balanced
locale_fit: [all]
palette_tags: [light, pastel]
keywords: [eastern, european, brutalist, graphic]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Eastern European Brutalist

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Oswald Condensed — weight 600/700; Soviet-adjacent constructivist compression
- **Body font:** Roboto (the irony is intentional — it was designed referencing early Soviet grotesques)
- **Tracking:** 0.06em | **Leading:** 1.35

## Colors
- **Background:** #2A2A2A (concrete panel grey)
- **Primary action:** #CC0000 (Soviet red — used structurally, not decoratively)
- **Accent:** #E8E0D0 (brutalist off-white)
- **Elevation model:** no shadows; depth through mass and solid borders only

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 600, damping: 60 }` — near-static; concrete does not spring
- **Enter animation:** cut — no transition, elements appear; or 80ms linear opacity only
- **Forbidden:** bounce, warmth, gradients, any decorative element not load-bearing

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; the aesthetic philosophy explicitly rejects decoration

## Code Pattern
```css
.brutalist-block {
  background: #2A2A2A;
  border: 4px solid #CC0000;
  border-radius: 0;
  padding: 32px;
  position: relative;
}

.brutalist-block::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: -8px;
  bottom: -8px;
  background: #CC0000;
  z-index: -1;
}
```

## Accessibility

### Contrast
Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.

### Focus
Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.

### Motion
Under `prefers-reduced-motion: reduce`, keep opacity transitions but drop transform/scale/translate — transform is a vestibular trigger. No autoplay exceeds 5 s without a pause control.

### Touch target
Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.

### RTL / Logical properties
Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.

## Slop Watch
- The offset block shadow (::after positioned element, not CSS box-shadow) is structural to this style — CSS box-shadow softness undermines the solid-mass aesthetic
- Never introduce border-radius; 1px of rounding reads as Western consumer softness completely at odds with Soviet-era functionalism

## Cultural Note
This style draws from the architectural and graphic design traditions of mid-20th century Eastern Europe — specifically Constructivism, Socialist Realism poster design, and Brutalist architecture of the USSR, Yugoslavia, and Warsaw Pact states. Use as reference for aesthetic language, not as political statement. The red is structural (mass production, Constructivist palette) — not a political endorsement.
