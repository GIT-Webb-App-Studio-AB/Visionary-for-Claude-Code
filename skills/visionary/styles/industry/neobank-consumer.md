# Neobank Consumer

**Category:** industry
**Motion tier:** Expressive

## Typography
- **Display font:** Cabinet Grotesk 700–800
- **Body font:** Cabinet Grotesk 400
- **Weight range:** 400–800
- **Tracking:** -0.02em display, 0em body
- **Leading:** 1.1 display, 1.55 body

## Colors
- **Background:** #FFFFFF or #0A0A14 (choose one, commit)
- **Primary action:** #5B2EFF (electric violet) or #00D4AA (mint)
- **Accent:** #F0F0F0 (light mode) / #1A1A2E (dark mode)
- **Elevation model:** soft shadows (0 4px 24px rgba(91, 46, 255, 0.15))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 280, damping: 22, mass: 0.9
- **Enter animation:** cards spring in from below (translate Y 24px → 0), CTA bounces on hover (scale 1 → 1.04 → 1)
- **Forbidden:** sharp snap animations, 0px border-radius, anything that feels like legacy banking

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 20px cards, 999px buttons and pills, 12px inputs — generous rounding signals approachability

## Code Pattern
```css
.neobank-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(91, 46, 255, 0.12);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.neobank-card:hover {
  transform: translateY(-4px);
}

.neobank-cta {
  background: #5B2EFF;
  color: white;
  border-radius: 999px;
  padding: 16px 32px;
  font-family: 'Cabinet Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1rem;
}
```

## Slop Watch
- Using a corporate blue as the primary action; neobank must signal disruption — violet, mint, or coral, never traditional blue
- Reducing border-radius to match industry norms; the exaggerated rounding IS the brand promise of accessibility
