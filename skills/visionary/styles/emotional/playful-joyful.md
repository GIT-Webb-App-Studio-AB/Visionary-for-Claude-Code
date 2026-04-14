# Playful Joyful

**Category:** emotional
**Motion tier:** Expressive

## Typography
- **Display font:** Nunito 800 (rounded letterforms reinforce play)
- **Body font:** Nunito 500
- **Weight range:** 500–800
- **Tracking:** -0.01em display, 0em body
- **Leading:** 1.15 display, 1.65 body

## Colors
- **Background:** #FFFBF0 (warm cream — not clinical white)
- **Primary action:** #FF6B35 (playful orange)
- **Accent:** #4ECDC4 (friendly teal)
- **Elevation model:** soft colored shadows (0 4px 16px rgba(255, 107, 53, 0.2))

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 260, damping: 20, mass: 1.0
- **Enter animation:** elements bounce in from below, icons wiggle on hover (rotate -5deg → 5deg → 0)
- **Forbidden:** sharp snap animations, dark themes, anything that creates tension or urgency

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 16px cards, 12px inputs, 999px buttons — consistently generous

## Code Pattern
```css
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}

.playful-icon:hover {
  animation: wiggle 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.playful-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(255, 107, 53, 0.12);
  border: 2px solid transparent;
  transition: border-color 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.playful-card:hover {
  border-color: rgba(255, 107, 53, 0.3);
  transform: translateY(-4px) rotate(0.5deg);
}
```

## Slop Watch
- Using the wiggle animation on every interactive element; playful motion must be surprising, not constant — overuse creates fatigue
- Pairing Nunito with a sharp geometric sans as body; the rounded letterforms must carry through to body text for tonal consistency
