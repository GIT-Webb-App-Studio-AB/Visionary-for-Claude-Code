#!/usr/bin/env node
// DTCG 1.0 token exporter. For every style file under skills/visionary/styles
// emits tokens/{id}.tokens.json following the W3C Design Tokens Community Group
// draft spec (stable as of October 2025). The output is consumable by:
//   - Figma Variables (native import, November 2026 release)
//   - Style Dictionary v4
//   - Penpot, Knapsack, Tokens Studio, etc.
//
// Parses the Colors, Typography, Motion, Spacing sections of each style file
// using the same convention the rest of the skill enforces (bold key, value
// after colon). Each style emits a flat-ish DTCG tree: color.{bg,primary,...},
// typography.{display,body}, motion.{spring,enter}, spacing.{base,radius}.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, basename, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));
const stylesDir = join(repoRoot, 'skills', 'visionary', 'styles');
const outputDir = join(repoRoot, 'tokens');

mkdirSync(outputDir, { recursive: true });

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && extname(entry.name) === '.md' && entry.name !== '_index.md') out.push(full);
  }
  return out;
}

// Section = everything from `## Name` up to (but not including) the next `## `.
function section(src, heading) {
  const re = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
  const m = src.match(re);
  return m ? m[1] : '';
}

// Line parser: captures `- **Key:** Value` entries (the convention every style
// file uses). Returns { key: value } map.
function parseBullets(body) {
  const out = {};
  for (const m of body.matchAll(/^-\s+\*\*([^:*]+):\*\*\s+(.+)$/gm)) {
    const key = m[1].trim().toLowerCase();
    const value = m[2].trim();
    out[key] = value;
  }
  return out;
}

// Pull the first hex out of a value string (e.g. "#2D5A27 (deep forest-green)")
function firstHex(val) {
  const m = val && val.match(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/);
  return m ? (m[0].length === 4
    ? '#' + m[0].slice(1).split('').map((c) => c + c).join('').toUpperCase()
    : m[0].toUpperCase()) : null;
}

// Pull a font-family identifier ("Inter Bold" → "Inter")
function primaryFont(val) {
  if (!val) return null;
  const first = val.split(/[,—-]/)[0].trim();
  return first.replace(/\s+(Bold|Regular|Black|Light|Thin|Italic|Medium).*$/i, '').trim() || null;
}

// Pull numeric values with units (e.g. "8px", "0.35s", "0.02em")
function firstNumberWithUnit(val) {
  const m = val && val.match(/(-?\d+(?:\.\d+)?)(px|em|rem|s|ms|%)?/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2] || 'px';
  return { value: n, unit };
}

// Pull spring params from `{ stiffness: 300, damping: 25, mass: 1 }`
function parseSpring(val) {
  if (!val) return null;
  const get = (key) => {
    const m = val.match(new RegExp(`${key}:\\s*(-?\\d+(?:\\.\\d+)?)`));
    return m ? parseFloat(m[1]) : null;
  };
  const stiffness = get('stiffness');
  const damping   = get('damping');
  const mass      = get('mass');
  const bounce    = get('bounce');
  const duration  = get('visualDuration') ?? get('duration');
  const out = {};
  if (stiffness != null) out.stiffness = stiffness;
  if (damping   != null) out.damping = damping;
  if (mass      != null) out.mass = mass;
  if (bounce    != null) out.bounce = bounce;
  if (duration  != null) out.visualDuration = duration;
  return Object.keys(out).length ? out : null;
}

function extractFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function buildTokens(file) {
  const src = readFileSync(file, 'utf8');
  const id = basename(file, '.md');
  const fm = extractFrontmatter(src);

  const colors  = parseBullets(section(src, 'Colors'));
  const type    = parseBullets(section(src, 'Typography'));
  const motion  = parseBullets(section(src, 'Motion'));
  const spacing = parseBullets(section(src, 'Spacing'));

  const tokens = {
    $schema: 'https://design-tokens.github.io/spec/draft/schema.json',
    $description: `${id} — ${fm.category || 'style'} / ${fm.motion_tier || 'Subtle'}`,
    color: {},
    typography: {},
    motion: {},
    spacing: {},
  };

  // ── Colors ───────────────────────────────────────────────────────────
  const colorKeyMap = {
    'background':        'bg',
    'primary action':    'primary',
    'primary':           'primary',
    'accent':            'accent',
    'secondary accent':  'accent-2',
    'secondary':         'accent-2',
    'ghost color':       'ghost',
    'text':              'text',
    'primary text':      'text',
  };
  for (const [k, v] of Object.entries(colors)) {
    const slot = colorKeyMap[k] || k.replace(/\s+/g, '-');
    const hex = firstHex(v);
    if (hex) {
      tokens.color[slot] = {
        $value: hex,
        $type: 'color',
        $description: v.replace(/#[0-9A-Fa-f]{3,6}/, '').replace(/^\s*[(-]\s*|\s*[)-]\s*$/g, '').trim() || undefined,
      };
    }
  }

  // ── Typography ───────────────────────────────────────────────────────
  const display = primaryFont(type['display font']);
  const body    = primaryFont(type['body font']);
  const tracking = firstNumberWithUnit(type['tracking']);
  const leading  = parseFloat((type['leading'] || '').match(/\d+(?:\.\d+)?/)?.[0] || '');
  if (display) {
    tokens.typography.display = { $value: display, $type: 'fontFamily' };
  }
  if (body) {
    tokens.typography.body = { $value: body, $type: 'fontFamily' };
  }
  if (tracking) {
    tokens.typography.tracking = { $value: `${tracking.value}${tracking.unit}`, $type: 'dimension' };
  }
  if (!isNaN(leading)) {
    tokens.typography.leading = { $value: leading, $type: 'number' };
  }

  // ── Motion ───────────────────────────────────────────────────────────
  const tier = fm.motion_tier || 'Subtle';
  tokens.motion.tier = { $value: tier, $type: 'other' };
  const spring = parseSpring(motion['spring tokens']);
  if (spring) {
    tokens.motion.spring = {
      $value: JSON.stringify(spring),
      $type: 'other',
      $description: 'Motion v12 two-parameter spring (bounce/visualDuration) or v11 legacy (stiffness/damping/mass).',
    };
  }

  // ── Spacing ──────────────────────────────────────────────────────────
  const base = firstNumberWithUnit(spacing['base grid']);
  if (base) {
    tokens.spacing.base = {
      $value: `${base.value}${base.unit}`,
      $type: 'dimension',
      $description: 'Base grid unit (all spacing is a multiple of this).',
    };
  }
  const radius = spacing['border-radius vocabulary'];
  if (radius) {
    // e.g. "12-24px; organic soft curves inspired by leaf edges"
    const rm = radius.match(/(\d+)\s*[-–—]\s*(\d+)\s*px/);
    if (rm) {
      tokens.spacing['radius-min'] = { $value: `${rm[1]}px`, $type: 'dimension' };
      tokens.spacing['radius-max'] = { $value: `${rm[2]}px`, $type: 'dimension' };
    } else {
      const rOne = firstNumberWithUnit(radius);
      if (rOne) tokens.spacing.radius = { $value: `${rOne.value}${rOne.unit}`, $type: 'dimension' };
    }
  }

  return { id, tokens };
}

const files = walk(stylesDir);
let written = 0;

for (const file of files) {
  try {
    const { id, tokens } = buildTokens(file);
    const outFile = join(outputDir, `${id}.tokens.json`);
    writeFileSync(outFile, JSON.stringify(tokens, null, 2) + '\n', 'utf8');
    written++;
  } catch (err) {
    console.error(`failed ${file}:`, err.message);
  }
}

// Write an index pointing to every style's tokens file.
const indexTokens = {
  $schema: 'https://design-tokens.github.io/spec/draft/schema.json',
  $description: 'Visionary — DTCG 1.0 token manifest. Import per-style tokens from tokens/{id}.tokens.json.',
  $version: '1.3.0',
  styles: Object.fromEntries(
    files
      .map((f) => basename(f, '.md'))
      .sort()
      .map((id) => [id, { $ref: `./${id}.tokens.json` }])
  ),
};
writeFileSync(join(outputDir, 'index.tokens.json'), JSON.stringify(indexTokens, null, 2) + '\n', 'utf8');

console.log(`wrote: ${written} token files + index.tokens.json`);
console.log(`out:   ${outputDir}`);
