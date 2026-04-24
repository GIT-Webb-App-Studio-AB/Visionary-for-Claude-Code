#!/usr/bin/env node
// migrate-designers-to-taste.mjs — Sprint 07 Task 20.4.
//
// One-shot migration: read designers/*.json (legacy format) and emit a
// parallel <handle>.taste TOML file for each. The JSON files are left in
// place so /designer (commands/designer.md) keeps working during the
// transition; new taste-file consumers can load .taste directly.
//
// Handle derivation: <filename>.json → <filename> (must satisfy the
// .taste handle regex — these all do).
//
// Mapping (legacy → .taste):
//   biases.style_weight_multipliers → preferences.prefer_styles
//     confidence = clamp(multiplier / 5.0, 0.2, 0.95)
//   biases.style_blocklist          → preferences.avoid_styles (confidence 0.9)
//   biases.palette_tags_preferred   → preferences.prefer_palette_tags
//   biases.palette_tags_forbidden   → preferences.avoid_palette_tags
//   biases.motion_tier_cap          → preferences.avoid_motion_tiers
//     (every tier strictly above the cap in Static<Subtle<Expressive<Kinetic)
//   biases.typography_preferred     → typography.preferred_families
//   biases.typography_forbidden     → typography.avoided_families
//   rules[]                         → constitution.principles (joined by \n\n)

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify as tomlStringify } from '../hooks/scripts/lib/toml-lite.mjs';

const MOTION_ORDER = ['Static', 'Subtle', 'Expressive', 'Kinetic'];

function migrateOne(inputPath) {
  const raw = JSON.parse(readFileSync(inputPath, 'utf8'));
  const handle = basename(inputPath, '.json');
  const b = raw.biases || {};

  const prefer_styles = [];
  for (const [id, mult] of Object.entries(b.style_weight_multipliers || {})) {
    if (!Number.isFinite(mult) || mult <= 1.0) continue; // only net-positive biases become preferences
    const confidence = Math.max(0.2, Math.min(0.95, mult / 5.0));
    prefer_styles.push({ id, confidence: round2(confidence) });
  }
  prefer_styles.sort((a, b) => b.confidence - a.confidence);

  const avoid_styles = [];
  for (const id of b.style_blocklist || []) {
    avoid_styles.push({ id, confidence: 0.9, reason: 'blocked by designer pack' });
  }

  const prefer_palette_tags = Array.from(new Set(b.palette_tags_preferred || []));
  const avoid_palette_tags = Array.from(new Set(b.palette_tags_forbidden || []));

  const avoid_motion_tiers = [];
  if (b.motion_tier_cap) {
    const capIdx = MOTION_ORDER.indexOf(b.motion_tier_cap);
    if (capIdx >= 0) {
      for (let i = capIdx + 1; i < MOTION_ORDER.length; i++) avoid_motion_tiers.push(MOTION_ORDER[i]);
    }
  }

  const preferred_families = Array.from(new Set(b.typography_preferred || []));
  const avoided_families = Array.from(new Set(b.typography_forbidden || []));

  const preferences = {};
  if (prefer_styles.length) preferences.prefer_styles = prefer_styles;
  if (avoid_styles.length) preferences.avoid_styles = avoid_styles;
  if (prefer_palette_tags.length) preferences.prefer_palette_tags = prefer_palette_tags;
  if (avoid_palette_tags.length) preferences.avoid_palette_tags = avoid_palette_tags;
  if (avoid_motion_tiers.length) preferences.avoid_motion_tiers = avoid_motion_tiers;

  const typography = {};
  if (preferred_families.length) typography.preferred_families = preferred_families;
  if (avoided_families.length) typography.avoided_families = avoided_families;

  const doc = {
    schema_version: '1.0.0',
    handle,
  };
  if (raw.name) doc.author = raw.name;
  if (raw.description) doc.description = String(raw.description).slice(0, 240);

  doc.metadata = {
    created_at: new Date().toISOString(),
    era: raw.era || '',
    migrated_from_json: true,
  };

  if (Object.keys(preferences).length) doc.preferences = preferences;
  if (Object.keys(typography).length) doc.typography = typography;

  const rules = Array.isArray(raw.rules) ? raw.rules : [];
  const principles = rules.map((r) => String(r).trim()).filter(Boolean).join('\n\n');
  if (principles) doc.constitution = { principles };

  const toml = tomlStringify(doc, {
    sectionOrder: ['metadata', 'preferences', 'typography', 'pairs', 'constitution', 'privacy'],
    headerComment: `Migrated from designers/${handle}.json on ${new Date().toISOString()}.\nSee docs/taste-dotfile-spec.md for the .taste schema.`,
  });

  return { handle, toml, doc };
}

function round2(n) { return Math.round(n * 100) / 100; }

function main() {
  const thisFile = fileURLToPath(import.meta.url);
  const pluginRoot = resolve(dirname(thisFile), '..');
  const designersDir = join(pluginRoot, 'designers');
  if (!existsSync(designersDir)) {
    console.error(`No designers/ directory at ${designersDir}`);
    process.exit(1);
  }
  const jsonFiles = readdirSync(designersDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(designersDir, f));
  if (!jsonFiles.length) {
    console.error('No *.json files in designers/');
    process.exit(1);
  }

  const summary = [];
  for (const p of jsonFiles) {
    try {
      const { handle, toml } = migrateOne(p);
      const outPath = join(designersDir, `${handle}.taste`);
      writeFileSync(outPath, toml, 'utf8');
      summary.push(`  ✓ ${handle}.taste`);
    } catch (e) {
      summary.push(`  ✗ ${basename(p)}: ${e.message}`);
    }
  }
  console.log(`Migrated ${jsonFiles.length} designer pack(s):`);
  for (const line of summary) console.log(line);
  console.log('\nOriginal .json files left in place for /designer backward-compat.');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  try { main(); }
  catch (e) { console.error('migration failed:', e.message); process.exit(1); }
}

export { migrateOne };
