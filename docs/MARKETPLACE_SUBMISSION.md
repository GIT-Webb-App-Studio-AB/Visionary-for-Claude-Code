# Marketplace submission — `claude-plugins-official`

Checklist and draft PR materials for submitting `visionary-claude` to
Anthropic's official marketplace at
[`anthropics/claude-plugins-official`](https://github.com/anthropics/claude-plugins-official).

Listing on the official marketplace is the single highest-leverage
visibility lever for the plugin — it takes the plugin from "you have to
know the URL" to "surfaces in `/plugin` Discover tab for every Claude Code
user in the world". Quality bar is high.

## Pre-submission quality checklist

Work through each item before opening the PR. Any "no" or "partial" is a
likely reviewer objection.

### Plugin manifest
- [x] `.claude-plugin/plugin.json` declares `name`, `version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`
- [x] Semver version bumped per [semver.org](https://semver.org)
- [x] License is Apache-2.0 (approved by Anthropic for derivative distribution)
- [ ] No secrets, no tokens, no user-specific paths in committed files

### SKILL.md
- [x] Exactly one `name:` and `description:` in YAML frontmatter
- [x] Description mentions the activation keywords (`/visionary`, `/variants`, `/apply`)
- [x] Under 500 lines (Anthropic's stated limit for the primary SKILL.md)
- [x] Progressive-disclosure references in `skills/visionary/` sub-docs
- [ ] Passes `node scripts/validate-skill.mjs` (if / when we ship one)

### Hooks
- [x] All hooks are `.mjs` (Node 18+, cross-platform — no Bash, no `xxd`, no `md5sum`)
- [x] Hooks read stdin JSON per the [official spec](https://code.claude.com/docs/en/hooks)
- [x] `check-for-updates.mjs` hardened against concurrent invocation (lock via `autoupdate.stamp`)
- [x] Cache writes prefer `$CLAUDE_PLUGIN_DATA` over polluting the user's repo
- [x] `update-taste.mjs` sanitizes user input before writing to `system.md`

### Commands
- [x] `commands/*.md` use the Claude Code slash-command schema
- [x] Each command has a one-line description that matches
      `.claude-plugin/marketplace.json`'s `commands` array

### Accessibility & correctness
- [x] Generated components are WCAG 2.2 AA + APCA
- [x] axe-core injected at critique-loop runtime (not a claim — measurable)
- [x] Stripped diacritics treated as a blocking defect
- [x] Anti-default bias documented and enforced

### Benchmark & honesty
- [ ] `results/` contains **at least one run of 100/100 prompts** — remove
      the current 10/100 partial run from headline claims
- [ ] `results/` contains **at least one comparison run** against
      `frontend-design` (using `benchmark/adapters/frontend-design.mjs`)
- [ ] `README.md` headline numbers match `results/` files exactly, with
      date + sample size stated inline
- [ ] Motion Readiness ≥ 4.5 in the published run (after the v1.3.1 fix
      in `skills/visionary/SKILL.md` Output Contract and
      `benchmark/scorers/motion-scorer.mjs` context-aware appetite)

### Security
- [x] No shell-interpolated subprocess calls anywhere — only `execFile` /
      `spawn` with `shell: false` and argv arrays
- [x] No unaudited MCP servers bundled in `.mcp.json`
- [x] Pinned dependency ranges in `@playwright/mcp`, `@upstash/context7-mcp`

### Documentation
- [x] Installation guide (GitHub / local / air-gapped) — `docs/installation.md`
- [x] Release procedure — `docs/RELEASE.md`
- [ ] Migration guide from `frontend-design` — `docs/migrating-from-frontend-design.md`
      (diff the overlap, tell users why they would switch)
- [x] Screenshots / demo GIFs in `docs/` for the Discover tab

## Draft PR description

Copy-paste into the PR body at
`https://github.com/anthropics/claude-plugins-official/pulls`:

```markdown
## Plugin: visionary-claude

**Category**: Design / UI generation
**License**: Apache-2.0
**Maintainer**: GIT Webb & App Studio AB (`gitwebb` on GitHub)
**Repository**: https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code
**Homepage**: same
**Version at submission**: 1.3.1

### What it does

Design intelligence for Claude Code. 203 styles, 8-step selection algorithm
with weighted random, motion-first generation (Motion v12 springs +
CSS-first escapes), Playwright visual critique loop with axe-core-
instrumented accessibility scoring, DTCG 1.0 token export, cross-session
taste calibration via `system.md`, multi-variant and consistency-apply
commands.

### How it differs from the existing `frontend-design` plugin

`frontend-design` is ~400 tokens of prompt hints that push Claude toward
distinctive choices. `visionary-claude` is a full pipeline:

- 203 explicit styles vs ~15 implicit
- 8-step weighted selection algorithm with transplantation bonus and
  taste-profile adjustment
- Playwright + axe-core critique loop (deterministic a11y, not LLM-guessed)
- DTCG 1.0 token export per style (Figma Variables, Style Dictionary,
  Penpot, Tokens Studio)
- Cross-session negative taste calibration
- Full WCAG 2.2 AA + APCA Lc enforcement
- i18n typography with 20+ languages and correct diacritics

Users who want a lightweight prompt-level nudge should stay with
`frontend-design`. Users who want pipeline-level control with verifiable
a11y scoring and consistent design-system export should consider
`visionary-claude`.

### Quality evidence

- Full 100/100 benchmark run published at `results/visionary-1.3.1-full.json`,
  mean total **<REPLACE WITH ACTUAL NUMBER>/20** across 10 categories.
- Comparison run against `frontend-design` at
  `results/frontend-design-full.json` (same 100 prompts, same scorers).
- CHANGELOG.md follows Keep a Changelog
- Semver-tagged releases; all listed marketplace versions map to an
  annotated git tag.
- Hooks are Node.js 18+, cross-platform, read stdin JSON per the official
  spec, do not shell-out.

### Installation experience

```
/plugin marketplace add claude-plugins-official    # if not already
/plugin install visionary-claude
```

Takes ~4 seconds; no Python dependency, no dev-server requirement to
activate (Playwright critique loop is opt-in when the user has a dev
server running).

### Security review notes

- No bundled MCP server requires network access at install time
- Background `SessionStart` hook is rate-limited to one run per 24h and
  opt-out via `VISIONARY_NO_AUTOUPDATE=1`
- No shell-interpolated subprocess invocation anywhere; all subprocess
  calls use `execFile` with argv arrays and `shell: false`
- No user-input interpolation into shell commands anywhere

### Screenshots

See `docs/` in the repo for:
- Hero SVG (README top)
- Three pension-gap variants (commit 9c4c558, comparing styles)
- Benchmark output (`results/*.json`)
```

## Cadence of re-submission

Anthropic's policy (as of April 2026) is that marketplace submissions
are reviewed in batches. Expect 2–6 weeks from PR open to decision.
Iterate on reviewer feedback; do not self-close and re-open.

## Backstop if rejected

Keep `visionary-marketplace` (this repo's own marketplace) as the
fallback install path. Document it prominently in `README.md` so users can
install regardless of official status.
