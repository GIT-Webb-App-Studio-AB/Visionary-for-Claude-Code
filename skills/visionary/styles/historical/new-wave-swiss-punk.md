# New Wave / Swiss Punk

**Category:** historical
**Motion tier:** Kinetic

## Typography
- **Display font:** Helvetica Neue (deconstructed — overlapping, rotated, cut off) — the establishment appropriated
- **Body font:** Helvetica Neue Regular (treated normally to create ironic contrast)
- **Tracking:** chaotic — 0em to 0.3em within same composition | **Leading:** 0.9 to 1.8 mixed | **Weight range:** 300/700 deliberately colliding

## Colors
- **Background:** #FFFFFF
- **Primary action:** #000000
- **Accent:** #FF0000
- **Elevation model:** none — raw structure only

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `stiffness: 220, damping: 10` — twitchy, aggressive
- **Enter animation:** glitch-in (rapid position jitter 3×, then settle, 250ms)
- **Forbidden:** smooth animations, comfortable spacing, restrained color application

## Spacing
- **Base grid:** 8px (actively violated)
- **Border-radius vocabulary:** 0px — the rebellion is geometric

## Code Pattern
```css
.nwsp-layer-1 {
  position: absolute;
  font-size: 12rem;
  font-weight: 700;
  opacity: 0.12;
  top: -20px;
  left: -40px;
  user-select: none;
}
.nwsp-layer-2 {
  position: relative;
  z-index: 2;
  font-weight: 300;
  letter-spacing: 0.3em;
  color: #FF0000;
}
@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20%       { transform: translate(-3px, 1px); }
  40%       { transform: translate(3px, -1px); }
  60%       { transform: translate(-1px, 3px); }
}
```

## Slop Watch
Deconstruction without legibility is noise. At least one text element must be clearly readable at all times — the chaos frames the message, not replaces it. Limited palette (black/white/red) is non-negotiable.
