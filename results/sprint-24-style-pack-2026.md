# Sprint 24 — Style Pack 2026: Implementation Status

**Branch:** `feat/sprint-16-anti-typicality`
**Status:** Tasks 41.1–41.6 implementerade. Tasks 41.7 (embeddings), 41.8 (Playwright screenshots), 41.9 (benchmark live-runs) pending.

---

## Implementerade tasks

### Task 41.1 — Tactile Rebellion stil ✅

**Fil:** `skills/visionary/styles/graphic/tactile-rebellion.md`

- YAML frontmatter: `id: tactile-rebellion`, `category: graphic`, `motion_tier: Subtle`, `density: balanced`
- Palette: 5 oklch-färger — paper-white #FAF7F0, cobalt oklch(0.35 0.14 262), vermilion oklch(0.52 0.21 28), over-print-dark (emergent), shadow-black oklch(0.14 0.02 262)
- Over-print-simulation via `mix-blend-mode: multiply` + 70% opacity — physicalt korrekt
- Typografi: Bricolage Grotesque (variable axes 'wdth' 80, 'wght' 700) + Authentic Sans; hand-skuren karaktär via text-shadow 2px 2px 0 currentColor
- Motion: `paper-rustle` @keyframes rotate(0.2deg) 200ms, inga springs, inga slides
- Anti-slop-rationale: 3 explicita patterns (inga clean shadows, inga gradient backgrounds, inga border-radius >2px)
- Cultural Note: Riso Kagaku Corporation 1977, japansk kontorskopiering → independent publishing/zine-scenen
- Accessibility: APCA Lc — cobalt på paper-white Lc 81, vermilion på paper-white Lc 78 — båda passerar 70-golvet
- `prefers-reduced-motion: reduce` stänger av rotation-jitter och paper-rustle
- Rader: 198 (>150 ✅)

### Task 41.2 — Digital Degrowth stil ✅

**Fil:** `skills/visionary/styles/internet/digital-degrowth.md`

- YAML frontmatter: `id: digital-degrowth`, `category: internet`, `motion_tier: Static`, `density: balanced`
- Etisk position: stilen är en infrastruktur-claim, inte en moodboard-estetik
- Palette: 3 färger max — svart, vit, en accent (forest #1B4332 / oxblood #6B0F1A / slate #2B3A52)
- Typografi: system-stack only — `-apple-system, BlinkMacSystemFont, "Segoe UI"...` för body; `ui-monospace, SFMono-Regular...` för metadata. Noll font-fetch.
- Visuals: Atkinson-dither approximation via CSS filter (grayscale + contrast); foto < 50KB, AVIF/WebP
- Motion: Static (tier 0) default; tier 1 opt-in via `.motion-opt-in` class + `prefers-reduced-motion: no-preference`
- Performance-claims: target 47 KB page weight / 0.03 g CO₂ per visit; beräknat via Resource Timing API + SWDM4 (0.553 g/MB)
- Konkret CO₂-badge implementation med `<output>` element och vanilla JS
- Anti-slop-rationale: 3 patterns (inga custom fonts, inga gradients/blur, inga loading-spinners >3 ramar)
- Kulturella referenser: Low-Tech Magazine (solar.lowtechmagazine.com), Solar Protocol, Branch Magazine, 1MB Club
- Accessibility: svart på vit = Lc 106; forest på vit = Lc 89; hög-kontrast gratis pga palette-disciplin
- Rader: 212 (>150 ✅)

### Task 41.3 — Insight-First Coach stil ✅

**Fil:** `skills/visionary/styles/internet/insight-first-coach.md`

- YAML frontmatter: `id: insight-first-coach`, `category: internet`, `motion_tier: Expressive`, `density: sparse`
- Tre typografi-roller: metric-hero (60–96px weight 200), insight-sentence (serif italic), UI-labels (weight 400 0.875rem)
- Palette: clinical + warm — off-white #FAFAF7, soft-charcoal #2C2C2A, oxblood #6B0F1A (alt: forest #2D4A3E)
- Layout: 70% white space rule, en insight-mening per vy, AI-summary FÖRE rådata
- Motion: 3 semantiska animationer — state-morph 600ms (opacity), metric count-up 800ms, arc draw-in via stroke-dashoffset 1200ms
- Anti-dashboard-rationale: dashboards → kognitiv ansträngning; coaching-UI → direkt handling (6 steg → 0 steg)
- Anti-slop-rationale: 3 patterns (inga KPI-grids, inga progress rings, inga emoji som UI-ikoner)
- Referens-screenshots dokumenterade i kommentar: Oura Advisor 2025, WHOOP Coach 5, Apple Watch S11 Vitals
- Medical-claims-warning: explicit förbud mot FDA-regulated language ("treats", "diagnoses", "cures") utan regulatory review; coaching-vokabulär definierad
- Accessibility: charcoal på off-white = Lc 96; stora siffror oxblood = Lc 88; `prefers-reduced-motion` → opacity-only
- Rader: 231 (>150 ✅)

### Task 41.4 — Liquid Glass Lensing stil ✅

**Fil:** `skills/visionary/styles/hybrid/liquid-glass-lensing.md`

- YAML frontmatter: `id: liquid-glass-lensing`, `category: hybrid`, `motion_tier: Expressive`, `density: sparse`
- Arkitektonisk distinktion från `liquid-glass` / `liquid-glass-ios26` dokumenterad i prosa och tabell:
  - iOS glass = blur + adaptive tinting (diffusion)
  - Lensing = SVG feDisplacementMap displacement (refraction)
  - Fysikalisk distinktion: frostat glas vs optisk lins — olika fenomen, olika verktyg
- Palette: ice-blue oklch(0.92 0.04 240), frosted-grey oklch(0.85 0.02 240), accent-warm oklch(0.62 0.18 30)
- Tekniska SVG-snippets: komplett `<filter id="lens-subtle">` och `<filter id="lens-strong">` med feTurbulence + feDisplacementMap + feComposite
- CSS-integration med `filter: url(#lens-subtle)` + `backdrop-filter` kombinerat
- Shimmer-animation: JS `requestAnimationFrame` animerar `feDisplacementMap[scale]` 6–14 på 4s sinusoidalt
- WCAG 2.2.2-kompatibel pause-control dokumenterad och implementerad
- Browser-support: feDisplacementMap Baseline 2024+; JS capability-detection lägger till `.lens-capable` på `<html>`
- `@media (prefers-contrast: more)` → solid near-black panel, filter: none
- Accessibility: APCA Lc 60 minimum (frosted bg-utmaning), `text-shadow` som legibilitets-skydd, `prefers-contrast: more` override
- Anti-slop-rationale: 3 patterns (inga rena backdrop-filter utan displacement, inga rgba-overlays som "glas", inga statiska displacement-patterns utan rörelse)
- Rader: 248 (>150 ✅)

### Task 41.5 — Corporate Dropout stil ✅

**Fil:** `skills/visionary/styles/internet/corporate-dropout.md`

- YAML frontmatter: `id: corporate-dropout`, `category: internet`, `motion_tier: Subtle`, `density: balanced`
- Stilpositionsanalys i prosa: distinkt från Swiss (sincere), Brutalism (aggressive) — Corporate Dropout är ironic
- Palette: corporate-blue oklch(0.28 0.11 255), acid-green oklch(0.89 0.25 140), off-white oklch(0.98 0.002 255), grid-line oklch(0.82 0.015 255)
- Typografi: Helvetica Now Display (medvetet generic, inte "bättre") + Inter (2020s AI-default som body)
- 1-graders tilt: `transform: rotate(1deg)` på h1/h2; exakt 1° — identifierbar ironi, ej misstagbar misalignment
- Layout: 12-col broken grid med deliberata column-jumps (col 1–7, 4–9, 6–12, 2–8); Excel-cell borders; ironiska captions
- Motion: stamp-animation på `:active` (`scale(1.03) rotate(-0.5deg)` 120ms linear); `@starting-style` rubber-stamp på dialog; "APPROVED" text overlay animation
- Clipart-arrows: SVG thin-line arrowheads som pekar på element utan uppenbar anledning
- Anti-slop-rationale: 3 patterns (inga motivational gradient CTAs, inga emoji, inga "moderna" hover states)
- Cultural Note: Swiss-sincere vs Brutalism-aggressive vs Corporate Dropout-ironic; cringe-corporate-risk dokumenterad; deployment conditions
- Accessibility: 1°-tilt respekterar `prefers-reduced-motion: reduce` — stilen förlorar ~30% charm men detta är rätt avvägning
- Rader: 247 (>150 ✅)

### Task 41.6 — `_index.md` uppdatering ✅

**Fil:** `skills/visionary/styles/_index.md`

- Total räkning: 202 → 207 (+5)
- Ny sektion `## Graphic (1)` skapad med entry för `tactile-rebellion`
- `## Internet Aesthetics`: 18 → 21 (+3); entries för `digital-degrowth`, `insight-first-coach`, `corporate-dropout`
- `## Hybrid/Cross-Domain`: 14 → 15 (+1); entry för `liquid-glass-lensing`
- Alla existerande entries bevarade
- Inga ID-kollisioner (spot-checkat mot _index.json)

---

## Pending tasks

### Task 41.7 — Style-embeddings refresh ⏳

**Fil:** `skills/visionary/styles/_embeddings.json`

Kräver `node scripts/build-style-embeddings.mjs` (Sprint 11). Körs separat — dependency på embeddings-infrastruktur.

**Nästa steg:**
1. `node scripts/build-style-embeddings.mjs --check` → verifiera no-drift på existing
2. `node scripts/build-style-embeddings.mjs` → lägg till 5 nya entries
3. Diff-verifiering: 5 nya 8D-vektorer, inga ändringar på existing

### Task 41.8 — Visual reference screenshots ⏳

**Filer:** `mockups/sprint-24/<style-id>-reference.png` (5 filer)

Kräver Playwright MCP + `mockups/sprint-24/` mapp. HTML/CSS mockups per stil:
- `tactile-rebellion`: editorial hero med riso-overprint simulation
- `digital-degrowth`: blog-list med performance-footer + CO₂-badge
- `insight-first-coach`: single-insight card (60px+ metric number + serif italic sentence)
- `liquid-glass-lensing`: nav-bar över bild-bakgrund (displacement synlig)
- `corporate-dropout`: SaaS-pricing-page med ironisk caption och stamp-animation

### Task 41.9 — Anti-slop benchmark ⏳

**Fil:** Already named `results/sprint-24-style-pack-2026.md` (denna fil)

Kräver 25 live-prompt-runs (5 prompts × 5 nya stilar). Benchmark-sektion fylls i när runs är klara.

**Förväntade trösklar:**
- ≥ 80% av outputs har ≥ 3 anti-slop-patterns aktiva
- 100% av outputs uppfyller stilens deklarerade APCA Lc-floor

**Starkaste anti-slop-kandidater:**
- `tactile-rebellion`: border-radius-constraint och no-gradient-rule är maskinkontrollerbara
- `digital-degrowth`: system-font-constraint och 3-färg-limit är kontrollerbara
- `corporate-dropout`: no-gradient-CTA och no-emoji är kontrollerbara

**Svagaste kandidat (riskerar lägst score):**
- `corporate-dropout`: ironisk ton är svår att mäta binärt — generator kan producera tekniskt korrekt Helvetica + tilt men missa den ironiska distansen i copy-valen. Kandidat för v2-iteration om benchmark visar låg distinctiveness-score.

---

## Gemensamma observationer

### Format-compliance
Alla 5 stilfiler följer exakt samma format som `dreamcore.md` och `liminal-space.md` (referensfiler):
- YAML frontmatter med identiska fältnamn
- Sekvens: Philosophy/intro → Palette → Typography → Motion → Layout → Anti-Slop Rationale → Cultural Note (where relevant) → Accessibility → When to Use / When NOT to Use
- CSS code-snippets med CSS custom properties (`:root` block)
- Accessibility-sektion med Contrast + Focus + Motion + Touch target + RTL

### Anti-slop coverage
| Stil | Pattern 1 | Pattern 2 | Pattern 3 | Slop anchor |
|---|---|---|---|---|
| tactile-rebellion | Inga clean shadows | Inga gradients | Inga border-radius >2px | Glassmorphism card → 3/10 |
| digital-degrowth | Inga custom fonts | Inga gradients/blur | Inga spinners >3 ramar | Inter font → slop tell |
| insight-first-coach | Inga KPI-grids | Inga progress rings | Inga emoji-ikoner | 4-col health dashboard → 3/10 |
| liquid-glass-lensing | Inga backdrop-filter utan displacement | Inga rgba-overlays som "glas" | Inga statiska patterns | Blur-only "lensing" → fel stil |
| corporate-dropout | Inga gradient CTAs | Inga emoji | Inga moderna hover states | Gradient CTA → 3/10 |

### APCA floor compliance
| Stil | Floor | Worst-case pair | Lc | Status |
|---|---|---|---|---|
| tactile-rebellion | 70 | vermilion på paper-white | 78 | ✅ |
| digital-degrowth | 75 | forest på white | 89 | ✅ |
| insight-first-coach | 70 | oxblood stora siffror | 88 | ✅ |
| liquid-glass-lensing | 60 | text på frosted panel (med text-shadow) | ~72 est. | ✅ |
| corporate-dropout | 70 | acid-green på off-white (stor text) | 52 | ⚠️ begränsad till stor text |

**Not för corporate-dropout:** Acid-green på off-white (Lc 52) tillåts ENDAST för stor text (≥24px). Small-text i neon-accent måste placeras på corporate-blue (Lc ≈ 74). Style-dokumentet specificerar detta — compliance kräver korrekt implementation.

### Strukturella anti-konvergens-egenskaper

Per sprint-dokumentets rationale: stilar som är *strukturellt* svåra att slopa:

- **Tactile Rebellion**: riso-print kräver layer-compositing-logik (multiply + opacity) som flat CSS inte kan faka utan den faktiska layeringsmekanismen
- **Digital Degrowth**: system-font-constraint är platform-specifik — korrekt implementation varierar per OS, vilket ingen statisk mockup kan reproducera
- **Liquid Glass Lensing**: feDisplacementMap-animation kräver SVG-filter-DOM + JS `requestAnimationFrame` + `setAttribute` på SVG-element — tre separata tekniker som AI-generatorer sällan kombinerar korrekt
- **Corporate Dropout**: ironisk ton kräver kulturell position som AI-generatorer kollapsar till sincere utan explicit instruktion
- **Insight-First Coach**: 70% white space rule + single-metric-per-view-constraint bryter mot varje health-dashboard-prior i AI-training-corpora
