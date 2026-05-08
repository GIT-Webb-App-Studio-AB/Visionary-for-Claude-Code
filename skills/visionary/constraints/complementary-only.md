---
id: complementary-only
category: color
css_rules:
  - "Use exactly 2 hues that sit 180° apart on the OKLCH hue wheel (e.g. blue-orange, red-cyan, purple-yellow)"
  - "Tolerance: ±15° from exact complement"
  - "Neutrals exempt; lightness/chroma variation within each hue permitted"
invariants:
  - "Distinct-hue count (30deg bins) excluding neutrals MUST = 2"
  - "AND the angular distance between the two hue means MUST be in [165deg, 195deg]"
conflict_set: ["single-color", "monochrome-only", "max-3-colors", "cmyk-only"]
rationale: "Complementary pairs maximize chromatic tension and produce the highest-contrast color compositions short of pure black-and-white. The pattern is dominant in poster design (Saul Bass, Paul Rand) and in '60s op-art. Forcing complement-only rejects both monochrome safety and the 5-color brand-system drift, landing on a deliberately confrontational palette."
examples: ["Paul Rand IBM posters (blue-orange)", "Saul Bass Anatomy of a Murder (orange-magenta — near-complement)", "early Spotify identity (green-magenta)"]
---

# complementary-only

Exactly two hues, 180° apart on the color wheel. Maximum chromatic
tension. References the poster-design tradition where hue-pairs carry
the entire mood.

## Compliant patterns

```css
:root {
  --hue-a: 250;          /* blue */
  --hue-b: 70;           /* yellow-orange (= 250 + 180) */

  --a-500: oklch(0.65 0.20 var(--hue-a));
  --a-100: oklch(0.95 0.05 var(--hue-a));
  --b-500: oklch(0.75 0.18 var(--hue-b));
  --b-100: oklch(0.96 0.04 var(--hue-b));
}
```

## Non-compliant

```css
.btn-a { color: oklch(0.65 0.2 250); }  /* blue */
.btn-b { color: oklch(0.65 0.2 30); }   /* orange — only 140° away, NOT complement */
```

## Validation

Bin all chromatic colors into 30° hue bins. Pass if distinct bin count = 2
AND the angular distance between bin centroids is in [165°, 195°].
