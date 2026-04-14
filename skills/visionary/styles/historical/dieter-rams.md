# Dieter Rams

**Category:** historical
**Motion tier:** Subtle

## Typography
- **Display font:** Aktiv Grotesk Light (weight 300) — understatement, function
- **Body font:** Aktiv Grotesk Regular (weight 400)
- **Tracking:** 0em | **Leading:** 1.5 | **Weight range:** 300/400 only — 700 never used decoratively

## Colors
- **Background:** #F5F5F0 (warm white — off-white with intention)
- **Primary action:** #FF6B00 (functional orange — controls only, never decorative)
- **Accent:** #1A1A1A
- **Elevation model:** near-invisible — 0 1px 3px rgba(0,0,0,0.06) only

## Motion
- **Tier:** Subtle
- **Spring tokens:** `stiffness: 600, damping: 60` — mechanical precision, no personality
- **Enter animation:** micro-only — opacity 0→1, 80ms linear; nothing else
- **Forbidden:** expressive animation, decorative transitions, anything that calls attention to itself

## Spacing
- **Base grid:** 8px strict
- **Border-radius vocabulary:** 4px uniform everywhere — the single permitted curve, consistent without exception

## Code Pattern
```css
.rams-control {
  background: #FF6B00;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-family: 'Aktiv Grotesk', sans-serif;
  font-weight: 400;
  font-size: 0.875rem;
  /* No shadows, no gradients, no hover theatrics */
  transition: opacity 80ms linear;
}
.rams-control:hover { opacity: 0.88; }
.rams-surface {
  background: #F5F5F0;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
```

## Slop Watch
Orange is reserved exclusively for interactive controls — buttons, toggles, sliders. Never use it as a decorative accent, background, or typographic color. If something is orange, it must be interactive. Good design is as little design as possible.
