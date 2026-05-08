# Spotify-setup för from-track

Den här guiden visar hur du sätter upp en Spotify dev-app så att
`/visionary-from-track` kan hämta audio-features. Det är gratis, tar
~3 minuter, och kräver inget Premium-konto.

## Varför detta behövs

`/visionary-from-track <spotify-url>` anropar Spotifys
`/v1/audio-features/{id}`-endpoint för att hämta valence, energy, tempo
m.m. Endpointen kräver en OAuth client-credentials-token, vilken i sin
tur kräver att du har skapat en dev-app på Spotifys developer-portal.

Tokenen genereras av din egen app och cachas lokalt — Spotify ser bara
att din app hämtade public track-metadata. Inga user-data, inga
playlists, ingen lyssningshistorik. Mer i Privacy-sektionen längst ner.

## Steg 1: Skapa Spotify dev-app

1. Gå till **[developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)**
2. Logga in med ditt vanliga Spotify-konto (gratis räcker, Premium krävs
   inte)
3. Klicka **Create app**
4. Fyll i:
   - **App name:** `Visionary local` (eller vad du vill)
   - **App description:** `Local development — audio-features only`
   - **Redirect URI:** `http://localhost:3000/callback` (vi använder den
     inte men fältet är obligatoriskt)
   - **Which API/SDKs are you planning to use?** → bocka för
     **Web API**
5. Acceptera Spotifys Developer Terms of Service
6. Klicka **Save**

## Steg 2: Kopiera Client ID och Client Secret

I din nyskapade app:

1. Klicka **Settings** (uppe till höger på app-sidan)
2. Du ser **Client ID** direkt — kopiera det
3. Klicka **View client secret** — kopiera även det
4. Stäng sidan (du ska INTE dela secret någonstans)

## Steg 3: Skapa creds-fil

Skapa filen `~/.visionary/spotify-creds.json` (Windows:
`%USERPROFILE%\.visionary\spotify-creds.json`) med detta innehåll:

```json
{
  "client_id": "DIN-CLIENT-ID-HÄR",
  "client_secret": "DITT-CLIENT-SECRET-HÄR",
  "_doc": "Client-credentials flow only — no user-auth needed for public track audio-features"
}
```

**På macOS/Linux:** sätt restriktiva permissions:

```bash
mkdir -p ~/.visionary
chmod 700 ~/.visionary
# klistra in JSON ovan i ~/.visionary/spotify-creds.json
chmod 600 ~/.visionary/spotify-creds.json
```

**På Windows:** filen ärver permissions från `%USERPROFILE%`-mappen
vilket redan är user-only-readable. Inga extra steg behövs.

## Steg 4: Säkerställ att filen inte committas

Filen ligger i din hem-katalog (`~/.visionary/`), inte i projekt-roten,
så den är som standard utanför git-tracking. Detta följer vår konvention
för `${CLAUDE_PLUGIN_DATA}` (se Sprint 15.4-doc).

Om du av någon anledning vill placera credentials i projekt-roten
(rekommenderas EJ): se till att `.gitignore` innehåller:

```gitignore
# Spotify credentials
spotify-creds.json
.visionary/
```

Verifiera med:

```bash
git status --ignored | grep spotify
```

Om filen syns under "Untracked files" istället för "Ignored" — fixa
.gitignore innan du committar något.

## Steg 5: Testa anslutningen

Kör test-scriptet med en valfri Spotify-track-länk:

```bash
node scripts/test-spotify-connection.mjs https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
```

Förväntad output:

```
Testing Spotify connection with: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
Track ID: 4cOdK2wGLETKBW3PvgPWqT

Audio Features:
  valence: 0.74
  energy: 0.83
  tempo: 121.0 BPM
  danceability: 0.69
  acousticness: 0.02
  instrumentalness: 0.71

✓ Spotify integration works.
```

Om du ser `✓` — du är klar. `/visionary-from-track` fungerar nu.

Om du ser `✗` — läs error-meddelandet:

- **`credentials not found`** → kontrollera att
  `~/.visionary/spotify-creds.json` finns och är valid JSON
- **`401 Unauthorized`** → client-id eller secret är fel, gå tillbaka
  till dev-portalen och kopiera om
- **`429 Too Many Requests`** → vänta några minuter, du har träffat
  rate-limit (sker vid många snabba test-anrop)
- **`ENOTFOUND api.spotify.com`** → nätverk eller DNS-problem, kontrollera
  internet-anslutning

## Privacy

Visionarys Spotify-integration är medvetet minimal:

- **Endast public-data-endpoint anropas:** `/v1/audio-features/{id}` och
  `/api/token`. Inga user-endpoints (playlists, saved tracks, top
  artists, listening history).
- **Client-credentials-flow** betyder att vi inte ens KAN hämta
  user-data. Tokenen har inte scope för det. Spotify ser bara att din
  app hämtade public track-metadata för en specifik track-ID.
- **Token cachas lokalt** med expiry i
  `${CLAUDE_PLUGIN_DATA}/spotify-cache/token.json`. Aldrig skickad till
  tredjepart. Refreshas automatiskt när den utgår (~1 timme).
- **Ingen user-tracking.** Spotify kan se att din dev-app gör anrop,
  men inte vem som äger appen utöver Spotify-kontot du registrerade
  appen med. Anropen innehåller ingen identifierbar information om
  end-user.
- **Track-features cachas SHA256-baserat per track-ID** i
  `${CLAUDE_PLUGIN_DATA}/spotify-cache/<track-id>.json`. Andra anropet
  på samma track är offline.

Vill du radera all Spotify-data:

```bash
# macOS/Linux
rm -rf ~/.visionary/spotify-creds.json
rm -rf ${CLAUDE_PLUGIN_DATA}/spotify-cache/

# Windows
del %USERPROFILE%\.visionary\spotify-creds.json
rmdir /s %CLAUDE_PLUGIN_DATA%\spotify-cache
```

Vill du dessutom radera dev-appen från Spotifys sida: gå till
[developer.spotify.com/dashboard](https://developer.spotify.com/dashboard),
välj appen, **Settings → Delete app**.

## Felsökning

**"Cannot find module" eller "ESM import error"**

Säkerställ att du kör med Node 18+ (`node --version`). Test-scriptet
använder native `fetch` och ESM-imports.

**Test fungerar men `/visionary-from-track` failar i Claude Code**

Claude Code körs ibland med en annan working-directory eller user-
context än din terminal. Kontrollera att `~/.visionary/spotify-
creds.json` är läsbar för Claude Codes process — på macOS kan
sandboxing blockera access. Lös genom att flytta creds till
`${CLAUDE_PLUGIN_DATA}/spotify-creds.json` istället.

**Vill du använda mp3 istället helt?**

Skip då hela Spotify-setupen och kör bara `/visionary-from-track
./your-file.mp3`. Pipelinen detekterar input-typ automatiskt och hoppar
Spotify-anropet helt om input är en lokal fil.

## Relaterat

- [`docs/from-track.md`](from-track.md) — full dokumentation av
  from-track-pipeline
- [`docs/sprints/sprint-19-from-track.md`](sprints/sprint-19-from-track.md)
  — implementation-tasks
- [Spotify Web API — Get Track's Audio Features](https://developer.spotify.com/documentation/web-api/reference/get-audio-features)
  — officiell endpoint-doc
- [Spotify Authorization — Client Credentials Flow](https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow)
  — flow vi använder
