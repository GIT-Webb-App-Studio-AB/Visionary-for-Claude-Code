# Sci-Fi HUD

**Category:** graphic
**Motion tier:** Kinetic

## Typography
- **Display font:** Orbitron — angular, screen-native, military-tech register
- **Body font:** Exo 2
- **Tracking:** 0.12em | **Leading:** 1.35

## Colors
- **Background:** #000810 (deep space black)
- **Primary action:** #00D4FF (HUD cyan)
- **Accent:** #FFB000 (amber alert)
- **Elevation model:** colored glow only; no neutral shadows

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 350, damping: 28 }`
- **Enter animation:** clip-path wipe left→right + fade, 300ms ease-out
- **Forbidden:** organic curves, warm colors, soft ease-in-out

## Spacing
- **Base grid:** 4px (dense data display)
- **Border-radius vocabulary:** 0px; all panels use polygon clip-paths

## Code Pattern
```css
.hud-panel {
  clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%);
  background: rgba(0, 212, 255, 0.06);
  border: 1px solid rgba(0, 212, 255, 0.4);
  box-shadow:
    0 0 20px rgba(0, 212, 255, 0.15),
    inset 0 0 20px rgba(0, 212, 255, 0.05);
}
```

## Slop Watch
- clip-path polygon must match border geometry exactly — a border-radius on a clip-path panel exposes the un-clipped rectangle beneath
- Orbitron at body-text sizes (< 14px) becomes unreadable; switch to Exo 2 for anything below display size
