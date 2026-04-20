# Changelog

All notable changes to visionary-claude are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.3.0] — 2026-04-20

Major release. Takes the plugin from "design intelligence" to "verifiable,
publishable design platform". Full map against the 2026-04-18 deep-analysis
report: 36 / 36 recommendation items implemented.

### Critical fixes (from deep-analysis Block 1)

- **Hooks migrated from Bash to Node.js** (`hooks/scripts/*.mjs`) — cross-platform, stdin-JSON-based per the official Claude Code hooks spec. Eliminates the `xxd` / `md5sum` / `sed -i.bak` divergence between macOS / Linux / Git Bash on Windows.
- **Playwright integration de-stubbed** — the hook no longer tries (and silently fails) to invoke Playwright MCP directly. It emits `additionalContext` instructing Claude to call `mcp__playwright__browser_navigate` + `browser_take_screenshot` + `browser_evaluate` on the next turn.
- **`update-taste` event corrected** — `Stop` → `UserPromptSubmit` (the semantically correct event; matches the hook's internal logic).
- **Cache path** — prefers `CLAUDE_PLUGIN_DATA` env over polluting the project repo with `.visionary-cache/`.
- **Markdown-injection hardened** — `update-taste.mjs` strips `` ` * _ # > [ ] `` from user-prompt quotes before writing to `system.md`.
- **MCP packages pinned** — `@playwright/mcp@^0.0.70`, `@upstash/context7-mcp@^1.0`. Latest is a breaking-changes gun.
- **3 broken extended styles deleted** — `dreamcore-2` (contradicted its own motion rules), `post-internet-maximalism-2` (ignored `prefers-reduced-motion`), `solarpunk-futurism-2` (Inter Bold as display = AI-slop).
- **3 ambiguous styles renamed** — `frutiger-aero-2` → `frutiger-aero-kinetic`, `goblincore-digital` → `goblincore-pixel`, `solarpunk-futurism-extended` → `solarpunk-dark`.
- **10 empty category directories removed** (`brutalist/`, `data-dense/`, `editorial/`, `luxury/`, `minimalist/`, `motion-native/`, `neumorphism/`, `organic/`, `playful/`, `technical/`).
- **`_index.md` 1:1 with filesystem** — duplicates removed, missing styles added, totals re-counted.

### Added — 19 new styles (202 total)

- **Morphisms:** `liquid-glass-ios26`, `neobrutalism-softened`
- **Historical:** `swiss-gerstner`, `swiss-muller-brockmann`, `swiss-crouwel-gridnik`
- **Contemporary UI:** `ambient-copilot`, `dyslexia-friendly`, `apca-native-contrast`
- **Typography-led:** `editorial-serif-revival`, `kinetic-typography-v2`, `colr-v1-color-type`
- **Emotional:** `calm-focus-mode`
- **Hybrid:** `chaos-packaging-collage`, `recombinant-hybrid`
- **Extended:** `cassette-futurism`, `bauhaus-dessau`, `bauhaus-weimar`, `default-computing-native`, `dopamine-calm`
- **5 weak files fully re-written** to 120-150 line philosophical depth: `fabric-textile`, `leather-craft`, `white-futurism`, `concrete-brutalist-material`, `zine-diy`

### Added — Accessibility (Block 2 modernization)

- **YAML frontmatter** on every style (`id`, `category`, `motion_tier`, `density`, `locale_fit`, `palette_tags`, `keywords`, `accessibility`).
- **`## Accessibility` section** in every style file covering contrast, focus, motion, touch target, RTL.
- **APCA Lc dual floors** alongside WCAG 2.x (body Lc ≥ 75, large Lc ≥ 60, UI Lc ≥ 45, AAA Lc ≥ 90). Validated by `scripts/apca-validator.mjs`.
- **`:focus:not(:focus-visible)` fallback removed** — obsolete since browsers shipped UA-level suppression (March 2022). All focus styles are now `:focus-visible` + `Canvas` / `AccentColor` system colors.
- **Touch target default 44×44** — drops to 24 only for documented dense-UI styles (Bloomberg terminal, terminal-cli, data-visualization).
- **CSS logical properties** (`margin-inline`, `padding-inline`, `inset-inline-*`, `border-inline-*`) as default — Arabic / Hebrew / Persian RTL locales work without a fork.
- **ARIA 1.3** primitives (`role="suggestion"` / `"comment"` / `"mark"`, `aria-description`, `aria-braillelabel`) where applicable.
- **WCAG 2.2.2 pause/stop/hide** — any animation > 5 s now requires a pause control; affects `kinetic-type`, `kinetic-typography-v2`, `flow-field-vector`, `reaction-diffusion`, `quantum-particle`, `aurora-mesh`, `holographic`.
- **Jurisdiction matrix** expanded: EAA (in force 2025-06-28, active enforcement), ADA Title II (deadline 2026-04-24), Section 508, UK PSBAR, AODA, JIS X 8341.
- **axe-core runtime** (`skills/visionary/axe-runtime.js`) — injected via Playwright's `browser_evaluate`; Accessibility dimension scored 60 % axe / 40 % heuristic.

### Added — Framework modernization (Block 3)

- **Tailwind v3/v4 dual-emitter** in `stack-guidelines.md` — `@theme` CSS-first for v4, `tailwind.config.js` for v3. Detection via `@tailwindcss/vite` / `@tailwindcss/postcss` / `@theme` directive.
- **Next.js 16** targets — Cache Components, stable React Compiler (omits `useMemo` / `useCallback`), `<Form>`, async `params: Promise<...>`, Turbopack default.
- **Motion v12** — two-parameter springs `{ bounce, visualDuration }`, native oklch / color-mix animation, `linear()` easing snippets, ScrollTimeline native.
- **CSS-first motion escapes** — `@starting-style` (Baseline 2024), `animation-timeline: scroll() / view()`, cross-document `@view-transition` for MPA stacks (Astro, Laravel, Nuxt), anchor positioning, `@scope`.
- **DTCG 1.0 token export** — `scripts/export-dtcg-tokens.mjs` emits `tokens/{id}.tokens.json` per style (202 files + index). W3C spec stable 2025-10. Consumable by Figma Variables native import, Style Dictionary v4, Penpot, Tokens Studio, Knapsack.
- **shadcn registry publication** — `scripts/build-shadcn-registry.mjs` emits 202 `registry:style` items at `registry/r/{id}.json`. Installable via `npx shadcn@latest add https://{host}/r/{style-id}.json`.
- **shadcn block adapter** — `scripts/reskin-shadcn-block.mjs` consumes any shadcn community block and re-skins it with any Visionary style's tokens (OKLCH color replacement + font swap + radius adjustment + motion-tier enforcement).

### Added — Innovation / moat (Block 4)

- **`/variants` command** — 3 mutually-distinct aesthetic takes before entering the critique loop (SELF-REFINE 3-way).
- **`/apply` command** — lock a chosen style across an entire product, emit `design-system/tokens.json` + CSS `@theme` layer, inventory existing UI for retrofit proposals.
- **`/designer` command** + **5 named-designer packs** — Dieter Rams, Emil Kowalski, Massimo Vignelli, Paula Scher, April Greiman. Blend support (`/designer "70% rams, 30% kowalski"`).
- **`/annotate` command** (Design Mode parity with Cursor 3) — browser pin → element selector → code edit, via Playwright `browser_evaluate` injecting `skills/visionary/annotate-runtime.js`.
- **`/import-artifact` command** — Claude.ai Artifact → codebase pipeline with automatic re-skinning to the project's locked style.
- **Open benchmark** (`benchmark/`) — 100 prompts × 10 categories × 4 dimensions (Distinctiveness, Coherence, Accessibility, Motion Readiness). Includes 4 source-level scorers (`scanSlop`, `scoreA11y`, `scoreMotion`, `scoreCoherence`), a runner, a rubric, staged samples for both Visionary and an adversarial slop baseline.
- **Published benchmark results** in `results/` — **Visionary 1.3.0 scored 18.35 / 20 against the slop baseline's 12.60, delta +5.75**. Per-prompt JSON, reproducible.
- **Marketplace submissions** staged in `.marketplaces/` for Anthropic official plugins, aitmpl.com, claudemarketplaces.com, ClaudePluginHub. Checklist in `MARKETPLACES.md`.

### Added — Visual critique loop upgrades

- **`networkidle` → `document.fonts.ready && getAnimations().length === 0`** — Playwright's own docs advise against networkidle.
- **Multi-viewport default** 1200 × 800 + 375 × 812 when source contains `md:` or `@media (max-width:`; + 768 × 1024 when `md:` breakpoint detected.
- **Screenshot auto-resize to ≤ 1568 px** longest side — avoids GitHub issue #27611 infinite-retry on > 5 MB, matches Claude vision optimum (~1.15 megapixel).
- **Fresh-context SELF-REFINE** — each critique round receives brief + previous critique only, not the full chat transcript.
- **Convergence abort tightened** — stop on round N < round N-1 by > 0.3 (instead of any regression).
- **Slop pattern #26** — neon-on-dark without thematic justification.
- **AST-ish sanitizer** — `sanitizeSource()` strips comments and template strings before running the 20 deterministic slop regexes, eliminating false positives like `text-cyan` matching `disabled:text-cyan` or JSX comments.
- **Debounced hook** — a 3-second coalescing window collapses MultiEdit bursts into a single critique at the tail. `VISIONARY_DISABLE_CRITIQUE=1` env disables the hook entirely.

### Changed

- Plugin description in `.claude-plugin/plugin.json` rewritten to reflect v1.3.0 scope.
- `README.md` rewritten with new catalogue (202 styles, v1.3 features, benchmark evidence, DTCG export, shadcn registry instructions).
- `skills/visionary/SKILL.md` modernized — jurisdiction matrix, APCA, touch-target 44, CSS logical properties, ARIA 1.3, Motion v12, Tailwind v4, Next.js 16, shadcn v4, DTCG tokens.
- `agents/visual-critic.md` — axe-core input specified, SELF-REFINE fresh-context, 0.3 convergence threshold, APCA floors, touch-target 44 default.
- `skills/visionary/motion-tokens.ts` — v12 two-parameter springs preferred, v11 legacy tokens kept, CSS-first snippets module added, `Static` tier added to `MotionTier`.
- `skills/visionary/critique-schema.md` — 26-pattern slop list, axe-core weighting rules, multi-viewport capture shape.

### Fixed

- `_index.md` no longer lists `cottagecore-tech` twice.
- `_index.md` no longer references 11 styles with the wrong category directory.
- `zine-diy.md` motion tier `Minimal` → `Static` (enum violation).
- `latin-fiesta.md` now has the Cultural Note section (was the highest appropriation-risk file without one).
- `update-taste.mjs` no longer has the `sed` injection risk the Bash predecessor had.

---

## [1.2.0] — 2026-04-14

### Added — Algorithm v2 (6 improvements)
- **Weighted random selection** (Step 7): Top 3 candidates selected by weighted probability, not deterministic pick — same prompt can produce different styles across users
- **Taste profile integration** (Step 4.5): Reads system.md during style selection — rejected styles get -100, positive signals get +15, permanently flagged styles treated as blocked
- **Component type compatibility filter** (Step 2.5): Removes styles that cannot structurally handle the requested UI type (dashboards, forms, tables, heroes, etc.)
- **Context-aware transplantation bonus** (Step 5): Replaces flat +25% with fit-score-based bonus (+0% to +35%) evaluated on 6 shared properties between transplant style and target domain
- **Explicit scoring rubric** (Step 4): Replaces "score mentally" with 1-5 rubric per signal with concrete criteria — reduces LLM bias toward familiar styles
- **Cross-session variety** (Step 6): Style history persisted in system.md with time-decay penalties (last 24h: -40, last 3 days: -25, last 7 days: -10)
- Product type table expanded from 14 to 18 verticals (added Non-profit, Travel, Music, Sports)

### Changed
- Algorithm version bumped from v1 (6-step) to v2 (8-step)
- Originality Floor now re-runs Step 7 weighted selection instead of requiring full rebuild
- update-taste.sh ensures Style history section exists in system.md

## [1.1.0] — 2026-04-14

### Added
- Style Selection Algorithm: 6-step funnel (186 → 1) with transplantation bonus, blocked defaults, and session variety tracking
- Anti-Default Bias: fintech-trust, saas-b2b-dashboard, dark-mode-first+gradient, neobank-consumer blocked as primary styles
- Language & Locale Detection: 20+ languages with correct diacritics enforcement (å ä ö, ü, ñ, etc.)
- Font subset enforcement: Google Fonts URLs must include latin-ext for European languages
- Product Type → Category mapping table for 14 product verticals
- Transplantation-first rule: cross-domain styles get +25% scoring bonus
- 4 new slop detection rules: stripped diacritics (#9), missing font subset (#10), wrong html lang (#11), blocked default style (#12)

---

## [1.0.0] — 2026-04-14

### Added

#### Core Architecture
- Five-stage design generation pipeline: Context Inference → Design Reasoning Brief → Motion-First Code → Visual Critique Loop → Taste Calibration
- `skills/visionary/SKILL.md` — main plugin entry point with full pipeline documentation
- `skills/visionary/context-inference.md` — 5-signal scoring engine with 12 brand archetypes
- `skills/visionary/design-reasoning.md` — Design Reasoning Brief template and decision logic
- `skills/visionary/motion-tokens.ts` — canonical spring token system (micro/snappy/ui/gentle/bounce/layout)
- `skills/visionary/critique-schema.md` — 8-dimension aesthetic scoring rubric
- `skills/visionary/typography-matrix.md` — font pairings for all archetypes including CJK scripts

#### Design Styles (186 total)
- Sprint 6: 12 morphism + 18 internet aesthetic styles
- Sprint 7: 16 historical graphic design movement styles
- Sprint 8: 38 typography-led + industry + emotional styles
- Sprint 9: 34 material + futurist + cultural styles (with Cultural Note sensitivity guidance)
- Sprint 10: 54 hybrid + extended styles

#### Agents
- `agents/visual-critic.md` — 8-dimension aesthetic scoring agent with slop detection

#### Hooks Infrastructure
- `hooks/hooks.json` — PostToolUse + SessionStart + Stop hook configuration
- `hooks/scripts/capture-and-critique.sh` — Playwright screenshot + critique pipeline
- `hooks/scripts/detect-framework.sh` — Next.js/React/Vue/Svelte/Vanilla detection
- `hooks/scripts/update-taste.sh` — Negative taste calibration to system.md

#### Accessibility (WCAG 2.2 AA)
- Focus-visible management pattern (WCAG 2.4.11)
- Motion safety with `prefers-reduced-motion` (WCAG 2.3.3)
- Minimum touch target sizes (WCAG 2.5.8)
- ARIA label generation rules (WCAG 4.1.2)
- Semantic HTML enforcement (WCAG 4.1.1)
- Contrast compliance guidance (WCAG 1.4.3)
- EU Accessibility Act compliance (in force June 28, 2025)

#### Distribution
- `.claude-plugin/plugin.json` — plugin manifest
- `.claude-plugin/marketplace.json` — GitHub marketplace source
- `.mcp.json` — Playwright + Context7 MCP server configuration
- `docs/README.md` — marketplace listing with comparison table
- `docs/installation.md` — full installation guide with scope options
- `docs/e2e-tests.md` — 5 end-to-end test scenarios with pass/fail criteria

### Architecture Notes

- Motion library: `motion/react` (Motion for React v11+) — `framer-motion` is the deprecated package name
- Framework detection: shell-based, no Python dependency (Windows-safe)
- Style taxonomy: zero-token-cost index file; individual style files loaded on demand
- Taste calibration: written to `.visionary-cache/system.md` — excluded from version control

---

## [Unreleased]

- Full Sprint 10 extended styles (42 additional styles)
- Context7 MCP integration for framework-specific documentation lookup
- Playwright visual critique loop — full screenshot capture implementation
- Negative taste calibration — rejection signal parsing from session transcript

---

[1.3.0]: https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/releases/tag/v1.3.0
[1.2.0]: https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/releases/tag/v1.2.0
[1.1.0]: https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/releases/tag/v1.1.0
[1.0.0]: https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/releases/tag/v1.0.0
