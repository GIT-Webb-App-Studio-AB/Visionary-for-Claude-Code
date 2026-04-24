#!/usr/bin/env node
// infer-kit-from-prisma.mjs — Sprint 07 Task 21.3.
//
// Parses prisma/schema.prisma and emits a visionary-kit.json draft.
// Respects @default() annotations where present and maps relations to kit
// entity relations with cardinality.
//
// Prisma model shape we accept:
//   model User {
//     id        String   @id @default(uuid())
//     email     String   @unique
//     name      String?
//     role      Role     @default(MEMBER)
//     posts     Post[]                          // one-to-many
//     company   Company? @relation(...)         // zero-or-one
//     createdAt DateTime @default(now())
//   }
//   enum Role { ADMIN MEMBER VIEWER }
//
// Non-goals for v1.0: multi-schema, views, preview features like
// extendedIndexes, @@map rewrites, JSON-typed fields beyond Json→object.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findProjectRoot } from '../hooks/scripts/lib/taste-io.mjs';
import { sampleFor, constraintsFor } from '../hooks/scripts/lib/kit-sampler.mjs';

// ── CLI ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = {
    schema: null,
    root: null,
    locale: null,
    write: false,
    force: false,
    entityPattern: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--schema': opts.schema = next(); break;
      case '--root': opts.root = next(); break;
      case '--locale': opts.locale = next(); break;
      case '--write': opts.write = true; break;
      case '--force': opts.force = true; break;
      case '--entity-pattern': opts.entityPattern = new RegExp(next()); break;
      case '--help': case '-h':
        console.error(`
infer-kit-from-prisma — extract visionary-kit.json from prisma/schema.prisma

Usage: node scripts/infer-kit-from-prisma.mjs [options]

Options:
  --schema <path>         schema.prisma (default: <root>/prisma/schema.prisma)
  --root <dir>            project root (default: cwd)
  --locale <tag>          sv|de|fr|es|en (default: detect)
  --write                 Write visionary-kit.json (default: stdout)
  --force                 Overwrite existing kit
  --entity-pattern <re>   Filter by model name (regex)
`.trim());
        process.exit(0);
    }
  }
  return opts;
}

// ── Prisma parser (regex-based, tuned to common schemas) ────────────────────
// Captures each `model Name { … }` block. Within a block we parse field
// lines of shape `fieldName Type modifiers`.

const MODEL_RE = /\bmodel\s+([A-Za-z_]\w*)\s*\{([\s\S]*?)\n\}/g;
const ENUM_RE = /\benum\s+([A-Za-z_]\w*)\s*\{([\s\S]*?)\n\}/g;

function parseSchema(src) {
  const enums = new Map();
  for (const [, name, body] of src.matchAll(ENUM_RE)) {
    const values = body
      .split(/\n/)
      .map((l) => l.trim().replace(/\/\/.*$/, '').trim())
      .filter(Boolean);
    enums.set(name, values);
  }

  const models = [];
  for (const [, name, body] of src.matchAll(MODEL_RE)) {
    const fields = parseModelBody(body, enums);
    models.push({ name, fields });
  }
  return { models, enums };
}

const FIELD_LINE_RE = /^([A-Za-z_]\w*)\s+([A-Za-z_]\w*)(\??)(\[\])?(.*)$/;

function parseModelBody(body, enums) {
  const out = [];
  const lines = body.split('\n');
  for (const raw of lines) {
    const line = raw.trim().replace(/\/\/.*$/, '').trim();
    if (!line || line.startsWith('@@')) continue; // model-level attrs skipped
    const m = line.match(FIELD_LINE_RE);
    if (!m) continue;
    const [, name, type, optional, array, tail = ''] = m;
    const isOptional = optional === '?';
    const isArray = array === '[]';
    const isRelation = /@relation/.test(tail);
    const defaultMatch = tail.match(/@default\(([^)]*)\)/);
    const enumValues = enums.get(type) || null;
    out.push({
      name,
      rawType: type,
      optional: isOptional,
      array: isArray,
      relation: isRelation,
      default: defaultMatch ? defaultMatch[1].trim() : null,
      enumValues,
    });
  }
  return out;
}

// ── Prisma → kit types mapping ──────────────────────────────────────────────
function prismaToKitType(field) {
  const base = field.rawType;
  const primitives = {
    String: 'string', Int: 'number', BigInt: 'bigint', Float: 'number',
    Decimal: 'decimal', Boolean: 'boolean', DateTime: 'datetime',
    Json: 'object', Bytes: 'string',
  };
  let t = primitives[base] || 'object';
  if (field.enumValues && field.enumValues.length) t = field.enumValues.map((v) => `'${v}'`).join(' | ');
  if (field.array) t += '[]';
  if (field.optional) t += '?';
  return t;
}

// ── Relation detection ──────────────────────────────────────────────────────
// A field whose type matches another model name (not a primitive) is a
// relation. Arrays → 'many'; optional singular → 'zero-or-one'; plain
// singular → 'one'.
function isRelation(field, modelNames) {
  return modelNames.has(field.rawType) && !field.enumValues;
}

function relationCardinality(field) {
  if (field.array) return 'many';
  if (field.optional) return 'zero-or-one';
  return 'one';
}

// ── Sample + constraints ─────────────────────────────────────────────────────
function modelToKitEntity({ name, fields, modelNames, locale, sampleCount = 3 }) {
  const sampleFields = fields.filter((f) => !isRelation(f, modelNames));
  const relationFields = fields.filter((f) => isRelation(f, modelNames));

  const sample = [];
  for (let i = 0; i < sampleCount; i++) {
    const row = {};
    for (const f of sampleFields) {
      const type = prismaToKitType(f);
      row[f.name] = sampleFor({
        entityName: name,
        fieldName: f.name,
        type,
        locale,
        index: i,
      });
      // Honour @default(uuid()|cuid()|autoincrement()|now()) if present.
      if (f.default) row[f.name] = applyDefault(f, row[f.name], i);
    }
    sample.push(row);
  }

  const constraints = {};
  for (const f of sampleFields) {
    const type = prismaToKitType(f);
    let c = constraintsFor({ fieldName: f.name, type, locale });
    if (f.enumValues && f.enumValues.length) {
      c = c || {};
      c.enum = f.enumValues;
    }
    if (c) constraints[f.name] = c;
  }

  const relations = {};
  for (const f of relationFields) {
    const key = f.name;
    relations[key] = {
      target: f.rawType,
      cardinality: relationCardinality(f),
    };
    if (f.array) relations[key].sample_size_p95 = 3;
  }

  const out = { sample };
  if (Object.keys(constraints).length) out.constraints = constraints;
  if (Object.keys(relations).length) out.relations = relations;
  return out;
}

function applyDefault(field, generated, index) {
  const d = (field.default || '').toLowerCase();
  if (d.startsWith('autoincrement')) return index + 1;
  if (d.startsWith('uuid')) return generated; // our sampler already produces realistic id strings
  if (d.startsWith('cuid')) return generated;
  if (d.startsWith('now')) return new Date().toISOString();
  // String literal default like `@default("active")`
  const strMatch = field.default.match(/^['"](.*)['"]$/);
  if (strMatch) return strMatch[1];
  // Numeric literal
  if (/^-?\d+(\.\d+)?$/.test(field.default)) return Number(field.default);
  if (field.default === 'true') return true;
  if (field.default === 'false') return false;
  return generated;
}

// ── Main ────────────────────────────────────────────────────────────────────
function main() {
  const opts = parseArgs(process.argv.slice(2));
  const root = resolve(opts.root || findProjectRoot(process.cwd()));
  const schemaPath = resolve(opts.schema || join(root, 'prisma', 'schema.prisma'));
  if (!existsSync(schemaPath)) {
    console.error(`No prisma schema found at ${schemaPath}.`);
    process.exit(1);
  }
  const src = readFileSync(schemaPath, 'utf8');
  const { models } = parseSchema(src);
  if (!models.length) {
    console.error(`No model blocks found in ${schemaPath}`);
    process.exit(1);
  }
  const modelNames = new Set(models.map((m) => m.name));

  const locale = opts.locale || detectLocale(root) || 'en';
  const kit = {
    $schema: 'https://visionary-claude.dev/schemas/visionary-kit.schema.json',
    schema_version: '1.0.0',
    locale,
    inferred_from: 'prisma',
    entities: {},
    component_constraints: {
      table: { p50_rows: 12, p95_rows: 47, max_rows: 500 },
      list: { empty_rate: 0.18, p95_rows: 30 },
    },
    required_states: ['loading', 'empty', 'error', 'populated'],
  };

  let matched = 0;
  for (const m of models) {
    if (opts.entityPattern && !opts.entityPattern.test(m.name)) continue;
    kit.entities[m.name] = modelToKitEntity({ ...m, modelNames, locale });
    matched++;
  }

  if (matched === 0) {
    console.error('No models matched the pattern.');
    process.exit(1);
  }

  const json = JSON.stringify(kit, null, 2) + '\n';
  if (opts.write) {
    const target = join(root, 'visionary-kit.json');
    if (existsSync(target) && !opts.force) {
      console.error(`visionary-kit.json already exists at ${target}. Re-run with --force to overwrite.`);
      process.exit(1);
    }
    writeFileSync(target, json, 'utf8');
    console.log(`Inferred ${matched} models from ${schemaPath} → ${target}`);
  } else {
    process.stdout.write(json);
  }
}

function detectLocale(root) {
  const existingKit = join(root, 'visionary-kit.json');
  if (existsSync(existingKit)) {
    try {
      const k = JSON.parse(readFileSync(existingKit, 'utf8'));
      if (k?.locale) return k.locale;
    } catch { /* ignore */ }
  }
  return null;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  try { main(); }
  catch (e) { console.error('prisma inference failed:', e.message); process.exit(1); }
}

export { parseSchema, parseModelBody, prismaToKitType, modelToKitEntity };
