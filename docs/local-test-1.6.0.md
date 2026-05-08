# Local Test Guide — Visionary v1.6.0

**Status:** Pre-release lokal-test-build. Ej publicerad till marketplace.
**Branch:** `feat/sprint-16-anti-typicality` (alla 9 sprintar staplade, INGA git commits)
**Datum:** 2026-05-05

## Förutsättningar

- Node ≥ 18
- Claude Code CLI installerat
- Git working tree med branchen `feat/sprint-16-anti-typicality` checkout:ad

## Steg 1 — Verifiera test-suite lokalt

Innan vi installerar i Claude Code, kör samtliga tester:

```bash
cd C:/dev/Visionary-for-Claude-Code

# Run all Sprint 16-24 tests
node --test \
  "hooks/scripts/lib/__tests__/*.test.mjs" \
  "hooks/scripts/lib/critics/__tests__/*.test.mjs" \
  "hooks/scripts/lib/photo/__tests__/*.test.mjs" \
  "hooks/scripts/lib/audio/__tests__/*.test.mjs" \
  "hooks/scripts/lib/cinematic/__tests__/*.test.mjs" \
  "hooks/scripts/lib/constraints/__tests__/*.test.mjs" \
  "hooks/scripts/lib/flow/__tests__/*.test.mjs" \
  "hooks/scripts/lib/voice/__tests__/*.test.mjs" \
  "hooks/scripts/lib/runtime/__tests__/*.test.mjs"
```

**Förväntat:** `733 pass / 0 fail / 8 skip` (skip är sharp-deps som inte är installerat).

## Steg 2 — Installera plugin lokalt i Claude Code

Visionary distribueras som ett Claude Code plugin via `.claude-plugin/`-katalogen. För lokal test:

### Alternativ A — Symlink från ett test-projekt

```bash
# I ditt test-projekt (e.g. ~/test-visionary-v1.6):
mkdir -p ~/.claude/plugins
ln -s C:/dev/Visionary-for-Claude-Code ~/.claude/plugins/visionary-claude

# Eller på Windows (PowerShell):
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\plugins\visionary-claude" -Target "C:\dev\Visionary-for-Claude-Code"
```

### Alternativ B — Via Claude Code CLI (om plugin-install supportas)

```bash
claude plugin install ./Visionary-for-Claude-Code
```

### Verifiera installation

I Claude Code, starta en ny session i ett test-projekt:

```bash
cd ~/test-visionary-v1.6
claude
```

Skriv `/visionary` — du ska se autocompletion eller hjälp för commandet. Skriv `/visionary-mood`, `/visionary-from-photo`, etc. för att verifiera att alla 8 nya commands från 1.6.0 är registrerade.

## Steg 3 — Smoke-tester per sprint

Kör en konkret prompt för varje ny feature för att verifiera att den fungerar end-to-end. Kör i ett nytt tomt test-projekt med en enkel React-skelett (typ Next.js + Tailwind).

### 3.1 — Sprint 16: Verbalized Sampling

```
Designa en hero för en fintech-app
```

**Verifiera:** Receipt-output (om aktiverad) ska visa `vs_concepts: [...]` med 5 entries och `vs_alpha: 0.65`. Generera samma prompt 3 gånger — outputen ska vara mer divers än utan VS.

Toggle off för jämförelse: `VISIONARY_DISABLE_VS=1 claude` → skapa samma component.

### 3.2 — Sprint 17: Latent Style Mixing & Mood

```
/visionary --blend "swiss-rationalism:0.7 + liminal-space:0.3"
Designa en card-komponent
```

**Verifiera:** Output ska kombinera typografisk strikthet (Swiss) med atmosfär/tomhet (Liminal). Receipt har `blend_recipe`.

```
/visionary-mood calm-melancholic
Designa en error page
```

**Verifiera:** Output har desaturated palette, low motion-tier, swiss/liminal-anchors.

### 3.3 — Sprint 18: From-Photo

**Krav:** `npm install sharp` i test-projekt.

```
/visionary-from-photo https://images.unsplash.com/photo-X "hero for travel app"
```

**Verifiera:** Palette i output matchar fotots dominanta färger. Logs visar `palette_method: 'node-vibrant'` (om installed) eller `'histogram'` fallback. CLIP-mood (om transformers.js installed) visas i receipt.

Utan sharp: `npm uninstall sharp && /visionary-from-photo X` → graceful error med install-hint.

### 3.4 — Sprint 19: From-Track

**Krav:** `~/.visionary/spotify-creds.json` med Spotify dev-credentials. Se `docs/spotify-setup.md`.

```bash
node scripts/test-spotify-connection.mjs https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
```

**Verifiera:** Audio Features hämtas. Sedan i Claude Code:

```
/visionary-from-track https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
Designa en landing
```

**Verifiera:** Motion-tier matchar låtens energi. Palette-temperatur reflekterar valence.

### 3.5 — Sprint 20: Cinematic Designer-Packs

```
/visionary-cinematic wong-kar-wai
Designa en about-page
```

**Verifiera:** Palette har warm amber + neon-symbolic. Layout är off-center med dutch-angle moments. Motion har smudge-blur transitions.

```
/visionary-cinematic villeneuve --cinematic-grade
Designa en pricing-page
```

**Verifiera:** Cool monochrome med signal-yellow accent. CSS body har `filter: hue-rotate(-10deg) saturate(0.85) contrast(1.25) brightness(0.90)`.

### 3.6 — Sprint 21A: Constraint-Injection

```
/visionary --constrain
Designa en hero
```

**Verifiera:** Logs visar `constraints_injected` med 1-3 valda constraints. Output respekterar invariants (e.g. "no-rectangles" → alla element har border-radius ≥12px ELLER clip-path).

```
/visionary --constrain "single-color, monospace-headlines"
Designa en card
```

**Verifiera:** Output har EXAKT en hue (+ neutral) och alla h1-h3 är monospace.

### 3.7 — Sprint 21B: Coined-Styles

Generera samma blend 3 gånger med 7+ dagars mellanrum:

```
/visionary --blend "swiss-rationalism:0.7 + liminal-space:0.3"
```

Efter 3 acceptanser, kolla `taste/coined-styles.jsonl` — entry har `accepted_count: 3`. Då promotion-trigger fyrar:

```
/visionary-coined list
```

**Verifiera:** Listan visar promoted-entry med auto-namn (e.g. "calm-rationalism" eller liknande).

```
/visionary-coined view <id>
/visionary-coined rename <id> my-style
```

### 3.8 — Sprint 22A: Cross-Screen Flow

```
/visionary-flow "todo-app with auth"
```

**Verifiera:** 5 filer skapas (list.tsx, detail.tsx, empty.tsx, error.tsx, loading.tsx). Cross-screen critique-loopen kör och rapporterar drift-score per pair. Loading har avsiktligt mer permissiv tolerance än list-vs-detail.

### 3.9 — Sprint 22B: Voice-Tempo

**Krav:** Browser-permission för mic.

```
/visionary-voice
```

Spela in 5s vokalisering ("smoooth ... snap"). **Verifiera:** Genererad spring-config matchar talets prosodi. `bounce` är hög för uppåt-pitch, `visualDuration` reflekterar sustain.

Alternativ via fil:
```
/visionary-voice ./test-audio.wav
```

### 3.10 — Sprint 23: Runtime Context

```
/visionary --runtime circadian
Designa en dashboard
```

**Verifiera:** Output har `<script>` med circadian runtime-snippet inbäddad. Öppna i browser, ändra system-tid → palette skiftar (om inget `prefers-color-scheme` system-pref blockerar).

```
/visionary-patina status ./src/components/Card.tsx
```

**Verifiera:** Output visar age (om filen är committad) + estimated drifts.

```
/visionary-patina freeze 6
```

**Verifiera:** Patina-state frozen at 6 månader.

### 3.11 — Sprint 24: 5 nya stilar

```
/visionary
Designa en hero med tactile-rebellion-stilen
```

**Verifiera:** Output har riso-print-look, hand-skuren typografi, papperstextur. Inga geometriskt-perfekta cirklar.

Repetera för digital-degrowth, insight-first-coach, liquid-glass-lensing, corporate-dropout.

## Steg 4 — Cross-feature kombinationer

Testa att features komponerar korrekt:

```
/visionary --blend "swiss-rationalism:0.7 + liminal-space:0.3" --constrain "single-typeface"
```

```
/visionary-from-photo X --vs --runtime circadian
```

```
/visionary-cinematic wong-kar-wai --blend "swiss-rationalism:0.5"
```

**Verifiera:** Inga crashes, alla flaggor respekteras, output är koherent.

## Steg 5 — Regression-test mot existing features

Säkerställ att ingen 1.5.x-feature är trasig:

```
/visionary-taste              # Sprint 5
/variants                     # Sprint 4
/apply                        # Sprint 7
/annotate                     # Sprint 7
/import-artifact              # Sprint 7
/visionary-kit                # Sprint 7
/visionary-motion             # Sprint 9
/designer rams                # Sprint 15 (print-pack — använder json-loader)
```

**Verifiera:** Alla fungerar oförändrat. Speciellt `/designer rams` — den nya `.md`-loadern ska inte bryta `.json`-laddning.

## Steg 6 — Inspektera filerna manuellt

Efter test, granska vad som faktiskt finns:

```bash
# Lista alla nya och modifierade filer
git status --short

# Diff-by-sprint:
git diff main -- skills/visionary/partials/verbalized-sampling.md           # Sprint 16
git diff main -- hooks/scripts/lib/style-blend.mjs                            # Sprint 17
git diff main -- hooks/scripts/lib/photo/                                     # Sprint 18
git diff main -- commands/visionary-from-track.md                             # Sprint 19
git diff main -- designers/wong-kar-wai.md                                    # Sprint 20
git diff main -- skills/visionary/constraints/                                # Sprint 21
git diff main -- hooks/scripts/lib/flow/ hooks/scripts/lib/voice/             # Sprint 22
git diff main -- hooks/scripts/lib/runtime/                                   # Sprint 23
git diff main -- skills/visionary/styles/internet/digital-degrowth.md         # Sprint 24
```

## Steg 7 — Beslut: merge eller iterate

Efter lokal test, beslut:

### Om allt ser bra ut → merge

Föreslagen commit-strategi (per sprint för bevarad git-history):

```bash
# Skapa en commit per sprint (rebase/cherry-pick approach)
git add docs/sprints/sprint-16-anti-typicality.md docs/sprints/sprint-17-latent-mixing.md ... # alla sprint-docs
git commit -m "docs: sprint 16-24 design specs"

git add agents/critic-originality.md hooks/scripts/lib/verbalized-sampling.mjs ...           # Sprint 16
git commit -m "feat(sprint-16): anti-typicality foundation (Verbalized Sampling + echo-chamber break)"

# ... osv per sprint
```

Eller en stor monolit-commit:
```bash
git add -A
git commit -m "feat(v1.6.0): Sprint 16-24 — Anti-Typicality + Latent Mixing + Cross-modal + Constraints + Runtime Context"
```

Sedan:
```bash
git checkout main
git merge feat/sprint-16-anti-typicality
git tag v1.6.0
git push origin main --tags
```

### Om något inte funkar → iterate

Identifiera vilken sprint/feature som inte fungerar. Antingen:
- Fixa direkt (jag kan dispatcha en agent för specifik sprint-fix)
- Rollback specifik sprint via `git restore <files>` (det händer inget irreversibelt — inga commits)

## Pending tasks (post-merge)

Dessa kräver miljö som lokal-test-environment ofta inte har:

1. **Live benchmarks** för alla 9 sprintar — kräver Playwright + dev-server + faktiska prompts × 50
2. **Sprint 24 embeddings refresh** — `node scripts/build-style-embeddings.mjs` (lägger till 5 nya stilar i `_embeddings.json`)
3. **Sprint 24 reference screenshots** — Playwright-renders i `mockups/sprint-24/`
4. **Sprint 21 v2** — implementera 32 stub-validators (8 implementerade i v1)

## Known issues — fixed 2026-05-08

**Playwright MCP namespace collision** (initial symptom: "Playwright är upptagen", Stage 4 critique-loop blocked). Detta hände när användaren hade BÅDE Visionary's bundlede Playwright OCH ett externt Playwright-plugin registrerade. Fixat i v1.6.0 via:

- `capture-and-critique.mjs` använder nu `mcp__plugin_visionary-claude_playwright__*` (Visionary-bundled namespace) i stället för unprefixed `mcp__playwright__*`
- Disambiguation-note injicerad i critique-instruktioner som varnar att INTE invoka båda Playwright-MCP samtidigt
- Env-override `VISIONARY_PLAYWRIGHT_NS=<prefix>` för manuell namespace-styrning om automatic resolution failar

**Workaround om problemet kvarstår** efter pull av fix:
1. `/plugin disable playwright@claude-plugins-official` (eller annan extern Playwright-plugin)
2. `/reload-plugins`
3. Verifiera: `mcp__plugin_visionary-claude_playwright__*` ska vara enda registrerade Playwright-MCP

## Troubleshooting

**Plugin laddas inte i Claude Code:**
- Kolla `~/.claude/plugins/visionary-claude` symlink existerar
- Kolla plugin.json är gilltig JSON: `cat .claude-plugin/plugin.json | jq .`
- Restart Claude Code session

**Tester failar:**
- Sharp-relaterade skip är OK (8 stycken). Allt annat ska pass.
- Om regression: `git diff main -- <file>` för att se vad som ändrats

**MCP-tools inte tillgängliga:**
- `mcp__playwright__browser_*` kräver Playwright MCP server registrerad
- Sprint 22 voice-mic-recorder fallback: använd audio-fil-input istället

## Kontakt

För frågor under lokal-test: läs sprint-docs i `docs/sprints/` eller status-filer i `results/`.
