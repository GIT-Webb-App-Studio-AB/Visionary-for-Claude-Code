---
id: display-as-sentence
category: typography
css_rules:
  - "Body text MUST use a font that is intrinsically a display face (high contrast, decorative, normally reserved for headlines): Playfair Display, Recoleta, PP Editorial New, Canela, GT Sectra"
  - "Permitted weights: any, but the face must be a display face per its design intent"
  - "No body-text-optimized faces (Inter, Source Sans, Roboto, Helvetica)"
invariants:
  - "Body text element computed font-family resolves to a known-display whitelist"
conflict_set: ["monospace-headlines", "single-typeface", "huge-or-tiny"]
rationale: "Using a display face for body text is the magazine-feature aesthetic — the long-form profile piece in Vanity Fair where every paragraph is set in Bodoni. The pattern is explicitly inefficient (display faces fatigue the reader at small sizes) which is precisely why it signals editorial commitment over UX-research compromise."
examples: ["Vanity Fair feature pages (Bodoni body)", "Aperture monograph essays (Lyon body)", "Apartamento Magazine 2024 — full Caslon throughout"]
---

# display-as-sentence

Body text typeset in a face designed for display use. Reference to
magazine-feature typography where every paragraph carries the weight
of a headline.

## Compliant patterns

```css
:root {
  --font-display: 'PP Editorial New', 'Playfair Display', serif;
}
body { font-family: var(--font-display); font-size: 18px; line-height: 1.5; }
h1   { font-family: var(--font-display); font-size: 48px; }
```

## Non-compliant

```css
body { font-family: 'Inter', sans-serif; }   /* utility face — banned */
```

## Validation

Read the body or paragraph-element font-family. Strip fallback chain.
Pass if the primary face is in the known-display whitelist (Playfair
Display, Recoleta, PP Editorial New, Canela, GT Sectra, Lyon, Bodoni,
Caslon, Garamond — known display/editorial faces).
