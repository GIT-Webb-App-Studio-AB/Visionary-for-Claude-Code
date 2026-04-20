#!/usr/bin/env node
// Adds YAML frontmatter + Accessibility section to every style file under
// skills/visionary/styles/**/*.md (excluding _index.md).
//
// Idempotent: skips files that already have both.
//
// Frontmatter schema:
//   id:               filename without extension
//   category:         parsed from "**Category:** ..." line, or dir name
//   motion_tier:      parsed from "**Motion tier:** ..." line (Static|Subtle|Expressive|Kinetic)
//   density:          "sparse" | "balanced" | "dense" (inferred from keywords)
//   locale_fit:       ["all"] unless style declares otherwise
//   palette_tags:     inferred from body keyword scan
//   keywords:         filename words + category tokens
//   accessibility:
//     contrast_floor: 4.5 (7.0 for high-contrast-a11y; 3.0 for display-only styles)
//     reduced_motion: "opacity-only" | "pause-required" | "static"
//     touch_target:   44 (24 for bloomberg/terminal/data-dense)

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, extname, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));
const stylesDir = join(repoRoot, 'skills', 'visionary', 'styles');

// ── Collect style files ──────────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && extname(entry.name) === '.md' && entry.name !== '_index.md') out.push(full);
  }
  return out;
}

// ── Style-specific overrides for density and palette ─────────────────────────
const DENSITY_DENSE = new Set([
  'bloomberg-terminal', 'terminal-cli', 'data-visualization', 'saas-b2b-dashboard',
  'scientific-journal', 'sports-analytics', 'newspaper-broadsheet',
  'map-cartographic', 'condensed-editorial', 'catalog-archive',
  'bento-grid', 'active-living-grid', 'surveillance-panopticon',
  'data-center', 'data-physicalization', 'marine-nautical-chart',
  'agritech', 'legaltech', 'agricultural-seed-catalog', 'legal-editorial',
  'microfilm-archive',
]);

const DENSITY_SPARSE = new Set([
  'zen-void', 'luxury-aspirational', 'light-mode-sanctuary', 'dieter-rams',
  'japanese-minimalism', 'white-futurism', 'melancholic', 'romantic-soft',
  'coastal-grandmother', 'corpcore-quiet-luxury', 'hyper-comfort-hygge',
  'awe-sublime', 'dreamcore', 'liminal-space', 'serif-revival',
  'photography-portfolio', 'fashion-editorial', 'clinical-cold',
]);

const TOUCH_24 = new Set([
  'bloomberg-terminal', 'terminal-cli', 'data-visualization',
  'saas-b2b-dashboard', 'data-center', 'bento-grid', 'developer-tools',
]);

const PAUSE_REQUIRED = new Set([
  'kinetic-type', 'flow-field-vector', 'reaction-diffusion',
  'quantum-particle', 'aurora-mesh', 'holographic',
  'cyberpunk-neon', 'glitchcore', 'e-girl', 'synthwave',
  'neon-dystopia', 'neon-signage', 'post-internet-maximalism',
  'generative-algorithmic', 'alien-nonhuman', 'biomorphic-futurism',
  'disco-op-art', 'op-art',
]);

const STATIC_STYLES = new Set([
  'zine-diy', 'brutalist-web', 'brutalist-honesty', 'wireframe-aesthetic',
  'newspaper-broadsheet', 'scientific-journal', 'legal-editorial',
  'dieter-rams', 'paper-editorial',
]);

const HIGH_CONTRAST_STYLES = new Set([
  'high-contrast-a11y',
]);

const RTL_NATIVE = new Set(['arabic-calligraphic']);
const CJK_NATIVE = new Set(['japanese-minimalism', 'chinese-guochao', 'korean-k-design', 'guochao-new-chinese', 'vertical-cjk']);

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseHeader(src) {
  const categoryMatch = src.match(/\*\*Category:\*\*\s*([^\n]+)/);
  const motionMatch = src.match(/\*\*Motion tier:\*\*\s*([A-Za-z]+)/);
  return {
    category: categoryMatch ? categoryMatch[1].trim() : null,
    motionTier: motionMatch ? motionMatch[1].trim() : null,
  };
}

function normalizeTier(tier) {
  if (!tier) return 'Subtle';
  const t = tier.toLowerCase();
  if (t === 'minimal' || t === 'none' || t === 'static') return 'Static';
  if (t === 'subtle' || t === 'light' || t === 'calm') return 'Subtle';
  if (t === 'expressive' || t === 'active' || t === 'playful') return 'Expressive';
  if (t === 'kinetic' || t === 'intense' || t === 'maximum') return 'Kinetic';
  return 'Subtle';
}

function paletteTags(src, id) {
  const tags = new Set();
  const body = src.toLowerCase();
  const addIf = (re, tag) => { if (re.test(body)) tags.add(tag); };

  addIf(/(#000|#111|#0[0-9a-f]{2}|oled|dark|near-black|deep space)/, 'dark');
  addIf(/(#fff|#fa|white|cream|ivory|off-white|paper)/, 'light');
  addIf(/(neon|electric|vivid|saturated|#ff[0-9a-f]{4})/, 'neon');
  addIf(/(pastel|soft|muted|dusty|sage|blush)/, 'pastel');
  addIf(/(earth|terracotta|ochre|warm brown|umber|amber)/, 'earth');
  addIf(/(monochrom|grayscale|greyscale|single hue)/, 'monochrome');
  addIf(/(gold|navy|quiet luxury|editorial)/, 'editorial');
  addIf(/(green|leaf|solar|growth|botanical)/, 'organic');
  addIf(/(blue.*trust|fintech|clinical)/, 'trust');

  return [...tags];
}

function keywordsFor(id, category) {
  const fromId = id.split('-');
  const fromCat = (category || '').split(/[^a-z0-9]+/i).filter(Boolean).map(s => s.toLowerCase());
  return [...new Set([...fromId, ...fromCat])].filter(k => k.length > 2);
}

function localeFit(id) {
  if (RTL_NATIVE.has(id)) return ['ar', 'he', 'fa', 'ur'];
  if (CJK_NATIVE.has(id)) return ['ja', 'zh', 'ko'];
  return ['all'];
}

function densityFor(id) {
  if (DENSITY_DENSE.has(id)) return 'dense';
  if (DENSITY_SPARSE.has(id)) return 'sparse';
  return 'balanced';
}

function contrastFloor(id) {
  if (HIGH_CONTRAST_STYLES.has(id)) return 7.0;
  return 4.5;
}

function reducedMotionMode(id, tier) {
  if (STATIC_STYLES.has(id)) return 'static';
  if (PAUSE_REQUIRED.has(id) || tier === 'Kinetic') return 'pause-required';
  return 'opacity-only';
}

function touchTargetFor(id) {
  return TOUCH_24.has(id) ? 24 : 44;
}

function buildFrontmatter(id, parsed, src) {
  const tier = normalizeTier(parsed.motionTier);
  const fm = {
    id,
    category: parsed.category || 'uncategorized',
    motion_tier: tier,
    density: densityFor(id),
    locale_fit: localeFit(id),
    palette_tags: paletteTags(src, id),
    keywords: keywordsFor(id, parsed.category),
    accessibility: {
      contrast_floor: contrastFloor(id),
      reduced_motion: reducedMotionMode(id, tier),
      touch_target: touchTargetFor(id),
    },
  };

  // Hand-serialize YAML so we don't pull in a dep.
  const lines = ['---'];
  lines.push(`id: ${fm.id}`);
  lines.push(`category: ${yamlScalar(fm.category)}`);
  lines.push(`motion_tier: ${fm.motion_tier}`);
  lines.push(`density: ${fm.density}`);
  lines.push(`locale_fit: [${fm.locale_fit.map(yamlScalar).join(', ')}]`);
  lines.push(`palette_tags: [${fm.palette_tags.map(yamlScalar).join(', ')}]`);
  lines.push(`keywords: [${fm.keywords.map(yamlScalar).join(', ')}]`);
  lines.push(`accessibility:`);
  lines.push(`  contrast_floor: ${fm.accessibility.contrast_floor}`);
  lines.push(`  reduced_motion: ${fm.accessibility.reduced_motion}`);
  lines.push(`  touch_target: ${fm.accessibility.touch_target}`);
  lines.push('---', '');
  return lines.join('\n');
}

function yamlScalar(v) {
  const s = String(v);
  if (s === '') return '""';
  // Need quoting if contains space, special chars, or starts with digit/dash
  if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(s)) return s;
  return JSON.stringify(s);
}

// ── Accessibility block ──────────────────────────────────────────────────────
function buildAccessibilitySection(id, parsed) {
  const tier = normalizeTier(parsed.motionTier);
  const mode = reducedMotionMode(id, tier);
  const tt = touchTargetFor(id);
  const floor = contrastFloor(id);
  const rtl = RTL_NATIVE.has(id);

  const motionBlock = mode === 'static'
    ? 'No animation by default; static entry and state changes. `prefers-reduced-motion` is already honored because there is nothing to reduce.'
    : mode === 'pause-required'
      ? 'This style exposes motion that can run longer than 5 seconds. Ship a visible pause/stop control bound to `animation-play-state` (CSS) or the JS equivalent — required by WCAG 2.2.2 (Level A). Also degrade to opacity-only transitions under `prefers-reduced-motion: reduce`.'
      : 'Under `prefers-reduced-motion: reduce`, keep opacity transitions but drop transform/scale/translate — transform is a vestibular trigger. No autoplay exceeds 5 s without a pause control.';

  const touchBlock = tt === 24
    ? `Touch targets may drop to 24×24 px (WCAG 2.5.8 floor) because this style is information-dense by design. Document the density in the brief so the critic doesn't flag it.`
    : `Touch targets default to 44×44 px — matches Apple HIG / Material (48dp) and has ~3× lower mis-tap rate than the 24-px WCAG floor. Inline links inside flowing prose are exempt.`;

  const contrastBlock = floor >= 7.0
    ? `Body text must clear 7:1 (WCAG AAA) AND APCA Lc ≥ 90. Verify in both light and dark variants.`
    : `Body text must clear 4.5:1 (WCAG 2.2 AA) AND APCA Lc ≥ 75. Large text / UI labels: 3:1 and Lc ≥ 60. Run axe-core + apca-w3 during the critique loop.`;

  const rtlBlock = rtl
    ? `Root element must declare \`dir="rtl"\`. Use CSS logical properties (margin-inline, padding-inline, border-inline-*) throughout — physical left/right properties break the layout in this style.`
    : `Use CSS logical properties (margin-inline, padding-inline, border-inline-*) by default so the same component works in RTL locales without a fork.`;

  return [
    '',
    '## Accessibility',
    '',
    '### Contrast',
    contrastBlock,
    '',
    '### Focus',
    'Render a `:focus-visible` ring only — no `:focus:not(:focus-visible)` reset (obsolete since March 2022). Prefer `Canvas` / `AccentColor` system colors in the ring so Windows High Contrast and forced-colors mode stay correct.',
    '',
    '### Motion',
    motionBlock,
    '',
    '### Touch target',
    touchBlock,
    '',
    '### RTL / Logical properties',
    rtlBlock,
    '',
  ].join('\n');
}

// ── Per-file rewrite ─────────────────────────────────────────────────────────
function enrich(file) {
  let src = readFileSync(file, 'utf8');
  const id = basename(file, '.md');
  const parsed = parseHeader(src);
  let changed = false;

  if (!src.startsWith('---\n')) {
    src = buildFrontmatter(id, parsed, src) + '\n' + src;
    changed = true;
  }

  if (!/^## Accessibility\b/m.test(src)) {
    const section = buildAccessibilitySection(id, parsed);
    // Insert before "## Slop Watch" if present, else append at end.
    if (/^## Slop Watch\b/m.test(src)) {
      src = src.replace(/(\n## Slop Watch\b)/, `${section}$1`);
    } else {
      src = src.trimEnd() + '\n' + section + '\n';
    }
    changed = true;
  }

  if (changed) writeFileSync(file, src, 'utf8');
  return changed;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const files = walk(stylesDir);
let enriched = 0, skipped = 0;
for (const f of files) {
  if (enrich(f)) enriched++;
  else skipped++;
}
console.log(`enriched: ${enriched}`);
console.log(`skipped (already done): ${skipped}`);
console.log(`total: ${files.length}`);
