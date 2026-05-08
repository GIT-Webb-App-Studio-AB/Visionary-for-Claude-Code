---
id: signal-on-noise
category: color
css_rules:
  - "ALL surfaces, type, and chrome MUST be desaturated (chroma < 0.05) — except for ONE element which is fully saturated (chroma >= 0.18)"
  - "The saturated element acts as the visual signal in a sea of noise"
  - "Permitted: multiple instances of the same saturated color, but no second saturated hue"
invariants:
  - "Among all visible chromatic elements, at most ONE distinct hue-bin has chroma >= 0.18"
  - "All other visible chromatic elements have chroma < 0.05"
conflict_set: ["max-3-colors", "complementary-only", "cmyk-only", "neon-on-black"]
rationale: "Information theory's signal-to-noise applied to color. When the entire palette is desaturated and ONE accent jumps out at full saturation, the eye's chromatic-aberration system fixes on the accent immediately. Common in late-2010s editorial design (NYT's tomato-red call-outs against grayscale photography), and in contemporary fintech that wants to look serious-with-personality (Klarna's pink button on monochrome, Stripe's purple CTA against gray copy)."
examples: ["NYT interactive features 2023-25", "Stripe checkout flow — single purple in monochrome chrome", "Are.na block highlights"]
---

# signal-on-noise

A desaturated visual field with one fully-saturated accent. The accent
is the signal; everything else is noise.

## Compliant patterns

```css
:root {
  --neutral-50:  oklch(0.97 0 0);
  --neutral-200: oklch(0.85 0 0);
  --neutral-700: oklch(0.35 0 0);
  --neutral-900: oklch(0.18 0 0);
  --signal:      oklch(0.65 0.22 25);  /* one saturated red-orange */
}

body { background: var(--neutral-50); color: var(--neutral-900); }
.cta { background: var(--signal); color: white; }
.cta-secondary { color: var(--signal); border: 1px solid currentColor; }
.divider { background: var(--neutral-200); }
```

## Non-compliant

A "muted" palette with a saturated red error AND a saturated green
success: violates — two saturated hue-bins, not one.

## Validation

Sample all chromatic colors. Bin by hue. Count bins with chroma ≥ 0.18.
Pass if count ≤ 1 AND all other chromatic samples have chroma < 0.05.
