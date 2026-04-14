<div align="center">
<img src="docs/banner.svg" alt="Visionary for Claude Code — 186 design styles, 8-step algorithm, motion-first" width="100%"/>
</div>

<br/>

# visionary-claude

[![Release](https://img.shields.io/badge/RELEASE-stable-blue?style=flat-square)](https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/releases)
[![Version](https://img.shields.io/badge/v1.2.0-green?style=flat-square)](https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code)
[![Design Styles](https://img.shields.io/badge/DESIGN_STYLES-186-orange?style=flat-square)](#186-design-styles)
[![Frameworks](https://img.shields.io/badge/FRAMEWORKS-5-purple?style=flat-square)](#frameworks-supported)
[![Languages](https://img.shields.io/badge/LANGUAGES-20+-teal?style=flat-square)](#language-support)
[![License](https://img.shields.io/badge/LICENSE-Apache_2.0-red?style=flat-square)](LICENSE)

[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-black?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48L3N2Zz4=)](https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code)
[![No Python](https://img.shields.io/badge/Python-NOT_REQUIRED-brightgreen?style=flat-square)](#requirements)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG_2.2-AA-blue?style=flat-square)](#)
[![PayPal](https://img.shields.io/badge/PayPal-Support-blue?style=flat-square&logo=paypal)](https://www.paypal.com/donate/?business=BMNFKYM6BU3KG&no_recurring=0&item_name=Utveckling+av+mjukvara+och+Claude+Code+ekosystem&currency_code=USD)
[![Sponsor](https://img.shields.io/badge/GitHub-Sponsor-ea4aaa?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/gitwebb)

A Claude Code plugin that provides **design intelligence** for building distinctive, motion-first UI components across multiple platforms and frameworks.

---

<div align="center">

### Design Intelligence for Claude Code

Generate distinctive UI with **186 design styles**, an **8-step selection algorithm**, **motion-first code**, and a **visual feedback loop** that learns from your preferences.

Built for Next.js 15 | React 19 | Vue 3 | Svelte 5 | Vanilla JS

</div>

---

<div align="center">

| | | | | | | |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **186** | **8** | **5** | **12** | **6** | **20+** | **3** |
| Design Styles | Algorithm Steps | Frameworks | Slop Detectors | Motion Presets | Languages | Critique Rounds |

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

| Feature | frontend-design | UI/UX Pro Max | visionary-claude |
|---------|----------------|---------------|-----------------|
| Design styles | ~15 implicit | 67 named | **186 with auto-inference** |
| Style selection | Manual / prompt-based | Manual name entry | **8-step algorithm with weighted random + transplantation** |
| Anti-default bias | None | None | **Blocks generic AI output, forces cross-domain styles** |
| Motion system | None | None | **Spring token system (motion/react)** |
| Visual feedback | None | None | **Playwright critique loop (screenshot > score > fix)** |
| Taste memory | None | None | **system.md calibration (learns across sessions)** |
| Accessibility | Not enforced | Not enforced | **WCAG 2.2 AA baked in (EU Accessibility Act)** |
| i18n typography | ASCII only | ASCII only | **20+ languages with correct diacritics** |
| Component awareness | None | None | **Filters styles by UI type (dashboard, form, table)** |
| Determinism | Same prompt = same output | Same prompt = same output | **Weighted random: same prompt can yield 3 different styles** |
| Python required | No | Yes (bugs on Windows) | **No -- shell + Node only** |

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

In a Claude Code session, type `/visionary` or describe any UI task. The plugin activates automatically on design-related requests.

---

## How it works

### Five-stage pipeline

1. **Context Inference** -- Detects language, product type, audience, brand archetype, and tone from your prompt. Runs the 8-step selection algorithm to pick a style from 186 candidates.

2. **Design Reasoning Brief** -- Shows the selected style, runner-up alternatives with probability weights, and the scoring logic before generating code. You can redirect or say "try #2 instead".

3. **Motion-First Code** -- Every component ships with spring animation tokens via `motion/react`. Six presets: micro, snappy, ui, gentle, bounce, layout. All gated on `prefers-reduced-motion`.

4. **Visual Critique Loop** -- Playwright screenshots the rendered output, scores it on 8 aesthetic dimensions, detects 12 slop patterns, and applies fixes automatically. Runs up to 3 rounds.

5. **Taste Calibration** -- Reject a style and `system.md` records the rejection. Approve a style and it gets reinforced. The plugin never proposes rejected patterns again, and boosts approved directions.

### 8-step selection algorithm (v2)

```
186 styles
  | Step 1: Category filter (product type -> 3-4 categories)
 ~40 styles
  | Step 2: Motion tier filter
 ~20 styles
  | Step 2.5: Component type compatibility filter
 ~14 styles
  | Step 3: Blocked default removal
 ~10 styles
  | Step 4: Explicit scoring rubric (5 signals x 1-5)
  | Step 4.5: Taste profile adjustment (from system.md)
 Top 5
  | Step 5: Context-aware transplantation bonus (+0% to +35%)
  | Step 6: Variety penalty (session + cross-session with decay)
 Top 3
  | Step 7: Weighted random selection
 Winner
```

**Key properties:**
- Same prompt can produce different styles across users (weighted random)
- Cross-domain transplantation is systematically preferred over obvious matches
- Generic styles (fintech-trust, saas-b2b-dashboard, dark-mode+gradient) are blocked
- Recently used styles decay over 7 days before becoming eligible again
- User rejections and approvals persist and influence future selections

---

## 186 design styles

| Category | Count | Examples |
|----------|------:|---------|
| Morphisms | 12 | Glassmorphism, Liquid Glass (iOS 26), Neumorphism, Neubrutalism |
| Internet aesthetics | 18 | Vaporwave, Y2K Futurism, Cyberpunk Neon, Dark Academia |
| Historical movements | 16 | Bauhaus, Swiss Rationalism, Constructivism, Art Deco, Memphis |
| Contemporary UI | 14 | Bento Grid, Dark Mode First, Terminal CLI, Data Visualization |
| Typography-led | 10 | Kinetic Type, Big Bold Type, Variable Font, Condensed Editorial |
| Industry-specific | 16 | Fintech Trust, Bloomberg Terminal, Medtech Clinical, Gaming |
| Emotional / psychological | 12 | Dopamine Design, Zen Void, Luxury Aspirational, Trust Safety |
| Material / texture | 10 | Paper Editorial, Concrete Brutalist, Metal Chrome, Glass Crystal |
| Futurist / sci-fi | 14 | Sci-Fi HUD, Biomorphic Futurism, Quantum Particle, Retrofuturism |
| Cultural / regional | 10 | Scandinavian Nordic, Japanese Minimalism, K-Design, Guochao |
| Hybrid / cross-domain | 12 | Architecture Inspired, Fashion Editorial, Music Album Art, Zine DIY |
| Extended | 42 | Grainy Blur, Surveillance UI, Corporate Grunge, Witchcore |

All styles support **transplantation** -- applying a style outside its native domain (e.g., newspaper grid applied to accounting software) for distinctive, memorable results.

---

## Language support

The plugin detects language from your prompt and enforces correct rendering:

- **Correct diacritics**: "Bokforing" is a blocking defect -- it must be "Bokforing" with proper characters
- **Font subsets**: Google Fonts URLs automatically include `latin-ext` for European languages
- **HTML lang attribute**: Set correctly based on detected language
- **20+ languages**: Swedish, Finnish, Norwegian, Danish, German, French, Spanish, Portuguese, Polish, Czech, Turkish, Icelandic, Romanian, Russian, Japanese, Korean, Chinese (Simplified/Traditional), Arabic, Hebrew, Hindi, English

---

## Component type awareness

The algorithm filters styles based on what you are building:

| Component | Removes incompatible styles |
|---|---|
| Dashboard | zen-void, big-bold-type, psychedelic, dreamcore |
| Data table | handwritten-gestural, dada, moodboard-collage |
| Form | newspaper-broadsheet (columns break forms), glitchcore |
| Settings / Admin | art-nouveau (ornament conflicts with utility) |
| Hero / Landing | All styles compatible |

---

## Frameworks supported

- Next.js 15 (App Router + Server Components)
- React 19
- Vue 3 (Composition API)
- Svelte 5 (Runes)
- Vanilla JS (Web Animations API)

Framework detection runs automatically at session start via `detect-framework.sh`.

---

## Requirements

- Claude Code >= 1.0.0
- Node.js >= 18
- No Python dependency

---

## Documentation

- [Installation guide](docs/installation.md) -- GitHub, local, session-only, enterprise/air-gapped
- [End-to-end tests](docs/e2e-tests.md) -- 5 acceptance test scenarios

---

## Contributing

Contributions welcome. Open an issue before submitting a pull request for non-trivial changes.

**Style contributions** should follow the format of existing files under `skills/visionary/styles/` and include the required frontmatter fields (category, motion tier, typography, colors, motion, spacing, code pattern, slop watch).

---

## License

[Apache 2.0](LICENSE)

---

<div align="center">

Built by **GIT Webb & App Studio AB**, Stockholm, Sweden.

Free and open source.

[![PayPal](https://img.shields.io/badge/PayPal-Donate-blue?style=flat-square&logo=paypal)](https://www.paypal.com/donate/?business=BMNFKYM6BU3KG&no_recurring=0&item_name=Utveckling+av+mjukvara+och+Claude+Code+ekosystem&currency_code=USD)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-ea4aaa?style=flat-square&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/gitwebb)

</div>
