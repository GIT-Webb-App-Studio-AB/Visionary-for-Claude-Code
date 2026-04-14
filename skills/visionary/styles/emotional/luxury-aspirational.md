# Luxury Aspirational

**Category:** emotional
**Motion tier:** Expressive

## Typography
- **Display font:** Cormorant Garamond 400–600
- **Body font:** Cormorant 400 (italic variant for pull quotes)
- **Weight range:** 300–600
- **Tracking:** 0.06em display (wide tracking signals exclusivity), 0.02em body
- **Leading:** 1.2 display, 1.7 body (generous reading space)

## Colors
- **Background:** #0D0A08 (warm near-black for evening/editorial) or #F5F0E8 (cream for daytime)
- **Primary action:** #C8A96E (warm gold — never #FFD700 which reads as cheap)
- **Accent:** #FFFFFF (dark mode) or #1A1208 (light mode)
- **Elevation model:** none (dark) or barely-there borders (light): 1px solid rgba(200,169,110,0.15)

## Motion
- **Tier:** Expressive (slow — luxury never rushes)
- **Spring tokens:** stiffness: 120, damping: 30, mass: 1.4
- **Enter animation:** opacity 0→1 over 800ms + translate Y 12px→0 — deliberately unhurried
- **Forbidden:** bounce springs (undignified), scale animations (aggressive), fast snap (impatient), anything that appears in a mass-market consumer context

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px (editorial) or 2px (product) — luxury geometry is sharp

## Code Pattern
```css
.luxury-headline {
  font-family: 'Cormorant Garamond', 'Garamond', serif;
  font-size: clamp(2.5rem, 5vw, 5rem);
  font-weight: 400;
  letter-spacing: 0.06em;
  line-height: 1.2;
  color: #C8A96E;
}

.luxury-body {
  font-family: 'Cormorant', 'Garamond', serif;
  font-size: 1rem;
  line-height: 1.7;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.75);
  max-width: 60ch;
}

.luxury-divider {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #C8A96E, transparent);
  margin: 40px auto;
}
```

## Slop Watch
- Using #FFD700 bright gold — it reads as novelty store, not high jewellery; the warm, slightly desaturated #C8A96E reads as genuine gold
- Speeding up the enter animation to feel "snappy" — luxury products signal that they are worth waiting for; slow motion is the point
