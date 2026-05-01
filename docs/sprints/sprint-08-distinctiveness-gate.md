# Sprint 08 — Distinctiveness gate: anti-anchors + hard slop reject

**Vecka:** 13–14
**Fas:** 4 — Distinctiveness
**Items:** 22, 23 från roadmap (ny)
**Mål:** Stoppa generisk output vid källan, inte i efterhand. Idag fångar slop-detektorn 26 patterns *efter* generering och critic sänker scoret — men modellen har redan producerat en Tailwind-default-blå CTA, och regenerering ger något 10 % mindre generiskt. Den här sprinten gör två saker: (22) hårt blockerar uppenbar slop innan critic ens körs, och (23) visar modellen visuella *negativa* referenser så att den vet vad den inte ska likna.

Motivation kommer från test-run 2026-04-23: senaste build:en producerar design som känns igen från UI/UX Pro Max och Claudes inbyggda design-skill. Samma modell, samma prior, samma output. Slop-detektion och distinctiveness-score räckte inte för att bryta konvergensen.

## Scope

- Item 22 — Hard slop-reject gate: ≥ 2 slop-patterns i output → force-regen med pattern-namn i negative-prompt. Whitelist per style för deliberate ironi.
- Item 23 — Negative visual anchors: 3–5 kurerade slop-screenshots injekteras som "don't-match"-exempel i genereringsprompten.

## Pre-flight checklist

- [x] Sprint 6 mergad till main — slop-detektor live, trace-infrastruktur finns
- [x] Sprint 7 mergad till main — content-resilience lägger 10:e dimensionen
- [ ] Bekräfta med `visionary-stats --all` att traces samlats från minst 5 generationer i pre-sprint-baseline (så vi kan mäta distinctiveness-lift efter)
- [ ] Feature-branch: `feat/sprint-08-distinctiveness-gate`

---

## Task 22.1 — Flytta slop-detektor till pre-critic-gate [M]

**Fil:** `hooks/scripts/capture-and-critique.mjs`

**Nuvarande beteende:** Slop-patterns detekteras i hooken och skickas till critic som `design_slop_flags`. Critic sänker scoret men genereringen fortsätter.

**Nytt beteende:** Räkna slop-hits *innan* critic anropas. Om count ≥ `SLOP_REJECT_THRESHOLD` (default 2):
1. Skippa critic-anropet den här rundan
2. Emittera `early_exit` med `reason: "slop-rejected"` till traces
3. Producera en syntetisk critique-output med `top_3_fixes` som pekar på slop-patterns med `severity: "blocker"`
4. Hook returnerar denna critique som om critic gjort jobbet — critic-round-budget återanvänds

**Env-flagg:** `VISIONARY_SLOP_REJECT_THRESHOLD=<n>` (default 2, sätt till 99 för att stänga av)

**Steg:**
1. Extrahera slop-counting till `hooks/scripts/lib/slop-gate.mjs` (ny fil)
2. API: `shouldReject(slopFlags, { threshold, styleWhitelist })` → `{ rejected: bool, reason, blocking_patterns: [...] }`
3. När gate triggas, bygg syntetisk critique med blocking_patterns som fixes
4. Commit-ordning: gate-modul + tester först, wire:a sist

**AC:**
- Test: 3 slop-hits i input → gate triggas → critic INTE anropad
- Test: 1 slop-hit → gate släpper igenom → critic anropas som vanligt
- Test: `VISIONARY_SLOP_REJECT_THRESHOLD=99` → gate aldrig triggar
- Trace-entry med `event: "early_exit"` och `payload.reason: "slop-rejected"` emitteras

---

## Task 22.2 — Force-regen med negative-prompt [M]

**Fil:** `hooks/scripts/capture-and-critique.mjs`

När 22.1 triggar reject ska nästa round-instruktion inkludera pattern-namn explicit:

```
REGEN REQUIRED — previous output hit blocking slop patterns:
  - Cyan-on-dark color scheme
  - Default Tailwind blue #3B82F6 as primary color

DO NOT use these patterns. Specifically:
  - Avoid text-cyan-*, bg-cyan-*, #06B6D4 family
  - Avoid bg-blue-500, from-blue-500, #3B82F6

Consider instead:
  - Oxblood / forest / paper neutrals
  - Brand-accented tokens from style definition
  - Desaturated accent with APCA Lc 60+ on neutral background
```

**Steg:**
1. Mappa `slop_pattern → avoid_directive` i `skills/visionary/partials/slop-directives.md` (ny fil eller extension av critique-schema.md)
2. Varje pattern får en "specifically avoid" + "consider instead" sektion
3. Injekteras i nästa round-instruktionen via `additionalContext`

**AC:**
- Minst 10 av 26 patterns har konkreta avoid-directives (prioritera blocker-severity först)
- Generation-round efter reject-gate innehåller negative-prompt-blocket
- Test: mock-critique med blocking_patterns → nästa critiques prompt-input innehåller rätt avoid-text

---

## Task 22.3 — `allows_slop` whitelist per style [S]

**Fil:** `skills/visionary/styles/*.md` (berörda stilar), `skills/visionary/partials/style-frontmatter.md` (uppdatera schema-beskrivning)

**Motivation:** En brutalist-stil kan medvetet använda default-Tailwind-blå *ironiskt*. En neon-experimental-stil kan vilja ha cyan-på-mörkt som statement. Utan whitelist blir hard-reject-gate falsk-positiv på dessa.

**Format i style-frontmatter:**
```yaml
---
name: brutalism-feral
allows_slop:
  - "Default Tailwind blue #3B82F6 as primary color"  # pattern name, exakt match
  - "Cyan-on-dark color scheme detected"
reason: "deliberate default-tooling ironi — centralt för brutalism-estetiken"
---
```

**Steg:**
1. Uppdatera `style-frontmatter.md` med `allows_slop` + `allows_slop_reason` fält
2. `slop-gate.mjs` läser aktiv style och filtrerar whitelistade patterns från reject-check
3. Whitelistade patterns räknas fortfarande i `slop_detections` (för audit) men bidrar inte till reject-count
4. Emittera trace `event: "arbitration"`, `payload.reason: "slop-whitelisted"` när whitelist aktiveras

**Stilar att whitelist-flagga initialt:** `brutalism-feral`, `neon-cybersynth`, `y2k-chrome`, `anti-design` (4 st, minimum)

**AC:**
- Test: stil med whitelist + 3 slop-hits där 2 är whitelistade → gate räknar bara 1 → ingen reject
- Stil utan whitelist + samma input → reject triggas
- 4 stilar har whitelist-flaggor committade

---

## Task 22.4 — Trace-event + metrics för gate [S]

**Fil:** `hooks/scripts/lib/trace.mjs` (nytt event), `scripts/visionary-stats.mjs`

**Nya events i trace-schema:**
- `slop_blocked` — hårt reject, antal patterns, vilka
- `slop_whitelisted` — patterns som skippades pga whitelist

Uppdatera `trace-entry.schema.json` enum. Lägg till i `KNOWN_EVENTS` i trace.mjs.

**Nytt CLI-kommando:**
```bash
node scripts/visionary-stats.mjs --slop-gate-report
```

Output:
```
Slop-gate report — last 30 days
  Total generations: 47
  Blocked by gate:   8 (17 %)
  Whitelisted hits:  3 (all on brutalism-feral)
  Top blocking patterns:
    - Default Tailwind blue #3B82F6 (6 blocks)
    - Cyan-on-dark (4 blocks)
    - Uniform border-radius (2 blocks)
```

**AC:**
- Schema uppdaterat + schema-test pass
- `--slop-gate-report` producerar rapport från 20+ simulerade traces
- Unit-test för stats-aggregering

---

## Task 22.5 — Integration-test för hela reject → regen-flödet [M]

**Fil:** `hooks/scripts/lib/__tests__/slop-gate-integration.test.mjs` (ny)

End-to-end-test utan faktisk LLM:
1. Mocka ett `tool_input` med 3 slop-patterns i källkoden
2. Kör `capture-and-critique.mjs` med piped stdin
3. Verifiera att:
   - `additionalContext` INTE innehåller critic-anrops-instruktioner ("Invoke the visual-critic")
   - Istället innehåller "REGEN REQUIRED — previous output hit blocking slop patterns"
   - Inkluderar rätt pattern-namn
   - Trace-fil innehåller `slop_blocked`-event

**AC:**
- Integration-test pass
- Körbarhet från fresh clone utan LLM-dependency

---

## Task 23.1 — Kurera canonical slop-screenshots [L]

**Fil:** `docs/slop-anchors/*.png` (nytt kataloger), `docs/slop-anchors.md` (nytt indexdokument)

**Process:**
1. Välj 5 kategorier: `saas-default-blue-hero`, `cyberpunk-cyan-glow`, `glassmorphism-gradient-card`, `neumorphism-pillow`, `generic-feature-3up`
2. Per kategori: 3 screenshots (1200×800) från riktiga eller AI-genererade exempel. Undvik copyrightproblem — använd AI-genererade "baseline AI-slop"-renders från bolt/v0 som är fair use
3. Varje bild ≤ 200 KB, JPEG acceptabelt (anchors är inte produktassets)
4. Indexdokument som pekar på varje och förklarar *varför* den räknas som slop

**AC:**
- 15 screenshots totalt committade (≤ 3 MB sammanlagt)
- `docs/slop-anchors.md` har entries för varje kategori med "detta undviker vi för att ..." en-rader

---

## Task 23.2 — Anti-anchor injection i generation-prompt [M]

**Fil:** `hooks/scripts/inject-taste-context.mjs` (uppdatera), ny modul `hooks/scripts/lib/anti-anchors.mjs`

**Flöde:**
1. Nytt modul läser `docs/slop-anchors/`-katalogen
2. Samplar 3 relevanta anti-anchors baserat på valt style:
   - Om style är `fintech-trust` (generisk SaaS): sampla `saas-default-blue-hero`, `generic-feature-3up`
   - Om style är `brutalism-feral`: sampla saker som *inte* är brutalism (glassmorphism, neumorphism)
   - Matching-logik: avoid-family i style-frontmatter
3. Injekteras i `additionalContext`:

```
=== NEGATIVE visual anchors (do NOT produce anything like these) ===

[image: docs/slop-anchors/saas-default-blue-hero/example-1.png]
→ Generic SaaS: default-blue CTA, 3-column feature grid, stock-photo hero.
  This is what AI-default output looks like. Avoid all of it.

[image: docs/slop-anchors/generic-feature-3up/example-2.png]
→ Icon + heading + paragraph × 3, equal widths, grey-500 body.
  Indistinguishable from 40 other landing pages.

Your output must be *visually distinct* from these references.
```

**AC:**
- Anti-anchor-sektion appears in additionalContext
- Style-family-matching fungerar (fintech-trust → SaaS-slop, inte neumorphism)
- Token-budget ≤ 1.5 KB (3 images är det tunga, inte texten)
- Test: mocka style + verifiera rätt anchor-set returneras

---

## Task 23.3 — Dokumentera anti-anchor-kuraterings-process [S]

**Fil:** `docs/slop-anchors.md` (extend)

**Sektion att lägga till:**
- Kriterier för att kvalificera som anti-anchor (frekvens, generickhet, igenkänningsgrad)
- Process för att lägga till ny: skärmdump → index-entry → PR
- Recusal-regel: om anti-anchor råkar se ut som en kurerad style, flagga style som whitelisted

**AC:**
- Process dokumenterad så att externa bidragare kan submita nya anti-anchors

---

## Task 23.4 — Tester för anti-anchor-modulen [M]

**Fil:** `hooks/scripts/lib/__tests__/anti-anchors.test.mjs` (ny)

Cover:
- `loadAntiAnchors(stylesDir)` läser mappstruktur korrekt
- `selectForStyle(style, count)` respekterar avoid-family-matching
- `buildAnchorPromptBlock(anchors)` producerar förväntad text
- Edge-case: no matching anchors → return designer-pack fallback (graceful)
- Edge-case: tom mapp → modulen returnerar `[]` utan krasch

**AC:**
- Full suite pass
- Coverage på `loadAntiAnchors` + `selectForStyle` + `buildAnchorPromptBlock`

---

## Benchmark-verifiering

**Fil:** `results/sprint-08-comparison.md` (ny)

**Pre/post-mätning på 10-prompt-suite:**
- % generationer som triggar reject-gate (förvänta 15–25 % pre-regen, 5–10 % post-regen efter sprint eftersom anti-anchors *förhindrar* slop)
- Distinctiveness-dimension (calibrated) — medianlift förväntas ≥ 0.8 på 0–10
- Total time-per-generation (förvänta ~10 % ökning pga regen-cykler)
- Anti-anchor token-kostnad / generation

**AC:**
- Rapport publicerad, siffror kring medianlift synliga

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Reject-gate blockerar legitima stilval (false positives) | Medel | Medel | `allows_slop` whitelist + env-flagg för sänkt threshold |
| Anti-anchor-bilder ses som copyright-intrång | Låg | Hög | Använd AI-genererade slop-renders (fair use) eller egenproducerade; undvik kända brands |
| Regen-cykel-loop pga modell fortsätter generera samma slop | Medel | Medel | Max 1 force-regen per round; efter 2 reject i rad → fallback till designer-pack |
| Anti-anchors ökar prompt-tokens över budget | Låg | Låg | Image-sampling max 3, resize till 512×341 för anti-anchor-ändamål |
| Distinctiveness-lift inte mätbar på liten benchmark-suite | Medel | Låg | Utöka gold-set med ytterligare 10 entries parallellt med sprinten |

---

## Definition of Done

- [ ] Alla tasks (22.1–22.5, 23.1–23.4) klara
- [ ] Reject-gate live och opt-out-bar via env
- [ ] Minst 4 stilar har `allows_slop` whitelist
- [ ] 15 anti-anchor-bilder kurerade och committade
- [ ] Anti-anchor-injection gör effektiv sampling per style-family
- [ ] Trace-events `slop_blocked` + `slop_whitelisted` validerade mot schema
- [ ] `--slop-gate-report` producerar användbar output
- [ ] Benchmark-rapport visar distinctiveness-medianlift ≥ 0.8
- [ ] `results/sprint-08-comparison.md` publicerad
- [ ] Mergad till `main`

## Amendments

_Tomt._
