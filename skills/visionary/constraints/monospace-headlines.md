---
id: monospace-headlines
category: typography
css_rules:
  - "All h1, h2, h3 elements MUST use a monospaced font-family (one where every character has identical advance width)"
  - "Acceptable monospaced families: 'JetBrains Mono', 'IBM Plex Mono', 'Berkeley Mono', 'Geist Mono', 'IosevkaTerm'"
  - "Body copy can be any font; the constraint applies only to display-level type"
invariants:
  - "Every h1/h2/h3 element MUST resolve computed font-family to a recognized monospace face"
  - "Detection via font-feature: pnum/tnum is too lossy; instead match against a known-monospace whitelist"
conflict_set: ["all-italic", "huge-or-tiny", "display-as-sentence", "single-typeface"]
rationale: "Monospaced headlines are the developer-tool aesthetic that has crossed into mainstream design (Linear, Vercel, Railway, Resend). The format signals technical authenticity and rejects the editorial-magazine default of variable-width serifs/sans. The constraint isn't about readability (monospaced is harder to read) but about visual signature."
examples: ["Vercel 2025 marketing (Geist Mono for headlines)", "Linear 2025 (IBM Plex Mono accents)", "Railway 2024 — full Berkeley Mono"]
---

# monospace-headlines

All display type uses monospaced fonts. Body copy is unconstrained. The
look is unmistakably developer-tool, terminal-adjacent.

## Compliant patterns

```css
h1, h2, h3 { font-family: 'Berkeley Mono', 'JetBrains Mono', monospace; }
body { font-family: 'Inter', system-ui, sans-serif; }
```

## Non-compliant

```css
h1 { font-family: 'Playfair Display', serif; }  /* not mono */
h2 { font-family: 'Inter', sans-serif; }        /* not mono */
```

## Validation

Walk h1/h2/h3 elements. Read computed font-family. Strip fallback chain
to first family name. Pass if every primary family is in the
known-monospace whitelist.
