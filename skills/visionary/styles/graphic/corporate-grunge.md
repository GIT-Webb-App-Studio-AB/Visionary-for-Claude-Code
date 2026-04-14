# Corporate Grunge

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Arial Bold (distressed via filter or texture overlay) — corporate font made gritty
- **Body font:** Arial Regular
- **Tracking:** 0.02em | **Leading:** 1.4

## Colors
- **Background:** #E8E4DC (aged office paper)
- **Primary action:** #1C1C1C (stamp black)
- **Accent:** #8B3A1A (rust — corporate degradation)
- **Elevation model:** worn shadows; photocopy degradation, no clean drop shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 300, damping: 32 }` — stiff, bureaucratic
- **Enter animation:** stamp-in — instant appear with brief scale 1.02 → 1, 100ms
- **Forbidden:** clean gradients, polished shadows, anything suggesting the brand is healthy

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; stamped bureaucratic forms are rectilinear

## Code Pattern
```css
.corporate-stamp {
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 700;
  color: #8B3A1A;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.7; /* degraded ink */
  transform: rotate(-8deg);
  border: 3px solid #8B3A1A;
  padding: 4px 12px;
  display: inline-block;
}
```

## Slop Watch
- Distress effect must be applied via filter or texture overlay on the element, not by using a distressed font — proper distressed fonts don't exist for Arial and faking it with image filters is more controllable
- Stamp rotation must be ≤ ±12 degrees; beyond that it reads as deliberate design accident rather than authentic stamp misalignment
