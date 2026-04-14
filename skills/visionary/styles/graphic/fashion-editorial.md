# Fashion Editorial

**Category:** hybrid
**Motion tier:** Expressive

## Typography
- **Display font:** Cormorant Garamond — ultra high-contrast, fashion-magazine authority
- **Body font:** Cormorant Garamond Regular
- **Tracking:** 0.08em | **Leading:** 1.4

## Colors
- **Background:** #FFFFFF (stark white) or #0A0A0A (stark black)
- **Primary action:** #000000 or #FFFFFF (inverse of background)
- **Accent:** none — fashion editorial uses monochrome discipline
- **Elevation model:** no shadows; depth through scale and white space only

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 200, damping: 22 }` — confident, not bouncy
- **Enter animation:** gentle fade + 6px upward drift, 400ms ease-out
- **Forbidden:** rounded corners > 4px, gradients, color accents, fast snappy transitions

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; fashion editorial is uncompromisingly geometric

## Code Pattern
```css
.fashion-hero-type {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-size: clamp(3rem, 8vw, 8rem);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 0.95;
  font-weight: 300;
}

.fashion-caption {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #888888;
}
```

## Slop Watch
- Display font must be loaded at weight 300 — Cormorant at 400+ loses the fragile high-contrast hairline quality that makes fashion editorial distinctive
- Never add a color accent; fashion editorial's power comes from monochrome restraint; a single colored element shatters the register
