<div align="center">
<img src="logo visionary.png" alt="Visionary for Claude Code Logo" width="50%"/>
<img src="docs/visionary-hero.svg" alt="Visionary for Claude Code — design intelligence for Claude Code" width="100%"/>
</div>

<br/>

# visionary-claude

[![Version](https://img.shields.io/badge/v1.6.0-green?style=flat-square)](https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/releases/tag/v1.6.0)
[![Design Styles](https://img.shields.io/badge/STYLES-207-orange?style=flat-square)](#what-you-get)
[![Commands](https://img.shields.io/badge/COMMANDS-17-blue?style=flat-square)](#commands)
[![Frameworks](https://img.shields.io/badge/STACKS-15-purple?style=flat-square)](#what-you-get)
[![Languages](https://img.shields.io/badge/LANGUAGES-20+-teal?style=flat-square)](#what-you-get)
[![License](https://img.shields.io/badge/LICENSE-Apache_2.0-red?style=flat-square)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-black?style=flat-square)](https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code)
[![No Python](https://img.shields.io/badge/Python-NOT_REQUIRED-brightgreen?style=flat-square)](#requirements)

A Claude Code plugin for **distinctive, motion-first UI** across 15 frameworks. Generates code, runs a Playwright + axe-core critique loop, and learns from your preferences over time.

**17 commands** for everything from single components to multi-screen flows, photo/audio/mood inputs, 12 cinematic director styles, and runtime-context awareness.

> Full release history with per-sprint technical detail: [`CHANGELOG.md`](CHANGELOG.md).

---

<div align="center">

[![PayPal](https://img.shields.io/badge/PAYPAL-Donate-blue?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/donate/?business=BMNFKYM6BU3KG&no_recurring=0&item_name=Utveckling+av+mjukvara+och+Claude+Code+ekosystem&currency_code=USD)
[![GitHub Sponsors](https://img.shields.io/badge/GITHUB-Sponsor-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/gitwebb)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/gitwebb)

</div>

---

## Quick start

```bash
claude plugin marketplace add GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code
claude plugin install visionary-claude
```

In a Claude Code session, just describe a UI task — or use one of the commands below.

```
Designa en hero för en fintech-app
```

---

## Commands

### Core generation

| Command | What it does | When to use |
|---|---|---|
| `/visionary [prompt]` | Generates one component via 8-step style algorithm + critique loop | Default for any UI task |
| `/variants [prompt]` | 3 mutually-distinct designs (cosine ≥0.6 in 8D space) | Want options to compare |
| `/apply <style-id>` | Locks chosen style across the app + emits DTCG tokens | Maintain consistency across multi-page apps |
| `/annotate` | Browser-based visual annotations → AI edits | Rapid iteration on existing UI |
| `/import-artifact <path>` | Re-skin an existing component using Visionary | Refactor old/inconsistent designs |
| `/visionary-kit` | Manage realistic data fixtures for `content_resilience` dim | Design must survive real data (long names, diacritics, empty/error states) |
| `/visionary-taste status\|show\|forget\|reset\|export\|import\|browse` | Inspect/manage cross-session taste flywheel | Same prompt keeps converging on same designs |
| `/visionary-motion "<intent>"` | Re-tune motion tokens via natural language | "Make it softer" / "more energetic" |
| `/designer <pack>` | Activate designer subagent | Want a specific designer's taste applied (Rams, Kowalski, Vignelli, Scher, Greiman) |

### Anti-convergence

| Command | What it does | When to use |
|---|---|---|
| `/visionary-mood <coords\|text>` | Russell circumplex (valence × arousal) → style cluster | Mood matters more than archetype — `calm-melancholic`, `happy-anxious`, `serene`, etc. |
| `/visionary-coined list\|view\|rename\|eject` | Manage auto-promoted style-blends | Your favorite blends become new catalog entries after 3+ acceptances |

### Cross-modal inputs

| Command | What it does | When to use |
|---|---|---|
| `/visionary-from-photo <url\|path>` | Photo → palette + mood + motion-tier | Reference image as design seed |
| `/visionary-from-track <spotify\|mp3>` | Audio → Russell coords + tempo (60 BPM = 1000ms motion baseline) | Match a song's emotional energy |
| `/visionary-cinematic <director>` | 12 filmmaker styles | Cinematic vocabulary — Wong Kar-wai, Villeneuve, Wes Anderson, Nolan, Kubrick, Lynch, Tarkovsky, Denis, Bong, Parker, Garland, Coppola |

### Multi-screen / voice / runtime

| Command | What it does | When to use |
|---|---|---|
| `/visionary-flow <feature>` | 5 coherent UI states (list/detail/empty/error/loading) | Build feature flows with cross-screen consistency |
| `/visionary-voice [audio]` | Vocal prosody → spring tokens (pitch → stiffness, attack → mass) | "Smoooth ... snap" instead of typing motion params |
| `/visionary-patina status\|freeze\|unfreeze` | Design ages with the project (chroma drift, motion timing) | Sites that should feel lived-in, not freshly minted |

### Composable flags

```bash
/visionary --blend "swiss-rationalism:0.7 + liminal-space:0.3"   # Latent style mixing (slerp in 8D)
/visionary --constrain "no-rectangles, single-color"             # Force novelty via constraints
/visionary --no-vs                                                # Skip Verbalized Sampling
/visionary --runtime circadian,patina                             # Enable browser-runtime modules
/visionary-cinematic wong-kar-wai --cinematic-grade               # Apply director CSS color-grade
/visionary-from-photo X --vs                                      # Compose: photo + verbalized sampling
```

Natural language also works in prompts: `"Designa en hero som är 70% Swiss, 30% Liminal"` activates latent mixing automatically.

---

## What you get

- **207 styles** across 15 categories (Morphisms, Internet aesthetics, Historical movements, Contemporary UI, Typography-led, Industry-specific, Emotional, Material/texture, Futurist, Cultural/regional, Hybrid, Extended, plus v1.6.0's anti-AI-slop additions)
- **15 frameworks**: Next.js 16, React 19, Vue 3, Nuxt 3, Svelte 5, Angular, Astro, SolidJS, Lit, Laravel, Flutter, SwiftUI, Jetpack Compose, React Native, Vanilla JS
- **WCAG 2.2 AA + APCA** by construction — 4.5:1 + Lc ≥ 75 body text, 44×44 px targets, `prefers-reduced-motion` guards, deterministic axe-core in critique loop
- **20+ languages** with correct diacritics + font subsets (`latin-ext`, `cyrillic`, `greek`)
- **Motion v12** (two-parameter springs: `bounce` + `visualDuration`) + CSS-first (`@starting-style`, `animation-timeline`, View Transitions)
- **DTCG 1.0 token export** per style — Figma Variables, Style Dictionary v4, Penpot, Tokens Studio
- **Cross-session taste learning** — remembers what you accept/reject, refines style selection over time
- **Anti-AI-slop** — pre-critique slop-reject gate (≥2 patterns block before critique runs), 26-pattern detection, negative visual anchors

---

## Configuration

Behavior tunable via env flags. Most-used:

| Flag | Default | Purpose |
|---|---|---|
| `VISIONARY_DISABLE_CRITIQUE` | off | Full opt-out of critique loop |
| `VISIONARY_DISABLE_TASTE` | off | Opt-out of taste flywheel |
| `VISIONARY_TASTE_IN_REPO` | off | Force taste storage to project repo (default: `~/.claude/plugins/data/`) |
| `VISIONARY_VS_DISABLED` | off | Skip Verbalized Sampling Stage 1.5 |
| `VISIONARY_VS_ALPHA` | `0.65` | Anti-typicality boost exponent (Zhang 2025 sweet spot 0.6–0.7) |
| `VISIONARY_MULTI_CRITIC` | off | Enable critic-craft + critic-aesthetic parallel mode |
| `VISIONARY_VISUAL_EMBED` | off | Enable DINOv2 visual style match (requires manual setup) |
| `VISIONARY_MLLM_JUDGE` | off | `tie-only` or `on` to enable MLLM judge tie-breaking |
| `VISIONARY_PREVIEW_URL` | `http://localhost:3000` | Playwright target URL |
| `VISIONARY_PLAYWRIGHT_NS` | `mcp__plugin_visionary-claude_playwright` | Override Playwright MCP namespace if collision occurs |

Full list in [`docs/installation.md`](docs/installation.md).

---

## What makes it different

| | frontend-design | UI/UX Pro Max | Claude Design | **visionary-claude** |
|---|---|---|---|---|
| Surface | CLI plugin | CLI plugin | Web app | **CLI plugin** |
| Style catalogue | ~15 implicit | 67 named | Inferred | **207 with 8-step inference** |
| Style selection | Manual / prompt | Manual entry | Prompt + iterate | **Algorithm + weighted random + transplantation** |
| Anti-default bias | None | None | Partial | **Hard-rejects ≥2 slop patterns pre-critique** |
| Visual feedback | None | None | Inline canvas | **Playwright + axe-core (deterministic a11y)** |
| Taste memory | None | None | None | **Cross-session learning + git-harvest** |
| Multi-variant | No | No | Canvas revisions | **`/variants` — 3 distinct takes** |
| Multi-screen flow | No | No | No | **`/visionary-flow` — 5 coherent states** |
| Cross-modal inputs | No | No | No | **photo / audio / mood / cinematic director** |
| Token export | None | None | Figma only | **DTCG 1.0 — Figma / Style Dictionary / Penpot** |
| Python required | No | **Yes (Windows bugs)** | Cloud | **No — Node 18+ only** |

---

## Documentation

**Getting started:**
- [Installation guide](docs/installation.md) — GitHub, local, session-only, enterprise/air-gapped
- [End-to-end tests](docs/e2e-tests.md) — 5 acceptance test scenarios
- [Local test guide](docs/local-test-1.6.0.md) — pre-merge testing

**Concepts:**
- [Critique principles](docs/critique-principles.md) — evidence-over-vibes, 10-dimension scoring, multi-agent layout
- [Taste flywheel](docs/taste-flywheel.md) — active + passive + pairwise signals, aging rules
- [Taste privacy](docs/taste-privacy.md) — what's stored, where, opt-out
- [Style embeddings](docs/style-embeddings.md) — 8-dim aesthetic vectors

**v1.6.0 commands & features:**
- [Anti-typicality](docs/anti-typicality.md) — Verbalized Sampling + originality dimension
- [Latent style mixing](docs/latent-style-mixing.md) — slerp in 8D embedding space
- [Mood slider](docs/mood-slider.md) — Russell circumplex
- [From-photo](docs/from-photo.md) / [From-track](docs/from-track.md) / [Spotify setup](docs/spotify-setup.md)
- [Constraints](docs/constraints.md) — 40-rule catalog
- [Coined styles](docs/coined-styles.md) — auto-promoted blends
- [Visionary flow](docs/visionary-flow.md) / [Visionary voice](docs/visionary-voice.md)
- [Runtime context](docs/runtime-context.md) — [circadian](docs/circadian-design.md) / [network-aware](docs/network-aware.md) / [patina](docs/patina-mode.md)

**Reference:**
- [`CHANGELOG.md`](CHANGELOG.md) — full release history with per-sprint detail
- [`docs/sprints/`](docs/sprints/) — design specs for every sprint

---

## Requirements

- Claude Code ≥ 1.0.0
- Node.js ≥ 18
- No Python dependency
- Optional per command: `sharp` (from-photo), Spotify dev credentials (from-track), `@xenova/transformers` (CLIP / CLAP)

---

## Contributing

Open an issue before submitting a pull request for non-trivial changes.

**Style contributions** should follow the format of existing files under `skills/visionary/styles/` and include YAML frontmatter (`id`, `category`, `motion_tier`, `density`, `locale_fit`, `palette_tags`, `keywords`, `accessibility`), and core sections for Typography, Colors, Motion, Spacing, Code Pattern, Accessibility, and Slop Watch.

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
