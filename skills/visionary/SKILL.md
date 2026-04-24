---
name: generating-visual-designs
description: >
  Generates distinctive, motion-first UI components with 183 design styles.
  Auto-infers style from context signals (product type, audience, archetype, tone, density).
  Runs Playwright visual critique loop with 8-dimension aesthetic scoring (axe-core-instrumented).
  Learns from user rejection via negative taste calibration in system.md.
  Beats frontend-design and UI/UX Pro Max through design craft + feedback loop.
  Works across 15 stacks: Next.js 16, React 19 (compiler stable), Vue 3, Nuxt 3, Svelte 5, Angular, Astro, SolidJS, Lit, Laravel, Flutter, SwiftUI, Jetpack Compose, React Native, Vanilla JS.
  All generated code is WCAG 2.2 AA compliant with APCA Lc floors (EAA in force since 28 June 2025; ADA Title II deadline for US state/local gov 24 April 2026).
---

# Visionary: Visual Design Generation

## When This Skill Activates

Activate on any request that involves:
- Building a UI component, page, layout, or design system element
- Redesigning or improving an existing interface
- Asking for "something that looks like X" or referencing a brand/aesthetic
- Any use of: `/visionary`, `/ui`, `/design`, `/component`, `/motion`
- Vague prompts containing: "make it look good", "improve the design", "modern", "clean", "bold"

Do not activate for: pure logic/algorithm work, API-only endpoints, data processing with no UI surface.

---

## Execution Flow

Every design generation follows this five-stage pipeline:

### Stage 1 — Context Inference
**Pre-check:** If `design-system/MASTER.md` exists in the project root, load it first. See `design-system-export.md` for retrieval logic — the design system short-circuits Steps 1-3 of the algorithm, using pre-decided colors, typography, motion, and spacing. If no design system exists, proceed with full inference.

Load `skills/visionary/context-inference.md` and score the request against five signals:
- **Product archetype**: SaaS / consumer / editorial / developer / luxury / playful
- **Audience density**: Power user (information-dense) vs. casual (spacious)
- **Motion appetite**: Static / Subtle / Expressive / Kinetic (enum used across style files)
- **Brand tone**: Corporate / neutral / warm / bold / irreverent
- **Framework constraint**: Detected by `hooks/scripts/detect-framework.mjs` at session start

Output: a `StyleBrief` object with `category`, `style_id`, `motion_level`, `density`, `palette_direction`, and `locale`.

### Stage 2 — Design Reasoning Brief
Load `skills/visionary/design-reasoning.md`. Using the `StyleBrief`, construct a written Design Reasoning Brief that articulates:
- The chosen style and why it fits the context
- Typography pairing from `typography-matrix.md`
- Motion tokens from `motion-tokens.ts` (entry animation, micro-interaction, exit)
- Color palette with contrast ratios (WCAG 2.2 AA minimum — 4.5:1 normal text, 3:1 large/UI)
- Spacing and density system (8px base grid)

This brief is shown to the user before code generation if the request is ambiguous. For clear requests, proceed directly.

### Stage 3 — Motion-First Code Generation
**Stack-aware generation:** Load the matched stack section from `stack-guidelines.md`. Use the stack's component base, motion system, spring token mapping, and accessibility API. The guidelines below (motion/react, shadcn/ui, etc.) are React/Next.js defaults — other stacks have their own equivalents documented in stack-guidelines.md.

Generate the component with motion as a first-class concern, not an afterthought:
- Start with the animation/transition model, then build structure around it
- Use `motion/react` v12+ — NEVER `framer-motion` (deprecated package name)
- Prefer v12 two-parameter springs: `{ bounce: 0.25, visualDuration: 0.4 }` over raw stiffness/damping/mass
- Apply motion tokens from `motion-tokens.ts` — never hardcode `duration: 300ms` or `ease: linear`
- Animate oklch()/color-mix directly — Motion v12 handles wide-gamut interpolation natively
- Prefer CSS-native where possible: `@starting-style` (Baseline 2024), `animation-timeline: view()` / `scroll()`, cross-document `@view-transition { navigation: auto }` for MPA stacks (Astro, Laravel, Nuxt)
- Use `linear()` easing for complex curves when CSS suffices over JS animation
- Ensure reduced-motion safety: all animations respect `prefers-reduced-motion` (WCAG 2.3.3) AND provide pause/stop controls for anything > 5s (WCAG 2.2.2)
- **Cascade discipline (Sprint 4 — Baseline 2026)**: every generated top-level stylesheet opens with `@layer reset, tokens, base, components, variants, utilities, overrides;`. Component styles sit inside `@scope (.vn-xxx) to (...)` blocks. Form controls default to `field-sizing: content; min-block-size: 3lh;` with an `@supports` fallback. Foreground colours that must hit AA on arbitrary backgrounds use `contrast-color()` with a token-driven fallback. See `stack-guidelines.md` "Canonical CSS Cascade" + "Canonical Form Controls" + "Canonical Colour Contrast" sections.
- **Popover + anchor primitives (Sprint 4)**: menus, tooltips, and dropdown content use `popover="auto"` + `anchor-name` / `position-anchor` + `commandfor` — zero JavaScript for open/close/position. Reach for `skills/visionary/partials/popover-anchor.css.md` before re-implementing float-positioning in React. Provide an `@supports (position-anchor: --x)` progressive fallback for pre-Baseline browsers.
- **View transitions (Sprint 4)**: card→detail patterns set `view-transition-name` per morphed element. Navigations run through `document.startViewTransition(() => router.push(...))` when the API exists; straight-fallback to `router.push()` otherwise. Always emit the `@media (prefers-reduced-motion: reduce) { ::view-transition-group(*) { animation: none } }` guard.
- Output: complete, runnable component file — no placeholders, no TODOs

### Stage 4 — Visual Critique Loop
After writing the component file, `hooks/scripts/capture-and-critique.mjs` fires automatically via the `PostToolUse` hook:
1. The hook emits an `additionalContext` instructing Claude (on the next turn) to:
   - Navigate the dev server via `mcp__playwright__browser_navigate` (respecting `VISIONARY_PREVIEW_URL` override)
   - Wait for `document.fonts.ready` AND `document.getAnimations().length === 0` (NOT networkidle — Playwright itself advises against it)
   - Capture the component at default 1200×800; add a 375×812 shot if source contains `md:` or `@media (max-width:`
   - Inject `axe-core` via `browser_evaluate` so the Accessibility dimension is deterministic, not LLM-guessed
   - Resize any PNG longest-side > 1568px (Claude vision optimum ≈1.15 megapixel; avoids issue #27611 infinite-retry)
2. The visual-critic subagent (`agents/visual-critic.md`) receives the screenshot(s) + brief and scores on 8 dimensions: Hierarchy / Contrast / Motion-Coherence / Density / Brand-Fit / Originality / Accessibility (axe-core-weighted) / Polish
3. Each round starts with a fresh context containing only brief + previous critique (SELF-REFINE pattern — avoids context-bleeding)
4. If any dimension scores below 7/10, the agent returns `top_3_fixes`; Claude applies them and the loop runs again (max 3 rounds)
5. Convergence abort: if round N score < round N-1 by >0.3, set `convergence_signal:true` and stop
6. Final scores are shown to the user as a design quality receipt

### Stage 5 — Taste Update (Sprint 05 rewrite)
Two parallel signal paths feed the taste profile after generation:

**Active signal:** `hooks/scripts/update-taste.mjs` fires on every `UserPromptSubmit`:
1. Detects rejection / approval phrases in the turn via `hooks/scripts/lib/taste-extractor.mjs`.
2. Extracts structured facts matching `skills/visionary/schemas/taste-fact.schema.json`.
3. Appends new facts to `taste/facts.jsonl` OR upgrades existing fact evidence (dedup via scope + signal key).
4. Captures `/variants`-picks ("pick A", "go with B", "take #2") as taste-pairs in `taste/pairs.jsonl`.
5. Legacy `system.md` is auto-migrated to `taste/facts.jsonl` on first hook tick. After migration, `system.md` becomes read-only legacy (ignored by the skill).

**Passive signal:** `hooks/scripts/harvest-git-signal.mjs` runs at `SessionStart` (rate-limited to once per 24h):
1. Walks files carrying the `.visionary-generated` marker (see below).
2. For each: classifies git history — `git_kept` (untouched 7+ days → prefer +0.4 conf), `git_heavy_edit` (>50 % churn within 7 days → avoid +0.6 conf), `git_delete` (removed within 7 days → avoid +0.75 conf).
3. Emits facts through the same dedup path as the active signal.

**Fact lifecycle** — `hooks/scripts/lib/taste-aging.mjs` runs periodically:
- `active` → `permanent` when `confidence ≥ 0.9 AND evidence.length ≥ 3 AND unique(evidence.kind) ≥ 2`
- `active` → `decayed` when `last_seen > 30 days` with no new evidence (confidence ×0.5; delete if <0.2)
- `decayed` → `active` on new matching evidence (reactivation, confidence floored at 0.5)

**Permanent + avoid facts act as hard-blocks** — they remove candidates from Step 4 entirely. Active facts apply graduated score adjustments proportional to confidence (see `context-inference.md` Step 4.5).

**All taste data is project-local** under `./taste/` — nothing leaves the machine. Opt-out: `export VISIONARY_DISABLE_TASTE=1` (see `docs/taste-privacy.md`).

### `.visionary-generated` marker — required in every generated file (Sprint 05 Task 16.2)

Every file you create in Stage 3 MUST begin with a header comment containing the literal token `.visionary-generated` plus five structured fields. Without this marker, `harvest-git-signal.mjs` cannot tell Visionary-authored files from user-authored files and cannot feed the passive signal loop — which cuts the flywheel in half.

**Default form (TSX / JSX / TS / JS / Vue `<script>` / Svelte `<script>`):**

```tsx
/**
 * .visionary-generated
 * style: <style-id from _index.json>
 * brief: "<brief summary, max 80 chars>"
 * generated_at: <ISO-8601 UTC timestamp>
 * generation_id: <ULID or UUID>
 */
```

**HTML / Svelte template / Vue template form:**

```html
<!--
  .visionary-generated
  style: <style-id>
  brief: "<brief summary>"
  generated_at: <ISO>
  generation_id: <id>
-->
```

**CSS / SCSS form:**

```css
/*
 * .visionary-generated
 * style: <style-id>
 * brief: "<brief summary>"
 * generated_at: <ISO>
 * generation_id: <id>
 */
```

**Rules:**
- The marker must be the very first thing in the file — no blank lines above it. `harvest-git-signal.mjs` only reads the first 1 KB.
- `style` is the canonical style id from `skills/visionary/styles/_index.json` (lowercase, hyphenated — e.g. `bauhaus-dessau`, not `Bauhaus (Dessau)`).
- `brief` is a short human-readable summary, not the full prompt.
- `generated_at` is the moment the file was written. Use `new Date().toISOString()`.
- `generation_id` is any unique token. A ULID from `hooks/scripts/lib/taste-io.mjs` is ideal; a UUID works too.

**Why the user might strip the marker:** it is a comment block — nothing enforces its presence post-generation. Users who dislike the file will delete it (strongest `git_delete` signal); users who love it will keep it (`git_kept` signal). Users who strip ONLY the marker silently opt out of the passive signal; the rest of the flow still works.

**Applied uniformly across all 15 stacks** — React / Next.js / Vue / Nuxt / Svelte / Angular / Astro / SolidJS / Lit / Laravel / Flutter / SwiftUI / Jetpack Compose / React Native / Vanilla JS. `stack-guidelines.md` references this section; every stack-specific generator uses the marker format declared here.

---

## Sub-Document Loading

Load these files on demand — do not load all at once:

| File | Load When |
|------|-----------|
| `context-inference.md` | Stage 1: always |
| `design-reasoning.md` | Stage 2: always |
| `motion-tokens.ts` | Stage 3: motion system needed |
| `typography-matrix.md` | Stage 2: typography pairing needed |
| `critique-schema.md` | Stage 4: scoring dimensions reference + evidence-anchoring rules |
| `../../docs/critique-principles.md` | Stage 4: evidence-over-vibes principle (why every score below 7 needs mechanical citation) |
| `schemas/critique-output.schema.json` | Stage 4: normative output contract for the visual-critic subagent |
| `calibration.json` | Stage 4: per-dimension linear calibration applied before threshold gating (identity when gold-set is empty) |
| `styles/_index.md` | Stage 1: style category lookup |
| `styles/[category]/` | Stage 1: after category is identified |
| `product-types.md` | Stage 1: after product type detected (read only matched section) |
| `stack-guidelines.md` | Stage 3: after framework detected (read only matched stack section) |
| `design-system-export.md` | Stage 1: when user requests export, or when `design-system/MASTER.md` exists |

Never load all style category directories simultaneously. Load only the identified category.

---

## Output Contract

Every generation must deliver:
- Complete, runnable component (no stubs, no `// TODO`)
- **Motion floor (hard requirement)** — unless the detected product type is
  long-form reading (editorial, blog post, book review, documentation):
  - At least one `spring.*` token from `motion-tokens.ts` applied to at
    least one entry animation or interaction, **OR**
  - At least one CSS-first escape (`@starting-style`, `animation-timeline`,
    `@view-transition`) applied to the primary element
  - AND the `@media (prefers-reduced-motion: reduce)` gate that degrades
    the chosen animation to opacity-only or no-op.
  - For long-form reading surfaces, the correct output is **no motion** —
    stillness is the design choice, not a gap.
- `prefers-reduced-motion` media query included whenever motion is present
- WCAG 2.2 AA contrast compliance on all text (≥ 4.5:1 normal, ≥ 3:1 large/UI)
- Design quality receipt with 8-dimension scores (after critique loop)
- If taste data exists in `system.md`: confirm avoidance of flagged patterns
- **Correct `<html lang="...">`** matching the content language
- **Correct font subset** (`latin-ext` for Nordic/European languages) in Google Fonts URL
- **Native characters** — never transliterate or strip diacritics (å not a, ö not o, ñ not n, ü not u)
- **Style is NOT a blocked default** unless user explicitly requested it (see Anti-Default Bias in context-inference.md)
- If 3+ components generated in session: suggest design system export (see `design-system-export.md`)

### Motion floor enforcement in the critique loop

The Motion Readiness dimension in the critique loop (`agents/visual-critic.md`)
is instructed to fail any output that violates the motion floor above for a
non-reading surface. A failed Motion Readiness score triggers an automatic
fix round — the generator re-emits the component with the missing spring
token or CSS-first escape applied. This removes the historical gap where
motion regressed below the other dimensions in v1.3.0 benchmark runs.

---

## Generation Rules

### Motion Library
```
ALWAYS: import { motion, AnimatePresence } from 'motion/react'  // v12+
NEVER:  import { motion } from 'framer-motion'                   // deprecated
```

Framer Motion was rebranded to Motion in 2025. v12 (2026-baseline) introduces two-parameter springs (`bounce` + `visualDuration`) and native oklch/color-mix animation — prefer those over stiffness/damping/mass for new code.

### Spring Tokens (use these — never hardcode durations)
```typescript
// Motion v12 — two-parameter springs (preferred)
const spring = {
  micro:   { type: "spring", bounce: 0.0,  visualDuration: 0.15 }, // crisp
  snappy:  { type: "spring", bounce: 0.15, visualDuration: 0.25 }, // subtle bounce
  ui:      { type: "spring", bounce: 0.2,  visualDuration: 0.35 }, // default
  gentle:  { type: "spring", bounce: 0.1,  visualDuration: 0.6  }, // slow settle
  bounce:  { type: "spring", bounce: 0.55, visualDuration: 0.5  }, // playful
}

// Motion v11 / legacy — keep for projects not yet upgraded
const springLegacy = {
  micro:   { type: "spring", stiffness: 500, damping: 35, mass: 0.5 },
  snappy:  { type: "spring", stiffness: 400, damping: 28, mass: 0.8 },
  ui:      { type: "spring", stiffness: 300, damping: 25, mass: 1   },
  gentle:  { type: "spring", stiffness: 180, damping: 22, mass: 1   },
  bounce:  { type: "spring", stiffness: 400, damping: 10, mass: 0.8 },
}
```

### Color (default oklch, not hex)
Generate palettes in `oklch()` so interpolation is perceptually uniform and wide-gamut displays (Apple display-p3 etc.) render correctly. Keep hex only as a fallback comment.

```css
:root {
  --accent: oklch(0.72 0.19 258);                   /* primary */
  --accent-hover: color-mix(in oklch, var(--accent), white 8%);
  --accent-focus: color-mix(in oklch, var(--accent), black 12%);
}
```

### Tailwind (v4 default)
Use `@theme` in CSS — `tailwind.config.js` is the v3 pattern. Automatic content detection means no `content:` array. Oxide engine (~5× faster builds). Detection: `detect-framework.mjs` reports v3 vs v4 in `.visionary-cache/detected-framework.json`.

```css
/* app.css — Tailwind v4 */
@import "tailwindcss";
@theme {
  --color-accent: oklch(0.72 0.19 258);
  --font-display: "Grotesk New", system-ui;
}
```

### Next.js (16 default)
Cache Components and PPR are on by default. React Compiler is stable — rely on it, don't over-memoize. Use `<Form>` for progressive-enhancement form submissions. Turbopack is default.

### shadcn (v4 default)
`shadcn apply --preset` pulls curated registries. Base UI primitive layer (`@base-ui-components/react`) is a newer, more ergonomic alternative to Radix — prefer for new code. Detection result in `component_primitives.base_ui`.

### Design Tokens (DTCG)
If `*.tokens.json` is detected, prefer token references over hardcoded values. The DTCG 1.0 spec stabilized October 2025 and is supported by Style Dictionary v4 and Figma Variables native import/export.

### Component Base Preference

Consult `stack-guidelines.md` for the detected stack. Each stack has its own preferred component base. The stack-specific preference takes precedence over this default list.

**Default (React/Next.js):**
1. shadcn/ui + Radix UI primitives — ARIA, keyboard nav, and focus management handled automatically
2. Headless UI — for Vue/Svelte projects
3. Hand-rolled with full ARIA attributes — only when no primitive exists

When using shadcn/ui: import from `@/components/ui/*`, do not re-implement primitives.

---

## WCAG 2.2 AA — Mandatory Accessibility Patterns

### Jurisdictional context (2026)

| Jurisdiction | Requirement | Status |
|---|---|---|
| EU (27 states) | European Accessibility Act — WCAG 2.2 AA | **In force since 28 June 2025.** Enforcement active: France (DGCCRF), Germany (fines up to €500k), Netherlands (up to €900k / 10 % turnover). Extraterritorial: non-EU SaaS targeting EU customers is covered. |
| USA — state/local gov | ADA Title II final rule — WCAG 2.1 AA | **Deadline 24 April 2026** for pop. ≥ 50 000. |
| USA — federal | Section 508 — WCAG 2.0 AA | Existing. |
| UK | PSBAR 2018 — WCAG 2.2 AA | Existing. |
| Canada — federal | ACA / ACR 2025 — WCAG 2.1 AA | Existing. |
| Canada — Ontario | AODA — WCAG 2.0 AA | Existing. |
| Japan | JIS X 8341-3:2016 — WCAG 2.0 AA | Existing. |

**Rule of thumb:** every generated component must pass WCAG 2.2 AA AND include APCA Lc floors for dark-mode contrast math. If a project ships to the EU, assume EAA applies regardless of company HQ.

### Focus Management (WCAG 2.4.11)

```css
/* ─── Focus Management (WCAG 2.4.11) ─── */
:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
  box-shadow: 0 0 0 2px Canvas, 0 0 0 5px AccentColor;
}
```

**Do NOT generate** `:focus:not(:focus-visible) { outline: none }` — that fallback is obsolete. Chrome 90 / Firefox 85 / Safari 15.4 (all March 2022) suppress the default mouse-focus ring in their user-agent stylesheets; the explicit reset only risks stripping focus from users who actually need it. `Canvas`/`AccentColor` system colors auto-adapt to Windows High Contrast and forced-colors mode; a fixed `#005FCC` halo does not.

### Motion Safety (WCAG 2.3.3 + 2.2.2)

```css
/* ─── WCAG 2.3.3 — user-preference based ─── */
@media (prefers-reduced-motion: no-preference) {
  .animated { transition: transform 300ms ease, opacity 200ms ease; }
}
@media (prefers-reduced-motion: reduce) {
  .animated { transition: opacity 200ms ease; }
}
```

Transform/scale animations are vestibular triggers. The `reduce` branch must keep the state change legible (usually opacity) while removing movement.

**WCAG 2.2.2 (Level A) — pause/stop/hide:** any auto-playing motion that runs **> 5 s** AND is presented alongside other content MUST expose a user-visible pause/stop/hide control. `prefers-reduced-motion` is the OS preference, not a substitute for the interaction requirement. Styles affected: `kinetic-type`, `flow-field-vector`, `reaction-diffusion`, `quantum-particle`, `aurora-mesh`, and anything in the Kinetic tier. Generate a pause button bound to `animation-play-state` or the JS equivalent.

### Minimum Target Size (WCAG 2.5.8 — 2.2 AA)

```css
/* 24×24 is the WCAG 2.5.8 floor for AA conformance.         */
/* Our default is 44×44 — matches Apple HIG (44pt), Material */
/* (48dp), and has ~3× lower mis-tap rate than 24 in studies.*/
.btn, a.button, [role="button"] {
  min-inline-size: 44px;
  min-block-size: 44px;
}
```

**Drop to 24 only for** deliberately dense UI: `bloomberg-terminal`, `terminal-cli`, `data-visualization` row cells, `saas-b2b-dashboard` table rows, inline text links in flowing prose (AA exception 1), user-agent-controlled elements (AA exception 4). Document the choice in the design brief so the critic doesn't flag it.

### RTL + Logical Properties (affects ~500M users)

**Default to CSS logical properties** everywhere, not physical ones. Arabic, Hebrew, Persian, Urdu layouts mirror; without logical props the component is broken in those locales.

```css
/* ✗ Wrong — physical */
.card { margin-left: 1rem; padding-right: 0.5rem; border-left: 2px solid; }

/* ✓ Correct — logical, RTL-safe */
.card { margin-inline-start: 1rem; padding-inline-end: 0.5rem; border-inline-start: 2px solid; }
```

All box-offset, margin, padding, border, inset, and text-align values must use the logical variant. `arabic-calligraphic` declares `dir="rtl"` on its root — the rest of the system relies on logical props for correct flip behavior.

### ARIA 1.3 support

Use the newer ARIA 1.3 primitives where appropriate:

- `role="suggestion"` / `role="comment"` / `role="mark"` for inline annotation UIs
- `aria-description` for supplementary text (richer than `aria-describedby` for AT reading)
- `aria-braillelabel` / `aria-brailleroledescription` for refreshable-Braille output
- `aria-actions` (editor toolbars) where supported

### ARIA Labels (WCAG 4.1.2)

```
WCAG 4.1.2 — ARIA labels:
- Every icon-only button must include aria-label="[action description]"
- Radix / Base UI primitives: pass the aria-label prop, do not rely on implicit labelling
- Never generate <div role="button"> — use <button> instead
- Never generate <span role="link"> — use <a href="..."> instead
- Prefer aria-description over aria-describedby when the description is inline and short
```

### Contrast Requirements (WCAG 1.4.3 + APCA)

**Dual floors — include both values in design briefs:**

| Text role | WCAG 2.x (legal minimum) | APCA Lc (perceptual floor) |
|---|---|---|
| Body text (< 24 px or < 18 px bold) | 4.5:1 | Lc ≥ 75 |
| Large text / UI label (≥ 24 px or ≥ 18 px bold) | 3:1 | Lc ≥ 60 |
| UI borders, icons, non-text | 3:1 | Lc ≥ 45 |
| High-contrast-a11y style (WCAG AAA) | 7:1 | Lc ≥ 90 |

Why both: WCAG 2.x contrast math breaks in dark mode (a passing 4.5:1 can still feel murky at ~#1a1a1a + ~#888). APCA Lc is the perceptually-uniform successor Apple/Adobe ship today and that drives the 73 styles running dark backgrounds. Run the APCA check via `axe-core`'s experimental apca rule or `apca-w3`.

- Never `#999` on `#fff` (2.85:1 — FAILS both).
- Never rely on transparency-only contrast (rgba text over image) without a solid fallback.
- `::placeholder` text must meet 3:1 or be explicitly overridden.

### No Flashing (WCAG 2.3.1)

```
WCAG 2.3.1 — Zero elements may flash > 3× per second.
Forbidden keyframe patterns:
- visibility toggle at > 3 Hz
- opacity 0↔1 toggle at > 3 Hz
- background-color flash at > 3 Hz
Allowed: neon-flicker.css animations MUST use irregular timing ≥ 3s cycles
```

### Semantic HTML (WCAG 4.1.1)

```
Use native HTML elements:
✓ <button> for interactive elements
✓ <nav> for navigation
✓ <main>, <header>, <footer>, <aside> for landmark regions
✓ <h1>–<h6> in correct heading hierarchy
✗ Never: <div role="button">, <span role="link">, <div role="navigation">
```

### Automated verification in the critique loop

`axe-core` is injected into the Playwright screenshot flow via `browser_evaluate`. The subagent MUST consume the axe JSON and weight the Accessibility dimension score against real violations — not an LLM guess. axe-core covers 30–50 % of WCAG violations deterministically; the remainder (cognitive, context-dependent) stays with the subagent.

---

## Slop Detection

The following patterns are detected by the critique loop and trigger automatic fix rounds:

1. **Generic AI gradient** — `Inter` font + blue gradient background → score 2/10
2. **Soft shadow pile** — More than 3 `box-shadow` layers without purpose → score 3/10
3. **Rounded everything** — `border-radius: 12px` on every element → score 3/10
4. **Gradient CTA** — Linear gradient on primary buttons → score 4/10
5. **Centeritis** — All text centered including body copy → score 3/10
6. **Weight sameness** — All text at same font-weight → score 4/10
7. **Hover colour only** — Hover state changes only colour, no position/scale → score 4/10
8. **Emoji icons** — Colorful emoji used as UI icons → score 1/10
9. **Stripped diacritics** — "Bokfoering" instead of "Bokföring", "Uber" instead of "Über" → score 1/10. This is a **blocking defect** — the component must be fixed before delivery.
10. **Missing font subset** — Google Fonts URL without `latin-ext` when content uses Nordic/European characters → score 2/10
11. **Wrong html lang** — `<html lang="en">` when content is Swedish/German/etc → score 2/10
12. **Blocked default style** — Using `fintech-trust`, `saas-b2b-dashboard`, or generic dark-mode+gradient as primary style without explicit user request → score 3/10. See Anti-Default Bias in context-inference.md.
