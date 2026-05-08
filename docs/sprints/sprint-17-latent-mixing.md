# Sprint 17 — Latent Style Mixing & Mood-Driven Selection

**Vecka:** 30
**Fas:** 10 — Generativ diversitet
**Items:** 33, 34
**Beräknad tid:** 5 dagar
**Mål:** Släpp diskretiseringen av stilkatalogen. Använd den existerande 8D-embedding-rymden (`density, chroma, formality, motion_intensity, historicism, texture, contrast_energy, type_drama`) för att slerp:a mellan stilar och tillåta blandningar som inte finns explicit i katalogen. Kombinera med en ny mood-slider (Russell circumplex valence×arousal) som primär stil-väljare för icke-design-experter. Tillsammans gör detta att två gen-anrop sällan ger samma output även för identisk prompt.

Wild idea: slerp i 8D-rymden ger oss en kontinuerlig stilväljare ovanpå den diskreta katalogen. "70 % swiss-rationalism + 30 % liminal-space" blir en ny punkt som ingen kompetent har sett — men som ärver typografi-disciplinen från Swiss och atmosfären från Liminal. Mood-slidern gör hela katalogen 2-dimensionellt sökbar utan att användaren behöver kunna namnen på 202 stilar.

## Scope

- Item 33 — Latent Style Mixing: slerp-modul, token-resolver från godtycklig 8D-vektor, `--blend`-flagga, NL-parser, ny pipeline-stage 2.5.
- Item 34 — Mood-Driven Selection: `/visionary-mood`-command, Russell-circumplex-mappning, text-mood-lookup.
- Anti-katalog-experiment som foundation-stub (full impl i sprint 21).

## Pre-flight checklist

- [ ] Sprint 16 mergad — ingen direkt dependency men logisk ordning (samma fas)
- [ ] Sprint 11 (DINOv2-visuella embeddings) optional — används om tillgänglig för diversity-mätning
- [ ] `skills/visionary/styles/_embeddings.json` finns och har 8D-vektorer för alla 202 stilar
- [ ] `hooks/scripts/lib/orthogonal-variants.mjs` finns (existerande diskret cosinus-logik)
- [ ] `skills/visionary/typography-matrix.md` finns
- [ ] `skills/visionary/palette-tokens.md` finns
- [ ] Feature-branch: `feat/sprint-17-latent-mixing`

---

## Task 33.1 — Slerp-modul i 8D-rymden [M]

**Fil:** `hooks/scripts/lib/style-blend.mjs` (ny)

**Vad det gör:** Spherical Linear Interpolation över godtyckligt antal anchor-vektorer med vikter. Output: ny 8D-vektor på N-sphere. Detta är matematiken som gör att vi kan placera en blend-punkt mellan två (eller fler) katalogstilar utan att förlora vektorlängd — vilket är skillnaden mellan "70 % Swiss + 30 % Liminal" som en distinkt stil och en urvattnad medel-grötig lerp.

**Steg:**
1. Standard slerp för 2 anchors: `slerp(a, b, t) = (sin((1-t)·Ω) / sin Ω)·a + (sin(t·Ω) / sin Ω)·b`, där Ω = arccos(a·b / (|a|·|b|)).
2. Generaliserad N-anchor slerp via successive pairwise composition (rekursiv reducering av weight-listan) eller weighted Karcher mean — välj pairwise composition som default; den är O(N) och numeriskt stabil för ≤ 5 anchors.
3. Hard-clamps post-slerp för accessibility-floors:
   - `chroma` ≥ pack-default 0.15 (annars förlorar palette-pop helt)
   - `contrast_energy` ≥ värde som motsvarar APCA Lc 60 i text/bg (mappas till ≥ 0.4 i vår normaliserade rymd — verifiera mot 8D-axel-definitionen)
4. Export: `blend(anchors[], weights[]) → { vector, anchors_used, clamps_applied, omega_warnings }`.
5. `omega_warnings` när Ω är extremt litet (< 0.01 rad — anchors är nästan identiska, slerp blir lerp) eller extremt stort (> π−0.01 — antipoder, blend är odefinierad).

**AC:**
- Test `slerp(A, A, 0.5) === A` (identitet)
- Test `slerp(A, B, 0.5) ≈ midpoint(A, B)` på N-sphere (inte i euklidisk rymd)
- Test 3-anchor blend med vikter `[0.5, 0.3, 0.2]` summerar korrekt
- Hard-clamps lagrar `clamps_applied` med dim-namn för debug
- Antipod-detektor varnar i `omega_warnings`

---

## Task 33.2 — Token-resolver från godtycklig 8D-vektor [L]

**Fil:** `hooks/scripts/lib/style-blend-resolver.mjs` (ny)

**Vad det gör:** Givet en 8D-vektor (möjligen ej i katalogen), resolva: palette (3–5 oklch-färger), typografi-par, motion-tier (0–3), density-tokens (spacing-skala). Detta är hjärtat — utan det kan slerp inte producera output, bara abstrakta vektorer. Resolver är skillnaden mellan "vi har en blend-punkt" och "vi har en faktisk DesignReasoningBrief för stage 3".

**Steg:**
1. **Palette:** hitta 3 närmsta katalog-anchors via cosine-distance, blanda deras paletter i oklch via vikt-baserad lerp (oklch interpolerar perceptuellt korrekt; hex/RGB gör det inte). Per-färg-clamping: APCA Lc-floor-check som hard-clamp efter blend — om bg/fg-pairing failar Lc 60, justera lightness av fg tills den klarar.
2. **Typografi:** `pickPair` från `typography-matrix.md` baserat på (`type_drama`, `formality`)-projection till matris-koordinater. Om confidence < 0.6 (punkten ligger mellan två arketyper utan tydligt vinst), snap till närmsta valid pair. Fallback: Innocent (Manrope/Manrope) som universellt-säker default.
3. **Motion:** kvantisera `motion_intensity` → `[0, 1, 2, 3]` (Static / Subtle / Expressive / Kinetic) med trösklar `[0.25, 0.5, 0.75]`. Aldrig fractional motion-tier.
4. **Density:** `lerp(spacing_grids[base=8px], v.density)` — högre density → tätare 4px-grid, lägre density → 12px-grid. Spacing-tokens beräknas på basis av denna grid.
5. **Output:** komplett `DesignReasoningBrief` med samma schema som stage 2 producerar i ren-stil-fallet, plus extra fält `blend_recipe` med ursprungsvektor + närmsta katalog-anchors.

**AC:**
- 50 testpunkter (random 8D-vektorer från enhet-N-sphere) producerar valid `DesignReasoningBrief`
- Alla 50 har APCA Lc ≥ 60 i body-text/bg (ingen blend kan bryta a11y-floor)
- Motion-tier är alltid integer ∈ {0, 1, 2, 3}
- Snap till valid typography-pair sker när confidence < 0.6 — verifierat med fixture som ligger mitt mellan två arketyper
- Brief är fristående konsumerbar av stage 3 (kontrakt-test mot existerande generation-prompt)

---

## Task 33.3 — `--blend`-flagga + naturligt-språk-parser [M]

**Fil:** `skills/visionary/SKILL.md` (uppdatera) + `hooks/scripts/lib/blend-parser.mjs` (ny)

**Vad det gör:** Användaren kan trigga blend på två sätt: explicit syntax (`/visionary --blend "swiss-rationalism:0.7 + liminal-space:0.3"`) ELLER naturligt språk i prompt ("70 % Swiss, 30 % Liminal", "Swiss men med Liminals typografi"). Parser plockar ut `(anchor, weight)`-tupler.

**Steg:**
1. **Strict parser** för formellt syntax: `<id1>:<w1> + <id2>:<w2> + ...` — regex `/([a-z0-9-]+):(\d+(?:\.\d+)?)/g`, validera att vikter summerar till ~1.0 (tolerans ±0.05).
2. **NL-parser** som regex-extraherar procent + style-namn:
   - Mönster A: `(\d+)\s*%\s+([a-zA-Z][\w-]+)` ("70 % Swiss")
   - Mönster B: lowercase + fuzzy match mot katalog-IDs (Levenshtein ≤ 2 mot kanoniska IDs)
   - Vid avsaknad av andra procent: fyll till 1.0 med komplementet
3. **"X men med Y:s Z"-mönster** där Z ∈ {`typografi`, `motion`, `palette`, `density`}:
   - Använder X som base-vektor (vikt 1.0)
   - Överlift bara Z-axeln från Y (ersätter X:s värde på den axeln med Y:s)
   - Genererar en hybrid-vektor som inte är en ren slerp utan en axel-substitution
4. **Validation:**
   - Vikter summerar till ~1.0
   - Alla anchors finns i `_embeddings.json#embeddings`
   - Vid fel: returnera explicit error-objekt, INTE silent fallback (vi vill inte att användaren tror att en typo blev accepterad)
5. **Locale:** stöd både svenska ("med Liminals typografi") och engelska ("with Liminal's typography").

**AC:**
- Test parser på 20 fraser: 10 svenska, 10 engelska
- NL-parser har ≥ 80 % recall på "rimliga formuleringar" (definierad fixture-set)
- Strict parser kräver exakt syntax — ingen forgiveness
- "X men med Y:s Z"-mönster producerar axel-substitution, inte slerp
- Felaktig anchor-ID returnerar explicit error med suggestions (Levenshtein-fuzzy match)

---

## Task 33.4 — Stage 2.5 i pipeline [S]

**Fil:** `skills/visionary/SKILL.md` (uppdatera Execution Flow)

**Vad det gör:** Ny stage 2.5 mellan style-selection (stage 2) och generation (stage 3). När `--blend` aktiv: skipa stage 2:s ensam-stil-val och kör blend istället. När mood-mapper aktiv: använd dess output som anchor-set. Annars passthrough — blend-stagen finns alltid i pipelinen men kör no-op för rena stil-anrop.

**Steg:**
1. Pipeline-doc i `SKILL.md` får ny sektion "Stage 2.5 — Latent Style Mixing (conditional)" med flow-diagram:
   ```
   Stage 2 → StyleBrief
        ↓
   Stage 2.5: blend active?
     yes → resolveBlendVector(anchors, weights) → DesignReasoningBrief
     no  → passthrough
        ↓
   Stage 3 → generation
   ```
2. Receipt-schema (existerande critique-receipt) får optional `blend_recipe` med:
   - `anchors`: lista med katalog-IDs och vikter
   - `weights`: numeriska vikter (summerar till 1.0)
   - `vector`: resulterande 8D-vektor
   - `clamps_applied`: lista med hard-clamps som triggades
   - `omega_warnings`: ev varningar från slerp
3. Trace-event `style_blend` (ny event-typ) emitteras med full payload för debug och flywheel-feedback.

**AC:**
- `SKILL.md` beskriver tydligt när stage 2.5 fyrar (3 fall: explicit `--blend`, NL-parser-detektion, mood-mapper output)
- Receipt-schema har optional `blend_recipe` som validerar
- Trace-event-schema (`schemas/trace-entry.schema.json`) har `style_blend` event-typ
- No-op-passthrough verifierat med snapshot-test (rena stil-anrop får ingen `blend_recipe` i receipt)

---

## Task 33.5 — Mood-slider command [M]

**Fil:** `commands/visionary-mood.md` (ny) + `hooks/scripts/lib/mood-mapper.mjs` (ny)

**Vad det gör:** `/visionary-mood <valence>,<arousal>` där värden är 0.0–1.0. Mappar Russell-circumplex-koordinater till stil-kluster i katalogen. Detta är 2D-styrgreppet för icke-design-experter — istället för "swiss-rationalism" skriver de "calm and serious" och får relevanta stil-kandidater.

**Steg:**
1. **Russell-quadrant-mappning** (valence × arousal i [0,1]² → katalog-kandidatlista):
   - **High-V, High-A** (vibrant maximalist): `memphis`, `vaporwave`, `post-internet-maximalism`, `pop-art`, `bubblegum-bling`, `dopamine-design`
   - **Low-V, High-A** (raw / brutalist / glitch): `architectural-brutalism`, `brutalist-honesty`, `glitchcore`, `cyberpunk-neon`, `neubrutalism`, `anxiety-urgency`
   - **Low-V, Low-A** (swiss / monochrome / calm): `swiss-rationalism`, `swiss-muller-brockmann`, `liminal-space`, `default-computing-native`, `monochrome`, `zen-void`
   - **High-V, Low-A** (soft / glass / warm): `liquid-glass`, `dreamcore`, `cottagecore-tech`, `coastal-grandmother`, `light-mode-sanctuary`, `hyper-comfort-hygge`
2. **Style-väljare** med kvadrant-bias plus matchning mot `motion_intensity`-tag (`arousal` korrelerar med motion) och `chroma`-tag (`valence` × `arousal` korrelerar grovt med chroma). Top-3 returneras som kandidat-trio.
3. **Text-mood-lookup-tabell** för naturligt språk:
   - "happy-anxious", "excited", "energetic" → high-V/high-A
   - "calm", "serious", "minimal" → low-V/low-A
   - "melancholic", "moody", "raw" → low-V/high-A
   - "warm", "soft", "cozy" → high-V/low-A
   - Tabellen täcker minst 16 fraser per kvadrant, både svenska och engelska
4. **Integration med `--blend`:** mood-mapper kan skicka top-3 som anchors med vikter `[0.5, 0.3, 0.2]` direkt in i stage 2.5.

**AC:**
- 16 mood-kombinationer (4 kvadranter × 4 punkter per kvadrant) producerar logiskt grupperade stilval
- Text-mood-lookup mappar 64 fraser till valida koordinater (svenska + engelska, 16 per kvadrant)
- Mood→blend-integration testad: `/visionary-mood 0.2,0.2` → "calm" → blend av swiss/liminal/zen-void
- Catalog-distribution-audit: ingen kvadrant har < 6 distinkta stilar (annars degenererar slidern)

---

## Task 33.6 — Anti-katalog-experiment (foundation, full impl i sprint 21) [S]

**Fil:** `hooks/scripts/lib/coined-styles.mjs` (stub) + `taste/coined-styles.jsonl.example` (schema-fil)

**Vad det gör:** Persisterings-stub: när blend används utanför katalogen och accepteras (positivt taste-signal från användaren), lagra blend-recipe i `taste/coined-styles.jsonl` med `{id, vector, anchor_recipe, accepted_at, name?}`. Full promotion-logic — där en accepterad blend kan upgrades till en riktig katalog-stil — kommer i sprint 21 (fas C4). Sprint 17 lägger bara skelettet.

**Steg:**
1. Persisterings-skelett: `appendCoined(record)` skriver JSONL-rad. Schema-fil `coined-styles.schema.json` med required fields `id, vector, anchor_recipe, accepted_at`, optional `name`.
2. Read-stub `listCoined()` returnerar tom array i v17 (lagring sker men läsning är inte aktiverad — kommer i sprint 21).
3. Markera tydligt i fil-header att detta är en stub: "Sprint 17 foundation — full promotion-logic in sprint 21".
4. Trigger för append: när `taste/facts.jsonl` får en `git_kept`-fact för en file där `blend_recipe` finns i receipt — då har användaren behållit en blend-genererad fil. Detta hookas in via `harvest-git-signal.mjs` (stub-koppling, fullt aktiv i sprint 21).

**AC:**
- Skelett-fil + schema validerar
- Ingen runtime-impact i sprint 17 — `listCoined()` är ren no-op-läsning
- Header-kommentar tydlig om "stub for sprint 21"
- Schema-fil reviewed av maintainer

---

## Task 33.7 — Tester [M]

**Fil:** `hooks/scripts/lib/__tests__/style-blend.test.mjs`, `style-blend-resolver.test.mjs`, `blend-parser.test.mjs`, `mood-mapper.test.mjs`

**Coverage:**
- **Slerp-matematik** (`style-blend.test.mjs`): identitet, midpoint, 3-anchor weighted blend, antipod-detektor, hard-clamps på chroma + contrast_energy
- **Token-resolver edge-cases** (`style-blend-resolver.test.mjs`): extrem chroma (0.95), motion=0/3 boundary, typography-snap när confidence < 0.6, 50-punkt-fixture med APCA-floor-check
- **Parser** (`blend-parser.test.mjs`): 20 fraser (10 SV + 10 EN), strict syntax, "X men med Y:s Z"-mönster, fuzzy-match på typos, error-objekt vid felaktig anchor
- **Mood-mappning** (`mood-mapper.test.mjs`): 16 kvadrant-punkter, 64 text-fraser, mood→blend-integration, kvadrant-coverage (≥ 6 stilar per kvadrant)

**AC:**
- `node --test hooks/scripts/lib/__tests__/style-blend*.test.mjs blend-parser.test.mjs mood-mapper.test.mjs` grön
- Coverage ≥ 80 % på de 4 nya filerna
- Inga snapshot-tester utan strukturella assertions (slerp-output ska assertas med epsilon-tolerans, inte byte-jämförelse)

---

## Task 33.8 — Dokumentation [S]

**Fil:** `docs/latent-style-mixing.md` (ny), `docs/mood-slider.md` (ny)

**Innehåll i `latent-style-mixing.md`:**
- Vad slerp är (en mening, inte en linjär-algebra-föreläsning) och varför 8D-rymden funkar
- Exempel-blends med screenshots: 3 par (Swiss+Liminal, Bauhaus+Memphis, Dieter Rams+Glitchcore) före/efter
- "X men med Y:s Z"-mönstret förklarat med konkret exempel
- Kvalitetsfallgropar: urvattnad medel-blend (50/50 mellan motsatta vektorer), när hard-clamps kickar in
- När att använda `--blend` vs ren stil — riktlinje: använd blend när ingen ensam stil fångar känslan

**Innehåll i `mood-slider.md`:**
- Russell-circumplex som mental modell (kort, för icke-psykologer)
- Kvadrant-mappnings-tabell med exempel-stilar
- Text-mood-fraser som triggar varje kvadrant
- När mood-slider är rätt verktyg vs när explicit stilval är bättre
- Integration med `--blend`: mood-output → blend-anchors

**AC:**
- Båda docs reviewed med konkreta exempel (inte bara abstrakt teori)
- Screenshots faktiskt producerade (inte placeholder-text)
- Cross-länkar mellan docs och `SKILL.md`-uppdatering i Task 33.4

---

## Benchmark-verifiering

**Fil:** `results/sprint-17-latent-mixing.md`

**Mätningar:**
1. **Diversity:** 30 prompts × 2 körningar (med `--blend` vs utan, hela katalogen tillåten) = 120 generations. Mät DINOv2-cosine-diversity (om Sprint 11 mergad) eller fallback till strukturella diff-metrics (palette, motion-tier, typography-pair). Förvänta: blend ökar pairwise-diversity med ≥ 25 %.
2. **Mood-quadrant-distinkthet:** 16 mood-koordinater × 3 prompts var = 48 generations. Verifiera att low-V designers (kvadrant 3) skiljer sig visuellt från high-V designers (kvadrant 1) i ≥ 70 % av visuella attributen (palette saturation, typography weight, motion intensity). Sample 10 par over kvadrant-gränser och låt ett MLLM-judge (Sprint 12 om aktiv) klassa "tydligt olika" / "subtilt olika" / "samma".
3. **APCA-floor:** 100 % av blends har Lc ≥ 60 på body-text/bg. Inga undantag.
4. **Slerp-stabilitet:** 1000 random 2-anchor-blends — ingen producerar NaN, alla har ‖vector‖ ∈ [0.99, 1.01].

**AC:**
- Diversity-rapport publicerad med konkreta tal
- Mood-quadranter distinkta (≥ 70 % attribute-divergens över gränser)
- 0 APCA-violations över 178 blend-runs (100 + 48 + 30)
- Slerp-stabilitet: 0 NaN, vector-norm inom tolerans

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Slerp 50/50 mellan motsatta vektorer ger urvattnad medel-grötig output | Hög | Hög | Hard-clamps för chroma + contrast_energy; varning till användaren vid weight ~0.5 mellan distanta anchors (cosine-distance > 0.7); `omega_warnings` i receipt |
| Token-resolver gissar fel typografi för punkter mellan matris-koordinater | Medel | Medel | Snap till närmsta valid pair om confidence < 0.6; fallback till Innocent-pair (Manrope) som universellt-säker default |
| Mood-mapper hamnar i samma 4–5 stilar oavsett kvadrant pga katalog-distribution | Medel | Hög | Audit-script för katalog mot quadrants i Task 33.5 AC; fyll glesa kvadranter med befintliga stilar via taggning innan release |
| NL-parser felförstår "70 % Swiss" som procent CSS-värde | Låg | Låg | Strict mönsterval (procent måste följas av style-namn, inte siffra/CSS-property); fallback till explicit `--blend` syntax |
| Blend-receipt blir oläslig för användare (8D-vektor + clamps + warnings) | Låg | Låg | Pretty-printer i receipt med human-readable summary: "Blend: 70 % Swiss + 30 % Liminal — chroma clamped to 0.15 for palette pop" |
| `--blend` öppnar yta för designer-pack-konflikter (sprint 15 designer ska argumentera mot blend som inte matchar deras filosofi) | Medel | Medel | Designer-as-subagent (sprint 15) får se blend-recipe i sin context och kan veto:a; v17 tillåter veto bara om designer-pack är aktiv |
| Slerp över > 3 anchors blir matematiskt ostabil | Låg | Medel | v17 kapar antalet anchors till max 3; > 3 returnerar error med suggestion |

---

## Definition of Done

- [ ] Alla tasks (33.1–33.8) klara
- [ ] `style-blend.mjs`, `style-blend-resolver.mjs`, `blend-parser.mjs`, `mood-mapper.mjs` mergade
- [ ] `commands/visionary-mood.md` skapad och länkad från `commands/`-index
- [ ] `SKILL.md` uppdaterad med stage 2.5
- [ ] Receipt-schema har `blend_recipe` (optional)
- [ ] Trace-event `style_blend` validerar
- [ ] `coined-styles.mjs` stub + schema mergade (ingen runtime impact)
- [ ] Alla 4 test-filer gröna med ≥ 80 % coverage
- [ ] Benchmark-rapport `results/sprint-17-latent-mixing.md` publicerad
- [ ] Diversity ökar med blend (≥ 25 %), mood-kvadranter distinkta (≥ 70 %), 0 APCA-violations
- [ ] `docs/latent-style-mixing.md` + `docs/mood-slider.md` reviewed med screenshots
- [ ] Mergad till `main`

## Amendments

_Tomt._
