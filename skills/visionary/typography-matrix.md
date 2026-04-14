# Typography Matrix

Font pairings for all 12 brand archetypes and major style categories.

## Archetype → Font Pairing

| Archetype | Display Font | Body Font | Mono Font | Tracking (display) |
|-----------|-------------|-----------|-----------|-------------------|
| Ruler | DM Serif Display | DM Sans | JetBrains Mono | -0.02em |
| Sage | Playfair Display | Source Serif 4 | Space Mono | -0.01em |
| Explorer | Fraunces | Manrope | Monaspace Neon | -0.01em |
| Creator | Bricolage Grotesque | Nunito | Space Mono | 0em |
| Innocent | Manrope Light | Manrope | — | 0.01em |
| Hero | Syne Bold | Syne | — | 0.04em |
| Caregiver | Chillax | Plus Jakarta Sans | — | -0.005em |
| Jester | Cabinet Grotesk | Cabinet Grotesk | — | -0.03em |
| Lover | Cormorant Garamond | Lato | — | 0.02em |
| Outlaw | Syne ExtraBold | Syne | Space Mono | 0.06em |
| Magician | Space Grotesk | Inter | JetBrains Mono | 0em |
| Everyman | Plus Jakarta Sans | Plus Jakarta Sans | — | 0em |

## CJK Script Requirements

| Script | Display Font | Body Font | Notes |
|--------|-------------|-----------|-------|
| Japanese (CJK JP) | Noto Serif JP | Noto Sans JP | Leading ≥ 1.9 for Ma principle |
| Korean (Hangul) | Pretendard | Noto Sans KR | Never substitute JP fonts |
| Chinese Simplified | Noto Serif SC | Noto Sans SC | GB18030 character set |
| Chinese Traditional | Noto Serif TC | Noto Sans TC | Different from SC glyphs |
| Arabic (RTL) | Amiri | Noto Naskh Arabic | No letter-spacing on Arabic |
| Devanagari | Noto Sans Devanagari | Poppins | Leading ≥ 1.75 for matras |

## Google Fonts Subset Requirements

**Every Google Fonts URL must include the correct subset parameter for the target language.**

### Subset by Script

| Script | Required subset | Example languages |
|--------|----------------|-------------------|
| Latin (basic) | `latin` | English |
| Latin Extended | `latin,latin-ext` | Swedish, Finnish, Norwegian, Danish, German, French, Spanish, Portuguese, Polish, Czech, Turkish, Romanian, Icelandic, Hungarian, Croatian |
| Cyrillic | `cyrillic,cyrillic-ext` | Russian, Ukrainian, Bulgarian, Serbian |
| Greek | `greek,greek-ext` | Greek |
| Vietnamese | `latin,latin-ext,vietnamese` | Vietnamese |

### URL Format
```
CORRECT:
https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap&subset=latin,latin-ext
https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap&subset=latin,latin-ext

WRONG (missing subset — å ä ö will render in fallback font):
https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap
```

### Font Script Support Matrix

Most Google Fonts support `latin-ext`. These popular display fonts are **confirmed** to support Nordic characters (å ä ö):

| Font | latin-ext | cyrillic | Notes |
|------|-----------|----------|-------|
| DM Serif Display | Yes | No | |
| Space Grotesk | Yes | Yes | |
| Libre Baskerville | Yes | No | |
| Bebas Neue | Yes | No | |
| Playfair Display | Yes | Yes | |
| Fraunces | Yes | No | |
| DM Sans | Yes | No | |
| Inter | Yes | Yes | |
| Plus Jakarta Sans | Yes | No | |
| Syne | Yes | No | |
| JetBrains Mono | Yes | Yes | |
| Source Serif 4 | Yes | Yes | |
| Manrope | Yes | Yes | |
| Cabinet Grotesk | Yes | No | |

For CJK and Arabic scripts, see the "CJK Script Requirements" section below.

## Scale System

```css
/* 8-level type scale (Major Third — 1.25 ratio) */
--text-xs:   0.64rem;   /* 10.24px — captions, labels */
--text-sm:   0.8rem;    /* 12.8px  — secondary body */
--text-base: 1rem;      /* 16px    — body text */
--text-lg:   1.25rem;   /* 20px    — lead text */
--text-xl:   1.563rem;  /* 25px    — small heading */
--text-2xl:  1.953rem;  /* 31px    — section heading */
--text-3xl:  2.441rem;  /* 39px    — page heading */
--text-4xl:  3.052rem;  /* 49px    — display / hero */
```

## Weight Vocabulary

- **100–300**: Light — luxury, minimalist, typographic-led styles
- **400**: Regular — body text universally
- **500–600**: Medium/SemiBold — navigation, labels, callouts
- **700**: Bold — section headings, emphasis
- **800–900**: ExtraBold/Black — display headlines, hero type

## Variable Font Axes

```css
/* Fraunces — optical size + weight + softness */
font-variation-settings: "opsz" 144, "wght" 700, "SOFT" 50, "WONK" 0;

/* Inter — weight + slant */
font-variation-settings: "wght" 400, "slnt" 0;
```
