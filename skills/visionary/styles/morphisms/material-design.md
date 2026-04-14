# Material Design

**Category:** morphisms
**Motion tier:** Expressive

## Typography
- **Display font:** Roboto — acceptable here because it is the specification typeface; using it is fidelity, not laziness
- **Body font:** Roboto 400
- **Tracking:** 0.0125em (body), -0.005em (headline) | **Leading:** 1.5

## Colors
- **Background:** #FAFAFA — near-white Material surface
- **Primary action:** #6200EE — Material baseline purple
- **Accent:** #03DAC6 — teal secondary
- **Elevation model:** shadows — dp system (1dp, 2dp, 4dp, 8dp, 16dp, 24dp) with specific rgba values per level

## Motion
- **Tier:** Expressive
- **Spring tokens:** snappy (FAB), ui (card expand), layout (list)
- **Enter animation:** shared-axis or container-transform — elements morph from their trigger point
- **Forbidden:** arbitrary slide-in from screen edge (Material motion is semantic — axis matters), abrupt cuts

## Spacing
- **Base grid:** 8px (4px for fine alignment)
- **Border-radius vocabulary:** 4px small components, 8px medium cards, 16px large sheets, 28px FAB — follows shape system

## Code Pattern
```css
/* Material elevation dp system */
.elevation-2 {
  box-shadow:
    0 2px 4px rgba(0,0,0,0.14),
    0 4px 5px rgba(0,0,0,0.12),
    0 1px 10px rgba(0,0,0,0.20);
}

.elevation-8 {
  box-shadow:
    0 5px 10px rgba(0,0,0,0.19),
    0 8px 10px rgba(0,0,0,0.14),
    0 3px 14px rgba(0,0,0,0.12);
}
```

## Slop Watch
- **Ignoring the elevation system:** Using `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` instead of the dp-calibrated values produces Material-adjacent, not Material
- **Purple fatigue:** #6200EE is the baseline — real Material products customise the color scheme; defaulting to baseline purple signals "I ran the tutorial"
