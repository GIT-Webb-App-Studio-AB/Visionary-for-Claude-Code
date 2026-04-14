# Romantic Soft

**Category:** emotional
**Motion tier:** Expressive

## Typography
- **Display font:** Cormorant Garamond 400 italic (or Playfair Display italic)
- **Body font:** Lora 400
- **Weight range:** 300–600
- **Tracking:** 0.02em display, 0.01em body
- **Leading:** 1.3 display, 1.75 body (space for emotion to breathe)

## Colors
- **Background:** #FFF7F7 (blush white) or #FDF4FF (lavender white)
- **Primary action:** #C2185B (deep rose)
- **Accent:** #F8BBD9 (soft pink) or #E8D5FF (soft lavender)
- **Elevation model:** soft diffuse shadows (0 8px 32px rgba(194, 24, 91, 0.08))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 150, damping: 25, mass: 1.3
- **Enter animation:** elements drift up from 16px with opacity fade, 600ms — dreamy, unhurried
- **Forbidden:** sharp snap motion, clinical blue, anything geometric or corporate

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 20px cards, 999px pills, 16px inputs — soft and embracing

## Code Pattern
```css
.romantic-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(194, 24, 91, 0.08),
              0 0 0 1px rgba(248, 187, 217, 0.3);
  backdrop-filter: blur(4px);
}

.romantic-headline {
  font-family: 'Cormorant Garamond', 'Garamond', serif;
  font-style: italic;
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: 0.02em;
  color: #C2185B;
}

.romantic-petal-accent {
  position: absolute;
  opacity: 0.06;
  filter: blur(40px);
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: #F8BBD9;
  pointer-events: none;
}
```

## Slop Watch
- Using Cormorant in upright (non-italic) for the romantic display; the italic IS the emotional signal — upright Cormorant reads as fashion editorial, not romantic
- Making the diffuse blob accents too visible (opacity above 0.1); they should be ambient atmosphere, not designed elements
