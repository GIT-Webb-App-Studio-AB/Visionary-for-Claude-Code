---
name: generating-visual-designs
description: >
  Generates distinctive, motion-first UI components with 202 design styles.
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

## What's New (1.6.0) — Sprint 16-24 Highlights

The 1.6.0 cycle (Sprint 16-24) extended Visionary from a discrete-style picker into a continuous, multi-modal, context-aware design system. New capabilities:

- **Sprint 16 — Verbalized Sampling (Stage 1.5)** + 9th anti-typicality critic in the critique loop. Mitigates RLHF convergence (α ≈ 0.57–0.65 per Zhang et al. 2025).
- **Sprint 17 — Latent Style Mixing (Stage 2.5)** + mood-slider (`/visionary-mood`). Continuous 8D slerp across catalog anchors with hard accessibility clamps.
- **Sprint 18 — From-Photo (`/visionary-from-photo`)** — palette + edge + mood inference from a reference image; feeds Stage 1's StyleBrief.
- **Sprint 19 — From-Track (`/visionary-from-track`)** — tempo/valence/arousal inference from an audio file or Spotify track; maps to motion tier + Russell quadrant.
- **Sprint 20 — Cinematic director-packs** (`/visionary-cinematic`, `--cinematic-grade`) — 12 director-style packs (Kubrick, Wong Kar-wai, Anderson, Fincher, Lynch, …) with LUT-mapper for color grading.
- **Sprint 21A — Constraint-Injection (Stage 2.6)** — 40-constraint catalogue (form/color/typography/layout/motion, 8 each) injected as hard invariants between Stage 2.5 and Stage 3.
- **Sprint 21B — Coined-styles auto-promotion (`/visionary-coined`)** — blends accepted ≥3 times in `taste/coined-styles.jsonl` are promoted to `styles/extended/` as named anchors.
- **Sprint 22A — Cross-screen flow (`/visionary-flow`)** — multi-screen orchestrator + cross-screen critique (consistency across landing → app → settings).
- **Sprint 22B — Voice-tempo (`/visionary-voice`)** — microphone-driven motion calibration ("mer energiskt" / "softer" voiced).
- **Sprint 23 — Runtime context (`/visionary-patina`)** — opt-in runtime modules (circadian, network-aware, patina) executing in the user's browser after generation. See Stage 6 below.
- **Sprint 24 — 5 new styles** added to `styles/_index.json` extending the catalogue from 197 → 202.

All Sprint 16-24 features are additive and gated — existing prompts continue to work unchanged when no new flags or commands are used.

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

### Stage 1.5 — Verbalized Sampling (Sprint 16)
**Purpose:** Mitigate typicality bias in RLHF-aligned models (Claude inkluderat) — α ≈ 0.57–0.65 per Zhang et al. 2025. Without this stage the same prompt repeatedly converges toward the catalog's high-probability favorites.

Activates by default; skipped when `VISIONARY_DISABLE_VS=1` or `--no-vs` flag.

1. Load `skills/visionary/partials/verbalized-sampling.md`. Pass the `StyleBrief` from Stage 1.
2. Claude returns strict JSON: 5 distinct concepts with `{concept, probability, rationale, suggested_style_id}`. Probabilities sum ≈1.0 but anti-flat (low-prob alternatives are encouraged).
3. Validate against `schemas/verbalized-sampling.schema.json`. On schema-fail: 1 retry with re-prompt. On second fail: skip Stage 1.5, log `vs_skipped: true, reason: "schema_validation_failed"`.
4. Convergence-check via `hooks/scripts/lib/verbalized-sampling.mjs::detectConvergence`. If 3+ concepts share token-jaccard > 0.7 (configurable threshold): re-prompt with explicit divergence instruction.
5. Anti-typicality boost via `pickWithAntiTypicality(concepts, alpha=0.65, boostCap=1.6)`. Formula: `weight_i = probability_i^(1-α)` — gives low-prob candidates 1.3–1.6× selection-rate boost, deboosts high-prob to ~0.8×.
6. The selected concept enriches the Design Reasoning Brief (Stage 2) — its `concept` text + `rationale` become input bias.
7. **Receipt-output** carries `vs_concepts: [{concept, probability, picked: bool}, ...], vs_alpha: 0.65, vs_skipped: false` for traceability.

**Differs from `/variants`** — VS = 5 concept-weights internally (~400 tokens, before render). `/variants` = 3 full renders for user-pick (after render). Combine with `/variants --vs` for 3 renders × independent VS-pick each.

Configuration: `skills/visionary/anti-typicality.json` + env-overrides (`VISIONARY_VS_ALPHA`, `VISIONARY_VS_DISABLED`).

### Stage 2 — Design Reasoning Brief

#### Stage 2.5 — Latent Style Mixing & Mood (Sprint 17)
**Activates when:** `--blend "id1:w1 + id2:w2"` flag is set, OR the prompt contains a blend pattern ("70% Swiss, 30% Liminal", "X men med Y:s typografi"), OR `/visionary-mood <coords|text>` was invoked.

When active, Stage 2.5 produces a continuous off-catalog 8D vector that replaces the discrete `style_id` selection from Stage 1:

1. **Parse blend recipe** via `hooks/scripts/lib/blend-parser.mjs`:
   - Strict syntax: `parseStrictBlend("swiss-rationalism:0.7 + liminal-space:0.3")`
   - NL fallback: `parseNaturalLanguage("70% Swiss, 30% Liminal")` (svenska + engelska)
   - Override-mode: `"X men med Y:s Z"` where Z ∈ {typografi, motion, palette}
2. **Mood mapping** (alternative entry) via `hooks/scripts/lib/mood-mapper.mjs`:
   - Numeric: `mapMood("0.8,0.2")` → Russell quadrant + secondary
   - Text: `mapMood("calm-melancholic")` → looked up in 16-phrase TEXT_MOOD_MAP
   - Output: primary_styles + secondary_styles + motion_tier + saturation_hint
3. **Slerp in 8D space** via `hooks/scripts/lib/style-blend.mjs::blend(anchorIds, weights)`:
   - Spherical Linear Interpolation on the unit-projected hypersphere
   - N-anchor via successive pairwise composition; weights auto-normalize
   - Hard accessibility clamps post-slerp: chroma ≥ 0.15, contrast_energy ≥ 0.30, motion_intensity quantized to {0, 0.33, 0.66, 1.0}
   - `omegas_warning: true` when anchors are near-antipodal (omega > 2.5 rad) — flags risk of muddy mid-blend
4. **Resolve to brief** via `hooks/scripts/lib/style-blend-resolver.mjs::resolveBrief(vector)`:
   - Palette: oklch-lerp from top-3 nearest catalog anchors (pre-baked in `palette-tokens.json`); APCA Lc body-floor (75) hard-clamped, recorded in `clamps_applied`
   - Typography: pickPair from `typography-matrix.json` projected to (type_drama, formality) coordinates
   - Motion-tier: integer 0-3 (Static/Subtle/Expressive/Kinetic)
   - Density-tokens: lerp on the 8-step spacing scale [4,8,12,16,24,32,48,64] px
5. **Coined-styles persistence** (Sprint 17 stub, full impl Sprint 21): if blend accepted, append to `taste/coined-styles.jsonl`. Sprint 21 promotes 3+ acceptances to `styles/extended/`.

**Output:** Replaces Stage 1's discrete `style_id` with a `BlendedStyleBrief = { vector, anchors_used, clamps_applied, omegas_warning, blend_recipe }` that flows into Stage 2 as enriched input.

**Receipt-output** carries `blend_recipe: {anchors: [{id, weight}], vector, clamps_applied}` for traceability.

**Differs from Stage 1.5 (Verbalized Sampling):** Stage 1.5 picks ONE style-concept from 5 verbalized options (proactive diversity). Stage 2.5 produces a CONTINUOUS off-catalog blend (kontinuerlig variation). They compose: VS picks the conceptual seed, blend interpolates the visual realization.

### Stage 2 — Design Reasoning Brief (continued)
Load `skills/visionary/design-reasoning.md`. Using the `StyleBrief`, construct a written Design Reasoning Brief that articulates:
- The chosen style and why it fits the context
- Typography pairing from `typography-matrix.md`
- Motion tokens from `motion-tokens.ts` (entry animation, micro-interaction, exit)
- Color palette with contrast ratios (WCAG 2.2 AA minimum — 4.5:1 normal text, 3:1 large/UI)
- Spacing and density system (8px base grid)

This brief is shown to the user before code generation if the request is ambiguous. For clear requests, proceed directly.

### Stage 2.6 — Constraint-Injection (Sprint 21A)
**Activates when:** the prompt contains explicit constraint-language ("no gradients", "monochrome only", "asymmetric grid", "single typeface", "scroll-driven only"), OR `--constraint <id>` / `--constraints <id1,id2,...>` flags are passed, OR a coined-style or director-pack already declares constraints, OR the active taste profile has `permanent` constraint preferences.

Constraints are *atomic, post-generation-validatable hard invariants* — not preferences. A single constraint-fail flips the whole generation. The catalogue currently holds 40 constraints across 5 categories (form, color, typography, layout, motion — 8 each).

1. **Resolve constraint-set** via `hooks/scripts/lib/constraints/inject.mjs::resolveConstraints`:
   - Parse explicit IDs from CLI flags
   - NL-detect from the prompt (svenska + engelska keyword map)
   - Merge with director-pack / coined-style declared constraints
   - Apply `conflict_set` resolution — mutually exclusive constraints raise an early error to the user, no silent override
2. **Load constraint manifests** from `skills/visionary/constraints/<id>.md` (YAML frontmatter + free-text). Each declares: `id`, `category`, `css_rules`, `invariants`, `conflict_set`, `rationale`, `examples`. See `skills/visionary/constraints.md` for catalogue overview.
3. **Inject into Stage 3 prompt** — the constraint's `css_rules` and `invariants` are appended to the Design Reasoning Brief as hard "MUST satisfy" clauses. Example: `no-gradients` → "MUST: zero `linear-gradient()`, `radial-gradient()`, or `conic-gradient()` in any generated CSS or inline style."
4. **Post-render validation** via `hooks/scripts/lib/constraints/validate.mjs`:
   - DOM/CSS-walk against each declared `invariant`
   - On fail: emit `constraint_violation: {id, invariant, evidence}` and trigger an automatic fix-round in Stage 4
   - Validation runs BEFORE the visual-critic agent so constraint failures take precedence over aesthetic scores
5. **Receipt-output** carries `constraints_applied: [id, ...], constraint_violations: [], constraint_fix_rounds: N` for traceability.

**Differs from Stage 2.5 (Latent Style Mixing):** Stage 2.5 produces a continuous *visual* blend. Stage 2.6 imposes *categorical* hard rules on top. They compose: a blend can carry constraints (e.g. "70% Swiss / 30% Liminal, no-gradients, single-typeface").

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
4. **Round 2+ adds anti-pattern context (Sprint 16):** `hooks/scripts/lib/anti-pattern-context.mjs::buildAntiPatternContext` reads top-10 most recent accepted entries from `taste/facts.jsonl` and injects an explicit instruction telling the critic NOT to reward convergence toward already-accepted patterns. Empty/missing facts → fallback to global priors. Caps at 1500 tokens, cached per round+mtime.
5. **Round 2+ adds 9th critic (Sprint 16):** `agents/critic-originality.md` scores `originality_vs_history` — similarity to user's accepted history (DINOv2 if Sprint 11 active, else 8D-aesthetic-embedding cosine fallback). Score = `10 - max_similarity*10`. Round 1 returns null. Default arbitration weight 0.8. Reports top-3 collisions for user transparency.
6. If any dimension scores below 7/10, the agent returns `top_3_fixes`; Claude applies them and the loop runs again (max 3 rounds)
7. Convergence abort: if round N score < round N-1 by >0.3, set `convergence_signal:true` and stop
8. Final scores are shown to the user as a design quality receipt

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

### Stage 6 — Runtime Context (Sprint 23)
**Activates when:** `/visionary-patina` is invoked OR the generation includes `--runtime-context <module,...>` OR the active product-archetype matches an opt-in profile (e.g. editorial sites get `circadian` by default; data-heavy dashboards get `network-aware`).

Stage 6 is opt-in client-side runtime — modules executing in the user's browser AFTER the component is delivered. Unlike Stages 1-5 which run at generation-time, Stage 6 emits small JS modules attached to the component that subscribe to ambient signals and adapt visual properties live.

The runtime catalogue (`hooks/scripts/lib/runtime/`) currently ships:

1. **Circadian** (`circadian.mjs`) — reads local clock + (optional) geolocation sunrise/sunset. Adjusts color temperature, base luminance, and motion-tier across the day. Default emits a CSS custom-property tween (`--vn-circadian-warmth`) hooked to oklch hue offsets in the generated palette. Respects `prefers-reduced-motion` for tween duration.
2. **Network-aware** (`network-aware.mjs`) — uses `navigator.connection` (effectiveType / saveData) to gate expensive motion (`Kinetic` → `Subtle`) and disable autoplay video / heavy backdrop-filter on 2G/3G or `Save-Data` headers.
3. **Patina** (`patina.mjs`) — accumulates per-element wear-state in `localStorage` (visit-count, hover-time, last-interaction). Subtly tints / softens / desaturates frequently-used UI to give long-running products a "lived-in" feel. Bounded — patina caps at a configurable ceiling so contrast never breaches APCA Lc floors.
4. **Coordinator** (`coordinator.mjs`) — orchestrates the above, prevents conflicts (e.g. circadian dimming + patina desaturation simultaneously breaching Lc 75), and emits a single batched `requestAnimationFrame` write per tick.

**Receipt-output** carries `runtime_modules: [id, ...], runtime_bundle_size_kb: N` for traceability. The generated module is suffixed with `.visionary-runtime.{module}.js` so users can strip the runtime layer without touching the component.

**Privacy:** all runtime state is local to the user's browser. No telemetry. Opt-out: omit `--runtime-context` and the modules are not emitted.

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
| `partials/verbalized-sampling.md` | Stage 1.5: when VS enabled (default) |
| `schemas/verbalized-sampling.schema.json` | Stage 1.5: VS output validation |
| `anti-typicality.json` | Stage 1.5 + Stage 4: config (env-overridable) |
| `palette-tokens.json` | Stage 2.5: palette resolution from blended vector |
| `typography-matrix.json` | Stage 2.5: typography resolution from (type_drama, formality) |
| `styles/_embeddings.json` | Stage 2.5: 8D anchor lookup for slerp |
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
| `constraints.md` | Stage 2.6: catalogue overview when constraint-injection activates |
| `constraints/<id>.md` | Stage 2.6: per-constraint manifest (load only resolved IDs, not the whole directory) |
| `priors/global-aesthetic-history.json` | Stage 1.5 + Stage 2.5: prior distribution for verbalized sampling and blend resolution when local taste is sparse |
| `hooks/scripts/lib/photo/from-photo-pipeline.mjs` | Sprint 18: when `/visionary-from-photo` invoked — palette + edge + mood inference from reference image |
| `hooks/scripts/lib/audio/from-track-pipeline.mjs` | Sprint 19: when `/visionary-from-track` invoked — tempo/valence/arousal → motion tier + Russell quadrant |
| `hooks/scripts/lib/audio/tempo-to-motion.mjs` | Sprint 19: BPM → motion-tier mapping after track analysis |
| `hooks/scripts/lib/cinematic/lut-presets.json` | Sprint 20: 12 director-pack LUT definitions for `/visionary-cinematic` and `--cinematic-grade` |
| `hooks/scripts/lib/cinematic/lut-to-filter.mjs` | Sprint 20: LUT → CSS filter / SVG color-matrix translator |
| `hooks/scripts/lib/constraints/inject.mjs` | Stage 2.6: resolve + inject constraint-set into Stage 3 prompt |
| `hooks/scripts/lib/constraints/validate.mjs` | Stage 2.6: post-render DOM/CSS validation against constraint invariants |
| `hooks/scripts/lib/coined-styles.mjs` | Sprint 21B: append-and-promote logic for `taste/coined-styles.jsonl` (3+ acceptances → `styles/extended/`) |
| `hooks/scripts/lib/flow/multi-screen-orchestrator.mjs` | Sprint 22A: when `/visionary-flow` invoked — coordinate cross-screen consistency |
| `hooks/scripts/lib/flow/cross-screen-critique.mjs` | Sprint 22A: cross-screen critic for landing → app → settings drift |
| `hooks/scripts/lib/voice/voice-to-motion.mjs` | Sprint 22B: when `/visionary-voice` invoked — mic input → motion-tier delta |
| `hooks/scripts/lib/runtime/coordinator.mjs` | Stage 6: when runtime context activates — orchestrates circadian / network / patina |
| `hooks/scripts/lib/runtime/circadian.mjs` | Stage 6: time-of-day color/luminance/motion adaptation |
| `hooks/scripts/lib/runtime/network-aware.mjs` | Stage 6: connection-quality motion gating (`navigator.connection`) |
| `hooks/scripts/lib/runtime/patina.mjs` | Stage 6: per-element wear-state in `localStorage` for "lived-in" UI |

Never load all style category directories simultaneously. Load only the identified category.

---

## Commands

The plugin ships a set of slash-commands that complement the base `/visionary` invocation. Each delegates into a specific stage of the pipeline.

| Command | Sprint | Purpose | Pipeline-stage |
|---|---|---|---|
| `/visionary` | core | Generate a UI component from a brief. Default entry. | Stages 1-5 |
| `/variants` | core | 3 distinct aesthetic takes before critique. | Stage 1-3 ×3 |
| `/visionary-mood <coords|text>` | 17 | Drive style selection via Russell mood mapping (numeric `0.8,0.2` or text `calm-melancholic`). | Stage 2.5 |
| `/visionary-from-photo <path|url>` | 18 | Infer palette, edge density, and mood from a reference image; feed StyleBrief. | Stage 1 (inference yta) |
| `/visionary-from-track <path|url|spotify>` | 19 | Infer tempo, valence, arousal from audio; map to motion tier + Russell quadrant. | Stage 1 (inference yta) |
| `/visionary-cinematic <director>` | 20 | Apply one of 12 cinematic director-packs (Kubrick, Wong Kar-wai, Anderson, Fincher, Lynch, …). Also exposed as `--cinematic-grade <id>`. | Stage 2 + Stage 3 (LUT) |
| `/visionary-coined <name>` | 21B | Promote a coined-style blend (3+ acceptances in `taste/coined-styles.jsonl`) to `styles/extended/` as a named anchor. | Cross-cutting (taste) |
| `/visionary-flow <screens>` | 22A | Multi-screen orchestrator + cross-screen critic for consistency across landing → app → settings. | Stage 1-5 ×N + cross-critic |
| `/visionary-voice` | 22B | Microphone-driven motion calibration — adjusts motion-tier on the latest component from voiced energy. | Stage 3 (re-tune) |
| `/visionary-patina <modules>` | 23 | Emit Stage 6 runtime modules (`circadian`, `network-aware`, `patina`) attached to the component. | Stage 6 |
| `/visionary-motion` | core | Re-tune motion tokens on the most recent component using natural language. | Stage 3 (re-tune) |
| `/visionary-kit` | core | Manage `visionary-kit.json` content kits — realistic data shapes, constraints, and states. | Cross-cutting |
| `/visionary-taste` | core | Inspect, debug, and manage the taste profile (facts + pairs + aging). | Cross-cutting |
| `/annotate` | core | Accept browser-annotated feedback on a rendered page; translate to Claude-actionable edits. | Stage 4 (re-entry) |
| `/apply` | core | Lock the chosen style across the entire product; export tokens; rewrite all routes/components consistently. | Cross-cutting |
| `/designer <name>` | core | Bias style selection toward a named designer's vocabulary. | Stage 1 |
| `/import-artifact` | core | Import a Claude.ai Artifact, re-skin with the project's locked style, drop into the right source location. | Stage 1-5 (rewrite) |

All commands accept `--no-vs` to skip Stage 1.5 verbalized sampling, `--blend "id1:w1 + id2:w2"` to force a Stage 2.5 blend, and `--constraint <id>` / `--constraints <ids>` to inject Stage 2.6 hard invariants.

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
