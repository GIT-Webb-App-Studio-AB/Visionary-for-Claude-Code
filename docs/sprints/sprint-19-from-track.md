# Sprint 19 — From-Track: musik som primär designinput

**Vecka:** 32
**Fas:** 11 — Cross-modal inputs (samma fas som sprint 18)
**Items:** 36 från roadmap (ny)
**Beräknad tid:** 5 dagar
**Mål:** Användaren kan ge Visionary en Spotify-URL eller mp3-fil och få ett UI som ärver låtens emotionella och rytmiska kvaliteter. Spotify Audio Features (valence, energy, danceability, tempo, acousticness, instrumentalness) mappas till Russell circumplex → designparametrar. Tempo styr animation-baseline. Helt unikt — ingen konkurrent har audio-driven UI.

Wild idea: sätt på en låt. Få ett UI som låter som musiken känns. Daft Punk → bento-grid med crisp neon-motion. Sigur Rós → glassmorphism med långsam fade-motion. Fela Kuti → vibrant maximalist med polyrhythmic micro-interactions. Detta är synesthesia som fungerar.

## Scope

- Item 36 — From-Track: Spotify Audio Features-integration, Russell-circumplex-mappare, lokal mp3-fallback (CLAP), `/visionary-from-track` command, tempo→motion-token-mappning, tester och dokumentation.

## Pre-flight checklist

- [ ] Sprint 17 mergad — mood-mapper-dependency (Russell-koord → stilval) finns
- [ ] Spotify dev-app kan skapas av användaren (gratis, client-credentials)
- [ ] `@xenova/transformers` optional för CLAP — fallback-heuristik måste fungera utan
- [ ] Feature-branch: `feat/sprint-19-from-track`

---

## Task 36.1 — Spotify Audio Features-integration [M]

**Fil:** `hooks/scripts/lib/audio/spotify-features.mjs` (ny)

**Vad:** Spotify Web API client för audio-features-endpoint. OAuth via client-credentials-flow (ingen användarautentisering, bara public track-data).

**Steg:**
1. Setup `~/.visionary/spotify-creds.json` (gitignore'd) med `client_id` + `client_secret`.
2. Token-cache med expiry — `POST /api/token` → spara `access_token` + `expires_at`.
3. Track-ID-extraction från URLs: `spotify:track:<id>`, `open.spotify.com/track/<id>?...`, `https://spotify.link/<short>`.
4. `GET /v1/audio-features/{id}` → returnerar 12 features (valence, energy, danceability, tempo, acousticness, instrumentalness, speechiness, liveness, loudness, mode, key, time_signature).
5. Rate-limit-respekt: läs `Retry-After`-header, exponentiell backoff (start 1s, max 30s, 5 försök).

**AC:**
- 5 test-tracks ger valida features (mockad i CI, real i lokal smoke).
- Token cachas korrekt — andra anropet inom expiry använder cache, inte ny token-request.
- Rate-limit-handler triggas på 429-svar och retryar.

---

## Task 36.2 — Russell-circumplex-mappare [M]

**Fil:** `hooks/scripts/lib/audio/russell-mapper.mjs` (ny)

**Vad:** Spotify-features → Russell valence×arousal-koordinater + sekundära designparametrar.

**Steg:**
1. `valence` (0-1) → Russell-valence direct (0-1, neutral 0.5).
2. `energy` (0-1) → Russell-arousal direct, möjligen viktad mot tempo: `arousal = 0.7 * energy + 0.3 * normalize(tempo, 60, 180)`.
3. `tempo` (BPM) → animation-baseline-duration: 60 BPM = 1000ms, 120 BPM = 500ms, 180 BPM = 333ms (linjär omskalning från beat-period).
4. `acousticness` (0-1) → typografi-axel: hög acousticness → serif/humanistisk; låg → geometric-sans.
5. `danceability` → motion-amplitude (subtle vid <0.4, expressive vid >0.7).
6. `instrumentalness` → density: vocal tracks → text-rich (`dense`); instrumental → image-rich, mer whitespace (`sparse`).

**AC:**
- 10 test-tracks från olika genrer (electronic, ambient, classical, hip-hop, metal, jazz, folk, pop, post-rock, afrobeat) producerar logiskt grupperade Russell-koordinater och designparametrar.
- Genre-grupper distinkt placerade i Russell-rymden (ambient i nedre vänster, EDM i övre höger, etc.).

---

## Task 36.3 — Lokal mp3-fallback (CLAP-embedding) [L]

**Fil:** `hooks/scripts/lib/audio/clap-embedder.mjs` (ny)

**Vad:** För användare utan Spotify-link eller offline-läge: lokal CLAP (Contrastive Language-Audio Pretraining) embedding via `@xenova/transformers` (om tillgängligt) eller Web Audio API + heuristik-fallback.

**Steg:**
1. Detektera mp3/wav/ogg input via fil-magic + extension.
2. Försök CLAP-embedding via transformers.js (om modell `Xenova/clap-htsat-unfused` finns lokalt).
3. Fallback-heuristik (Web Audio API):
   - **Spectral-centroid** (warm vs bright) → påverkar palette-temperature.
   - **Zero-crossing-rate** (smooth vs aggressive) → påverkar motion-amplitude.
   - **RMS** (energy-proxy) → arousal.
   - **Tempo-detect** via `web-audio-beat-detector` → animation-baseline.
4. Mappa heuristik-output till samma `AudioInferenceResult`-format som Spotify-pipeline (Russell-koord + sekundära parametrar).

**AC:**
- 5 lokala mp3:er producerar valida Russell-output.
- CLAP-modell-storlek dokumenterad (typiskt ~150 MB; opt-in download).
- Fallback-heuristik dokumenterad och testad (kör utan ML-deps).

---

## Task 36.4 — `/visionary-from-track` command [M]

**Fil:** `commands/visionary-from-track.md` (ny) + `hooks/scripts/lib/audio/from-track-pipeline.mjs` (ny)

**Vad:** `/visionary-from-track <spotify-url|mp3-path> [optional prompt]`. Kör Spotify-pipeline ELLER mp3-pipeline → bygger `AudioInferenceResult` → injicerar som Russell-koordinater i mood-mapper (sprint 17) + tempo som motion-baseline-override.

**Steg:**
1. Command-doc med syntax, exempel, edge-cases.
2. Pipeline detekterar input-typ (URL → Spotify, fil-path → mp3-pipeline).
3. Output: Russell-koord + tempo-baseline + sekundära parametrar (typografi-axel, motion-amplitude, density).
4. Återanvänder mood-mapper från sprint 17 för slutligt stilval — audio fungerar som förstärkare av Russell-signalen, inte ersättare.
5. Receipt visar audio-source: track-titel, artist, BPM, valence×arousal-koord.

**AC:**
- Spotify-track + mp3-fil producerar likartade men inte identiska resultat (CLAP är approximativ).
- Pipeline tar <5s för Spotify, <15s för lokal CLAP.
- Receipt visar audio-källa explicit så användaren förstår var stilen kommer från.

---

## Task 36.5 — Tempo-mappning till motion-tokens [S]

**Fil:** `hooks/scripts/lib/audio/tempo-to-motion.mjs` (ny)

**Vad:** BPM → CSS animation-duration overrides. Komponentens motion-tokens får audio-baseline-prefix när audio-source aktiv.

**Steg:**
1. Mappningstabell BPM→duration: beat-period i ms = 60000/BPM. Skala mot baseline-spring (`ui` = 350ms).
2. Override-injektion i token-pipeline: när `audio_source` finns på StyleBrief, multiplicera alla `visualDuration` med `(beat_period / 500ms)`.
3. Hard-clamp: aldrig under 200ms (för fast — vestibular-trigger) eller över 2000ms (för slow — UI känns trasig), oavsett BPM.

**AC:**
- 60 BPM → ~1000ms baseline. Övriga durations skalas proportionellt.
- Clamp triggar för 30 BPM (clampas till 2000ms) och 240 BPM (clampas till 200ms).
- Reduced-motion-gate respekteras: audio-tempo-override gäller bara när `prefers-reduced-motion: no-preference`.

---

## Task 36.6 — Tester [M]

**Fil:** `hooks/scripts/lib/audio/__tests__/*.test.mjs`

**Coverage:**
- Spotify-mock-test (mockad API-respons från fixture)
- Russell-mapper med 10-track-fixtursvit
- Tempo-mapping-matematik (60/120/180 BPM + clamps)
- mp3-pipeline-mock (heuristik-path, ingen CLAP-modell behövs)
- URL-parsing (alla tre Spotify-URL-format)

**AC:**
- `node --test` grön.
- Mock-Spotify-respons cachad i `fixtures/spotify-features/*.json`.
- Coverage ≥ 80 % på `lib/audio/`.

---

## Task 36.7 — Setup-doc + privacy-policy [S]

**Fil:** `docs/from-track.md` (ny), `docs/spotify-setup.md` (ny)

**Innehåll:**
- Hur skapa Spotify dev-app (gratis): developer.spotify.com → Create app → kopiera client-id/secret.
- Spara client-id/secret i `~/.visionary/spotify-creds.json` (chmod 600).
- Varför OAuth client-credentials inte spårar användaren (ingen user-token, bara public track-data).
- Exempel-tracks med output-screenshots: 5 genrer × 1 komponent.
- Privacy-info: mp3:er bearbetas lokalt, inget upload, CLAP-modell körs i process.
- Troubleshooting CLAP-modell: download-instruktioner, fallback-läge.

**AC:**
- Doc har 3+ visuella exempel.
- Privacy-sektion peer-reviewed mot `docs/taste-privacy.md`-tonen.

---

## Benchmark-verifiering

**Fil:** `results/sprint-19-from-track.md`

**Mätningar:**
- 20 tracks × generation: Russell-koord-distinktion (genre-grupper distinkt placerade), tempo-fidelity (mätbar duration-skillnad mellan 60 BPM och 180 BPM), kvalitativ "matchar låten"-bedömning på 5-skala via 3 reviewers.
- Spotify-pipeline wall-clock: median + p95.
- CLAP-pipeline wall-clock: median + p95.
- Heuristik-pipeline wall-clock (utan CLAP): median + p95.

**AC:**
- Genrer distinkt blockerade i Russell-rymden (ingen genre-grupp överlappar centroid med en annan).
- Reviewers ger ≥ 4/5 medelpoäng på "matchar låten".
- Wall-clock inom budget (<5s Spotify, <15s CLAP, <2s heuristik).

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Spotify rate-limits triggar i benchmark | Hög | Medel | Cache + lokal fixtures för repeat-tester |
| CLAP-modell saknas/laddas långsamt | Medel | Medel | Heuristik-fallback fungerar utan ML |
| Russell-koord från audio-features matchar inte mänsklig perception | Medel | Hög | Reviewer-validation, justera mappnings-vikter empiriskt |
| Spotify Premium krävs för audio-features (det krävs INTE faktiskt) | Låg | Låg | Doc tydlig: client-credentials räcker |
| Lokal mp3 saknar metadata → svår tempo-detect | Medel | Låg | Erbjud `--bpm-override` flagga |

---

## Definition of Done

- [ ] Alla tasks (36.1–36.7) klara
- [ ] Spotify-integration + CLAP-fallback + heuristik-fallback fungerar
- [ ] `/visionary-from-track` command-doc komplett
- [ ] Tempo→motion-token-mappning med clamps verifierad
- [ ] Tester gröna, coverage ≥ 80 %
- [ ] Benchmark visar genre-distinktion och reviewer-score ≥ 4/5
- [ ] `results/sprint-19-from-track.md` publicerad
- [ ] Mergad till `main`

## Amendments

_Tomt._
