---
name: visionary-from-track
description: >
  Use a Spotify track or local audio file as primary design input. Visionary
  pulls audio features (valence, energy, tempo, acousticness, danceability,
  instrumentalness), maps them to Russell circumplex coordinates and a
  motion baseline, then feeds the result into Stage 1 inference. The next
  /visionary generation inherits the track's emotional and rhythmic
  qualities — Daft Punk produces a different UI than Sigur Rós, automatically.
  Invoked as /visionary-from-track or /from-track.
---

# /visionary-from-track — Audio-Driven Style Selection

Most users have a song in mind before they have a wireframe. This command
collapses that gap: paste a Spotify URL or point at an mp3, and the next
/visionary generation arrives with the track's mood and tempo already wired
into Stage 1. Audio joins photo, mood-text, taste-profile and prompt as a
first-class input to `StyleBrief` — synesthesia that actually compiles.

This is a signature feature. v0, Lovable, Stitch and bolt.new ship nothing
like it.

## Usage

```
/visionary-from-track <spotify-url|audio-file-path> [optional brief]
```

Examples:

```
/visionary-from-track https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
/visionary-from-track spotify:track:4iV5W9uYEdYUVa79Axb7Rh "marketing site for a dance-music label"
/visionary-from-track ./moodboards/sigur-ros-saeglopur.mp3 "manifesto landing"
/visionary-from-track C:\Users\me\Music\daft-punk-aerodynamic.flac
```

The optional brief composes with whatever Stage 1 derives from the track —
the track carries the *aesthetic*; the brief still names the *product*.

## What it does

The command runs a pipeline in `hooks/scripts/lib/audio/from-track-pipeline.mjs`:

1. **Source detection.** Spotify URL / URI / 22-char ID → Spotify path. Any
   other input is treated as a local audio file.

2. **Feature extraction.**
   - **Spotify path:** `GET /v1/audio-features/{id}` returns valence, energy,
     danceability, tempo, acousticness, instrumentalness (+ speechiness,
     liveness, loudness, mode, key, time_signature). Free OAuth via the
     client-credentials flow — no user-auth, no scopes, no listening history.
   - **Audio-file path:** local CLAP zero-shot ranking via
     `@xenova/transformers` (`Xenova/clap-htsat-unfused`, ~150 MB, opt-in
     download) projects the file onto the same Spotify-features vocabulary.
     If transformers.js is missing, falls back to a heuristic computed
     directly from PCM samples (RMS, zero-crossing rate, spectral centroid,
     autocorrelation-based tempo detection). Both paths produce a uniform
     features object so downstream code stays simple.

3. **Russell mapping** (`hooks/scripts/lib/audio/russell-mapper.mjs`):
   - `valence` → Russell-valence direct (0=sad, 1=happy).
   - `0.7·energy + 0.3·tempo_norm` → Russell-arousal. Tempo carries an
     independent kinetic signal that pure "energy" misses (slow ambient
     tracks with high "energy" still feel less aroused).
   - `tempo` → animation-baseline-ms via beat-period (60 BPM=1000 ms,
     120 BPM=500 ms, 180 BPM=333 ms), hard-clamped to [200, 2000].
   - `acousticness` → typography axis (high → serif/humanist, low → geometric-sans).
   - `danceability` → motion amplitude (subtle / moderate / expressive).
   - `instrumentalness` → density (vocal → text-rich, instrumental → image-rich).

4. **Inject into Stage 1.** The (valence, arousal) coordinates are fed
   through the existing Sprint-17 `mood-mapper` so audio enters the system
   the same way text-mood does. The resulting primary + secondary style
   pools become the `biased_style_pool` SOFT signal for Stage 4 scoring.
   The tempo-derived motion override is HARD: it scales every motion
   token in the StyleBrief proportionally, then re-clamps to [200, 2000]
   ms (see `tempo-to-motion.mjs`).

5. **Receipt.** The next generation's receipt explicitly shows the audio
   source — track title + artist (Spotify only), BPM, valence × arousal
   coordinates, motion-baseline ms — so the bias is transparent.

## Composition with other flags

| Flag / command                   | Track behaviour                                         |
|----------------------------------|---------------------------------------------------------|
| `/visionary --blend "a:0.7+b:0.3"` | `--blend` wins. Track only narrows Stage 2 hints.       |
| `/visionary --vs <style>`        | `--vs` overrides track palette + style pool.            |
| `/visionary-mood <phrase>`       | Both contribute. Track's Russell coord HARD; mood-phrase merges into `biased_style_pool`. |
| `/visionary-from-photo <ref>`    | Both contribute. Photo palette HARD; track tempo HARD. Mood signals merge. |
| `/visionary-taste`               | Permanent-avoid facts override audio picks.             |
| `--motion-override <0..3>`       | HARD-wins over track-derived motion baseline.           |

Explicit user input always beats inferred audio input. Audio is the most
informative *default* — not a lock.

## Privacy

- **Spotify:** the client-credentials OAuth flow grants access to public
  track data only. No user listening history, no library scopes, no scoped
  user token. Spotify sees exactly two requests per track: token-mint and
  audio-features fetch.
- **Local audio files:** never leave the machine. CLAP runs locally via
  ONNX through transformers.js. The heuristic fallback runs in pure JS on
  PCM samples — no network, no upload.
- **Caching:** Spotify access tokens cache in process memory only (not on
  disk). Audio-features responses are not persisted by this command.

## Setup

### Spotify credentials

Create a Spotify app (free) at https://developer.spotify.com/dashboard →
Create app. Copy the Client ID and Client Secret, then save them to:

```
~/.visionary/spotify-creds.json
```

```json
{
  "client_id": "<your-client-id>",
  "client_secret": "<your-client-secret>"
}
```

```sh
chmod 600 ~/.visionary/spotify-creds.json
```

Override the path with `VISIONARY_SPOTIFY_CREDS=/abs/path/to/creds.json`
when you keep credentials elsewhere (1Password CLI, age-encrypted vault, etc.).

### Optional dependencies (none auto-installed)

- **`@xenova/transformers`** — recommended for CLAP-based audio-file
  analysis. First call downloads ~150 MB of model weights into
  `~/.visionary/models/Xenova/clap-htsat-unfused/`. Subsequent calls are
  fully offline. Without it, the heuristic fallback still produces a
  valid result — just lower fidelity.
- **`wavefile`** — improves heuristic accuracy on `.wav` inputs by
  decoding to float-32 PCM. Without it, `.mp3`/`.ogg`/`.flac`/`.m4a`
  files fall through to a metadata-only neutral result (Russell-neutral
  coords). Recommended pre-decode externally if you need precise heuristic
  signals from compressed formats.

## Reference implementation

- Pipeline orchestrator: [`hooks/scripts/lib/audio/from-track-pipeline.mjs`](../hooks/scripts/lib/audio/from-track-pipeline.mjs)
- Spotify client: `hooks/scripts/lib/audio/spotify-features.mjs`
- Russell mapper: `hooks/scripts/lib/audio/russell-mapper.mjs`
- CLAP / heuristic fallback: `hooks/scripts/lib/audio/clap-embedder.mjs`
- Tempo → motion: `hooks/scripts/lib/audio/tempo-to-motion.mjs`
- Tests: `hooks/scripts/lib/audio/__tests__/`

## Acceptance criteria (Sprint 19, Task 36)

- 5 test tracks return valid features (mocked in CI, real in local smoke).
- 10 different tracks across genres produce logically grouped Russell
  coordinates (ambient → low-V/low-A; EDM → high-V/high-A; metal →
  low-V/high-A; folk → low-V/low-A with high acousticness).
- Spotify-track and local mp3 of the same song produce *similar but not
  identical* results (CLAP is approximate by design).
- Pipeline completes in < 5 s for Spotify, < 15 s for CLAP cold start,
  < 2 s for heuristic.
- Receipt explicitly attributes the audio source so the user understands
  where the style came from.

## Edge cases

- **Spotify creds missing.** The pipeline surfaces a one-shot error with
  step-by-step setup instructions for `~/.visionary/spotify-creds.json`.
- **Rate-limited (429).** Respects `Retry-After` header, exponential
  backoff (1 → 30 s ceiling), 5 retries before giving up.
- **Track not found / malformed URL.** Pipeline rejects with a clear error
  before consuming a token request.
- **Local audio file missing or unsupported extension.** Pipeline rejects
  before invoking analyzers. Supported: `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`.
- **CLAP model not yet downloaded.** Falls through to heuristic; receipt
  notes `method: "heuristic-pcm"` so the user knows the fidelity tier.
- **Tempo outside [60, 180] BPM.** Russell-arousal still computes correctly
  via clamping; motion baseline gets the hard-clamp [200, 2000] treatment.

## Related

- `/visionary` — main generation command. Audio state is consumed by Stage 1.
- `/visionary-from-photo` — photo-based primary input. Composes with audio.
- `/visionary-mood` — text-mood input. Composes with audio.
- `/visionary --blend` — explicit anchor recipe. Wins over audio.
- `/visionary-taste` — permanent-avoid facts override audio picks.
