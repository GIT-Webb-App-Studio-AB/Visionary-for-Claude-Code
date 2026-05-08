// lut-to-filter.mjs — Sprint 20 Task 37.4
//
// Maps director-LUT-anchors to CSS filter strings. Each director-pack ships
// with a color-grading anchor (warm-amber, cool-monochrome, pastel-symmetric,
// etc.); this module compiles that anchor to a CSS `filter` value applied as
// a `body { filter: ... }` final-pass when the user opts in via
// `--cinematic-grade` or `VISIONARY_CINEMATIC_GRADE=1`.
//
// Default behaviour: LUTs are LOAD-on-DEMAND. The first call reads
// lut-presets.json from disk; subsequent calls hit an in-process cache. A
// missing or malformed presets file does not crash — applyLut() falls back
// to the empty string (no filter) so the renderer continues normally.
//
// Public surface:
//   loadPresets(customPath?)    → { version, presets } | { version, presets: {} }
//   applyLut(lutId)             → cssFilterString | ''
//   listPresets()               → [{ id, rationale }]
//   resetCache()                → void  (test seam)

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let _presets = null;

/**
 * Load the LUT-presets registry. Cached after first call.
 *
 * @param {string} [customPath] — override path (test seam). When set, also
 *   resets the cache so a fresh load happens against the override.
 * @returns {{ version: string, presets: object }}
 */
export function loadPresets(customPath) {
  if (customPath) {
    _presets = null;
  }
  if (_presets) return _presets;

  const __filename = fileURLToPath(import.meta.url);
  const defaultPath = customPath || resolve(dirname(__filename), 'lut-presets.json');

  try {
    const raw = readFileSync(defaultPath, 'utf8');
    const parsed = JSON.parse(raw);
    // Normalise shape — guarantee `presets` is an object even if the file is
    // partial / hand-edited.
    _presets = {
      version: typeof parsed.version === 'string' ? parsed.version : '0.0.0',
      presets: parsed.presets && typeof parsed.presets === 'object' ? parsed.presets : {},
    };
  } catch {
    // Missing file, malformed JSON, permission error — degrade silently.
    // Matches the project's "graceful fallback" pattern (see Sprint 18
    // photo pipeline, Sprint 17 mood-mapper).
    _presets = { version: '0.0.0', presets: {} };
  }

  return _presets;
}

/**
 * Compose a CSS `filter` value for the given director-LUT id.
 *
 * Component order: hue-rotate → saturate → contrast → sepia → brightness.
 * Components with neutral values (hue 0, saturate 1, contrast 1, sepia 0,
 * brightness 1) are omitted to keep the string compact and to make the
 * resulting filter no-op when every component is neutral.
 *
 * @param {string} lutId — e.g. 'wong-kar-wai', 'villeneuve'
 * @returns {string} CSS filter value, or '' when the id is unknown / the
 *   preset is missing required fields.
 */
export function applyLut(lutId) {
  if (typeof lutId !== 'string' || !lutId) return '';

  const data = loadPresets();
  const preset = data.presets[lutId];
  if (!preset || typeof preset !== 'object') return '';

  const parts = [];

  // hue-rotate(deg) — only emit when non-zero
  if (typeof preset.hue_rotate === 'number' && preset.hue_rotate !== 0) {
    parts.push(`hue-rotate(${preset.hue_rotate}deg)`);
  }

  // saturate(n) — only emit when not exactly 1.0
  if (typeof preset.saturate === 'number' && preset.saturate !== 1) {
    parts.push(`saturate(${preset.saturate})`);
  }

  // contrast(n) — only emit when not exactly 1.0
  if (typeof preset.contrast === 'number' && preset.contrast !== 1) {
    parts.push(`contrast(${preset.contrast})`);
  }

  // sepia(n) — only emit when > 0
  if (typeof preset.sepia === 'number' && preset.sepia > 0) {
    parts.push(`sepia(${preset.sepia})`);
  }

  // brightness(n) — only emit when not exactly 1.0
  if (typeof preset.brightness === 'number' && preset.brightness !== 1) {
    parts.push(`brightness(${preset.brightness})`);
  }

  return parts.join(' ');
}

/**
 * List all registered LUT presets with their human-readable rationale.
 *
 * Used by the `/visionary-cinematic --list` command and by the schema
 * validator that asserts every director-pack has a matching LUT.
 *
 * @returns {Array<{ id: string, rationale: string }>}
 */
export function listPresets() {
  const data = loadPresets();
  return Object.entries(data.presets).map(([id, preset]) => ({
    id,
    rationale: typeof preset?.rationale === 'string' ? preset.rationale : '',
  }));
}

/**
 * Drop the in-process preset cache. Test seam — production code should not
 * need to call this.
 */
export function resetCache() {
  _presets = null;
}
