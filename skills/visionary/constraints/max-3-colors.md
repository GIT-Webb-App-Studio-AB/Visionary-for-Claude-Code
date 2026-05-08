---
id: max-3-colors
category: color
css_rules:
  - "Use at most 3 distinct hues across ALL chromatic surfaces"
  - "Lightness/chroma variation within each hue is permitted (oklch(L C H) where H is fixed for that hue family)"
  - "Neutrals (white, black, grayscale) are exempt from the count"
invariants:
  - "Number of distinct 30deg hue-bins (excluding neutral chroma < 0.02) used by visible elements MUST be <= 3"
conflict_set: ["single-color", "monochrome-only", "complementary-only"]
rationale: "Three is the canonical bauhaus-poster palette — primary + supporting + accent. The constraint forces hierarchy: which hue carries information, which carries surface, which carries warning. Designs that drift into 'whatever the framework's color palette gives me' easily land at 8-12 hues, which produces the slop pattern of 'every status has its own color, with no system'."
examples: ["Bauhaus Dessau posters — 3-color rule", "Stripe brand 2025 (purple, navy, charcoal)", "Linear marketing 2025 (purple, slate, white)"]
---

# max-3-colors

A 3-hue ceiling. Each hue can have any number of lightness/chroma steps,
but no fourth hue is permitted in the chrome.

## Compliant patterns

```css
:root {
  --hue-primary:   250;  /* blue-violet */
  --hue-warm:       30;  /* warm amber */
  --hue-success:  140;  /* green */

  --primary:   oklch(0.65 0.20 var(--hue-primary));
  --primary-bg: oklch(0.95 0.04 var(--hue-primary));
  --warning:   oklch(0.75 0.15 var(--hue-warm));
  --success:   oklch(0.65 0.18 var(--hue-success));
}
```

## Non-compliant

A page using purple, blue, green, red, orange, yellow simultaneously
violates — six hue-bins exceeds the cap of 3.

## Validation

Sample all visible elements' colors. Convert to OKLCH. Bin by 30° hue.
Filter out neutrals (chroma < 0.02). Pass if distinct-bin-count ≤ 3.
