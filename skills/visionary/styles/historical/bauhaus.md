# Bauhaus

**Category:** historical
**Motion tier:** Subtle

## Typography
- **Display font:** Bebas Neue — geometric letterforms echo structural grid discipline
- **Body font:** DM Serif Display
- **Tracking:** 0em | **Leading:** 1.2 | **Weight range:** 400/700 only

## Colors
- **Background:** #FFFFFF
- **Primary action:** #0066CC
- **Accent:** #FFCD29
- **Elevation model:** none — flat surfaces only, depth via color blocks

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 300, damping: 30` — mechanical, no bounce
- **Enter animation:** fade (opacity 0→1, 120ms linear)
- **Forbidden:** easing curves, bounce, blur, drop-shadows

## Spacing
- **Base grid:** 8px strict — every value a multiple of 8
- **Border-radius vocabulary:** 0px everywhere — no rounding, ever

## Code Pattern
```css
.bauhaus-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0;
}
.bauhaus-accent {
  border-left: 8px solid #FFCD29;
  padding-left: 24px;
}
.bauhaus-primary {
  background: #FF3B30;
  color: #FFFFFF;
  border-radius: 0;
}
```

## Slop Watch
Do not add gradients, rounded corners, or drop-shadows. No serif body text. If you find yourself reaching for `border-radius` or `box-shadow`, stop — those are modernist additions Bauhaus never knew.
