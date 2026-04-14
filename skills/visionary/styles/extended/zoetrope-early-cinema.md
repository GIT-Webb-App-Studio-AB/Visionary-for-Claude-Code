# Zoetrope Early Cinema

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Playfair Display — Victorian era print authority
- **Body font:** Playfair Display Regular
- **Tracking:** 0.02em | **Leading:** 1.55

## Colors
- **Background:** #D4C4A8 (sepia photograph)
- **Primary action:** #1A1008 (darkroom black)
- **Accent:** #8B6340 (projected light amber)
- **Elevation model:** projection light cone; radial gradient from center

## Motion
- **Tier:** Kinetic
- **Spring tokens:** N/A — frame-based stepping, not spring physics
- **Enter animation:** film-flicker — step-based opacity variation at 12fps (1900s projection rate)
- **Forbidden:** smooth motion blur, color, digital-clean rendering

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; film frames are rectangular; zoetrope slots are rectangular

## Code Pattern
```css
@keyframes film-flicker {
  0%   { opacity: 1; filter: sepia(0.8) brightness(0.95); }
  25%  { opacity: 0.9; filter: sepia(0.9) brightness(1.05); }
  50%  { opacity: 1; filter: sepia(0.7) brightness(0.9); }
  75%  { opacity: 0.95; filter: sepia(0.85) brightness(1); }
  100% { opacity: 1; filter: sepia(0.8) brightness(0.95); }
}

.film-frame {
  animation: film-flicker 0.083s steps(1) infinite; /* 12fps step */
  filter: sepia(0.8);
}
```

## Slop Watch
- Film flicker must use `steps(1)` timing — smooth opacity transitions are modern and destroy the analog frame projection reference
- Sepia filter value must stay 0.7–0.9; full sepia (1.0) reads as a CSS filter effect, not aged photographic emulsion
