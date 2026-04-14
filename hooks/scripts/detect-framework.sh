#!/usr/bin/env bash
# detect-framework.sh
# Runs at SessionStart to detect project framework and styling system.
#
# NOTE: CLAUDE_PLUGIN_ROOT is NOT available in SessionStart hooks (bug #27145).
# We walk up from $PWD to find the project root instead.

set -euo pipefail

# Walk up from cwd to find the nearest directory containing package.json
find_project_root() {
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/package.json" ]]; then
      echo "$dir"
      return
    fi
    dir="$(dirname "$dir")"
  done
  echo "$PWD"
}

PROJECT_ROOT=$(find_project_root)
PKG_JSON="$PROJECT_ROOT/package.json"
CACHE_DIR="$PROJECT_ROOT/.visionary-cache"
OUTPUT="$CACHE_DIR/detected-framework.json"

mkdir -p "$CACHE_DIR"

# No package.json — treat as vanilla project
if [[ ! -f "$PKG_JSON" ]]; then
  cat > "$OUTPUT" <<EOF
{
  "detected_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project_root": "$PROJECT_ROOT",
  "framework": { "name": "vanilla", "version": null, "notes": "" },
  "styling": { "system": "css-modules", "version": null, "notes": "" },
  "motion_library": { "available": false, "package": null, "import": null, "notes": "" },
  "component_primitives": { "shadcn": false, "radix": false, "notes": "" }
}
EOF
  echo '{"additionalContext": "Framework: Vanilla JS detected. Generating Web Animations API + CSS output."}'
  exit 0
fi

# Parse package.json with Node.js and write detected-framework.json
node - <<'NODEJS' "$PKG_JSON" "$OUTPUT" "$PROJECT_ROOT"
const fs = require('fs');
const path = require('path');
const [,, pkgPath, outputPath, projectRoot] = process.argv;

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

// Framework detection — order matters: check meta-frameworks before base frameworks
let fw = 'vanilla', fwVersion = null, fwNotes = '';
if (deps['astro']) {
  fw = 'astro'; fwVersion = deps['astro'];
  fwNotes = 'Astro: use framework islands with client:visible. View Transitions API for page transitions. CSS transitions for static components.';
} else if (deps['next']) {
  fw = 'nextjs'; fwVersion = deps['next'];
  fwNotes = 'Next.js 15: fetch uncached by default (breaking from v14). Use Server Components by default, "use client" only on interactive leaf nodes.';
} else if (deps['nuxt']) {
  fw = 'nuxtjs'; fwVersion = deps['nuxt'];
  fwNotes = 'Nuxt.js: use Nuxt UI components. Auto-import works with motion/vue. Page transitions via nuxt.config pageTransition.';
} else if (deps['react-native']) {
  fw = 'react-native'; fwVersion = deps['react-native'];
  fwNotes = 'React Native: use react-native-reanimated v3 for animations. useAnimatedStyle with worklets for performance.';
} else if (deps['react']) {
  fw = 'react'; fwVersion = deps['react'];
  fwNotes = 'React 19: use motion.div variants with "use client" on interactive components.';
} else if (deps['vue']) {
  fw = 'vue'; fwVersion = deps['vue'];
  fwNotes = 'Vue 3: use motion/vue or native <Transition :css="false">. VueUse composables available.';
} else if (deps['svelte']) {
  fw = 'svelte'; fwVersion = deps['svelte'];
  fwNotes = 'Svelte 5: use Spring class (not deprecated spring() function). Stiffness 0-1 normalized.';
} else if (deps['@angular/core']) {
  fw = 'angular'; fwVersion = deps['@angular/core'];
  fwNotes = 'Angular: use Angular Animations module. Prefer CSS-based transitions for performance.';
} else if (deps['solid-js']) {
  fw = 'solidjs'; fwVersion = deps['solid-js'];
  fwNotes = 'SolidJS: use solid-motionone or Web Animations API. Signals-based reactivity, no virtual DOM.';
} else if (deps['lit']) {
  fw = 'lit'; fwVersion = deps['lit'];
  fwNotes = 'Lit: Shadow DOM components. CSS transitions in :host styles. Use delegatesFocus for a11y.';
}

// Non-npm framework detection (filesystem-based)
if (fw === 'vanilla') {
  // Flutter: pubspec.yaml with flutter dependency
  const pubspec = path.join(projectRoot, 'pubspec.yaml');
  if (fs.existsSync(pubspec)) {
    const content = fs.readFileSync(pubspec, 'utf8');
    if (content.includes('flutter:')) {
      fw = 'flutter'; fwVersion = null;
      fwNotes = 'Flutter: use Material 3 widgets. AnimationController + SpringSimulation for spring tokens. Semantics() for a11y.';
    }
  }

  // SwiftUI: .swift files with import SwiftUI (check up to 20 files)
  if (fw === 'vanilla') {
    try {
      const swiftFiles = fs.readdirSync(projectRoot, { recursive: true })
        .filter(f => typeof f === 'string' && f.endsWith('.swift'))
        .slice(0, 20);
      for (const sf of swiftFiles) {
        try {
          const content = fs.readFileSync(path.join(projectRoot, sf), 'utf8');
          if (content.includes('import SwiftUI')) {
            fw = 'swiftui'; fwVersion = null;
            fwNotes = 'SwiftUI: use .animation(.spring()) modifier. withAnimation for state-driven. accessibilityLabel for VoiceOver.';
            break;
          }
        } catch (e) { /* skip unreadable */ }
      }
    } catch (e) { /* readdirSync recursive may fail on some platforms */ }
  }

  // Jetpack Compose: build.gradle.kts with compose
  if (fw === 'vanilla') {
    for (const g of [path.join(projectRoot, 'build.gradle.kts'), path.join(projectRoot, 'app', 'build.gradle.kts')]) {
      if (fs.existsSync(g)) {
        const content = fs.readFileSync(g, 'utf8');
        if (content.includes('compose')) {
          fw = 'jetpack-compose'; fwVersion = null;
          fwNotes = 'Jetpack Compose: use Material3 Compose. spring() animation spec. Modifier.semantics for a11y.';
          break;
        }
      }
    }
  }

  // Laravel: artisan file or composer.json with laravel/framework
  if (fw === 'vanilla') {
    if (fs.existsSync(path.join(projectRoot, 'artisan'))) {
      fw = 'laravel'; fwVersion = null;
      fwNotes = 'Laravel: use Blade components + Alpine.js for interactivity. Livewire for server-driven. Tailwind via Vite.';
    } else if (fs.existsSync(path.join(projectRoot, 'composer.json'))) {
      try {
        const composerPkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'composer.json'), 'utf8'));
        const composerDeps = { ...(composerPkg.require || {}), ...(composerPkg['require-dev'] || {}) };
        if (composerDeps['laravel/framework']) {
          fw = 'laravel'; fwVersion = composerDeps['laravel/framework'];
          fwNotes = 'Laravel: use Blade components + Alpine.js for interactivity. Livewire for server-driven. Tailwind via Vite.';
        }
      } catch (e) { /* skip invalid composer.json */ }
    }
  }
}

// Styling detection
let styling = 'css-modules', stylingVersion = null, stylingNotes = '';
if (deps['tailwindcss']) {
  styling = 'tailwind'; stylingVersion = deps['tailwindcss'];
  const major = parseInt((stylingVersion || '').replace(/[^\d]/, ''));
  stylingNotes = major >= 4
    ? 'Tailwind v4: use @theme in CSS, NOT tailwind.config.js'
    : 'Tailwind v3: use tailwind.config.js theme extension';
} else if (deps['styled-components']) {
  styling = 'styled-components'; stylingNotes = 'Use styled.div template literals. Avoid global styles.';
} else if (deps['@emotion/react']) {
  styling = 'emotion'; stylingNotes = 'Use css prop or styled from @emotion/styled.';
} else if (deps['@vanilla-extract/css']) {
  styling = 'vanilla-extract'; stylingNotes = 'Use style() and createVar() — zero runtime.';
}

// Motion library
const hasMotion = !!(deps['motion'] || deps['framer-motion']);
const motionPkg = deps['motion']
  ? 'motion'
  : deps['framer-motion']
    ? 'framer-motion (migrate to motion)'
    : null;
const motionImport = hasMotion ? 'motion/react' : null;
const motionNotes = hasMotion
  ? 'motion/react (renamed from framer-motion). Use Spring class for Svelte.'
  : '';

// Component primitives
const hasShadcn = !!(
  deps['@shadcn/ui'] ||
  fs.existsSync(path.join(projectRoot, 'components', 'ui'))
);
const hasRadix = Object.keys(deps).some(k => k.startsWith('@radix-ui/'));
const primitiveNotes = (hasShadcn || hasRadix)
  ? 'Use shadcn/ui + Radix primitives for accessible components.'
  : '';

const output = {
  detected_at: new Date().toISOString(),
  project_root: projectRoot,
  framework: { name: fw, version: fwVersion, notes: fwNotes },
  styling: { system: styling, version: stylingVersion, notes: stylingNotes },
  motion_library: { available: hasMotion, package: motionPkg, import: motionImport, notes: motionNotes },
  component_primitives: { shadcn: hasShadcn, radix: hasRadix, notes: primitiveNotes }
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

// Construct additionalContext for Claude
const parts = [
  `Framework detected: ${fw}${fwVersion ? ' ' + fwVersion : ''}.`,
  `Styling: ${styling}${stylingVersion ? ' ' + stylingVersion : ''}.`,
  stylingNotes,
  fwNotes,
  motionNotes,
  primitiveNotes
].filter(Boolean);

// Read taste profile from system.md if it exists, and append to context
const systemMd = require('path').join(projectRoot, 'system.md');
if (fs.existsSync(systemMd)) {
  const taste = fs.readFileSync(systemMd, 'utf8');
  const rejectedMatch = taste.match(/### Rejected styles([\s\S]*?)(?=###|$)/);
  const positiveMatch = taste.match(/### Positive signals \(reinforce\)([\s\S]*?)(?=###|$)/);
  if (rejectedMatch && rejectedMatch[1].trim()) {
    parts.push('TASTE PROFILE — Rejected styles (exclude from candidate set):');
    parts.push(rejectedMatch[1].trim());
  }
  if (positiveMatch && positiveMatch[1].trim()) {
    parts.push('TASTE PROFILE — Positive signals (reinforce these directions):');
    parts.push(positiveMatch[1].trim());
  }
}

let additionalContext = parts.join(' ').trim();
if (additionalContext.length > 10000) {
  additionalContext = additionalContext.slice(0, 9997) + '...';
}

console.log(JSON.stringify({ additionalContext }));
NODEJS
