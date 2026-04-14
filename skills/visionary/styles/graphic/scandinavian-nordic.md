# Scandinavian Nordic

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Söhne (or Aktiv Grotesk as alternative) — weight 300/400 only; restraint is mandatory
- **Body font:** Söhne Regular (300)
- **Tracking:** -0.01em | **Leading:** 1.55

## Colors
- **Background:** #F7F7F5 (warm grey-white — not pure white)
- **Primary action:** #1A1A1A (near-black)
- **Accent:** #4A7A9B (coastal blue — desaturated) or #4A7A5A (forest green — desaturated)
- **Elevation model:** 0 1px 8px rgba(0,0,0,0.06); shadow as whisper

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 26 }` — controlled, no excess
- **Enter animation:** fade 200ms ease-out; 2px Y only
- **Forbidden:** bold weights, bright saturated color, decorative animation, visual excess of any kind

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4–8px; functional, not expressive

## Code Pattern
```css
.nordic-card {
  background: #F7F7F5;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  padding: 32px;
}

.nordic-card h2 {
  font-weight: 300;
  letter-spacing: -0.01em;
  color: #1A1A1A;
}
```

## Slop Watch
- Weight 300 is non-negotiable for display text; weight 500+ immediately shifts to German engineering or Swiss corporate, not Nordic domestic warmth
- Accent color must be desaturated — a vivid blue or green reads as Scandinavian flag imagery, not the subdued coastal/forest color language of Nordic design

## Cultural Note
This style draws from Scandinavian interior design tradition (Muuto, HAY, &Tradition) and the typographic sensibility of studios like Snøhetta and Norm Architects. It is not Finnish (which has distinct darker, more dramatic influences) or Icelandic (which skews more dramatic). The warmth of #F7F7F5 over pure white is specifically Danish/Swedish domestic — not clinical.
