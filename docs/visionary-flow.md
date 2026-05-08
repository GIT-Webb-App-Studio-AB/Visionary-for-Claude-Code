# /visionary-flow — Cross-Screen Flow-generering

## Varför detta finns

En komponent är inte färdig förrän alla dess tillstånd känns som om de
hör ihop. Om "loading"-skärmen är skarpare än "list"-skärmen ser hela
funktionen sönder ut — användaren känner det innan de hinner artikulera
varför. Och det räcker inte att göra fem genererings-pass i rad: varje
pass har sin egen idé om vad "samma stil" betyder, och resultatet
driftar i palette, motion-tier och density utan att någonsin överskrida
en per-skärms-kvalitetströskel.

`/visionary-flow` löser problemet genom att betrakta alla fem tillstånd
— **list, detail, empty, error, loading** — som ett enda samlat
artefakt. En gemensam shared-context delas mellan generator-passen, och
en cross-screen critique-loop scorar drift mellan tillstånds-paren och
ber regenerator-passet korrigera det skärmpar som driftar mest.

Wild idea bakom sprinten: en lista som blir gul i empty-state men blå
i list-state är inte två problem, det är ett. Cross-screen är dimensionen
som ingen annan generator för UI tar på allvar.

## Hur kommandot används

```
/visionary-flow "todo-app"
/visionary-flow "users dashboard" --strategy systematic
/visionary-flow "messaging inbox" --single-state loading   # debug-mode
/visionary-flow "search results" --blend "70% Swiss + 30% Brutalist"
/visionary-flow "user profile" --vs "minimalistic"         # anti-prompt
```

Output: en katalog `flow/<feature>/` med fem `.tsx`-filer plus en
`flow.md` som länkar dem och visar en screenshot-grid.

## Pipeline

### Steg 1 — Feature-parsing

Prompten parses till en underliggande resurs ("todos", "users",
"messages") och en domain-sniff (admin, social, productivity, …). Den
underliggande resursen bestämmer mock-data-formerna per state — list får
8 element, detail får ett djupare schema med relationsfält, empty får en
tom-array-rendering, error får ett HTTP-felobjekt, loading får en
skeleton-fixture med samma shape som list-state men med placeholders.

### Steg 2 — Shared design-context

EN gemensam stil-anchor + EN gemensam token-set väljs *innan* state-
genereringen. Detta är det som hindrar drift. Tokens som delas:

- `palette` (DTCG color-tokens, oklch-space)
- `typography` (font-family, scale, line-height)
- `motion` (Motion v12 spring-tokens + duration-tier)
- `density` (spacing-scale, radius-skala)

Varje state-pass får exakt samma token-objekt som input. Endast
content-shape varierar.

### Steg 3 — Parallel render

Fem Playwright-pages renderar de fem tillstånden samtidigt. Samma
URL-bas, olika query-params eller mock-state-prop. Parallell-rendering
håller wall-clock-tiden nära en single-state-rendering eftersom
flaskhalsen är vänta-på-paint, inte CPU.

### Steg 4 — Cross-screen critique-loop

Här är hjärtat. Kritikern tittar inte på en skärm i taget — den jämför
*par*. Med fem tillstånd blir det 10 par (C(5,2) = 10). Varje par
scoras längs fyra drift-dimensioner:

| Dimension              | Vad mäts                                         | Tolerans  |
| ---------------------- | ------------------------------------------------ | --------- |
| Tone-shift             | CIEDE2000 i oklch mellan dominanta paletfärger   | < 0.30    |
| Motion-velocity-shift  | Skillnad i dominant duration-band-tokens         | < 0.25    |
| Density-shift          | White-space-ratio per viewport                   | < 0.20    |
| Palette-shift          | Top-3-färg-frekvens-diff mellan par              | < 0.30    |

De tre värsta paren genererar korrigerande prompts. Exempel:
*"loading-state använder oklch(0.65 0.18 280) men list använder
oklch(0.72 0.12 220) — align loading till list-palette."*

### Steg 5 — State-typ-medvetna tolerance-regler

Inte all variation mellan states är drift. Vissa skärm-paren har
**legitim** variation som critic-loopen måste ignorera, annars hamnar
generatorn i en oändlig "fixa skeleton-skärmen att inte vara skeleton"-
loop. Specialregler:

- **loading ↔ list**: visual-density-skillnad är tillåten upp till
  0.40 (skeleton är *meningen*, det är inte drift). Motion-velocity-
  toleransen sänks dock — laddnings-shimmer ska match list-spring.
- **error ↔ list**: palette-tolerans höjd till 0.50 (röd accent på
  fel-skärmen är legitim, inte drift). Typografi-tolerans skärps —
  fel-state får inte byta typsnitt.
- **empty ↔ list**: motion-tolerans höjd (stillness *is* the design).
  Density-tolerans skärps — empty-state ska kännas som "list utan items",
  inte som en helt annan skärmtyp.
- **detail ↔ list**: density-tolerans höjd (detail har naturligt mindre
  whitespace per innehåll). Palette-tolerans skärps — detail ska bevisa
  att det är samma feature.
- **error ↔ empty**: båda är "icke-data"-states och mätes som ett par
  för att fånga att de visuellt grupperas korrekt — empty får inte se
  ut som en fel-skärm.

Resterande 5 par mäts mot standard-tolerans.

### Steg 6 — Korrigerande regen

Top-3-worst-drifting par skickas tillbaka till generatorn med ett
specifikt korrigerings-direktiv (vilken token som driftar och åt vilket
håll den ska aligneras). Max 2 iterationer; efter det rapporteras drift
som-är i `flow.md` som transparent receipt.

### Steg 7 — Output

```
flow/<feature>/
  list.tsx
  detail.tsx
  empty.tsx
  error.tsx
  loading.tsx
  flow.md         # screenshot-grid + drift-receipt + accessibility-summary
```

`flow.md` innehåller:

- Screenshot-grid (5 viewports som bild eller länkar)
- Drift-tabell (10 par × 4 dimensioner)
- Shared-token-fil (vad alla 5 ärver)
- Accessibility-summary (samma keyboard-flow + samma focus-order delas)

## Single-state fallback

`--single-state <name>` genererar bara ett av de fem tillstånden, hoppar
över cross-screen critique. Användbart när:

- Användaren itererar specifikt på en skärm som behöver tweak utan att
  rubba de andra fyra.
- Debug: isolera vilken state-generator som är problemet.

```
/visionary-flow "todos" --single-state error
```

## Kombinationer

### Med `--blend`

Flow ärver blend-anchor från Sprint 17. Alla 5 tillstånd renderas i samma
blend.

```
/visionary-flow "messaging" --blend "70% Swiss + 30% Brutalist"
```

### Med `--vs` (anti-prompt)

Flow undviker en stil aktivt över alla 5 tillstånd. Cross-screen critique
kontrollerar att inga av de 5 driftar mot anti-stilen.

```
/visionary-flow "users" --vs "boring corporate"
```

### Med `--mood`

Flow ärver Russell-quadrant-input från Sprint 17. Alla 5 tillstånd
sträcker sig mot samma mood-koordinat.

```
/visionary-flow "checkout" --mood "energiskt-positivt"
```

## Accessibility-koherens

Cross-screen-tänket gäller även accessibility. `flow.md` publicerar:

- **Keyboard-flow**: alla 5 tillstånd ärver samma tab-order-kontrakt.
  Loading-state får inte ha fokus-fällor; error-state får inte
  tab-skippa primary action.
- **Focus-anchor**: när användaren navigerar list → detail → tillbaka
  ska focus återvända till list-itemet de klickade. Cross-screen view-
  transition-namn ger morphing-effekt mellan tillstånd.
- **Reduce-motion-fallback**: alla 5 tillstånd måste ha en gemensam
  reduce-motion-väg (samma final-state, ingen translate, opacity-only
  transitions).

## Wall-clock-budget

Förvänta < 90 s end-to-end för en feature med 1 korrigerings-iteration:

- Steg 2 (token-resolve): ~5 s
- Steg 3 (parallel render × 5): ~30 s
- Steg 4 (cross-screen critique): ~10 s
- Steg 6 (regen × top-3 par): ~30 s
- Steg 7 (output + flow.md): ~5 s

Single-state-fallback klarar typiskt < 25 s.

## Trace-events

Alla cross-screen-relaterade events går till `traces/*.jsonl`:

- `flow_start { feature, strategy, blend? }`
- `flow_token_lock { palette_id, motion_tier, typography_id, density }`
- `flow_render_complete { state, viewport, screenshot_path }`
- `cross_screen_drift { state_pair, drift_dims, scores }`
- `flow_correction { pair, dimension, direction, applied }`
- `flow_complete { iterations, final_drift_max, files }`

## Källmoduler

- `commands/visionary-flow.md` — command-doc
- `hooks/scripts/lib/flow/multi-screen-orchestrator.mjs` — Steg 2-3-7
- `hooks/scripts/lib/flow/cross-screen-critique.mjs` — Steg 4-5-6
- `hooks/scripts/lib/flow/__tests__/*.test.mjs` — drift-fixtures + state-typ-rules

## Definition av lyckad flow-generering

1. Alla 5 filer producerade och kompilerar (TS-check grön)
2. Alla 5 ärver samma tokens (verifierat via DTCG-extraction)
3. `flow.md` publicerad med screenshot-grid + drift-tabell
4. Max-drift mellan par < 0.30 efter en iteration
5. Reduce-motion-fallback täcker alla 5 tillstånd
