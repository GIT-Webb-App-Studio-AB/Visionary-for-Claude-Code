# Legaltech

**Category:** industry
**Motion tier:** Subtle

## Typography
- **Display font:** Libre Baskerville 700
- **Body font:** Libre Baskerville 400
- **Weight range:** 400–700
- **Tracking:** 0.01em display, 0em body (document-reading optimized)
- **Leading:** 1.7 body (legal documents require generous leading for careful reading)

## Colors
- **Background:** #FAFAF8
- **Primary action:** #1A2744 (dark navy — authority without aggression)
- **Accent:** #C8A951 (legal gold — understated, not gaudy)
- **Elevation model:** subtle shadows (0 1px 4px rgba(0,0,0,0.06))

## Motion
- **Tier:** Subtle
- **Spring tokens:** stiffness: 400, damping: 40, mass: 0.9
- **Enter animation:** opacity 0→1, 300ms — deliberate, measured, unhurried
- **Forbidden:** playful bounce, saturated colors near contract text, anything that diminishes perceived gravity

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 2px cards and buttons — minimal rounding signals formality and precision

## Code Pattern
```css
.legal-document-body {
  font-family: 'Libre Baskerville', 'Georgia', serif;
  font-size: 1rem;
  line-height: 1.7;
  color: #1A1A1A;
  max-width: 72ch;
  margin: 0 auto;
}

.legal-section-label {
  font-family: 'Libre Baskerville', serif;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #1A2744;
}

.legal-badge {
  background: #1A2744;
  color: #FFFFFF;
  border-radius: 2px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
```

## Slop Watch
- Switching to a sans-serif for "modern legal" — the serif IS the signal of institutional seriousness; sans reads as a startup trying to look legal
- Using a border-radius above 4px; rounded corners soften authority in a context where authority must be communicated
