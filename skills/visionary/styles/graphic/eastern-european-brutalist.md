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

## Slop Watch
- The offset block shadow (::after positioned element, not CSS box-shadow) is structural to this style — CSS box-shadow softness undermines the solid-mass aesthetic
- Never introduce border-radius; 1px of rounding reads as Western consumer softness completely at odds with Soviet-era functionalism

## Cultural Note
This style draws from the architectural and graphic design traditions of mid-20th century Eastern Europe — specifically Constructivism, Socialist Realism poster design, and Brutalist architecture of the USSR, Yugoslavia, and Warsaw Pact states. Use as reference for aesthetic language, not as political statement. The red is structural (mass production, Constructivist palette) — not a political endorsement.
