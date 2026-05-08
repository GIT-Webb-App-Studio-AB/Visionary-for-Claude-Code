---
id: all-italic
category: typography
css_rules:
  - "Every text element MUST have computed font-style = italic OR oblique"
  - "Implementation via font-style: italic on body, OR via choosing a face that is intrinsically italic (e.g. Recoleta Italic as the only loaded face)"
  - "Permitted: italic + bold combinations; italic small caps"
invariants:
  - "Among all visible text elements, EVERY element has computed font-style != 'normal'"
conflict_set: ["monospace-headlines", "caps-only"]
rationale: "Universal italic is rare and immediately recognizable — the eye expects italic to be a discreet emphasis device. Making the entire layout italic inverts that hierarchy and produces a hand-written, intimate, almost letter-form-as-handwriting feeling. Common in editorial fashion (Vogue Paris's italic-only issues), in indie publishing, and in deliberately romantic luxury identities."
examples: ["Vogue Paris italic-only issue 2024", "The Gentlewoman editorial sections", "Aesop product descriptions in italic Garamond"]
---

# all-italic

Every text element is italic. Inverts the convention that italic is for
emphasis only — when everything is italic, the page reads as one
continuous handwritten thought.

## Compliant patterns

```css
body { font-style: italic; }
h1, h2, h3 { font-style: italic; }
strong { font-style: italic; font-weight: 700; }
em { font-style: italic; }  /* still italic, just bolder */
```

## Non-compliant

```css
body { font-style: normal; }
em   { font-style: italic; }   /* only emphasis is italic — banned */
```

## Validation

Walk all visible text elements. Pass if computed `font-style` of every
element is either `italic` or `oblique`.
