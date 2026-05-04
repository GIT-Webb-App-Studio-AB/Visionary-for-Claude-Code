<div align="center">
<img src="logo visionary.png" alt="Visionary for Claude Code Logo" width="50%"/>
<img src="docs/visionary-hero.svg" alt="Visionary for Claude Code — 202 design styles, 8-step algorithm, motion-first, axe-core critique, 18.35/20 benchmark" width="100%"/>
</div>

<br/>

# visionary-claude

[![Release](https://img.shields.io/badge/RELEASE-stable-blue?style=flat-square)](https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/releases)
[![Version](https://img.shields.io/badge/v1.5.2-green?style=flat-square)](https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/releases/tag/v1.5.2)
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

## What's new in v1.5.x

The 1.5.x line builds on Sprint 1–15 with the structural-integrity gate
(v1.5.0) and two storage-convention fixes (v1.5.1 + v1.5.2). All
additions are dependency-free, toggleable via env, and backed by 308
unit tests across hooks, scripts, and the MCP server.

- **v1.5.2** (hotfix) — `.visionary/traces/` and `.visionary/pareto/`
  now honour `CLAUDE_PLUGIN_DATA` instead of polluting the user's
  project root. Pairs with v1.5.1; together the plugin creates zero
  folders in the user's repo by default.
- **v1.5.1** — taste data (`facts.jsonl`, `pairs.jsonl`,
  `accepted-examples.jsonl`) defaults to
  `${CLAUDE_PLUGIN_DATA}/taste/<project-slug>/` per the official
  Claude Code plugin convention. Backward-compatible four-tier
  resolution policy. Force in-repo storage with
  `VISIONARY_TASTE_IN_REPO=1` for shared team profiles.
- **v1.5.0** — Structural-Integrity Gate. Six hard-fail checks
  (`duplicate-heading`, `exposed-nav-bullets`, `off-viewport-right`,
  `footer-grid-collapse`, `empty-section`, `heading-hierarchy-skip`)
  plus one warning (`mystery-text-node`) catch structural defects that
  slipped past slop / motion / visual gates. Per-style opt-out via
  `allows_structural` frontmatter. Toggle:
  `VISIONARY_ENABLE_STRUCTURAL_GATE=0`.

### Sprint 1–15 — quality lift on the 1.3.1 baseline

Roadmap + per-sprint details: [`docs/sprints/README.md`](docs/sprints/README.md).
Full release history: [`CHANGELOG.md`](CHANGELOG.md).

**Sprints 1–4 — cost + measurable quality.** Styles index
(`_index.json`) + 8-axis embeddings short-circuit the LLM call for
selection stages 1–3. Diff-based round 2/3 instead of full
regenerations. Numeric aesthetic scorer (Shannon entropy on CIELAB L,
DBSCAN gestalt, ΔE2000 colour harmony) feeds the critic. Best-of-N
fan-out + orthogonal `/variants` (cosine ≥ 0.6 in 8-axis space)
guarantee distinctiveness. Baseline-2026 web primitives (`@layer`,
`@scope`, popover/anchor, `field-sizing`, `contrast-color()`) baked
into every generation.

**Sprints 5–7 — taste flywheel.** Active rejection/approval extraction
→ `facts.jsonl`. Passive git-harvest classifies `.visionary-generated`
files as kept / heavy-edit / deleted. Pairwise `/variants` picks →
`pairs.jsonl` (FSPO few-shot). DesignPref RAG injects top-3 historical
anchors into the critic prompt. Multi-agent critic (craft + aesthetic,
opt-in via `VISIONARY_MULTI_CRITIC=1`). Trace observability under
`.visionary/traces/`. Shareable `.taste` dotfiles. Content kits
(`visionary-kit.json`) drive the `content_resilience` dimension.

**Sprint 8 — distinctiveness.** Hard slop-reject gate (≥ 2 patterns
block generation *before* the critic runs), 21 curated avoid/consider
directives, per-style `allows_slop` whitelist, negative visual anchors
sampled per generation. The dogfooding fix for "output converging
with UI/UX Pro Max + Claude Design".

**Sprints 9, 11, 12 — critique signal upgrades.** Motion Scoring 2.0
(6-sub-dim Maturity Model: None / Subtle / Expressive / Kinetic /
Cinematic). DINOv2-small ONNX visual embeddings (opt-in,
`VISIONARY_VISUAL_EMBED=1`). MLLM Judge tie-breaker (Sonnet 4.6,
budget-capped, opt-in via `VISIONARY_MLLM_JUDGE=tie-only|on`).

**Sprint 10 — distribution.** `@visionary/mcp-server` extracts the
deterministic core for Cursor / Windsurf / Cline / Zed. Three tools
(`slop_gate`, `motion_score`, `validate_evidence`), three resources,
two prompts. MCP spec 2025-06-18. Hooks + taste-flywheel writes stay
in the Claude Code plugin — only read access flows over MCP.

**Sprints 13–15 — editing + governance + designer-as-subagent.**
`/visionary-motion "<intent>"` re-tunes motion tokens via NL →
adjustments. Husky pre-commit + GitHub Action enforce locked DTCG
tokens. Designer packs (Rams, Kowalski, Vignelli, Scher, Greiman)
gain `critic_persona` + `arbitration` blocks that argue per-dimension
during the critique loop.

### Env-flag reference

| Flag | Default | Purpose |
|---|---|---|
| `VISIONARY_DISABLE_CRITIQUE` | off | Full opt-out of the critique loop |
| `VISIONARY_DISABLE_BON` | off | Disable Best-of-N fan-out (Sprint 4) |
| `VISIONARY_DISABLE_TASTE` | off | Opt-out of taste flywheel (Sprint 5+6) |
| `VISIONARY_TASTE_IN_REPO` | off | Force taste storage to `<project-root>/taste/` (v1.5.1+) |
| `VISIONARY_NO_TRACES` | off | Opt-out of trace logging (Sprint 6) |
| `VISIONARY_TRACE_RETENTION_DAYS` | 90 | Trace-file auto-delete age |
| `VISIONARY_MULTI_CRITIC` | off | Enable critic-craft + critic-aesthetic parallel mode (Sprint 6) |
| `VISIONARY_RAG_MIN_EXAMPLES` | 5 | Threshold for RAG activation (cold-start below this) |
| `VISIONARY_DESIGNER_DEFAULT` | `rams` | Cold-start designer pack (`rams` / `kowalski` / `vignelli` / `scher` / `greiman`) |
| `VISIONARY_SLOP_REJECT_THRESHOLD` | 2 | Slop-gate reject threshold (Sprint 8); ≥ 26 disables |
| `VISIONARY_MOTION_SCORER_V2` | on | Set `0` to fall back to the v1 single-shot motion scorer (Sprint 9) |
| `VISIONARY_VISUAL_EMBED` | **off** | Set `1` or `on` to enable DINOv2 `visual_style_match` dimension (Sprint 11). Requires manual setup |
| `VISIONARY_MLLM_JUDGE` | off | `tie-only` or `on` to enable MLLM judge tie-breaking (Sprint 12) |
| `VISIONARY_ENABLE_STRUCTURAL_GATE` | on | Set `0` to disable the structural-integrity gate (v1.5.0) |
| `VISIONARY_NO_AUTOUPDATE` | off | Disable the once-per-24h SessionStart marketplace update |
| `VISIONARY_PREVIEW_URL` | `http://localhost:3000` | Playwright target URL |

Migration impact: nothing in the 1.3.1 public behaviour changes
automatically. Multi-critic mode, MLLM judge, and DINOv2 visual
embeddings are opt-in. The pipeline degrades gracefully when any
optional component is absent.

---

## What makes it different

The Claude Code design ecosystem has five distinct offerings — they
look similar from a prompt but operate at very different layers:

- **`frontend-design`** — Anthropic's general-purpose design skill
  bundled with Claude Code (in-CLI, code-emitting).
- **`interface-design`** — Anthropic's superpowers plugin focused on
  dashboards / admin / data-tooling specifically (in-CLI, code-emitting).
- **`UI/UX Pro Max`** — third-party Claude Code plugin with 67 styles
  + shadcn-MCP integration (in-CLI, code-emitting).
- **`Claude Design`** — Anthropic's web-app at claude.ai/design
  (browser canvas, prompt → prototype → export).
- **`visionary-claude`** (this plugin) — 202 styles + Playwright
  critique loop + taste flywheel + DTCG token export (in-CLI,
  code-emitting).

| Feature | frontend-design | interface-design | UI/UX Pro Max | 21st.dev Magic | Claude Design | **visionary-claude** |
|---------|------|------|------|------|------|------|
| Surface | CLI plugin | CLI plugin | CLI plugin | CLI plugin | Web app | CLI plugin |
| Design styles | ~15 implicit | ~12 dashboard-focused | 67 named | Component-level only | Inferred from canvas | **202 with auto-inference** |
| Style selection | Manual / prompt-based | Prompt-based | Manual name entry | Multi-variant picker | Prompt + iterate | **8-step algorithm + weighted random + transplantation** |
| Anti-default bias | None | None | None | Partial | Partial | **Hard-rejects ≥ 2 slop patterns before critique runs (Sprint 8); 32-pattern catalogue; negative visual anchors injected upstream** |
| Motion system | None | Light | None | None | None (prototype-oriented) | **Motion v12 spring tokens + CSS-first (`@starting-style`, `animation-timeline`)** |
| Visual feedback | None | None | None | None | Inline canvas comments | **Playwright critique + axe-core (deterministic a11y)** |
| Taste memory | None | None | None | None | None | **`facts.jsonl` + `pairs.jsonl` + git-harvest + DesignPref RAG (Sprint 5–6); shareable `.taste` dotfiles** |
| Accessibility | Not enforced | Not enforced | Not enforced | Not enforced | Not enforced | **WCAG 2.2 AA + APCA Lc floors + CSS logical properties + RTL** |
| i18n typography | ASCII only | ASCII only | ASCII only | ASCII only | ASCII only | **20+ languages with correct diacritics + proper lang/subset** |
| Multi-variant | No | No | No | Yes | Yes (canvas revisions) | **`/variants` — 3 mutually-distinct takes before critique** |
| Consistency lock | No | No | No | No | Figma-driven | **`/apply` — lock a style across the app, emit DTCG tokens** |
| Token export | None | None | None | None | Figma variables only | **DTCG 1.0 `.tokens.json` per style (Figma / Style Dictionary / Penpot ready)** |
| Python required | No | No | **Yes (bugs on Windows)** | No | Cloud (web app) | **No — Node 18+ only** |
| Works inside existing repo | Yes | Yes | Yes | Yes | Export only (Canva/PDF/HTML) | **Yes — edits files in-place** |

### How is this different from `frontend-design` (Anthropic plugin)?

`frontend-design` is Anthropic's general-purpose design skill bundled
with Claude Code — solid for one-shot component generation but
operates without an explicit style catalogue, anti-default protection,
or a critique loop. A request like "build a pricing page" lands on a
generic SaaS-default visual every time because the skill has no
mechanism to *avoid* defaults or *learn* what you've previously
rejected.

- **`frontend-design`** is best at: zero-config quick component
  generation, no opinion about distinctiveness or accessibility, no
  cross-session memory.
- **`visionary-claude`** is best at: distinctive output (pre-critique
  slop-reject gate + 202-style catalogue + transplantation bonus),
  evidence-anchored critique with axe-core a11y, and learning your
  taste across sessions.

They are not redundant — `frontend-design` is fine for a one-off button
or form input where distinctiveness doesn't matter. `visionary-claude`
earns its keep on hero sections, pricing pages, dashboards, and any
surface where "looks like every AI-generated SaaS" is a real risk.

### How is this different from `interface-design` (Anthropic superpowers plugin)?

`interface-design` is Anthropic's specialist plugin for
dashboards / admin panels / data tooling. It explicitly excludes
marketing surfaces by design and ships ~12 dashboard-focused style
patterns plus density / depth / pattern-violation auditing
(`interface-design:audit`).

- **`interface-design`** is best at: information-dense admin / B2B
  data UIs, design-system enforcement on internal tooling, density and
  depth audits against an existing system.
- **`visionary-claude`** is best at: any surface (marketing, editorial,
  product, admin), 202 styles spanning visual vocabularies
  `interface-design` doesn't carry, motion-first generation, and the
  taste flywheel.

If your codebase is purely admin tooling with a locked-in design
system, `interface-design` may be the cleaner fit. If you need anything
public-facing, distinctive, or motion-rich, `visionary-claude` is the
broader instrument.

### How is this different from `UI/UX Pro Max` (third-party plugin)?

`UI/UX Pro Max` is the closest direct competitor — a third-party
Claude Code plugin with 67 named styles, shadcn-MCP integration for
component search, and broad coverage of 161 product types. The two
plugins overlap but differ on three structural axes:

- **Style catalogue + inference** — `UI/UX Pro Max` requires manual
  style name entry; `visionary-claude` runs an 8-step inference
  algorithm with weighted random + transplantation bonus over 202
  styles.
- **Critique loop** — `UI/UX Pro Max` ships no Playwright critique,
  axe-core a11y, or numeric aesthetic scorer. `visionary-claude` runs
  up to 3 evidence-anchored rounds per generation with deterministic
  10-dimension scoring.
- **Cross-session learning** — `UI/UX Pro Max` is stateless;
  `visionary-claude` runs a taste flywheel that learns from your
  rejections, approvals, git outcomes, and `/variants` picks.

Practical signal: if you want a wider component-search experience for
shadcn primitives and don't care about cross-session distinctiveness,
`UI/UX Pro Max` is solid. If you want the same prompt to *stop*
converging on whatever it converged on last week, the taste flywheel
in `visionary-claude` is the differentiator.

### How is this different from `Claude Design` (Anthropic web app)?

Anthropic launched **Claude Design** on 17 April 2026 as a web-app
prompt-to-prototype tool inside Claude.ai. It overlaps with
`visionary-claude` in goal but not in shape:

- **`Claude Design`** is best at: prompt → first-draft visual in a web
  canvas, inline refinement sliders, export to Canva / PDF /
  PowerPoint / HTML, handoff to Claude Code for implementation.
- **`visionary-claude`** is best at: working inside an existing
  codebase, deterministic accessibility scoring, motion-token
  discipline, DTCG token export for design-system work, and learning
  your taste across sessions so the same prompt stops converging on
  whatever it converged on last week.

They are complementary, not substitutes. A realistic workflow is:
sketch in Claude Design → export HTML → open the project in Claude
Code → re-skin with `/apply <visionary-style>` → iterate.

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

1. **Context Inference** — Detects language, product type, audience, brand archetype, and tone from your prompt. Runs the 8-step selection algorithm to pick a style from 202 candidates.

2. **Design Reasoning Brief** — Shows the selected style, runner-up alternatives with probability weights, and the scoring logic before generating code. You can redirect or say "try #2 instead".

3. **Motion-First Code** — Every component ships with Motion v12 spring tokens (`bounce` + `visualDuration`) via `motion/react`, plus CSS-first escapes (`@starting-style`, `animation-timeline: view()`, cross-document View Transitions). All motion gated on `prefers-reduced-motion` AND pause-controlled for anything > 5s (WCAG 2.2.2).

4. **Visual Critique Loop** — Playwright screenshots the rendered output at 1200×800 (+ 375 mobile if responsive), injects `axe-core` for deterministic accessibility scoring, runs `benchmark/scorers/numeric-aesthetic-scorer.mjs` (Shannon entropy on CIELAB L, DBSCAN gestalt grouping, modular-scale typographic rhythm, ΔE2000 colour harmony), and invokes the visual-critic agent on **10 dimensions** (0–10 scale): Hierarchy, Layout, Typography, Contrast (WCAG + APCA), Distinctiveness, Brief Conformance, Accessibility (60 % axe-weighted), Motion Readiness, Craft Measurable (numeric-scorer composite × 10), and Content Resilience (how the component survives p50 / p95 / empty data from `visionary-kit.json`). Detects 26 slop patterns (20 deterministic + 6 vision-based). Runs up to 3 rounds. Fresh-context SELF-REFINE pattern per round. **Evidence-anchored** since Sprint 03: every top_3_fix must cite an axe rule, CSS selector, numeric metric, or coordinate — no unjustified score < 7. Aborts on > 0.3 regression.

5. **Taste Calibration** — Structured taste flywheel under the taste directory (`facts.jsonl`, `pairs.jsonl`, `accepted-examples.jsonl`):
   - **Active signal:** rejection / approval phrasing in your turns is extracted into `facts.jsonl` (one structured fact per line, typed by scope + target + direction + confidence).
   - **Passive signal:** `harvest-git-signal.mjs` runs at session start, classifies each `.visionary-generated` file as kept / heavy-edit / deleted from git history, and feeds those as facts with graduated confidence.
   - **Pairwise signal:** when you pick from a `/variants` output, the choice + rejected siblings are stored in `pairs.jsonl` and used as FSPO few-shot anchors in Step 4 of the selection algorithm.
   - **Lifecycle:** `active` → `permanent` after 3+ evidence across 2+ kinds with confidence ≥ 0.9 → hard-block on match. `active` → `decayed` after 30 days of no new evidence → confidence ×0.5, hidden until reactivated.
   - **Storage location (v1.5.1+):** defaults to `${CLAUDE_PLUGIN_DATA}/taste/<projectKey-slug>/` (under `~/.claude/plugins/data/`) per the official Claude Code plugin convention — out of your repo, persistent across plugin updates. Falls back to `<project-root>/taste/` if `CLAUDE_PLUGIN_DATA` isn't set (tests, dev). Pre-existing `<project-root>/taste/` directories continue to be used. Force in-repo storage with `VISIONARY_TASTE_IN_REPO=1` to share a profile via git.
   - **Inspect + export:** `/visionary-taste status | show | forget | reset | age | export | import | browse`. See [`docs/taste-flywheel.md`](docs/taste-flywheel.md) and [`docs/taste-privacy.md`](docs/taste-privacy.md). Full opt-out: `export VISIONARY_DISABLE_TASTE=1`.

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
  | Step 4: Explicit scoring rubric (5 signals × 1–5) + FSPO few-shot from taste/pairs.jsonl
  | Step 4.5: Structured taste adjustment (taste/facts.jsonl — graduated per flag × confidence)
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
- Taste signals (active + passive git + pairwise) accumulate with confidence + evidence counts, not a binary flag
- Permanent-flagged styles are hard-blocked from both single-pick and `/variants` outputs; active facts apply graduated score adjustments proportional to confidence

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
- [Taste flywheel](docs/taste-flywheel.md) — active + passive + pairwise signals, aging rules, schema reference (Sprint 05)
- [Taste privacy](docs/taste-privacy.md) — what's stored, where, and how to opt out (`VISIONARY_DISABLE_TASTE=1`)
- [Style embeddings](docs/style-embeddings.md) — 8-dim aesthetic embeddings used by `/variants` orthogonal selection and FSPO sampling
- [Critique principles](docs/critique-principles.md) — evidence-over-vibes rubric, 10-dimension scoring, multi-agent critic layout (Sprints 03 + 06)
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
