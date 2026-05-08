---
id: single-color
category: color
css_rules:
  - "Pick exactly ONE non-neutral hue (e.g. one specific blue, OR one specific red, OR one specific magenta)"
  - "All chromatic surfaces, text, fills, and accents use that hue at varying lightness/chroma"
  - "Permitted neutrals: pure white (#fff / oklch(1 0 0)) AND pure black (#000 / oklch(0 0 0)) AND a single grayscale axis"
invariants:
  - "Number of distinct hue-bins (in 12-bin oklch hue space, i.e. 30deg per bin) used by visible elements MUST be <= 1, excluding neutrals (chroma < 0.02)"
  - "Detected by sampling computed background-color and color of every visible element with non-zero alpha"
conflict_set: ["max-3-colors", "complementary-only", "cmyk-only", "no-gradients"]
rationale: "Limiting to one hue produces visceral coherence. The eye reads it as a brand commitment, not a designer hedge. Common in editorial monogram-aesthetic identities (Mailchimp's yellow, Glossier's pink, Klarna's pink). The constraint is post-validateable through hue-binning of computed colors, so 'mostly blue' designs can't slip a different blue accent past the gate."
examples: ["Klarna pink 2025", "Mailchimp yellow brand 2024", "Bottega Veneta web 2024 — single green throughout"]
---

# single-color

One hue. Variation through lightness and chroma alone. Neutrals (white,
black, grayscale axis) are exempt.

## Compliant patterns

```css
:root {
  --hue: 250;                           /* picked: blue-violet */
  --color-50:  oklch(0.97 0.02 var(--hue));
  --color-200: oklch(0.85 0.06 var(--hue));
  --color-500: oklch(0.65 0.20 var(--hue));
  --color-800: oklch(0.30 0.18 var(--hue));
}
```

## Non-compliant

A page with a blue button AND a green success badge AND a red error chip
violates — three hues, not one.

## Validation

Sample computed `color` and `background-color` of every visible element.
Convert each to OKLCH. Bin by hue (30°/bin → 12 bins). Filter out neutrals
(chroma < 0.02). Pass if number of distinct hue-bins ≤ 1.
