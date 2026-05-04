#!/usr/bin/env node
// detect-framework.mjs
// SessionStart hook. Reads JSON from stdin (uses .cwd or falls back to process.cwd()).
// Detects framework + styling + motion lib + component primitives in 2026 baselines
// (Next.js 16, Tailwind v4, Motion v12, Base UI vs Radix, DTCG tokens).
//
// CLAUDE_PLUGIN_ROOT is not available in SessionStart (bug #27145); we walk up
// from cwd instead.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { ensureCacheDir } from './lib/cache-dir.mjs';

function readStdin() { try { return readFileSync(0, 'utf8'); } catch { return ''; } }
function parseInput(raw) { if (!raw) return null; try { return JSON.parse(raw); } catch { return null; } }
function emit(obj) { process.stdout.write(JSON.stringify(obj)); process.exit(0); }

const input = parseInput(readStdin()) || {};
const startDir = input.cwd || process.cwd();

function findProjectRoot(start) {
  let dir = resolve(start);
  while (true) {
    if (existsSync(join(dir, 'package.json'))) return { dir, hasPkg: true };
    if (existsSync(join(dir, '.git'))) return { dir, hasPkg: false };
    const parent = dirname(dir);
    if (parent === dir) return { dir: resolve(start), hasPkg: false };
    dir = parent;
  }
}

const { dir: projectRoot, hasPkg } = findProjectRoot(startDir);
// v1.5.3: cache-dir resolution moved to lib/cache-dir.mjs — three-tier policy
// keeps the cache off the user's project root in dev mode (no
// CLAUDE_PLUGIN_DATA env) by falling back to ~/.claude/plugins/data/.
const cacheDir = ensureCacheDir(projectRoot);
const outputPath = join(cacheDir, 'detected-framework.json');

// ── Vanilla fallback ─────────────────────────────────────────────────────────
function writeVanilla(note) {
  const out = {
    detected_at: new Date().toISOString(),
    project_root: projectRoot,
    framework: { name: 'vanilla', version: null, notes: '' },
    styling: { system: 'css-modules', version: null, notes: '' },
    motion_library: { available: false, package: null, import: null, notes: '' },
    component_primitives: { shadcn: false, radix: false, base_ui: false, notes: '' },
    tokens: { dtcg: false, path: null },
  };
  try { writeFileSync(outputPath, JSON.stringify(out, null, 2)); } catch { /* ignore */ }
  emit({ additionalContext: `Framework: Vanilla JS detected. ${note}` });
}

if (!hasPkg) {
  // Try non-npm frameworks before giving up (Flutter, SwiftUI, Compose, Laravel w/o node)
  const frameworks = detectNonNpm(projectRoot);
  if (frameworks) {
    const out = {
      detected_at: new Date().toISOString(),
      project_root: projectRoot,
      framework: frameworks,
      styling: { system: 'native', version: null, notes: '' },
      motion_library: { available: false, package: null, import: null, notes: '' },
      component_primitives: { shadcn: false, radix: false, base_ui: false, notes: '' },
      tokens: { dtcg: false, path: null },
    };
    try { writeFileSync(outputPath, JSON.stringify(out, null, 2)); } catch { /* ignore */ }
    emit({ additionalContext: `Framework: ${frameworks.name}. ${frameworks.notes}` });
  }
  writeVanilla('Generating Web Animations API + CSS output.');
}

// ── Parse package.json ───────────────────────────────────────────────────────
const pkgPath = join(projectRoot, 'package.json');
let pkg;
try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); }
catch { writeVanilla('package.json unreadable; defaulting to vanilla.'); }
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

// ── Framework detection ──────────────────────────────────────────────────────
function majorOf(v) {
  if (!v || typeof v !== 'string') return 0;
  const m = v.replace(/^[^\d]*/, '').match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

let fw = 'vanilla', fwVersion = null, fwNotes = '';

if (deps['astro']) {
  fw = 'astro'; fwVersion = deps['astro'];
  fwNotes = 'Astro: framework islands with client:visible. Native cross-document View Transitions via @view-transition { navigation: auto }. CSS transitions for static islands.';
} else if (deps['next']) {
  fw = 'nextjs'; fwVersion = deps['next'];
  const nextMajor = majorOf(fwVersion);
  const hasCacheComponents = tryReadConfig(projectRoot, ['next.config.ts', 'next.config.js', 'next.config.mjs'], /cacheComponents\s*:\s*true|experimental[\s\S]*cacheComponents/);
  if (nextMajor >= 16 || hasCacheComponents) {
    fwNotes = 'Next.js 16: Cache Components default, PPR default, React Compiler stable, <Form> component, Turbopack default. Use Server Components; "use client" only on interactive leaves.';
  } else if (nextMajor >= 15) {
    fwNotes = 'Next.js 15: fetch uncached by default. Consider upgrading to 16 for Cache Components and stable React Compiler.';
  } else {
    fwNotes = `Next.js ${fwVersion}: consider upgrading to 16 (Cache Components, stable React Compiler, <Form>).`;
  }
} else if (deps['nuxt']) {
  fw = 'nuxtjs'; fwVersion = deps['nuxt'];
  fwNotes = 'Nuxt 3: Nuxt UI components, auto-import for motion/vue, page transitions via nuxt.config pageTransition.';
} else if (deps['react-native']) {
  fw = 'react-native'; fwVersion = deps['react-native'];
  fwNotes = 'React Native: react-native-reanimated v3 worklets via useAnimatedStyle for 60fps.';
} else if (deps['react']) {
  fw = 'react'; fwVersion = deps['react'];
  fwNotes = 'React 19: motion v12 with "use client" on interactive leaves. Leverage the compiler for auto-memo.';
} else if (deps['vue']) {
  fw = 'vue'; fwVersion = deps['vue'];
  fwNotes = 'Vue 3: motion/vue or native <Transition :css="false">. VueUse composables available.';
} else if (deps['svelte']) {
  fw = 'svelte'; fwVersion = deps['svelte'];
  fwNotes = 'Svelte 5: runes + Spring class (not the deprecated spring()). Stiffness 0–1 normalized.';
} else if (deps['@angular/core']) {
  fw = 'angular'; fwVersion = deps['@angular/core'];
  fwNotes = 'Angular: Angular Animations module or prefer CSS for performance.';
} else if (deps['solid-js']) {
  fw = 'solidjs'; fwVersion = deps['solid-js'];
  fwNotes = 'SolidJS: solid-motionone or Web Animations API. Signal reactivity, no virtual DOM.';
} else if (deps['lit']) {
  fw = 'lit'; fwVersion = deps['lit'];
  fwNotes = 'Lit: Shadow DOM, :host transitions, delegatesFocus for a11y.';
}

// Non-npm frameworks fallback (same project can have package.json AND pubspec.yaml etc.)
if (fw === 'vanilla') {
  const nonNpm = detectNonNpm(projectRoot);
  if (nonNpm) { fw = nonNpm.name; fwVersion = nonNpm.version; fwNotes = nonNpm.notes; }
}

// ── Styling detection ────────────────────────────────────────────────────────
let styling = 'css-modules', stylingVersion = null, stylingNotes = '';

// Tailwind v4 is CSS-first — may be present via @tailwindcss/vite or @tailwindcss/postcss
// without the `tailwindcss` dep, or with it but configured via @theme in CSS.
const hasTwV4Plugin = deps['@tailwindcss/vite'] || deps['@tailwindcss/postcss'] || deps['@tailwindcss/cli'];
const hasTwCssDirective = grepFirstCss(projectRoot, /@theme\b|@import\s+["']tailwindcss["']/);

if (deps['tailwindcss'] || hasTwV4Plugin || hasTwCssDirective) {
  styling = 'tailwind';
  stylingVersion = deps['tailwindcss'] || (hasTwV4Plugin ? '4' : null);
  const isV4 = !!hasTwV4Plugin || majorOf(deps['tailwindcss']) >= 4 || hasTwCssDirective;
  stylingNotes = isV4
    ? 'Tailwind v4 (Oxide): use @theme in CSS, NOT tailwind.config.js. Automatic content detection; 5× faster builds; oklch-first palette.'
    : 'Tailwind v3: use tailwind.config.js theme extension. Consider migrating to v4 for @theme + Oxide.';
} else if (deps['styled-components']) {
  styling = 'styled-components';
  stylingNotes = 'Use styled.div template literals; avoid global styles.';
} else if (deps['@emotion/react']) {
  styling = 'emotion';
  stylingNotes = 'Use css prop or styled from @emotion/styled.';
} else if (deps['@vanilla-extract/css']) {
  styling = 'vanilla-extract';
  stylingNotes = 'Use style() and createVar() — zero runtime.';
}

// ── Motion library (motion v12 default) ──────────────────────────────────────
const hasMotion = !!(deps['motion'] || deps['framer-motion']);
const motionVersion = deps['motion'] || deps['framer-motion'] || null;
const motionPkg = deps['motion']
  ? 'motion'
  : deps['framer-motion']
    ? 'framer-motion (legacy — migrate to `motion` ≥ v12)'
    : null;
const motionImport = hasMotion ? 'motion/react' : null;
const motionMajor = majorOf(motionVersion);
const motionNotes = hasMotion
  ? (motionMajor >= 12
      ? 'Motion v12: use bounce + visualDuration (two-parameter spring). Native oklch/color-mix animation. Native ScrollTimeline, layoutAnchor.'
      : 'Motion installed — upgrade to v12 for bounce/visualDuration springs, native oklch animation, and ScrollTimeline support.')
  : '';

// ── Component primitives ─────────────────────────────────────────────────────
const hasShadcn = !!(deps['@shadcn/ui']) || existsSync(join(projectRoot, 'components', 'ui')) || existsSync(join(projectRoot, 'src', 'components', 'ui'));
const hasRadix = Object.keys(deps).some(k => k.startsWith('@radix-ui/'));
const hasBaseUi = !!(deps['@base-ui-components/react']);

const primitiveNotes = hasBaseUi
  ? 'Base UI detected: newer unstyled primitives from the Radix team. Prefer over Radix for new code.'
  : (hasShadcn || hasRadix)
    ? 'shadcn/ui + Radix primitives for accessible components. Consider migrating primitive layer to Base UI for new shadcn v4 templates.'
    : '';

// ── DTCG tokens detection ────────────────────────────────────────────────────
const dtcgPath = findFirst(projectRoot, /\.tokens\.json$/, 3) || null;
const tokensNotes = dtcgPath
  ? `DTCG 1.0 tokens detected at ${dtcgPath}. Prefer token references over hardcoded values in generated output.`
  : '';

// ── Write cache & emit context ───────────────────────────────────────────────
const out = {
  detected_at: new Date().toISOString(),
  project_root: projectRoot,
  framework: { name: fw, version: fwVersion, notes: fwNotes },
  styling: { system: styling, version: stylingVersion, notes: stylingNotes },
  motion_library: { available: hasMotion, package: motionPkg, import: motionImport, version: motionVersion, notes: motionNotes },
  component_primitives: { shadcn: hasShadcn, radix: hasRadix, base_ui: hasBaseUi, notes: primitiveNotes },
  tokens: { dtcg: !!dtcgPath, path: dtcgPath },
};
try { writeFileSync(outputPath, JSON.stringify(out, null, 2)); } catch { /* ignore */ }

// ── Append taste profile from system.md ──────────────────────────────────────
const parts = [
  `Framework detected: ${fw}${fwVersion ? ' ' + fwVersion : ''}.`,
  `Styling: ${styling}${stylingVersion ? ' ' + stylingVersion : ''}.`,
  stylingNotes,
  fwNotes,
  motionNotes,
  primitiveNotes,
  tokensNotes,
].filter(Boolean);

const systemMd = join(projectRoot, 'system.md');
if (existsSync(systemMd)) {
  try {
    const taste = readFileSync(systemMd, 'utf8');
    const rejected = (taste.match(/### Rejected styles([\s\S]*?)(?=###|$)/) || [])[1];
    const positive = (taste.match(/### Positive signals \(reinforce\)([\s\S]*?)(?=###|$)/) || [])[1];
    if (rejected && rejected.trim()) {
      parts.push('TASTE PROFILE — Rejected styles (exclude from candidate set):');
      parts.push(rejected.trim());
    }
    if (positive && positive.trim()) {
      parts.push('TASTE PROFILE — Positive signals (reinforce these directions):');
      parts.push(positive.trim());
    }
  } catch { /* ignore */ }
}

let additionalContext = parts.join(' ').trim();
if (additionalContext.length > 10_000) additionalContext = additionalContext.slice(0, 9997) + '...';

emit({ additionalContext });

// ── Helpers ──────────────────────────────────────────────────────────────────
function detectNonNpm(root) {
  if (existsSync(join(root, 'pubspec.yaml'))) {
    try {
      const content = readFileSync(join(root, 'pubspec.yaml'), 'utf8');
      if (content.includes('flutter:')) {
        return { name: 'flutter', version: null, notes: 'Flutter: Material 3 widgets. AnimationController + SpringSimulation for spring tokens. Semantics() for a11y.' };
      }
    } catch { /* ignore */ }
  }
  // SwiftUI: quick scan (bounded) for `import SwiftUI`
  try {
    const found = findFirst(root, /\.swift$/, 3, (absPath) => {
      try { return readFileSync(absPath, 'utf8').includes('import SwiftUI'); } catch { return false; }
    });
    if (found) return { name: 'swiftui', version: null, notes: 'SwiftUI: .animation(.spring()), withAnimation for state-driven. accessibilityLabel for VoiceOver.' };
  } catch { /* ignore */ }

  for (const g of [join(root, 'build.gradle.kts'), join(root, 'app', 'build.gradle.kts')]) {
    if (existsSync(g)) {
      try {
        if (readFileSync(g, 'utf8').includes('compose')) {
          return { name: 'jetpack-compose', version: null, notes: 'Jetpack Compose: Material3 Compose. spring() animation spec. Modifier.semantics for a11y.' };
        }
      } catch { /* ignore */ }
    }
  }

  if (existsSync(join(root, 'artisan'))) {
    return { name: 'laravel', version: null, notes: 'Laravel: Blade components + Alpine.js for interactivity. Livewire for server-driven. Tailwind via Vite.' };
  }
  if (existsSync(join(root, 'composer.json'))) {
    try {
      const composer = JSON.parse(readFileSync(join(root, 'composer.json'), 'utf8'));
      const cDeps = { ...(composer.require || {}), ...(composer['require-dev'] || {}) };
      if (cDeps['laravel/framework']) {
        return { name: 'laravel', version: cDeps['laravel/framework'], notes: 'Laravel: Blade components + Alpine.js. Livewire for server-driven. Tailwind via Vite.' };
      }
    } catch { /* ignore */ }
  }
  return null;
}

function tryReadConfig(root, candidates, pattern) {
  for (const c of candidates) {
    const p = join(root, c);
    if (existsSync(p)) {
      try { if (pattern.test(readFileSync(p, 'utf8'))) return true; } catch { /* ignore */ }
    }
  }
  return false;
}

function grepFirstCss(root, pattern, maxDepth = 3) {
  return !!findFirst(root, /\.css$/, maxDepth, (absPath) => {
    try { return pattern.test(readFileSync(absPath, 'utf8')); } catch { return false; }
  });
}

function findFirst(root, nameRegex, maxDepth = 3, predicate = () => true) {
  const skipDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.turbo', '.cache', '.visionary-cache']);
  function walk(dir, depth) {
    if (depth > maxDepth) return null;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return null; }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (skipDirs.has(e.name)) continue;
        const found = walk(full, depth + 1);
        if (found) return found;
      } else if (nameRegex.test(e.name)) {
        if (predicate(full)) return full;
      }
    }
    return null;
  }
  return walk(root, 0);
}
