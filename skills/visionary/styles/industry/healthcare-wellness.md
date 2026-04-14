# Healthcare Wellness

**Category:** industry
**Motion tier:** Expressive

## Typography
- **Display font:** Chillax 600–700
- **Body font:** Plus Jakarta Sans 400
- **Weight range:** 400–700
- **Tracking:** -0.01em display, 0em body
- **Leading:** 1.15 display, 1.6 body

## Colors
- **Background:** #FDFAF4 (warm cream)
- **Primary action:** #2D6A4F (sage green)
- **Accent:** #F4A261 (warm amber)
- **Elevation model:** soft shadows (0 2px 12px rgba(45, 106, 79, 0.08))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 200, damping: 28, mass: 1.1
- **Enter animation:** gentle scale 0.96→1 + opacity 0→1, 350ms — calming, not exciting
- **Forbidden:** fast snap animations, clinical blue, anything that reads as hospital or pharmaceutical

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 16px cards, 999px pills and tags, 12px inputs — generous and approachable

## Code Pattern
```css
.wellness-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(45, 106, 79, 0.08);
  border: 1px solid rgba(45, 106, 79, 0.08);
}

.wellness-progress {
  height: 8px;
  border-radius: 999px;
  background: #E8F5E9;
  overflow: hidden;
}

.wellness-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #2D6A4F, #52B788);
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Slop Watch
- Using pharmaceutical blue as an accent — wellness products must visually separate themselves from clinical/insurance contexts
- Choosing a progress animation that snaps instantly; the gradual fill on progress bars reinforces the wellness metaphor of gradual improvement
