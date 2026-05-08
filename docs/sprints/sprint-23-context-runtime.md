# Sprint 23 — Context-Runtime: design som lever vidare efter generation

**Vecka:** 36
**Fas:** 15 — Runtime-adaption (ny fas)
**Items:** 42, 43, 44
**Beräknad tid:** 6 dagar
**Mål:** Generated UI får runtime-context-awareness via 3 mekanismer: F1 circadian palette-shift (tid på dagen), F4 network-aware visual budget (saveData / effectiveType), F7 patina-mode (designen åldras med projektet). Inget som bryter `prefers-reduced-motion` eller WCAG. Allt opt-in.

Wild idea: static design dör i samma sekund den genereras. En sajt som speglar din användares natt-rytm, sparar deras data, och åldras tillsammans med kodbasen — det är vad framtiden känns som. Och inget kostar något: bara `Date.now()`, `navigator.connection`, och `git log`. All adaption sker zero-permission, zero-tracking, klient-side.

## Scope

- Item 42 — F1 Circadian palette-shift: 4-fas-paletter (dawn/day/dusk/night), runtime CSS custom property-update var 15 min, `suncalc` för soltider, system-pref override.
- Item 43 — F4 Network-aware visual budget: 3-tier output (full/degraded/minimal), `prefers-reduced-data` + `effectiveType`-detection, motion-tier→0 / gradients→flat / blur→border vid 2g/saveData.
- Item 44 — F7 Patina-mode: token-drift baserad på fil-ålder via `git blame`, APCA Lc 60 hard-floor, `/visionary-patina` CLI med freeze-mekanism.

## Pre-flight checklist

- [ ] Sprint 4 (DTCG-tokens) mergad — alla 3 mekanismer modifierar tokens, inte hårdkodade values
- [ ] Sprint 14 (active governance) klar — drift-detector kan distingera runtime-drift från code-drift
- [ ] APCA-w3 i project deps — patina-floor-checks
- [ ] `suncalc` evaluerad som dep (~3KB minified)
- [ ] Feature-branch: `feat/sprint-23-context-runtime`

---

## Task 42.1 — F1 Circadian palette-shift [M]

**Fil:** `tokens/runtime/circadian.css.ts` (ny) + `hooks/scripts/lib/runtime/circadian.mjs`

**Vad det gör:** Generated styles får valfri `circadian: {dawn, day, dusk, night}`-block. Runtime-modul uppdaterar CSS custom properties var 15 min baserat på lokal-tid + `suncalc` för soltider (latitud kan inferreras eller defaulta till browser-locale-region).

**Steg:**
1. 4 fas-paletter per stil (extended från base) — generation-time-task. Auto-generation via stil-doc-parsing (varje stil får default-circadian-derivat) eller manual override i style-fil.
2. Runtime JS-snippet (~30 LOC) som body-injekteras vid generation om `--circadian` aktiv:
   - Beräkna nuvarande fas via `suncalc` + `Date.now()`
   - Uppdatera CSS custom properties (`--circadian-bg`, `--circadian-fg`, etc.)
   - Setup `setInterval(updatePhase, 15 * 60_000)` + `visibilitychange`-listener (spar batteri vid hidden tab)
3. Hard-floor: respektera `prefers-color-scheme` system-pref ALWAYS — om user explicit valt dark, circadian går aldrig till "day"-palette.
4. Smooth transition >800ms ease (mellan faser) för att undvika abrupt shift mid-flow.

**AC:**
- Test 4 timestamps över dygnet ger 4 distinkta palette-states
- System-pref override fungerar (mock `prefers-color-scheme: dark` + middag → palette stannar i dark)
- Smooth transition verifierad (CSS-animation 800ms)
- Bundle-size <1.5KB minified för runtime-snippet

---

## Task 42.2 — F4 Network-aware visual budget [M]

**Fil:** `hooks/scripts/lib/runtime/network-aware.mjs` + `tokens/runtime/network-budgets.json`

**Vad det gör:** Vid `navigator.connection.effectiveType ∈ {2g, slow-2g}` eller `saveData=true`: motion-tier → 0, gradients → flat fills, blur → border, foton → low-res via `<picture>`/`srcset`. Stilens "själ" bevaras (palette + typografi), dekor offras.

**3 budget-tiers:**
- **full** (4g+): allt aktiverat
- **degraded** (3g): motion-tier max 1, blur max 4px, gradients OK
- **minimal** (2g/saveData): motion-tier 0, flat fills, border ersätter blur, low-res foton

**Steg:**
1. Token-pipeline post-processor som producerar 3 CSS-varianter per generated component.
2. Inline `media="(prefers-reduced-data)"` (CSS L5) eller JS-detection för fallback i Safari.
3. Manifest-fil `network-budgets.json` per stil — definierar hur varje tier resolvar tokens.
4. Runtime-detection: `navigator.connection?.effectiveType` + `saveData` → välj rätt CSS-bundle.
5. Server-hint-stöd: `Save-Data: on`-header → SSR pre-renderar minimal-tier för first-byte-vinst.

**AC:**
- 3-tier-output validerar (CSS parses + renderas)
- saveData-detection triggar minimal-tier i Playwright-test
- Bundle-storlek minimal-tier ≤30 % av full-tier
- Safari-fallback (JS-detection) fungerar utan `prefers-reduced-data`

---

## Task 42.3 — F7 Patina-mode [L]

**Fil:** `hooks/scripts/lib/runtime/patina.mjs` + `commands/visionary-patina.md`

**Vad det gör:** Designen åldras: chroma −2 %/månad, radius +0.5px/månad, motion duration +5ms/månad, kant-skärpa minskar 1 %/månad. Mätbar via `git blame` på källfil → first-commit-date → ålder. Hard-floor mot APCA Lc 60 (chroma kan inte falla förbi).

**Steg:**
1. Patina-config i `tokens/runtime/patina.json`:
   ```json
   {
     "drift_rates_per_month": {
       "chroma": -0.02,
       "radius": 0.5,
       "motion_duration_ms": 5,
       "edge_sharpness": -0.01
     },
     "min_floors": {
       "apca_lc": 60,
       "chroma": 0.05
     }
   }
   ```
2. Build-time mode: läs `git blame --first-parent <file>`, beräkna ålder i månader, applicera drift på base-tokens, generera output.
3. Runtime mode: JS-snippet som beräknar drift on-the-fly från en `data-vis-age` attribut (set vid build).
4. `/visionary-patina` CLI:
   - `status` — visa nuvarande ålder + applied drifts per fil
   - `freeze <file> <age-months>` — lås patina (för stable releases)
   - `unfreeze <file>` — släpp lås
   - `preview <file> --age <months>` — visa hur filen skulle se ut vid given ålder
5. Trace event `patina_applied` med `{file, age_months, drifts_applied, floors_hit}`.

**AC:**
- Test fixture med 3-månader git-blame producerar synlig drift (chroma −6 %, radius +1.5px)
- APCA-floor håller: drift som skulle bryta Lc 60 clampas
- Manual freeze fungerar end-to-end
- `--age` preview-mode tillåter "what would this look like at 12 months" utan att modifiera fil

---

## Task 42.4 — Runtime-context coordinator [M]

**Fil:** `hooks/scripts/lib/runtime/coordinator.mjs`

**Vad det gör:** Generated UI kan ha alla 3 mekanismer aktiva samtidigt. Coordinator löser konflikter (t.ex. circadian säger dim color, patina säger fade — vilken vinner?).

**Default precedence:**
```
prefers-reduced-motion / prefers-color-scheme (system)
  > network-budget (urgency)
  > circadian (time)
  > patina (age)
```

**Steg:**
1. Konflikt-resolution-logik: per token, applicera mekanismer i precedence-ordning, varje senare mekanism modifierar resultatet av föregående (men kan inte överskrida hard-floors).
2. Single runtime-snippet (~80 LOC) som kombinerar alla 3 + fallback om en signal saknas.
3. Performance: total CSS+JS-impact <2KB minified.
4. Combined drift cap: ingen kombination av mekanismer får ge >15 % drift från base i någon dimension (annars degenereras designen för mycket).

**AC:**
- 3 mekanismer kan samexistera utan crash
- Konflikt-resolution dokumenterad och deterministisk
- Bundle-size verifierad <2KB
- Combined-drift-cap håller över 100 random-fixture-testfall

---

## Task 42.5 — Privacy + a11y-policy doc [S]

**Fil:** `docs/runtime-context.md` (ny)

**Innehåll:**
- Vilka signaler används (alla zero-permission): `Date.now()`, `navigator.connection`, `git blame` (build-time)
- Ingen tracking, inget lämnar maskinen, ingen server-call
- Alltid override-able av system-pref och WCAG-floors
- Opt-in per mekanism (default OFF för alla 3)
- Fingerprint-mitigering: kvantisering av timestamp till 15-min-buckets, ingen export till server
- Etisk gräns: ALDRIG affektiv inferens utan explicit opt-in (EU AI Act compliance)
- Hänvisning till EAA + WCAG 2.2 + ADA Title II — inget i runtime-mekanismer får bryta dessa

**AC:**
- Doc reviewed mot WCAG 2.2 + EAA-compliance-checklist
- Privacy-policy klart: noll telemetry, noll server-roundtrip
- Etisk gräns dokumenterad

---

## Task 42.6 — Tester [M]

**Fil:** `hooks/scripts/lib/runtime/__tests__/*.test.mjs`

**Coverage:**
- Circadian state-transitions (4 timestamps × 5 latituder)
- System-pref override
- Network-budget-tier-switch (mock `effectiveType` + `saveData`)
- Patina-drift-matematik (12 månaders fixture)
- APCA-floor-clamp aktiveras vid extrem drift
- Coordinator-konflikt-resolution (alla 6 par-konflikter)
- Combined-drift-cap aktiveras vid stacked mekanismer

**AC:**
- `node --test` grön
- ≥80 % coverage på `lib/runtime/`

---

## Task 42.7 — Doc + exempel [S]

**Fil:** `docs/circadian-design.md`, `docs/network-aware.md`, `docs/patina-mode.md`

**Innehåll:**
- Tre korta docs (en per mekanism) med kod-exempel + screenshot-progression
- `circadian-design.md`: 4 screenshots över dygnet
- `network-aware.md`: full vs minimal-tier side-by-side
- `patina-mode.md`: 0/3/6/12-månaders progression av samma komponent

**AC:**
- 3 docs publicerade
- Screenshot-progression demonstrerar effekten visuellt

---

## Benchmark-verifiering

**Fil:** `results/sprint-23-context-runtime.md`

**Mätningar:**
- Circadian: 4 timestamps × 5 latituder validerade
- Network: minimal-tier-output performance (LCP, bundle-size, render time)
- Patina: 0/3/6/12-månaders drift dokumenterade visuellt + token-diff
- Total runtime CSS+JS-overhead per mekanism + kombinerat
- APCA-floor-violation-rate över 1000 random-fixtures (förvänta 0 %)

**AC:**
- Total overhead <2KB
- APCA-floor håller i alla mekanismer (0 violations)
- Reduced-motion respekteras alltid
- LCP-impact ≤50ms per mekanism

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Circadian byter palette mitt i user-flow → confusion | Medel | Medel | Smooth transition >800ms ease, optional "what changed"-tooltip |
| Patina-drift går under APCA-floor over time | Hög | Hög | Hard-floor i token-pipeline, freeze-mekanism, runtime-clamp |
| Network-API instabil cross-browser | Medel | Medel | Feature-detect + saveData-fallback för Safari, JS-polyfill |
| Konflikt mellan 3 mekanismer ger urvattnad slutprodukt | Medel | Hög | Coordinator-priority + combined-drift-cap (<15 % från base) |
| Etiskt: patina kan vara oönskat på produktionssajt | Hög | Låg | Default OFF, opt-in per stil, freeze-flagga, dokumenterat use-case |

---

## Definition of Done

- [ ] Alla tasks (42.1–42.7) klara
- [ ] 3 mekanismer (circadian, network, patina) implementerade
- [ ] Coordinator löser alla 6 par-konflikter deterministiskt
- [ ] APCA-floor håller i alla mekanismer (0 violations)
- [ ] Total runtime-overhead <2KB
- [ ] `/visionary-patina` CLI med 4 sub-commands
- [ ] Tester gröna, ≥80 % coverage
- [ ] `results/sprint-23-context-runtime.md` publicerad
- [ ] 4 docs publicerade (runtime-context + 3 mekanism-specifika)
- [ ] Mergad till `main`

## Amendments

_Tomt._
