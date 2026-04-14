# Mono Aesthetic

**Category:** typography-led
**Motion tier:** Subtle

## Typography
- **Display font:** JetBrains Mono
- **Body font:** JetBrains Mono
- **Weight range:** 400–700
- **Tracking:** 0.02em on all text
- **Leading:** 1.5–1.7 (generous, respects the mono grid)

## Colors
- **Background:** #0D0D0D
- **Primary action:** #00FF41 (green terminal) or #FFB000 (amber terminal)
- **Accent:** #444444
- **Elevation model:** glows (box-shadow: 0 0 20px rgba(0, 255, 65, 0.3))

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 500, damping: 35, mass: 0.5
- **Enter animation:** cursor-blink reveal — text appears character by character at 30ms intervals
- **Forbidden:** rounded corners, serif fonts as accents, gradient backgrounds

## Spacing
- **Base grid:** 8px (character-cell aligned)
- **Border-radius vocabulary:** 0px everywhere — terminals have no curves

## Code Pattern
```css
.mono-terminal {
  font-family: 'JetBrains Mono', monospace;
  background: #0D0D0D;
  color: #00FF41;
  padding: 24px;
  border-radius: 0;
  border: 1px solid #1A1A1A;
}

.mono-cursor::after {
  content: '█';
  animation: blink 1s step-end infinite;
  color: #00FF41;
}

@keyframes blink {
  50% { opacity: 0; }
}
```

## Slop Watch
- Using a geometric sans for body text alongside mono display — defeats the entire aesthetic commitment
- Choosing green AND amber without picking one; the single-color terminal palette is the identity
