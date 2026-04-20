---
id: dyslexia-friendly
category: modern
motion_tier: Subtle
density: sparse
locale_fit: [all]
palette_tags: [light, pastel, earth]
keywords: [dyslexia, reading, accessibility, opendyslexic, atkinson, inclusive, wcag]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Dyslexia-Friendly

**Category:** modern
**Motion tier:** Subtle

~10 % of the global population has some form of dyslexia. Most product UI is
hostile to dyslexic readers: justified text, cold white backgrounds, tight
leading, sans-serifs with mirror-ambiguous letters (b/d, p/q), and
centered-aligned body copy. This style is the opposite — a dyslexia-first
research-backed baseline that still reads as a "real" product, not a
concession.

Research basis: British Dyslexia Association style guide 2024, IBM
Accessibility research 2025, Made by Dyslexia + LinkedIn 2024 study.

## Typography

- **Display font:** **Atkinson Hyperlegible** (Braille Institute, free) —
  disambiguates mirror letters (b/d, p/q), tall ascenders, clearly-cut
  terminals. Designed in partnership with low-vision and reading-disorder readers
- **Body font:** Atkinson Hyperlegible Regular. **18 px minimum** (not 16 —
  dyslexic readers lose re-reading time at smaller sizes)
- **Alternative display:** **OpenDyslexic** — weighted bottoms, very different
  visual character. Use only if the brand can absorb the stylistic cost
- **Tracking:** 0.035em (**wider than typical sans-serif** — the extra
  letter-spacing is the single most researched-validated dyslexia adjustment)
- **Leading:** 1.8 (generous; dyslexic readers re-track to previous lines
  frequently)
- **Feature:** NEVER justify body text. Never center-align paragraph text.
  Always `text-align: start` (logical, left in LTR, right in RTL)

## Colors

- **Background:** `#FFF7E6` (cream / pale yellow — high-contrast black on
  white is the single most reported "makes reading harder" surface across
  dyslexia research). Any of: warm cream, pale blue `#E6F2FF`, pale rose `#FFEEEE`
- **Primary text:** `#1F2937` (dark grey, not black — pure black on cream
  still triggers glare in ~40 % of dyslexic readers; grey-90 is the sweet spot)
- **Primary action:** `#1F3A93` (deep blue — dyslexic-friendly research
  validates blue and green as the lowest-distraction CTA colors)
- **Accent:** `#507A4C` (deep sage)
- **Forbidden:** pure white (`#FFFFFF`) backgrounds, pure black text, red on
  green pairings (color-blindness overlap), yellow CTAs, high-saturation
  gradients, *italic body text* (distorts letter shapes and increases misreads)

## Motion

- **Tier:** Subtle
- **Spring tokens:** `{ bounce: 0, visualDuration: 0.25 }`
- **Enter animation:** opacity only, 200ms. Never translate — position changes
  disrupt spatial re-tracking during reading
- **Micro-interactions:** hover = color shift only, no transform. Focus =
  visible outline only, no transform
- **Auto-advance / carousel:** **forbidden** — dyslexic readers need time
  control over pacing. WCAG 2.2.1 (pause/stop/hide) becomes operationally
  required, not just legally
- **Forbidden:** parallax, scroll-linked scale, rotation, any movement during reading

## Spacing

- **Base grid:** 12px (larger base because generous whitespace reduces
  re-tracking errors)
- **Border-radius vocabulary:** 8px or 12px consistently
- **Measure:** `max-inline-size: 60ch` (tighter than the editorial 66ch — dyslexic
  readers re-track more often; shorter lines reduce the re-track distance)
- **Padding:** 24px+ between paragraphs. Never rely on 1.5× leading alone for
  paragraph separation — dyslexic readers need gap to find the next paragraph
- **Paragraph indent:** NEVER indent paragraphs — use block gaps only. Indents
  create false re-entry points for re-reading

## Code Pattern

```css
:root {
  --dyslexia-bg: #FFF7E6;     /* warm cream */
  --dyslexia-text: #1F2937;   /* grey-90, not black */
  --dyslexia-primary: #1F3A93;
  --dyslexia-sage: #507A4C;
}

body {
  background: var(--dyslexia-bg);
  color: var(--dyslexia-text);
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
  font-size: 18px;
  line-height: 1.8;
  letter-spacing: 0.035em;  /* research-validated */
  text-align: start;        /* logical — left in LTR, right in RTL */
}

.dyslexia-article {
  max-inline-size: 60ch;    /* Baymard: shorter line length for re-tracking */
  margin-inline: auto;
  padding-block: 3rem;
}

.dyslexia-article p {
  margin-block: 1.5rem;     /* generous gap between paragraphs */
  text-indent: 0;           /* never indent — false re-entry points */
}

.dyslexia-article h1,
.dyslexia-article h2,
.dyslexia-article h3 {
  letter-spacing: 0.02em;   /* tighter than body; headings are scanned, not read */
  line-height: 1.3;
}

/* No italic body — distorts letter shapes */
.dyslexia-article em,
.dyslexia-article i {
  font-style: normal;
  font-weight: 700;         /* emphasize by weight instead */
}

/* Links — use underline + color shift, never rely on color alone */
.dyslexia-article a {
  color: var(--dyslexia-primary);
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-thickness: 2px;
}

/* Interactive elements — strong focus, no movement */
button,
a {
  min-block-size: 48px;     /* larger than 44 default */
  min-inline-size: 48px;
  padding-inline: 20px;
  background: var(--dyslexia-primary);
  color: var(--dyslexia-bg);
  border-radius: 8px;
  transition: background 120ms linear;  /* color only — no transform */
}

button:focus-visible,
a:focus-visible {
  outline: 3px solid AccentColor;
  outline-offset: 3px;
}

/* Reduced motion = zero motion */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

## Accessibility

### Contrast
`#1F2937` on `#FFF7E6` = 13.6:1 (WCAG AAA). `#1F3A93` on `#FFF7E6` = 8.1:1
(AAA). APCA Lc ≥ 90 on body. Explicit AAA targets throughout — this style is
operationally AAA even though the frontmatter declares 4.5 as the floor.

### Focus
3px `AccentColor` outline, 3px offset. Dyslexic keyboard users rely on focus
rings disproportionately — never suppress.

### Motion
All animation gated on `prefers-reduced-motion: no-preference` AND opacity-only.
No movement, no transforms, no parallax. The `reduce` branch zeros all of it.

### Touch target
48×48 px default — larger than the 44 standard. Motor-control differences
correlate with dyslexia in some conditions, so the extra 4px matters.

### Text structure
- `<h1>` must exist exactly once per page
- Heading hierarchy must not skip levels
- Use `<strong>` and `<em>` semantically, not for visual emphasis (CSS only)
- Use `<abbr title="...">` for every abbreviation on first occurrence

### RTL / Logical properties
All properties logical (`margin-inline`, `padding-inline`, `inset-inline-*`,
`text-align: start`). Atkinson Hyperlegible supports Latin + Cyrillic + Greek;
pair with Noto Naskh Arabic or Noto Sans Hebrew for RTL languages with the
same spacing adjustments.

## Slop Watch

- Italic body text = blocking defect; distorts letter shapes for dyslexic readers
- Justified text = blocking defect; uneven word spacing is the #1 dyslexia
  barrier in web research
- Centered paragraph text = fail; forces unpredictable left-edge scanning
- Paragraph indents = fail; create false re-entry points
- Pure white background with pure black text = "accessible by default" but
  hostile to dyslexic readers. Use cream/pale-blue/pale-rose
- "Accessibility checker passes" is not sufficient — most checkers do not
  catch justified text, italic body, or sub-1.8 leading; this style is
  opinionated about them
