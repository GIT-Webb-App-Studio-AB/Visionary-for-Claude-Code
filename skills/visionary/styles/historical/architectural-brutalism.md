# Architectural Brutalism

**Category:** historical
**Motion tier:** Subtle

## Typography
- **Display font:** Syne Bold — raw weight, structural honesty
- **Body font:** Space Grotesk Regular
- **Tracking:** 0.01em | **Leading:** 1.4 | **Weight range:** 400/700

## Colors
- **Background:** #6B7280 (exposed concrete)
- **Primary action:** #1F2937
- **Accent:** #F3F4F6
- **Elevation model:** none — raw structural form; mass creates presence

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 500, damping: 50` — heavy, no elasticity
- **Enter animation:** none preferred; if required: translateY(-8px) → 0, 200ms linear
- **Forbidden:** drop-shadows, rounded corners, gentle motion, warmth of any kind

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px absolute — concrete does not curve

## Code Pattern
```css
.brutalist-surface {
  background: #6B7280;
  border: none;
  padding: 40px 48px;
}
.brutalist-block {
  background: #1F2937;
  color: #F3F4F6;
  padding: 24px;
  /* No shadows, no borders — mass alone */
}
.brutalist-exposed {
  /* Show the structure */
  outline: 2px solid rgba(243, 244, 246, 0.2);
  outline-offset: -2px;
}
```

## Slop Watch
Brutalism in web design often means "no CSS" — architectural brutalism means raw material honestly expressed. The concrete grey must read as material, not dirt. White text on grey requires precise contrast ratios; test with a contrast checker.
