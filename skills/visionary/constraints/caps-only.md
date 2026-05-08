---
id: caps-only
category: typography
css_rules:
  - "All headings (h1-h6) MUST be set in UPPER CASE"
  - "Implementation via text-transform: uppercase OR via content-as-uppercase"
  - "Letter-spacing on caps-only headings MUST be >= 0.04em (uppercase without tracking is brutalist-bad)"
invariants:
  - "Every visible h1/h2/h3/h4/h5/h6 has computed text-transform = 'uppercase' OR all-caps content"
  - "AND computed letter-spacing >= 0.04em on those elements"
conflict_set: ["all-italic", "vertical-only", "huge-or-tiny", "text-as-shape"]
rationale: "All-caps headlines are the corporate-but-elevated pose: think Bottega Veneta, The Row, Jil Sander. The style signals authority and restraint, while requiring tracking (≥0.04em) to compensate for the loss of x-height variation that helps reading. The constraint is post-validateable through text-transform + computed letter-spacing."
examples: ["The Row brand identity", "Bottega Veneta web 2024-25", "MoMA exhibition titles"]
---

# caps-only

All headings in uppercase, with deliberate letter-spacing. References
luxury fashion brand identity and museum-exhibition titling.

## Compliant patterns

```css
h1, h2, h3 {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 500;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 12px;
}
```

## Non-compliant

```css
h1 { text-transform: none; }            /* mixed-case — banned */
h2 { text-transform: uppercase; letter-spacing: 0; }  /* tight caps — banned */
```

## Validation

Walk h1-h6 elements. Pass if every element has computed text-transform =
'uppercase' OR text content matches /^[\p{Lu}\p{N}\s\p{P}]+$/u, AND
computed letter-spacing ≥ 0.04em.
