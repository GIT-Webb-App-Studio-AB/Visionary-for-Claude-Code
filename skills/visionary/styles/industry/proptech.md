# Proptech

**Category:** industry
**Motion tier:** Expressive

## Typography
- **Display font:** Canela 400–700 (editorial real estate feel)
- **Body font:** DM Sans 400
- **Weight range:** 400–700
- **Tracking:** 0.02em display, 0em body
- **Leading:** 1.2 display, 1.55 body

## Colors
- **Background:** #F9F7F4 (warm off-white — property photography friendly)
- **Primary action:** #1A3A2A (deep forest green — premium property)
- **Accent:** #C8A96E (warm gold — aspirational)
- **Elevation model:** soft shadows (0 4px 20px rgba(0,0,0,0.06))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 240, damping: 28, mass: 1.0
- **Enter animation:** property cards slide in with 40ms stagger, map pins drop with bounce (stiffness: 300, damping: 18)
- **Forbidden:** fast snap animations near pricing, anything that makes pricing feel unstable or impulsive

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 12px property cards, 8px inputs, 999px status badges (Available/Sold/Pending)

## Code Pattern
```css
.property-card {
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s ease;
}

.property-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
}

.property-price {
  font-family: 'Canela', 'Georgia', serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1A3A2A;
  font-feature-settings: 'tnum' 1;
}
```

## Slop Watch
- Using a tech-startup aesthetic (bright primary colors, geometric sans) — proptech that wants premium listings must feel more like Architectural Digest than ProductHunt
- Animating price changes in real time with flashing numbers; price volatility signals should not be dramatized with motion
