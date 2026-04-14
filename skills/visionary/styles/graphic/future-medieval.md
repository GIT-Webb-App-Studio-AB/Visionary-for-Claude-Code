# Future Medieval

**Category:** extended
**Motion tier:** Expressive

## Typography
- **Display font:** MedievalSharp (or UnifrakturMaguntia) — blackletter authority with digital edge
- **Body font:** Cinzel Regular (readable blackletter-adjacent serif)
- **Tracking:** 0.04em | **Leading:** 1.6

## Colors
- **Background:** #0D0D1A (dark vellum)
- **Primary action:** #C9A84C (illuminated gold)
- **Accent:** #6B1A2A (blood manuscript)
- **Elevation model:** candlelit ambient glow; gold halos on key elements

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 160, damping: 20 }`
- **Enter animation:** illuminate — fade in 400ms with gold edge highlight expansion
- **Forbidden:** neon, blue-white tech colors, clean modern sans-serif

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; vellum is flat, illuminated manuscripts have no rounded corners

## Code Pattern
```css
.illuminated-initial {
  font-family: 'UnifrakturMaguntia', 'MedievalSharp', serif;
  font-size: 4rem;
  color: #C9A84C;
  text-shadow: 0 0 16px rgba(201, 168, 76, 0.5);
  float: left;
  margin-right: 8px;
}
```

## Slop Watch
- Blackletter fonts become illegible below 18px at body text; use Cinzel for readable body text and reserve blackletter for display sizes only
- Gold glow must stay ≤ 16px spread radius; larger glows read as digital halo, not candlelight
