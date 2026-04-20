# Visual Critique Schema

Reference document for the visual-critic subagent. Loaded during Stage 4 of the
visionary pipeline. Defines the loop flow, 8-dimension scoring rubric, JSON output
format, and 26 design slop detection patterns.

---

## Loop Flow

```
Claude writes component file
        ↓
PostToolUse hook fires (matcher: "Write|Edit|MultiEdit")
        ↓
hooks/scripts/capture-and-critique.mjs runs
        ↓
[Safety gates inside the hook]
  • File extension is .tsx/.jsx/.vue/.svelte/.html? → proceed
  • Debounce: was this file critiqued < 3000 ms ago? → silent exit
  • Round counter ≤ 3? → proceed (otherwise reset and silent exit)
  • Env VISIONARY_DISABLE_CRITIQUE set? → silent exit
        ↓
Hook sanitizes the source (strip comments + template strings) and runs
the 21 deterministic slop regexes. Flags are embedded in additionalContext.
        ↓
Hook emits additionalContext instructing Claude (next turn) to:
  1. mcp__playwright__browser_navigate to dev-server URL (VISIONARY_PREVIEW_URL override)
  2. mcp__playwright__browser_evaluate to wait for
     `document.fonts.ready && document.getAnimations().length === 0`
     (NEVER networkidle — Playwright itself advises against it)
  3. mcp__playwright__browser_evaluate to inject axe-core and run axe.run()
  4. mcp__playwright__browser_take_screenshot at 1200×800 (+ 375×812 if source
     contains md: or @media (max-width:); + 768×1024 if md: breakpoint detected)
  5. Resize any PNG whose longest side > 1568 px (Claude vision optimum ≈1.15 MP;
     avoids GitHub issue #27611 infinite-retry on >5 MB)
        ↓
visual-critic subagent receives FRESH CONTEXT (brief + screenshots + axe JSON +
slop flags + round number + previous score). No full chat history — SELF-REFINE
fresh-context pattern per round.
        ↓
8-dimension critique JSON + bounding box issues + top_3_fixes returned
        ↓
Termination: any of
  • overall_score ≥ 4.0                          → done, deliver result
  • round == 3                                    → done, deliver best
  • round N score < round N-1 score by > 0.3     → convergence_signal, revert
  • otherwise, Claude applies top_3_fixes; hook re-fires on next Edit
```

---

## 8-Dimension Scoring Rubric

Each dimension is scored **1–5** (1 = severe problem, 5 = excellent).
`overall_score` is the arithmetic mean of all 8, rounded to one decimal.

| Dimension | What Is Scored | Score 1 | Score 5 |
|-----------|---------------|---------|---------|
| `visual_hierarchy` | Primary action draws the eye first; information has clear weight gradient | All elements same visual weight; CTA competes with nav | Immediate eye path: hero → CTA → supporting info |
| `layout_integrity` | Grid holds across viewports (375 / 768 / 1200 px screenshots) | Layout breaks or overflows at tested widths | Responsive grid intact; no overflow or collision |
| `typography` | Typeface pairing is distinctive; size scale creates clear hierarchy | Inter or Roboto as sole face; scale too uniform | Curated pairing; display + text faces; clear step scale |
| `color_contrast` | WCAG 2.2 AA AND APCA Lc floors (see table below); no text below threshold | Multiple contrast failures; text illegible | All ratios pass both; sufficient separation between zones |
| `design_distinctiveness` | Output avoids generic AI aesthetics; style has a point of view | AI-slop: uniform radius, Tailwind defaults, stock icons | Deliberate, non-template aesthetic; recognizable style |
| `brief_conformance` | Generated component matches the user's stated layout and feature request | Core layout or feature missing | All requested elements present in correct structure |
| `accessibility` | axe-core JSON-grounded: see weighting rules below | Any critical axe violation, OR no visible focus, OR targets below floor | Zero axe violations; visible :focus-visible; targets ≥ 44 (or documented 24); pause control for >5s motion; logical properties; APCA pass |
| `motion_readiness` | Entry animations defined; spring/easing tokens used; motion is purposeful; reduced-motion + 2.2.2 pause handled | No animation primitives; no motion tokens; static shell | Entry variants, micro-interactions, exit states; Motion v12 springs; CSS-first where suitable |

### Accessibility dimension — axe-core weighting

Weight the accessibility score **60 % axe-core, 40 % visual/source heuristics**:

- `violations[]` with `impact: critical` → −1 per unique rule (floor 1)
- `violations[]` with `impact: serious` → −0.5 per unique rule
- `violations[]` with `impact: moderate|minor` → −0.25 per unique rule

Apply heuristics on top (focus-visible presence, touch-target estimate, reduced-motion
gate, pause control for >5s motion, logical properties, APCA compliance).

---

## JSON Output Format

The visual-critic subagent must return this exact structure. Total JSON must not
exceed 10,000 characters — truncate `bounding_box_issues` (from the end) if needed.

```json
{
  "meta": {
    "round": 1,
    "overall_score": 2.8,
    "convergence_signal": false,
    "previous_score": null,
    "viewports_captured": ["1200x800", "375x812"]
  },
  "scores": {
    "visual_hierarchy":       { "score": 3, "rationale": "CTA competes with nav for attention" },
    "layout_integrity":       { "score": 3, "rationale": "Grid breaks at 375px viewport — cards overflow" },
    "typography":             { "score": 2, "rationale": "Inter detected as sole typeface — generic" },
    "color_contrast":         { "score": 4, "rationale": "WCAG 2.2 AA passes (4.7:1) but APCA Lc 68 on body — marginal" },
    "design_distinctiveness": { "score": 2, "rationale": "AI-slop: uniform 8px radius, blue primary" },
    "brief_conformance":      { "score": 4, "rationale": "Dashboard layout matches request" },
    "accessibility":          { "score": 2, "rationale": "axe: 1 critical (color-contrast), 2 serious (button-name, image-alt)" },
    "motion_readiness":       { "score": 2, "rationale": "No entry animations, no prefers-reduced-motion" }
  },
  "axe_summary": {
    "violations_critical": 1,
    "violations_serious":  2,
    "violations_moderate": 0,
    "violations_minor":    0,
    "passes":              18
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

- `meta.round` — 1, 2, or 3
- `meta.overall_score` — arithmetic mean of all 8 `score` values
- `meta.convergence_signal` — `true` if (round N score < round N-1 score by > 0.3)
- `meta.previous_score` — the round N-1 `overall_score`, or `null` on round 1
- `meta.viewports_captured` — array of "{W}x{H}" strings for every screenshot taken
- `axe_summary` — counts from axe-core's `violations[]` grouped by impact
- `scores[dimension].score` — integer 1–5
- `scores[dimension].rationale` — one sentence, specific to what appears in the screenshot
- `bounding_box_issues` — regions with layout/sizing problems; include only if identifiable
- `design_slop_flags` — patterns detected (see 26-pattern list below)
- `top_3_fixes` — three highest-impact changes, ordered by impact

---

## 26 Design Slop Patterns

Patterns 1–20 are **deterministic** — detected by the hook's sanitized-source regex scan
(comments and template strings stripped) before any screenshot. Patterns 21–26 require
**LLM vision analysis** by the visual-critic against the screenshot.

### Deterministic (checked in capture-and-critique.mjs)

| # | Pattern | Detection Signal |
|---|---------|----------------|
| 1 | Purple/violet gradient backgrounds | `from-purple` / `from-violet` with gradient classes |
| 2 | Cyan-on-dark color scheme | `text-cyan-*` or `#06B6D4` |
| 3 | Left-border accent card | `border-l-4` / `border-left: 4px solid` |
| 4 | Dark background + colored box-shadow glow | `bg-(gray\|zinc\|slate)-900` within 120 chars of `shadow-*` |
| 5 | Gradient text on headings or metrics | `bg-clip-text text-transparent bg-gradient` |
| 6 | Hero Metric Layout | `text-(4xl\|5xl\|6xl)` + `text-(sm\|xs)` + `bg-gradient-` in same file |
| 7 | Repeated 3+ "card" classNames | three or more `className="...card..."` matches |
| 8 | *(reserved, LLM-vision)* | see pattern 28 below — "cards nested inside cards" |
| 9 | Inter as sole typeface | font-family/--font-* set to Inter, no secondary face declared |
| 10 | Roboto / Arial / Open Sans as sole typeface | same, alt faces |
| 11 | Default Tailwind blue #3B82F6 as primary | `bg-blue-500` / `#3B82F6` |
| 12 | Default Tailwind purple #6366F1 as primary | `bg-indigo-500` / `#6366F1` |
| 13 | Default Tailwind green #10B981 as accent | `text-emerald-500` / `#10B981` |
| 14 | Uniform border-radius across elements | `rounded-(lg\|md\|xl)` count ≥ `className=` count |
| 15 | `shadow-md` applied uniformly | ≥ 3 occurrences |
| 16 | Centered hero with gradient backdrop and floating cards | `text-center` + `bg-gradient-` + `absolute` |
| 17 | Three-column icon + heading + paragraph feature section | `<Icon>`/`<XxxIcon>` + `<h3>` + `grid-cols-3` |
| 18 | Poppins + blue gradient combination | `Poppins` + `(from-blue\|bg-blue)-*` |
| 19 | White card on light gray background (no contrast) | `bg-white` + `bg-(gray-50\|gray-100\|slate-50)` |
| 20 | Symmetric padding everywhere (no rhythm) | ≥ 3 × `p-(4\|6\|8)` and 0 × `(px\|py)-N` |

### LLM Vision-Required (assessed by visual-critic from screenshot)

| # | Pattern | What to Look For in Screenshot |
|---|---------|-------------------------------|
| 21 | Missing visual hierarchy | All elements render at similar visual weight; no dominant primary element |
| 22 | Disconnected color palette | Colors appear unrelated; no shared hue, temperature, or saturation logic |
| 23 | Gratuitous decoration | Shadows/glows/gradients that add visual noise but serve no structural purpose |
| 24 | Generic stock iconography misaligned with brand | Icons appear from a default library set; style does not match component aesthetic |
| 25 | Typography scale collapse | Body text and heading text too similar in size; inadequate scale ratio |
| 26 | **Neon-on-dark without thematic justification** | Dark background + neon/glow accents in a brief that does NOT call for cyberpunk / synthwave / vaporwave / glitchcore / y2k / neon-dystopia / sci-fi-hud / neon-signage / holographic / cyberpunk-neon. If the selected style is trust / clinical / editorial / productivity and the output ships neon-on-dark, flag this — it leaks the "default AI dark dashboard" aesthetic past the anti-default filter. |

---

## Loop Termination Rules

The critique loop stops when **any** of these conditions are true:

1. `meta.overall_score >= 4.0` — quality threshold met
2. `meta.round == 3` — maximum iterations reached
3. `meta.convergence_signal == true` — round N score regressed by > 0.3 from N-1 (diverging)

When condition 3 fires, Claude must **not** apply top_3_fixes. Return the round N-1
output to the user unchanged and note: "Critique loop stopped: round N score regressed
by > 0.3. Delivering round N-1 result."

---

## WCAG 2.2 AA + APCA Reference

Dual floors — the visual-critic scores against both:

| Text role | WCAG 2.x (legal min) | APCA Lc (perceptual) |
|---|---|---|
| Body text (< 24 px or < 18 px bold) | 4.5:1 | Lc ≥ 75 |
| Large text / UI label (≥ 24 px or ≥ 18 px bold) | 3.0:1 | Lc ≥ 60 |
| UI borders, icons, non-text | 3.0:1 | Lc ≥ 45 |
| Focus indicator vs adjacent colors | 3.0:1 | — |
| `high-contrast-a11y` style (WCAG AAA) | 7.0:1 | Lc ≥ 90 |

Touch-target floor: **44×44 CSS px** by default. Drop to 24 only when the style's
frontmatter has `accessibility.touch_target: 24` (bloomberg-terminal, terminal-cli,
developer-tools, data-visualization, saas-b2b-dashboard, bento-grid, data-center).

Motion requirements:
- `prefers-reduced-motion: reduce` degrades transform → opacity-only
- Any autoplay > 5 s needs a pause control (WCAG 2.2.2 Level A)
- No element flashes > 3 Hz (WCAG 2.3.1)
