# Visual Critique Schema

Reference document for the visual-critic subagent. Loaded during Stage 4 of the
visionary pipeline. Defines the loop flow, 8-dimension scoring rubric, JSON output
format, and 25 design slop detection patterns.

---

## Loop Flow

```
Claude writes component file
        ↓
PostToolUse hook fires (matcher: "Write|Edit|MultiEdit")
        ↓
capture-and-critique.sh runs
        ↓
[Safety checks]
  • File extension is .tsx/.vue/.svelte/.html? → proceed
  • Screenshot > 5MB? → skip (GitHub issue #27611 infinite retry bug)
  • Magic bytes check: valid PNG header (89 50 4E 47)? → proceed
        ↓
Playwright MCP: browser_navigate → browser_take_screenshot (min 1200px, headless)
        ↓
visual-critic subagent receives screenshot + original brief
        ↓
8-dimension critique JSON + bounding box issues returned
        ↓
Score ≥ 4.0 average OR round 3 reached → done
Score < 4.0 → additionalContext injected (≤10,000 chars) → Claude applies top_3_fixes
        ↓
Round 2 score < Round 1 score? → convergence_signal: true → loop stops immediately
```

---

## 8-Dimension Scoring Rubric

Each dimension is scored **1–5** (1 = severe problem, 5 = excellent).
The `overall_score` is the arithmetic mean of all 8 scores, rounded to one decimal place.

| Dimension | What Is Scored | Score 1 | Score 5 |
|-----------|---------------|---------|---------|
| `visual_hierarchy` | Primary action draws the eye first; information has clear weight gradient | All elements same visual weight; CTA competes with nav | Immediate eye path: hero → CTA → supporting info |
| `layout_integrity` | Grid holds at all standard viewport widths (375px, 768px, 1280px, 1440px) | Layout breaks or overflows at tested widths | Responsive grid intact; no overflow or collision |
| `typography` | Typeface pairing is distinctive; size scale creates clear hierarchy | Inter or Roboto as sole face; scale too uniform | Curated pairing; display + text faces; clear step scale |
| `color_contrast` | WCAG 2.2 AA: body text ≥ 4.5:1, large text ≥ 3:1, UI components ≥ 3:1 | Multiple contrast failures; text illegible | All ratios pass; sufficient separation between zones |
| `design_distinctiveness` | Output avoids generic AI aesthetics; style has a point of view | AI-slop: uniform radius, Tailwind defaults, stock icons | Deliberate, non-template aesthetic; recognizable style |
| `brief_conformance` | Generated component matches the user's stated layout and feature request | Core layout or feature missing | All requested elements present in correct structure |
| `accessibility` | `:focus-visible` present; touch targets ≥ 24×24px; `prefers-reduced-motion` respected | No focus states; sub-minimum touch targets; no reduced-motion | Full keyboard nav; compliant targets; safe motion fallbacks |
| `motion_readiness` | Entry animations defined; spring/easing tokens used; motion is purposeful | No animation primitives; no motion tokens; static shell | Entry variants, micro-interactions, and exit states all defined |

---

## JSON Output Format

The visual-critic subagent must return this exact structure. No additional keys.
Total JSON must not exceed 10,000 characters — truncate `bounding_box_issues` array
(from the end) if the limit is approached.

```json
{
  "meta": {
    "round": 1,
    "overall_score": 2.8,
    "convergence_signal": false
  },
  "scores": {
    "visual_hierarchy":       { "score": 3, "rationale": "CTA competes with nav for attention" },
    "layout_integrity":       { "score": 3, "rationale": "Grid breaks at 1280px viewport" },
    "typography":             { "score": 2, "rationale": "Inter detected as sole typeface — generic" },
    "color_contrast":         { "score": 4, "rationale": "WCAG 2.2 AA passes (4.7:1)" },
    "design_distinctiveness": { "score": 2, "rationale": "AI-slop: uniform 8px radius, blue primary" },
    "brief_conformance":      { "score": 4, "rationale": "Dashboard layout matches request" },
    "accessibility":          { "score": 3, "rationale": "Missing :focus-visible, 18px touch targets" },
    "motion_readiness":       { "score": 2, "rationale": "No entry animations, no prefers-reduced-motion" }
  },
  "bounding_box_issues": [
    {
      "region": "top-right CTA",
      "issue": "Too small for primary action — visually equal to secondary nav items",
      "fix": "Increase font-size to step-1, add prominent background fill"
    }
  ],
  "design_slop_flags": [
    "Inter font as sole typeface",
    "Blue primary #3B82F6 (Tailwind default)",
    "Uniform 8px border-radius on all elements",
    "shadow-md applied uniformly"
  ],
  "top_3_fixes": [
    "Replace Inter with Bricolage Grotesque (display) + Instrument Sans (body)",
    "Vary border-radius: cards 2px, buttons 999px, inputs 6px",
    "Add motion.div entry variants with spring.ui transition on card components"
  ]
}
```

### Field Definitions

- `meta.round` — which iteration this is (1, 2, or 3)
- `meta.overall_score` — arithmetic mean of all 8 `score` values
- `meta.convergence_signal` — set `true` if round N score < round N-1 score (loop is diverging, stop immediately)
- `scores[dimension].score` — integer 1–5
- `scores[dimension].rationale` — one sentence, specific to what appears in the screenshot
- `bounding_box_issues` — regions with layout or sizing problems; include only if identifiable
- `design_slop_flags` — patterns detected in this screenshot (see slop list below)
- `top_3_fixes` — the three highest-impact changes Claude should apply next; ordered by impact

---

## 25 Design Slop Patterns

These are the AI-generated-UI antipatterns the critique system detects and flags.
Patterns 1–20 are **deterministic** — detected by regex/AST analysis in the shell script
before even taking a screenshot. Patterns 21–25 require **LLM vision analysis** by the
visual-critic subagent against the screenshot.

### Deterministic (checked in capture-and-critique.sh)

| # | Pattern | Detection Signal |
|---|---------|----------------|
| 1 | Purple/violet gradient backgrounds | `from-purple` / `from-violet` + `to-` gradient classes or CSS |
| 2 | Cyan-on-dark color scheme | `text-cyan` or `#06B6D4` against dark background |
| 3 | Left-border accent card | Single-side `border-l-4` or `border-left: 4px solid` with no other borders |
| 4 | Dark background + colored box-shadow glow | `bg-gray-900` or `bg-zinc-900` + `shadow` with color value |
| 5 | Gradient text on headings or metric numbers | `bg-clip-text text-transparent bg-gradient` on heading/metric |
| 6 | Hero Metric Layout | Large `text-4xl`+ number + `text-sm` label + gradient accent in same block |
| 7 | Repeated 3-across card grid with identical dimensions | Three `className="...card..."` siblings with identical `w-` or `flex-1` |
| 8 | Cards nested inside cards (excessive depth) | `.card` inside `.card` inside `.card` (depth ≥ 3) |
| 9 | Inter as sole typeface | `font-family: 'Inter'` or `fontFamily: 'Inter'` with no secondary face |
| 10 | Roboto / Arial / Open Sans as sole typeface | Same detection as #9 for Roboto, Arial, Open Sans |
| 11 | Default Tailwind blue #3B82F6 as primary | `bg-blue-500` or `#3B82F6` in primary button or accent |
| 12 | Default Tailwind purple #6366F1 as primary | `bg-indigo-500` or `#6366F1` as primary action color |
| 13 | Default Tailwind green #10B981 as accent | `text-emerald-500` or `#10B981` as success/accent |
| 14 | Uniform border-radius across all elements | Single `rounded-lg` or `rounded-md` applied to all interactive elements |
| 15 | shadow-md applied to all cards uniformly | `shadow-md` on every card element with no variation |
| 16 | Centered hero with gradient backdrop and floating cards | Hero `text-center` + gradient bg + `absolute` positioned card children |
| 17 | Three-column icon + heading + paragraph feature section | Three siblings each containing `<Icon>` + `<h3>` + `<p>` |
| 18 | Poppins + blue gradient combination | `font-family: 'Poppins'` + gradient using blue tones |
| 19 | White card on light gray background (no contrast) | `bg-white` card on `bg-gray-50` or `bg-gray-100` parent |
| 20 | Symmetric padding everywhere (no visual rhythm) | All paddings `p-4`, `p-6`, or `p-8` — no horizontal/vertical variation |

### LLM Vision-Required (assessed by visual-critic subagent from screenshot)

| # | Pattern | What to Look For in Screenshot |
|---|---------|-------------------------------|
| 21 | Missing visual hierarchy | All elements render at similar visual weight; no dominant primary element |
| 22 | Disconnected color palette | Colors appear unrelated; no shared hue, temperature, or saturation logic |
| 23 | Gratuitous decoration | Shadows, glows, or gradients that add visual noise but serve no structural purpose |
| 24 | Generic stock iconography misaligned with brand | Icons appear from a default library set; style does not match component aesthetic |
| 25 | Typography scale collapse | Body text and heading text too similar in size; inadequate scale ratio |

---

## Loop Termination Rules

The critique loop stops when **any** of these conditions are true:

1. `meta.overall_score >= 4.0` — quality threshold met
2. `meta.round == 3` — maximum iterations reached
3. `meta.convergence_signal == true` — round N score < round N-1 score (diverging)

When condition 3 fires, Claude must **not** apply top_3_fixes. Return the round N-1
output to the user unchanged and note: "Critique loop stopped: round 2 score regressed.
Delivering round 1 result."

---

## WCAG 2.2 AA Compliance Checklist

The visual-critic must verify all of these when scoring `color_contrast` and `accessibility`:

- Body text contrast ratio ≥ 4.5:1 against background
- Large text (≥ 18pt or ≥ 14pt bold) contrast ratio ≥ 3:1
- UI component boundaries (buttons, inputs, focus rings) ≥ 3:1
- `:focus-visible` present on all interactive elements
- Touch targets ≥ 24×24px (WCAG 2.5.8 minimum size)
- `prefers-reduced-motion` media query present and disabling non-essential animation
