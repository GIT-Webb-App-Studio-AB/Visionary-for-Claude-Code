# Marine Nautical Chart

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Gill Sans (or Futura) — maritime authority, used in NOAA and Admiralty charts
- **Body font:** Gill Sans Regular
- **Tracking:** 0.04em | **Leading:** 1.5

## Colors
- **Background:** #F0F4F8 (chart paper blue-white)
- **Primary action:** #1A2B5A (deep navy)
- **Accent:** #4A7A9B (coastal water blue)
- **Elevation model:** depth soundings as typography; no elevation shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 200, damping: 28 }`
- **Enter animation:** fade 180ms ease-out; nautical charts are static reference documents
- **Forbidden:** dark backgrounds, warm colors, decorative flourishes, anything that compromises legibility

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; nautical charts use crisp rectilinear geometry

## Code Pattern
```css
.nautical-grid {
  background-color: #F0F4F8;
  background-image:
    linear-gradient(rgba(74, 122, 155, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 122, 155, 0.15) 1px, transparent 1px);
  background-size: 40px 40px;
}

.depth-label {
  font-family: 'Gill Sans', 'Futura', sans-serif;
  font-size: 0.65rem;
  color: #1A2B5A;
  letter-spacing: 0.04em;
}
```

## Slop Watch
- Chart grid lines must be blue-tinted (not neutral grey) — nautical charts use blue for water grid lines as a convention; grey grids read as spreadsheets
- Depth labels must use Gill Sans not a serif; maritime charts use sans-serif for all annotations for legibility at small sizes
