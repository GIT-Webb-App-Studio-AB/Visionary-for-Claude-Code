# Changelog

All notable changes to visionary-claude are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

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

[1.1.0]: https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/releases/tag/v1.1.0
[1.0.0]: https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/releases/tag/v1.0.0
