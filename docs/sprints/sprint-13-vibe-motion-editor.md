# Sprint 13 — Vibe Motion Editor: NL-tuning av motion-tokens

**Vecka:** 23–24
**Fas:** 7 — Interactive editing (ny fas)
**Items:** 28 från roadmap (ny)
**Mål:** Stänga feedback-loopen mellan Motion Scoring 2.0 (Sprint 9) och faktisk fix. När scoreren flaggar svag AARS eller fel easing-provenance ska användaren kunna säga `/visionary-motion "mer energiskt"` och få re-tunade motion-tokens på existerande komponent — utan att regenerera hela komponenten. Det är vår motion-first-USP som äntligen får ett interaktivt ansikte. Förutsätter Motion Scoring 2.0 så vi kan mäta före/efter.

Strategi: NL → motion-token-mappning är *deterministisk*, inte LLM-genererad. Vi har kontroll över hur "mer energiskt" mappar mot springar och durations, vilket håller output förutsägbar och billigt.

## Scope

- Item 28 — Vibe Motion Editor: slash-kommando + arg-parser, NL-intent → token-mappning, diff-applikation, before/after-scoring, Playwright-preview, dokumentation.

## Pre-flight checklist

- [ ] Sprint 9 mergad — Motion Scoring 2.0 ger oss mätsignal
- [ ] DTCG-token-export från Sprint 04 stable så vi kan röra `motion.tokens.json`-filen
- [ ] Feature-branch: `feat/sprint-13-vibe-motion`

---

## Task 28.1 — Slash-kommando + arg-parser [M]

**Fil:** `commands/visionary-motion.md` (ny), `hooks/scripts/lib/vibe-motion/parser.mjs`

**Kommando-syntax:**
```
/visionary-motion <intent> [--component <path>] [--preview]
```

**Exempel:**
- `/visionary-motion "mer energiskt"` — applicerar på senast genererade komponent
- `/visionary-motion "mjukare övergångar" --component src/Card.tsx`
- `/visionary-motion "snabbare" --preview` — visar diff utan att skriva

**Steg:**
1. Skapa SlashCommand-fil enligt Claude Code-konvention.
2. Parser extraherar intent + component-path + flags.
3. Default component-path: senaste från `traces/<session>.jsonl` (`event: "generation_complete"`).

**AC:**
- Test: kommandot triggar parser med rätt args
- Test: utan `--component` resolveras path från trace
- Felmeddelande om ingen komponent identifierad: "Specificera --component <path>"

---

## Task 28.2 — NL-intent → motion-token-mapping [L]

**Fil:** `hooks/scripts/lib/vibe-motion/intent-map.mjs`, `skills/visionary/partials/motion-vibes.md`

**Mappnings-tabell (initialt sett 12 vibes):**

| Intent (sv + en) | Effekt på tokens |
|---|---|
| "mer energiskt" / "more energetic" | bounce += 0.2, visualDuration -= 20 % |
| "mjukare" / "softer" | bounce -= 0.2, ease-out-heaviness ↑ |
| "snabbare" / "faster" | duration × 0.7 (cap min 100 ms) |
| "långsammare" / "slower" | duration × 1.4 (cap max 800 ms) |
| "mer studsigt" / "bouncier" | bounce += 0.3 |
| "lugnare" / "calmer" | linear()-easing ersätter spring där den är |
| "kinetiskt" / "kinetic" | aktivera AARS-pattern, lägg in stagger |
| "minimalistiskt" / "minimal" | reducera bounce till 0, durations × 0.8 |
| "filmiskt" / "cinematic" | linear() med 6 stops, ease-out-heavy |
| "respons-snäppt" / "snappy" | duration ≤ 150 ms, bounce 0 |
| "mer lager" / "more layered" | öka stagger-delay med 50–100 ms |
| "mindre dramatiskt" / "less dramatic" | reducera overshoot, duration × 0.9 |

**Steg:**
1. Skriv `intent-map.mjs` med deterministisk mapper-funktion.
2. Stöd både svenska och engelska key-phrases (regex med fallback fuzzy-match).
3. Returnera `{ adjustments: [{token, op, value}, ...], rationale }`.
4. För okända intents: returnera `{ error: "unknown intent" }` + suggesion-list.

**AC:**
- Alla 12 vibes har tester
- Okända intent föreslår närliggande matches (Levenshtein-distance)
- Fungerar både på svenska och engelska

---

## Task 28.3 — Token-diff-applikation [M]

**Fil:** `hooks/scripts/lib/vibe-motion/apply-diff.mjs`

**Steg:**
1. Läs befintlig komponent: identifiera motion-tokens (CSS variables, JSX-props, eller `motion.tokens.json`).
2. Tre fall:
   - **DTCG token-fil finns:** modifiera `motion.tokens.json` direkt enligt `adjustments`.
   - **Inline JSX-props:** patcha `<motion.div animate={{...}}>`-attribut.
   - **CSS klasser:** identifiera `.motion-fast`/`--motion-base` och uppdatera value.
3. Använd MultiEdit-style operations för att hålla diff minimal.
4. Vid konflikt (intent säger "långsammare" men hård cap nås): rapportera och stoppa.

**AC:**
- Test: DTCG-fil modifieras korrekt utan att röra orelaterade keys
- Test: JSX-prop-update bevarar formatering
- Test: cap-konflikt rapporteras
- Diff är ≤ 10 rader för enkla intents

---

## Task 28.4 — Before/after motion-scoring [M]

**Fil:** `hooks/scripts/lib/vibe-motion/scoring-diff.mjs`

**Steg:**
1. Före apply: kör `motion/scorer-2.mjs` på existing komponent → `before_score`.
2. Apply diff (in-memory eller separate worktree).
3. Efter apply: kör scorer igen → `after_score`.
4. Beräkna delta per sub-dim, generera rapport:
   ```
   Motion Readiness: 4.2 → 6.8 (+2.6)
     Easing Provenance:    3 → 5
     AARS-pattern:         2 → 4
     Timing Consistency:   4 → 4
     Narrative Arc:        3 → 5
     Reduced-motion:       5 → 5
     Cinema-grade:         3 → 6
   Maturity Tier: Subtle → Kinetic
   ```

**AC:**
- Rapport renderas
- Score-deltas korrekta (verified via känd-good fixture)
- Toggle: `--no-score` skippar mätning

---

## Task 28.5 — Playwright preview [M]

**Fil:** `hooks/scripts/lib/vibe-motion/preview.mjs`

**Steg:**
1. Vid `--preview`-flagga: rendera before + after sida vid sida.
2. Två Playwright-context, en per version.
3. Capture 2 screenshots; jämför side-by-side i en composit-bild.
4. Output sökväg printas till stdout: `Preview: ./.visionary/preview/<session>-motion.png`.
5. Inga filer skrivs till källkod om `--preview` är aktiv.

**AC:**
- Composit-bild produceras med korrekt size/layout
- Preview-mode skriver inte till källkod
- Användare kan öppna preview manuellt

---

## Task 28.6 — Trace-events [S]

**Fil:** `skills/visionary/schemas/trace-entry.schema.json`

Nya events:
- `vibe_motion_invoked` — payload: `{intent, component_path}`
- `vibe_motion_applied` — payload: `{adjustments, before_score, after_score, delta}`
- `vibe_motion_preview` — payload: `{preview_path}`

**AC:**
- Schema validerar
- Events emitteras under en simulerad full-flow

---

## Task 28.7 — Tester [M]

**Fil:** `hooks/scripts/lib/vibe-motion/__tests__/*.test.mjs`

**Coverage:**
- Parser: kommando-syntax + edge-cases
- Intent-map: alla 12 vibes + unknown-fallback
- Diff-apply: DTCG + JSX + CSS-fall
- Scoring-diff: före/efter mätning
- Preview: Playwright-mock

**AC:**
- `node --test` grön
- Coverage ≥ 80 % på `lib/vibe-motion/`

---

## Task 28.8 — Dokumentation [S]

**Fil:** `docs/vibe-motion.md` (ny), `README.md` (sektion-tillägg)

**Innehåll:**
- Konceptet: NL → motion-tokens, deterministisk mappning
- Komplett lista av vibes (12) med exempel
- Hur mappningar definieras (för contributors att utöka)
- Best practice: kör med `--preview` först, applicera när du är nöjd
- Begränsningar: fungerar bara där motion-tokens är tydligt identifierbara

**AC:**
- Doc reviewed
- Exempel-walkthrough fungerar end-to-end

---

## Benchmark-verifiering

**Fil:** `results/sprint-13-vibe-motion.md`

**Mätningar:**
- 20 manuella vibe-applications på olika komponenter; rapportera average score-lift
- User-flow latency (förvänta < 5 s utan `--preview`, < 15 s med)
- Failure-rate (komponenter där diff inte kan appliceras)

**AC:**
- Rapport publicerad
- Average score-lift dokumenterad

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| NL-intent-täckning för smal | Hög | Medel | Lägg till nya vibes i takt med användning; community-PR välkomna |
| Token-identifiering fallerar i exotic stilar | Medel | Hög | Fallback till manual-edit-suggestion när auto-patch misslyckas |
| Preview-render saktar ner UX | Medel | Låg | Default `--no-preview`; opt-in när användaren vill se |
| Konflikt mellan vibes ("snabbare" + "långsammare" sekvensiellt) | Låg | Låg | Stateless: varje invocation från senaste skrivna state; ingen vibe-historik |
| Score-delta visar lift som inte syns visuellt | Medel | Medel | Preview obligatorisk vid första körning; rapport varnar om "score lift utan visuell skillnad" |

---

## Definition of Done

- [ ] Alla tasks (28.1–28.8) klara
- [ ] 12 vibes implementerade + testade
- [ ] DTCG + JSX + CSS-fall hanteras
- [ ] Preview-mode fungerar
- [ ] Score-diff-rapport visas på varje run
- [ ] `results/sprint-13-vibe-motion.md` publicerad
- [ ] Mergad till `main`

## Amendments

_Tomt._
