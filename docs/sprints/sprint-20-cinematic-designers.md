# Sprint 20 — Cinematic Designer Profiles: filmregissörer som taste-anchors

**Vecka:** 32 (parallellt med sprint 19)
**Fas:** 12 — Designer-pack utvidgning (ny fas)
**Items:** 37 från roadmap (ny)
**Beräknad tid:** 2 dagar
**Mål:** Utvidga `/designer`-konceptet (Sprint 15) med 10–15 filmregissör-profiler. Cinematic UI är ett uttalat 2026-trendområde. Wong Kar-wai → smudge-motion + warm symbolic palette. Villeneuve → high-contrast monochrome. Wes Anderson → symmetric pastel + central composition. Tillåter Visionary att tappa film-vokabulär utan att lägga till nya stilar i grundkatalogen.

Wild idea: "designa det som en Wong Kar-wai-film" är en reference som varje creative director förstår. Filmregissörer är kanoniska taste-anchors. Visionary blir det enda UI-verktyget som talar det språket.

## Scope

- Item 37 — Cinematic Designer Profiles: schema-utvidgning för film-regissörer, 12 director-packs, `/visionary-cinematic` command-alias, LUT→CSS-filter mapping, tester och dokumentation.

## Pre-flight checklist

- [ ] Sprint 15 (designer-pack-schema med `critic_persona` + `arbitration`) mergad
- [ ] `designers/_schema.md` finns och är utgångspunkten
- [ ] Feature-branch: `feat/sprint-20-cinematic-designers`

---

## Task 37.1 — Director profile schema [S]

**Fil:** `designers/_director-schema.md` (ny — utvidgar `_schema.md` från sprint 15)

**Vad:** Director-pack följer designer-pack-schemat (sprint 15) men med extra fält för filmkontext:

```yaml
---
id: wong-kar-wai
name: Wong Kar-wai
category: filmmaker          # NEW — distinguishes film from print/UI
era: "1990s-2020s"
cinema_palette:              # NEW — color-grading anchor
  primary: "amber-warm"
  secondary: "neon-symbolic"
  accent: "blood-deep"
motion_signature: "smudge-blur-trail-30deg"   # NEW — signature motion vocabulary
composition: "off-center, dutch-angle, claustrophobic"  # NEW — layout-bias
philosophy: "Memory as smear. Time as fold."
prompt_bias:
  - prefer warm-saturated palettes against cool shadow
  - allow off-center composition with breathing whitespace
  - motion as memory-trail, not transition
critic_persona:
  role: "design auditor in the spirit of Wong Kar-wai"
  scoring_priorities:
    - { dim: motion_coherence, weight: 1.5, direction: "prefer trailing/smudge over snap" }
    - { dim: density, weight: 0.6, direction: "prefer claustrophobic intimacy" }
    - { dim: brand_fit, weight: 1.2, direction: "warm-saturated against cool shadow" }
  veto_conditions:
    - "snap-only motion without trail or after-image"
  argument_style: "evocative, reference-anchored, defends mood over function"
arbitration:
  weight_in_table: 0.25
  can_veto: false
---
```

**Steg:**
1. Skriv schema-doc med diff mot `_schema.md` (sprint 15).
2. Backwards-compat: text/UI-designers utan `category`-fält antas vara `category: print` eller `category: ui` (default).
3. Dokumentera mappnings-fält (`cinema_palette`, `motion_signature`, `composition`) med exempel-värden från 12 packs.

**AC:**
- Schema-doc komplett.
- Backwards-compat med text-designers från sprint 15 (inga existerande packs behöver uppdateras).
- YAML validerar mot ny utvidgad struktur.

---

## Task 37.2 — 12 director-packs [L]

**Filer:**
- `designers/wong-kar-wai.md`
- `designers/villeneuve.md`
- `designers/wes-anderson.md`
- `designers/nolan.md`
- `designers/kubrick.md`
- `designers/lynch.md`
- `designers/tarkovsky.md`
- `designers/denis.md` (Claire Denis)
- `designers/bong.md` (Bong Joon-ho)
- `designers/parker.md` (Alan Parker)
- `designers/garland.md` (Alex Garland)
- `designers/coppola.md` (Sofia Coppola)

**Vad:** 12 packs. Varje pack inkluderar:
- `cinema_palette` mappad till oklch web-palette (warm-amber → `oklch(0.78 0.14 65)` + skala)
- `motion_signature` → CSS keyframes-anchor (smudge-blur-trail, freeze-frame-cut, symmetric-tween, etc.)
- `composition` → layout-bias (central, dutch, off-grid, symmetric)
- 3–5 representativa filmer per regissör som taste-anchors
- Etisk reflektion (kulturell appropriation undviks; Tarkovsky är inte "spirituality-prop", Denis är inte "exotic France-aesthetic")

**Steg:**
1. Kopiera schema-template från Task 37.1, fyll per regissör med research-baserade värden.
2. Color-grading research: hämta från cinema-references (canonical color-script-böcker, ej slumpvisa stills).
3. Etisk-reflection-block där relevant (alla packs där regissörens kulturella kontext riskerar reduceras).

**AC:**
- 12 packs ≥ 80 rader var.
- `cinema_palette` + `motion_signature` + `composition` explicit definierade.
- Etisk-reflection-block (≥ 1 stycke) i alla packs där regissörens kontext är kulturellt specifik (Wong, Bong, Tarkovsky, Denis minst).

---

## Task 37.3 — `/visionary-cinematic` command-alias [S]

**Fil:** `commands/visionary-cinematic.md` (ny)

**Vad:** Wrapper för `/designer <director-id>` som gör cinematic-packs lättare att upptäcka. Listar alla 12 director-packs med kort beskrivning.

**Steg:**
1. Doc med syntax: `/visionary-cinematic <director-id> [--grade]`.
2. Lista alla 12 packs med 1-line-summary per regissör (t.ex. "wong-kar-wai — smudge-motion, warm-saturated, off-center intimacy").
3. Förklara `--grade`-flaggan (opt-in LUT-overlay från Task 37.4).
4. Cross-link till `/designer`-command (sprint 15) — cinematic är en delmängd av designer-systemet.

**AC:**
- Command-doc komplett med alla 12 packs listade.
- Cross-links fungerar.

---

## Task 37.4 — LUT→CSS-filter mapping [M]

**Fil:** `hooks/scripts/lib/cinematic/lut-to-filter.mjs` (ny)

**Vad:** Varje director-pack har en color-grading-LUT-anchor (warm-amber, cold-monochrome, pastel-symmetric, etc.). Mappa till CSS `filter: hue-rotate() saturate() contrast() sepia()` som final-pass på generated UI för subtilt cinematic-look.

**Steg:**
1. 12 LUT-presets som JSON i `designers/_luts.json` (en preset per director-id).
2. Funktion `applyLut(lutId) → cssFilterString`. Exempel: `wong-kar-wai-warm` → `"saturate(1.15) hue-rotate(-8deg) contrast(1.05) sepia(0.08)"`.
3. Inject som `body { filter: ... }` när cinematic-pack aktiv OCH användaren opt-in via `--grade`-flagga (eller `VISIONARY_CINEMATIC_GRADE=1` env).
4. Default: LUT-overlay AV — packs påverkar palette + motion + composition direkt, grade är extra kosmetik-pass.
5. APCA-check post-grade: om Lc faller under 60 på primär text-mot-bakgrund efter grade applicerats → auto-disable grade och varna i receipt.

**AC:**
- 12 LUTs validerar (CSS-filter-string parsar utan errors).
- CSS-filter applied syns visuellt på Playwright-snapshots (diff mot non-graded version > 5 % pixel-distance).
- APCA-auto-disable triggar för minst en LUT × bakgrund-kombination (verifierat med fixture).

---

## Task 37.5 — Tester [S]

**Fil:** `hooks/scripts/lib/cinematic/__tests__/*.test.mjs`

**Coverage:**
- LUT-mapper: alla 12 LUTs producerar valida CSS-filter-strings.
- Schema-validation: alla 12 packs validerar mot `_director-schema.md`.
- Pack-loading: alla 12 packs laddar utan errors.
- APCA-auto-disable: triggar när Lc < 60.

**AC:**
- `node --test` grön.
- Coverage ≥ 80 % på `lib/cinematic/`.

---

## Task 37.6 — Doc + reference screenshots [S]

**Fil:** `docs/cinematic-designers.md` (ny), `mockups/sprint-20/<director>.png` (12 ref-screenshots)

**Innehåll:**
- Lista över 12 packs med 1-paragraf-beskrivning per regissör.
- Exempel-output: samma kanoniska komponent (hero-section) renderad med varje pack.
- Etisk reflektion: varför filmregissörer som inspiration kräver respekt för kontext (kulturell appropriation, gender-balance i listan, intentional inclusion av Sofia Coppola, Claire Denis, etc.).
- Cross-link till sprint 15 (designer-as-subagent) — cinematic-packs deltar i samma arbitration-tabell.

**AC:**
- Doc komplett.
- 12 ref-screenshots committade i `mockups/sprint-20/`.
- Etisk reflektion peer-reviewed.

---

## Benchmark-verifiering

**Fil:** `results/sprint-20-cinematic-designers.md`

**Mätningar:**
- Samma kanoniska komponent (hero-section) genererad med 12 director-packs.
- Verifiera distinkthet: DINOv2-cosine spread ≥ 0.4 mellan packs (parvis matrix).
- Per pack: rapportera per-dim score-distribution från critic-loop.
- Wall-clock-tid per generation (förvänta ingen mätbar regression — packs är YAML, inte runtime-cost).

**AC:**
- 12 outputs visuellt distinkta.
- DINOv2-cosine-spread ≥ 0.4 i parvis matrix (ingen pack-par under tröskeln).
- Rapport publicerad.

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Stereotypifiering av regissörers stil (Wong Kar-wai är mer än "warm neon") | Hög | Medel | Manuell expert-review per pack; community-PR för korrigeringar |
| Cinematic-grade overlay döljer accessibility (kontrast bryts) | Medel | Hög | APCA-check post-grade; auto-disable om Lc faller under 60 |
| Kulturell appropriation (Tarkovsky som "Russian-mystic-prop") | Medel | Hög | Etisk reflektion i varje pack med kulturell kontext |
| Director-LUT ger pixelerad output på låg-DPI screens | Låg | Låg | Cinematic-grade default OFF, opt-in via flagga |

---

## Definition of Done

- [ ] Alla tasks (37.1–37.6) klara
- [ ] 12 director-packs har komplett schema med `cinema_palette` + `motion_signature` + `composition`
- [ ] LUT→CSS-filter mapping fungerar med APCA-guard
- [ ] `/visionary-cinematic` command-doc komplett
- [ ] 12 ref-screenshots committade
- [ ] Benchmark visar DINOv2-cosine-spread ≥ 0.4 mellan packs
- [ ] `results/sprint-20-cinematic-designers.md` publicerad
- [ ] Mergad till `main`

## Amendments

_Tomt._
