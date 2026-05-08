// circadian.mjs — Sprint 23 Task 42.1
// Time-of-day palette-shift. Generated UI gets 4 phase-palettes (dawn/day/dusk/night).
// Runtime JS-snippet (~30 LOC) that body-injects to update CSS custom properties every 15min.
//
// Zero-permission, zero-tracking, client-side: uses only Date.now() + an approximate
// solar-time table parameterised on latitude. No suncalc dependency.
//
// Hard-floor: respects prefers-color-scheme system override — if the user has a
// system preference, the runtime snippet does NOT mutate the palette.

const PHASE_ORDER = ['night', 'dawn', 'day', 'dusk'];

/**
 * approximateSolarTimes(date, lat) — returns the dawn/day/dusk/night phase-boundaries
 * for the given local date in fractional hours (0-24).
 *
 * Uses a simple sinusoidal seasonal-offset (Northern hemisphere): summer dawn earlier,
 * winter dawn later. Latitude scales the seasonal swing — higher latitudes = bigger
 * swing. This is intentionally approximate (~±30 min vs real ephemeris) — the goal is
 * "palette-shift roughly at the right time of day", not astronomical accuracy.
 */
export function approximateSolarTimes(date, lat = 60) {
  const d = date instanceof Date ? date : new Date(date);
  // Day-of-year (0-365). Used to compute seasonal offset.
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d - start) / (1000 * 60 * 60 * 24));
  // Seasonal phase: peak at summer solstice (day 172), trough at winter (day 355).
  // sin(2π * (day - 80) / 365) → +1 at day 172, -1 at day 355.
  const seasonal = Math.sin((2 * Math.PI * (dayOfYear - 80)) / 365);
  // Latitude scaling (clamped 0..90). At equator: minimal swing; near pole: ±3h.
  const latScale = Math.min(Math.abs(lat), 90) / 90; // 0..1
  const swing = 3 * latScale * seasonal; // ±3h max

  // Base anchors: dawn 06:00, day 09:00, dusk 18:00, night 22:00.
  // Summer (swing > 0) → earlier dawn, later dusk. Winter (swing < 0) → opposite.
  const dawn = 6 - swing;
  const day = 9 - swing * 0.5;
  const dusk = 18 + swing;
  const night = 22 + swing * 0.5;
  return {
    dawn,
    day,
    dusk,
    night,
    iso: {
      dawn: hoursToIso(d, dawn),
      day: hoursToIso(d, day),
      dusk: hoursToIso(d, dusk),
      night: hoursToIso(d, night),
    },
  };
}

function hoursToIso(date, hours) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setTime(d.getTime() + hours * 3600 * 1000);
  return d.toISOString();
}

/**
 * getCurrentPhase(date, lat) → 'dawn' | 'day' | 'dusk' | 'night'
 *
 * Resolves which phase the given moment falls into.
 *  - night: from `night` boundary through midnight to `dawn` boundary
 *  - dawn:  from `dawn` boundary to `day` boundary
 *  - day:   from `day` boundary to `dusk` boundary
 *  - dusk:  from `dusk` boundary to `night` boundary
 */
export function getCurrentPhase(date, lat = 60) {
  const d = date instanceof Date ? date : new Date(date);
  const t = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  const { dawn, day, dusk, night } = approximateSolarTimes(d, lat);
  if (t >= dawn && t < day) return 'dawn';
  if (t >= day && t < dusk) return 'day';
  if (t >= dusk && t < night) return 'dusk';
  return 'night';
}

/**
 * Generate the runtime JS-snippet that updates :root CSS custom properties.
 * The snippet is small (~1.5KB minified) and self-contained.
 *
 * Behaviour:
 *  - Reads system prefers-color-scheme — if set explicitly to light or dark, no-op
 *    (system pref always wins).
 *  - Picks the current phase via embedded approximateSolarTimes/getCurrentPhase.
 *  - Sets each token in `palettes[phase]` as a CSS custom property on :root.
 *  - Smooth transition >800ms ease added via inline style.
 *  - setInterval every 15min + visibilitychange listener (battery-friendly).
 *
 * @param {object} args
 * @param {Record<'dawn'|'day'|'dusk'|'night', Record<string,string>>} args.palettes
 * @param {number} [args.lat=60] - latitude
 * @returns {string} HTML <script> block to inject
 */
export function generateCircadianRuntimeSnippet({ palettes, lat = 60 }) {
  if (!palettes || typeof palettes !== 'object') {
    throw new Error('generateCircadianRuntimeSnippet: palettes is required');
  }
  for (const phase of PHASE_ORDER) {
    if (!palettes[phase]) {
      throw new Error(`generateCircadianRuntimeSnippet: missing palette for phase "${phase}"`);
    }
  }

  // Embed configuration. JSON.stringify is safe — no user-controlled keys reach script context.
  const palettesJson = JSON.stringify(palettes);
  const latJson = JSON.stringify(lat);

  return `<script>
(function(){
  // Respect system color-scheme preference — if user has explicitly set light/dark,
  // do not overlay circadian palette.
  try {
    var mq = window.matchMedia;
    if (mq && (mq('(prefers-color-scheme: dark)').matches || mq('(prefers-color-scheme: light)').matches)) {
      // System has an explicit preference; check media-query for "no-preference" support.
      var nopref = mq('(prefers-color-scheme: no-preference)');
      if (!nopref.matches) {
        // Browsers that distinguish no-preference: only short-circuit when truly explicit.
        // Otherwise fall through and apply circadian.
        if (mq('(prefers-color-scheme: dark)').matches || mq('(prefers-color-scheme: light)').matches) {
          // Hard floor — respect user choice.
          return;
        }
      }
    }
  } catch(e) { /* ignore */ }

  var palettes = ${palettesJson};
  var LAT = ${latJson};
  var root = document.documentElement;
  root.style.transition = 'background-color 800ms ease, color 800ms ease';

  function approxSolar(date) {
    var start = new Date(date.getFullYear(), 0, 0);
    var dayOfYear = Math.floor((date - start) / 86400000);
    var seasonal = Math.sin((2 * Math.PI * (dayOfYear - 80)) / 365);
    var latScale = Math.min(Math.abs(LAT), 90) / 90;
    var swing = 3 * latScale * seasonal;
    return { dawn: 6 - swing, day: 9 - swing * 0.5, dusk: 18 + swing, night: 22 + swing * 0.5 };
  }
  function getPhase(date) {
    var t = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
    var s = approxSolar(date);
    if (t >= s.dawn && t < s.day) return 'dawn';
    if (t >= s.day && t < s.dusk) return 'day';
    if (t >= s.dusk && t < s.night) return 'dusk';
    return 'night';
  }
  function updateRoot() {
    var phase = getPhase(new Date());
    var p = palettes[phase];
    if (!p) return;
    Object.keys(p).forEach(function(k){ root.style.setProperty('--' + k, p[k]); });
    root.setAttribute('data-circadian-phase', phase);
  }
  updateRoot();
  var interval = setInterval(updateRoot, 15 * 60 * 1000);
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden) updateRoot();
  });
})();
</script>`;
}

export const PHASES = PHASE_ORDER;
