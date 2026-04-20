#!/usr/bin/env node
// shadcn v4 registry publisher. Emits a registry.json index plus per-style
// registry:style items at registry/r/{id}.json so consumers can run:
//
//   npx shadcn@latest add https://{host}/r/{id}.json
//
// Each item maps Visionary tokens to shadcn's `cssVars` + `css` fields so
// calling `shadcn add` installs the style into a fresh shadcn project. The
// style only writes CSS variables — it does NOT install components (that's
// what the user's own shadcn/ui components are for; we re-skin them).
//
// Schema reference: https://ui.shadcn.com/schema/registry-item.json
//
// Usage:
//   node scripts/build-shadcn-registry.mjs

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, basename, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));
const tokensDir = join(repoRoot, 'tokens');
const registryDir = join(repoRoot, 'registry');
const itemsDir = join(registryDir, 'r');

mkdirSync(itemsDir, { recursive: true });

// Pkg metadata — used for the registry homepage + author
const pkg = JSON.parse(readFileSync(join(repoRoot, '.claude-plugin', 'plugin.json'), 'utf8'));

// ── Helpers ──────────────────────────────────────────────────────────────────
function hexToOklch(hex) {
  // Same math as scripts/build-palette-tokens.mjs — kept inline to avoid a
  // shared-module import and keep both scripts standalone-runnable.
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const rL = lin(r), gL = lin(g), bL = lin(b);
  const lMs = 0.4122214708 * rL + 0.5363325363 * gL + 0.0514459929 * bL;
  const mMs = 0.2119034982 * rL + 0.6806995451 * gL + 0.1073969566 * bL;
  const sMs = 0.0883024619 * rL + 0.2817188376 * gL + 0.6299787005 * bL;
  const lC = Math.cbrt(lMs), mC = Math.cbrt(mMs), sC = Math.cbrt(sMs);
  const L = 0.2104542553 * lC + 0.7936177850 * mC - 0.0040720468 * sC;
  const a = 1.9779984951 * lC - 2.4285922050 * mC + 0.4505937099 * sC;
  const b2 = 0.0259040371 * lC + 0.7827717662 * mC - 0.8086757660 * sC;
  const C = Math.sqrt(a * a + b2 * b2);
  let H = (Math.atan2(b2, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

function asColor(value) {
  if (!value) return null;
  if (value.startsWith('#')) return hexToOklch(value);
  return value; // already oklch/hsl/rgb
}

// shadcn's semantic slot names; we map visionary token keys to these.
function mapSlots(color) {
  return {
    background:    asColor(color?.bg?.$value),
    foreground:    asColor(color?.text?.$value),
    primary:       asColor(color?.primary?.$value),
    'primary-foreground': asColor(color?.bg?.$value) || 'oklch(1 0 0)',
    accent:        asColor(color?.accent?.$value),
    'accent-foreground': asColor(color?.bg?.$value) || 'oklch(0 0 0)',
    secondary:     asColor(color?.['accent-2']?.$value),
    'secondary-foreground': asColor(color?.bg?.$value) || 'oklch(1 0 0)',
    border:        asColor(color?.accent?.$value),
    ring:          asColor(color?.primary?.$value),
    muted:         asColor(color?.ghost?.$value) || asColor(color?.['accent-2']?.$value),
    'muted-foreground': asColor(color?.text?.$value),
  };
}

function stripNull(o) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v != null));
}

function buildItem(id, tokens) {
  const slots = stripNull(mapSlots(tokens.color || {}));
  const fontDisplay = tokens.typography?.display?.$value;
  const fontBody = tokens.typography?.body?.$value;
  const radiusMin = tokens.spacing?.['radius-min']?.$value || tokens.spacing?.radius?.$value || '8px';

  // The `cssVars.theme` block contributes `@theme` variables (Tailwind v4).
  // `cssVars.light` / `cssVars.dark` contribute color slots to shadcn's
  // standard two-mode setup.
  const theme = stripNull({
    '--font-display': fontDisplay,
    '--font-body':    fontBody,
    '--radius':       radiusMin,
  });

  const motionTier = (tokens.motion?.tier?.$value || 'Subtle');
  const description = [
    tokens.$description || `${id} — Visionary style`,
    `Motion tier: ${motionTier}.`,
    fontDisplay ? `Display font: ${fontDisplay}.` : '',
  ].filter(Boolean).join(' ');

  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: id,
    type: 'registry:style',
    title: id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
    description,
    dependencies: [],
    registryDependencies: [],
    cssVars: {
      theme,
      light: slots,
      dark: slots, // visionary styles declare their own light/dark semantics
                   // inside the source; shadcn will respect the active mode.
                   // Projects that want a true dark variant pick a different
                   // visionary style (e.g. `cassette-futurism` dark variant).
    },
  };
}

// ── Scan tokens/ and build items ─────────────────────────────────────────────
const items = [];
for (const f of readdirSync(tokensDir).sort()) {
  if (!f.endsWith('.tokens.json') || f === 'index.tokens.json') continue;
  const id = f.replace(/\.tokens\.json$/, '');
  try {
    const tokens = JSON.parse(readFileSync(join(tokensDir, f), 'utf8'));
    const item = buildItem(id, tokens);
    writeFileSync(join(itemsDir, `${id}.json`), JSON.stringify(item, null, 2) + '\n', 'utf8');
    items.push({
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description.slice(0, 200),
    });
  } catch (err) {
    console.error(`skipped ${id}: ${err.message}`);
  }
}

// ── Top-level registry.json ──────────────────────────────────────────────────
const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'visionary',
  homepage: pkg.homepage || 'https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code',
  items,
};

writeFileSync(join(registryDir, 'registry.json'), JSON.stringify(registry, null, 2) + '\n', 'utf8');

// README for consumers
const readme = `# Visionary shadcn/ui registry

Publish this \`registry/\` directory behind any static host and end users can install
any Visionary style into a shadcn/ui project with:

\`\`\`bash
npx shadcn@latest add https://{host}/r/{style-id}.json
\`\`\`

For example:

\`\`\`bash
npx shadcn@latest add https://visionary.example.com/r/swiss-rationalism.json
npx shadcn@latest add https://visionary.example.com/r/liquid-glass-ios26.json
\`\`\`

Each registry item is a \`registry:style\` — installing it writes the style's
OKLCH colors, typography, and radius tokens into the consumer's \`globals.css\`
under the standard shadcn \`:root\` / \`.dark\` blocks plus the Tailwind v4
\`@theme\` layer.

**${items.length} styles available.**

Re-generate: \`node scripts/build-shadcn-registry.mjs\`.
`;
writeFileSync(join(registryDir, 'README.md'), readme, 'utf8');

console.log(`wrote: ${items.length} registry items`);
console.log(`       registry/registry.json + registry/r/*.json + registry/README.md`);
