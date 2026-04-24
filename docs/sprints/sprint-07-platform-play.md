# Sprint 07 — Platform play: .taste dotfiles + Content kits

**Vecka:** 11–12
**Fas:** 3 — Moat-building
**Items:** 20, 21 från roadmap
**Mål:** Gör Visionary till en platform — taste-profiler delas som dotfiles, content-kits gör att generationer klarar riktigt data i riktiga shapes. Ingen konkurrent löser dessa två saker ihop.

## Scope

- Item 20 — Exporterbara `.taste` dotfiles + `visionary taste export/import`
- Item 21 — Content kits: `/visionary-kit` med sample-data + constraints → ny "content resilience"-dimension i kritiken, auto-härledning från TS-types / Prisma-schema

## Pre-flight checklist

- [ ] Sprint 6 mergad — RAG + multi-agent + traces live
- [ ] Minst 3 `.taste` kandidater att testa export/import med (från intern dev-team)
- [ ] Feature-branch: `feat/sprint-07-platform`

---

## Task 20.1 — `.taste` fil-format [M]

**Fil:** `docs/taste-dotfile-spec.md` (ny)

**Format:** TOML (läsbar, commitable, diffar bra) med struktur:

```toml
# my-taste.taste
schema_version = "1.0.0"
author = "Pawel K."
handle = "pawelk-2026-04"
inherits_from = []  # kan arva från annan taste-fil (designer-pack)
description = "Editorial-forward, Bauhaus-adjacent, motion-restrained"

[metadata]
created_at = "2026-04-22T10:00:00Z"
generations_represented = 47
components_kept_in_git = 38
rejection_signals = 12

[preferences]
# Föredra dessa styles
prefer_styles = [
  { id = "swiss-muller-brockmann", confidence = 0.85 },
  { id = "bauhaus-dessau", confidence = 0.78 },
  { id = "editorial-serif-revival", confidence = 0.72 },
]

avoid_styles = [
  { id = "fintech-trust", confidence = 0.95, reason = "too generic" },
  { id = "glassmorphism", confidence = 0.88 },
]

prefer_palette_tags = ["neutral", "accent-saturated", "warm-paper"]
avoid_palette_tags = ["dark-gradient", "neon"]

prefer_motion_tiers = ["Subtle", "Expressive"]
avoid_motion_tiers = ["Kinetic"]

[typography]
preferred_families = ["editorial-serif", "grotesk-modern"]
preferred_scale_ratio = 1.25

[pairs]
# Utvalda pairwise-picks som demonstrerar taste (FSPO-exempel)
# Format: { chosen = "...", rejected = [...], context = "..." }
examples = [
  { chosen = "bauhaus-dessau", rejected = ["fintech-trust","saas-b2b-dashboard"], context = "fintech landing" },
  { chosen = "editorial-serif-revival", rejected = ["glassmorphism","claymorphism"], context = "blog" },
]

[constitution]
# Fri-text principer som injeceras i kritikern
principles = """
Negative space is typography's punctuation. Never fill a margin because
it's empty. A 2-column grid is more sophisticated than a 3-column grid
unless you have 300+ data points.
"""

[privacy]
# Vad exporten SKA ignorera för integritet
scrub_fields = ["brief_summary", "project_names", "screenshots"]
```

**AC:**
- Spec publicerad
- Sample-filer `docs/sprints/artifacts/example-*.taste` (3 st)

---

## Task 20.2 — `visionary taste export` [M]

**Fil:** `commands/visionary-taste.md` + runtime

**Flöde:**
```
1. Ladda taste/facts.jsonl + taste/pairs.jsonl + taste/accepted-examples.jsonl
2. Aggregera till preferences-struktur:
   - prefer_styles: from facts where direction=prefer, flag active/permanent, grouped by target_type=style_id
   - avoid_styles: motsvarande
   - Embeddings uppdateras ej (embedder kan variera; import-sidan regenererar)
3. Extract FSPO pairs (top-8 diverse)
4. Privacy-scrub: remove brief_summary, project-specific strings
5. Skriv TOML-fil till angiven path eller stdout

node scripts/visionary-taste-export.mjs \
  --handle pawelk-2026-04 \
  --out my-taste.taste \
  [--include-screenshots]  // default off för privacy
```

**Steg:**
1. Skriv `scripts/visionary-taste-export.mjs`
2. TOML-serializer (lättvikts lib eller handskrivet)
3. Validera mot schema innan write

**AC:**
- Export + re-import är idempotent (round-trip förlorar ingen info förutom scrubbed-fält)
- Privacy-scrubber confirmed: inga project-names i exporterad output

---

## Task 20.3 — `visionary taste import` [M]

**Fil:** `scripts/visionary-taste-import.mjs` (ny)

**Flöde:**
```
1. Ladda .taste-fil + validera schema
2. Om inherits_from angivet: rekursivt importera parent-filer (cykeldetekt)
3. Merge med existerande taste/facts.jsonl:
   - Befintliga user-facts prioriteras alltid över imported (användarens lokala drift vinner)
   - Imported facts får confidence * 0.6 (de är "startpunkt", inte absolut)
4. FSPO pairs appenderas till pairs.jsonl
5. Emit summary: "Imported 12 preferences, 8 avoids, 8 pairs from pawelk-2026-04. 2 conflicts resolved in favor of local."
```

**Kommandon:**
```bash
# Importera från fil
visionary taste import ./my-taste.taste

# Importera från URL (för public gists)
visionary taste import https://raw.githubusercontent.com/user/repo/main/my-taste.taste

# Dry-run för att se vad som skulle hända
visionary taste import --dry-run ./my-taste.taste
```

**AC:**
- Fresh project: import → facts.jsonl innehåller 20+ entries
- Existing project: conflict resolution korrekt
- URL-import har size-limit (50 KB) och domain-allowlist (github.com/gist.github.com default)

---

## Task 20.4 — Designer-pack-migration [S]

**Fil:** `designers/` katalog (existerande)

**Steg:**
1. Re-emit existing designer-packs (Rams, Kowalski, Vignelli, Scher, Greiman) som `.taste`-filer
2. Dessa blir referens-exempel + inherits_from-bas för user taste-files
3. Dokumentera i README hur man skapar egna packs

**AC:**
- 5 `.taste`-filer i `designers/`
- `inherits_from = ["rams"]` fungerar i import-flödet

---

## Task 20.5 — Shareable taste-index [M]

**Fil:** `docs/taste-index.md` (ny) + community-repo

**Koncept:**
- Visionary hostar (eller pekar mot) ett community-repo `visionary-tastes/`
- Designers PR:ar sina `.taste`-filer dit
- `visionary taste browse` listar tillgängliga
- `visionary taste import <handle>` hämtar från repo direkt

**Steg:**
1. Sätt upp `visionary-tastes`-repo-skelett (separat repo)
2. `visionary taste browse` hämtar index.json från repo
3. Validering: varje inskickad `.taste` måste passera schema + inga embedded secrets
4. Initial seed: 5 designer-packs

**AC:**
- `visionary taste browse` listar alla taste-filer i community-repo
- Import-flödet fungerar med handle-kortform

**OBS:** Detta är den långsiktiga platform-playen. Lansera MVP i Sprint 7 — community-byggande pågår över månader.

---

## Task 21.1 — `/visionary-kit` command spec [M]

**Fil:** `commands/visionary-kit.md` (ny)

**Användning:**
```
/visionary-kit init        # skapa kit.json template i projektrot
/visionary-kit preview     # visa aktuell kit
/visionary-kit auto-infer  # försök härleda från codebase (TS types, Prisma schema, OpenAPI)
/visionary-kit validate    # check schema + content realism
```

**`visionary-kit.json` schema (ny):**
```json
{
  "$schema": "https://example.com/visionary-kit.schema.json",
  "entities": {
    "User": {
      "sample": [{"id":"u_1","name":"Kirsti Hagberg","email":"kirsti.hagberg@example.se","avatar_url":null}],
      "constraints": {
        "name": { "p95_length": 28, "may_contain_diacritics": true, "may_contain_apostrophe": true },
        "avatar_url": { "nullable": true, "null_rate": 0.22 }
      }
    },
    "Invoice": {
      "sample": [ ... ],
      "constraints": { "amount": { "min": 0, "p95": 1000000, "currency_suffix": "SEK" } }
    }
  },
  "component_constraints": {
    "table": { "min_rows": 0, "p95_rows": 47, "max_rows": 500 },
    "list": { "empty_rate": 0.18 },
    "card_grid": { "p95_cols": 4 }
  },
  "required_states": ["loading", "empty", "error", "populated"]
}
```

**AC:**
- Kommandot implementerat med 4 subkommandon
- Schema + example-fil

---

## Task 21.2 — Auto-inference från TS-types [L]

**Fil:** `scripts/infer-kit-from-ts.mjs` (ny)

**Flöde:**
```
1. Läs tsconfig.json, hitta entry types
2. För varje exported interface/type: extrahera fält + typer
3. Generate samples:
   - string → Faker-like syntax om field name matchar mönster (name, email, url, phone)
   - string med diakritiska-hint → Swedish/German/French sampler
   - number → reasonable range baserat på name (price, count, age, percent)
   - boolean → 50/50
   - arrays → p95-sized samples
4. Skriv till visionary-kit.json
5. Låt user redigera innan commit
```

**Libs:** `ts-morph` för AST-parsing, eller `typescript` compiler API direkt.

**AC:**
- Test på fixture TS-projekt (schema med 5 types) → genererar kit.json med alla 5
- Svenska namn/adresser när lang=sv detekteras

---

## Task 21.3 — Auto-inference från Prisma-schema [M]

**Fil:** `scripts/infer-kit-from-prisma.mjs` (ny)

**Flöde:**
```
1. Läs prisma/schema.prisma
2. Parsa models + relations
3. Använd @default()-annotations om finns
4. Generate samples via samma logik som TS-variant
5. Respektera relations (User.posts → 3 samples Post per User)
```

**AC:**
- Fixture prisma-schema → valid kit.json

---

## Task 21.4 — Auto-inference från OpenAPI [S]

**Fil:** `scripts/infer-kit-from-openapi.mjs` (ny)

**Flöde:**
```
1. Läs openapi.yaml / swagger.json
2. Extrahera components.schemas
3. Konvertera JSON Schema till samples (json-schema-faker-stil, inline)
```

**AC:**
- Fixture openapi → valid kit.json

---

## Task 21.5 — Content-resilience 10:e dimension [L]

**Filer:**
- `agents/visual-critic-craft.md` (uppdatera från Sprint 6)
- `benchmark/scorers/content-resilience-scorer.mjs` (ny)
- `hooks/scripts/capture-and-critique.mjs`

**Flöde:**
```
1. Om visionary-kit.json finns i projekt: ladda
2. Efter generation: Playwright renders komponenten 3 gånger med olika content:
   - p50 content (median case)
   - p95 content (realistic worst case)
   - empty state (0 items)
3. Scorer bedömer:
   - Håller layouten ihop vid p95? (bbox-overflow detection)
   - Existerar empty state med användbart innehåll? (detect placeholder-text, illustration, CTA)
   - Håller sig kontrast + typografi? (re-run numerisk scorer × 3)
4. Compositit: content_resilience = 0.4 * layout_holds + 0.4 * empty_state_quality + 0.2 * typography_robustness
5. Lägg till som 10:e dimension i critique-output
```

**AC:**
- Fixture: komponent med hårdkodad `<h1>Jane Doe</h1>` → content_resilience ≤ 5
- Fixture: komponent med `{user.name}` + korrekt truncation → content_resilience ≥ 8
- Empty state-detection fungerar (saknar = score 0 på den delkomponenten)

---

## Task 21.6 — Kit-integration i generator-prompt [M]

**Fil:** `skills/visionary/context-inference.md` + runtime

**Ändring:**
```
Om kit.json finns:
  Inkludera i systemprompten till genereraren:

  "This project has a content kit. Your component MUST render correctly
  given the following data shapes:

  <inline kit excerpt>

  Required states: loading, empty, error, populated.
  p95 name length: 28 chars — apply truncation logic.
  p95 rows: 47 — design density accordingly.

  Do NOT use lorem ipsum. Do NOT invent 'Jane Doe' users. Generate against
  the provided sample data shape."
```

**AC:**
- Generated components använder kit-data i mockup-renders
- "jane doe / john smith"-detection i slop-scanner (ny pattern #32: fake generic names when kit present)

---

## Task 21.7 — Dokumentation + end-to-end-exempel [M]

**Fil:** `docs/content-kits.md` (ny)

**Innehåll:**
- Varför kits (konceptuell motivering — pekar på Figma Make för precedent)
- Snabbstart: TS-autoinfer → manual edit → first generation
- Full exempel: Prisma schema för e-handel → kit → generated product-card som klarar 50-tecken produktnamn
- FAQ: "my name is 'Å. Sköld', will it break?" (svar: nej, diakritiska hanteras)

**AC:**
- Komplett guide publicerad
- Linkad från README

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Auto-inference fel → genererar samples som inte matchar verkligheten | Hög | Medium | `validate`-kommando + explicit manual-edit-step före commit |
| .taste-format konflikter mellan versioner | Medium | Medium | schema_version + migration-logic |
| Privacy-läcka via export (t.ex. project-name i fact.evidence) | Hög | Hög | Hård scrub-whitelist; test-fixture för att verifiera |
| Kit-generation 3× renders → 3× kostnad | Medium | Medium | Enbart vid explicit `--content-check` flagga, opt-in |
| Community-repo för tastes saknar aktivitet | Hög | Low | Startbas = 5 designer-packs; acceptera att detta tar månader |

## Definition of Done

- [ ] Alla tasks klara
- [ ] `.taste` export+import fungerar, privacy-scrub verifierat
- [ ] 5 designer-packs som `.taste`-filer committade i `designers/`
- [ ] Auto-inference fungerar för TS, Prisma, OpenAPI på fixture-projekt
- [ ] Content-resilience 10:e dimension integrerad och calibrerad
- [ ] Benchmark-score ≥ 19.3/20 (mål för Fas 3)
- [ ] End-to-end smoke-test: `visionary taste import pawelk + kit.json + /visionary` → generated component respektar både taste + kit
- [ ] `results/sprint-07-comparison.md` publicerad
- [ ] Merged till `main`
- [ ] v1.4.0 release-candidate tagged

## Amendments

_Tomt._

---

## Efter Sprint 7: release + retro

Planera separat 1-vecka retro+release-sprint:
- Publicera `v1.4.0` till marketplace
- Blogpost eller release notes som sammanfattar 12-veckors roadmap med benchmark-deltas
- Öppna issues för Sprint 8+-arbete (GEPA-evolution, ytterligare 2027-primitiver, m.m.)
