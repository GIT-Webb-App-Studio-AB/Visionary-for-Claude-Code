# From-Photo — foto som primär designinput

## Varför detta finns

Designers använder ofta moodboards: foton som indikerar palette, känsla,
energi. Men när ett moodboard möter en AI-driven UI-generator försvinner
informationen — användaren tvingas själv översätta "den känslan" till
ord, och orden förlorar nyansen som gjorde fotot meningsfullt från
början.

Visionary kan nu konsumera ett foto direkt och översätta dess visuella
DNA till ett UI:

- **Saharas dyner** → varm oklch-palette, låg kontrast, low-motion
  (motion-tier 0–1) → editorial calm UI med varm sand-textur
- **Brutalist betongbyggnad** → kall monokrom, hög edge-density,
  expressive motion (motion-tier 2) → arkitektoniskt strikt UI med
  betong-grov typografi
- **Jenny Holzer-installation** → high-contrast typografi-fokus, minimal
  palette, low-mid motion → text-tung kommunikation där typografi är
  produkten

Foto blir ett "designspråk-frö" istället för en moodboard-bild som
användaren själv måste tolka. Det är skillnaden mellan att säga "gör det
brutalist" och att visa exakt VILKEN brutalist — Tadao Ando är inte
samma som Marcel Breuer är inte samma som Goldfinger. Foto behåller
nyansen.

Sprint 18 är där cross-modal input går från experiment till första-
klass-källa. Foto sitter jämte taste-profile, content-kit och prompt i
hierarkin som styr `StyleBrief` — ingen av Visionarys konkurrenter
(v0, Lovable, Stitch) har detta i v1.

## Hur det fungerar — 4 steg

### Steg 1: Palette-extraktion (sharp + node-vibrant)

`hooks/scripts/lib/photo/extract-palette.mjs` laddar fotot (URL eller
lokal path), cachar via SHA256, resizes till max 800 px (perf), och
extraherar 5 färger via `node-vibrant`: vibrant, lightVibrant,
darkVibrant, muted, darkMuted. Konverteras till oklch via `culori` (eller
inline-fallback om culori saknas).

| Roll | Typisk användning i UI |
|---|---|
| `vibrant` | Primary accent — hero CTA, focus-state |
| `light_vibrant` | Sekundär bakgrund — card-elevation, muted hero |
| `dark_vibrant` | Body text på ljus bg, eller accent på dark mode |
| `muted` | Border, divider, disabled-state |
| `dark_muted` | Body bg på dark mode, footer |

Output normaliseras till `oklch` eftersom det är vad resten av Visionary
talar (palette-tokens, APCA-clamps, blend-resolver). Hex sparas som
fallback för stages som inte kan konsumera oklch direkt.

Dominant temperatur härleds som medel-hue av Vibrant + LightVibrant +
DarkVibrant. Hue 180–270° = `cool`, 0–60° eller 300–360° = `warm`,
annars `neutral`. Det är en grov bucket men tillräcklig för att
inferens-loopen ska veta om Saharas värma matchar `terracotta-warm` eller
om en isberg-foto matchar `nordic-blue`.

### Steg 2: Mood-klassificering (CLIP)

`hooks/scripts/lib/photo/clip-classifier.mjs` klassificerar fotot
zero-shot mot 16 mood-prompts via CLIP ViT-B/32 (`@xenova/transformers`,
~150 MB modell, lokal inferens, ingen API-anrop). Top-3 moods returneras
med softmax-konfidens.

**De 16 mood-prompts** (kopplade till stil-tags i
`lib/photo/mood-prompts.json`):

- `calm_minimal` — "a calm minimal interior, lots of whitespace"
- `industrial_brutalist` — "raw concrete brutalist building"
- `vibrant_maximalist` — "vibrant maximalist colorful poster"
- `editorial_print` — "editorial magazine spread with serif typography"
- `cyberpunk_neon` — "cyberpunk neon nightscape with reflections"
- `natural_organic` — "natural organic landscape, soft sunlight"
- `retro_vintage` — "retro vintage poster with grain"
- `glitch_chaotic` — "glitch art with broken pixels and noise"
- `architectural_sharp` — "modernist architecture, hard shadows"
- `dreamy_pastel` — "dreamy pastel sky, soft gradient"
- `dark_moody` — "dark moody portrait with single key light"
- `playful_zine` — "handmade zine with cut-and-paste collage"
- `cold_sterile` — "sterile laboratory with fluorescent lighting"
- `warm_hygge` — "cozy warm interior with candles and wood"
- `liminal_empty` — "empty liminal space, vacant hallway"
- `data_dense` — "dense information dashboard with many charts"

**Fallback om CLIP inte är installerad:** heuristic-only
klassificering baserad på palette-temperatur + mean-saturation +
edge-density. Mindre precis (kan inte separera "calm-minimal" från
"liminal-empty" eftersom båda har samma palette-signatur), men fungerar
utan ML-deps. Detta är medvetet — vi vill inte krascha hela pipelinen om
användaren av tonintegritetsskäl inte vill ladda en 150 MB-modell.

### Steg 3: Edge-density → motion-tier

`hooks/scripts/lib/photo/edge-detect.mjs` kör Sobel-x/y konvolution via
`sharp`, räknar high-gradient-pixlar, och bucketar resultatet. Hög
edge-density = hög "visuell hetta" som korrelerar med rätt motion-tier
för ett UI som ärver bildens energi.

| Edge-density | Motion-tier | Karaktär | Foto-exempel |
|---|---|---|---|
| < 5 % | 0 (Static) | Tomt, monokromatiskt | öken, dimma, monolit |
| 5–15 % | 1 (Subtle) | Editorial, balanserat | porträtt, lugn arkitektur |
| 15–30 % | 2 (Expressive) | Texturrikt, brutalistiskt | betong, mosaik, ruiner |
| > 30 % | 3 (Kinetic) | Glitch, kaotiskt | neonstad, broken-pixel-art |

Sobel är ett klassiskt edge-filter (Sobel & Feldman 1968) — 3x3-kernel
som approximerar gradient i x- respektive y-led. Magnitude-summan ger en
karta över hur "kantig" varje pixel är, och tröskel `40/255` plockar ut
de pixlar där gradienten är meningsfull (inte JPEG-brus).

### Steg 4: Injection i context-inference

Top-3 mood-styles + extraherad palette + motion-tier injiceras som
"soft anchors" i context-inference. Precedence:

- **Palette är HÅRD signal** — ingen palette-randomization i Step 4.
  Den valda stilens palette-tags måste vara kompatibel med fotots
  oklch-spektrum, annars regenereras paletten via Vibrant-output + stil-
  strukturella regler.
- **Mood är MJUK signal** — `candidate_styles` (top-3 mood-prompts ×
  deras `style_tags`-union) får +20 boost i scoring. Andra stilar får
  -5 om de inte är blocked-defaults. Användaren ska kunna säga
  "ignorera fotot, ge mig swiss-rationalism" och få det.
- **Motion-tier är HÅRD signal** — overrider stil-default. `--motion-
  override <0|1|2|3>` på command-line vinner över foto-inferens.
- **Density är MJUK signal** — `inferred_density` används som tie-
  breaker mellan stilar med olika density-defaults.

Detaljerad bias-precedence finns i `skills/visionary/context-
inference.md` under "Photo-driven inference"-sektionen.

## Användning

```bash
/visionary-from-photo <url-or-path> [optional brief]
```

**Exempel:**

```bash
# URL-foto utan brief — fotot styr allt
/visionary-from-photo https://example.com/sahara.jpg

# Lokal path med brief — fotot ger estetik, brief ger funktion
/visionary-from-photo ./mood-board.png "hero for travel app"

# Windows-path
/visionary-from-photo C:\Users\me\Pictures\holzer.jpg "kontaktsida"

# Foto + motion-override (användaren tycker fotots edge-density är fel)
/visionary-from-photo ./brutalist.jpg --motion-override 1
```

Första körningen för en URL fetchar och cachar SHA256-baserat. Andra
körningen på samma URL är offline — vi läser från cache och hoppar över
nätverket.

## Kombinationer

Foto-input är sammansättbar med resten av Visionarys flaggor. Några
användbara mönster:

- `/visionary-from-photo X --blend "Y:0.5 + Z:0.5"` — fotot bestämmer
  palette, `--blend` bestämmer struktur. Användbart om du gillar fotots
  färg men vill ha en specifik strukturell stil.
- `/visionary-from-photo X --vs` — fotot är context, Verbalized Sampling
  picker concept inom photo-biased pool. Sprint 16:s VS-loop respekterar
  foto-bias när den genererar de 5 kandidaterna.
- `/visionary-from-photo X --mood Z` — fotot OCH explicit mood. Sällan
  användbart eftersom fotot redan ger mood-signal, men om användaren vet
  bättre än CLIP (vilket händer för kulturspecifika moods som
  CLIP-vocabulary missar) overrider `--mood`.
- `/visionary-from-photo X --designer ito` — fotot ger palette + motion,
  designer-pack bias:ar stil-pool. Resultat: Toyo Ito-influerad layout i
  fotots palett.

## Setup-krav

```bash
# Required (foundation):
npm install sharp

# Preferred (better palette + ML):
npm install node-vibrant culori
npm install @xenova/transformers
```

**Disk-användning:** CLIP-modellen ~150 MB cachas i
`~/.visionary/models/Xenova/clip-vit-base-patch32/` vid första
körningen. För CI/CD-environments där disk är dyr, sätt
`VISIONARY_DISABLE_CLIP=1` och förlita på heuristic fallback (ingen
modell laddas).

`sharp` är hård dependency — utan den fungerar varken palette-extraktion
eller edge-detect. Om `npm install sharp` failar på din plattform (sker
ibland på exotiska Linux-distros), bygg från källa via `npm install
sharp --build-from-source`.

`node-vibrant` är preferred men inte hård — utan den faller pipelinen
tillbaka till histogram-baserad k-means palette-extraktion (mindre precis
men fungerande). `culori` är preferred för oklch-konvertering — utan
den används en inline-fallback som approximerar oklch via en förenklad
matris (acceptabel för palette-extraktion men inte lika perceptuellt
korrekt som culori).

## Privacy

Foton bearbetas **lokalt**. Ingen upload, ingen API-anrop till
tredjepart. Specifikt:

- **CLIP körs lokalt** via `transformers.js` — inferens är en native JS-
  process, inget skickas till HuggingFace eller andra inference-providers
  efter att modellen är cachad.
- **Cache i `${CLAUDE_PLUGIN_DATA}/photo-cache/<sha256>.png`** följer
  Sprint 15.4-konventionen för plugin storage. URL-foton fetchas en gång
  och cachas SHA256-baserat. Cache rensas inte automatiskt — manuell
  `rm -rf ${CLAUDE_PLUGIN_DATA}/photo-cache` vid behov.
- **Foto-URL valideras** — endast `http://` och `https://` schemes
  tillåts, för att förhindra `file://`/`data:`-injection som SSRF-
  vektor. Med `VISIONARY_DISABLE_NETWORK=1` blockeras URL-input helt
  och endast lokala paths godkänns.
- **Sensitive content** — vi resize:ar till thumbnail (max 800 px)
  innan analys. Originalbilden cachas men aldrig bearbetas i högre
  upplösning än thumbnail. Om du laddar upp ett foto av misstag och
  vill radera det, leta upp `${CLAUDE_PLUGIN_DATA}/photo-cache/` och
  radera den specifika SHA256-filen.

## Troubleshooting

**"sharp is required but not installed"**

`npm install sharp`. På Apple Silicon kan du behöva `npm install sharp
--platform=darwin --arch=arm64`. På exotiska Linux-distros: `npm
install sharp --build-from-source`.

**CLIP-modellen laddar långsamt första gången**

Första körningen tar ~30 s att ladda 150 MB-modellen från HuggingFace.
Sedan cachat lokalt och sub-3 s inferens. Du kan pre-loada genom att
köra `node scripts/download-clip-model.mjs` separat innan första
genereringen.

**node-vibrant ger ojämn palette på låg-kontrast-foton**

Vanligt på foton med få distinkta swatches (t.ex. dimma, monokromatiskt
landskap). Pipelinen detekterar detta automatiskt — om Vibrant returnerar
< 3 valida swatches faller den tillbaka till histogram k-means. Receipt
visar `palette_fallback: 'histogram_kmeans'` när det händer.

**"Paletten matchar inte fotot"**

Två vanliga orsaker: (1) lågupplöst input där JPEG-artefakter förvirrar
Vibrant — lös genom att ladda upp originalfilen istället för en
komprimerad version; (2) foton med transparent eller white-balanced
bakgrund där bakgrunden dominerar — Vibrant tycker bg-färgen är
"dominant" och paletten urvattnas. Lös genom att croppa fotot manuellt
innan input.

**"Motion-tier känns fel"**

Vanligt på foton med mycket text (high edge-density utan visuell hetta —
typografi ger Sobel-edges utan att fotot är "kinetic"). Använd
`--motion-override 0|1|2|3` för att overrida. Vi dokumenterar detta
medvetet — Sobel är inte en mood-detector, det är en gradient-counter.

**Foto-URL pekar på sensitive content**

Vi gör ingen content-moderation. Resize till thumbnail innan analys är
den enda säkerhetsåtgärden. Om du behöver garanti mot sensitive content,
moderera input-flödet uppströms eller använd lokala paths istället för
URL.

**CLIP-mood-klassificering är fel**

16 prompts är begränsade. CLIP är tränad på engelska och västerländsk
visual-corpus — kulturspecifika moods (södra-asiatisk färgpalett,
japansk wabi-sabi, brasiliansk modernism) klassificeras ofta som
generisk "vibrant_maximalist" eller "natural_organic". Lös via
`--mood`-flaggan som overrider CLIP, eller via community-PR med utökad
mood-vocabulary i `lib/photo/mood-prompts.json`.

## Tekniska detaljer

### SHA256-cache-invalidation

Cache-nyckel är SHA256 av input-strängen (URL eller absolute path),
inte SHA256 av fil-innehållet. Det betyder att om en URL pekar på en
bild som ändras över tid (CDN med samma URL men nytt innehåll) får du
gamla resultat. Lös genom att rensa cache: `rm
${CLAUDE_PLUGIN_DATA}/photo-cache/<sha256>.png`. För lokala paths är
detta sällan ett problem eftersom path implicit är immutable.

### Sharp Sobel kernel-design

Vi använder den klassiska 3x3-kernelen (Sobel & Feldman 1968) snarare
än mer moderna alternativ (Scharr, Prewitt) eftersom Sobel är vad
`sharp.convolve()` exposear nativ stöd för. Magnitude-tröskel `40/255`
är empiriskt vald över 30 test-foton — högre tröskel missar subtila
texturer, lägre fångar JPEG-noise.

### CLIP-prompt-tuning

De 16 prompts är handgjorda för att vara semantiskt distinkta.
Konkret skiljer vi t.ex. `calm_minimal` ("calm minimal interior, lots
of whitespace") från `cold_sterile` ("sterile laboratory with
fluorescent lighting") för att fånga skillnaden mellan zen-tomhet och
klinisk-tomhet — båda är tomma, men den första är varm-lugn och den
andra är kall-funktionell. Mood-prompts mappar sedan till
`style_tags`-arrays som är union:ade till `candidate_styles` i
context-inference.

Att lägga till en mood: editera `lib/photo/mood-prompts.json` med ny
`{ id, prompt, style_tags }`-entry. CLIP-text-embedding regenereras
automatiskt vid nästa körning (cachas i `${CLAUDE_PLUGIN_DATA}/clip-
text-embeddings.json`).

### Fallback-strategin när CLIP saknas

Heuristic fallback:

```
mood_proxy = score(palette_temperature, mean_saturation, edge_density)
```

`warm + high-saturation + high-edge` → `vibrant_maximalist`-bucket.
`cool + low-saturation + low-edge` → `calm_minimal`-bucket. Etc. Det
är 5 buckets totalt (vs CLIP:s 16) — mindre precist men deterministiskt
och dependency-fritt. Receipt visar `mood_source: 'heuristic'` när
fallback används.

## Källkod

| Fil | Ansvar |
|---|---|
| `commands/visionary-from-photo.md` | Command-doc, syntax, exempel |
| `hooks/scripts/lib/photo/extract-palette.mjs` | Palette-extraktion via sharp + node-vibrant |
| `hooks/scripts/lib/photo/clip-classifier.mjs` | CLIP zero-shot mood-klassificering |
| `hooks/scripts/lib/photo/edge-detect.mjs` | Sobel-edge-density → motion-tier |
| `hooks/scripts/lib/photo/from-photo-pipeline.mjs` | Orchestrator (parallell körning) |
| `hooks/scripts/lib/photo/mood-prompts.json` | 16 mood-prompts + style-tag-mappningar |
| `scripts/download-clip-model.mjs` | Pre-load script för CLIP-modell |
| `skills/visionary/context-inference.md` | Photo-driven inference-sektion |

## Källor

- **CLIP-paper:** Radford, A. et al. (2021). "Learning Transferable
  Visual Models From Natural Language Supervision".
  [arXiv:2103.00020](https://arxiv.org/abs/2103.00020) — den
  ursprungliga zero-shot-kapabiliteten vi använder.
- **transformers.js:**
  [github.com/xenova/transformers.js](https://github.com/xenova/transformers.js)
  — lokal inferens utan Python-runtime.
- **Sobel-edge-detection:** Sobel, I. & Feldman, G. (1968). "A 3x3
  Isotropic Gradient Operator for Image Processing". Stanford AI
  Project. — den klassiska 3x3-kernel-formuleringen.
- **node-vibrant:**
  [github.com/jariz/node-vibrant](https://github.com/jariz/node-vibrant)
  — Android-Palette-portens JS-version, ger oss 5-swatch
  vibrant/muted-palette.
- **culori:**
  [github.com/Evercoder/culori](https://github.com/Evercoder/culori)
  — color-space-konvertering, primärt för oklch.
- **OkLCH perceptual color space:** Lilley, C. (2022). "OKLCH in
  CSS: why we moved from RGB and HSL".
  [W3C CSS Color Module 4](https://www.w3.org/TR/css-color-4/#ok-lab)
  — varför vi blandar paletter i oklch och inte hex.

## FAQ

**Q: Kan jag använda flera foton samtidigt?**

A: Inte i v1. Skapa istället en collage-foto (e.g. via Figma) och
feed:a den. Sprint 19 (from-track) komboas med from-photo via separata
anrop — du kan ge ett foto OCH en spotify-track i samma session och få
audio-visual-blandning, men det är två separata commands.

**Q: Vilka format stöds?**

A: Allt sharp stödjer: JPG, PNG, WebP, AVIF, TIFF, GIF (statisk), SVG
(rasteriseras). Animated GIF: bara första frame extraheras. HEIC stöds
inte direkt — konvertera till JPG/PNG först.

**Q: Min CLIP-mood-klassificering är fel — hur förbättrar jag?**

A: 16 prompts är begränsade. Community-PR med extended mood-
vocabulary välkomna. Tills dess: explicit `--mood` flagga overrider
CLIP-output. För kulturspecifika moods (södra-asiatisk färgmättnad,
japansk wabi-sabi) är `--mood` ofta nödvändig.

**Q: Är CLIP-modellen 150 MB ett problem?**

A: Ladda en gång, sedan cached lokalt. För CI/CD-environments där disk
är dyr, sätt `VISIONARY_DISABLE_CLIP=1` och förlita på heuristic
fallback. För air-gapped environments: pre-loada modellen via `node
scripts/download-clip-model.mjs` på en uppkopplad maskin och kopiera
`~/.visionary/models/` till target-maskinen.

**Q: Kan from-photo blanda med --blend?**

A: Ja. `from-photo` ger fotot rollen som "context-anchor" och `--blend`
opererar separat på stil-vektor-rymden. Konkret: foto bestämmer palette
+ motion-tier (hårda signaler), `--blend` bestämmer strukturell stil
(via slerp i 8D). De stör inte varandra.

**Q: Hur hanterar pipelinen RAW-foton (CR2, NEF, DNG)?**

A: Stöds inte. Sharp har ingen RAW-decoder i base-installationen.
Konvertera till JPG/PNG via Lightroom/Darktable först. Vi prioriterar
inte RAW-stöd eftersom moodboard-användning typiskt sker med
publikations-format (JPG/PNG från Pinterest, Are.na, instagram).

**Q: Är there a way to skip mood-klassificering helt?**

A: Sätt `VISIONARY_DISABLE_CLIP=1` — då körs bara palette + edge-detect
och mood-fältet i receipt är `'heuristic'`. Användbart om du bara vill
ärva fotots palette utan att låta CLIP gissa mood.

**Q: Foto-URL kräver autentisering (private CDN, S3 signed URL)?**

A: V1 stöder inte custom-headers. Lös genom att (1) ladda ner fotot
manuellt och feed:a lokal path, eller (2) använd en kort-livad signed
URL som funkar utan headers. Custom-auth via miljövariabler är på
roadmap för Sprint 20.

## Relaterade docs

- [`docs/latent-style-mixing.md`](latent-style-mixing.md) — Sprint 17:s
  blend-system; `--blend` kan komboas med foto-input
- [`docs/anti-typicality.md`](anti-typicality.md) — Sprint 16:s
  Verbalized Sampling; `--vs` respekterar foto-bias när den genererar
  de 5 kandidaterna
- [`docs/sprints/sprint-18-from-photo.md`](sprints/sprint-18-from-photo.md)
  — implementation-tasks 35.1–35.7
- [`skills/visionary/context-inference.md`](../skills/visionary/context-inference.md)
  — "Photo-driven inference"-sektionen med precedence-tabell
- [`skills/visionary/SKILL.md`](../skills/visionary/SKILL.md) — Stage 1
  i pipeline (foto-input körs som soft-anchor-injection före
  context-inference)
