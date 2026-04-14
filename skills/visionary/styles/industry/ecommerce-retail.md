# Ecommerce Retail

**Category:** industry
**Motion tier:** Expressive

## Typography
- **Display font:** Cabinet Grotesk 700 (premium retail) or Bricolage Grotesque 700 (editorial retail)
- **Body font:** DM Sans 400
- **Weight range:** 400–700
- **Tracking:** -0.02em display, 0em body
- **Leading:** 1.1 display, 1.55 body

## Colors
- **Background:** #FFFFFF (trust signal — product photography needs clean background)
- **Primary action:** brand-specific (must be defined per brand, not generic)
- **Accent:** #FF4D00 (urgency/sale signal)
- **Elevation model:** product card shadows (0 2px 12px rgba(0,0,0,0.08))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 280, damping: 24, mass: 0.9
- **Enter animation:** product grid cards stagger in 40ms apart; add-to-cart triggers scale + color burst
- **Forbidden:** animation on price display changes (feels manipulative), slow hero transitions that delay product visibility

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8px product cards, 6px inputs, 999px quantity selectors and badges

## Code Pattern
```css
.product-card {
  border-radius: 8px;
  overflow: hidden;
  background: white;
  transition: box-shadow 0.25s ease;
}

.product-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}

.product-card:hover .product-image {
  transform: scale(1.03);
}

.product-image {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.add-to-cart {
  border-radius: 6px;
  padding: 12px 24px;
  font-weight: 700;
  font-size: 0.875rem;
  background: #000000;
  color: white;
}
```

## Slop Watch
- Generic "Shop Now" buttons with no brand identity — ecommerce CTA copy and styling must be specific to the product category
- Animating prices during loading states; price flicker destroys purchase confidence
