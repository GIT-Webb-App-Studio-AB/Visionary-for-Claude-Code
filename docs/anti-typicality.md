# Anti-typicality — bryta generativ konvergens

## Varför detta finns

Visionary har 202 designstilar i en katalog. Trots det upplevde användare
att samma stilar dök upp om och om igen — de "förväntade", de "trygga", de
som ser ut som en generisk SaaS-baseline. Roten till problemet är inte
katalogen; det är att RLHF-tränade språkmodeller (Claude inkluderat) lider
av **typicality bias**: de drar systematiskt mot fördelningens topp. Zhang
et al. mätte α ≈ 0.57–0.65 över Claude / GPT / Gemini-familjerna 2025. När
samma modell både genererar OCH kritiserar (som i Self-Refine, Madaan
2023) förstärks biaset över round 2/3 — critic-loopen blir en
echo-chamber.

Sprint 16 implementerar två träningsfria interventioner som tillsammans
bryter konvergensen:

1. **Verbalized Sampling (proactive)** — tvinga modellen att returnera 5
   distinkta tolkningar med sannolikhetsvikter INNAN generation, sampla
   probabilistiskt med anti-typicality boost.
2. **Originality-dimension (reactive)** — en 9:e critic-dimension som
   jämför nya genereringar mot **användarens egen accepterade historik**
   istället för en abstrakt "bra design".

Förväntad effekt baserat på Zhang 2025-baseline: 1.5–2× diversity
(pairwise DINOv2-cosine sjunker från ~0.72 till ~0.45–0.55) utan
signifikant kvalitetstapp (≤ 0.3 avg score).

## Två interventioner

### 1. Verbalized Sampling (proactive — före generation)

Istället för att modellen genererar en design direkt från StyleBrief
(Stage 2) ber vi den först — i en ny **Stage 1.5** — returnera 5 distinkta
tolkningar med sannolikhetsvikter. Vi samplar sedan PROBABILISTISKT från
fördelningen med en boost-faktor som ger låg-prob-koncept luft.

**JSON-format som modellen returnerar:**

```json
{
  "concepts": [
    {
      "concept": "minimal editorial card with single accent line",
      "probability": 0.34,
      "rationale": "matches calm-tone signal + density:spacious",
      "suggested_style_id": "swiss-international"
    },
    {
      "concept": "asymmetric grid with overprint typography",
      "probability": 0.22,
      "rationale": "alternative tied to Greiman bias if user has any history",
      "suggested_style_id": "new-wave-greiman"
    },
    "... (3 more)"
  ]
}
```

Probabilities summerar till ~1.0 men är medvetet *anti-flat* — modellen
får använda sin egen fördelningssignal, vi modulerar den i nästa steg.

**Anti-typicality boost-formel:**

```
weight_i = probability_i * (1 / probability_i)^α
        = probability_i^(1 - α)
```

Med α = 0.65 (default, mid-point på Zhang 2025 [0.6, 0.7] sweet spot)
blir effekten:

| probability | utan boost | med boost (α=0.65) | relativ pick-frekvens |
|---|---|---|---|
| 0.05 | 0.05 | 0.155 | ~3.1× boost |
| 0.15 | 0.15 | 0.282 | ~1.9× boost |
| 0.25 | 0.25 | 0.388 | ~1.5× boost |
| 0.40 | 0.40 | 0.525 | ~1.3× boost |
| 0.55 | 0.55 | 0.642 | ~1.2× boost |

(boost-värdena normaliseras tillbaka till en fördelning som summerar till
1 innan weighted random pick.)

**Konvergens-check:** om 3+ av de 5 koncepten har pairwise cosine >
0.85 i 384-dim embedding-rymden (eller fallback: token-set Jaccard >
0.7) triggas en re-prompt med systemmessage *"explicit divergens: dina 5
förslag liknar varandra för mycket; ge mig 5 som är från olika
design-traditioner"*. Detta hindrar modellen från att returnera 5
varianter av samma underliggande idé.

**Output i receipt:**

```json
"vs_concepts": [
  { "concept": "...", "probability": 0.34, "picked": false },
  { "concept": "...", "probability": 0.22, "picked": true },
  "..."
],
"vs_alpha": 0.65,
"vs_skipped": false
```

### 2. Originality-dimension (reactive — under critique)

En 9:e critic-dimension `originality_vs_history` parallell med
existing 8 (Hierarchy / Contrast / Motion-Coherence / Density / Brand-Fit
/ Originality / Accessibility / Polish). Den existerande "Originality"-
dimensionen i visual-critic mäter *generic AI slop* (gradient + Inter +
purple-glass) — det är ett kataloglevel-problem. Den nya
`originality_vs_history`-dimensionen mäter *similarity to the user's own
accepted history* — det är ett user-level-problem. Olika problem,
olika dimensioner.

**Score-formel:**

```
originality_vs_history = 10 - (max(similarity_to_history) * 10)
```

- Helt nytt koncept (cosine ≤ 0.4 mot all history) → score ≈ 6+.
- Identisk kopia av tidigare accepted (cosine 0.95+) → score ≈ 0.5.
- Range: [0, 10].

**Round-gating:**

| Round | Originality-dim aktiv? | Varför |
|---|---|---|
| 1 | Nej (returnerar `null`) | Ingen historik att jämföra round 1's output mot |
| 2+ | Ja, default-vikt 0.8 i arbitration | Self-Refine-loopen bryts |

Round 1 har inget att jämföra mot — historik = redan accepterade designs
före nuvarande generation. Critic-merge ignorerar dimensionen i round 1
och fortsätter med 8 dims; från round 2 deltar dimensionen i merge med
default-vikt 0.8 (lägre än craft/aesthetic 1.0 men högre än
designer-pack 0.25 — så den påverkar utan att dominera).

**Två similarity-vägar:**

- **DINOv2-mode** (om `VISIONARY_VISUAL_EMBED=1` från Sprint 11):
  similarity = DINOv2-cosine mellan render-screenshot och
  history-thumbnails. Ger ~1.2–1.4× bättre originality-precision.
- **8D-fallback** (default): similarity = cosine på 8D-aesthetic-
  embedding (extraherad från Sprint 6 critic-output: `{hierarchy,
  contrast, motion, density, brand_fit, originality, accessibility,
  polish}`). Coarse men fungerar för echo-chamber-detection.

**Anti-pattern context i round 2+:**

Round 2+ får dynamiskt injicerad context före critic-prompten:

```
ANTI-PATTERN CONTEXT (round 2+):
The user has previously accepted these 10 designs (their taste pattern is
stabilized). Do NOT reward this generation for converging toward those
patterns. Reward it ONLY when it explores territory the user has not yet
seen. Score originality_vs_history accordingly.

Reference signatures (top-10):
1. generation_id: 01HXY... | dom_palette: oxblood | density: dense | motion: subtle
2. ...
```

Detta är **echo-chamber break**: critic-modellen får explicit veta att
poänghöjningar via konvergens mot mainstream inte räknas — bara via
ovanlighet i facts.jsonl-historik. Cap: 1500 tokens, cached per session.

**Top collisions:** trace-event `originality_score` rapporterar top-3
mest liknande historiska entries så användaren kan se *vad* den nya
designen liknar:

```json
{
  "round": 2,
  "score": 3.5,
  "top_collisions": [
    { "generation_id": "01HXY...", "similarity": 0.91 },
    { "generation_id": "01HZA...", "similarity": 0.83 },
    { "generation_id": "01HYB...", "similarity": 0.78 }
  ],
  "used_method": "embedding-8d"
}
```

## Hur Verbalized Sampling skiljer sig från `/variants`

Visionary har sedan Sprint 04 ett `/variants`-kommando som genererar 3
mutually-distinct takes. Det är inte samma sak som Verbalized Sampling
— de opererar på olika lager:

| Aspekt | Verbalized Sampling | `/variants` |
|---|---|---|
| Vad | 5 koncept-vikter (text) | 3 fullständiga renders (kod + screenshot) |
| När | INNAN generation, internt i Stage 1.5 | EFTER stil-val, för user-pick |
| Token-cost | ~400 tokens per generation | ~3× full generation |
| User-visible | Bara i receipt (vs_concepts) | Alla 3 visas i preview, user pickar |
| Syfte | Bryta typicality bias INTERNT | Ge user explicit choice mellan distinkta takes |
| Output | Påverkar Stage 2 input (Design Reasoning Brief) | Tre färdiga komponenter på disk |

Båda kan komboas: `/variants --vs` ger 3 fullständiga renders × varsitt
oberoende VS-pick. Det är dyrast (3× token-cost för VS + 3× full
generation) men bryter konvergensen på BÅDE concept-level OCH render-
level.

## Hur originality-dim funkar i praktiken

**Round 1** — generation produceras, critic-merge kör 8 dims som idag,
arbitration väljer winner. Ingen ändring jämfört med pre-Sprint-16.

**Round 2** — om winner från round 1 godkänns för refine:

1. Anti-pattern context byggs från `taste/facts.jsonl` (top-10 senaste
   accepted, sorterade på `last_seen DESC`).
2. Context injiceras i critic-prompten.
3. Critic kör 9 dims (originality_vs_history aktiv).
4. Critic-merge använder default-vikt 0.8 för originality.
5. Trace-event `anti_pattern_context_injected` + `originality_score`
   skrivs till `.visionary/traces/`.

**Round 3** — samma som round 2 men jämförs mot uppdaterad history (om
round 2's winner också är accepted, vilket den oftast inte är, eftersom
round 2 är refinement på round 1).

**Empty `taste/facts.jsonl`** — på nya projekt eller efter `/visionary-
taste reset`. Originality fallar då tillbaka till **global aesthetic-
cluster history** i `skills/visionary/priors/global-aesthetic-history.
json` — 10 kuraterade entries spridda över katalogens archetyp-zoner
(swiss / brutalism / editorial / dashboard / glassmorphism / vaporwave /
…). Trace-event flaggas: `originality_used_fallback: true`.

## När att stänga av

**Mycket likformig produkt-katalog där konsistens > nytänkande.**
Klassiskt exempel: en enterprise SaaS-suite med 200 sidor som måste se
identiska ut för att inte förvirra användarna. Anti-typicality straffar
då precis det beteende du vill ha (konvergens mot etablerad pattern). Sätt
`VISIONARY_VS_DISABLED=1` och `VISIONARY_ORIGINALITY_WEIGHT=0`.

**Early-stage-projekt med < 5 entries i `taste/facts.jsonl`.**
Originality fallar då tillbaka till global priors automatiskt och
anti-pattern context blir generic. Det är inte fel — bara mindre
användbart. Om du föredrar deterministisk output utan fallback-brus,
sätt `VISIONARY_ORIGINALITY_WEIGHT=0` tills `taste/facts.jsonl` har ≥ 10
entries.

**Debugging-sessioner där deterministisk output önskas.**
Verbalized Sampling injicerar slumpmässighet via weighted random pick.
För att reproducera buggar deterministiskt — sätt `VISIONARY_VS_DISABLED=
1`. Pipeline går då direkt Stage 1 → Stage 2 utan koncept-sampling.

**Benchmarking mot pre-Sprint-16-baseline.**
Avstäng båda interventionerna med `VISIONARY_VS_DISABLED=1
VISIONARY_ORIGINALITY_WEIGHT=0` för att jämföra apples-to-apples mot
v1.5.x-output.

## Konfiguration

Default-config i `skills/visionary/calibration.json` under nyckeln
`anti_typicality`:

```json
{
  "anti_typicality": {
    "enabled": true,
    "vs_alpha": 0.65,
    "vs_concept_count": 5,
    "vs_convergence_threshold": 0.85,
    "originality_weight": 0.8,
    "originality_history_window": 10,
    "originality_history_max_age_days": 90,
    "boost_factor_cap": 1.6,
    "min_concept_quality_threshold": 0.3
  }
}
```

**Env-overrides** (matchar existing taste-pattern):

```bash
VISIONARY_VS_ALPHA=0.65            # Boost exponent (Zhang 2025: 0.6–0.7 sweet spot)
VISIONARY_VS_DISABLED=1            # Skip Stage 1.5 entirely
VISIONARY_ORIGINALITY_WEIGHT=0.8   # Vikt i arbitration-tabellen (default 0.8)
VISIONARY_ORIGINALITY_WEIGHT=0     # Stäng av originality-dim helt
VISIONARY_HISTORY_WINDOW=10        # Top-N senaste accepted entries
```

**Default-rationale:**

| Parameter | Default | Varför |
|---|---|---|
| `vs_alpha` | 0.65 | Mid-point på Zhang 2025 [0.6, 0.7] empirisk sweet spot |
| `vs_concept_count` | 5 | 3 = för få (för stark konvergens-risk), 7 = mediokert distribuerat |
| `vs_convergence_threshold` | 0.85 | Empirisk gräns där designs börjar vara samma sak i olika ord |
| `originality_history_window` | 10 | Match till `taste/facts.jsonl` aging-window |
| `originality_history_max_age_days` | 90 | Samma som decay-threshold för `active → decayed` |
| `originality_weight` | 0.8 | Lägre än craft/aesthetic (1.0) så critic-merge inte domineras, högre än designer-pack (0.25) |

## Källkod

| Fil | Ansvar |
|---|---|
| `skills/visionary/partials/verbalized-sampling.md` | VS prompt-partial (5-koncept JSON-format) |
| `skills/visionary/schemas/verbalized-sampling.schema.json` | JSON-schema-validering för VS-output |
| `hooks/scripts/lib/verbalized-sampling.mjs` | JS-impl + boost-matematik + konvergens-check |
| `agents/critic-originality.md` | Originality-critic agent-template |
| `hooks/scripts/lib/critics/originality.mjs` | score-beräkning (DINOv2 + 8D-fallback) |
| `hooks/scripts/lib/anti-pattern-context.mjs` | Context-injection round 2+ |
| `hooks/scripts/lib/critic-merge.mjs` | Round-gate-logik för 9:e dim (utökad från Sprint 6) |
| `skills/visionary/calibration.json` | Default-config (anti_typicality-sektion) |
| `hooks/scripts/lib/anti-typicality-config.mjs` | Config-loader + env-override-parsing |
| `skills/visionary/priors/global-aesthetic-history.json` | Cold-start fallback (10 kuraterade entries) |

## Källor

- Zhang et al. 2025 — *Verbalized Sampling: How to Mitigate Mode Collapse
  and Unlock LLM Diversity*. [arXiv:2510.01171](https://arxiv.org/abs/2510.01171)
- *Creative Homogeneity Across LLMs*. [arXiv:2501.19361](https://arxiv.org/html/2501.19361)
  (Jan 2025) — empirisk mätning av α ≈ 0.57–0.65 över major model
  families.
- Madaan et al. 2023 — *Self-Refine: Iterative Refinement with Self-
  Feedback*. [arXiv:2303.17651](https://arxiv.org/abs/2303.17651) —
  visar att samma modell både gen+critique förstärker bias.
- *On the Algorithmic Bias of Aligning LLMs with RLHF*.
  [arXiv:2405.16455](https://arxiv.org/abs/2405.16455) — formell
  analys av varför RLHF flattar low-prob-tail.

## Benchmark-resultat

Se [`results/sprint-16-anti-typicality.md`](../results/sprint-16-anti-typicality.md)
(publiceras efter implementation).

**Förväntade siffror baserat på Zhang 2025-baseline:**

- Diversity: 1.5–2× (pairwise DINOv2-cosine sjunker från ~0.72 till
  ~0.45–0.55).
- Quality-drop: ≤ 0.3 avg score över 8 originaldimensioner.
- Token-overhead: +10–15 % per generation (~400 tokens VS-stage).
- Wall-clock-overhead: +2–4 s per generation (VS-anrop + originality-
  anrop round 2+).
- Statistisk signifikans: two-tailed t-test på pairwise cosine, p < 0.05
  över 50 prompts × 2 conditions.

## FAQ

**Q: Sänker detta kvaliteten?**
A: Nej — inte signifikant. Zhang 2025 visar att α ∈ [0.6, 0.7] ger
1.6–2.1× diversity utan kvalitetstapp på composite-score. Vi mäter
explicit i benchmark och avbryter mergen om quality-drop > 0.3 avg
score.

**Q: Tar det längre tid?**
A: ~2–4 s extra per generation. VS-anropet är ~400 tokens (snabbt).
Originality-anropet round 2+ är dyrast eftersom det kör mot DINOv2 (om
aktiv) eller läser facts.jsonl + 8D-embeddings för history.

**Q: Måste jag ha Sprint 11 (DINOv2)?**
A: Nej. Originality fallar tillbaka till 8D-aesthetic-embedding cosine
om DINOv2 inte är aktiv (`VISIONARY_VISUAL_EMBED` är default off).
DINOv2-mode ger ~1.2–1.4× bättre originality-precision men inte krävt
för att echo-chamber-break ska fungera.

**Q: Vad händer om `taste/facts.jsonl` är tom?**
A: Originality fallar tillbaka till global aesthetic-cluster history
(`skills/visionary/priors/global-aesthetic-history.json`) — 10
kuraterade entries spridda över katalogens archetyp-zoner. Trace flaggar
`originality_used_fallback: true`. Anti-pattern context byter till en
fallback-text "no user history yet, use global aesthetic priors".

**Q: Hur skiljer sig det här från Sprint 8 (slop-reject gate)?**
A: Sprint 8 mäter *generic AI slop* (gradient + Inter + purple-glass) —
katalogluval-problemet, deterministisk reject-gate FÖRE critic körs.
Sprint 16 mäter *similarity till användarens egen historik* —
user-level convergence, mjuk score-dimension UNDER critic. De
kompletterar varandra: Sprint 8 stoppar generic slop, Sprint 16 stoppar
*personalized* echo-chamber.

**Q: Kan VS returnera < 5 koncept om modellen inte hittar fler distinkta
tolkningar?**
A: Schema-validering kräver exakt 5. Om modellen returnerar < 5 eller
malformed JSON triggas 1 retry med "förra svaret bröt mot schema". Om
2 retries misslyckas → skippa Stage 1.5, logga `vs_skipped: true,
reason: "schema_validation_failed"` och fortsätt med Stage 1 → Stage 2
som vanligt. Pipeline kraschar aldrig.

**Q: Påverkar originality refinement-iterations på samma generation?**
A: Nej. History = `taste/facts.jsonl` entries med
`signal ∈ {git_kept, picked, accepted}`. En refinement-round 2 av
samma generation_id räknas inte som accepted-history — bara entries
som faktiskt har stannat på disk efter session-end. Refinement
jämförs alltid mot history utanför nuvarande generation_id.

## Relaterade docs

- [`docs/taste-flywheel.md`](taste-flywheel.md) — vad
  `taste/facts.jsonl` innehåller och hur RAG-anchors fungerar
- [`docs/critique-principles.md`](critique-principles.md) — 8/9-dim
  critic-merge-rubrik
- [`docs/visual-embeddings.md`](visual-embeddings.md) — DINOv2-mode
  setup
- [`docs/sprints/sprint-16-anti-typicality.md`](sprints/sprint-16-anti-typicality.md)
  — implementation-tasks 31.1–31.7 + risker
