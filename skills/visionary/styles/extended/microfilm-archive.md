# Microfilm Archive

**Category:** extended
**Motion tier:** Subtle

## Typography
- **Display font:** Courier Prime — monospace authority of document scanning and archival systems
- **Body font:** Courier Prime Regular
- **Tracking:** 0em | **Leading:** 1.55

## Colors
- **Background:** #0D0D00 (phosphor amber variant) or #1A1A0F (phosphor green variant)
- **Primary action:** #FFB300 (amber phosphor) or #00FF41 (green phosphor)
- **Accent:** Slightly dimmer version of primary phosphor
- **Elevation model:** scan-line pattern; no traditional shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 300, damping: 32 }`
- **Enter animation:** scan-line flicker — subtle opacity variation 0.85→1 at 8fps (not smooth)
- **Forbidden:** color, warm whites, smooth gradients, modern UI signals

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px; CRT monitors and microfilm readers are rectilinear

## Code Pattern
```css
.microfilm-display {
  font-family: 'Courier Prime', 'Courier New', monospace;
  color: #FFB300;
  background: #0D0D00;
  filter: contrast(1.2) brightness(0.9);
}

.scan-line-overlay {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  pointer-events: none;
  position: fixed;
  inset: 0;
}
```

## Slop Watch
- Scan-line overlay must be a separate element with `pointer-events: none` — applying it directly to content containers blocks interaction
- CRT phosphor flicker must use `step` timing function not smooth easing — analog phosphor doesn't fade gracefully, it flickers in discrete steps
