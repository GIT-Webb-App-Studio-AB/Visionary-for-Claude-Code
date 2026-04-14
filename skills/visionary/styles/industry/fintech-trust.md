# Fintech Trust UI

**Category:** industry
**Motion tier:** Subtle

## Typography
- **Display font:** DM Serif Display
- **Body font:** IBM Plex Sans
- **Weight range:** 400–600
- **Tracking:** 0.01em display, 0em body, tabular-nums on all data
- **Leading:** 1.3 display, 1.55 body

## Colors
- **Background:** #0A0A0A
- **Primary action:** #E8FF00 (acid yellow — NOT blue; blue is commoditized fintech)
- **Accent:** #1C1C1C
- **Elevation model:** subtle shadows (0 1px 4px rgba(0,0,0,0.4) on cards)

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 400, damping: 40, mass: 0.8
- **Enter animation:** opacity 0→1 + translate Y 4px → 0, 250ms — data loads fast and confidently
- **Forbidden:** bounce, scale-up animations on financial data, anything that feels playful near numbers

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2px cards, 999px buttons, 6px inputs — deliberate inconsistency signals trust through specificity

## Code Pattern
```css
.fintech-card {
  background: #141414;
  border: 1px solid #2A2A2A;
  border-radius: 2px;
  padding: 24px;
  font-feature-settings: 'tnum' 1, 'ss01' 1;
}

.fintech-metric {
  font-family: 'DM Serif Display', serif;
  font-size: 3rem;
  line-height: 1;
  color: #E8FF00;
  font-feature-settings: 'tnum' 1;
}

.fintech-label {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #666666;
}
```

## Slop Watch
- Using blue as primary action — every established bank uses blue; acid yellow communicates confidence that legacy institutions don't have
- Setting border-radius to 8px+ on cards — generous rounding signals consumer app, not institutional trust

**WCAG AA required on all text/background combinations.**
