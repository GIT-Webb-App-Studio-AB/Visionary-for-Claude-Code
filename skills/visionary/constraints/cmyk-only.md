---
id: cmyk-only
category: color
css_rules:
  - "Use only the four printer-paint primaries: pure cyan (oklch ~0.78 0.15 196), pure magenta (oklch ~0.66 0.27 0), pure yellow (oklch ~0.97 0.21 105), pure key/black"
  - "Tolerance: each used color must be within 20° hue of one of the CMY centroids OR be pure key (chroma < 0.02 AND lightness < 0.2)"
  - "No mixed shades — no oklch(0.5 0.15 230) blue (which is between C and a generic blue)"
invariants:
  - "Every chromatic color (chroma >= 0.05) used in computed style maps to one of the 4 CMYK primaries within 20deg hue tolerance"
conflict_set: ["single-color", "monochrome-only", "max-3-colors", "complementary-only", "neon-on-black"]
rationale: "CMYK-only invokes the print-shop aesthetic of risograph zines and offset-printed posters. The four-color separation is a hard creative constraint that has produced some of the most distinctive visual identities (Pentagram's CMYK-only branding for various magazines, the Field of Vision documentary identity). The constraint is post-validateable through OKLCH hue-distance to each primary."
examples: ["Pentagram Field of Vision identity 2024", "Eye Magazine 2025 — strict CMYK plates", "Risograph zines on Are.na"]
---

# cmyk-only

The four printer plates: cyan, magenta, yellow, key. Nothing else.
Invokes risograph-zine aesthetics and the offset-poster tradition.

## Compliant patterns

```css
:root {
  --cyan:    oklch(0.78 0.15 196);
  --magenta: oklch(0.66 0.27 0);
  --yellow:  oklch(0.97 0.21 105);
  --key:     oklch(0.18 0    0);
}

.headline { color: var(--cyan); }
.cta      { background: var(--magenta); color: var(--yellow); }
.body     { color: var(--key); }
```

## Non-compliant

```css
.btn { background: oklch(0.65 0.2 250); }  /* blue-violet — not cyan */
.success { color: oklch(0.7 0.18 140); }   /* green — not in CMYK */
```

## Validation

For each chromatic computed color (chroma ≥ 0.05), compute angular hue
distance to each of {196°, 0°, 105°}. Pass if every color is within 20°
of one of those three (plus pure key for blacks).
