# Print to Web Editorial

**Category:** hybrid
**Motion tier:** Subtle

## Typography
- **Display font:** Playfair Display — high-contrast serif maintains print authority in web context
- **Body font:** Source Serif 4
- **Tracking:** -0.01em | **Leading:** 1.65

## Colors
- **Background:** #F5F0E8 (newsprint warm)
- **Primary action:** #1A1008 (ink black)
- **Accent:** #8B1A1A (editorial red)
- **Elevation model:** subtle drop shadows; no glow

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 180, damping: 28 }`
- **Enter animation:** fade-in 200ms ease-out
- **Forbidden:** bounce, scale pop, neon glow

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; editorial discipline, no rounding

## Code Pattern
```css
.editorial-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.editorial-lead {
  grid-column: 1 / 8;
  font-family: 'Playfair Display', Georgia, serif;
}

.editorial-sidebar {
  grid-column: 9 / 13;
  border-left: 1px solid #C8B89A;
  padding-left: 20px;
}
```

## Slop Watch
- Print column layouts require CSS Grid — float-based or flexbox multi-column layouts lose typographic precision at narrow viewports
- Never mix the editorial serif display with a sans-serif body; the tonal clash defeats the broadsheet register
