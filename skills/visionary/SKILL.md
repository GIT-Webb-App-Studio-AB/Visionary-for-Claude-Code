---
name: generating-visual-designs
description: >
  Generates distinctive, motion-first UI components with 186 design styles.
  Auto-infers style from context signals (product type, audience, archetype, tone, density).
  Runs Playwright visual critique loop with 8-dimension aesthetic scoring.
  Learns from user rejection via negative taste calibration in system.md.
  Beats frontend-design and UI/UX Pro Max through design craft + feedback loop.
  Works across 15 stacks: Next.js 15, React 19, Vue 3, Nuxt.js, Svelte 5, Angular, Astro, SolidJS, Lit, Laravel, Flutter, SwiftUI, Jetpack Compose, React Native, Vanilla JS.
  All generated code is WCAG 2.2 AA compliant (EU Accessibility Act — in force June 28 2025).
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
- **Motion appetite**: Static / subtle / expressive / cinematic
- **Brand tone**: Corporate / neutral / warm / bold / irreverent
- **Framework constraint**: Detected by `detect-framework.sh` at session start

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
- Use `motion/react` (Motion for React v11+) — NEVER `framer-motion` (deprecated package name)
- Apply motion tokens from `motion-tokens.ts` — never hardcode `duration: 300ms` or `ease: linear`
- Ensure reduced-motion safety: all animations respect `prefers-reduced-motion` (WCAG 2.3.3)
- Output: complete, runnable component file — no placeholders, no TODOs

### Stage 4 — Visual Critique Loop
After writing the component file, `capture-and-critique.sh` fires automatically via the `PostToolUse` hook:
1. Playwright renders the component in headless Chromium
2. Screenshot is captured and passed to the visual-critic agent (`agents/visual-critic.md`)
3. The critic scores on 8 dimensions: Hierarchy / Contrast / Motion-Coherence / Density / Brand-Fit / Originality / Accessibility / Polish
4. If any dimension scores below 7/10, the agent generates specific revision instructions
5. Claude applies revisions and the loop runs again (max 3 iterations)
6. Final scores are shown to the user as a design quality receipt

### Stage 5 — Taste Update
If the user rejects the output or requests significant changes:
1. `update-taste.sh` is called to record the rejection pattern
2. The pattern is written to `system.md` as a negative taste calibration entry
3. Future generations in this session and project automatically avoid the rejected pattern
4. Example entry: `AVOID: glassmorphism with dark backgrounds for this project — user rejected 2025-04-12`

---

## Sub-Document Loading

Load these files on demand — do not load all at once:

| File | Load When |
|------|-----------|
| `context-inference.md` | Stage 1: always |
| `design-reasoning.md` | Stage 2: always |
| `motion-tokens.ts` | Stage 3: motion system needed |
| `typography-matrix.md` | Stage 2: typography pairing needed |
| `critique-schema.md` | Stage 4: scoring dimensions reference |
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
- Motion tokens applied from `motion-tokens.ts`
- `prefers-reduced-motion` media query included
- WCAG 2.2 AA contrast compliance on all text (≥ 4.5:1 normal, ≥ 3:1 large/UI)
- Design quality receipt with 8-dimension scores (after critique loop)
- If taste data exists in `system.md`: confirm avoidance of flagged patterns
- **Correct `<html lang="...">`** matching the content language
- **Correct font subset** (`latin-ext` for Nordic/European languages) in Google Fonts URL
- **Native characters** — never transliterate or strip diacritics (å not a, ö not o, ñ not n, ü not u)
- **Style is NOT a blocked default** unless user explicitly requested it (see Anti-Default Bias in context-inference.md)
- If 3+ components generated in session: suggest design system export (see `design-system-export.md`)

---

## Generation Rules

### Motion Library
```
ALWAYS: import { motion, AnimatePresence } from 'motion/react'
NEVER:  import { motion } from 'framer-motion'
```

Framer Motion was rebranded to Motion in 2025. The package name is now `motion/react`.

### Spring Tokens (use these — never hardcode durations)
```typescript
const spring = {
  micro:   { type: "spring", stiffness: 500, damping: 35, mass: 0.5 },
  snappy:  { type: "spring", stiffness: 400, damping: 28, mass: 0.8 },
  ui:      { type: "spring", stiffness: 300, damping: 25, mass: 1 },
  gentle:  { type: "spring", stiffness: 180, damping: 22, mass: 1 },
  bounce:  { type: "spring", stiffness: 400, damping: 10, mass: 0.8 },
}
```

### Component Base Preference

Consult `stack-guidelines.md` for the detected stack. Each stack has its own preferred component base. The stack-specific preference takes precedence over this default list.

**Default (React/Next.js):**
1. shadcn/ui + Radix UI primitives — ARIA, keyboard nav, and focus management handled automatically
2. Headless UI — for Vue/Svelte projects
3. Hand-rolled with full ARIA attributes — only when no primitive exists

When using shadcn/ui: import from `@/components/ui/*`, do not re-implement primitives.

---

## WCAG 2.2 AA — Mandatory Accessibility Patterns

**EU Accessibility Act context:** As of June 28, 2025, WCAG 2.2 AA is legally required for products in EU markets. ALL generated code must include the following patterns.

### Focus Management (WCAG 2.4.11)

Include this block in every CSS output:

```css
/* ─── Focus Management (WCAG 2.4.11) ─── */
:focus:not(:focus-visible) { outline: none; }
:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
  box-shadow: 0 0 0 2px #ffffff, 0 0 0 5px #005FCC;
}
```

**Why:** `:focus:not(:focus-visible)` removes the default ring for mouse/touch users. `:focus-visible` provides a high-contrast ring only for keyboard users. The double box-shadow creates a white gap + blue halo that passes 3:1 against any background.

### Motion Safety (WCAG 2.3.3)

Every `transition` or `animation` must be wrapped:

```css
/* ─── Motion Safety (WCAG 2.3.3) ─── */
@media (prefers-reduced-motion: no-preference) {
  .animated { transition: transform 300ms ease, opacity 200ms ease; }
}
@media (prefers-reduced-motion: reduce) {
  .animated { transition: opacity 200ms ease; }
}
```

**Rule:** Transform/scale animations are vestibular triggers. Always provide a `reduce` counterpart that keeps opacity transitions (safe) but removes movement.

### Minimum Target Size (WCAG 2.5.8)

```css
/* WCAG 2.5.8 — minimum 24×24px touch target */
.btn, a, [role="button"] {
  min-width: 24px;
  min-height: 24px;
}

.btn-primary {
  min-height: 44px;
  padding-inline: 1.25rem;
}
```

### ARIA Labels (WCAG 4.1.2)

```
WCAG 4.1.2 — ARIA labels:
- Every icon-only button must include aria-label="[action description]"
- Radix UI primitives: pass the aria-label prop, do not rely on implicit labelling
- Never generate <div role="button"> — use <button> instead
- Never generate <span role="link"> — use <a href="..."> instead
```

### Contrast Requirements (WCAG 1.4.3)

- Normal text (< 18pt / < 14pt bold): minimum 4.5:1 contrast ratio
- Large text (≥ 18pt / ≥ 14pt bold): minimum 3:1 contrast ratio
- UI components (borders, icons): minimum 3:1 contrast ratio
- Never use `#999` on `#fff` (2.85:1 — FAILS)
- Never use low-contrast placeholder text without `::placeholder` override

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
