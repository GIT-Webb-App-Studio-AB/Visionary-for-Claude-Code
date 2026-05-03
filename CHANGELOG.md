# Changelog

All notable changes to visionary-claude are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased] — 2026-05-03

### Added — Structural Integrity Gate

A new deterministic gate that runs after Playwright capture and before the
LLM-critic pass. Catches three observed failure modes from a salon-mockup
pair (Atelier Nord + Studio/Hår): duplicate headings, footer-grid collapse
with exposed default bullets, and orphan single-word labels — all of which
slipped past the existing slop, motion, and visual-style checks because
they are structural rather than stylistic.

- **Pipeline placement** — runs after Playwright capture, before LLM-critic,
  so structural defects fail fast and never burn a critic round.
- **Six hard-fail checks** — `duplicate-heading`, `exposed-nav-bullets`,
  `off-viewport-right`, `footer-grid-collapse`, `empty-section`,
  `heading-hierarchy-skip`. Any single hit blocks the round.
- **One warning check** — `mystery-text-node` (orphan single-word labels).
  `image-brand-mismatch` is reserved as a follow-up once the visual-anchor
  pipeline lands.
- **Per-style opt-out** — frontmatter key `allows_structural` lets a style
  intentionally bypass specific checks (e.g. brutalist styles that
  deliberately use bare `<ul>` markers).
- **Trace events** — `structural_blocked`, `structural_warning`,
  `structural_whitelisted` written to `.visionary/traces/` alongside the
  existing slop / motion / visual events.
- **Feature flag** — `VISIONARY_ENABLE_STRUCTURAL_GATE` (default **on**).
  Set to `0` to fall back to pre-gate behaviour while calibrating
  whitelists.

Specs: `docs/superpowers/specs/2026-05-03-structural-integrity-gate-design.md`.
Plan: `docs/superpowers/plans/2026-05-03-structural-integrity-gate.md`.

---

## [1.4.0] — 2026-05-01

The Sprint 5–15 quality-lift release. Eleven new sprints layered on top of
the 1.3.1 baseline — Sprint 5–8 were previously on a private branch and
become public for the first time here, alongside the brand-new Sprint 9–15.
**453 unit tests pass, 0 fail.** All additions are dependency-free,
toggleable via env, and graceful when peer-deps are absent.

### Added — Sprint 5–8 (now public)

- **Taste flywheel core** (Sprint 5) — `taste/facts.jsonl` captures every
  rejection/approval as a typed fact with `scope`, `direction`,
  `confidence`. `taste/pairs.jsonl` records `/variants` picks as FSPO
  few-shot anchors. Lifecycle: `active → permanent → decayed` with
  configurable thresholds. Git-harvest classifies `.visionary-generated`
  files as kept / heavy-edit / deleted. `/visionary-taste` command for
  inspect / forget / reset / age / export / import / browse.
- **DesignPref RAG + multi-agent critic + traces** (Sprint 6) —
  `taste/accepted-examples.jsonl` with hashed n-gram brief embeddings,
  top-3 anchors fed to critic. Multi-critic mode (craft + aesthetic in
  parallel, merged via `critic-merge.mjs` + `critic-arbitration.json`).
  Trace observability under `.visionary/traces/` with 7-day gzip /
  90-day delete rotation.
- **Platform play** (Sprint 7) — `.taste` dotfiles for shareable taste
  profiles with `inherits_from` chains. `visionary-kit.json` for
  realistic data shape declaration. `content_resilience` 10th critique
  dimension scoring how components survive p50 / p95 / empty data.
  Auto-infer kits from TypeScript, Prisma, OpenAPI.
- **Distinctiveness gate** (Sprint 8) — hard slop-reject preventive gate
  blocks generation when ≥ 2 slop patterns detected. 21 curated
  avoid-directives in `slop-directives.md`. `allows_slop` whitelist for
  styles whose vocabulary deliberately uses default-tooling ironi
  (brutalist-honesty, neon-dystopia, y2k-futurism,
  architectural-brutalism). Negative visual anchors under
  `docs/slop-anchors/` injected into generation prompts.

### Added — Sprint 9: Motion Scoring 2.0

Replaces the legacy single-shot motion heuristic with a 6-sub-dim
weighted aggregator + 5-tier Maturity Model (None / Subtle /
Expressive / Kinetic / Cinematic). Sub-dims:
`easing_provenance` (0.20), `aars_pattern` (0.20),
`timing_consistency` (0.15), `narrative_arc` (0.15),
`reduced_motion` (0.15), `cinema_easing` (0.15). Wired into
`capture-and-critique` so the critic must cite the exact sub-dim
that drags `motion_readiness` below 7.
Toggle: `VISIONARY_MOTION_SCORER_V2=0` for v1 fallback.
Calibration: `node scripts/calibrate-motion-2.mjs`.

### Added — Sprint 10: `@visionary/mcp-server`

Extracts the deterministic core to an MCP server consumable by
Cursor / Windsurf / Cline / Zed. Three tools (`visionary.slop_gate`,
`visionary.motion_score`, `visionary.validate_evidence`), three
resources, two prompts. Stdio transport, server card at
`.well-known/mcp/server.json` (MCP spec 2025-06-18). Hooks +
taste-flywheel writes stay in the Claude Code plugin; only read
access flows over MCP. Install guides per host live in
`packages/mcp-server/INSTALL.md`. Not yet published to npm.

### Added — Sprint 11: DINOv2 ONNX visual embeddings (experimental, opt-in)

Per-screenshot embedding, cosine vs curated style anchors → 11th
critique dimension `visual_style_match` 0–10 + Mahalanobis OOD-
detection at 2σ. Lazy-loads `onnxruntime-web` with WebGPU preference.
**Default OFF** because the curated anchor set is not yet shipped;
set `VISIONARY_VISUAL_EMBED=1` after running
`scripts/download-dinov2.mjs` + `scripts/build-anchors.mjs`.

### Added — Sprint 12: MLLM Judge tie-breaker

Multimodal Claude pass that resolves cases where heuristic + numeric
+ DINOv2 stack disagree (composite-diff ≤ 0.3, low-confidence < 0.6,
heuristic↔visual conflict ≥ 1.5). **Hard rule: judge cannot reject
solo** — strong heuristic margin overrides judge dissent. Budget caps:
1 invocation per round, 5 per session. Lazy-imports
`@anthropic-ai/sdk`. Toggle: `VISIONARY_MLLM_JUDGE=tie-only`
(default off).

### Added — Sprint 13: Vibe Motion Editor

`/visionary-motion "<intent>"` re-tunes motion tokens in place via
a deterministic NL → adjustments map. 12 vibes (`mer energiskt` /
`softer` / `faster` / `slower` / `bouncier` / `calmer` / `kinetic` /
`minimal` / `cinematic` / `snappy` / `layered` / `less-dramatic`).
Three patch targets: DTCG `tokens.json`, inline JSX
(`bounce`, `visualDuration`), CSS shorthand. Runs `scoreMotion2`
before AND after, prints a per-sub-dim delta. `--preview` flag
emits diff without writing.

### Added — Sprint 14: Active Governance Hook

`scripts/governance-check.mjs` + `.husky/pre-commit` +
`.github/workflows/visionary-governance.yml`. Detects hex / rgb /
oklch / Tailwind utility drift relative to a
`tokens/<style-id>.tokens.json` flagged with `$visionary.locked: true`.
Three thresholds (`block` / `warn` / `off`),
`near_match_tolerance` for soft warnings, `allowed_drifts` glob list
for legacy escapes. Bypass: `git commit --no-verify`,
`// visionary-governance: ignore` magic comment, or
`drift_threshold: "warn"` in tokens.

### Added — Sprint 15: Taste Inheritance (designer-as-subagent)

Designer packs (Rams, Kowalski, Vignelli, Scher, Greiman) gain a
`critic_persona` block + `arbitration` block. Instead of just biasing
the generation prompt, the pack now produces a per-dim contribution
that joins the arbitration table alongside craft + aesthetic critics.
Three conflict-resolution strategies: (A) designer tie-breaks craft-
vs-aesthetic ties, (B) MLLM judge from Sprint 12, (C) user
escalation. Default designer weight in arbitration: 0.25 (vs 1.0 each
for craft + aesthetic). Vetoes are opt-in (`can_veto: false` for all
v1 packs).

### Changed

- **`.gitignore`** — added `*.onnx`, `models/*.onnx`,
  `models/style-anchors/*/*.{png,jpg,jpeg}`, `packages/*/node_modules/`,
  `.husky/_/`. Prevents accidental commits of large model binaries
  or anchor screenshot stocks.
- **`docs/visionary-hero.svg`** — version line updated to v1.4.0,
  Motion Scoring 2.0 / DINOv2 OOD / MLLM Judge / Active Governance
  feature row added.
- **`README.md`** — Fas 5–9 sections describing Sprint 9–15, expanded
  env-flag reference, test count 261 → 453.
- **`benchmark/runner.mjs`** — uses Motion Scoring v2 by default;
  `VISIONARY_MOTION_SCORER_V2=0` for v1 fallback.

### Removed

- Internal "DEV build" markers from `marketplace.json` and
  `plugin.json`. This is the production v1.4.0 release.

### Migration impact

- Nothing in the 1.3.1 public behaviour changes automatically.
- `VISIONARY_VISUAL_EMBED` default is **off** — set to `1` after
  manual setup if you want DINOv2 visual style match.
- `VISIONARY_MULTI_CRITIC` and `VISIONARY_MLLM_JUDGE` remain opt-in.
- Anti-anchors require manual image curation; DINOv2 model + style
  anchors require manual download/curation. The pipeline degrades
  gracefully when any of those are absent.

### Security

- All new code is zero-dep and locally-scoped. The MCP server
  exposes read-only access to taste summary (aggregated counts only —
  never raw `facts.jsonl` content over the wire).

---

## [1.3.1] — 2026-04-21

Patch release. Fixes the auto-update hook so the second CLI step actually
succeeds — without this fix, `marketplace update` ran fine but the follow-up
`plugin update` silently errored out, meaning downloaded versions would have
failed to activate on restart.

### Fixed

- **Auto-update hook plugin identifier** (`hooks/scripts/check-for-updates.mjs`) —
  `claude plugin update` requires the fully qualified `<plugin>@<marketplace>`
  form when the plugin is installed from a named marketplace. The hook was
  passing the bare `visionary-claude` name, which triggered
  `Failed to update plugin "visionary-claude": Plugin "visionary-claude" not found`.
  Now passes `visionary-claude@visionary-marketplace`. Verified end-to-end
  with a fresh stamp file → parent emits `{}` in 115ms → child logs
  `marketplace exit=0` + `update exit=0 :: already at the latest version`.

---

## [1.3.0] — 2026-04-21

Major release. Takes the plugin from "design intelligence" to "verifiable,
publishable design platform". Full map against the 2026-04-18 deep-analysis
report: 36 / 36 recommendation items implemented.

### Added — Distribution

- **Background auto-update** (`hooks/scripts/check-for-updates.mjs`) — `SessionStart`
  hook spawns a detached child that runs `claude plugin marketplace update` +
  `claude plugin update visionary-claude` at most once per 24h. Downloaded
  updates activate on the next Claude Code restart. Per-user opt-out:
  `VISIONARY_NO_AUTOUPDATE=1`. Rate-limit stamp + log in
  `$CLAUDE_PLUGIN_DATA/autoupdate.log`.
- **Release documentation** (`docs/RELEASE.md`) — bump/tag/push procedure,
  user-side update flow, verification commands.
- **Marketplace version synced** — `.claude-plugin/marketplace.json` now
  reflects 1.3.0 (was lagging at 1.2.0 in the initial tag). End users will
  see the bump on their next `claude plugin update` cycle.

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
