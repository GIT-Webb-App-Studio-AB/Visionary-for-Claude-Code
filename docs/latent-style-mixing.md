# Latent Style Mixing — kontinuerlig blandning bortom katalogen

## Varför detta finns

Visionary's 202-stilskatalog är diskret — du väljer EN stil. Men många
användare upplever att deras vision sitter "mellan" två stilar:
"Swiss-precis men med Liminal-Spaces tomhet" eller "70 % Glassmorphism,
30 % Brutalism". Latent Style Mixing låter dig blanda i en kontinuerlig
8D-rymd som spänner upp katalogens semantiska variation.

Resultatet är en **off-katalog-stil** — en distinkt punkt i samma
embedding-rymd som katalogen lever i, men som ingen designer har sett
tidigare. Den ärver typografi-disciplinen från Swiss och tomhets-
atmosfären från Liminal — i exakt det förhållande du anger. Det är
skillnaden mellan att "välja en av 202 stilar" och att "designa din egen
estetiska adress" på en sfärisk hyperyta.

Sprint 17 är där diskretiseringen släpper. Vi behåller katalogen som
anchor-punkter — de är portarna in i rymden — men ger dig kontinuerlig
rörelse mellan dem.

## 8D-rymden

Varje stil har en pre-baked 8D-vektor i
`skills/visionary/styles/_embeddings.json` med dessa axlar:

| Axel | Beskrivning | Exempel: värdet 0 vs 1 |
|---|---|---|
| `density` | Visuell täthet | `0.2` spacious editorial vs `0.85` information-dense terminal |
| `chroma` | Färgmättnad | `0.1` monokrom (`art-nouveau`) vs `0.9` neon (`cyberpunk-neon`) |
| `formality` | Ton | `0.1` playful zine (`whimsical-storybook`) vs `1.0` corporate (`pharmaceutical-clean`) |
| `motion_intensity` | Rörelseaktivitet | `0.05` static (`zine-diy`) vs `0.95` kinetic (`vaporwave`) |
| `historicism` | Estetisk era | `0.15` post-2024 vs `0.9` retro/vintage (`bauhaus`, `art-deco`) |
| `texture` | Ytkänsla | `0.0` smooth (`japanese-minimalism`) vs `1.0` grainy (`stone-mineral`, `skeuomorphism`) |
| `contrast_energy` | Visuell hetta | `0.14` calm (`hyper-comfort-hygge`) vs `0.98` aggressive (`brutalist-honesty`) |
| `type_drama` | Typografisk uttrycksfullhet | `0.04` system-ui (`pharmaceutical-clean`) vs `1.0` display (`arabic-calligraphic`) |

Värdena är normaliserade till `[0, 1]` per axel och varje stil-vektor
ligger på N-sphere efter normalisering. Det betyder att alla 202 stilar
sitter på ytan av en 8-dimensionell hypersfär — och **interpolation
mellan dem måste följa sfären**, inte gena rakt igenom centrum.

### Geometrisk intuition

Tänk dig två punkter på en jordglob: Stockholm och New York. Linjär
interpolation (lerp) mellan dem skulle gena rakt genom jordens kärna —
fysiskt omöjligt om du vill stanna på ytan. Slerp följer storcirkeln,
den shortest path som hela tiden ligger på ytan.

I vår 8D-rymd är "ytan" vad som gör vektorn meningsfull. En vektor med
norm `0.5` är inte halv-så-mycket-stil — den är en degraderad,
urvattnad version av sig själv. Slerp bevarar vektor-längden under hela
interpolationen. Det är därför `slerp(swiss, liminal, 0.5)` ger en
distinkt blend, inte ett medel-grötigt halvfabrikat.

## Hur slerp fungerar

Spherical Linear Interpolation, formulerad av Ken Shoemake 1985:

```
slerp(a, b, t) = (sin((1-t)·Ω) / sin Ω) · a + (sin(t·Ω) / sin Ω) · b
```

där `Ω = arccos(a·b / (|a|·|b|))` är vinkeln mellan vektorerna på
sfären och `t ∈ [0, 1]` är blend-position.

**Varför det är bättre än lerp för perceptual mixing:**

- **Längd-bevarande:** alla blend-punkter har samma norm som anchors.
  Ingen "halvljusning" eller "halvmättnad" som artefakt av matematiken.
- **Konstant vinkelhastighet:** `t = 0.5` ger geometriskt midpoint på
  sfären — inte i euklidisk rymd.
- **Antipod-detektion:** när `Ω → π` (anchors är diametralt motsatta)
  blir slerp odefinierad — vi flaggar detta i `omega_warnings` istället
  för att tysta returnera nonsens.
- **N-anchor stöd:** vi blandar 2–5 anchors via successive pairwise
  composition — `slerp(slerp(A, B, t1), C, t2)` med vikt-anpassade `t`-
  värden. O(N), numeriskt stabil.

Hard-clamps post-slerp för accessibility-floors:

- `chroma ≥ 0.15` (annars förlorar palette-pop helt)
- `contrast_energy ≥ värde som motsvarar APCA Lc 75` på text/bg

Clamps rapporteras i receipt: `clamps_applied: ['chroma_floor',
'apca_body_floor']`.

## Hur du använder

### `--blend`-flagga (strict syntax)

```bash
/visionary --blend "swiss-international:0.7 + liminal-space:0.3"
```

**Format:** `<id>:<weight> + <id>:<weight> + ...`

- `<id>` matchar mot `_embeddings.json#embeddings`-nycklar (kanoniska,
  bindestreck-seperade)
- `<weight>` är ett positivt decimaltal
- Vikter ska summera till `1.0 ± 0.05`. Om de inte gör det normaliseras
  de och en notice loggas i receipt.
- Minst 2, max 5 anchors. `> 5` returnerar fel med suggestion.

**Exempel:**

```bash
# 2-anchor blend
/visionary --blend "bauhaus:0.6 + memphis:0.4"

# 3-anchor blend med jämna vikter
/visionary --blend "dieter-rams:0.34 + glassmorphism:0.33 + glitchcore:0.33"

# Edge case: nästan ren stil med en touch av en annan
/visionary --blend "swiss-rationalism:0.92 + liminal-space:0.08"
```

### Naturligt språk i prompten

Strict syntax är exakt — men onödigt formellt för flow-state. NL-parsern
plockar ut anchors + vikter från svenska/engelska prompts:

```
"Designa en hero som är 70 % Swiss, 30 % Liminal"
"Brutalist men med Glass typografi"
"60 % Memphis, 40 % Bauhaus"
"mostly Swiss with some Liminal"
"swiss-rationalism med en touch av glitchcore"
```

**Stödda mönster (svenska + engelska):**

| Mönster | Exempel | Tolkning |
|---|---|---|
| `<N>%\s+<style>` | "70 % Swiss, 30 % Liminal" | Swiss:0.7 + Liminal:0.3 |
| `mostly X with some Y` | "mostly Bauhaus with some Memphis" | X:0.7 + Y:0.3 |
| `X med en touch av Y` | "Swiss med en touch av Glitchcore" | X:0.85 + Y:0.15 |
| `X but with Y's <axis>` | "Brutalist but with Glass typography" | X som base + Y:s `type_drama`-axel substitueras |
| `X med Y:s <axis>` | "Swiss med Liminals tomhet" | X som base + Y:s `density`-axel substitueras (`tomhet → density`) |
| `between X and Y` | "between Swiss and Liminal" | X:0.5 + Y:0.5 |

NL-parsern gör fuzzy match mot katalog-IDs (Levenshtein ≤ 2). Skriver du
"Swis" eller "swiss-international" så löses båda till
`swiss-rationalism`. Om matchen är osäker (confidence < 0.6) returneras
explicit fel med suggestions — vi tystar inte typos.

### "X but with Y's Z"-mönstret

Detta är inte en slerp. Det är **axel-substitution**: behåll X:s vektor
intakt på 7 axlar och ersätt en specifik axel med Y:s värde på den
axeln. Resultatet är en X-dominerad hybrid med exakt en lånad
egenskap.

```
"Brutalist but with Glass's typography"
↓
base = brutalist-honesty[0.5, 0.6, 0.3, 0.33, 0.15, 0.3, 0.98, 0.58]
override = liquid-glass[7] = 0.4   (type_drama-axel)
result = [0.5, 0.6, 0.3, 0.33, 0.15, 0.3, 0.98, 0.4]
```

Stödda axel-namn (svenska + engelska):

| Z (svenska) | Z (engelska) | Axel |
|---|---|---|
| täthet, density | density | `density` |
| färg, mättnad | color, chroma, saturation | `chroma` |
| ton, formalitet | tone, formality | `formality` |
| rörelse, motion | motion | `motion_intensity` |
| era, historik | era, history | `historicism` |
| yta, textur | texture, surface | `texture` |
| kontrast, hetta | contrast, energy | `contrast_energy` |
| typografi, type | typography, type | `type_drama` |

## Token-resolver — från vektor till brief

När en off-katalog-vektor produceras (via slerp eller mood-mapping)
översätter `style-blend-resolver.mjs` den till en konkret
`DesignReasoningBrief`. Utan resolvern är vektorn en abstrakt punkt; med
den blir den en faktisk brief som stage 3 kan generera från.

### Steg 1: palette

1. Hitta 3 närmsta katalog-anchors via cosine-distance (inte vinkel —
  cosine räcker eftersom alla vektorer är normaliserade).
2. Slå upp deras palette-tokens i `palette-tokens.json`.
3. Blanda i **oklch** via vikt-baserad lerp (oklch interpolerar
  perceptuellt korrekt; hex/RGB ger muddy results).
4. Per-färg APCA-clamp: om body-text/bg-pairing failar `Lc 75`, justera
  fg's L (lightness) tills den klarar. Hue och chroma rörs inte.

### Steg 2: typografi

1. Projicera vektorns `(type_drama, formality)`-koordinater till matris-
  koordinater i `typography-matrix.json`.
2. `pickPair(x, y)` returnerar närmsta valida par.
3. Om confidence < 0.6 (punkten ligger mitt mellan två arketyper utan
  klar vinst): snap till närmsta valid pair.
4. Fallback: Manrope/Manrope (Innocent-pair) som universellt-säker
  default.

### Steg 3: motion-tier

```
tier = motion_intensity < 0.25 ? 0  // Static
     : motion_intensity < 0.50 ? 1  // Subtle
     : motion_intensity < 0.75 ? 2  // Expressive
     : 3                            // Kinetic
```

**Alltid integer.** Aldrig `motion-tier 1.7`. Kontinuerlig motion mellan
tiers ger ryckig animation (browser easing-kurvor är diskreta) — så vi
kvantiserar.

### Steg 4: density-tokens

```
spacing_grid_px = lerp(12, 4, density)
spacing_tokens = grid * [1, 2, 3, 4, 6, 8, 12, 16]
```

Hög `density` → tätare 4 px-grid. Låg `density` → spacious 12 px-grid.
Spacing-skalan fall från grid via Fibonacci-liknande progression.

### Konkret exempel: 70 % Swiss + 30 % Liminal

```
swiss-rationalism = [0.5, 0.8, 0.5, 0.33, 0.9, 0.2,  0.65, 0.22]
liminal-space     = [0.2, 0.7, 0.7, 0.33, 0.15, 0.2, 0.65, 0.58]

slerp(swiss, liminal, 0.3) ≈
  [0.41, 0.77, 0.56, 0.33, 0.68, 0.2, 0.65, 0.33]
```

**Resolverns output:**

- **Palette:** 3 närmsta anchors = `swiss-rationalism`, `liminal-space`,
  `light-mode-sanctuary`. Oklch-blend med vikter `[0.7, 0.3, weighted-
  by-distance]` ger en muted off-white bg + svart text + en kall accent.
- **Typografi:** `(type_drama=0.33, formality=0.56)` → projektion lägger
  oss i "neutral sans-serif"-zon → `Inter / Inter` (eller `Söhne / Söhne`
  om kund-stil säger dyrare).
- **Motion-tier:** `0.33 → tier 1 (Subtle)`.
- **Density-tokens:** `density=0.41 → grid ≈ 9.5 px`. Spacing-skala
  `[8, 16, 24, 32, 48, 64]`.

Resultat: en stil som är *Swiss i typografin* och *Liminal i tomheten*
men inte är någon av dem — den ärver Swiss strukturella precision och
Liminals reducerade tomhet.

## Hard-clamps — kvalitet utan urvattning

Slerp 50/50 mellan diametralt motsatta vektorer (`chroma=0` +
`chroma=1`) ger en urvattnad medel-grötig output: chroma `0.5` är
"halvmättat" — varken pop eller mono. För att förhindra det har
resolvern hard-clamps:

- **APCA Lc body-floor:** text vs bg måste ha `Lc ≥ 75` (matchar
  SKILL.md WCAG-section). Om blend-paletten failar floor, justeras fg's
  L tills den klarar — ALDRIG hue/chroma.
- **Chroma-floor:** minimum `0.15` om alla anchors har palette-pop
  (annars går palette till "muddy gray"). Om alla anchors är genuint
  monokroma (alla har `chroma < 0.2`) tillåts blend stanna under floor.
- **Motion-tier kvantisering:** alltid integer (ingen kontinuerlig
  motion mellan tiers — det ger ryckig animation).
- **Antipod-varning:** om `Ω > π − 0.01` (anchors är ~motsatta) loggas
  `omega_warnings: ['near_antipode']` och clamp tillämpas på chroma +
  contrast_energy för att förhindra urvattning.

Rapporteras i receipt:

```json
"blend_recipe": {
  "anchors": ["swiss-rationalism", "liminal-space"],
  "weights": [0.7, 0.3],
  "vector": [0.41, 0.77, 0.56, 0.33, 0.68, 0.2, 0.65, 0.33],
  "clamps_applied": ["apca_body_floor"],
  "omega_warnings": []
}
```

## När att använda — och inte

**Bra för:**

- "Mellan två stilar"-vision där ingen ensam katalog-stil fångar
  känslan
- Personlig estetik som inte finns i katalogen ("Brutalist-Glass" som
  ingen designer har gett ett namn än)
- Iteration: prova samma blend med olika weights (0.5/0.5 vs 0.7/0.3 vs
  0.85/0.15) tills känslan landar
- Att hitta din egen estetiska adress över tid (sprint 21:s
  `coined-styles` promotar accepterade blends till permanent katalog)

**Mindre bra för:**

- **Nya användare utan katalog-exposure** — de vet inte vilka anchors
  att blanda. Gå via `/visionary-mood` istället för bredare ingång.
- **Konsistensläge över hela appen** — använd `/apply` för att låsa en
  enda stil över hela produkten. Blend per-route blir inkoherent
  estetik.
- **Rapport-style sajter där en ren stil är rätt** — om kunden säger
  "vi vill ha Swiss" är `--blend` bara overhead utan att förbättra
  output. Använd ren stil-väljning.
- **Designsystem för stora team** — blend-output är svår att
  dokumentera ("70 % Swiss + 30 % Liminal" är inte en vokabulär ett
  team kan dela). Använd ren katalog-stil.

## Anti-katalog: blend → coined style

Om samma blend (≥ 85 % vektor-cosine-similarity) accepteras 3+ gånger
över sessioner promotas den till `taste/coined-styles.jsonl`. Sprint 17
lägger persisterings-skelettet (`coined-styles.mjs` stub). Sprint 21
utvecklar detta till full auto-promotion till `styles/extended/` med
Haiku-genererat namn — Visionary blir då självväxande.

Praktiskt betyder det att om du blandat "swiss-rationalism:0.7 +
liminal-space:0.3" tre gånger och behållit alla tre, så får
kombinationen ett namn (t.ex. `quiet-architecture`) i sprint 21 och
visas som en permanent stil i framtida `--style`-listings.

## Källkod

| Fil | Ansvar |
|---|---|
| `hooks/scripts/lib/style-blend.mjs` | Slerp-modul, N-anchor pairwise composition, antipod-detektor |
| `hooks/scripts/lib/style-blend-resolver.mjs` | Vektor → DesignReasoningBrief: palette, typografi, motion-tier, density-tokens |
| `hooks/scripts/lib/blend-parser.mjs` | Strict syntax + NL-parser + axel-substitution-mönster |
| `hooks/scripts/lib/coined-styles.mjs` | Persistens-stub (full impl i sprint 21) |
| `skills/visionary/styles/_embeddings.json` | 202 stilar × 8D-vektorer |
| `skills/visionary/palette-tokens.json` | Pre-baked oklch-paletter per stil |
| `skills/visionary/typography-matrix.json` | Pre-baked font-pairs i (type_drama, formality)-matris |

## Källor (research-grund)

- **Slerp-paper:** Shoemake, K. (1985). "Animating Rotation with
  Quaternion Curves". *SIGGRAPH '85 Proceedings*. — den ursprungliga
  formuleringen av spherical linear interpolation.
- **Style mixing in latent space:** Karras, T. et al. (2019). "A
  Style-Based Generator Architecture for Generative Adversarial
  Networks". [arXiv:1812.04948](https://arxiv.org/abs/1812.04948) —
  StyleGAN visar att linjär kombination av style-codes i latent rymd
  ger meningsfulla blandningar; vi gör motsvarande på sfären.
- **Embedding interpolation for design:** Sprint 11
  [`docs/visual-embeddings.md`](visual-embeddings.md) — DINOv2-mode
  som diversity-mätare. Används i benchmark-verifiering om aktiv.
- **Oklch perceptual color space:** Lilley, C. (2022). "OKLCH in CSS:
  why we moved from RGB and HSL". [W3C CSS Color
  Module 4](https://www.w3.org/TR/css-color-4/#ok-lab) — varför vi
  blandar paletter i oklch och inte hex.

## FAQ

**Q: Är `--blend` annorlunda än `/variants`?**

A: Ja. `/variants` ger 3 fullständiga renders för user-pick (sprint 04).
`--blend` ger en kontinuerlig stil mellan anchors. De kan komboas:
`/variants --blend "swiss:0.7 + liminal:0.3"` ger 3 distinkta renders i
samma blend.

**Q: Vad händer om jag bara anger en anchor?**

A: `--blend` kräver minst 2 anchors. Single-anchor är ren stil-väljning
— använd `/visionary` utan flagga och ange `--style swiss-rationalism`
istället.

**Q: Kan jag spara en bra blend?**

A: Yes — accepterar du blend 3+ gånger persisteras den till
`taste/coined-styles.jsonl` (sprint 17 stub). Sprint 21 ger full
auto-promotion med Haiku-genererat namn.

**Q: Hur många anchors kan jag blanda?**

A: 2–5 är sweet spot. `> 5` returnerar fel — slerp blir matematiskt
ostabil och blend urvattnas. Praktiskt: 2 anchors ger tydlig riktning,
3 ger nyans, 4–5 är experimentellt.

**Q: Vad gör hard-clamps om jag medvetet vill ha urvattnad medel-stil?**

A: Du kan inte stänga av clamps — de är accessibility-floors (APCA Lc
75 är WCAG-krav, inte preferens). Vill du ha lägre kontrast: välj en
annan blend där anchors redan har lågt `contrast_energy` (t.ex.
`hyper-comfort-hygge` + `melancholic`).

**Q: Funkar blend med `/designer`-pack?**

A: Ja. Designer-pack injicerar bias i stil-pool för stage 2 men blend i
stage 2.5 körs efter. Designer-pack kan dock veto:a blend-recipe i
sprint 17 om `--designer` är aktiv (se sprint 15-doc).

**Q: Vad blir CPU/token-kostnaden för blend?**

A: Slerp + resolve är native JS, < 1 ms. Token-cost är 0 — blend
producerar Brief lokalt utan extra Claude-anrop. Hela overhead är vad
stage 2.5 lägger till mellan stage 2 och stage 3.

**Q: Kan blend bryta WCAG-compliance?**

A: Nej. Hard-clamp `apca_body_floor` garanterar Lc ≥ 75 på body-
text/bg. Om anchors har palette-pairings som inte klarar floor justeras
fg-L. 178 blends i benchmark-suite har 0 APCA-violations — det är ett
deterministisk garantied behavior.

## Relaterade docs

- [`docs/mood-slider.md`](mood-slider.md) — Russell circumplex som
  alternativ ingång till blend
- [`docs/anti-typicality.md`](anti-typicality.md) — Sprint 16 verbalized
  sampling + originality-dim
- [`docs/sprints/sprint-17-latent-mixing.md`](sprints/sprint-17-latent-mixing.md)
  — implementation-tasks 33.1–33.8
- [`skills/visionary/SKILL.md`](../skills/visionary/SKILL.md) — Stage
  2.5 i pipeline
