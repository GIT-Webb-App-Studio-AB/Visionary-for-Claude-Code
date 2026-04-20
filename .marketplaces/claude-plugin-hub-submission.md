# ClaudePluginHub — Submission Draft

**Target:** https://claudepluginhub.com (submit via their "Add a plugin" flow
or open a PR to their catalogue repo — verify current channel before filing).

---

## Submission payload

```json
{
  "slug": "visionary-claude",
  "name": "Visionary — Design Intelligence",
  "version": "1.3.0",
  "published_at": "2026-04-20",
  "authors": [
    { "name": "GIT Webb & App Studio AB", "github": "GIT-Webb-App-Studio-AB" }
  ],
  "license": "Apache-2.0",
  "repo": "https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code",
  "homepage": "https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code",
  "category": "design",
  "verified_benchmark": true,
  "benchmark_score": 18.35,
  "baseline_score": 12.60,
  "benchmark_path": "results/visionary-1.3.0.json",
  "short_description": "202 design styles, 8-step selection, motion-first generation, axe-core-grounded critique, DTCG token export. WCAG 2.2 AA + APCA.",
  "install_command": "claude plugin install visionary-claude",
  "commands": ["visionary", "variants", "apply", "designer", "annotate", "import-artifact"],
  "agents": ["visual-critic"],
  "hooks": ["SessionStart", "PostToolUse", "UserPromptSubmit"]
}
```

## Narrative description (for the hub's listing body)

Most Claude Code design skills produce recognizably-AI output — Inter,
blue gradient, uniform border-radius, `shadow-md` on every card. Visionary
is the counter-move: a taxonomy of 202 curated design styles, a weighted-
random selection algorithm that systematically prefers cross-domain
transplantations over obvious matches, and an axe-core-grounded critique
loop that scores every output against 8 dimensions — including a
deterministic accessibility dimension that WCAG 2.2 AA + APCA Lc floors.

The first published benchmark run (N=10 representative prompts) scores
Visionary **18.35 / 20** against a generic-slop baseline of **12.60 / 20** —
a delta of **+5.75 points**, with motion-readiness (+2.55), accessibility
(+1.80), and distinctiveness (+1.50) driving the gap.

## Key differentiators vs other design plugins

1. **Taste calibration** — after 3 rejections of the same style, it's
   permanently flagged for the project. No other plugin ships this.
2. **Multi-variant generation** — `/variants` produces 3 mutually-distinct
   takes before entering the critique loop (SELF-REFINE pattern).
3. **Consistency lock** — `/apply` emits DTCG tokens and locks the chosen
   style across all routes. No more "each page looks like a different app".
4. **Named-designer packs** — opt-in taste profiles (Rams, Kowalski,
   Vignelli, Scher, Greiman), blendable.
5. **Browser annotation** — `/annotate` gives Cursor-3-Design-Mode parity
   via Playwright. Click on a rendered element, describe the change, get a
   code edit.
6. **Framework breadth** — 15 stacks including Flutter, SwiftUI, Jetpack
   Compose. Not a Next.js/shadcn monoculture.

## Tags

design, ui, ux, motion, wcag, apca, dtcg, figma, shadcn, playwright,
axe-core, taste-calibration, multi-variant, anti-slop, accessibility-first

## Screenshots

- `docs/banner.svg`

## Submission checklist

- [x] Plugin works end-to-end in Claude Code 1.0+
- [x] Verified benchmark result published in repo
- [x] No paid upsell / telemetry inside the plugin
- [x] Documentation complete
- [ ] Maintainer to submit via ClaudePluginHub's intake channel

## Contact

davidrydgren@gmail.com — for issues, corrections, feature requests.
