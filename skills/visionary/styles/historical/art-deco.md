# Art Deco

**Category:** historical
**Motion tier:** Expressive

## Typography
- **Display font:** Cormorant Garamond — aristocratic elegance, high contrast strokes
- **Body font:** Cormorant Garamond Light
- **Tracking:** 0.1em (all-caps headings) | **Leading:** 1.5 | **Weight range:** 300/400/600

## Colors
- **Background:** #0A0A0F
- **Primary action:** #C9A84C
- **Accent:** #F5F0E8
- **Elevation model:** hairline gold borders replace shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 150, damping: 18` — sweeping, theatrical
- **Enter animation:** reveal top-to-bottom (clipPath: `inset(0 0 100% 0)` → `inset(0 0 0% 0)`, 500ms ease-out)
- **Forbidden:** rounded corners, casual motion, flat bright colors

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px — geometric angles, chevrons, sunburst patterns

## Code Pattern
```css
.art-deco-heading {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #C9A84C;
}
.art-deco-card {
  border: 1px solid #C9A84C;
  border-top: 4px solid #C9A84C;
  background: #0A0A0F;
  padding: 32px;
}
.art-deco-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #C9A84C;
}
.art-deco-divider::before,
.art-deco-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #C9A84C, transparent);
}
```

## Slop Watch
Avoid warm orange or yellow — gold (#C9A84C) is specific and precious, not generic. Never use border-radius. All-caps tracking must be `0.1em` minimum — tighter reads as modern SaaS, not Deco.
