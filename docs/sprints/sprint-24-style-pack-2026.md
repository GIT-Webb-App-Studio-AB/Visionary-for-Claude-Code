# Sprint 24 — Style Pack 2026: 5 nya rörelser bortom katalog

**Vecka:** 37
**Fas:** 13 — Stilkatalog-utvidgning (NY fas)
**Items:** 41 från roadmap (ny)
**Mål:** Lägg till 5 stilar från 2026 års designscen som INTE finns i katalogen och INTE är planerade i tidigare sprintar. Tre av dem är medvetet anti-AI-slop — de motverkar generativ konvergens kulturellt genom att vara svåra för diffusionsmodeller att efterlikna utan synliga artefakter. Alla 5 har minst 12 månaders kulturell uthållighet och ger katalogen distinkt täckning där den idag är tunn (2026-fynd, ironisk corporate, etisk degrowth, klinisk insight, faktisk optisk lensing).

Wild idea från forskningen: bästa anti-konvergens-skyddet är ibland att lägga till stilar som är *strukturellt* svåra att slop:a. Tactile Rebellion (riso-print, hand-skuren typografi) och Digital Degrowth (system-fonter, max 3 färger, performance-flex) tvingar AI att producera något distinct — riso-print kräver förskjuten färgseparation, system-fonter kräver platform-detection, performance-flex kräver mätbar CO₂-claim. Varje sådan tvingande egenskap gör outputen mindre slop-prone.

## Scope

- Item 41 — Style Pack 2026: 5 nya stilar (Tactile Rebellion, Digital Degrowth, Insight-First Coach, Liquid Glass Lensing-Web, Corporate Dropout), `_index.md`-uppdatering, embeddings-refresh, Playwright-screenshots, anti-slop benchmark.

## Pre-flight checklist

- [ ] Sprint 11 (visual-embeddings + `scripts/build-style-embeddings.mjs`) mergad — krävs för Task 41.7
- [ ] `mockups/sprint-24/` mapp skapad (för Task 41.8 screenshots)
- [ ] Playwright MCP tillgänglig (för screenshot-generering)
- [ ] Feature-branch: `feat/sprint-24-style-pack-2026`

---

## Task 41.1 — Tactile Rebellion stil [M]

**Fil:** `skills/visionary/styles/graphic/tactile-rebellion.md`

**Vad:** Reaktion mot perfekta SaaS-ytor — riso-print-look, hand-skuren typografi, papperstextur (visible fiber), sax-och-lim-kollage, dammpartiklar, oregelbundna baselines. Stilen säger "en människa rörde detta innan det blev en pixel".

**Innehåll:**
- YAML-frontmatter enligt katalog-schema:
  - `id: tactile-rebellion`
  - `category: graphic`
  - `motion_tier: Subtle`
  - `density: balanced`
  - `palette_tags: ["off-white", "pms-tunga"]`
  - `keywords: ["riso", "tactile", "anti-perfection", "papper", "kollage"]`
  - `accessibility: { contrast_floor_apca: 70, touch_target_px: 44, reduced_motion: "opacity-only" }`
  - `scoring_hints: { product_archetypes: ["editorial", "creative-agency", "non-profit"], audience_density: ["balanced"], brand_tones: ["warm", "irreverent"] }`
- Palette: off-white #FAF7F0 + 1–2 PMS-tunga (cobalt #1E3A8A, vermilion #E03C00). Riso-typisk over-print: två lager med 70 % opacity, additiv blend i mörka områden.
- Typografi: Bricolage Grotesque (display) + Reross Quadratic eller Authentic Sans (body). Tracking: -0.01em på display, normalt på body. Hand-skuren karaktär simuleras med text-shadow-offset 1px 1px 0 currentColor och en liten random rotation per heading (-0.5° to +0.5°).
- Motion: tier 1 (Subtle) — paper-rustle micro-animations only (transform: rotate(0.2deg) på hover, 200ms duration). INGA spring-baserade entries — de förstör pappersillusionen.
- Anti-slop-rationale-block (≥ 3 explicita patterns):
  1. **Inga clean shadows** — alla skuggor är offset utan blur, svart, max 2px (papper-på-papper, inte CSS-floating-card)
  2. **Inga gradient backgrounds** — flat off-white med SVG-fiber-overlay
  3. **Inga rounded corners > 2px** — sax-och-lim-estetiken kräver kantiga former
- Cultural Note: Riso-print har subkultur-rötter i japansk kontorskopiering (Riso-Kagaku Corp, 1980-tal) och anammades senare av independent publishing/zine-scenen. Använd stilen med medvetenhet om denna lineage — inte som ren visuell appropriation utan som hommage till low-tech publishing.
- Accessibility-block: APCA Lc 70 minimum för paper-bg (vermilion på off-white = Lc 78, cobalt på off-white = Lc 81 — båda ok). `prefers-reduced-motion` stänger av rotation-jitter.
- Slop-detection-anchors: om kritikern ser en glassmorphism-card, en blå gradient-CTA eller mer än 2px border-radius i denna stil → score 3/10 omedelbart.

**AC:**
- ≥ 150 rader
- Varje val (palett, typografi, motion, density) är motiverat i prosa
- Frontmatter validerar mot katalog-schema
- Anti-slop ≥ 3 explicita patterns
- Cultural Note refererar Riso-print-historik

---

## Task 41.2 — Digital Degrowth stil [M]

**Fil:** `skills/visionary/styles/internet/digital-degrowth.md`

**Vad:** Etisk position som visuellt språk — system-fonter only, max 3 färger, dithered visuals istället för foton, "kg CO₂"-badge i footer, monospace metadata. Stilen *visar* sin performance-budget. Reference: Low-Tech Magazine, Solar Protocol, ClimateAction.tech.

**Innehåll:**
- YAML-frontmatter:
  - `id: digital-degrowth`
  - `category: internet`
  - `motion_tier: Static` (default; tier 1 endast vid explicit opt-in)
  - `density: balanced`
  - `palette_tags: ["minimal", "ethical", "high-contrast"]`
  - `keywords: ["degrowth", "low-tech", "carbon", "sustainable", "static-first"]`
  - `accessibility: { contrast_floor_apca: 75, touch_target_px: 44, reduced_motion: "no-op" }`
  - `scoring_hints: { product_archetypes: ["non-profit", "editorial", "developer-tools"], audience_density: ["balanced"], brand_tones: ["neutral", "warm"] }`
- Palette: max 3 färger total. Default: svart #000, vit #FFF, en accent (forest #1B4332 eller oxblood #6B0F1A). Inga gradients. Inga rgba-transparencies över bilder.
- Typografi: system-stack only — `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` för body, `ui-monospace, SFMono-Regular, monospace` för metadata. Anledning: noll font-fetch, noll FOIT/FOUT, noll WOFF2-payload.
- Visuals: dithered SVG-noise i stället för foton (Atkinson dither, 1-bit). Om foto är oundvikligt: < 50 KB, AVIF eller WebP, max 800px bred.
- Motion: tier 0 (Static) som default. Tier 1 vid `prefers-reduced-motion: no-preference` AND opt-in via class. Endast `<details>`-toggle, native `<dialog>`-popover, inga JS-animations.
- Performance-claims (i `<footer>`): "Page weight: 47 KB / Estimated CO₂ per visit: 0.12 g". Värdena beräknas runtime via Resource Timing API och Sustainable Web Design Model 4 baseline.
- Anti-slop-rationale (≥ 3 patterns):
  1. **Inga custom fonts** — slop-tools defaultar till Inter; system-stack är ofarligare och snabbare
  2. **Inga gradients eller blur** — slop:s lättaste tell; degrowth bannlyser dem helt
  3. **Inga loading-spinners > 3 ramar** — om sidan behöver spinner är den för tung; degrowth-CTAs är synchrona
- Cultural Note: refererar Low-Tech Magazine (solar-powered websites), Branch Magazine och 1MB Club. Stilen är inte en moodboard-estetik — den är en infrastruktur-claim.
- Accessibility: APCA Lc 75+ inbyggt (svart på vit = Lc 106, oxblood på vit = Lc 89). Hög-kontrast är gratis bonus av palette-disciplinen.

**AC:**
- ≥ 150 rader
- Performance-claims är konkreta (target page weight i KB, CO₂-estimat i g)
- Kulturell referens explicit (Low-Tech Magazine etc.)
- Anti-slop ≥ 3 patterns

---

## Task 41.3 — Insight-First Coach stil [M]

**Fil:** `skills/visionary/styles/internet/insight-first-coach.md`

**Vad:** Ny generation hälso/coaching-UI där dashboards ersätts av narrativa AI-summaries. En stor mening per vy, biometrisk siffra som typografi (60px+), 70 % vit yta, mjuka bågar mellan datapunkter. Reference: Oura Advisor (2025), WHOOP Coach 5, Apple Watch S11 Vitals.

**Innehåll:**
- YAML-frontmatter:
  - `id: insight-first-coach`
  - `category: internet`
  - `motion_tier: Expressive`
  - `density: sparse`
  - `palette_tags: ["clinical", "warm-neutral"]`
  - `keywords: ["coaching", "biometric", "narrative", "wellness", "ai-summary"]`
  - `accessibility: { contrast_floor_apca: 70, touch_target_px: 44, reduced_motion: "opacity-only" }`
  - `scoring_hints: { product_archetypes: ["healthcare", "wellness", "consumer-app"], audience_density: ["casual"], brand_tones: ["warm", "neutral"] }`
- Palette: clinical med värme — off-white #FAFAF7, soft-charcoal #2C2C2A, single accent (oxblood #6B0F1A eller forest #2D4A3E). Ingen nyans-rampa — varje färg har en roll.
- Typografi: humanistisk sans (Söhne / Söhne Mono / Inter Display fallback) för UI-text + serif-italic för insights (Söhne Brillant, Tiempos Headline italic, eller GT Sectra italic fallback). Biometriska siffror: 60–96px, weight 200, samma font som body men eget storleksskal (`type-scale: minor third`).
- Layout: 70 % vit yta som regel. En stor "insight"-mening per vy ("Your recovery is up 12% — sleep landed earlier this week."). AI-summary kommer FÖRE rådata. Grafer endast när användaren explicit klickar "see data".
- Motion: tier 2 (Expressive) — slow morph mellan states (visualDuration 0.6, bounce 0.1). Siffror räknas upp på state-change med `useTransition` interpolation. Bågar mellan datapunkter ritas in med stroke-dashoffset over 1.2s.
- Anti-dashboard-rationale: dashboards visar data; coaching-UI visar *betydelse*. En graf kräver kognitiv ansträngning från användaren; en mening levererar slutsatsen direkt. Stilen prioriterar narrative AI-summary över rå data-visualisering — graferna finns kvar men flyttas till sekundär nivå.
- Anti-slop-rationale (≥ 3 patterns):
  1. **Inga KPI-grids** — slop-tools defaultar till "4 cards across" för hälsodata; insight-first ratar layoutet helt
  2. **Inga progress rings** — Apple Activity-rings är slop på 2026; ersätt med subtil bågskissa eller textstatement
  3. **Inga emoji som UI-icons** — kliniskt sammanhang förbjuder emoji-baserad iconografi
- Cultural reference: 3 referens-screenshots i kommentar (Oura Advisor 2025, WHOOP Coach 5, Apple Watch S11 Vitals)
- Medical-claims-warning: style-doc förbjuder uttryckligen FDA-regulated language ("treats", "diagnoses", "cures") utan juridisk review. Output-text använder *coaching*-vokabulär ("recovery is up", "consider earlier bedtime"), inte *medical*-vokabulär.
- Accessibility: APCA Lc 70+ för stora siffror (charcoal på off-white = Lc 96 — passerar AAA). Reduced-motion ersätter graf-stroke-animation med opacity-fade.

**AC:**
- ≥ 150 rader
- Klinisk-vibe-rationale i prosa
- 3 referens-screenshots dokumenterade i kommentar
- Anti-dashboard-rationale (varför grafer ofta är sämre än narrativa AI-summaries)
- Medical-claims-warning explicit

---

## Task 41.4 — Liquid Glass Lensing-Web stil [M]

**Fil:** `skills/visionary/styles/hybrid/liquid-glass-lensing.md`

**Vad:** Distinkt från `liquid-glass.md` (Apple iOS 26-stilen i katalogen) — denna stil använder SVG `<feDisplacementMap>` + `backdrop-filter` för *faktisk* optisk böjning, inte bara blur+sheen. Kanter som faktiskt böjer pixlar bakom; tjocklek synlig i refraktion. Detta är en webb-native lensing-effekt som iOS 26 inte gör (iOS gör mjukare adaptive-tinting; web kan göra hårdare physics).

**Innehåll:**
- YAML-frontmatter:
  - `id: liquid-glass-lensing`
  - `category: hybrid`
  - `motion_tier: Expressive`
  - `density: sparse`
  - `palette_tags: ["cool", "frosted", "premium"]`
  - `keywords: ["glass", "lensing", "refraction", "displacement", "premium"]`
  - `accessibility: { contrast_floor_apca: 60, touch_target_px: 44, reduced_motion: "no-displacement" }`
  - `scoring_hints: { product_archetypes: ["luxury", "consumer-app", "creative-agency"], audience_density: ["sparse"], brand_tones: ["bold", "neutral"] }`
- Palette: kall (ice-blue oklch(0.92 0.04 240), frosted-grey oklch(0.85 0.02 240), accent-warm oklch(0.62 0.18 30) för djup-kontrast).
- Typografi: SF Pro Display (eller Inter Display fallback) för display + SF Mono (eller JetBrains Mono fallback) för code-overlays.
- Motion: tier 2 (Expressive) — refraction-shimmer 3–5s loop på hover (animera `feDisplacementMap[scale]` mellan 6 och 14). Måste ha pause-control (WCAG 2.2.2 — > 5s motion).
- Tekniska CSS/SVG-snippets för faktisk lensing (i style-dokumentet):
  ```html
  <svg width="0" height="0">
    <filter id="lens">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3"/>
      <feDisplacementMap in="SourceGraphic" scale="10"/>
    </filter>
  </svg>
  ```
  ```css
  .lens-card {
    backdrop-filter: blur(12px) saturate(1.4);
    filter: url(#lens);
    border: 1px solid color-mix(in oklch, white 40%, transparent);
  }
  @supports not (filter: url(#lens)) {
    .lens-card { backdrop-filter: blur(20px) saturate(1.4); /* fallback */ }
  }
  ```
- Distinkt från `liquid-glass.md`:
  - `liquid-glass` (iOS 26) = adaptive tinting + system-tinting + scroll-reactive
  - `liquid-glass-lensing` = faktisk SVG-displacement + refraction-physics + web-native
  - Båda kan samexistera i katalogen — de löser olika problem
- Anti-slop-rationale (≥ 3 patterns):
  1. **Inga rena `backdrop-filter: blur(20px)` utan displacement** — det är glassmorphism, inte lensing
  2. **Inga rgba-overlays för "glas"-känsla** — riktig glas brytar ljus, inte bara dimmar det
  3. **Inga statiska refraction-pattern** — utan svag rörelse förlorar effekten "liquid"-kvaliteten (men > 5s kräver pause-control)
- Accessibility-utmaning: frosted bakgrund ger låg kontrast. APCA Lc 60 minimum är default; override till hög-kontrast-mode (`@media (prefers-contrast: more)`) avaktiverar displacement helt och visar solid bakgrund.
- Browser-support: `feDisplacementMap` är Baseline 2024+; `@supports`-fallback till blur+sheen för pre-Baseline browsers. Hela stilen graceful-degradar till `liquid-glass`-look om SVG-filtret inte stöds.

**AC:**
- ≥ 150 rader
- Tekniska CSS/SVG-snippets för faktisk lensing-effekt inkluderade
- Distinkt från `liquid-glass.md` (separat fil, dokumenterad skillnad)
- Accessibility för låg-syn-användare (override till hög-kontrast-mode)
- `@supports`-fallback för pre-Baseline browsers

---

## Task 41.5 — Corporate Dropout stil [M]

**Fil:** `skills/visionary/styles/internet/corporate-dropout.md`

**Vad:** Ironisk corporate-aesthetic. Helvetica fortfarande, men med 1° tilt på rubriker, broken grid, ironisk caption-overlay, Excel-celler som dekoration, clipart-pilar, "department of nothing"-vibes. Stilen kräver kulturell ironi som AI-generatorer ofta kollapsar till sincere — vilket gör den till naturligt anti-slop-verktyg.

**Innehåll:**
- YAML-frontmatter:
  - `id: corporate-dropout`
  - `category: internet`
  - `motion_tier: Subtle`
  - `density: balanced`
  - `palette_tags: ["corporate", "ironic-neon"]`
  - `keywords: ["corporate", "ironic", "post-corporate", "indie-saas", "anti-earnest"]`
  - `accessibility: { contrast_floor_apca: 70, touch_target_px: 44, reduced_motion: "opacity-only" }`
  - `scoring_hints: { product_archetypes: ["creative-agency", "developer-tools", "consumer-app"], audience_density: ["balanced"], brand_tones: ["irreverent", "bold"] }`
- Palette: corporate-blå #003F7F + 1 ironisk neon-accent (acid-green #00FF88 eller hot-pink #FF0099). Use-case: indie SaaS som ironiserar sin egen seriösitet, post-corporate brands, designer-portfolios.
- Typografi: Helvetica Now Display + Inter (medvetet generic — ironin ligger i avsaknaden av "designerval"). Headings tiltas 1° (transform: rotate(1deg)) för att signalera "vi vet att Helvetica är default men vi gör det medvetet".
- Layout: broken grid — 12-col med deliberata column-jumps (en sektion på col 1–7, nästa på col 4–9, nästa på col 6–12). Excel-celler som dekoration: thin gray borders runt placeholder-content. Clipart-pilar (SVG) pekar på random element. "Department of Nothing"-style captions ("ROI: pending review", "Synergy index: TBD") överallt.
- Motion: tier 1 med ironiska micro-interactions. Buttons "approves" forms med stamp-sound visualisering (transform: scale(1.02) + drop-shadow flash). `@starting-style` på modal: form-fade-in followed by rubber-stamp-effect ("APPROVED" text appears slightly off-axis).
- Anti-slop-rationale (≥ 3 patterns):
  1. **Inga motivational-gradient-CTAs** — slop-tools producerar "Let's Get Started"-CTA med blå-lila gradient; dropout använder flat corporate-blue med ironisk caption
  2. **Inga emoji** — corporate-ironin förbjuder emoji helt; clipart-arrows ersätter
  3. **Inga "modern" hover-states** — hover är en stamp, inte en glow
- Cultural Note: stilen är distinkt från Swiss-stilarna (som är *sincere* om typografisk klarhet) och Brutalism (som är *aggressive* om anti-design). Corporate Dropout är *ironisk* — den älskar Helvetica för att den är generic, inte trots det. Risk: utan kulturell distans kollapsar stilen till "cringe corporate" eller "wannabe ironi". Style-doc varnar generators att använda stilen ENDAST när användaren explicit signalerar ironisk avsikt (keywords: "post-corporate", "indie", "ironic", "satirical SaaS").
- Accessibility: APCA Lc 70+ default. Tilt-rotations respekterar `prefers-reduced-motion: reduce` (stänger av tilt helt — accepterar att stilen tappar 30 % av sin charm vid reduced-motion, men det är rätt avvägning för vestibulärt känsliga användare).

**AC:**
- ≥ 150 rader
- Ironisk-tone-rationale explicit
- Distinkt från Swiss + Brutalism (motiverat i prosa)
- Anti-slop ≥ 3 patterns
- Use-case-warning om "cringe corporate"-risk

---

## Task 41.6 — `_index.md` uppdatering [S]

**Fil:** `skills/visionary/styles/_index.md`

**Vad:** Lägg till de 5 nya stilarna i korrekt kategori, med rätt motion-tier-tagg, palette-tags och keywords. Uppdatera kategori-räkningar i headers (graphic +1, internet +3, hybrid +1).

**Steg:**
1. Lägg `tactile-rebellion` under en ny `## Graphic` sektion (skapa om saknas) eller under existerande relevant kategori (om `graphic/`-kategori bara har 1 stil sedan tidigare, gör den synlig i index).
2. Lägg `digital-degrowth`, `insight-first-coach`, `corporate-dropout` under `## Internet Aesthetics`. Uppdatera räkning från 18 till 21.
3. Lägg `liquid-glass-lensing` under `## Hybrid/Cross-Domain`. Uppdatera räkning från 14 till 15.
4. Bump total style count från 202 till 207 i fil-headern.
5. Verifiera mot existerande `_index.json` att inga ID-kollisioner finns.

**AC:**
- 5 nya rader (en per stil)
- Kategori-räkningar uppdaterade
- Total räkning bumpad korrekt
- Inga ID-dubbletter mot existing katalog

---

## Task 41.7 — Style-embeddings refresh [S]

**Fil:** `skills/visionary/styles/_embeddings.json`

**Vad:** Generera 8D-embeddings för de 5 nya stilarna via existerande `scripts/build-style-embeddings.mjs` (Sprint 11). Kör scriptet, commit:a uppdaterad embeddings-fil.

**Steg:**
1. `node scripts/build-style-embeddings.mjs --check` → bekräfta att existing embeddings inte driver
2. `node scripts/build-style-embeddings.mjs` → regenerate; ska bara lägga till 5 nya entries
3. Diff verifying:
   - 5 nya entries (en per ny stil-id)
   - Existing embeddings byte-identiska (deterministisk regenerering)
4. Commit:a `_embeddings.json` tillsammans med stil-filerna (samma commit för cohesion)

**AC:**
- 5 nya embeddings-entries
- Ingen drift på existing embeddings (verifierat med `--check`-flag)
- Embeddings-vektorer är 8-dimensionella floats

---

## Task 41.8 — Visual reference screenshots [M]

**Filer:** `mockups/sprint-24/<style-id>-reference.png` (5 filer totalt)

**Vad:** Generera referens-mockup per stil med Playwright på en kanonisk komponent. Olika komponent per stil för att visa stilens nyckelvariant.

**Komponentval per stil:**
- `tactile-rebellion`: editorial hero (signature-användning för stilen)
- `digital-degrowth`: blog-list med performance-footer (stilens unika tell)
- `insight-first-coach`: single-insight card med stort siffervärde
- `liquid-glass-lensing`: nav-bar över bild-bakgrund (lensing syns bara över rikt content)
- `corporate-dropout`: SaaS-pricing-page (ironin förstärks av kontextet)

**Steg:**
1. För varje stil: skapa minimal HTML+CSS-fil i `mockups/sprint-24/<style-id>/index.html` som demonstrerar stilen på vald komponent
2. Använd `mcp__playwright__browser_navigate` + `mcp__playwright__browser_take_screenshot` för att generera 1200×800 PNG
3. Spara som `mockups/sprint-24/<style-id>-reference.png`
4. Mockup-koden själv stannar i `mockups/sprint-24/` så vi kan regenerera screenshots vid stil-justering

**AC:**
- 5 screenshots committade
- Varje screenshot demonstrerar stilens nyckelegenskaper visuellt (palette, typografi, motion-paus-frame om motion-tier > 0)
- Mockup-källkod committad parallellt för reproducerbarhet

---

## Task 41.9 — Anti-slop benchmark [S]

**Fil:** `results/sprint-24-style-pack-2026.md`

**Mätningar:**
- 5 prompts × 5 nya stilar = 25 outputs
- 5 prompts täcker olika produktkontext (editorial, dashboard, landing, profile, e-commerce)
- Per output:
  - **Distinctiveness**: skiljer outputen sig visuellt från en "generic AI-template" version av samma prompt? (manuell binär bedömning)
  - **Anti-slop-pattern-träff**: ≥ 3 av stilens deklarerade anti-slop-patterns explicit aktiva i outputen (granskas mot stilens rationale-block)
  - **Accessibility-floor-pass**: stilens deklarerade APCA Lc-floor uppfylls (axe-core APCA-rule)
- Scoring per stil + aggregerat

**AC:**
- Rapport publicerad i `results/sprint-24-style-pack-2026.md`
- ≥ 80 % av outputs har ≥ 3 anti-slop-patterns
- 100 % av outputs uppfyller stilens deklarerade APCA-floor
- Rapport identifierar svagaste stil (lägst score) som candidate för v2-iteration

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Stilar kollapsar till AI-slop trots intent (kritiker accepterar generiska outputs) | Medel | Hög | Anti-slop-rationale i varje stil + slop-anchor-rules per stil + benchmark gate (≥ 80 % anti-slop-träff) |
| Kulturell appropriations-kritik på Tactile Rebellion (riso-print har subkultur-rötter) | Låg | Medel | Cultural Note refererar Riso-print-historik (Japan, Independent publishing); stilen positioneras som hommage, inte estetisk extraktion |
| Liquid-Glass-Lensing kräver SVG-stöd som missar äldre browsers | Medel | Låg | `@supports`-fallback till blur+sheen dokumenterad och testad; graceful-degradering till `liquid-glass`-look |
| Corporate Dropout missförstås som ren parodi/ej-användbar | Medel | Låg | Doc tydlig om use-cases (indie SaaS, post-corporate brands, designer-portfolios); keyword-gate i `scoring_hints` ("ironic", "satirical") krävs för auto-aktivering |
| Insight-First Coach trampar på medical claims (FDA/EU MDR) | Medel | Hög | Style-doc förbjuder uttryckligen FDA-regulated language utan juridisk review; output-text begränsas till coaching-vokabulär |
| Embeddings-refresh introducerar drift på existing stilar | Låg | Medel | `build-style-embeddings.mjs --check` krävs i pre-flight; deterministisk seed bekräftad i Sprint 11 |
| 5 stilar på 5 dagar = för tight för djupgående cultural research per stil | Hög | Medel | En dag per stil är minimum; flagga risk i retrospektiv om någon stil känns under-researched; v2-iteration på svagaste stil från benchmark |

---

## Definition of Done

- [ ] Alla tasks (41.1–41.9) klara
- [ ] 5 stilar dokumenterade ≥ 150 rader var med YAML-frontmatter, anti-slop-rationale ≥ 3 patterns, Cultural Note, Accessibility-block
- [ ] `_index.md` uppdaterad med 5 nya entries och korrekta kategori-räkningar
- [ ] `_embeddings.json` regenererad med 5 nya entries och ingen drift på existing
- [ ] 5 reference-screenshots committade i `mockups/sprint-24/`
- [ ] `results/sprint-24-style-pack-2026.md` publicerad — ≥ 80 % anti-slop-pattern-träff, 100 % APCA-floor-pass
- [ ] Mergad till `main`

## Amendments

_Tomt._
