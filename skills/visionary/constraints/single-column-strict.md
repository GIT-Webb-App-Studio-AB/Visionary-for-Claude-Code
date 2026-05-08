---
id: single-column-strict
category: layout
css_rules:
  - "ZERO use of grid-template-columns with more than 1 column"
  - "ZERO use of flex-direction: row OR display: flex with multiple horizontal children at the section level"
  - "All content stacks vertically, full-width within its container"
  - "Exception: micro-flex inside leaf components (e.g. icon + label inside a single button) — only top-level layout is constrained"
invariants:
  - "Top-level sections have computed grid-template-columns either 'none' or '1fr' (single column)"
  - "Top-level flex containers either have flex-direction: column OR contain ≤ 1 visible flex child"
conflict_set: ["broken-grid", "every-section-breaks-grid", "asymmetry-only", "negative-margin-mandatory"]
rationale: "Forcing a strict single-column layout invokes the long-form-essay aesthetic: ProPublica, The Atlantic, Are.na's reading mode. The constraint rejects the default dashboard / multi-column / sidebar pattern in favor of a unified vertical reading flow. Reads as deliberate slowness, opposite of the 'cram more above the fold' instinct."
examples: ["Are.na reading mode 2025", "Substack post pages 2024", "Eat Sleep Magazine essay layout"]
---

# single-column-strict

A pure vertical stack. No horizontal layout above the leaf-component
level. Reads as long-form essay or reader mode.

## Compliant patterns

```css
.page > section {
  display: block;
  inline-size: min(720px, 100% - 32px);
  margin-inline: auto;
}

.section > * {
  margin-block-end: 32px;
}
```

## Non-compliant

```css
.section { display: grid; grid-template-columns: 1fr 2fr; }    /* multi-col */
.section { display: flex; flex-direction: row; }                /* horizontal */
```

## Validation

Walk top-level sections. Pass if every section has computed
`grid-template-columns` of 'none' or '1fr', AND any flex containers
have `flex-direction: column` OR ≤ 1 visible flex child.
