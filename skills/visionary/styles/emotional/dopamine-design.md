# Dopamine Design

**Category:** emotional
**Motion tier:** Kinetic

## Typography
- **Display font:** Cabinet Grotesk 800–900
- **Body font:** Cabinet Grotesk 500
- **Weight range:** 500–900
- **Tracking:** -0.02em display, 0em body
- **Leading:** 1.0 display, 1.4 body

## Colors
- **Background:** vivid gradient (#FF6B6B → #FFE66D or #4ECDC4 → #45B7D1)
- **Primary action:** #FFFFFF (on vivid background)
- **Accent:** contrast-maximized secondary from gradient
- **Elevation model:** no shadows — color IS the elevation

## Motion
- **Tier:** Kinetic
- **Spring tokens:** stiffness: 380, damping: 18, mass: 0.8
- **Enter animation:** scale 0.7→1 with overshoot bounce, color burst on CTA click
- **Forbidden:** muted colors, subtle motion, anything that could appear in healthcare/legal/finance contexts

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 20px cards, 999px buttons and pills — max roundness for maximum approachability

## Code Pattern
```css
.dopamine-hero {
  background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dopamine-headline {
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: clamp(3rem, 10vw, 8rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: white;
  text-shadow: none;
}

.dopamine-cta {
  background: white;
  color: #FF6B6B;
  border-radius: 999px;
  padding: 18px 40px;
  font-weight: 800;
  font-size: 1.125rem;
  border: none;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dopamine-cta:hover {
  transform: scale(1.06);
}
```

**Blocked contexts:** Healthcare, Legal, Finance, Children's products (requires separate age-appropriate review)

## Slop Watch
- Pulling back on the gradient saturation for "professionalism" — dopamine design's value is in committing fully to joy; half-measures read as confused rather than refined
- Using black text on the vivid gradient; white type on saturated backgrounds maintains contrast while staying in the emotional register
