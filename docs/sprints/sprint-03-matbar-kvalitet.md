# Sprint 03 — Numerisk scorer, Rulers calibration, evidence-anchored critique

**Vecka:** 3–4
**Fas:** 2 — Kvalitets-språnget
**Items:** 7, 8, 9 från roadmap
**Mål:** Byt bort LLM-vibes-bias i kritiken. Varje dimensionspoäng ska vara antingen deterministiskt beräknad eller knuten till ett mekaniskt citerbart evidens, calibrerat mot en gold set.

## Scope

- Item 7 — Numerisk estetisk scorer (Sharp + bounding-box clustering), 9:e dimension före LLM-kritik
- Item 8 — Rulers-ramverk: `benchmark/gold-set/` med 20 handscorade screenshots + nattlig `calibrate.mjs` → `calibration.json`
- Item 9 — Evidence-anchored critique: varje score måste citera axe node-ID eller CSS-selector

## Pre-flight checklist

- [ ] Sprint 2 mergad — schema + early-exit + diff-rundor live
- [ ] `benchmark/results/sprint-02-post.json` som baseline för kvalitet
- [ ] `sharp` + `image-hash` tillgängliga som optional deps (lägg under `optionalDependencies` så Windows/Mac/Linux bygger felfritt)
- [ ] 20 screenshots curaterade av 3 raters med consensus-score på 8 dimensioner (förarbete — se Task 8.1)
- [ ] Feature-branch: `feat/sprint-03-numeric-scorer-rulers-evidence`

---

## Task 7.1 — Scaffold `benchmark/scorers/numeric-aesthetic-scorer.mjs` [M]

**Fil:** `benchmark/scorers/numeric-aesthetic-scorer.mjs` (ny)

**Signatur:**
```js
/**
 * @param {string} screenshotPath - path till PNG
 * @param {object} domSnapshot - { elements: [{ selector, bbox, computedStyle }] }
 * @param {object} paletteTokens - från DTCG-export för vinnande style
 * @returns {NumericScore}
 */
export async function scoreAesthetic(screenshotPath, domSnapshot, paletteTokens) {
  return {
    contrast_entropy: 0.84,       // 0–1, högre = mer variation
    gestalt_grouping: 0.72,       // 0–1, alignment-clarity
    typographic_rhythm: 0.91,     // 0–1, modulär skala-adherence
    negative_space_ratio: 0.38,   // 0.2–0.6 är sweet-spot
    color_harmony: 0.88,          // 0–1, distans från palette-tokens
    composite: 0.76               // vägd summa
  }
}
```

**Steg:**
1. Deklarera fil-skelettet med 5 stub-metoder
2. Skriv enhetstest-skaffold med mock DOM + pre-genererad screenshot (reproducera ett av existerande benchmark-outputs)
3. Composite-viktning initial: `0.25*contrast + 0.20*gestalt + 0.20*typography + 0.15*space + 0.20*harmony`

**AC:**
- Stub-funktionen returnerar valid struct på alla fält
- Import-test i `benchmark/runner.mjs` grön

---

## Task 7.2 — Implementera contrast-entropi [M]

**Mäter:** Metric Entropy Model — bestraffar ”all-white-on-white”-slop.

**Algoritm:**
1. Reduce screenshot till 32x32 pixel-grid (Sharp `.resize(32,32).raw()`)
2. Konvertera till CIELAB L-kanalen (perceptual lightness)
3. Beräkna Shannon-entropi över L-värden bucketerade i 16 bins
4. Normalisera: `entropy / log2(16) = 0..1`

**Exempel:**
- Flat white background, grå text: ~0.2 (låg — slop)
- Bauhaus-affisch med 4 olika tonala block: ~0.85 (hög — distinktivt)

**AC:**
- 5 fixture-bilder ger förväntade värden ± 0.05
- Dokumenterad kalibrering i `numeric-aesthetic-scorer.md`

---

## Task 7.3 — Implementera gestalt-grouping-score [L]

**Mäter:** belönar intentional alignment; bestraffar 12-pixel-jitter-slop.

**Algoritm:**
1. Från `domSnapshot.elements` → extrahera alla bounding boxes (x, y, width, height)
2. Clustera boxes via DBSCAN på centroider (ε = 8px, minPts = 2)
3. För varje cluster: beräkna variance-along-x och variance-along-y
4. Grouping-score = `1 - normalize(total_variance_of_singletons)` — dvs hur mycket av ytan är i intentional grupper
5. Belöna också: aligned edges (flera elements med identisk `left` eller `top`)

**Libs:** pur JS — ingen extern dep utöver en liten DBSCAN (kan inlines, ~50 rader)

**AC:**
- Fixture: perfekt-alignad grid → score ≥ 0.9
- Fixture: slumpmässigt placerade elements → score ≤ 0.3
- Fixture: 4 tight grupper → score ≥ 0.75

---

## Task 7.4 — Typografisk rytm-varians [M]

**Mäter:** modulär skala-efterlevnad; bestraffar ”allt är 16px”-slop.

**Algoritm:**
1. Från DOM: hämta alla `font-size`, `line-height`, `letter-spacing` per text-element
2. Samla unika font-size-värden, sortera
3. Beräkna kvoterna mellan konsekutiva storlekar: t.ex. [16, 20, 24, 32, 48] → [1.25, 1.20, 1.33, 1.50]
4. Rytm-score = 1 - std_dev(log(ratios)) — nära-konstant kvot ger hög score
5. Bonus: om kvoterna matchar kända skalor (1.125 / 1.2 / 1.25 / 1.333 / 1.414 / 1.5 / golden) → +0.1

**AC:**
- Perfekt modulär skala → score ≥ 0.95
- Slumpmässiga storlekar → score ≤ 0.4

---

## Task 7.5 — Negativ-yta-ratio [S]

**Mäter:** belönar andning; bestraffar density-slop.

**Algoritm:**
1. Från screenshot: maskera ”content-pixlar” (inte bakgrundsfärg — använd paletteTokens.background som threshold)
2. Ratio = (content-pixlar) / (total-pixlar)
3. Score: 1 om ratio är i [0.2, 0.6], gradvis penalty utanför

**AC:**
- Dashboard full av widgets → ratio ~0.7 → score ~0.5
- Editorial landing → ratio ~0.35 → score 1.0

---

## Task 7.6 — Färg-harmoni-poäng [M]

**Mäter:** faktiska färger matchar den definierade palette-tokens.

**Algoritm:**
1. Från screenshot: k-means på 32×32 sample till 8 dominanta färger
2. För varje dominant: hitta närmaste palette-token i oklch-space (ΔE2000)
3. Score = mean(1 - ΔE/20) clamped [0,1]

**AC:**
- Screenshot genererad från exakt palette-tokens → score ≥ 0.9
- Screenshot med oklhand-valda färger utanför palette → score ≤ 0.4

---

## Task 7.7 — Integrera scorer som 9:e dimension i `capture-and-critique.mjs` [M]

**Steg:**
1. Lägg till call till `numeric-aesthetic-scorer.mjs` INNAN LLM-kritik anropas varje runda
2. Injecta numeriska scorer in i LLM-promptet: ”The deterministic scorer reports contrast-entropy=0.82, gestalt=0.71, typography=0.9, space=0.4, harmony=0.88. Address any score < 0.7 in your top_3_fixes. Do NOT argue that a low numeric score is fine — treat it as a blocker.”
3. Uppdatera `critique-output.schema.json` (från Sprint 2) att inkludera `numeric_scores: { ... }` som required block
4. I final-score aggregation: 9:e dimensionen `craft_measurable` = `composite_numeric * 10`

**AC:**
- Kritiken citerar numerisk score när den identifierar problem (mätbart: top_3_fixes innehåller ordet ”numeric” eller specifika metric-namn i ≥ 60 % av fall där composite < 0.7)

---

## Task 8.1 — Curatera gold-set [L] (parallell med Task 7.x)

**Fil:** `benchmark/gold-set/` (nytt dir)

**Innehåll:**
- 20 PNG-filer: `gs-001.png` ... `gs-020.png` — jämnt fördelade över 13 style-kategorier
- 20 metadata-filer: `gs-001.meta.json` innehållande:
  - `brief` (original request)
  - `style_id` (vilken style som kördes)
  - `human_scores` (array av 3 raters × 8 dimensioner, + consensus)
  - `consensus_confidence` (om raters divergerade > 2 poäng: flag)
- `gold-set/README.md` dokumenterar rater-metodologi

**Rater-metodologi (dokumentera):**
- 3 raters (helst av dem en är ”user” / produkt-ägare, två är utomstående designers)
- Skala 0–10 per dimension, ingen diskussion innan score
- Consensus = median; flag om spread > 2
- Raters uppdaterar aldrig varandras scores

**AC:**
- 20 entries publicerade med consensus-score
- Spread-flag på ≤ 4 av 20 (annars är gold-set för brusig)

---

## Task 8.2 — `scripts/calibrate.mjs` [M]

**Fil:** `scripts/calibrate.mjs` (ny)

**Flöde:**
1. Ladda gold-set-bilder
2. Kör kritiker på varje (med nuvarande modell + prompt) → få model-scores
3. Beräkna per dimension: Spearman ρ mellan model och human consensus
4. Fit en per-dimension linjär kalibrering: `calibrated = a * raw + b` som minimerar MSE mot human
5. Om ρ < 0.6 på någon dimension → varning (kritiker är opålitlig där)
6. Emit `skills/visionary/calibration.json`:
   ```json
   {
     "schema_version": "1.0.0",
     "generated_at": "2026-04-24T09:12:00Z",
     "model": "claude-sonnet-4-6",
     "critic_prompt_hash": "sha256:abc…",
     "per_dimension": {
       "hierarchy":         { "slope": 0.94, "intercept": 0.2, "spearman_rho": 0.82 },
       "layout":            { "slope": 1.02, "intercept": -0.1, "spearman_rho": 0.79 },
       "motion_readiness":  { "slope": 0.71, "intercept": 1.4, "spearman_rho": 0.61 }
     }
   }
   ```

**AC:**
- Körningen producerar `calibration.json`
- Alla 8 dimensioner har spearman_rho ≥ 0.6 eller explicit flagga

---

## Task 8.3 — Aplica kalibrering i runtime [S]

**Fil:** `hooks/scripts/capture-and-critique.mjs`

**Steg:**
1. Ladda `calibration.json` vid hook start
2. För varje score som returneras från kritiker: `calibrated_score = slope * raw + intercept`, clampad [0, 10]
3. Applicera INNAN threshold-kontroller (regression-detect, early-exit)
4. Behåll raw scores i metrics för transparens

**AC:**
- Metrics-entry innehåller både `raw_scores` och `calibrated_scores`
- Early-exit-logic använder calibrated

---

## Task 8.4 — Nattlig calibration CI [S]

**Fil:** `.github/workflows/nightly-calibrate.yml` (eller motsvarande)

**Flöde:**
- Varje natt kl 03:00 UTC: kör `scripts/calibrate.mjs`
- Om nya `calibration.json` skiljer sig > 5 % från committad: öppna automatisk PR
- Om kritiker-spearman_rho sjunker under 0.6 på någon dimension: öppna issue

**AC:**
- Workflow kör framgångsrikt första gången
- Diff-rapport genereras som kommentar i PR

---

## Task 9.1 — Uppdatera `visual-critic.md` med evidence-requirement [M]

**Fil:** `agents/visual-critic.md`

**Ny regel i subagent-systempromptet:**

```
EVIDENCE-ANCHORED SCORING (MANDATORY)

Every dimension score MUST be justified by at least one of:
  (a) axe-core violation node-ID or rule-ID (for Accessibility)
  (b) CSS selector that illustrates the issue (for Hierarchy, Layout,
      Typography, Contrast, Distinctiveness, Motion Readiness)
  (c) A numeric metric from the deterministic scorer (for Craft)
  (d) Specific DOM coordinate or pixel value (x/y or computed value)

If you cannot cite mechanical evidence, the score MUST be 7 or above
(i.e., "nothing wrong detected, default to neutral"). Lowering a score
without evidence is forbidden.

Fields to emit per top_3_fix:
  - dimension
  - severity
  - proposed_fix
  - evidence: { type: "axe"|"selector"|"metric"|"coord", value: "..." }
  - selector_hint (when applicable, for Sprint 2 diff-mode)
```

**Steg:**
1. Uppdatera subagent-prompt
2. Uppdatera `critique-output.schema.json`: `top_3_fixes.items.properties.evidence` blir `required`
3. Uppdatera schema med `evidence.type` enum

**AC:**
- 100 % av top_3_fixes i en 10-prompt-suite innehåller evidence-fält
- Manuell spot-check 5 st: evidence-värdet stämmer faktiskt (citerad selector finns i DOM)

---

## Task 9.2 — Axe-output-integration i kritik-prompt [M]

**Fil:** `hooks/scripts/capture-and-critique.mjs`

**Steg:**
1. Efter `browser_evaluate` med axe-core: serialisera top-10 violations till strukturerad text
2. Injecta i kritik-prompten som ”axe_violations: [...]”
3. Kritiker måste referera axe-violation-ID när Accessibility-dimensionen scoras
4. Uppdatera schema: `numeric_scores.accessibility_axe_score` (deterministiskt, 0–10 baserat på antal violations × severity)

**AC:**
- Accessibility-dimensionens score korrelerar (r > 0.8) med axe-violations-count på 10-prompt-suiten

---

## Task 9.3 — Selector-validering i hooken [M]

**Fil:** `hooks/scripts/lib/validate-evidence.mjs` (ny)

**Syfte:** om kritiker citerar `.hero h1` som evidence men selectorn finns inte i DOM → kritikern hallucinerar.

**Steg:**
1. Efter kritik-output: för varje `evidence.value` som är en CSS-selector, kör `browser_evaluate` med `document.querySelector(sel)` och verifiera att något returneras
2. Om selector inte matchar → markera fixen som `evidence_invalid: true`, logga metric, men LET THE LOOP CONTINUE (kritiker får en varning nästa runda: "your previous selector .hero h1 matched nothing — verify before citing")
3. Tröskelvärde: om ≥ 2 invalid-evidence per runda → failura kritiker, retry med annan modell

**AC:**
- Metrics tracker `evidence_invalid_count` per runda
- På 10-prompt-suiten: ≤ 10 % invalid-evidence-rate efter en varning-runda

---

## Task 9.4 — Version-lock prompt + schema för audit [S]

**Motivering:** Rulers-forskningen fastslår att prompten måste frysas per version för att kalibreringen ska vara meningsfull.

**Steg:**
1. Hasha kritik-systempromptet + schema → skriv till `skills/visionary/critique-schema.md`: `prompt_hash: sha256:abc...`
2. `scripts/calibrate.mjs` embedder hashet i `calibration.json`
3. Vid runtime: om prompt_hash !== calibration.prompt_hash → varning + använd unkalibrerade scores
4. Ändring av kritik-prompt bumpar schema_version + kräver ny calibration-körning

**AC:**
- `critique-schema.md` dokumenterar versioneringsregeln
- Runtime-varning existerar och testas

---

## Task 9.5 — Dokumentera "evidence över vibes"-regeln [S]

**Fil:** `docs/critique-principles.md` (ny)

**Innehåll:**
- Varför evidence-anchored (Rulers-papperet)
- Exempel på bad evidence (”feels cramped”) vs good evidence (`.hero h1 { font-size: 24px; line-height: 24px } — no leading`)
- När får dimension-score vara < 7 utan evidence (aldrig, förutom aggregated composites)

**AC:**
- Doc linkad från `SKILL.md`

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Numerisk scorer är för strikt → blockerar valid konstnärliga val | Medium | Hög | Thresholds tunas från gold-set, inte hand-pickade. Allow-list för styles som medvetet går utanför (brutalism → negativ-yta-ratio kan vara ”fel”) |
| Gold-set är för liten → calibration bias | Hög | Medium | Expandera till 40 i Sprint 4 om behov, accept noise i Sprint 3 |
| Sharp/image-processing fail på Windows | Medium | Hög | Optional-deps + feature-flag `VISIONARY_ENABLE_NUMERIC_SCORER` |
| Evidence-requirement gör kritiker för försiktig (scorar allt 7+) | Medium | Medium | Monitera score-distribution pre/post; om median skjuts upp > 1.0 → tone down prompten |

## Definition of Done

- [ ] Alla tasks klara med AC
- [ ] 20-fils gold-set existerar
- [ ] `calibration.json` genererad, spearman_rho ≥ 0.6 på alla dimensioner
- [ ] Numerisk scorer integrerad och kritikern refererar den
- [ ] 100 % evidence-coverage i top_3_fixes
- [ ] Benchmark-score ≥ 18.8/20 (förväntat lyft från 18.35 via skarpare kritik)
- [ ] `results/sprint-03-comparison.md` publicerad
- [ ] Merged till `main`

## Amendments

### 2026-04-22 — Sprint 03 implementerad på `feat/sprint-03-numeric-scorer-rulers-evidence`

**Branch:** `feat/sprint-03-numeric-scorer-rulers-evidence` (från
`feat/sprint-02-structured-early-exit-diffs`, eftersom Sprint 2:s
untracked artefakter — schema.json, lib/ — var förutsättning för Item 7.7,
9.1, 9.2).

**Levererat:**

| Task | Status | Fil(er) |
|------|--------|---------|
| 7.1 Scaffold scorer | ✅ | `benchmark/scorers/numeric-aesthetic-scorer.mjs` |
| 7.2 Contrast-entropi | ✅ | (samma fil — Shannon på CIELAB L över 32×32) |
| 7.3 Gestalt-grouping | ✅ | (samma fil — inline DBSCAN + edge-alignment) |
| 7.4 Typografisk rytm | ✅ | (samma fil — log-ratio std + canonical-scale bonus) |
| 7.5 Negativ-yta-ratio | ✅ | (samma fil — background-token mask, sweet-spot [0.2,0.6]) |
| 7.6 Färg-harmoni | ✅ | (samma fil — k-means + ΔE2000 i CIE Lab) |
| 7.7 9:e dimension | ✅ | `skills/visionary/schemas/critique-output.schema.json`, `hooks/scripts/capture-and-critique.mjs`, `hooks/scripts/lib/loop-control.mjs` |
| 8.1 Gold-set scaffold | ✅ scaffold | `benchmark/gold-set/README.md`, `_template.meta.json`, `.github/ISSUE_TEMPLATE/gold-set-entry.md` |
| 8.2 calibrate.mjs | ✅ | `scripts/calibrate.mjs` (identity-fallback + degraded + fitted modes) |
| 8.3 Runtime calibration | ✅ | `hooks/scripts/lib/apply-calibration.mjs` (+CLI, + test) |
| 8.4 Nightly CI | ✅ | `.github/workflows/nightly-calibrate.yml` |
| 9.1 Evidence-requirement | ✅ | `agents/visual-critic.md`, schema |
| 9.2 Axe-integration | ✅ | hook additionalContext, `scoreAxe()` i scorer |
| 9.3 Selector-validering | ✅ | `hooks/scripts/lib/validate-evidence.mjs` (+ 13 tester) |
| 9.4 Version-lock | ✅ | `prompt_hash` i schema/hook/scorer, docs i `critique-schema.md` |
| 9.5 Evidence-principles doc | ✅ | `docs/critique-principles.md` + länkad från `SKILL.md` |

**Ändringar mot sprint-planens specifikation:**

- **Task 7.3 gestalt-formeln** omvärderades. Sprint-planens tolkning ("DBSCAN
  på centroider, ε=8px, minPts=2, grouping-score = 1 − normalize(variance
  of singletons)") scorar en perfekt grid som 0 eftersom centroiderna är
  långt från varandra. AC-kravet "perfekt-alignad grid → score ≥ 0.9" kan
  bara uppfyllas om edge-alignment räknas separat. Implementationen tar
  `max(groupedFraction, edgeAlignment)` och modulerar med within-cluster-
  variance — grid=1.0, slumpmässig=0.0, 4 tighta grupper=1.0.

- **Task 7.7 integration i `capture-and-critique.mjs`** kunde inte ske
  synkront i hook (hook kör före screenshot-capture). Lösning: hook-
  `additionalContext` instruerar Claude att köra scorern via Bash efter att
  screenshot + DOM-snapshot + axe-snapshot är sparade, och att inkludera
  resultatet som `numeric_scores` i critique-outputten. Scorern har fått en
  CLI-entrypoint (`--screenshot … --dom … --out …`) för det syftet.

- **Task 8.1 gold-set** är **scaffold utan entries**. De 20 hand-scorade
  entries kräver 3 mänskliga raters vardera (produktägare + 2 utomstående
  designers) enligt sprint-planens egen metodologi — det kan inte
  automatiseras. `calibrate.mjs` körs därför i **identity-fallback**-läge
  idag: varje dimension får slope=1, intercept=0, spearman_rho=null.
  Runtime (`apply-calibration.mjs`) tolererar det och kör uncalibrated
  med en varning. När 10+ entries finns flippar status automatiskt till
  `fitted` och nightly CI öppnar PR med ny `calibration.json`.

- **Task 8.4 nightly CI** kräver permissions (`contents: write`, `issues:
  write`, `pull-requests: write`) och `peter-evans/create-pull-request@v6`
  + `actions/github-script@v7` från GitHub Marketplace. Första körningen
  på schedule (03:00 UTC) verifierar slutcermonin.

- **Task 9.2 axe-integration** — `accessibility_axe_score` (0–10, deterministisk
  från violations × severity) implementerades som separat export i scorern
  (`scoreAxe()`). Hookens additionalContext instruerar Claude att spara
  axe-resultatet som JSON + mata scorern. Korrelation med
  accessibility-dimensionen (AC ≥ 0.8) kan inte mätas utan gold-set.

**Kvarvarande avvikelser mot AC:**

- **Task 7.2 AC** ("5 fixture-bilder ger förväntade värden ± 0.05"):
  inga fixture-bilder committade — sharp är optional-dep och scorern
  returnerar `null` när det saknas. AC verifieras när sharp + fixtures
  är på plats (lämpligt follow-up-task i Sprint 04).
- **Task 7.7 AC** ("kritik citerar numerisk score i ≥60% av fall där
  composite < 0.7"): kräver faktisk kritik-körning mot 10-prompt-suite,
  vilket behöver Anthropic SDK-adapter (kvarstår från Sprint 01 amendment).
- **Task 8.2 AC** ("calibration.json generated, spearman_rho ≥ 0.6 på
  alla dimensioner"): första villkoret ✅ (identity-fallback emitteras),
  andra villkoret kräver gold-set-data.
- **Task 8.4 AC** ("workflow kör framgångsrikt första gången"): inte
  triggad än — väntar på första 03:00 UTC cron eller manuell
  `workflow_dispatch`.
- **Task 9.1 AC** ("100 % evidence-coverage i top_3_fixes, 5 manuellt
  spot-checkade"): kräver faktiska critique-körningar.
- **Task 9.3 AC** ("≤ 10 % invalid-evidence-rate efter varning-runda"):
  kräver benchmark mot 10-prompt-suite.

**Verifiering (det som kunde köras utan SDK-adapter):**

- ✅ 52 unit-tester pass över loop-control, apply-diff, validate-evidence,
  apply-calibration
- ✅ Syntax-check på alla nya/ändrade `.mjs`-filer
- ✅ `numeric-aesthetic-scorer.mjs` importerar och kör rent på DOM-only
  fixtures (grid → 1.0, random → 0.0, tight groups → 1.0, modular typo →
  1.0)
- ✅ `scripts/calibrate.mjs --check` idempotent-verifierar on-disk
  `calibration.json`
- ✅ Syntetisk 12-entry gold-set bekräftade att fitted mode:
  hierarchy overrate +1 → slope=1.0 intercept=−1.0, contrast underrate −0.5 →
  slope=1.0 intercept=+0.5, ρ=1.0 på alla dims (raderade entries efter test).
- ✅ `apply-calibration`: prompt_hash-mismatch → `applied:false, reason:
  prompt_hash_mismatch`; fitted + match → slope/intercept appliceras;
  clamp till [0,10]; null-värden (craft_measurable disabled) passerar oförändrade.

**Dependency-status:** ingen ny NPM-dependency introducerad. `sharp` finns
fortsatt som optional dep (dokumenterat i scorern). Calibrate och
apply-calibration kör på vanlig Node 20+, inga binärer.

**Kvarvarande beslut / Sprint 04-ingångar:**

1. Kör Sprint 01:s SDK-adapter-arbete så Task 7.7/8.2/9.1/9.2/9.3 AC kan
   mätas mot faktiska kritik-körningar.
2. Recruit 3 raters → fill gold-set → switch calibration från identity
   till fitted. Utan detta är hela kalibrerings-pipelinen teoretisk.
3. Lägg `sharp` som optional dep i en framtida `package.json` (finns
   fortfarande ingen) så pixel-scorers kan verifieras. Fixture-suite för
   Task 7.2/7.5/7.6 committeras tillsammans.
4. Lägg pre-commit-check som rejectar PRs där critic-prompten ändras utan
   att `calibration.critic_prompt_hash` bumpas — sprint nämner detta som
   "a pre-commit check (when it lands)".
