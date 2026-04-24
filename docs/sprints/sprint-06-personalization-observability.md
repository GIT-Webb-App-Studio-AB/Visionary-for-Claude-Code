# Sprint 06 — DesignPref RAG + multi-agent critic + trace logging

**Vecka:** 9–10
**Fas:** 3 — Moat-building
**Items:** 17, 18, 19 från roadmap
**Mål:** Kritiken ska kalibreras mot användarens faktiska accepterade output, inte bara generiska principer. Spelet blir smartare varje generation.

## Scope

- Item 17 — DesignPref RAG: `accepted-examples.jsonl` med brief-embeddings, top-k=3 retrieval till kritikern
- Item 18 — Multi-Agent Reflexion: split `visual-critic` i `critic-craft` + `critic-aesthetic`
- Item 19 — Trace logging i `.visionary/traces/*.jsonl` + `scripts/visionary-stats`

## Pre-flight checklist

- [ ] Sprint 5 mergad — facts.jsonl + pairs.jsonl + git-harvest live
- [ ] Minst 10 ackumulerade sessions data från test-användare för meningsfull RAG
- [ ] Feature-branch: `feat/sprint-06-rag-multiagent-traces`

---

## Task 17.1 — `taste/accepted-examples.jsonl` schema [S]

**Fil:** `skills/visionary/schemas/accepted-example.schema.json` (ny)

**Schema:**
```json
{
  "type": "object",
  "required": ["id", "brief_summary", "brief_embedding", "style_id", "final_scores", "screenshot_path", "accepted_at"],
  "properties": {
    "id": { "type": "string" },
    "brief_summary": { "type": "string", "maxLength": 500 },
    "brief_embedding": { "type": "array", "items": { "type": "number" }, "minItems": 256, "maxItems": 1024 },
    "style_id": { "type": "string" },
    "final_scores": {
      "type": "object",
      "description": "calibrated composite + per-dimension"
    },
    "screenshot_path": { "type": "string" },
    "code_path": { "type": "string" },
    "product_archetype": { "type": "string" },
    "component_type": { "type": "string" },
    "accepted_at": { "type": "string", "format": "date-time" }
  }
}
```

**AC:**
- Schema + exempel publicerade

---

## Task 17.2 — Embed-provider: `taste/lib/embed-brief.mjs` [M]

**Fil:** `hooks/scripts/lib/embed-brief.mjs` (ny)

**Val av embedder:**
- **Primary:** Anthropic-embeddings via API om tillgängligt; annars
- **Fallback lokalt:** `@xenova/transformers` med `all-MiniLM-L6-v2` (ONNX, ~25 MB, offline)

**Steg:**
1. Wrapper som försöker API först, faller till lokal
2. Dim: normalisera till 384 (MiniLM-default) så alla embeddings är kompatibla
3. Cache embeddings per session så samma brief inte embeddas flera gånger

**AC:**
- Embedder fungerar offline (test med mocked network)
- Deterministisk: samma text → samma vektor

---

## Task 17.3 — Lagra accepterade exempel [M]

**Fil:** `hooks/scripts/capture-and-critique.mjs`

**Trigger:** generation avslutas med status ”accepted” (user säger OK eller explicit approval eller critique exits med calibrated composite ≥ 8.0).

**Steg:**
1. Serialisera screenshot till `taste/screenshots/<id>.png`
2. Kör `embed-brief.mjs` mot brief_summary
3. Appenda entry till `accepted-examples.jsonl`
4. Rotation: behåll max 50 entries globally. Om > 50 → ta bort äldsta där `product_archetype` är överrepresenterat

**AC:**
- Efter 3 accepted generations: 3 entries i filen
- Screenshots finns i rätt path

---

## Task 17.4 — Top-k retrieval i kritiker-prompten [M]

**Fil:** `hooks/scripts/capture-and-critique.mjs`

**Flöde:**
```
1. Innan kritikern anropas: embed current brief
2. Cosine-similarity mot alla lagrade accepted-examples
3. Top-3 (eller färre om färre existerar)
4. Injecta i kritiker-systempromptet som ankare:

   "This user previously rated the following outputs as acceptable for
   similar briefs. Calibrate your scoring to their demonstrated taste:

   Example 1: brief='pricing page for b2b saas' → style='editorial-serif-revival',
              final calibrated composite 8.4/10
              [screenshot attached]
   Example 2: ...

   When scoring the current output, ask: is this output's craft level
   consistent with these accepted examples?"
```

**Steg:**
1. Inkludera screenshot-data i kritiker-anropet (vision-model kan jämföra)
2. Toka-kostnad: välj top-3 inte top-5 pga image-token-vikt
3. Fallback: om < 3 accepted exempel finns → skippa RAG-injection, använd bara principer

**AC:**
- Kritikerns scores korrelerar bättre med users historiska stated-preferences post-RAG (mätbart via Sprint 5 pairs.jsonl)
- Token-kostnad-ökning ≤ 15 % per runda (kompromiss värt det)

---

## Task 17.5 — Cold-start fallback [S]

**Fil:** Dokumentera i `docs/taste-flywheel.md`

**Regel:**
```
Om < 5 accepted-examples för user: använd designer-packs (Rams, Kowalski,
Vignelli, Scher, Greiman) som fallback-ankare. Förklara i kritiker-prompt:
"No personal history yet — using Dieter Rams' design principles as baseline."
```

**AC:**
- Dokumenterat
- Runtime-beteende verifierat (ny user får pack-baserade scores)

---

## Task 18.1 — `agents/critic-craft.md` [M]

**Fil:** `agents/critic-craft.md` (ny — deriverad från nuvarande `visual-critic.md`)

**Rol:**
- Specialist på: Hierarchy, Layout, Typography, Contrast, Accessibility (axe-weighted)
- Ignorerar: Distinctiveness, Brief Conformance, Motion Readiness (de tillhör aesthetic-kritiker)

**Systempromptkärna:**
```
You are CRITIC-CRAFT. You score ONLY the measurable-craft dimensions
(hierarchy, layout, typography, contrast, accessibility).

You do NOT opine on whether the design is "distinctive" or "on-brief"
or "energetically correct." Another critic handles that.

You score by evidence (axe node-IDs, CSS selectors, numeric metrics).
When in doubt, default to 7 and explain what evidence is missing.

Your aesthetic preferences, if any, are IRRELEVANT. Even ugly designs
can score 10 on craft.
```

**AC:**
- Systemprompt kort (≤ 400 tokens) — specialized betyder mindre att läsa
- Kritiker producerar schema-valid output (använder gemensamma schemat, scorar endast sina 5 dimensioner, skickar null på övriga)

---

## Task 18.2 — `agents/critic-aesthetic.md` [M]

**Fil:** `agents/critic-aesthetic.md` (ny)

**Rol:**
- Specialist på: Distinctiveness, Brief Conformance, Motion Readiness
- Ignorerar: craft-dimensions

**Systempromptkärna:**
```
You are CRITIC-AESTHETIC. You score ONLY distinctiveness, brief
conformance, and motion readiness.

You have opinions about what makes a design feel original,
on-theme, and kinetically coherent. You defend taste choices even
when they violate conservative craft norms — unless craft is broken
to the point of illegibility.

Craft dimensions are scored by the other critic — you do NOT touch them.

Cite your evidence via slop-detector hits, palette-token mismatches,
motion-token absences, and distinctiveness-checklist items.
```

**AC:**
- Systemprompt + exempel publicerade

---

## Task 18.3 — Parallell körning + merge [M]

**Fil:** `hooks/scripts/capture-and-critique.mjs`

**Flöde:**
```
1. Anropa BOTH critic-craft and critic-aesthetic parallellt (Promise.all)
2. Merge: varje critic bidrar till sina egna dimensioner
3. top_3_fixes: union från båda med dedupe på dimension+selector_hint
4. Om critics disagrees on overlapping dimension (edge case):
   - Lägg till `arbitration: "critic-craft preferred X, critic-aesthetic preferred Y"` i output
   - Tie-break enligt archetype-regel (t.ex. brutalism → aesthetic vinner, dashboard → craft vinner)
```

**Steg:**
1. Definiera archetype→critic-preference-tabell i `critic-arbitration.json`
2. Merge-logic med konfliktdetektering
3. Metrics: `arbitration_events` per generation

**AC:**
- Parallell körning stabil, ingen dead-lock
- 10-prompt-suite: arbitration events < 1/prompt i genomsnitt
- Token-kostnad ≤ 30 % mer än single-critic (parallellism betalar nästan hela räkningen)

---

## Task 18.4 — Re-calibrate mot nya critics [M]

**Motivering:** Sprint 3 calibration.json är baserad på single-critic. Med split behövs ny calibration.

**Steg:**
1. Kör `scripts/calibrate.mjs` mot gold-set med ny architecture
2. Spara calibration per critic-identity: `calibration.craft.json` och `calibration.aesthetic.json`
3. Applicera rätt kalibrering till rätt critics output innan merge

**AC:**
- Båda calibration-filer genererade, spearman_rho ≥ 0.6 per dimension
- Runtime applicerar rätt kalibrering

---

## Task 19.1 — `.visionary/traces/` schema [S]

**Fil:** `skills/visionary/schemas/trace-entry.schema.json` (ny)

**Schema:**
```json
{
  "type": "object",
  "required": ["session_id", "generation_id", "round", "ts", "event"],
  "properties": {
    "session_id": "string",
    "generation_id": "string",
    "round": { "type": "integer" },
    "ts": { "type": "string", "format": "date-time" },
    "event": {
      "enum": [
        "style_selected", "brief_embedded",
        "critic_craft_output", "critic_aesthetic_output",
        "numeric_scorer_output", "axe_output",
        "fix_candidate_generated", "verifier_picked",
        "patch_applied", "patch_fallback",
        "early_exit", "escalate_reroll",
        "accepted", "rejected"
      ]
    },
    "payload": { "type": "object" }
  }
}
```

**AC:**
- Schema + test fixtures

---

## Task 19.2 — Trace-emitter i alla hooks [M]

**Fil:** `hooks/scripts/lib/trace.mjs` (ny)

**API:**
```js
import { trace } from './lib/trace.mjs'
await trace('critic_craft_output', { scores, top_3_fixes, duration_ms })
```

**Steg:**
1. Centralt append till `.visionary/traces/<session_id>.jsonl`
2. Rotation: max 50 MB per session, komprimera med `.jsonl.gz` när session avslutas
3. Batch-flush för perf (1s eller 100 entries)

**Emittera från:**
- `capture-and-critique.mjs` (alla critique-events)
- `update-taste.mjs` (taste-events)
- `harvest-git-signal.mjs` (harvest-events)
- `claude-headless.mjs`-adapter (api-calls med usage)

**AC:**
- Trace-fil genereras per session
- Unit-test: traces parsas deterministiskt tillbaka

---

## Task 19.3 — `scripts/visionary-stats.mjs` [M]

**Fil:** `scripts/visionary-stats.mjs` (ny)

**Commands:**
```bash
# Rapport över sessioner
node scripts/visionary-stats.mjs --session <id>

# Aggregera trender
node scripts/visionary-stats.mjs --all

# Hitta åter-förekommande fixes (Anthropic-GEPA-style "pre-apply fix X")
node scripts/visionary-stats.mjs --recurring-fixes
```

**Output för `--recurring-fixes`:**
```
Recurring pattern: "hero h1 line-height too tight" detected in 14 of 23 generations
 → suggested calibration: add line-height floor to typography-matrix.md
 → applied fix in 93% of cases: increase line-height to 1.1
 → recommendation: pre-apply this rule before first critique
```

**Steg:**
1. Parsa alla `.jsonl` traces
2. Clustera fixes på `dimension + selector_hint + proposed_fix`-keywords
3. Rapportera patterns som förekommer ≥ 3 gånger inom senaste 30 dagar

**AC:**
- Kör på test-repo med 20 simulerade traces → rapporterar ≥ 2 recurring patterns
- Rapport i markdown-format

---

## Task 19.4 — Pareto frontier persistence [L]

**Motivering:** Steg mot GEPA — behåll topp-kritik-prompts per dimension för evolution.

**Fil:** `.visionary/pareto/frontier.jsonl`

**Schema per entry:**
```json
{
  "id": "...",
  "critic_identity": "craft" | "aesthetic",
  "prompt_hash": "sha256:...",
  "wins_on_dimensions": ["typography", "contrast"],
  "sample_count": 17,
  "spearman_rho_per_dim": {...},
  "added_at": "..."
}
```

**Flöde:**
1. När ny critic-prompt-version kalibreras → check om den beats frontier på någon dimension
2. Om ja → add entry
3. Frontier exklud:eras ingen: en entry behövs per dimension-winner

**Framtida användning (Sprint 7+):** `scripts/gepa-evolve-critique.mjs` mutaterar prompts och rör sig uppåt i frontieren.

**AC:**
- Frontier-fil genererad
- Dokumenterat i `docs/critique-evolution.md`

---

## Task 19.5 — Trace-privacy + rotation [S]

**Fil:** `docs/taste-privacy.md` (uppdatera)

**Regler:**
- Traces lagras lokalt i `.visionary/traces/` (per projekt)
- Komprimeras efter 7 dagar
- Auto-delete efter 90 dagar (kan ändras med `VISIONARY_TRACE_RETENTION_DAYS=`)
- Opt-out: `VISIONARY_NO_TRACES=1`

**AC:**
- Dokumenterat
- Rotation-script kör i SessionStart-hook

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| RAG med för få accepted-examples blir bullrig | Hög | Medium | Cold-start-fallback + minimum-threshold |
| Split critics dubblar token-cost | Hög | Medium | Kortare per-critic-prompts + parallell körning absorberar latency |
| Traces växer obounded på disk | Medium | Medium | Rotation + komprimering + retention-config |
| Arbitration-regler blir godtyckliga | Medium | Low | Logga alla arbitration-events för audit, iterera baserat på data |
| Embedder lägger till startup-tid | Medium | Low | Cache, pre-warm, eller sync-API |

## Definition of Done

- [ ] Alla tasks klara
- [ ] RAG fungerar cold-start + warm-start
- [ ] Multi-agent critic parallell, stable
- [ ] Trace-emission täcker alla critical events
- [ ] `visionary-stats --recurring-fixes` producerar meningsfull output
- [ ] Benchmark-score ≥ 19.1/20
- [ ] Kritiker Spearman ρ vs human panel ≥ 0.75 (Sprint 3 gold-set)
- [ ] `results/sprint-06-comparison.md` publicerad
- [ ] Merged till `main`

## Amendments

_Tomt._
