---
id: broken-baselines
category: typography
css_rules:
  - "Within a single section/heading, multiple text elements MUST sit on different vertical baselines"
  - "Implementation via transform: translateY(...) on individual word/letter spans, varying margins, or position: relative + top offsets"
  - "The visual effect is text that appears 'jumbled' or 'rhythmic-irregular' — no unified flat baseline"
invariants:
  - "Within at least one section, at least 3 text elements have distinct computed vertical positions (transform translateY values OR top offsets) varying by >= 8px"
conflict_set: ["pixel-perfect-grid", "swiss-rationalism-strict", "vertical-only"]
rationale: "Broken baselines is the editorial-experimental move where headline words sit at different heights, creating visual rhythm and acknowledging that text is matter, not metadata. Pioneered by David Carson in Ray Gun, repopularized by contemporary art-direction-driven web design. Forces the generator to reject the safe single-line headline."
examples: ["David Carson — Ray Gun 1995-99 (origin)", "Pentagram Mozilla rebrand 2024", "Slowed.tv typography experiments 2025"]
---

# broken-baselines

Multiple text elements within the same section sit on different
baselines. Reference to Carson-era experimental editorial design.

## Compliant patterns

```css
.headline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2em;
}
.headline > .word:nth-child(1) { transform: translateY(0); }
.headline > .word:nth-child(2) { transform: translateY(-0.2em); }
.headline > .word:nth-child(3) { transform: translateY(0.15em); }
.headline > .word:nth-child(4) { transform: translateY(-0.1em); }
```

## Non-compliant

```html
<h1>The Future of Design</h1>   <!-- single baseline, banned -->
```

## Validation

Walk text elements (or word-spans) within each section. Read computed
vertical position (top + translateY). Pass if at least one section has
≥ 3 text elements differing by ≥ 8px in vertical position.
