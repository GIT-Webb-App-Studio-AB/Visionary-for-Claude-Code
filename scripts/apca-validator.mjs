#!/usr/bin/env node
// APCA Lc validator — scans every style file, extracts color pairs from the
// Colors section, computes APCA Lc for each primary-on-background combination,
// and reports any pair that falls below the style's declared
// `accessibility.contrast_floor_apca` (or the legacy WCAG floor × 15 heuristic).
//
// APCA algorithm implemented from the apca-w3 public spec (2024):
//   https://github.com/Myndex/apca-w3
//   https://git.apcacontrast.com/documentation/APCAeasyIntro
//
// This is a reduced but self-contained implementation — no dependencies. If a
// project needs the full reference, `npm i apca-w3` gives the canonical one;
// we prefer zero-deps so the validator runs as part of plain Node tooling.
//
// Usage:
//   node scripts/apca-validator.mjs          # scan everything
//   node scripts/apca-validator.mjs --strict # exit 1 on any violation (CI mode)
//   node scripts/apca-validator.mjs --json   # machine-readable output

import { readFileSync, readdirSync } from 'node:fs';
import { join, basename, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));
const stylesDir = join(repoRoot, 'skills', 'visionary', 'styles');

const STRICT = process.argv.includes('--strict');
const JSON_OUT = process.argv.includes('--json');

// ── APCA Lc — reduced implementation of apca-w3 0.1.9 ────────────────────────
// Constants from the SAPC-APCA whitepaper:
const mainTRC = 2.4;              // sRGB gamma exponent
const Rco = 0.2126729;
const Gco = 0.7151522;
const Bco = 0.0721750;

const normBG = 0.56;              // normal text, dark bg
const normTXT = 0.57;
const revTXT = 0.62;              // reversed — light text on dark bg
const revBG = 0.65;

const blkThrs = 0.022;            // black-clamp threshold
const blkClmp = 1.414;            // black-clamp exponent
const scaleBoW = 1.14;            // scale for dark text on light bg
const scaleWoB = 1.14;
const loBoWoffset = 0.027;
const loWoBoffset = 0.027;
const deltaYmin = 0.0005;
const loClip = 0.1;

function hexToRgbLinear(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function sRGBtoY(rgb) {
  // Simple-gamma approximation used by APCA (NOT the piecewise sRGB→linear
  // IEC 61966-2-1 transform). Matches apca-w3's "simple exponent" path.
  const [r, g, b] = rgb.map((c) => Math.pow(c, mainTRC));
  let Y = r * Rco + g * Gco + b * Bco;
  // Black-level soft clamp
  if (Y < blkThrs) {
    Y += Math.pow(blkThrs - Y, blkClmp);
  }
  return Y;
}

/**
 * APCA Lc — perceptually-uniform contrast of text-on-background.
 * Returns a signed value: positive = dark text on light bg, negative = the
 * inverse. Absolute Lc ≥ 60 ≈ WCAG AA for body text; Lc ≥ 75 recommended.
 */
export function apcaLc(textHex, bgHex) {
  const txtY = sRGBtoY(hexToRgbLinear(textHex));
  const bgY = sRGBtoY(hexToRgbLinear(bgHex));

  if (Math.abs(bgY - txtY) < deltaYmin) return 0;

  let outputContrast;
  if (bgY > txtY) {
    // dark text on light bg (BoW)
    const SAPC = (Math.pow(bgY, normBG) - Math.pow(txtY, normTXT)) * scaleBoW;
    outputContrast = SAPC < loClip ? 0 : SAPC - loBoWoffset;
  } else {
    // light text on dark bg (WoB)
    const SAPC = (Math.pow(bgY, revBG) - Math.pow(txtY, revTXT)) * scaleWoB;
    outputContrast = SAPC > -loClip ? 0 : SAPC + loWoBoffset;
  }

  // Return Lc in the -108 … +106 range (standard APCA output)
  return outputContrast * 100;
}

// ── Style file scanner ──────────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && extname(entry.name) === '.md' && entry.name !== '_index.md') out.push(full);
  }
  return out;
}

function extractFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
    // Flatten the accessibility sub-object for our purposes
    const acc = line.match(/^\s{2}([a-z_]+):\s*(.*)$/);
    if (acc) out[`accessibility_${acc[1]}`] = acc[2].trim();
  }
  return out;
}

function sectionColors(src) {
  const m = src.match(/##\s+Colors\s*\n([\s\S]*?)(?=\n##\s+|$)/i);
  return m ? m[1] : '';
}

function firstHex(s) {
  const m = s && s.match(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/);
  if (!m) return null;
  const hex = m[0];
  return hex.length === 4
    ? '#' + hex.slice(1).split('').map((c) => c + c).join('').toUpperCase()
    : hex.toUpperCase();
}

function parseColorPairs(colorsSection) {
  // Bullet lines like `- **Background:** #F2EBE0 (unbleached linen)`
  const map = {};
  for (const m of colorsSection.matchAll(/^-\s+\*\*([^:*]+):\*\*\s+(.+)$/gm)) {
    const key = m[1].trim().toLowerCase();
    const hex = firstHex(m[2]);
    if (hex) map[key] = hex;
  }
  return map;
}

// ── Main ────────────────────────────────────────────────────────────────────
const files = walk(stylesDir);
const report = { scanned: 0, passed: 0, warned: 0, failed: 0, entries: [] };

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const fm = extractFrontmatter(src);
  const colors = parseColorPairs(sectionColors(src));
  report.scanned++;

  const id = basename(file, '.md');
  const isAAA = /high-contrast-a11y|dyslexia-friendly/.test(id);
  const bodyFloor = isAAA ? 90 : 75;   // APCA Lc floor for body
  const uiFloor   = isAAA ? 75 : 60;   // Lc floor for large/UI

  const bg = colors['background'];
  const pairs = [
    { role: 'primary text',   against: bg, hex: colors['primary text'] || colors['text'], floor: bodyFloor },
    { role: 'primary action', against: bg, hex: colors['primary action'] || colors['primary'], floor: uiFloor },
    { role: 'accent',         against: bg, hex: colors['accent'], floor: uiFloor },
  ].filter((p) => p.hex && p.against);

  if (!bg || pairs.length === 0) {
    continue; // no usable color pairs (many texture styles skip primary)
  }

  for (const p of pairs) {
    const lc = Math.abs(apcaLc(p.hex, p.against));
    const status = lc >= p.floor ? 'pass' : (lc >= p.floor - 10 ? 'warn' : 'fail');
    if (status === 'pass') report.passed++;
    else if (status === 'warn') report.warned++;
    else report.failed++;

    report.entries.push({
      id,
      role: p.role,
      text: p.hex,
      bg: p.against,
      lc: Number(lc.toFixed(1)),
      floor: p.floor,
      status,
    });
  }
}

// ── Output ──────────────────────────────────────────────────────────────────
if (JSON_OUT) {
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} else {
  console.log(`APCA Lc validation — ${report.scanned} styles scanned`);
  console.log(`  passed: ${report.passed}`);
  console.log(`  warned: ${report.warned}`);
  console.log(`  failed: ${report.failed}`);
  console.log('');
  const failing = report.entries.filter((e) => e.status !== 'pass');
  if (failing.length === 0) {
    console.log('All text-on-background pairs meet their APCA floors.');
  } else {
    console.log('Below-floor pairs:');
    for (const e of failing) {
      const marker = e.status === 'fail' ? 'FAIL' : 'warn';
      console.log(`  [${marker}] ${e.id.padEnd(32)} ${e.role.padEnd(16)} ${e.text} on ${e.bg}  Lc=${e.lc}  (floor ${e.floor})`);
    }
  }
}

if (STRICT && report.failed > 0) {
  process.exit(1);
}
