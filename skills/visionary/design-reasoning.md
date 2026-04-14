# Design Reasoning Brief

Constructs the Design Reasoning Brief that is shown to the user BEFORE code generation.

## Purpose

The brief surfaces the inference for user verification. The user can redirect before any code is written. This eliminates wasted generation cycles and builds trust in the tool.

## Brief Template

```
Design Reasoning Brief
─────────────────────
Product type:    [detected product category]
Audience:        [detected audience description]
Brand archetype: [matched archetype]
Tone:            [detected tone descriptors]
Content density: [sparse / balanced / dense]

Locale:          [lang] — [script] — [sample chars, e.g. "å ä ö"]
Font subset:     [e.g. "latin,latin-ext"]

Inferred style:  [style_id from styles/_index.md]
Secondary style: [optional blend style — omit if single style]
DNA ratio:       [e.g. "70% primary / 30% secondary" — omit if single]
Transplant?:     [if using a style from a different domain, explain WHY it works here]

Typography:      [Display font] + [Body font] — [confirm script support]
Accent:          [hex value] — [rationale]
Motion:          [tier] — [specific rationale, e.g. "financial data — no decorative animation"]
Grid:            [base unit]px base — [spacing descriptor]
```

## Decision Logic

### Typography Selection
1. Match archetype → consult `typography-matrix.md` for font pairings
2. Check contrast: display font must be ≥ 4.5:1 against intended background
3. Confirm Google Fonts availability or system font fallback

### Motion Level Selection
- Level 0 (static): Medical, legal, government, accessibility-critical contexts
- Level 1 (subtle): Finance, B2B SaaS, enterprise dashboards, healthcare wellness
- Level 2 (expressive): Consumer apps, marketing sites, portfolios, e-commerce
- Level 3 (kinetic): Entertainment, gaming, creative tools, social platforms

### Color Palette Rules
- Background must be ≥ 4.5:1 contrast with primary text (WCAG 1.4.3)
- Accent color must pass ≥ 3:1 against background (WCAG UI components)
- Never use more than 3 brand colors + 2 neutral tones
- Dark mode: invert lightness, not hue

## Ambiguity Handling

Show the brief when:
- Prompt is < 8 words
- Product type is ambiguous (multiple valid interpretations)
- Two styles would score within 15% of each other

Skip the brief when:
- Prompt explicitly names a style ("build a Bento Grid dashboard")
- Context is crystal clear and single-interpretation
- User has already confirmed a style in this session
