# Sprint 15 — Taste Inheritance: designer-as-subagent i arbitration-tabellen

**Vecka:** 27–28
**Fas:** 9 — Taste-personalisering (ny fas)
**Items:** 30 från roadmap (ny)
**Mål:** Uppgradera designer-packs (Rams, Kowalski, Vignelli, Scher, Greiman) från ren prompt-bias → embedded sub-agent som faktiskt argumenterar i arbitration-tabellen. Idag injicerar `/designer rams` några "less-but-better"-direktiv i generation-prompten — sedan är Dieters röst osynlig under critique. Med Taste Inheritance får designer-rösten en egen rad i arbitration-tabellen och kan motsätta sig craft- eller aesthetic-critic per dimension. Bygger direkt på multi-critic-arkitekturen från Sprint 6.

Wild idea från forskningen: designers blir co-authors, inte styles. Jony's "less, but better" argumenterar mot din "expressive". Resultat: rikare arbitration → bättre taste-konsistens.

## Scope

- Item 30 — Taste Inheritance: designer-pack-schema-utökning, designer-as-subagent-anrop, ny arbitration-row, conflict-resolution-logik, trace-events, uppdatering av 5 existing designer-packs.

## Pre-flight checklist

- [ ] Sprint 6 mergad — multi-critic + arbitration-table stable
- [ ] Sprint 12 — MLLM Judge tillgänglig (kan användas för conflict-resolution)
- [ ] 5 existing designer-packs är committed (`skills/visionary/designers/{rams,kowalski,vignelli,scher,greiman}.md`)
- [ ] Feature-branch: `feat/sprint-15-taste-inheritance`

---

## Task 30.1 — Designer-pack-schema utökas [M]

**Fil:** `skills/visionary/designers/_schema.md` (ny), uppdatera 5 existing packs

**Nuvarande pack:**
```yaml
---
id: rams
name: Dieter Rams
philosophy: "Less, but better"
prompt_bias:
  - prefer minimal forms
  - functional honesty over decoration
---
[free-text manifest]
```

**Ny pack-struktur:**
```yaml
---
id: rams
name: Dieter Rams
philosophy: "Less, but better"

prompt_bias:
  - prefer minimal forms
  - functional honesty over decoration

# NEW: critic-persona för embedded sub-agent
critic_persona:
  role: "design auditor in the spirit of Dieter Rams"
  scoring_priorities:
    - { dim: distinctiveness, weight: 0.5, direction: "prefer subtle distinction over loud" }
    - { dim: typography, weight: 1.0, direction: "neutral" }
    - { dim: hierarchy, weight: 1.5, direction: "demand strict hierarchy" }
    - { dim: contrast, weight: 1.2, direction: "prefer high APCA Lc" }
  veto_conditions:
    - "ornament without function"
    - "decoration that obscures content"
  argument_style: "concise, evidence-anchored, avoids superlatives"

# NEW: arbitration-influence
arbitration:
  weight_in_table: 0.25  # mot 1.0 för craft + 1.0 för aesthetic
  can_veto: false  # vetorätt opt-in per pack
---
```

**Steg:**
1. Skriv schema-doc.
2. Uppdatera alla 5 packs med `critic_persona` + `arbitration`-block.
3. Vetorätt: konservativt — ingen designer har veto i v1, kan upgrade till veto i v2.

**AC:**
- 5 packs har komplett schema
- YAML validerar mot ny struktur
- Backwards-compat: gamla packs utan `critic_persona` faller tillbaka till bara prompt-bias

---

## Task 30.2 — Designer-as-subagent anrop [L]

**Fil:** `agents/designer-critic.md` (ny — generic template), `hooks/scripts/lib/critics/designer-critic.mjs`

**Steg:**
1. Generic agent-template `agents/designer-critic.md` accepterar `{designer_pack_yaml}` som param.
2. Anrop-flöde: när `VISIONARY_DESIGNER` är aktiv:
   - Hämta pack från `skills/visionary/designers/<id>.md`.
   - Bygg prompt: `template + pack.critic_persona + screenshot + dim-rubrics`.
   - Anropa Claude Sonnet (medvetet billigare modell — designer-perspektivet ska vara snabbt).
   - Output: per-dim score + rationale (samma format som existing critics).
3. Cache: per session, samma render → reuse designer-output (designer-perspektivet är deterministiskt baserat på render).

**AC:**
- Test: rams-pack på minimal Card → score-pattern matchar pack-priorities (high hierarchy/contrast, lower distinctiveness)
- Test: greiman-pack på samma Card → motsatt pattern (high distinctiveness, lower formal hierarchy)
- Anropet återanvänder existing screenshot (inga extra Playwright-pass)

---

## Task 30.3 — Arbitration-tabell-utökning [M]

**Fil:** `hooks/scripts/lib/critic-merge.mjs` (Sprint 6-modul, utöka)

**Nuvarande tabell:**
| Dimension | Craft-critic | Aesthetic-critic | Merged |
|---|---|---|---|
| hierarchy | 7 | 8 | 7.5 |
| ... | ... | ... | ... |

**Ny tabell när designer aktiv:**
| Dimension | Craft | Aesthetic | Designer (rams) | Merged | Conflict |
|---|---|---|---|---|---|
| hierarchy | 7 | 8 | 9 | 7.9 | none |
| distinctiveness | 8 | 9 | 5 | 7.4 | yes |

**Merge-formel:**
- Default: viktat medelvärde med weights `craft=1.0, aesthetic=1.0, designer=pack.arbitration.weight_in_table` (default 0.25).
- Conflict: max-min-spread > 2.5 → flagga för conflict-resolution (Task 30.4).
- Veto: om `pack.arbitration.can_veto = true` AND designer-score ≤ 3 → automatisk regen.

**AC:**
- Test: 3 critics agree → merged = avg
- Test: designer säger 5, andra 9 → merged ≈ 7.4 (rätt vikt), conflict flag = yes
- Test: pack utan critic_persona → designer-row utelämnas (backwards-compat)

---

## Task 30.4 — Conflict-resolution-logik [L]

**Fil:** `hooks/scripts/lib/critics/conflict-resolve.mjs` (ny)

**Vad det gör:** När arbitration-tabellen visar konflikt (max-min > 2.5 i en dim) kan vi inte bara medel-aggregera — det skulle minska signal-kvalitet. Tre vägar:

**Strategi A — Designer-as-tie-breaker (default):**
- Om bara craft vs aesthetic är oense och de är ~jämbördiga: designer-row är tie-breaker.

**Strategi B — MLLM Judge invoked (om Sprint 12 aktiv):**
- Konflikt mellan ≥ 2 critics → invoke `mllm-judge` för dim.
- Judge-output väger som extra critic-row.

**Strategi C — Användar-eskalering:**
- Om både A och B inte löser: rapportera "unresolvable conflict" till critic-output, låt user explicit välja.

**Steg:**
1. Implementera 3-strategi-pipeline.
2. Trace-event per strategi: `conflict_resolved` med method.
3. Default order: A → B → C.

**AC:**
- Test: A löser 70 %+ av konflikter
- Test: B kicks in när A otillräcklig + judge-flag aktiv
- Test: C bubblar upp till user när A+B fail

---

## Task 30.5 — Trace-events [S]

**Fil:** `skills/visionary/schemas/trace-entry.schema.json`

Nya events:
- `designer_critic_invoked` — payload: `{designer_id, dims_scored: [...]}`
- `designer_score` — payload: `{dim, score, rationale_hash}`
- `arbitration_conflict` — payload: `{dim, scores_per_critic, max_min_spread}`
- `conflict_resolved` — payload: `{dim, method: "tie_break"|"mllm_judge"|"user_escalation", final_score}`

**AC:**
- Schema validerar
- Events loggas i full flow

---

## Task 30.6 — Uppdatera 5 existing designer-packs [M]

**Filer:** `skills/visionary/designers/{rams,kowalski,vignelli,scher,greiman}.md`

**För varje pack — fyll i `critic_persona`:**

**Rams:**
- Priorities: hierarchy 1.5, contrast 1.2, distinctiveness 0.5, typography 1.0
- Veto: ornament without function

**Kowalski (Polish poster):**
- Priorities: distinctiveness 1.5, narrative arc 1.4, contrast 1.0, hierarchy 0.7
- Veto: SaaS template-uniformity

**Vignelli (Modernist):**
- Priorities: typography 1.6, hierarchy 1.4, motion 0.5, distinctiveness 0.8
- Veto: arbitrary type-mixing

**Scher (Pentagram):**
- Priorities: typography 1.4, distinctiveness 1.3, contrast 1.0
- Veto: timid scale (small body type, decorative-only display)

**Greiman (New Wave):**
- Priorities: distinctiveness 1.6, typography 1.2, narrative_arc 1.0
- Veto: grid-prison (5 stiff columns, equal whitespace)

**Steg:**
1. Skriv `critic_persona`-block per pack.
2. Lägg till 3–5 dimensions-specifika rubric-anchors per pack (för designer-prompt).
3. Veto-conditions konkretiseras med detekterbara mönster (för möjlig framtida automation).

**AC:**
- Alla 5 packs uppdaterade
- Rubric-anchors per pack verkar konsistenta med designerns offentliga arbete (manuell review)
- 5 unit-tests, en per pack, kör designer-critic på ett kanoniskt sample

---

## Task 30.7 — Tester [M]

**Fil:** `hooks/scripts/lib/critics/__tests__/*.test.mjs`

**Coverage:**
- Designer-critic-anrop: alla 5 packs
- Arbitration-tabell merge med 3 critics
- Conflict-resolution: alla 3 strategier
- Backwards-compat: gammal pack-format
- Trace-events emitteras korrekt

**AC:**
- `node --test` grön
- Coverage ≥ 80 % på `lib/critics/`

---

## Task 30.8 — Dokumentation [S]

**Fil:** `docs/taste-inheritance.md` (ny), uppdatera `docs/taste-flywheel.md`

**Innehåll:**
- Konceptet: designer som co-author, inte style
- Hur 5 packs skiljer sig i critic-perspektiv (jämförelsetabell)
- Hur man bygger en ny designer-pack (community-PR-flöde)
- Hur konfliktresolution fungerar
- Arbitration-tabell-exempel (samma komponent, olika designer-packs → olika utfall)

**AC:**
- Doc reviewed
- Jämförelsetabell gör packs distinkta för läsaren

---

## Benchmark-verifiering

**Fil:** `results/sprint-15-taste-inheritance.md`

**Mätningar:**
- 25 prompts × 5 packs = 125 generations
- Per pack: rapportera per-dim score-distribution
- Verifiera att packs PRODUCERAR olika output-pattern (om alla packs ger samma score-pattern → designer-rösten har ingen effekt)
- Conflict-rate per pack-kombination
- Wall-clock-tid (förvänta +6–12 s per critique med designer aktiv)

**AC:**
- Rapport publicerad
- Pack-distinguishability demonstrerad: minst 2 dims med ≥ 1.5 spridning per pack

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Designer-pack:s rubric-anchors stereotypifierar designerns arbete | Medel | Medel | Manuell expert-review per pack; community-PR välkommen för korrigeringar |
| Arbitration-konflikt blir så vanlig att critic-tid skenar | Medel | Hög | Default vikter konservativa; conflict-rate-budget per session (max 5 → fall tillbaka till simple merge) |
| Designer-as-subagent dubbar critic-cost | Hög | Medel | Använd Sonnet (inte Opus) för designer; cache per render |
| Konflikt mellan packs när användaren stackar (`/designer rams+greiman`) | Hög | Låg | v1: en designer åt gången; multi-pack är v2-feature |
| Backwards-compat bryter med gamla pack-format | Låg | Hög | Schema-fallback obligatorisk; test för gammal pack-format |

---

## Definition of Done

- [ ] Alla tasks (30.1–30.8) klara
- [ ] 5 designer-packs har `critic_persona` + `arbitration`
- [ ] Arbitration-tabell hanterar 3-critic merge
- [ ] Conflict-resolution-pipeline kör 3 strategier
- [ ] Trace-events validerade
- [ ] Pack-distinguishability ≥ 1.5 spridning på ≥ 2 dims
- [ ] `results/sprint-15-taste-inheritance.md` publicerad
- [ ] Mergad till `main`

## Amendments

_Tomt._
