# Zen Void

**Category:** emotional
**Motion tier:** Subtle

## Typography
- **Display font:** Libre Baskerville 300–400 (light weight signals restraint)
- **Body font:** Libre Baskerville 400
- **Weight range:** 300–400 (intentionally narrow — weight is drama, and this style refuses drama)
- **Tracking:** 0.04em body (open tracking for breath)
- **Leading:** 1.9 body (maximum breath between lines — the space is the content)

## Colors
- **Background:** #FAFAF8 (almost white — not clinical, not warm, just present) or #1A1A18 (dark mode)
- **Primary action:** #1A1A18 (dark) or #FAFAF8 (light)
- **Accent:** none — accent colors introduce desire; zen has no desire
- **Elevation model:** none — z-index is ego; zen has no ego

## Motion
- **Tier:** Subtle (near-invisible)
- **Spring tokens:** stiffness: 80, damping: 35, mass: 2.0 (slowest possible spring)
- **Enter animation:** opacity 0→1 over 1200ms — disappear and appear, no positional movement
- **Forbidden:** bounce, scale animations, fast anything, color changes on interaction

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px or 2px — minimal, not designed

## Code Pattern
```css
.zen-section {
  padding: 120px 0;
  max-width: 680px;
  margin: 0 auto;
}

.zen-body {
  font-family: 'Libre Baskerville', 'Georgia', serif;
  font-size: 1.125rem;
  font-weight: 400;
  line-height: 1.9;
  letter-spacing: 0.04em;
  color: rgba(26, 26, 24, 0.75);
}

.zen-headline {
  font-family: 'Libre Baskerville', 'Georgia', serif;
  font-size: 2rem;
  font-weight: 300;
  line-height: 1.3;
  letter-spacing: 0.04em;
  margin-bottom: 48px;
}

.zen-divider {
  width: 32px;
  height: 1px;
  background: currentColor;
  opacity: 0.2;
  margin: 64px auto;
}
```

## Slop Watch
- Reducing section padding below 80px; the whitespace IS the content — a compressed zen layout reads as unfinished, not restrained
- Adding any interactive hover effect beyond a barely-visible opacity shift; zen has no reward for seeking
