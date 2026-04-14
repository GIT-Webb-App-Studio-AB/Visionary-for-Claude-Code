# Japanese Minimalism

**Category:** graphic
**Motion tier:** Subtle

## Typography
- **Display font:** Noto Serif JP — authoritative Japanese serif; correct stroke relationships for kanji
- **Body font:** Noto Sans JP
- **Tracking:** 0.05em (Japanese typography standard) | **Leading:** 1.9 (wide — Ma principle)

## Colors
- **Background:** #FAFAF8 (washi white)
- **Primary action:** #1A1A1A (sumi ink)
- **Accent:** #C0392B (vermillion seal red — used sparingly, single instance)
- **Elevation model:** near-invisible: 0 1px 2px rgba(0,0,0,0.04); shadow implies, not declares

## Motion
- **Tier:** Subtle
- **Spring tokens:** `{ stiffness: 160, damping: 32 }` — deliberate, not lazy
- **Enter animation:** fade 250ms ease-out; 1px Y shift only; no scale
- **Forbidden:** bounce, scale, multi-step animation, decorative motion of any kind

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0–2px; shoji screens and tatami are rectilinear

## Code Pattern
```css
.ma-container {
  padding: 64px 80px; /* extreme whitespace — Ma */
  line-height: 1.9;
  max-width: 640px;
  margin: 0 auto;
}

.ma-container + .ma-container {
  margin-top: 80px; /* negative space as structure */
}
```

## Slop Watch
- Leading below 1.8 for Japanese body text breaks inter-character readability for kanji at body size
- Never use Noto Sans JP weight 700 for body text; heavy sans-serif weight conflicts with the Ma principle of restraint

## Cultural Note
**Ma (間) principle:** Negative space in Japanese aesthetics is not empty — it is structural. Every gap carries meaning. The extreme padding (64–80px) is not generous white space by Western standards; it IS the design. Compression destroys the cultural register.

**Font justification:** Noto Serif JP is specified because it correctly handles the complex stroke relationships in CJK characters. Web-safe Latin serifs (Georgia, Times) do not include CJK glyph sets and will fall back to system fonts that break typographic consistency. Always load the full Noto CJK font via Google Fonts or self-host.

**Vermillion seal:** The accent red is a direct reference to hanko (seal) culture. Use it exactly once per composition — multiple red elements collapse the cultural reference into decoration.
