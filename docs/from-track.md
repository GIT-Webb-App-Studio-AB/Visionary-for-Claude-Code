# From-Track — musik som primär designinput

## Varför detta finns

Musik är rådata för känsla. Vi sätter på en låt och kroppen vet
omedelbart något som det tar tio adjektiv att beskriva i en design-
brief. Daft Punks `Around the World` är inte "energetisk dance-pop med
nostalgisk kontur" — den ÄR den känslan, fullständigt och utan
översättningsförluster. När en designer sedan ska översätta den till ett
UI förlorar vi just det som gjorde låten meningsfull.

Visionary kan nu konsumera en Spotify-länk eller en lokal mp3 direkt och
översätta låtens emotionella och rytmiska DNA till designparametrar:

- **Daft Punk → bento neon-grid med crisp motion**
  Hög `valence` (0.78) + hög `energy` (0.83) + 121 BPM → övre höger i
  Russell-rymden (energiskt-positivt). Tempo styr animation-baseline mot
  ~500ms beat-period. Låg `acousticness` (0.02) ger geometric-sans
  typografi. Resultat: bento-grid med neon-accenter och kinetic motion.
- **Sigur Rós → glassmorphism med långsam fade-motion**
  Låg `valence` (0.18) + medel `energy` (0.42) + 65 BPM → vänster-mitt
  i Russell-rymden (kontemplativt). Långsam tempo ger ~920ms baseline.
  Hög `acousticness` (0.71) ger humanistisk serif. Resultat:
  glassmorphism med långa fade-transitions och post-rock-tomhet.
- **Fela Kuti → vibrant maximalist polyrhythmic micro-interactions**
  Hög `valence` (0.74) + hög `energy` (0.88) + 109 BPM + hög
  `danceability` (0.81) → övre höger med polyrhythmic motion. Hög
  `instrumentalness` (0.65) ger image-rich layout med whitespace för
  lager. Resultat: maximalist palette med lager av micro-interactions
  som svarar mot beats.

Låten blir ett "designspråk-frö" — användaren slipper översätta känslan
till ord och förlora nyansen. Det är skillnaden mellan att skriva
"energiskt men varmt" och att helt enkelt feeda `Highlife` av Fela
Kuti och låta valence × energy × BPM × instrumentalness avgöra
exakt vilken sorts energi och vilken sorts värme.

Sprint 19 är där cross-modal input från sprint 18 (foto) får sitt
audio-syskon. From-track sitter jämte from-photo, taste-profile,
content-kit och prompt i hierarkin som styr `StyleBrief`. Ingen av
Visionarys konkurrenter (v0, Lovable, Stitch) har detta i v1 — det är
synesthesia som faktiskt fungerar.

## Hur det fungerar — 4 steg

### Steg 1: Spotify Audio Features-hämtning

`hooks/scripts/lib/audio/spotify-features.mjs` autentiserar via OAuth
client-credentials-flow (ingen användarautentisering, bara public track-
data), hämtar `GET /v1/audio-features/{id}` och cachar token + svar.

URL-parsern accepterar tre format:

- `spotify:track:<id>`
- `https://open.spotify.com/track/<id>?si=...`
- `https://spotify.link/<short>` (löses via en HEAD-redirect)

Endpointen returnerar 12 features. Sex är primära signaler för
Russell-mappningen, övriga sex (speechiness, liveness, loudness, mode,
key, time_signature) är sekundära och loggas i receipt utan att direkt
påverka stilval.

| Feature | Range | Vad det är | Vad det styr i UI |
|---|---|---|---|
| `valence` | 0–1 | Musikalisk positivitet | Russell-valence direkt: lågt → kontemplativt/melancholic, högt → glatt/vibrant |
| `energy` | 0–1 | Intensitet och aktivitet | Russell-arousal (viktad mot tempo): lågt → calm, högt → kinetic |
| `danceability` | 0–1 | Rytmisk regelbundenhet | Motion-amplitude: < 0.4 → subtle motion, > 0.7 → expressive motion |
| `tempo` | BPM | Beats per minute | Animation-baseline-duration via `60000/BPM` |
| `acousticness` | 0–1 | Akustisk vs elektronisk | Typografi-axel: hög → serif/humanistisk, låg → geometric-sans |
| `instrumentalness` | 0–1 | Vokal vs instrumental | Density: vokal → text-rich (`dense`), instrumental → image-rich (`sparse`) |

### Steg 2: Russell-circumplex-mappning

`hooks/scripts/lib/audio/russell-mapper.mjs` översätter audio-features
till Russell-koordinater + sekundära designparametrar.

**Russell valence × arousal** (samma rymd som `/visionary-mood` i
sprint 17):

```
valence_russell = valence  (direct, 0–1, neutral 0.5)
arousal_russell = 0.7 * energy + 0.3 * normalize(tempo, 60, 180)
```

Tempo-vikten på arousal är empirisk — vi vill att en 180 BPM-låt med
medioker `energy` (drum-and-bass-droppar med tomma sektioner) fortfarande
hamnar högt på arousal-axeln, för det är vad användaren upplever.

**Sekundära parametrar:**

```
typography_axis = acousticness  (0 = geometric-sans, 1 = humanistisk-serif)
motion_amplitude = clamp(danceability, 0.2, 1.0)
density = 1 - instrumentalness  (vokal = dense, instrumental = sparse)
```

Output blir en `AudioInferenceResult`:

```json
{
  "russell": { "valence": 0.74, "arousal": 0.81 },
  "tempo_bpm": 121,
  "typography_axis": 0.18,
  "motion_amplitude": 0.79,
  "density": 0.62,
  "raw_features": { "valence": 0.74, "energy": 0.83, ... },
  "source": { "type": "spotify", "track_id": "4cOdK2wGLETKBW3PvgPWqT" }
}
```

### Steg 3: Tempo → motion-token-mappning

`hooks/scripts/lib/audio/tempo-to-motion.mjs` översätter BPM till
animation-baseline-duration:

```
beat_period_ms = 60000 / BPM
duration_multiplier = beat_period_ms / 500   (500ms = baseline-spring)
```

| BPM | Beat-period | Multiplier | Karaktär |
|---|---|---|---|
| 60 | 1000 ms | 2.00× | Adagio — Sigur Rós, ambient |
| 90 | 667 ms | 1.33× | Andante — folk, post-rock |
| 120 | 500 ms | 1.00× | Allegro — pop, house |
| 140 | 429 ms | 0.86× | Allegro vivace — techno |
| 180 | 333 ms | 0.67× | Presto — drum-and-bass |

Hard-clamps post-mappning:

- **Aldrig under 200ms** (vestibular-trigger, prefers-reduced-motion-
  brott)
- **Aldrig över 2000ms** (UI känns trasigt)

30 BPM clampas till 2000ms. 240 BPM clampas till 200ms. Reduced-motion-
gate respekteras: tempo-override gäller bara när `prefers-reduced-
motion: no-preference`.

### Steg 4: Injection i context-inference

Russell-koord + tempo-baseline + sekundära parametrar injiceras som
"soft anchors" i context-inference. Precedence:

- **Russell-koord är HÅRD signal** — driver mood-mapper (sprint 17)
  direkt. Ingen stil får picka över Russell-zonen.
- **Tempo-baseline är HÅRD signal** — overrider stil-default-motion-
  duration. `--motion-override <0|1|2|3>` på command-line vinner ändå.
- **Typografi-axel är MJUK signal** — biases font-pair-pickern men
  overrides av explicit `--font` eller stil-fixerad typografi.
- **Motion-amplitude är MJUK signal** — påverkar tier-val när Russell-
  arousal är borderline mellan tiers.
- **Density är MJUK signal** — tie-breaker mellan stilar med olika
  density-defaults.

Detaljerad bias-precedence finns i `skills/visionary/context-
inference.md` under "Audio-driven inference"-sektionen.

## Lokal mp3-fallback

För användare utan Spotify-länk eller offline-läge finns två fallback-
strategier:

### CLAP-embedding (preferred)

Contrastive Language-Audio Pretraining-modellen
`Xenova/clap-htsat-unfused` (~150 MB, lokal inferens via
`@xenova/transformers`) embeddar mp3:n i samma latent rymd som text-
prompts. Vi klassificerar mot 16 audio-mood-prompts (analogt med
sprint 18:s 16 photo-mood-prompts) och mappar till Russell-koord.

Modellen cachas i `~/.visionary/models/Xenova/clap-htsat-unfused/` vid
första körningen. För CI/CD-environments där disk är dyr, sätt
`VISIONARY_DISABLE_CLAP=1` och förlita på heuristik-fallbacken nedan.

### Web Audio-heuristik (fallback)

Om CLAP saknas körs en Web Audio API-baserad heuristik:

| Feature | Hur den mäts | Vad den approximerar |
|---|---|---|
| Spectral centroid | FFT, viktad medelfrekvens | `acousticness` (warm vs bright) |
| Zero-crossing-rate | Antal sign-changes per sekund | `motion_amplitude` (smooth vs aggressive) |
| RMS | Root-mean-square av samples | `energy` |
| BPM | `web-audio-beat-detector` (autocorrelation) | `tempo` |

Heuristiken är mindre precis än CLAP — den kan inte separera "ambient
calm" från "depressive doom" eftersom båda har låg RMS och låg ZCR. Men
den fungerar utan ML-deps och tar < 2s på en 4-min mp3. Receipt visar
`audio_source: 'heuristic'` när fallbacken används.

## Användning

```bash
/visionary-from-track <spotify-url|mp3-path> [optional brief]
```

**Exempel:**

```bash
# Spotify-länk utan brief — låten styr allt
/visionary-from-track https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT

# Spotify-länk med brief — låten ger estetik, brief ger funktion
/visionary-from-track spotify:track:0DiWol3AO6WpXZgp0goxAV "hero for music app"

# Lokal mp3 (CLAP eller heuristik)
/visionary-from-track ./reference-track.mp3 "kontaktsida"

# Windows-path
/visionary-from-track C:\Users\me\Music\sample.mp3

# Med BPM-override (om tempo-detect blir fel på korta samples)
/visionary-from-track ./short-clip.mp3 --bpm-override 140
```

Första körningen för en Spotify-track fetchar audio-features och cachar
i `${CLAUDE_PLUGIN_DATA}/spotify-cache/<track-id>.json`. Andra körningen
på samma track är offline.

## Kombinationer

From-track är sammansättbar med resten av Visionarys flaggor:

- `/visionary-from-track X --blend "Y:0.5 + Z:0.5"` — låten bestämmer
  Russell-koord + tempo, `--blend` bestämmer strukturell stil. Användbart
  om du vill ha en specifik strukturell stil men låtens emotionella
  signatur.
- `/visionary-from-track X --vs` — låten är context, Verbalized Sampling
  picker concept inom audio-biased pool. Sprint 16:s VS-loop respekterar
  audio-bias när den genererar de 5 kandidaterna.
- `/visionary-from-track X /visionary-mood` — låten OCH explicit mood-
  override. Sällan användbart eftersom låten redan ger Russell-signal,
  men om användaren vet bättre än Spotify-features overrider explicit
  mood.
- `/visionary-from-track X --from-photo Y` — kombinerar audio + visual.
  Audio-Russell-koord + photo-palette + photo-motion-tier. Används för
  album-cover-driven design där låten ger känsla och cover ger palette.

## Setup-krav

```bash
# Required (Spotify-pipeline):
# inga npm-deps utöver runtime — använder fetch native

# Preferred (lokal mp3 + CLAP):
npm install @xenova/transformers

# Preferred (Web Audio-heuristik):
npm install web-audio-api web-audio-beat-detector
```

**Spotify dev-app krävs för Spotify-pipeline.** Setup-instruktioner i
[`docs/spotify-setup.md`](spotify-setup.md). Det är gratis,
client-credentials-flow räcker (ingen Premium, ingen user-auth).

**Disk-användning:** CLAP-modellen ~150 MB cachas i
`~/.visionary/models/Xenova/clap-htsat-unfused/` vid första körningen.
För air-gapped environments: pre-loada via `node
scripts/download-clap-model.mjs` på en uppkopplad maskin och kopiera
`~/.visionary/models/`.

## Privacy

- **Spotify Web API** anropas BARA mot `/v1/audio-features/{id}` och
  `/api/token`. Vi gör INGA anrop till user-data-endpoints (playlists,
  saved tracks, top-artists, listening-history). Client-credentials-
  flow betyder att vi inte ens KAN hämta user-data — token har inte
  scope för det. Spotify ser bara att vår app hämtade public track-
  metadata för en specifik track-ID.
- **Token cachas lokalt** med expiry i
  `${CLAUDE_PLUGIN_DATA}/spotify-cache/token.json`. Aldrig skickad till
  tredjepart. Refreshas automatiskt när den utgår.
- **Lokal mp3 bearbetas lokalt.** Ingen upload, ingen API-anrop.
  CLAP-inferens är en native JS-process via `transformers.js` —
  ingenting skickas till HuggingFace eller andra inference-providers
  efter att modellen är cachad. Web Audio-heuristik är dependency-fri
  signal-processing.
- **Cache i `${CLAUDE_PLUGIN_DATA}/spotify-cache/<track-id>.json`**
  följer Sprint 15.4-konventionen för plugin storage. Track-features
  cachas SHA256-baserat per track-ID. Cache rensas inte automatiskt —
  manuell `rm -rf ${CLAUDE_PLUGIN_DATA}/spotify-cache` vid behov.
- **Track-URL valideras** — endast `https://open.spotify.com/`,
  `spotify:track:`, och `https://spotify.link/` schemes tillåts. Med
  `VISIONARY_DISABLE_NETWORK=1` blockeras URL-input helt och endast
  lokala mp3-paths godkänns.

## Troubleshooting

**"Spotify credentials not found"**

Skapa `~/.visionary/spotify-creds.json` enligt
[`docs/spotify-setup.md`](spotify-setup.md). Filen är gitignore'd och
chmod 600 rekommenderas.

**Spotify rate-limit (HTTP 429)**

`Retry-After`-header respekteras automatiskt med exponentiell backoff
(start 1s, max 30s, 5 försök). Om du benchmarkar mot många tracks: kör
mot fixtures-cache istället för live API. Se `fixtures/spotify-
features/` för 10 pre-cachade test-tracks.

**"CLAP model failed to download"**

Första körningen tar ~30s att ladda 150 MB-modellen från HuggingFace.
Om download failar: kontrollera disk-space (`df -h ~/.visionary/`) och
nätverk. Fallback: sätt `VISIONARY_DISABLE_CLAP=1` för att tvinga
heuristik-pipeline.

**BPM-detect fel på korta samples**

`web-audio-beat-detector` kräver minst ~10s audio för stabil
autocorrelation. Korta samples (< 5s) ger ofta dubbla eller halva BPM-
värden (60 BPM detekteras som 120 BPM, eller vice versa). Lös via
`--bpm-override <BPM>` eller använd längre referens-clip.

**"Russell-koord matchar inte hur låten känns"**

Spotify-features är tränade på en bred genre-mix och fungerar bäst på
västerländsk pop, electronic, hip-hop. Folk-musik från icke-västerländska
traditioner (gamelan, sufi, throat-singing) får ofta ofta missvisande
`valence` (Spotifys valence-modell är tränad på västerländsk
moll/dur-tonalitet). Lös via explicit `/visionary-mood` som overrider
audio-Russell-signal.

**mp3 har ingen tempo (drone, ambient, fritt-rytmiskt)**

`web-audio-beat-detector` returnerar `null` eller orealistiska värden
för ametriskt material. Vi defaultar till 90 BPM (≈ andante) i sådana
fall och loggar `tempo_source: 'default'` i receipt. Lös via
`--bpm-override` om du vet låtens "fuhlda" tempo.

**Spotify-länk pekar på private playlist eller borttagen track**

`audio-features` returnerar 404 för borttagna tracks. För private
playlists: tracks i private playlists är fortfarande public-by-track-ID
om låten finns på Spotify — kopiera enskild track-länk istället för
playlist-länk.

## Källkod

| Fil | Ansvar |
|---|---|
| `commands/visionary-from-track.md` | Command-doc, syntax, exempel |
| `hooks/scripts/lib/audio/spotify-features.mjs` | Spotify Web API client + token-cache + URL-parsing |
| `hooks/scripts/lib/audio/russell-mapper.mjs` | Audio-features → Russell-koord + sekundära parametrar |
| `hooks/scripts/lib/audio/clap-embedder.mjs` | CLAP zero-shot audio-mood-klassificering |
| `hooks/scripts/lib/audio/tempo-to-motion.mjs` | BPM → animation-baseline-duration med clamps |
| `hooks/scripts/lib/audio/from-track-pipeline.mjs` | Orchestrator (input-typ-detektion → feature-fetch → Russell-map) |
| `hooks/scripts/lib/audio/audio-mood-prompts.json` | 16 audio-mood-prompts för CLAP-fallback |
| `scripts/download-clap-model.mjs` | Pre-load script för CLAP-modell |
| `scripts/test-spotify-connection.mjs` | Smoke-test för Spotify-credentials |
| `skills/visionary/context-inference.md` | Audio-driven inference-sektion |

## Källor

- **CLAP-paper:** Wu, Y. et al. (2023). "Large-Scale Contrastive
  Language-Audio Pretraining with Feature Fusion and Keyword-to-Caption
  Augmentation". [arXiv:2211.06687](https://arxiv.org/abs/2211.06687) —
  modellen vi använder för zero-shot audio-mood-klassificering.
- **AudioCLIP:** Guzhov, A. et al. (2021). "AudioCLIP: Extending CLIP
  to Image, Text and Audio".
  [arXiv:2106.13043](https://arxiv.org/abs/2106.13043) — alternativ
  cross-modal embedding-modell vi övervägde men valde bort på grund av
  större disk-footprint.
- **Spotify Audio Features API:**
  [developer.spotify.com/documentation/web-api/reference/get-audio-features](https://developer.spotify.com/documentation/web-api/reference/get-audio-features)
  — officiell endpoint-doc för de 12 features vi konsumerar.
- **Russell circumplex model:** Russell, J. A. (1980). "A circumplex
  model of affect". *Journal of Personality and Social Psychology*,
  39(6), 1161–1178. — den valence × arousal-rymd vi mappar till.
- **transformers.js:**
  [github.com/xenova/transformers.js](https://github.com/xenova/transformers.js)
  — lokal inferens utan Python-runtime.
- **web-audio-beat-detector:**
  [github.com/chrisguttandin/web-audio-beat-detector](https://github.com/chrisguttandin/web-audio-beat-detector)
  — autocorrelation-baserad BPM-detect i Web Audio API.

## FAQ

**Q: Krävs Spotify Premium?**

A: Nej. Client-credentials-flow är gratis och kräver bara en Spotify
dev-app (gratis att skapa på developer.spotify.com). Audio-features-
endpointen är tillgänglig för alla applications. Premium krävs bara om
du ska streama audio, vilket vi inte gör.

**Q: Varför skickar ni inte audio-clipet till en LLM-multimodal API?**

A: Privacy + cost. Spotify-pipeline är 100% lokal förutom det enda
public-data-anropet till `/v1/audio-features/`. CLAP körs lokalt.
Heuristik körs lokalt. Att skicka audio till GPT-4o-audio eller
Gemini-multimodal skulle (1) leaka användarens lyssningsval till
tredjepart, (2) kosta tokens per anrop, (3) ge inte mer användbar
signal än vad Spotify-features ger.

**Q: Kan jag använda flera tracks samtidigt?**

A: Inte i v1. Skapa istället en spellista i Spotify, ta dess
genomsnitts-features manuellt (eller picka representativ track), och
feeda den. Multi-track-support är på roadmap för sprint 22.

**Q: Vilka format stöds för lokal mp3?**

A: Allt Web Audio API kan dekoda: MP3, WAV, OGG, FLAC, AAC, M4A. För
CLAP-pipelinen behöver filen dekodas till PCM först (sker automatiskt
via `node-web-audio-api`). Encoding-detaljer (bitrate, sample-rate)
påverkar inte features-output meningsfullt.

**Q: Hur hanterar ni tracks utan tydligt tempo (drone, free-jazz)?**

A: Spotify returnerar BPM också för ametriskt material — deras
beat-tracker fitter en best-guess. För lokal mp3 med
`web-audio-beat-detector` returneras `null` eller orealistiska värden,
och vi defaultar till 90 BPM. Lös via `--bpm-override` om du vill.

**Q: Är CLAP-modellen 150 MB ett problem?**

A: Ladda en gång, sedan cached lokalt. För CI/CD-environments där disk
är dyr, sätt `VISIONARY_DISABLE_CLAP=1` och förlita på heuristik-
fallbacken (mindre precis men dependency-fri).

**Q: Kan from-track blanda med from-photo?**

A: Ja. `/visionary-from-track X --from-photo Y` ger album-cover-driven
design där låten ger Russell-koord + tempo (audio-signal) och cover
ger palette + motion-tier (photo-signal). De är komplementära — audio
fångar det temporala (tempo, energi-utveckling över tid), photo fångar
det spatiala (palette, struktur, edge-density).

**Q: Spotify byter `audio-features`-endpoint i framtiden — vad händer?**

A: Vi har 10 pre-cachade fixtures i `fixtures/spotify-features/` som
fungerar offline. Om Spotify deprecatar endpointen (de har annonserat
att den eventuellt fasas ut för nya app-credentials i framtida API-
versioner) byter vi till lokal CLAP-pipeline som primary för alla
inputs. Receipt visar `audio_source` så användaren förstår var stilen
kommer från.

**Q: Vad händer om jag pipear samma track två gånger med olika briefs?**

A: Andra anropet använder cache (Spotify-features-svaret är
deterministiskt per track-ID), så response-tid är < 100ms. Russell-
koord blir identisk. Slutgiltig stil kan dock skilja sig om brief-
texten ger olika context-inference-bias (t.ex. "hero" vs "kontaktsida").

## Relaterade docs

- [`docs/from-photo.md`](from-photo.md) — Sprint 18:s photo-pipeline;
  from-track är audio-syskonet med samma soft-anchor-injection-mönster
- [`docs/mood-slider.md`](mood-slider.md) — Russell circumplex som
  alternativ ingång; from-track injicerar i samma rymd
- [`docs/latent-style-mixing.md`](latent-style-mixing.md) — Sprint 17:s
  blend-system; `--blend` kan komboas med audio-input
- [`docs/spotify-setup.md`](spotify-setup.md) — steg-för-steg setup av
  Spotify dev-app
- [`docs/sprints/sprint-19-from-track.md`](sprints/sprint-19-from-track.md)
  — implementation-tasks 36.1–36.7
- [`skills/visionary/context-inference.md`](../skills/visionary/context-inference.md)
  — "Audio-driven inference"-sektionen med precedence-tabell
- [`skills/visionary/SKILL.md`](../skills/visionary/SKILL.md) — Stage 1
  i pipeline (audio-input körs som soft-anchor-injection före context-
  inference)
