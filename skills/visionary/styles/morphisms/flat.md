# Flat Design

**Category:** morphisms
**Motion tier:** Subtle

## Typography
- **Display font:** Helvetica Neue or system-ui — Flat design emerged partly as rejection of decorative type
- **Body font:** Helvetica Neue, Arial, sans-serif
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #FFFFFF — pure white, no gradients
- **Primary action:** #E74C3C — Flat UI's iconic tomato red (or any pure hue, no tints)
- **Accent:** #3498DB — peter river blue, full saturation
- **Elevation model:** none — zero depth, zero shadow, zero gradient

## Motion
- **Tier:** Subtle
- **Spring tokens:** ui (state change), micro (toggle)
- **Enter animation:** position slide or instant swap — never scale, never blur
- **Forbidden:** drop shadows, gradients, backdrop-filter, border-radius > 4px on rectangles — all decoration is banned

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px for cards/containers, 4px maximum for buttons, 999px for pills — geometric strictness

## Code Pattern
```css
.flat-button {
  background: #E74C3C;
  color: #ffffff;
  border: none;
  border-radius: 0;
  padding: 12px 24px;
  font-family: Helvetica Neue, sans-serif;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  /* No box-shadow. No gradient. No transition except color. */
  transition: background-color 150ms linear;
}

.flat-button:hover {
  background: #C0392B;
}
```

## Slop Watch
- **"Flat 2.0" creep:** Adding subtle shadows "just a little" destroys the conceptual integrity — commit fully or choose material design instead
- **Muted palette:** Flat design uses full-saturation colors; desaturating them creates a different (duller) aesthetic
