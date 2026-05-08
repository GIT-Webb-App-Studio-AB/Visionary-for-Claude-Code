---
id: single-typeface
category: typography
css_rules:
  - "Exactly ONE font-family across the entire component"
  - "Fallbacks (system-ui, sans-serif, etc) are permitted but only ONE primary face is named"
  - "All weight, size, and style variation comes from that single face's variable axes (wght, opsz, slnt, etc)"
invariants:
  - "Among all visible text elements, the count of distinct font-family declarations (excluding fallback chain rest) MUST = 1"
conflict_set: ["monospace-headlines", "huge-or-tiny", "display-as-sentence"]
rationale: "Single-typeface design is the most-disciplined typographic pose. It rejects the 'serif headline + sans body' default and forces all hierarchy work into weight, size, tracking, and case. References the editorial tradition (The New Yorker — Adobe Caslon throughout) and contemporary brand identities that commit to one variable face (Linear's Inter, Notion's PP Editorial)."
examples: ["The New Yorker print edition", "Linear marketing 2025 (Inter only)", "Notion 2024 brand refresh (PP Editorial only)"]
---

# single-typeface

One font, repeated. All hierarchy comes from weight, size, tracking, and
case — not from typeface contrast.

## Compliant patterns

```css
:root {
  --font: 'Inter', system-ui, sans-serif;
}
body { font-family: var(--font); }
h1   { font-family: var(--font); font-weight: 800; font-size: 64px; }
h2   { font-family: var(--font); font-weight: 600; font-size: 36px; }
.eyebrow { font-family: var(--font); font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; }
```

## Non-compliant

```css
body { font-family: 'Inter'; }
h1   { font-family: 'Playfair Display'; }   /* second face — banned */
code { font-family: 'JetBrains Mono'; }     /* third face — banned */
```

## Validation

Sample computed `font-family` of every visible text element. Strip the
fallback chain (everything after the first comma). Pass if the set of
distinct primary faces has cardinality = 1.
