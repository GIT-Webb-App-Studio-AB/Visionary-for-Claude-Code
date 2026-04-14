# Streaming Media

**Category:** industry
**Motion tier:** Expressive

## Typography
- **Display font:** Bricolage Grotesque 700 (distinct from streaming incumbents)
- **Body font:** DM Sans 400
- **Weight range:** 400–700
- **Tracking:** -0.01em display, 0em body
- **Leading:** 1.1 title cards, 1.55 descriptions

## Colors
- **Background:** #141414 (Netflix-dark — content-first darkness)
- **Primary action:** #E50914 (streaming red) or brand-specific
- **Accent:** #FFFFFF
- **Elevation model:** none on content; floating UI elements use dark blur (backdrop-filter: blur(20px))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 260, damping: 26, mass: 0.9
- **Enter animation:** content rows slide in 60px from right; hover card expands scale 1→1.12 with shadow bloom
- **Forbidden:** white backgrounds (destroys dark-mode immersion), slow modal transitions that interrupt content intent

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 4px content cards (almost flat to maximize poster art), 999px pills and ratings badges

## Code Pattern
```css
.streaming-content-card {
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s ease,
              z-index 0s 0.15s;
  position: relative;
}

.streaming-content-card:hover {
  transform: scale(1.12);
  box-shadow: 0 16px 40px rgba(0,0,0,0.6);
  z-index: 10;
  transition-delay: 0s;
}

.streaming-content-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.streaming-content-card:hover .streaming-content-overlay {
  opacity: 1;
}
```

## Slop Watch
- Using card border-radius above 8px; streaming platforms use near-flat cards to maximize art visibility — rounding clips the poster composition
- Adding a white or light-grey background to any section; dark mode immersion is the product promise in streaming interfaces
