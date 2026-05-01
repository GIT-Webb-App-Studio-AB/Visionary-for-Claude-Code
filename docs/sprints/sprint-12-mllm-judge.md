# Sprint 12 — MLLM Judge tie-breaker: multimodal critique på screenshots

**Vecka:** 21–22
**Fas:** 5 — Critique-uppgradering
**Items:** 27 från roadmap (ny)
**Mål:** Lägga till en multimodal Claude-pass i critique-loopen som *faktiskt ser screenshoten* och bryter ties där numerisk + heuristisk + DINOv2-stack är osäkra. Idag resonerar vår critic om koden, inte om hur den faktiskt renderar — multimodal pass täpper det gapet. Strikt regel: judge får aldrig rejecta ensam, bara breaka ties (papret arxiv:2510.08783 visar att MLLMs inte fångar mänsklig perception fullständigt; de fungerar som supplement, inte ersättning).

Avgränsning: cost-control är prio. Max 1 judge-anrop per critique-round, bara när tie-detection triggar.

## Scope

- Item 27 — MLLM Judge tie-breaker: judge-prompt + pairwise rubric, tie-detection-logik, screenshot-pass-återanvändning, hard rule "cannot reject solo", trace-events, cost-control, env-toggle.

## Pre-flight checklist

- [ ] Sprint 11 mergad — DINOv2 visual_style_match är 11:e dim
- [ ] Anthropic API-nyckel med vision-stöd tillgänglig (`ANTHROPIC_API_KEY`)
- [ ] Cost-budget för sprint: $50 i API-anrop (uppskattning 100 judge-pass × $0.50)
- [ ] Feature-branch: `feat/sprint-12-mllm-judge`

---

## Task 27.1 — Judge-prompt + pairwise rubric [M]

**Fil:** `agents/mllm-judge.md` (ny), `hooks/scripts/lib/judge/prompt.mjs`

**Konstruktion:**
- Pairwise comparison: judge får två screenshot-versioner (eller en screenshot + critique-state) och ska välja vinnare per dimension.
- Rubric anpassad till våra 11 dimensioner men *inte alla samtidigt* — judge fokuserar på de dim där tie detekterades.
- Output-format: strikt JSON `{"winner": "A"|"B"|"tie", "rationale": "...", "confidence": 0..1}`.

**Prompt-struktur:**
```
Du är en visuell craft-domare. Du ser två renders av samma komponent.
Numerisk + heuristisk + DINOv2-scoring är osäker mellan dem på dimensionen "{dim}".

Bedöm endast "{dim}". Avstå från att kommentera andra dimensioner.

Bilder: {A}, {B}.

Specifikation för dimensionen "{dim}":
{rubric_text_per_dim}

Svara strikt som JSON: { "winner": "A"|"B"|"tie", "rationale": "...", "confidence": 0..1 }
```

**Steg:**
1. Skriv rubrik-text per dim (10–15 rader vardera × 11 dim = ~150 rader sammanlagt).
2. Implementera `buildPrompt(dimension, screenshotA, screenshotB)`.
3. Använd Claude Sonnet med vision (medvetet inte Opus — kostnaden måste hållas nere).

**AC:**
- Prompt-output validerar mot strikt JSON-schema
- Rubrik per dim är < 150 ord, undviker subjektiva ord ("snyggt"), använder mätbara kriterier

---

## Task 27.2 — Tie-detection logic [M]

**Fil:** `hooks/scripts/lib/judge/tie-detect.mjs`

**Vad räknas som tie:**
1. Inom-round mellan två varianter där composite-score-diff ≤ 0.3.
2. När critic markerar dim med low-confidence (< 0.6).
3. När heuristic-stack och DINOv2 ger motsatta signaler (numeric säger 8, visual säger 4).

**Steg:**
1. Implementera `detectTies(critiqueState)` som returnerar lista av `{ dim, candidates: [A, B], reason }`.
2. Per round får judge anropas för max 1 tie (ytterligare ties upprepas i nästa round om det finns).
3. Trace-event: `judge_tie_detected` med dim + reason.

**AC:**
- Test: composite-diff 0.2 → tie detected
- Test: heuristic 8.0 / visual 4.0 → conflict tie detected
- Test: low-confidence dim → tie detected

---

## Task 27.3 — Screenshot-pass återanvändning [S]

**Fil:** `hooks/scripts/capture-and-critique.mjs`

**Steg:**
1. Existing Playwright-pass producerar redan screenshot per round; spara path.
2. För pairwise: vi har sällan två renders i samma round (best-of-N undantag). Strategy:
   - Om best-of-N body är aktiv (Sprint 4): jämför top-2 candidates.
   - Annars: jämför round-N output mot round-(N-1) output (har modellen förbättrats?).
3. Pass screenshot-paths som file-URIs eller base64 till judge-prompt.

**AC:**
- Inga extra Playwright-pass införda
- Screenshots cacheas per session så samma render inte renderas igen

---

## Task 27.4 — Pairwise comparison API [M]

**Fil:** `hooks/scripts/lib/judge/run.mjs`

**Steg:**
1. `runJudge({dim, screenshotA, screenshotB})` → returnerar judge-output.
2. Anropa Anthropic Messages API med vision (Sonnet 4.6 default; togglebar via env).
3. Parse JSON-output, validera strikt.
4. Vid parse-fail: 1 retry med strikare instruktion; sedan ge upp gracefully (returnera `{winner: "tie", confidence: 0}`).
5. Logga tokens-usage till trace för cost-tracking.

**AC:**
- API-anrop fungerar med given screenshot
- Output JSON-validerat
- Tokens-usage trackat i trace

---

## Task 27.5 — Hard rule: cannot reject solo [M]

**Fil:** `hooks/scripts/lib/judge/policy.mjs`

**Policy-implementation:**
- Judge-output integreras *bara* för att välja mellan två kandidater (best-of-N) eller för att besluta om en regen-loop är klar.
- Judge får INTE sätta total-rejection. Om judge säger `winner: "tie"` med låg confidence → critique fortsätter med heuristic-baserad weighting.
- Om judge säger en kandidat vinner men numerisk-stack starkt motsäger (diff ≥ 1.5 på composite): heuristic vinner, judge-vote räknas som meta-data.

**Steg:**
1. Implementera `applyJudgePolicy(judgeOutput, heuristicState)`.
2. Output: `{ chosen_winner, used_judge: bool, override_reason?: str }`.
3. Trace-event: `judge_policy_applied` med decision.

**AC:**
- Test: judge säger A, heuristic säger A → both agree, judge counted
- Test: judge säger A, heuristic säger B med stark margin → heuristic vinner, override-flag set
- Test: judge säger tie low-confidence → ingen påverkan på resultat

---

## Task 27.6 — Trace-schema utökning [S]

**Fil:** `skills/visionary/schemas/trace-entry.schema.json`

Lägg till events:
- `judge_tie_detected` — payload: `{dim, reason, candidates}`
- `judge_invocation` — payload: `{dim, tokens_used, latency_ms}`
- `judge_decision` — payload: `{winner, confidence, rationale}`
- `judge_policy_applied` — payload: `{chosen_winner, override_reason}`

Lägg till i `KNOWN_EVENTS` i `trace.mjs`.

**AC:**
- Schema validerar mot fixturer
- Alla fyra events emitteras under en simulerad tie-flow

---

## Task 27.7 — Cost-control: max 1 judge per round [M]

**Fil:** `hooks/scripts/lib/judge/budget.mjs`

**Steg:**
1. Per critique-round: max 1 judge-call.
2. Per session (default): max 5 judge-calls.
3. Env-tunable: `VISIONARY_JUDGE_MAX_PER_ROUND=1`, `VISIONARY_JUDGE_MAX_PER_SESSION=5`.
4. När budget överskrids: skip judge, logga `judge_budget_exhausted`-event.

**AC:**
- Test: 6:e judge-anrop blockas
- Test: ny session resettar counter
- Cost per session ≤ ~$2.50 i Sonnet-anrop (uppskattat)

---

## Task 27.8 — Env-toggle + opt-out [S]

**Fil:** `hooks/scripts/capture-and-critique.mjs`, `README.md` (env-flag-tabellen)

**Toggle:**
- `VISIONARY_MLLM_JUDGE=0` (default) → judge AV i v1.4. Opt-in.
- `VISIONARY_MLLM_JUDGE=1` → judge på.
- `VISIONARY_MLLM_JUDGE=tie-only` → bara vid tie-detection (rekommenderat).
- `VISIONARY_MLLM_JUDGE_MODEL=claude-sonnet-4-6` → modellval.

**AC:**
- Toggle dokumenterad i README env-tabell
- Default opt-in efter sprint är tie-only-mode

---

## Task 27.9 — Tester [M]

**Fil:** `hooks/scripts/lib/judge/__tests__/*.test.mjs`

**Coverage:**
- Tie-detection: 5 fixturer per typ (composite-diff, conflict, low-confidence)
- Prompt-builder: rubric per dim renderar korrekt
- Policy: 4 scenarios (agree, conflict-mild, conflict-stark, low-confidence)
- Budget: överskridande triggar correct event
- Mocked API: judge-call återger förväntad output

**AC:**
- `node --test` grön
- Coverage ≥ 80 % på `lib/judge/`
- API-anrop mockade (ingen riktig API-cost i test)

---

## Task 27.10 — Benchmark-verifiering [M]

**Fil:** `results/sprint-12-judge.md`

**Pre/post-mätning på 30-prompt-suite:**
- Average critic-confidence per dim (förvänta lift på dim där tie-detection triggar)
- % av rounds där judge invoked (förvänta 15–30 %)
- Total cost per benchmark-run (förvänta ≤ $5)
- Final score-stability (förvänta minskad varians mellan re-runs)
- Wall-clock-tid per round (förvänta +5–10 s när judge invoked)

**AC:**
- Rapport publicerad
- Cost-faktiskt vs uppskattat dokumenterad
- Stability-lift demonstrerad

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Judge-output JSON-broken pga modellen "förklarar" istället för svarar | Medel | Medel | Strikare prompt + 1 retry + graceful fallback till "tie" |
| Cost runaway om tie-detection över-triggar | Medel | Hög | Hård budget-cap; default opt-out i v1.4; tie-only-mode rekommenderad |
| Judge biased för bilder med vissa egenskaper (ljusstyrka, etc.) | Medel | Medel | Anti-bias-rubric: "ignorera ambient ljusstyrka, fokusera dim-specifika kriterier" |
| Vision-cost per Sonnet-anrop ändras | Hög | Låg | Soft budget i config; varning vid > 1.2× expected |
| Latency per judge ≥ 8 s blockar UX | Medel | Medel | Async vid best-of-N; markera judge-pending i UX |

---

## Definition of Done

- [ ] Alla tasks (27.1–27.10) klara
- [ ] Judge invokeras endast vid tie-detection (default policy)
- [ ] Hard rule "cannot reject solo" verifierad i tester
- [ ] Cost-budget < $5 per 30-prompt benchmark
- [ ] Trace-events emitteras korrekt
- [ ] `results/sprint-12-judge.md` publicerad med stability-lift
- [ ] Mergad till `main`

## Amendments

_Tomt._
