---
id: monochrome-only
category: color
css_rules:
  - "Every color (background, text, border, fill, stroke) MUST have chroma = 0 in oklch (i.e. pure grayscale)"
  - "Implementation via oklch(L 0 0) or rgb(N N N) or named gray scale, never oklch(L >0 H)"
  - "Image content can include color, but all UI chrome (buttons, cards, type) is monochrome"
invariants:
  - "Sampled across all visible elements, max(chroma) of computed color and background-color < 0.02"
  - "0.02 floor allows for browser sub-pixel rounding in rgb→oklch conversion"
conflict_set: ["single-color", "max-3-colors", "complementary-only", "cmyk-only", "neon-on-black", "signal-on-noise"]
rationale: "Removing color removes the most-used differentiation tool, leaving only typography, weight, and space to carry hierarchy. Designers who can compose in pure grayscale demonstrate they understand value-and-form before they reach for accent-color. Editorial print and high-end fashion adopt monochrome to signal restraint."
examples: ["Apple's print marketing 2024 (Vision Pro reveal)", "Issey Miyake 2025 web identity", "ProPublica long-form pieces"]
---

# monochrome-only

Pure grayscale. No hue, anywhere in the chrome. Makes typography and
spacing carry the entire information hierarchy.

## Compliant patterns

```css
:root {
  --gray-0:   oklch(1.00 0 0);
  --gray-50:  oklch(0.97 0 0);
  --gray-200: oklch(0.85 0 0);
  --gray-500: oklch(0.55 0 0);
  --gray-900: oklch(0.18 0 0);
}

.btn { background: var(--gray-900); color: var(--gray-0); }
.link { color: var(--gray-500); text-decoration: underline; }
```

## Non-compliant

A "mostly grayscale" design with a blue link or red error: violates —
chroma > 0.02 detected.

## Validation

Sample computed `color`, `background-color`, `border-color` of every
visible element. Convert to OKLCH. Pass if max chroma across all samples
< 0.02.
