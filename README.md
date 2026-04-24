<div align="center">
<img src="docs/visionary-hero.svg" alt="Visionary for Claude Code — 202 design styles, 8-step algorithm, motion-first, axe-core critique, 18.35/20 benchmark" width="100%"/>
</div>

<br/>

# visionary-claude

[![Release](https://img.shields.io/badge/RELEASE-stable-blue?style=flat-square)](https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/releases)
[![Version](https://img.shields.io/badge/v1.3.0-green?style=flat-square)](https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code)
[![Design Styles](https://img.shields.io/badge/DESIGN_STYLES-202-orange?style=flat-square)](#design-catalogue)
[![Stacks](https://img.shields.io/badge/STACKS-15-purple?style=flat-square)](#frameworks-supported)
[![Languages](https://img.shields.io/badge/LANGUAGES-20+-teal?style=flat-square)](#language-support)
[![Benchmark](https://img.shields.io/badge/BENCHMARK-18.35%2F20_(n%3D10)-yellow?style=flat-square)](results/)
[![License](https://img.shields.io/badge/LICENSE-Apache_2.0-red?style=flat-square)](LICENSE)

[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-black?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48L3N2Zz4=)](https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code)
[![No Python](https://img.shields.io/badge/Python-NOT_REQUIRED-brightgreen?style=flat-square)](#requirements)
[![WCAG 2.2 AA + APCA](https://img.shields.io/badge/WCAG_2.2_AA-+_APCA-blue?style=flat-square)](#accessibility)
[![DTCG 1.0](https://img.shields.io/badge/DTCG_1.0-tokens-blueviolet?style=flat-square)](tokens/)
[![PayPal](https://img.shields.io/badge/PayPal-Support-blue?style=flat-square&logo=paypal)](https://www.paypal.com/donate/?business=BMNFKYM6BU3KG&no_recurring=0&item_name=Utveckling+av+mjukvara+och+Claude+Code+ekosystem&currency_code=USD)
[![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-ea4aaa?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/gitwebb)

A Claude Code plugin that provides **design intelligence** for building distinctive, motion-first UI across 15 frameworks. Generates, critiques (axe-core-instrumented), and learns from your preferences over time.

> **Current benchmark transparency**: the published 18.35/20 number
> reflects a partial run (10 of 100 prompts, one sample per prompt) —
> see [`results/README.md`](results/README.md) for the honest breakdown.
> A full 100/100 run is the next release target; the infrastructure
> (adapters, headless runner) landed in v1.3.1 under
> [`benchmark/adapters/`](benchmark/adapters/). Motion Readiness was the
> weakest dimension (3.55/5) in that partial run and is explicitly
> addressed in the v1.3.1 Output Contract motion floor.

---

<div align="center">

### Design Intelligence for Claude Code

**202 design styles**, an **8-step selection algorithm**, **motion-first code** (Motion v12 + CSS-first), a **visual feedback loop** (Playwright + axe-core) that learns from your preferences, **DTCG token export** so the output flows into Figma Variables / Style Dictionary / Penpot / Tokens Studio, and a published benchmark that scored Visionary **18.35 / 20 (n=10, 10 categories × 1 prompt)** against a generic-slop baseline of **12.60**. A full n=100 run is the next benchmark target — see [`results/README.md`](results/README.md) for the partial-run caveat.

Built for Next.js 16 | React 19 | Vue 3 | Nuxt 3 | Svelte 5 | Angular | Astro | SolidJS | Lit | Laravel | Flutter | SwiftUI | Jetpack Compose | React Native | Vanilla JS

</div>

---

<div align="center">

| | | | | | | |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **202** | **8** | **15** | **13** | **26** | **20+** | **3** |
| Design Styles | Algorithm Steps | Frameworks | Categories | Slop Detectors | Languages | Critique Rounds |

</div>

---

## If you find this useful, consider supporting the project:

<div align="center">

[![PayPal](https://img.shields.io/badge/PAYPAL-Donate-blue?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/donate/?business=BMNFKYM6BU3KG&no_recurring=0&item_name=Utveckling+av+mjukvara+och+Claude+Code+ekosystem&currency_code=USD)
[![GitHub Sponsors](https://img.shields.io/badge/GITHUB-Sponsor-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/gitwebb)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/gitwebb)

</div>

---

## What makes it different

| Feature | frontend-design (Anthropic) | UI/UX Pro Max | 21st.dev Magic | Claude Design (Anthropic) | **visionary-claude** |
|---------|------|------|------|------|------|
| Design styles | ~15 implicit | 67 named | Component-level only | Inferred from codebase | **203 with auto-inference** |
| Style selection | Manual / prompt-based | Manual name entry | Multi-variant picker | Prompt + Figma/code sync | **8-step algorithm + weighted random + transplantation** |
| Anti-default bias | None | None | Partial | Partial | **Blocks generic AI output, forces cross-domain styles** |
| Motion system | None | None | None | None (prototype-oriented) | **Motion v12 spring tokens + CSS-first (`@starting-style`, `animation-timeline`)** |
| Visual feedback | None | None | None | Inline comments in canvas | **Playwright critique + axe-core (deterministic a11y)** |
| Taste memory | None | None | None | None | **`system.md` calibration — permanent flag after 3 rejections** |
| Accessibility | Not enforced | Not enforced | Not enforced | Not enforced | **WCAG 2.2 AA + APCA Lc floors + CSS logical properties + RTL** |
| i18n typography | ASCII only | ASCII only | ASCII only | ASCII only | **20+ languages with correct diacritics + proper lang/subset** |
| Multi-variant | No | No | Yes | Yes (canvas revisions) | **`/variants` — 3 mutually-distinct takes before critique** |
| Consistency lock | No | No | No | Figma-driven | **`/apply` — lock a style across the app, emit DTCG tokens** |
| Token export | None | None | None | Figma variables only | **DTCG 1.0 `.tokens.json` per style (Figma / Style Dictionary / Penpot ready)** |
| Python required | No | **Yes (bugs on Windows)** | No | Cloud (web app) | **No — Node 18+ only** |
| Works inside existing repo | Yes | Yes | Yes | Export only (Canva/PDF/HTML) | **Yes — edits files in-place** |

### How is this different from Claude Design?

Anthropic launched **Claude Design** on 17 April 2026 as a web-app
prompt-to-prototype tool inside Claude.ai. It overlaps with
`visionary-claude` in goal but not in shape:

- **Claude Design** is best at: prompt → first-draft visual in a web
  canvas, inline refinement sliders, export to Canva / PDF / PowerPoint /
  HTML, handoff to Claude Code for implementation.
- **visionary-claude** is best at: working inside an existing codebase,
  deterministic accessibility scoring, motion-token discipline, DTCG
  token export for design-system work, and learning your taste across
  sessions so the same prompt stops converging on whatever it converged
  on last week.

They are complementary, not substitutes. A realistic workflow is:
sketch in Claude Design → export HTML → open the project in Claude Code
→ re-skin with `/apply <visionary-style>` → iterate.

---

## Quick start

### Install from GitHub

```bash
claude plugin marketplace add GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code
claude plugin install visionary-claude
```

### Install from local directory

```bash
claude plugin marketplace add /path/to/visionary-claude
claude plugin install visionary-claude
```

### Session-only (no install)

```bash
claude --plugin-dir /path/to/visionary-claude
```

### Verify

In a Claude Code session, describe any UI task or use one of:

- `/visionary` — generate a single component via the full 8-step algorithm
- `/variants` — generate 3 mutually-distinct takes, pick one
- `/apply` — lock a chosen style across the whole product + emit DTCG tokens

---

## How it works

### Five-stage pipeline

1. **Context Inference** — Detects language, product type, audience, brand archetype, and tone from your prompt. Runs the 8-step selection algorithm to pick a style from 189 candidates.

2. **Design Reasoning Brief** — Shows the selected style, runner-up alternatives with probability weights, and the scoring logic before generating code. You can redirect or say "try #2 instead".

3. **Motion-First Code** — Every component ships with Motion v12 spring tokens (`bounce` + `visualDuration`) via `motion/react`, plus CSS-first escapes (`@starting-style`, `animation-timeline: view()`, cross-document View Transitions). All motion gated on `prefers-reduced-motion` AND pause-controlled for anything > 5s (WCAG 2.2.2).

4. **Visual Critique Loop** — Playwright screenshots the rendered output at 1200×800 (+ 375 mobile if responsive), injects `axe-core` for deterministic accessibility scoring, and runs the visual-critic agent on 8 dimensions: Hierarchy, Layout, Typography, Contrast (WCAG + APCA), Distinctiveness, Brief Conformance, Accessibility (60% axe-weighted), Motion Readiness. Detects 26 slop patterns (20 deterministic + 6 vision-based). Runs up to 3 rounds. Fresh-context SELF-REFINE pattern per round. Aborts on > 0.3 regression.

5. **Taste Calibration** — Reject a style and `system.md` records it. Approve a style and it gets reinforced. After 3 rejections of the same direction, the style is **permanently flagged** and excluded from the candidate set.

### 8-step selection algorithm

```
202 styles
  | Step 1: Category filter (product type → 3–4 categories)
 ~40 styles
  | Step 2: Motion tier filter (Static | Subtle | Expressive | Kinetic)
 ~20 styles
  | Step 2.5: Component type compatibility filter
 ~14 styles
  | Step 3: Blocked default removal (fintech-trust, saas-b2b-dashboard, dark+gradient)
 ~10 styles
  | Step 4: Explicit scoring rubric (5 signals × 1–5)
  | Step 4.5: Taste profile adjustment (from system.md — permanent-flag respect)
 Top 5
  | Step 5: Context-aware transplantation bonus (+0% to +35%)
  | Step 6: Variety penalty (session + cross-session with 7-day decay)
 Top 3
  | Step 7: Weighted random selection
 Winner
```

**Key properties:**
- Same prompt can produce different styles across users (weighted random)
- Cross-domain transplantation is systematically preferred over obvious matches
- Generic styles (fintech-trust, saas-b2b-dashboard, dark-mode+gradient) are blocked
- Recently-used styles decay over 7 days before becoming eligible again
- User rejections and approvals persist and influence future selections
- Permanently-flagged styles are excluded from both single-pick and `/variants` outputs

---

## 202 design styles

| Category | Count | Examples |
|----------|------:|---------|
| Morphisms | 14 | Glassmorphism, **Liquid Glass iOS 26**, **Neobrutalism Softened**, Holographic |
| Internet aesthetics | 18 | Vaporwave, Y2K Futurism, Cyberpunk Neon, Dark Academia, Dreamcore |
| Historical movements | 19 | Bauhaus, **Swiss Gerstner**, **Swiss Müller-Brockmann**, **Swiss Crouwel Gridnik**, Art Deco |
| Contemporary UI | 17 | Bento Grid, **Ambient Copilot**, **Dyslexia-Friendly**, **APCA-Native Contrast** |
| Typography-led | 15 | Kinetic Type, **Kinetic Typography v2**, **Editorial Serif Revival**, **COLR v1 Color Type** |
| Industry-specific | 16 | Fintech Trust, Bloomberg Terminal, Medtech Clinical, Gaming |
| Emotional / psychological | 13 | Dopamine Design, Zen Void, Luxury Aspirational, **Calm / Focus Mode** |
| Material / texture | 10 | Paper Editorial, Concrete Brutalist, Metal Chrome, Glass Crystal |
| Futurist / sci-fi | 16 | Sci-Fi HUD, Biomorphic Futurism, Quantum Particle, Retrofuturism |
| Cultural / regional | 11 | Scandinavian Nordic, Japanese Minimalism, K-Design, Guochao, Arabic Calligraphic |
| Hybrid / cross-domain | 14 | Fashion Editorial, **Chaos Packaging Collage**, **Recombinant Hybrid**, Zine DIY |
| Extended | 39 | Grainy Blur, **Cassette Futurism**, **Bauhaus Dessau**, **Bauhaus Weimar**, **Default Computing Native**, **Dopamine Calm** |

All styles support **transplantation** — applying a style outside its native domain (e.g., newspaper grid applied to accounting software) for distinctive, memorable results. Each style has YAML frontmatter with `category`, `motion_tier`, `density`, `locale_fit`, `palette_tags`, `keywords`, and `accessibility` floors.

---

## New in v1.3 (this release)

- **13 new styles** tuned for 2026 design movements: `liquid-glass-ios26`, `ambient-copilot`, `calm-focus-mode`, `editorial-serif-revival`, `cassette-futurism`, `dyslexia-friendly`, `chaos-packaging-collage`, `kinetic-typography-v2`, `neobrutalism-softened`, `recombinant-hybrid`, `colr-v1-color-type`, `apca-native-contrast`, `swiss-gerstner`, `swiss-muller-brockmann`, `swiss-crouwel-gridnik`, `bauhaus-dessau`, `bauhaus-weimar`, `default-computing-native`, `dopamine-calm` — and 3 weak legacy files fully re-written (`concrete-brutalist-material`, `leather-craft`, `white-futurism`, `fabric-textile`, `zine-diy`).
- **Motion v12 default** — two-parameter springs (`bounce` + `visualDuration`), native oklch/color-mix animation, `linear()` easing snippets, CSS-first escapes (`@starting-style`, `animation-timeline: view()`, cross-document View Transitions for MPA stacks).
- **Framework modernization** — Next.js 16 Cache Components + React Compiler stable + `<Form>`, Tailwind v4 `@theme` dual-emitter (v3 fallback), Base UI vs Radix primitive-layer detection, DTCG 1.0 `.tokens.json` detection.
- **DTCG token export** — `scripts/export-dtcg-tokens.mjs` emits W3C DTCG 1.0 tokens per style (`tokens/{style-id}.tokens.json`); consumable by Figma Variables, Style Dictionary v4, Penpot, Knapsack.
- **shadcn registry publication** — `scripts/build-shadcn-registry.mjs` emits 202 `registry:style` items at `registry/r/{id}.json` so users can run `npx shadcn@latest add https://{host}/r/{style-id}.json`. `scripts/reskin-shadcn-block.mjs` re-skins shadcn community blocks with any Visionary style.
- **axe-core grounded critique** — `skills/visionary/axe-runtime.js` injected via Playwright's `browser_evaluate`; Accessibility dimension weighted 60 % axe / 40 % heuristic. APCA Lc floors alongside WCAG 2.x via `scripts/apca-validator.mjs`.
- **Open benchmark** — `benchmark/` ships 100 prompts × 10 categories × 4 dimensions, a source-level scorer, and a runner. First published run: **Visionary 18.35 / 20 vs generic-slop baseline 12.60 / 20, delta +5.75**. Results in `results/`.
- **Named-designer taste packs** — 5 opt-in packs (Rams, Kowalski, Vignelli, Scher, Greiman) with blend support, via `/designer` command.
- **New commands** — `/variants` (3 mutually-distinct takes), `/apply` (lock style across app + emit tokens), `/designer` (named-designer bias), `/annotate` (Design Mode parity: browser pins → code edits), `/import-artifact` (Claude.ai Artifact → codebase pipeline).
- **Cross-platform hooks** — migrated from Bash to Node.js 18+ (`.mjs`); works on Windows / macOS / Linux without `xxd`, `md5sum`, or `sed` divergence. All three hooks read stdin JSON per the official Claude Code hooks spec.
- **Slop pattern #26** — neon-on-dark without thematic justification — catches the AI-default "dark dashboard + cyan accents" leaking past the anti-default filter.
- **Jurisdictional compliance** — ADA Title II (24 April 2026), EAA active enforcement (France DGCCRF, Germany €500k, Netherlands €900k / 10 %), Section 508, UK PSBAR, AODA, JIS X 8341 — full matrix in `SKILL.md`.
- **Background auto-update** — a `SessionStart` hook runs `claude plugin marketplace update` + `claude plugin update visionary-claude` at most once per 24h, so future releases reach you automatically. New versions activate on the next Claude Code restart. Opt out with `VISIONARY_NO_AUTOUPDATE=1`. Release flow documented in `docs/RELEASE.md`.

---

## Language support

The plugin detects language from your prompt and enforces correct rendering:

- **Correct diacritics**: "Bokföring", "Über", "Français", "Niña", "Çağ" — stripped diacritics are a blocking defect, critique cannot pass
- **Font subsets**: Google Fonts URLs automatically include `latin-ext`, `cyrillic`, `greek` for European languages
- **HTML lang attribute**: Set correctly based on detected language
- **CSS logical properties**: All generated CSS uses `margin-inline`, `padding-inline`, `border-inline-*` — Arabic/Hebrew/Persian just work
- **20+ languages**: Swedish, Finnish, Norwegian, Danish, German, French, Spanish, Portuguese, Polish, Czech, Turkish, Icelandic, Romanian, Russian, Japanese, Korean, Chinese (Simplified/Traditional), Arabic, Hebrew, Hindi, English

---

## Component type awareness

The algorithm filters styles based on what you are building:

| Component | Removes incompatible styles |
|---|---|
| Dashboard | zen-void, big-bold-type, psychedelic, dreamcore |
| Data table | handwritten-gestural, dada, moodboard-collage |
| Form | newspaper-broadsheet, glitchcore |
| Settings / Admin | art-nouveau (ornament conflicts with utility) |
| Long-form reading | terminal-cli, bloomberg-terminal, data-dense styles |
| Hero / Landing | All styles compatible |

---

## Accessibility

Every generated component is **WCAG 2.2 AA + APCA** by construction:

- Body text ≥ 4.5:1 contrast AND APCA Lc ≥ 75
- Large text / UI labels ≥ 3:1 AND Lc ≥ 60
- Touch targets **44×44 px default** (drops to 24 only for documented dense-UI styles like `bloomberg-terminal`, `terminal-cli`, `data-visualization`)
- `:focus-visible` rings using `Canvas` / `AccentColor` system colors (auto-adapts to Windows High Contrast + forced-colors)
- `prefers-reduced-motion: reduce` degrades transform → opacity-only
- Any autoplay motion > 5 s requires a pause control (WCAG 2.2.2 Level A)
- CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline-*`) by default — RTL locales work without a fork
- ARIA 1.3 primitives (`role="suggestion"`, `aria-description`, `aria-braillelabel`) where applicable
- `axe-core` runs deterministically in the critique loop — catches 30–50 % of WCAG violations before the human sees them

---

## Frameworks supported

- Next.js 16 (Cache Components default + stable React Compiler)
- React 19
- Vue 3 (Composition API)
- Nuxt 3
- Svelte 5 (runes)
- Angular
- Astro (cross-document View Transitions)
- SolidJS
- Lit
- Laravel (Blade + Alpine + Livewire)
- Flutter (Material 3, spring animations)
- SwiftUI (.animation(.spring()))
- Jetpack Compose (Material3, Modifier.semantics)
- React Native (Reanimated v3 worklets)
- Vanilla JS (Web Animations API)

Framework detection runs automatically at session start via `hooks/scripts/detect-framework.mjs`. Detects Tailwind v3 vs v4, Base UI vs Radix, DTCG tokens.json, and Motion v12 vs legacy.

---

## DTCG token export

Every style in the catalogue has a matching DTCG 1.0 token file under `tokens/`. Use them directly in:

- **Figma Variables** — paste or upload the `.tokens.json` file (November 2026 release adds native DTCG import/export)
- **Style Dictionary v4** — register as a source, emit CSS / Swift / Kotlin / XAML output
- **Penpot** — import via design-tokens panel
- **Tokens Studio** — drag-in the JSON

```bash
# Re-generate token files (run after editing styles)
node scripts/export-dtcg-tokens.mjs
```

---

## Requirements

- Claude Code >= 1.0.0
- Node.js >= 18
- No Python dependency

---

## Documentation

- [Installation guide](docs/installation.md) — GitHub, local, session-only, enterprise/air-gapped
- [End-to-end tests](docs/e2e-tests.md) — 5 acceptance test scenarios
- [Content kits](docs/content-kits.md) — `visionary-kit.json` for generations that survive real data (Sprint 07)
- [Taste dotfile spec](docs/taste-dotfile-spec.md) — `.taste` file format for shareable taste profiles (Sprint 07)
- [Taste index](docs/taste-index.md) — community-hosted profile registry and the `/visionary-taste browse` + `import` flow

---

## Contributing

Contributions welcome. Open an issue before submitting a pull request for non-trivial changes.

**Style contributions** should follow the format of existing files under `skills/visionary/styles/` and include:

- YAML frontmatter (`id`, `category`, `motion_tier`, `density`, `locale_fit`, `palette_tags`, `keywords`, `accessibility`)
- Core sections: Typography, Colors, Motion, Spacing, Code Pattern, Accessibility, Slop Watch
- A filesystem-matching `category` (the top-level directory under `styles/`)

Each style must pass its own contrast floor, declare its reduced-motion behavior, and justify its typographic + color choices (the best style files in the catalogue are philosophically motivated, not just value-listing).

---

## License

[Apache 2.0](LICENSE)

---

<div align="center">

Built by **GIT Webb & App Studio AB**, Malmö, Sweden.

Free and open source.

[![PayPal](https://img.shields.io/badge/PayPal-Donate-blue?style=flat-square&logo=paypal)](https://www.paypal.com/donate/?business=BMNFKYM6BU3KG&no_recurring=0&item_name=Utveckling+av+mjukvara+och+Claude+Code+ekosystem&currency_code=USD)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-ea4aaa?style=flat-square&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/gitwebb)

</div>
