# Arabic Calligraphic

**Category:** graphic
**Motion tier:** Expressive

## Typography
- **Display font:** Amiri — high-quality Naskh-style Arabic display serif; correct kashida and diacritics
- **Body font:** Noto Naskh Arabic — reliable cross-platform Arabic body text
- **Tracking:** 0em (Arabic typography does not use letter-spacing — it uses kashida extension) | **Leading:** 1.8

## Colors
- **Background:** #FFFDF7 (warm white — parchment reference)
- **Primary action:** #1A472A (deep Islamic green)
- **Accent:** #C9A84C (gold leaf)
- **Elevation model:** warm ambient shadow; no cold drop shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** `{ stiffness: 180, damping: 20 }`
- **Enter animation:** fade + 8px right-to-left slide (respecting reading direction), 280ms ease-out
- **Forbidden:** left-to-right slide animations, cold blue tones, Latin typographic hierarchy patterns

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8–16px; Islamic geometry uses curves alongside rectilinear

## Code Pattern
```css
/* RTL layout — apply at root or component boundary */
[dir="rtl"] .arabic-layout {
  direction: rtl;
  text-align: start; /* respects RTL without hardcoding right */
  unicode-bidi: embed;
}

.arabic-calligraphic-display {
  font-family: 'Amiri', 'Noto Naskh Arabic', serif;
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.8;
  /* letter-spacing intentionally omitted — Arabic uses kashida, not tracking */
}
```

## Slop Watch
- Never apply `letter-spacing` to Arabic text — it breaks the connected letterform system (Arabic letters join). Use `word-spacing` if breath is needed between words
- The enter animation must slide from right to left (RTL reading direction); a left-to-right slide feels like the wrong film direction to Arabic readers

## Cultural Note
**RTL layout requirements:** Arabic is written right-to-left. This requires:
1. `dir="rtl"` on the HTML element or component root
2. `text-align: start` (not `right`) so it adapts with document direction
3. CSS logical properties (`padding-inline-start`, `margin-inline-end`) instead of physical properties
4. Flexbox/Grid with `row-reverse` or logical flow — not manual `float: right`

**Font justification:** Amiri is a high-quality Arabic font designed by Khaled Hosny based on the Bulaq typeface — it correctly handles Arabic typographic rules including contextual letterforms, kashida (tatweel) extensions, and diacritical marks (tashkeel). Noto Naskh Arabic provides broader character coverage for body text. Never use Arial Unicode MS or similar legacy fonts — their Arabic rendering is typographically unacceptable.

**Geometric patterns:** Islamic geometric patterns (girih, arabesque) are widely used decorative elements but are not universally appropriate. When incorporating them, ensure they are abstract patterns from the public domain, not reproductions of specific sacred architectural motifs.
