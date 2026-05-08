# Network-Aware Visual Budget — design som respekterar bandbredd

## Varför detta finns

Modern frontend-utveckling är optimerad för fiber-uppkopplad
storstadsanvändare. En typisk landing page levererar 2-4 MB JavaScript,
500 KB-3 MB bilder, gradient-tunga hero-sections med blur-bakgrunder och
parallax-scroll. På 4G hemma: instant. På spårvagnen med svag 3G: 4
sekunder. På landsbygden med 2G: timeout.

Network-aware visual budget är Sprint 23:s F4-mekanism: generated UI
levereras i tre tier-nivåer (`full` / `degraded` / `minimal`) och rätt
tier väljs vid runtime baserat på `navigator.connection.effectiveType`
och `saveData`. Stilens **själ** (palette + typografi) bevaras i alla
tre tiers; det är **dekoren** som offras vid begränsad bandbredd.

Effekten: en användare på 2G får samma editorial-stil som en användare
på 4G, men utan motion, gradients, blur och high-res-foton. Sajten
laddar på 1 sekund istället för 12. Brand-konsistens bibehålls;
performance-skuld eliminereras.

## De tre tiers

| Tier | Trigger | Motion | Effekter | Foton |
|---|---|---|---|---|
| `full` | `effectiveType: '4g'` (default) | Tier 0-3 enligt stil | gradients, blur, shadows OK | Full upplösning |
| `degraded` | `effectiveType: '3g'` | Max tier 1 | gradients OK, blur max 4px, shadows minskade | Medium upplösning (1.5x) |
| `minimal` | `effectiveType: '2g' \| 'slow-2g'` eller `saveData: true` | Tier 0 | flat fills, border ersätter blur, ingen shadow | Low-res (1x), `loading=lazy` |

### `full` tier — default

Allt som stilen specificerar är aktivt. Detta är generatedutgångspunkten
och det de flesta användare får. Prestanda-budget: <2.5s LCP på 4G,
<150 KB initial bundle.

### `degraded` tier — för 3G

Motion clampas till tier 1 (subtle hovers, ingen hero-animation). Blur-
filter får max-radie 4px (estetiskt acceptabelt, performance-säkert).
Gradients tillåts men förenklade (max 2 stops). Shadows behålls men
elev-tier reduceras (level 3 → level 1). Foton hämtas i 1.5x-upplösning
(istället för 2x retina).

Prestanda-budget: <3s LCP på 3G, <100 KB initial bundle.

### `minimal` tier — för 2G eller saveData

Motion stängs av helt (motion-tier 0, alla animations: none). Gradients
ersätts med flat fills (första gradient-stop används). Blur ersätts med
border (1px solid med samma färg som blur-tone). Shadows tas bort helt.
Foton hämtas i 1x-upplösning, lazy-loaded, <picture>-fallback till
WebP/AVIF om tillgängligt.

Prestanda-budget: <2s LCP på 2G, <30 KB initial bundle.

## Detection — så väljer vi tier

Tre signaler kombineras (i prioritetsordning):

```js
// hooks/scripts/lib/runtime/network-aware.mjs (förenklat)
function selectTier() {
  // Highest priority: explicit user pref
  if (window.matchMedia('(prefers-reduced-data: reduce)').matches) {
    return 'minimal';
  }

  // Second: saveData header / API
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn?.saveData) return 'minimal';

  // Third: effectiveType
  switch (conn?.effectiveType) {
    case 'slow-2g':
    case '2g':       return 'minimal';
    case '3g':       return 'degraded';
    case '4g':       return 'full';
    default:         return 'full';  // unknown = optimistic default
  }
}
```

`prefers-reduced-data` (CSS L5) vinner alltid. Detta är användarens
explicita signal "spar min data" och måste respekteras oavsett vad
network-API rapporterar (vissa användare har metered 4G).

`saveData: true` är näst — Chrome/Edge sätter detta automatiskt på
"Lite mode" eller när användaren explicit aktiverar Data Saver i
browser-settings.

`effectiveType` är fallback-signalen. Den är heuristisk (browsern
estimar bandwidth från senaste fetches) men tillräckligt bra för
tier-selektion.

### Safari-fallback

Safari implementerar inte Network Information API. För Safari faller vi
tillbaka till:

1. `prefers-reduced-data: reduce` (om användaren satt det)
2. Server-side User-Agent-sniff för "Save-Data: on"-header
3. Default till `full` tier

JS-detection-fallback: vi mäter `navigator.connection`-saknas och
faller direkt till `full`. Safari-användare får alltid full-tier vid
default — det är deras explicit val (eller server-hint) som triggar
nedflyttning.

## CSS — så delivereras tiers

Vi delivererar **3 separata CSS-bundles** och växlar mellan dem via
runtime JS. Alternativ approach (en bundle med media queries) testades
men visade sig fördubbla CSS-storleken.

```html
<!-- Inline detection-script + tier-selektion (~200 bytes) -->
<script>
(function() {
  var tier = (function() {
    if (matchMedia('(prefers-reduced-data: reduce)').matches) return 'minimal';
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return 'full';
    if (c.saveData) return 'minimal';
    switch (c.effectiveType) {
      case 'slow-2g': case '2g': return 'minimal';
      case '3g': return 'degraded';
      default: return 'full';
    }
  })();
  document.documentElement.dataset.netTier = tier;
  var l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = '/styles/component.' + tier + '.css';
  document.head.appendChild(l);
})();
</script>
```

`data-net-tier` på `<html>` exponerar tier till resten av runtime
(coordinator använder det för att välja rätt motion-config).

### CSS-budget per tier

```css
/* component.full.css — ~6 KB */
.hero {
  background: linear-gradient(135deg, oklch(0.95 0.02 240), oklch(0.88 0.05 220));
  filter: blur(0); /* placeholder för animations */
  box-shadow: 0 8px 32px oklch(0.20 0.02 240 / 0.15);
  animation: hero-fade-in 600ms ease;
}

/* component.degraded.css — ~4 KB */
.hero {
  background: linear-gradient(135deg, oklch(0.95 0.02 240), oklch(0.90 0.03 230));
  filter: blur(0);
  box-shadow: 0 4px 16px oklch(0.20 0.02 240 / 0.10);
  animation: hero-fade-in 300ms ease;
}

/* component.minimal.css — ~2 KB */
.hero {
  background: oklch(0.95 0.02 240);  /* flat fill, första gradient-stop */
  border: 1px solid oklch(0.85 0.02 240);  /* border ersätter shadow */
  /* ingen animation */
}
```

minimal-tier är ≤30 % av full-tier i bytes. Det är benchmark-AC från
Sprint 23 Task 42.2.

## Server-hint-stöd: pre-rendering för first-byte-vinst

Browser kan skicka `Save-Data: on`-header på first request. SSR-
servern kan läsa headern och pre-renderar minimal-tier direkt — ingen
flicker mellan full-tier-default och minimal-tier-switch.

```js
// pages/_document.js (Next.js exempel)
export async function getServerSideProps({ req }) {
  const saveData = req.headers['save-data'] === 'on';
  const tier = saveData ? 'minimal' : 'full';
  return { props: { tier } };
}
```

Vid SSR kan servern:
1. Pre-render rätt CSS-bundle inline
2. Pre-render bild-srcset för rätt tier
3. Skippa animation-related JS för minimal-tier

First-byte: ~150ms snabbare för users som signalerar saveData. LCP
förbättras med 200-400ms beroende på bundle-storlek.

## Kod-exempel: budget-CSS + runtime-snippet

```yaml
# tokens/runtime/network-budgets.json
{
  "tiers": {
    "full": {
      "motion_max_tier": 3,
      "blur_max_radius_px": 32,
      "gradient_stops_max": 5,
      "shadow_elev_max": 5,
      "image_dpr_max": 2.0
    },
    "degraded": {
      "motion_max_tier": 1,
      "blur_max_radius_px": 4,
      "gradient_stops_max": 2,
      "shadow_elev_max": 2,
      "image_dpr_max": 1.5
    },
    "minimal": {
      "motion_max_tier": 0,
      "blur_max_radius_px": 0,
      "gradient_stops_max": 1,
      "shadow_elev_max": 0,
      "image_dpr_max": 1.0
    }
  }
}
```

Token-pipeline läser denna fil och genererar 3 CSS-output per
component vid build-time. Ingen runtime-kostnad för transformation —
allt är pre-baked.

## Performance impact

| Mätning | full | degraded | minimal |
|---|---|---|---|
| CSS bundle | ~6 KB | ~4 KB | ~2 KB |
| JS bundle | ~25 KB | ~15 KB | ~8 KB |
| Image weight | 100 % | ~60 % | ~25 % |
| LCP på 4G | 1.8s | 1.6s | 1.4s |
| LCP på 3G | 4.2s | 3.1s | 2.4s |
| LCP på 2G | 12s+ | 8s | 1.9s |
| Initial bundle total | 31 KB | 19 KB | 10 KB |

Mätningar från `results/sprint-23-context-runtime.md` benchmark, 25
test-fixtures.

## Stilens "själ" — vad som ALDRIG offras

Även i minimal-tier bevaras:

- **Palette** — primary, secondary, accent, neutrals. Färgsystem är
  brand-recognition; det får aldrig ändras av tier.
- **Typografi** — font-family, type-scale, line-height. Läsbarhet är
  inviolabel.
- **Layout-rytm** — spacing-tokens, grid-rhythm. Strukturen är vad
  användaren känner igen.
- **Hierarki** — heading-storlekar, weight-relations. Information
  architecture får inte plattas till.
- **Färg-kontrast (APCA Lc 60+)** — accessibility floor är hard.

Det som **offras**:

- Motion (decorative, inte funktionell)
- Gradients (tones)
- Blur-effects (depth-cue, men inte essentiell)
- Shadows (depth-cue)
- High-res foton (när 1x räcker)
- Decorative SVG-illustrationer (när text räcker)

Princip: **information-bärande visuals aldrig, decorative visuals först
i offergrop**.

## Edge-cases

- **Network shift mid-session**: användare börjar på 4G, växlar till
  3G mid-scroll. Vi lyssnar på `connection.change`-event och re-
  swappar CSS-bundle. Smooth transition via `prefers-reduced-motion`-
  respekterande crossfade.
- **`effectiveType: undefined`**: Firefox utan Network Information
  API. Vi defaultar till `full`. Användaren kan sätta
  `prefers-reduced-data` om de vill nedflyttas.
- **Cellular vs WiFi**: vi distinguerar inte. `effectiveType` är
  bandwidth-baserat, inte connection-typ-baserat. Ett 4G-sub som ger
  4 Mbps rapporteras som `4g` även om det är cellular.

## Tester

```
hooks/scripts/lib/runtime/__tests__/network-aware.test.mjs
```

Coverage:
- Mock `navigator.connection.effectiveType: '2g'` → tier `minimal`
- Mock `saveData: true` → tier `minimal` regardless of effectiveType
- Mock `prefers-reduced-data: reduce` → tier `minimal` (highest priority)
- Mock `effectiveType: '3g'` → tier `degraded`
- Mock `effectiveType: '4g'` → tier `full`
- Safari fallback (no `navigator.connection`) → tier `full`
- Tier-switch mid-session via `connection.change`-event

## Källor

- **W3C Network Information API**: w3c.github.io/netinfo/. Editor's
  Draft. `effectiveType` + `saveData` properties.
- **CSS Media Queries Level 5 — `prefers-reduced-data`**:
  drafts.csswg.org/mediaqueries-5/#prefers-reduced-data.
- **Save-Data header**: wicg.github.io/savedata/. Used by Chrome's
  Lite Mode and detected by SSR for pre-rendering.
- **WCAG 2.2 — Reduced Motion (Success Criterion 2.3.3)**: motion-
  tier-0 i minimal-tier samanstämmer med detta.

## Relaterade docs

- [`docs/runtime-context.md`](runtime-context.md) — master-doc för alla 3
  runtime-mekanismer
- [`docs/circadian-design.md`](circadian-design.md) — F1 (companion mechanism)
- [`docs/patina-mode.md`](patina-mode.md) — F7 (companion mechanism)
- [`docs/sprints/sprint-23-context-runtime.md`](sprints/sprint-23-context-runtime.md)
  — Task 42.2
