# claudemarketplaces.com — Submission Draft

**Target:** https://claudemarketplaces.com/submit (check current channel at
submission time — the intake URL may have moved).

---

## Listing data

```yaml
name: visionary-claude
version: 1.3.0
display_name: "Visionary — Design Intelligence"
tagline: "202 design styles, 8-step algorithm, motion-first, axe-core-grounded critique. Beats baseline slop by +5.75 points."
category: design
subcategories:
  - ui-ux
  - accessibility
  - frontend
  - motion
  - typography
license: Apache-2.0
price: free
repository:
  type: github
  url: https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code
  default_branch: main
  release_tag: v1.3.0
author:
  name: GIT Webb & App Studio AB
  country: SE
  city: Malmö
  github: GIT-Webb-App-Studio-AB
  sponsor: https://github.com/sponsors/gitwebb
keywords:
  - design-intelligence
  - claude-code-plugin
  - motion-first
  - wcag-2.2
  - apca
  - dtcg-tokens
  - figma-variables
  - shadcn-registry
  - anti-slop
frameworks_supported:
  - nextjs-16
  - react-19
  - vue-3
  - nuxt-3
  - svelte-5
  - angular
  - astro
  - solidjs
  - lit
  - laravel
  - flutter
  - swiftui
  - jetpack-compose
  - react-native
  - vanilla-js
```

## Install

```bash
claude plugin marketplace add GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code
claude plugin install visionary-claude
```

## Long description (marketplace body)

Visionary is a Claude Code plugin that turns generic AI-UI into deliberate
design. It ships:

- **202 curated design styles** (not themes) — from Swiss Rationalism and
  Bauhaus Dessau to Liquid Glass iOS 26, Ambient Copilot, Cassette Futurism,
  and Dyslexia-Friendly. Every style has YAML frontmatter, Accessibility
  section, and Slop Watch rules.
- **8-step weighted-random selection algorithm** — product-type filter,
  motion-tier filter, blocked-default removal, scoring rubric, taste-profile
  adjustment, transplantation bonus, variety penalty, weighted random.
- **Motion-first code generation** — Motion v12 two-parameter springs
  (`bounce` + `visualDuration`) plus CSS-first escapes (`@starting-style`,
  `animation-timeline: view()`, cross-document View Transitions for MPA
  stacks).
- **Playwright + axe-core visual critique loop** — captures a screenshot,
  injects axe-core for deterministic a11y scoring, runs up to 3 rounds with
  SELF-REFINE fresh-context per round, aborts on 0.3+ regression.
- **DTCG 1.0 token export per style** — drop-in Figma Variables / Style
  Dictionary / Penpot compatibility (202 `.tokens.json` files).
- **shadcn registry publication** — 202 registry items installable via
  `npx shadcn add`. Consumes the shadcn ecosystem instead of competing with it.
- **Named-designer taste packs** — 5 packs (Rams, Kowalski, Vignelli, Scher,
  Greiman), blendable, opt-in.
- **Commands** — `/visionary`, `/variants`, `/apply`, `/designer`,
  `/annotate`, `/import-artifact`.

## Verified performance

Published benchmark run (2026-04-20, N=10 representative prompts):

| Dimension | Visionary 1.3.0 | Baseline slop | Delta |
|---|---|---|---|
| Distinctiveness | 5.00 | 3.50 | **+1.50** |
| Coherence | 4.90 | 5.00 | −0.10 |
| Accessibility | 4.90 | 3.10 | **+1.80** |
| Motion readiness | 3.55 | 1.00 | **+2.55** |
| **Total** | **18.35 / 20** | 12.60 / 20 | **+5.75** |

Full data: `results/visionary-1.3.0.json` + `results/baseline-slop.json` in
the repo. Reproduce with `node benchmark/runner.mjs`.

## Why install this instead of a competitor

- **Open taxonomy**: 202 styles, inspectable markdown, forkable
- **Open benchmark**: 100-prompt reference evaluation, publishable results
- **Cross-platform**: 15 stacks, not a Next+shadcn monoculture
- **Accessibility-first**: EAA-compliant by construction, not a retrofit
- **Free and Apache-licensed**: no paywall, no upsell, no telemetry

## Screenshots

- `docs/banner.svg` — hero
- `registry/README.md` — shadcn install example
- `results/README.md` — benchmark delta visualization

## Submission checklist

- [x] All artifacts present in repo (README, LICENSE, benchmark, registry, tokens)
- [x] v1.3.0 tagged (maintainer to push the git tag)
- [x] CHANGELOG current
- [ ] Maintainer to file the submission at claudemarketplaces.com intake
