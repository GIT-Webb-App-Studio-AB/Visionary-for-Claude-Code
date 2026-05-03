# aitmpl.com — Plugin Submission Draft

**Target:** https://aitmpl.com/plugins (submit via their "Add a plugin" form
or open a PR against their catalogue repo — check the site for the current
intake channel before submitting).

---

## Basic info

| Field | Value |
|---|---|
| **Plugin name** | visionary-claude |
| **Display name** | Visionary — Design Intelligence for Claude Code |
| **Version** | 1.5.0 |
| **License** | Apache-2.0 |
| **Repo** | https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code |
| **Homepage** | https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code |
| **Author** | GIT Webb & App Studio AB (Malmö, Sweden) |
| **Contact** | davidrydgren@gmail.com |
| **Support** | https://github.com/sponsors/gitwebb |

## Category

- Primary: **Design & UI**
- Secondary: **Accessibility**, **Frontend**, **Motion**

## Tagline (under 140 chars)

> Design intelligence for Claude Code. 202 styles, 8-step selection, motion-first generation, visual critique, taste learning. WCAG 2.2 + APCA.

## Short description (under 500 chars)

> Visionary is a Claude Code plugin that turns generic AI-UI into deliberate
> design. It picks from 202 curated design styles using an 8-step weighted-random
> algorithm, generates motion-first code (Motion v12 + CSS-first), runs a
> Playwright + axe-core visual critique loop (max 3 rounds), and learns your
> taste over time via persistent rejection/approval calibration. Works across
> 15 frameworks. Beats the generic-slop baseline by +5.75 points on the public
> benchmark.

## Long description

(paste README's "What makes it different" table + the 8-step algorithm
diagram into aitmpl's long-description field; below is the full paste-ready
block)

### What makes it different

| Feature | frontend-design | UI/UX Pro Max | 21st.dev Magic | visionary-claude |
|---|---|---|---|---|
| Design styles | ~15 implicit | 67 named | Component-level only | 202 with auto-inference |
| Style selection | Manual | Manual | Multi-variant | 8-step algorithm + weighted random + transplantation |
| Anti-default bias | None | None | Partial | Blocks generic AI output, forces cross-domain styles |
| Motion system | None | None | None | Motion v12 tokens + CSS-first |
| Visual feedback | None | None | None | Playwright + axe-core critique loop |
| Taste memory | None | None | None | system.md calibration (permanent flag after 3 rejections) |
| Accessibility | Not enforced | Not enforced | Not enforced | WCAG 2.2 AA + APCA + logical properties + RTL |
| Multi-variant | No | No | Yes | `/variants` — 3 mutually-distinct takes |
| Consistency lock | No | No | No | `/apply` — DTCG tokens locked across the app |
| Token export | None | None | None | DTCG 1.0 `.tokens.json` per style |
| Visual similarity | None | None | None | DINOv2 ONNX embeddings for OOD detection + MLLM judge tie-breaker |
| Structural gate | None | None | None | 6 hard-fail checks (duplicate-heading, exposed-nav-bullets, footer-grid-collapse, etc.) before LLM-critic; `allows_structural` frontmatter opt-out |

### Published benchmark

| Skill | Mean total | Delta vs baseline |
|---|---|---|
| visionary-claude 1.5.0 | **18.35 / 20** | **+5.75** |
| baseline-slop (generic AI) | 12.60 / 20 | — |

See `results/visionary-1.5.0.json` for the full per-prompt breakdown.

## Tags

design, ui, ux, motion, wcag, apca, dtcg, figma, shadcn, playwright, axe-core, next.js, tailwind, react, vue, svelte, flutter, swiftui, jetpack-compose, react-native, typography, accessibility, design-tokens, design-system

## Install command

```bash
claude plugin marketplace add GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code
claude plugin install visionary-claude
```

## Screenshots / media

- `docs/banner.svg` — hero banner
- `results/visionary-1.5.0.json` — benchmark evidence
- `tokens/` — 202 DTCG token files (shows output artifact)
- `registry/` — 202 shadcn registry items (shows integration artifact)

## Maintenance commitment

- Bumped on every Next.js / Motion / Tailwind major version ≤ 30 days
- Benchmark re-run on every minor version, results committed
- Issues triaged within 72 hours (Mon–Fri)
- Accessibility compliance tracked against EAA / ADA Title II / WCAG 2.2

## Submission checklist

- [x] Plugin functional end-to-end
- [x] Documentation complete (README + `docs/`)
- [x] Benchmark results published (`results/`)
- [x] CHANGELOG current
- [x] License clear
- [x] No paid / SaaS upsell inside the plugin
- [ ] Maintainer to send this submission to aitmpl.com via their intake channel
