---
id: vertical-only
category: typography
css_rules:
  - "At least 1 textblock MUST use writing-mode: vertical-rl OR vertical-lr"
  - "Permitted on headlines, eyebrows, side-labels, navigation rails"
  - "Body copy is exempt — vertical body copy fails accessibility"
invariants:
  - "DOM contains at least 1 element with computed writing-mode in {vertical-rl, vertical-lr, sideways-rl, sideways-lr}"
  - "Element must contain visible text content (text length >= 2 chars)"
conflict_set: ["caps-only", "broken-baselines"]
rationale: "Vertical type breaks the universal horizontal-baseline assumption of Latin script. It signals editorial composition, references East-Asian typesetting, and is a hallmark of magazine-spread design. The pattern is dominant in art-direction-led portfolios and in fashion brand identities (Comme des Garçons, Issey Miyake) where vertical labels signal high-design."
examples: ["Comme des Garçons web 2024 — vertical category labels", "Are.na vertical channel descriptions", "Pentagram for Vitra rebrand 2025"]
---

# vertical-only

At least one textblock rotated to a vertical writing mode. Reference to
Asian typesetting traditions; common in editorial and fashion design.

## Compliant patterns

```css
.side-label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 14px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.section-eyebrow {
  writing-mode: vertical-lr;
}
```

## Non-compliant

A page with all horizontal text — no rotated typography. The constraint
is unambiguous and easy to test.

## Validation

Walk visible text-bearing elements. Pass if at least one has computed
`writing-mode` in {vertical-rl, vertical-lr, sideways-rl, sideways-lr}
AND text content of length ≥ 2.
