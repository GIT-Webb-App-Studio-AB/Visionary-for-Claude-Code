# Sprint 09 — Motion Scoring 2.0: 6-dim viktad scorer + Maturity Model

**Vecka:** 15–16
**Fas:** 5 — Critique-uppgradering (ny fas: höjer signalkvaliteten i kritikslingan)
**Items:** 24 från roadmap (ny)
**Mål:** Lyfta Motion Readiness från 3.55/5 (svagaste dimensionen i partial benchmark n=10) till en mätbar, kalibrerad score med 6 sub-dimensioner + 5-nivå Maturity Model. Idag är dimensionen ett heuristiskt medelvärde som fångar "har komponenten någon transition?" men missar AARS-mönster, timing-konsistens och cinema-grade easing. Det blir grunden för Vibe Motion Editor (Sprint 13) — utan en bra signal kan vi inte vibe-tuna.

Motivation: Motion är vår uttalade USP men benchmarkets svagaste dimension. Vi mäter den som om den vore en check-box ("har spring tokens? ✓") när den i verkligheten är en multi-dimensionell craft-fråga.

## Scope

- Item 24 — Motion Scoring 2.0: 6 sub-dimensioner + viktad aggregator + 5-nivå Motion Maturity Model + per-dim kalibrering mot gold-set.

## Pre-flight checklist

- [ ] Sprint 8 mergad till main — slop-gate + anti-anchors live
- [ ] Bekräfta att `benchmark/scorers/numeric-aesthetic-scorer.mjs` kan utökas (eller fork:as till `motion-scorer-2.mjs`)
- [ ] Gold-set med ≥ 20 motion-exempel (varje med human-rated 0–5 per sub-dim) — utöka existerande gold-set parallellt med sprinten
- [ ] Feature-branch: `feat/sprint-09-motion-scoring-2`

---

## Task 24.1 — Easing Provenance detector [M]

**Fil:** `hooks/scripts/lib/motion/easing-provenance.mjs` (ny)

**Vad det mäter:** Hur intentionell är easing-funktionen? Default `ease`/`ease-in-out` utan justering = 1/5. Spring tokens (Motion v12 `bounce` + `visualDuration`) eller `linear()` med ≥ 3 stops = 5/5.

**Steg:**
1. Parsa CSS-källa för komponenten — leta efter `transition-timing-function`, `animation-timing-function`, `linear(...)`, `cubic-bezier(...)`, samt JSX-attribut för `motion/react` (`bounce`, `visualDuration`, `stiffness`, `damping`).
2. Klassificera fynd:
   - `unspecified` (default ease) → 1
   - `cubic-bezier` med icke-trivial kurva (≠ standard ease/ease-in/ease-out) → 3
   - `linear()` med 3–4 stops → 4
   - `linear()` med ≥ 5 stops eller spring tokens → 5
3. Returnera `{ score: 0..1, evidence: [{ selector, value }, ...] }`.

**AC:**
- Test: komponent med `transition: opacity 200ms ease` → score 0.2
- Test: komponent med `motion={{ bounce: 0.4, visualDuration: 0.3 }}` → score 1.0
- Test: komponent med `linear(0, 0.4 25%, 0.7 50%, 0.9 75%, 1)` → score 1.0
- Evidence-array innehåller selector + faktiskt värde

---

## Task 24.2 — AARS-pattern detector [L]

**Fil:** `hooks/scripts/lib/motion/aars-pattern.mjs` (ny)

**Vad det mäter:** Anticipation → Action → Reaction → Settle. 4-fasade keyframes med tecken-skifte (negativt → positivt → negativt → noll) i transform/opacity. Detta är cinema-grade rörelseberättande.

**Steg:**
1. Parsa `@keyframes`-block (eller `motion.div`-`animate`-array) för komponenten.
2. För varje keyframe-sekvens: extrahera transform/opacity-värden per stop.
3. Beräkna delta-tecken-sekvens: `[+, -, +, 0]` är klassisk AARS.
4. Klassificera:
   - `linear ramp` (monotont värde 0 → 1) → 0.2
   - `ease-out only` (snabb start, mjuk landning) → 0.5
   - `overshoot + settle` (3 faser: action, reaction, settle) → 0.8
   - `full AARS` (4 faser: anticipation, action, reaction, settle) → 1.0
5. Vid spring-tokens: härled implicit AARS från `bounce > 0` (springs har inbyggd anticipation/overshoot).
6. Returnera `{ score, phases_detected, evidence }`.

**AC:**
- Test: `@keyframes slide { from { x: 0 } to { x: 100 } }` → score 0.2 (linear ramp)
- Test: keyframes med `[0%, 60%: x: 110px, 80%: x: 95px, 100%: x: 100px]` → score 0.8 (overshoot + settle)
- Test: spring med `bounce: 0.4` → score ≥ 0.7 (implicit AARS)

---

## Task 24.3 — Timing Consistency detector [M]

**Fil:** `hooks/scripts/lib/motion/timing-consistency.mjs` (ny)

**Vad det mäter:** Variansen i durations över komponentens transitions. Slumpmässig duration-spridning känns disjunkt; konsistent rytm känns intentionell. σ < 80 ms över alla transitions = 5/5.

**Steg:**
1. Samla alla durations från CSS + JSX.
2. Beräkna standardavvikelse i ms.
3. Mappa: σ < 80 ms → 1.0; σ < 150 ms → 0.8; σ < 250 ms → 0.5; σ ≥ 400 ms → 0.2.
4. Specialfall: enstaka transition (n=1) → 1.0 trivialt.
5. Specialfall: motion-tokens från en delad fil (genomgående `--motion-fast`/`--motion-base`) ger automatiskt full poäng — räkna distinkta literala värden, inte token-referenser.

**AC:**
- Test: transitions med `[200ms, 220ms, 180ms]` → σ ≈ 16 → score 1.0
- Test: transitions med `[100ms, 500ms, 300ms]` → σ ≈ 163 → score 0.8
- Test: alla refererar `var(--motion-base)` → score 1.0 oavsett resolved value

---

## Task 24.4 — Narrative Arc detector [M]

**Fil:** `hooks/scripts/lib/motion/narrative-arc.mjs` (ny)

**Vad det mäter:** Sekvenseras element via stagger eller `transition-delay` på meningsfullt sätt? Header → body → CTA är en arc; alla samtidigt är default-AI-utdata.

**Steg:**
1. Bygg DOM-träd från renderad komponent (Playwright-snapshot eller statisk JSX-parse).
2. För varje animerat element: extrahera `transition-delay` eller motion-`delay`.
3. Klassificera:
   - alla samtidigt (alla delays = 0 eller undefined) → 0.2
   - 2 lager (header → resten) → 0.6
   - 3+ lager med monotoniskt växande delay → 1.0
   - random delays utan struktur → 0.4
4. Bonus: stagger via `motion`-`staggerChildren` på parent → 1.0

**AC:**
- Test: 3 element, alla utan delay → score 0.2
- Test: header delay=0, body delay=100, CTA delay=200 → score 1.0
- Test: `staggerChildren: 0.1` på parent → score 1.0

---

## Task 24.5 — Reduced-motion compliance via Playwright [L]

**Fil:** `hooks/scripts/lib/motion/reduced-motion-compliance.mjs` (ny)

**Vad det mäter:** Faktisk DOM-bbox-delta när `prefers-reduced-motion: reduce` är aktiv. WCAG 2.3.3 Level A kräver att rörelse degraderas till opacity-only eller stillbild för transform-tunga animationer.

**Steg:**
1. I `capture-and-critique.mjs`: kör Playwright `browser.newContext({ reducedMotion: 'reduce' })` parallellt med ordinarie viewport.
2. Mät max-bbox-delta för varje animerat element under en 1s-window post-mount.
3. Mappa:
   - max-delta ≤ 8 px → score 1.0 (compliant)
   - 8–24 px → 0.6
   - 24–80 px → 0.3
   - > 80 px → 0.0 (klar a11y-failure)
4. Returnera även raw-pixel-mätningar i evidence för critic-rapport.

**AC:**
- Test: komponent med `@media (prefers-reduced-motion: reduce) { transform: none }` → score 1.0
- Test: komponent som ignorerar media-query → score < 0.5
- Playwright-context körs additivt — original screenshot opåverkad

---

## Task 24.6 — Cinema-grade Easing detector [M]

**Fil:** `hooks/scripts/lib/motion/cinema-easing.mjs` (ny)

**Vad det mäter:** Avancerade easing-egenskaper som signalerar cinema-grade craft: `linear()` med ≥ 5 stops, overshoot > 0, ease-out-heavy distribution på lång animation (≥ 400 ms har sista 30 % av tiden täcker > 50 % av distansen).

**Steg:**
1. Plocka ut alla easing-kurvor (cubic-bezier, linear()-stops, spring-presets).
2. Sample varje kurva vid t = [0.1, 0.3, 0.5, 0.7, 0.9, 1.0].
3. Mät:
   - max-värde > 1.0 → overshoot bonus +0.2
   - sista 30 %:s tid täcker > 50 % distans → ease-out-heavy bonus +0.3
   - spring-tokens med `bounce > 0` → automatisk 0.8 baseline
4. Räkna också `linear()`-stops: ≥ 5 → +0.3.
5. Cap totalt på 1.0.

**AC:**
- Test: standard `cubic-bezier(0.4, 0, 0.2, 1)` på 200 ms → score ~0.5
- Test: `linear()` med 6 stops + overshoot → score 1.0
- Test: spring `bounce: 0.6` → score ≥ 0.8

---

## Task 24.7 — Aggregator + Motion Maturity Model classifier [M]

**Fil:** `hooks/scripts/lib/motion/scorer-2.mjs` (ny — ersätter delvis numeric-aesthetic-scorers motion-del)

**Steg:**
1. Anropa de 6 sub-detektorerna parallellt.
2. Viktad summa enligt:
   - Easing Provenance: 0.20
   - AARS-pattern: 0.20
   - Timing Consistency: 0.15
   - Narrative Arc: 0.15
   - Reduced-motion: 0.15
   - Cinema-grade Easing: 0.15
3. Total → 0..1, mappa till 0..10 för critique-dimensionen.
4. Klassificera Maturity-tier (0–4):
   - tier 0 (None): inga transitions detected
   - tier 1 (Subtle): score < 0.4 men ≥ 0.2
   - tier 2 (Expressive): 0.4–0.65
   - tier 3 (Kinetic): 0.65–0.85, kräver AARS ≥ 0.6 OCH Cinema ≥ 0.5
   - tier 4 (Cinematic): ≥ 0.85, kräver alla 6 sub-dims ≥ 0.6
5. Returnera `{ total_score, tier, subscores: {...}, evidence }`.

**AC:**
- Test: kompositkomponent med spring + AARS + stagger → tier 3 eller 4
- Test: ren `transition: all 200ms` → tier 1
- Test: ingen motion alls → tier 0

---

## Task 24.8 — Trace-schema utökning [S]

**Fil:** `skills/visionary/schemas/trace-entry.schema.json`

Lägg till:
```json
"motion": {
  "type": "object",
  "properties": {
    "total_score": { "type": "number" },
    "tier": { "type": "integer", "minimum": 0, "maximum": 4 },
    "tier_name": { "enum": ["None", "Subtle", "Expressive", "Kinetic", "Cinematic"] },
    "subscores": {
      "easing_provenance": { "type": "number" },
      "aars_pattern": { "type": "number" },
      "timing_consistency": { "type": "number" },
      "narrative_arc": { "type": "number" },
      "reduced_motion": { "type": "number" },
      "cinema_easing": { "type": "number" }
    }
  }
}
```

**AC:**
- Schema validerar mot 5 fixturer (en per tier)
- `KNOWN_EVENTS` i `trace.mjs` har inte ändrats (motion lever som payload-fält i existing critique-events)

---

## Task 24.9 — Per-dim kalibrering mot gold-set [M]

**Fil:** `scripts/calibrate-motion-2.mjs` (ny)

**Steg:**
1. Utöka `benchmark/gold-set/` med 20 motion-rated entries: per entry, human-score 0–5 per sub-dim.
2. Kör scorer på samtliga, fitta linjär regression per sub-dim (`a*x + b`) mot human-score.
3. Spara fit:ade konstanter i `skills/visionary/calibration/motion-2.json`.
4. Scorer-2 läser kalibrering vid runtime; produktion-score = `clamp(a*raw + b, 0, 1)`.

**AC:**
- Calibration-fil committad
- R² per sub-dim ≥ 0.5 eller dokumenterat varför inte (för litet sampel — ok om noterat)
- `node scripts/calibrate-motion-2.mjs --report` skriver R² + residual-stats

---

## Task 24.10 — Integration i critique-loop [M]

**Fil:** `hooks/scripts/capture-and-critique.mjs`, `agents/visual-critic.md`

**Steg:**
1. Anropa `motion/scorer-2.mjs` för rendered komponent + statisk källa parallellt med befintliga scorers.
2. Skicka `motion.subscores` + `motion.tier` till critic via `additionalContext`.
3. Critic-prompt uppdateras: "Motion Readiness är nu en viktad summa — citera *vilken sub-dim* som drar ner scoret om du sätter < 7."
4. Evidence-rule: rapport måste ange exakt sub-dim + numeriskt värde, inte "motion känns svag".

**AC:**
- Critic-output innehåller per-subdim citat när motion-score < 7
- Existing critique-flöde opåverkat utöver motion-dimensionen
- Toggle: `VISIONARY_MOTION_SCORER_V2=0` för rollback till v1

---

## Task 24.11 — Tester [M]

**Fil:** `hooks/scripts/lib/motion/__tests__/*.test.mjs` (sex test-filer, en per sub-detektor + aggregator)

**Coverage:**
- Varje sub-detektor: 5 fixturer (extrema högt, extrema lågt, tre mellannivåer)
- Aggregator: tier-classification edge-cases (gränsvärden 0.4 / 0.65 / 0.85)
- Schema-validation av motion-payload
- Integration med Playwright reduced-motion-context (mocked)

**AC:**
- `node --test` grön på alla 6 + aggregator
- Coverage ≥ 80 % på `lib/motion/`

---

## Benchmark-verifiering

**Fil:** `results/sprint-09-comparison.md`

**Pre/post-mätning på 20-prompt motion-suite:**
- Motion Readiness mean (förvänta lift från 3.55 → ≥ 4.2)
- Motion Readiness σ (förvänta minskning — bättre signal = lägre brus)
- Tier-distribution (förvänta att fler hamnar på tier 2–3 efter att modellen ser rikare feedback)
- Time-per-generation delta (Playwright reduced-motion-context lägger ~1.5s; ok)

**AC:**
- Rapport publicerad
- Mean-lift ≥ 0.5 demonstrerad

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Sub-detektor missförstår JSX-spring-syntax (regex spröd) | Medel | Medel | Utöka fixture-suite med Motion v12-snippets från real komponenter |
| Playwright reduced-motion-context lägger för mycket tid | Låg | Medel | Cache result per session, kör i parallell context, skip om `VISIONARY_FAST_MODE=1` |
| Calibration overfits 20-entry gold-set | Hög | Medel | Använd ridge regression med liten λ, dokumentera för stort sampel-behov |
| Tier-thresholds inte matchar designerintuition | Medel | Låg | Iterera thresholds efter benchmark, dokumentera resonemang |

---

## Definition of Done

- [ ] Alla tasks (24.1–24.11) klara
- [ ] Motion Scoring v2 körs parallellt med v1; togglebart
- [ ] 20-entry motion gold-set committad
- [ ] Calibration-konstanter sparade
- [ ] Trace-schema utökad + validerad
- [ ] `results/sprint-09-comparison.md` publicerad med mean-lift ≥ 0.5
- [ ] Mergad till `main`

## Amendments

_Tomt._
