# Uncanny Valley

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** System-ui — deliberately familiar but slightly wrong (letter-spacing: -0.5px + wrong weight)
- **Body font:** System-ui at slightly-off metrics
- **Tracking:** -0.03em (intentionally uncomfortable) | **Leading:** 1.48 (slightly wrong)

## Colors
- **Background:** #F5F5F3 (almost-white — not quite right)
- **Primary action:** #1A1A18 (almost-black — slightly warm)
- **Accent:** Almost-right skin tones (#E8C8B0) or desaturated primaries
- **Elevation model:** shadows at wrong angles; light source inconsistency is intentional

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 15 }` — slightly over-responsive
- **Enter animation:** deliberately uncomfortable micro-delays (40ms inconsistent stagger)
- **Forbidden:** correct typography, comfortable motion, fully coherent design systems

## Spacing
- **Base grid:** 8px (but occasionally off by 1px intentionally)
- **Border-radius vocabulary:** 5px (non-standard, slightly wrong)

## Code Pattern
```css
.uncanny-element {
  transition-timing-function: cubic-bezier(0.68, -0.6, 0.32, 1.6);
  /* Slight overcorrection — like a person smiling too hard */
}

.uncanny-hover:hover {
  transform: scale(1.01) rotate(0.1deg); /* wrong amount */
  transition-duration: 180ms; /* slightly too fast */
}

.uncanny-text {
  letter-spacing: -0.03em;
  font-weight: 450; /* non-standard weight — browser interpolates */
}
```

## Slop Watch
- Off-by-one design must be intentional and controlled — random sloppiness reads as incompetence, not uncanny; each "wrong" element needs deliberate rationale
- Never apply uncanny valley to critical UI (forms, error states, CTAs) — users may genuinely misread intentional wrongness as broken software
