# Energetic Athletic

**Category:** emotional
**Motion tier:** Kinetic

## Typography
- **Display font:** Barlow Condensed 800–900
- **Body font:** Barlow 500
- **Weight range:** 500–900
- **Tracking:** 0.02em display uppercase, 0em body
- **Leading:** 0.9–1.0 display (compressed for intensity), 1.4 body

## Colors
- **Background:** #0A0A0A or #F5F5F5
- **Primary action:** #FF2D00 (athletic red) or #00D084 (performance green)
- **Accent:** #FFFFFF (dark) or #000000 (light)
- **Elevation model:** none (dark) / hard drop shadows offset 4px (light, creates athletic poster aesthetic)

## Motion
- **Tier:** Kinetic
- **Spring tokens:** stiffness: 500, damping: 22, mass: 0.7
- **Enter animation:** elements slam in from direction of motion (left/right stagger), number counters count up at high speed
- **Forbidden:** gentle easing, rounded organic paths, anything that suggests rest or recovery

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px hero elements and stats, 4px cards, 999px performance badges

## Code Pattern
```css
.athletic-stat {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(4rem, 12vw, 10rem);
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 0.9;
  color: #FF2D00;
}

.athletic-label {
  font-family: 'Barlow', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #666666;
}

@keyframes slam-in {
  from { transform: translateX(-60px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

.athletic-feature {
  animation: slam-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

## Slop Watch
- Reducing the display font weight below 800 for "refinement" — athletic brands communicate through weight and compression; pulling back reads as hesitant, not refined
- Using smooth cubic-bezier curves instead of fast spring physics; athletic motion should feel like a sprinter, not a dancer
