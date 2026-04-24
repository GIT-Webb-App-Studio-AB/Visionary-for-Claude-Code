#!/usr/bin/env node
// infer-kit-from-openapi.mjs — Sprint 07 Task 21.4.
//
// Extracts visionary-kit.json from an OpenAPI 3.x components.schemas section.
// Input format: JSON (swagger.json, openapi.json). For openapi.yaml the
// caller converts first — we keep this script dep-free and the YAML spec is
// big enough that a hand-rolled parser would bite us on edge cases. The
// one-liner to convert is usually:
//     npx js-yaml openapi.yaml > openapi.json
//
// Supports:
//   - OpenAPI 3.0 + 3.1
//   - components.schemas.<Name> { type, properties, required, nullable, … }
//   - $ref resolution within the same document (cycle-detected)
//   - enums, nullable, formats (email, uri, date, date-time, uuid)
//   - items for array types
//
// Not supported:
//   - oneOf/anyOf/allOf beyond "pick first" fallback
//   - discriminators
//   - external $refs
//   - YAML directly (convert to JSON first)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findProjectRoot } from '../hooks/scripts/lib/taste-io.mjs';
import { sampleFor, constraintsFor } from '../hooks/scripts/lib/kit-sampler.mjs';

// ── CLI ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = {
    spec: null,
    root: null,
    locale: null,
    entityPattern: null,
    write: false,
    force: false,
    stdin: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--spec': opts.spec = next(); break;
      case '--root': opts.root = next(); break;
      case '--locale': opts.locale = next(); break;
      case '--entity-pattern': opts.entityPattern = new RegExp(next()); break;
      case '--write': opts.write = true; break;
      case '--force': opts.force = true; break;
      case '--stdin': opts.stdin = true; break;
      case '--help': case '-h':
        console.error(`
infer-kit-from-openapi — extract visionary-kit.json from OpenAPI 3.x JSON

Usage:
  node scripts/infer-kit-from-openapi.mjs [--spec <path>] [--write]
  npx js-yaml openapi.yaml | node scripts/infer-kit-from-openapi.mjs --stdin

Options:
  --spec <path>           openapi.json / swagger.json
                          (default: <root>/openapi.json || swagger.json)
  --root <dir>            project root (default: cwd)
  --locale <tag>          sv|de|fr|es|en
  --entity-pattern <re>   Filter by schema name
  --write                 Write visionary-kit.json (default: stdout)
  --force                 Overwrite existing kit
  --stdin                 Read spec JSON from stdin (for yaml→json pipes)
`.trim());
        process.exit(0);
    }
  }
  return opts;
}

function readStdinSync() {
  // readFileSync(0) reads stdin synchronously on POSIX + Windows Node 18+.
  // The caller is expected to pipe JSON into us, so a one-shot read is fine.
  try { return readFileSync(0, 'utf8'); }
  catch (e) { throw new Error(`Failed to read stdin: ${e.message}`); }
}

// ── $ref resolution ─────────────────────────────────────────────────────────
function resolveRef(ref, root, stack = new Set()) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  if (stack.has(ref)) throw new Error(`$ref cycle: ${[...stack, ref].join(' → ')}`);
  const path = ref.slice(2).split('/');
  let cur = root;
  for (const seg of path) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = cur[decodeURIComponent(seg)];
  }
  if (cur && typeof cur === 'object' && cur.$ref) {
    return resolveRef(cur.$ref, root, new Set([...stack, ref]));
  }
  return cur;
}

// ── Schema → kit entity ─────────────────────────────────────────────────────
function schemaToKitEntity({ name, schema, spec, locale, sampleCount = 3, refStack = new Set() }) {
  let s = schema;
  if (s && typeof s === 'object' && s.$ref) {
    s = resolveRef(s.$ref, spec);
    if (!s) return null;
  }
  if (!s || typeof s !== 'object') return null;

  // allOf: shallow merge (pick the first concrete object-shape; this is a
  // best-effort MVP — discriminated unions need hand-editing afterwards).
  if (Array.isArray(s.allOf)) {
    const merged = { type: 'object', properties: {}, required: [] };
    for (const sub of s.allOf) {
      const resolved = sub.$ref ? resolveRef(sub.$ref, spec, refStack) : sub;
      if (!resolved) continue;
      Object.assign(merged.properties, resolved.properties || {});
      if (Array.isArray(resolved.required)) merged.required.push(...resolved.required);
    }
    s = merged;
  } else if (Array.isArray(s.oneOf) && s.oneOf.length) {
    const first = s.oneOf[0];
    s = first.$ref ? resolveRef(first.$ref, spec, refStack) : first;
  }

  const properties = s.properties || {};
  const required = new Set(s.required || []);
  const fields = [];
  const relations = {};
  const constraints = {};

  for (const [fname, prop] of Object.entries(properties)) {
    let p = prop;
    let isRelation = false;
    let relationTarget = null;
    let relationKind = null;

    if (p && p.$ref) {
      relationTarget = refName(p.$ref);
      const resolved = resolveRef(p.$ref, spec, refStack);
      if (resolved?.type === 'object') {
        isRelation = true;
        relationKind = 'one';
      } else {
        p = resolved || p;
      }
    }
    if (p && p.type === 'array' && p.items?.$ref) {
      relationTarget = refName(p.items.$ref);
      isRelation = true;
      relationKind = 'many';
    }

    if (isRelation && relationTarget) {
      relations[fname] = { target: relationTarget, cardinality: relationKind };
      if (relationKind === 'many') relations[fname].sample_size_p95 = 3;
      continue; // relations don't contribute to the sample row directly
    }

    const typeHint = openapiTypeToKitType(p);
    fields.push({ name: fname, prop: p, type: typeHint, required: required.has(fname) });

    const c = openapiFieldConstraints({ name: fname, prop: p, type: typeHint, locale, required: required.has(fname) });
    if (c) constraints[fname] = c;
  }

  const sample = [];
  for (let i = 0; i < sampleCount; i++) {
    const row = {};
    for (const f of fields) {
      row[f.name] = sampleFor({
        entityName: name, fieldName: f.name, type: f.type, locale, index: i,
      });
    }
    sample.push(row);
  }

  const out = { sample };
  if (Object.keys(constraints).length) out.constraints = constraints;
  if (Object.keys(relations).length) out.relations = relations;
  return out;
}

function refName(ref) { return ref.split('/').pop() || ''; }

function openapiTypeToKitType(prop) {
  if (!prop) return 'string';
  if (prop.enum && prop.enum.length) return prop.enum.map((v) => `'${v}'`).join(' | ');
  const format = prop.format;
  const type = prop.type || 'string';
  if (type === 'integer' || type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'array') {
    const inner = openapiTypeToKitType(prop.items || { type: 'string' });
    return `${inner}[]`;
  }
  if (format === 'date-time' || format === 'date') return 'datetime';
  if (type === 'object') return 'object';
  return 'string';
}

function openapiFieldConstraints({ name, prop, type, locale, required }) {
  const base = constraintsFor({ fieldName: name, type, locale }) || {};
  if (!prop || typeof prop !== 'object') return base;
  if (prop.enum && prop.enum.length) base.enum = prop.enum.slice();
  if (prop.format === 'email') base.format = 'email';
  if (prop.format === 'uri' || prop.format === 'url') base.format = 'url';
  if (prop.format === 'date' || prop.format === 'date-time') { /* sampler already knows */ }
  if (typeof prop.minLength === 'number') base.p50_length = Math.max(base.p50_length || 0, prop.minLength);
  if (typeof prop.maxLength === 'number') base.p95_length = Math.min(base.p95_length || Infinity, prop.maxLength);
  if (typeof prop.minimum === 'number') base.min = prop.minimum;
  if (typeof prop.maximum === 'number') base.max = prop.maximum;
  if (prop.nullable === true || !required) {
    base.nullable = true;
    if (base.null_rate === undefined && prop.nullable === true) base.null_rate = 0.15;
  }
  return Object.keys(base).length ? base : undefined;
}

// ── Main ────────────────────────────────────────────────────────────────────
function main() {
  const opts = parseArgs(process.argv.slice(2));
  const root = resolve(opts.root || findProjectRoot(process.cwd()));
  let raw;
  let sourceLabel;
  if (opts.stdin) {
    raw = readStdinSync();
    sourceLabel = '<stdin>';
  } else {
    const candidates = opts.spec
      ? [resolve(opts.spec)]
      : [join(root, 'openapi.json'), join(root, 'swagger.json')];
    const found = candidates.find(existsSync);
    if (!found) {
      console.error(`No OpenAPI JSON found. Tried: ${candidates.join(', ')}`);
      console.error('If your spec is YAML, convert first: `npx js-yaml openapi.yaml | node scripts/infer-kit-from-openapi.mjs --stdin`');
      process.exit(1);
    }
    raw = readFileSync(found, 'utf8');
    sourceLabel = found;
  }

  let spec;
  try { spec = JSON.parse(raw); }
  catch (e) { console.error(`Invalid JSON in ${sourceLabel}: ${e.message}`); process.exit(1); }

  const schemas = spec?.components?.schemas;
  if (!schemas || typeof schemas !== 'object') {
    console.error(`No components.schemas section found in ${sourceLabel}`);
    process.exit(1);
  }

  const locale = opts.locale || 'en';
  const kit = {
    $schema: 'https://visionary-claude.dev/schemas/visionary-kit.schema.json',
    schema_version: '1.0.0',
    locale,
    inferred_from: 'openapi',
    entities: {},
    component_constraints: {
      table: { p50_rows: 12, p95_rows: 47, max_rows: 500 },
      list: { empty_rate: 0.18, p95_rows: 30 },
    },
    required_states: ['loading', 'empty', 'error', 'populated'],
  };

  let matched = 0;
  for (const [name, schema] of Object.entries(schemas)) {
    if (opts.entityPattern && !opts.entityPattern.test(name)) continue;
    const entity = schemaToKitEntity({ name, schema, spec, locale });
    if (entity) {
      kit.entities[name] = entity;
      matched++;
    }
  }
  if (matched === 0) {
    console.error('No schemas matched.');
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
    console.log(`Inferred ${matched} schemas from ${sourceLabel} → ${target}`);
  } else {
    process.stdout.write(json);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  try { main(); }
  catch (e) { console.error('openapi inference failed:', e.message); process.exit(1); }
}

export { resolveRef, schemaToKitEntity, openapiTypeToKitType };
