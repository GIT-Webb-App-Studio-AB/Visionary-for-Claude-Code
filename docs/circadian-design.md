# Circadian Design — palette som följer dygnets rytm

## Varför detta finns

Människor har inbyggd cirkadisk rytm. Cortisol toppar morgonen,
melatonin släpper kvällen, perceptuell kontrastkänslighet shiftar med
omgivningsljus. En sajt som ser identisk ut klockan 02:00 som klockan
14:00 ignorerar 50 % av kontexten i varje besök.

Circadian palette-shift är Sprint 23:s F1-mekanism: generated stiles får
ett valfritt 4-fas-block (`dawn`, `day`, `dusk`, `night`) och en runtime-
modul shiftar CSS custom properties var 15 minut baserat på lokal-tid +
soltider. Stilen byts inte ut — det är **samma editorial calm-stil** som
ändrar tonläge mellan morgon och kväll.

Effekten är subtil och avsiktlig. En användare som besöker sajten
klockan 09:00 ser den i `day`-tonläge — saturerad, hög-kontrast, kall
hue. Samma användare klockan 21:00 ser den i `dusk`-tonläge — varmare,
lägre chroma, mjukare kontrast. Ingen byter stil. Sajten andas dygnets
rytm.

## De fyra faserna

```
dawn   ─ från civil dawn till sunrise (~30 min före → 30 min efter)
day    ─ från sunrise till civil dusk
dusk   ─ från civil dusk till nautical dusk (~60 min)
night  ─ från nautical dusk till civil dawn nästa dag
```

| Fas | Karaktär | Typisk palette-shift från base |
|---|---|---|
| `dawn` | Mjuk, kall, vaknande | Lägre chroma (-0.04), kallare hue (+8° mot blå), högre L (+5%) |
| `day` | Mättat, hög-kontrast, alert | Base palette utan shift, full chroma |
| `dusk` | Varm, dämpad, transitional | Varmare hue (-12° mot orange/röd), lägre chroma (-0.05) |
| `night` | Låg-kontrast, mörk, dämpad | Lägre L (-15%), saturate +0.02 i accent, mjuk chroma |

Värdena ovan är defaults för editorial-stilar. Per stil kan derivat
överridas i style-dokumentet.

## Hur det fungerar — runtime

```js
// hooks/scripts/lib/runtime/circadian.mjs (förenklat)
import SunCalc from 'suncalc';

function currentPhase(now, lat, lon) {
  const times = SunCalc.getTimes(now, lat, lon);
  const h = now.getTime();

  if (h < times.dawn.getTime())            return 'night';
  if (h < times.sunrise.getTime() + 30*60_000) return 'dawn';
  if (h < times.dusk.getTime())            return 'day';
  if (h < times.nauticalDusk.getTime())    return 'dusk';
  return 'night';
}

function applyPhase(phase) {
  const palette = window.__VIS_CIRCADIAN__[phase];
  Object.entries(palette).forEach(([k, v]) => {
    document.documentElement.style.setProperty(`--circadian-${k}`, v);
  });
}

// Init + 15-min-loop + visibilitychange
applyPhase(currentPhase(new Date(), LAT, LON));
setInterval(() => applyPhase(currentPhase(new Date(), LAT, LON)), 15 * 60_000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) applyPhase(currentPhase(new Date(), LAT, LON));
});
```

**Latitud/longitud** härleds från browser-locale-region (default
Stockholm 59.3°N, 18.1°E vid avsaknad). Vi använder INTE Geolocation
API — det kräver permission-prompt och vi hade inget värde att leverera
i utbyte.

**`suncalc`** är ~3 KB minified, MIT-licens, ingen runtime-deps.
Alternativ: approximations-formel via Date-only (svårare att verifiera,
mindre exakt vid hög/låg latitud). Vi väljer suncalc för precision.

## Hard-floor: prefers-color-scheme system-pref

`prefers-color-scheme` system-pref vinner ALLTID över circadian. Logiken:

```js
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const phase = currentPhase(now, lat, lon);

// Om system säger dark, hoppa direkt till night-palette oavsett tid
const effectivePhase = systemDark ? 'night' : phase;
applyPhase(effectivePhase);
```

Det betyder: en användare som explicit valt `prefers-color-scheme: dark`
i OS får aldrig "day"-palette, även om klockan är 14:00. Circadian
respekterar användarens medvetna val.

`prefers-color-scheme: light` har inverse-logiken — circadian går aldrig
till "night", den stannar i `dusk` som mörkaste fas.

Vid `prefers-color-scheme: no-preference` (default på de flesta
browsers): full circadian-cykel.

## Smooth transition — 800ms ease

Mellan faser interpolerar vi CSS custom properties via 800ms ease-in-out.
Varför 800ms?

- Snabbare (200ms): user märker shift mid-flow → confusion
- Långsammare (2000ms): user märker animation, känns "live"-laggig
- 800ms: precis under medveten perception-tröskel, känns som naturlig
  ljusförändring

```css
:root {
  --transition-circadian: 800ms cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  background: var(--circadian-bg);
  color: var(--circadian-fg);
  transition:
    background var(--transition-circadian),
    color var(--transition-circadian);
}
```

Vid `prefers-reduced-motion: reduce` ersätts transition med 0ms (instant
switch). Användaren ser ingen animation alls — paletten bara byts.

## När använda — lämpliga stilar

| Stil-kategori | Lämplig för circadian? | Skäl |
|---|---|---|
| Editorial / läs-fokuserade | Ja | Tonen drar nytta av dagens rytm |
| Content-tunga sajter | Ja | Långa läs-sessioner gynnas av att paletten andas |
| Personliga / hobby-sajter | Ja | Subjektiv "min sajt"-känsla förstärks |
| Dashboards / verktyg | Nej | Konsistens > rytm; user behöver palett-stabilitet |
| E-commerce produktsidor | Nej | Brand-färgen får inte shifta — köp-trigger-impact |
| Marknadssidor | Nej | Brand-konsistens > kontextuell rytm |
| Konsumentapps med high-trust | Nej | Förtroende kräver konsistens |

## När INTE använda

- **Brand-tunga sajter** där paletten ÄR brandet (Coca-Cola-röd,
  Spotify-grön). Circadian skulle förstöra brand-recognition.
- **Konversion-fokuserade landing pages** där A/B-testen redan är
  optimerad mot en specifik palette. Circadian introducerar variabel
  som inte är kontrollerad.
- **Tids-känsliga interfaces** (live-trading, sport-scores, video) där
  varje sekund av attention räknas. Palette-shift mid-flow kan
  distrahera.
- **Healthcare / safety-critical** UI där predictability är ett krav.

## Kod-exempel: stil-fil med circadian-block

```yaml
# styles/editorial-calm.yaml
id: editorial-calm
name: Editorial Calm
base:
  palette:
    bg: "oklch(0.98 0.01 240)"
    fg: "oklch(0.20 0.02 240)"
    accent: "oklch(0.55 0.15 240)"

circadian:
  enabled: true
  dawn:
    bg: "oklch(0.96 0.02 220)"     # +chroma, kall hue, något lägre L
    fg: "oklch(0.25 0.03 220)"
    accent: "oklch(0.50 0.18 220)"
  day:
    bg: "oklch(0.98 0.01 240)"     # base — full clarity
    fg: "oklch(0.20 0.02 240)"
    accent: "oklch(0.55 0.15 240)"
  dusk:
    bg: "oklch(0.94 0.03 60)"      # varm hue (orange-shifted)
    fg: "oklch(0.22 0.04 60)"
    accent: "oklch(0.55 0.18 60)"
  night:
    bg: "oklch(0.18 0.02 240)"     # låg L, dämpad
    fg: "oklch(0.85 0.02 240)"
    accent: "oklch(0.65 0.18 240)"
```

Vid generation läser pipeline:n `circadian.enabled: true` och inkluderar
runtime-modulen i output. Body-injection sker i `<head>`:

```html
<script>
window.__VIS_CIRCADIAN__ = {
  dawn:  { bg: '...', fg: '...', accent: '...' },
  day:   { bg: '...', fg: '...', accent: '...' },
  dusk:  { bg: '...', fg: '...', accent: '...' },
  night: { bg: '...', fg: '...', accent: '...' }
};
</script>
<script src="/runtime/circadian.min.js" async></script>
```

Total runtime-impact: ~1.0 KB minified (CSS + JS kombinerat).

## Latitud-edge-cases

Circadian behöver lat/lon för soltids-beräkning. Ovanlig fall:

- **Polära regioner (>66.5°N/S)** under polarnatten/midnattssolen: `suncalc`
  returnerar `Invalid Date` för sunrise/sunset. Vi faller tillbaka till
  klock-baserad fas (dawn 06:00, day 09:00, dusk 18:00, night 21:00) i
  lokal-tid.
- **Ekvatorial-regioner**: dawn/dusk-fönster är extremt korta (~10 min).
  Vi expanderar till minst 30 min varje fas för att undvika abrupt shift.
- **Locale-saknas**: default Stockholm (59.3°N, 18.1°E). Detta är
  Visionarys "home base" och en rimlig medelvärdes-latitud för EU/US-
  användare.

## Performance + bundle-size

- CSS: ~0.4 KB (4 fas-paletter à ~100 bytes vardera, deklarerade som
  CSS custom properties)
- JS runtime: ~0.6 KB (suncalc-call + 15-min-interval + visibilitychange)
- suncalc: ~3 KB (men chunkas separat och cachas, så amortiseras över
  alla circadian-aktiva sajter)
- LCP-impact: <30ms vid first-paint
- Setup-cost: 0ms vid generation (allt är pre-baked i style-dokumentet)

## Tester

```
hooks/scripts/lib/runtime/__tests__/circadian.test.mjs
```

Coverage:
- 4 timestamps × 5 latituder ger korrekt fas
- `prefers-color-scheme: dark` overrider mid-day-call
- `prefers-color-scheme: light` clampar bort `night`-fas
- Polar-edge-case (latitud 78°N i december) ger fallback till klock-fas
- Ekvatorial-edge-case (latitud 0°) expanderar dawn/dusk-fönster
- Smooth transition är 800ms vid normal motion-pref, 0ms vid reduced

## Källor

- **suncalc**: github.com/mourner/suncalc, MIT license. Astronomi-formler
  från Jean Meeus "Astronomical Algorithms".
- **Cirkadisk perceptuell kontrastkänslighet**: Roenneberg, T. (2012),
  "Internal Time: Chronotypes, Social Jet Lag, and Why You're So Tired".
  Harvard University Press.
- **CSS `prefers-color-scheme`**: W3C Media Queries Level 5.
- **OkLCH för palette-shifts**: Lilley, C. (2022). "OKLCH in CSS".
  W3C CSS Color Module 4. — varför vi shiftar i oklch och inte hex.

## Relaterade docs

- [`docs/runtime-context.md`](runtime-context.md) — master-doc för alla 3
  runtime-mekanismer
- [`docs/network-aware.md`](network-aware.md) — F4 (companion mechanism)
- [`docs/patina-mode.md`](patina-mode.md) — F7 (companion mechanism)
- [`docs/sprints/sprint-23-context-runtime.md`](sprints/sprint-23-context-runtime.md)
  — Task 42.1
