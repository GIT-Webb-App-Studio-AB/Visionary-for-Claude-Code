#!/usr/bin/env node
// visionary-kit.mjs — Sprint 07 Task 21.1 (plus auto-infer dispatch).
//
// CLI entry for the /visionary-kit slash command. Owns init, preview,
// validate. The auto-infer subcommand dispatches to:
//   scripts/infer-kit-from-ts.mjs       (Task 21.2)
//   scripts/infer-kit-from-prisma.mjs   (Task 21.3)
//   scripts/infer-kit-from-openapi.mjs  (Task 21.4)
//
// The kit itself is a plain JSON file at project-root/visionary-kit.json.
// Schema lives at skills/visionary/schemas/visionary-kit.schema.json.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findProjectRoot } from '../hooks/scripts/lib/taste-io.mjs';

// ── Paths ────────────────────────────────────────────────────────────────────
const THIS_FILE = fileURLToPath(import.meta.url);
const PLUGIN_ROOT = resolve(dirname(THIS_FILE), '..');
const SCHEMA_PATH = join(PLUGIN_ROOT, 'skills', 'visionary', 'schemas', 'visionary-kit.schema.json');
const KIT_FILENAME = 'visionary-kit.json';

function kitPath(projectRoot) { return join(projectRoot, KIT_FILENAME); }

// ── Subcommands ──────────────────────────────────────────────────────────────

function subInit(args, projectRoot) {
  const force = args.includes('--force') || args.includes('-f');
  const locale = readFlagValue(args, '--locale') || 'en';
  const target = kitPath(projectRoot);
  if (existsSync(target) && !force) {
    console.error(`${KIT_FILENAME} already exists at ${target}.`);
    console.error('Re-run with --force to overwrite, or edit directly.');
    process.exit(1);
  }
  const template = kitTemplate(locale);
  writeFileSync(target, JSON.stringify(template, null, 2) + '\n', 'utf8');
  console.log(`Created ${target}`);
  console.log('Next: edit the samples + constraints, then `/visionary-kit validate`.');
}

function kitTemplate(locale) {
  const isSwedish = locale === 'sv';
  const sampleUser = isSwedish
    ? { id: 'u_1', name: 'Kirsti Hagberg', email: 'kirsti.hagberg@example.se', avatar_url: null }
    : { id: 'u_1', name: 'Sofia Martinez', email: 'sofia.martinez@example.com', avatar_url: null };
  return {
    $schema: 'https://visionary-claude.dev/schemas/visionary-kit.schema.json',
    schema_version: '1.0.0',
    locale,
    inferred_from: 'manual',
    entities: {
      User: {
        sample: [sampleUser],
        constraints: {
          name: {
            p50_length: 14,
            p95_length: 28,
            may_contain_diacritics: isSwedish,
            may_contain_apostrophe: true,
          },
          email: { format: 'email', p95_length: 48 },
          avatar_url: { nullable: true, null_rate: 0.22, format: 'url' },
        },
      },
    },
    component_constraints: {
      table: { p50_rows: 12, p95_rows: 47, max_rows: 500 },
      list: { empty_rate: 0.18, p95_rows: 30 },
    },
    required_states: ['loading', 'empty', 'error', 'populated'],
  };
}

function subPreview(_args, projectRoot) {
  const target = kitPath(projectRoot);
  if (!existsSync(target)) {
    console.error(`No ${KIT_FILENAME} at ${projectRoot}. Run \`/visionary-kit init\` first.`);
    process.exit(1);
  }
  const kit = JSON.parse(readFileSync(target, 'utf8'));
  const entities = Object.keys(kit.entities || {});
  console.log(`# Visionary kit — ${projectRoot}\n`);
  console.log(`Schema:    ${kit.schema_version || '(unset)'}`);
  console.log(`Locale:    ${kit.locale || '(unset)'}`);
  console.log(`Inferred:  ${kit.inferred_from || 'manual'}`);
  console.log(`Entities:  ${entities.length}`);
  console.log('');

  for (const name of entities) {
    const e = kit.entities[name];
    const fields = e.sample?.[0] ? Object.keys(e.sample[0]) : [];
    const constraints = Object.keys(e.constraints || {});
    console.log(`## ${name}`);
    console.log(`- sample rows: ${(e.sample || []).length}`);
    console.log(`- fields: ${fields.join(', ') || '(empty sample)'}`);
    console.log(`- constrained: ${constraints.join(', ') || '(none)'}`);
    if (e.relations) {
      const rels = Object.entries(e.relations).map(([f, r]) => `${f} → ${r.target} (${r.cardinality})`).join('; ');
      console.log(`- relations: ${rels}`);
    }
    console.log('');
  }

  const warnings = realismWarnings(kit);
  if (warnings.length) {
    console.log('## Realism warnings');
    for (const w of warnings) console.log(`- ⚠️  ${w}`);
  } else {
    console.log('## Realism check: clean');
  }
}

function subValidate(_args, projectRoot) {
  const target = kitPath(projectRoot);
  if (!existsSync(target)) {
    console.error(`No ${KIT_FILENAME} at ${projectRoot}. Run \`/visionary-kit init\` first.`);
    process.exit(1);
  }
  let kit;
  try {
    kit = JSON.parse(readFileSync(target, 'utf8'));
  } catch (e) {
    console.error(`Invalid JSON in ${KIT_FILENAME}: ${e.message}`);
    process.exit(1);
  }
  const schemaErrors = validateAgainstSchema(kit);
  if (schemaErrors.length) {
    console.error(`Schema validation failed for ${target}:`);
    for (const err of schemaErrors) console.error(`  - ${err}`);
    process.exit(1);
  }
  const warnings = realismWarnings(kit);
  console.log(`Schema OK. ${Object.keys(kit.entities || {}).length} entities.`);
  if (warnings.length) {
    console.log(`\nRealism warnings (${warnings.length}):`);
    for (const w of warnings) console.log(`  - ${w}`);
    process.exit(0); // non-zero only on schema failure
  } else {
    console.log('Realism check: clean.');
  }
}

function subAutoInfer(args, projectRoot) {
  const source = readFlagValue(args, '--source') || autodetectSource(projectRoot);
  if (!source) {
    console.error('Could not auto-detect a source. Pass --source ts | prisma | openapi.');
    process.exit(1);
  }

  const script = sourceToScript(source);
  if (!script) {
    console.error(`Unknown source: ${source}. Expected ts, prisma, or openapi.`);
    process.exit(1);
  }
  const scriptPath = join(PLUGIN_ROOT, 'scripts', script);
  if (!existsSync(scriptPath)) {
    console.error(`Inference script not found: ${scriptPath}`);
    console.error('Auto-inference scripts ship in Sprint 07 Tasks 21.2–21.4.');
    process.exit(1);
  }
  const forwardedArgs = args.filter((a, i, arr) => {
    if (a === '--source') return false;
    if (arr[i - 1] === '--source') return false;
    return true;
  });
  const res = spawnSync(process.execPath, [scriptPath, ...forwardedArgs], {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  process.exit(res.status || 0);
}

function sourceToScript(source) {
  const map = {
    ts: 'infer-kit-from-ts.mjs',
    typescript: 'infer-kit-from-ts.mjs',
    prisma: 'infer-kit-from-prisma.mjs',
    openapi: 'infer-kit-from-openapi.mjs',
    swagger: 'infer-kit-from-openapi.mjs',
  };
  return map[source.toLowerCase()] || null;
}

function autodetectSource(projectRoot) {
  if (existsSync(join(projectRoot, 'prisma', 'schema.prisma'))) return 'prisma';
  if (existsSync(join(projectRoot, 'openapi.yaml'))) return 'openapi';
  if (existsSync(join(projectRoot, 'openapi.json'))) return 'openapi';
  if (existsSync(join(projectRoot, 'swagger.json'))) return 'openapi';
  if (existsSync(join(projectRoot, 'tsconfig.json'))) return 'ts';
  return null;
}

// ── Realism heuristic ────────────────────────────────────────────────────────
// Hard-coded placeholders are the #1 anti-pattern kits are supposed to
// prevent. We flag the obvious ones so /preview and /validate both surface
// them before the kit reaches a generator.

const PLACEHOLDER_NAMES = [
  'jane doe', 'john doe', 'john smith', 'jane smith',
  'acme corp', 'acme inc', 'acme llc', 'acme co',
  'lorem ipsum',
];
const PLACEHOLDER_EMAIL_HOSTS = ['example.com', 'example.org', 'test.com', 'acme.com'];

function realismWarnings(kit) {
  const w = [];
  for (const [name, entity] of Object.entries(kit.entities || {})) {
    for (const row of entity.sample || []) {
      for (const [field, value] of Object.entries(row)) {
        if (typeof value !== 'string') continue;
        const low = value.toLowerCase();
        if (PLACEHOLDER_NAMES.includes(low)) {
          w.push(`${name}.${field} = "${value}" (placeholder name)`);
        }
        if (field.toLowerCase().includes('email')) {
          const host = low.split('@')[1];
          if (host && PLACEHOLDER_EMAIL_HOSTS.includes(host)) {
            w.push(`${name}.${field} = "${value}" (placeholder email domain — use your own so truncation logic gets realistic input)`);
          }
        }
      }
    }
    for (const [field, c] of Object.entries(entity.constraints || {})) {
      if (typeof c.p95_length === 'number' && c.p95_length <= 10) {
        w.push(`${name}.${field} has p95_length=${c.p95_length} — very short, confirm this is realistic.`);
      }
      if (Array.isArray(c.enum) && c.enum.length === 1) {
        w.push(`${name}.${field} has a single-value enum — consider removing or adding members.`);
      }
    }
  }
  if (!kit.required_states || kit.required_states.length === 0) {
    w.push('required_states is empty — content-resilience scorer has nothing to check.');
  }
  return w;
}

// ── Lightweight schema validator ─────────────────────────────────────────────
// We avoid pulling in a full JSON-Schema library for a plugin that ships with
// no package.json. This runs the structural checks the `.schema.json` file
// expresses; unknown keys trigger a warning rather than a failure to stay
// forward-compat with minor schema bumps.

function validateAgainstSchema(kit) {
  const errors = [];
  if (!kit || typeof kit !== 'object') { errors.push('Root is not an object'); return errors; }
  if (kit.schema_version !== undefined && !/^\d+\.\d+\.\d+$/.test(String(kit.schema_version))) {
    errors.push(`schema_version must be semver, got "${kit.schema_version}"`);
  }
  if (kit.locale !== undefined && !/^[a-z]{2,3}(-[A-Z]{2})?$/.test(String(kit.locale))) {
    errors.push(`locale must be BCP-47, got "${kit.locale}"`);
  }
  if (!kit.entities || typeof kit.entities !== 'object' || Array.isArray(kit.entities)) {
    errors.push('entities must be an object with at least one member');
    return errors;
  }
  if (Object.keys(kit.entities).length === 0) errors.push('entities must have at least 1 member');

  for (const [name, e] of Object.entries(kit.entities)) {
    if (!e || typeof e !== 'object') { errors.push(`entities.${name} must be an object`); continue; }
    if (!Array.isArray(e.sample) || e.sample.length === 0) {
      errors.push(`entities.${name}.sample must be a non-empty array`);
    } else if (e.sample.length > 20) {
      errors.push(`entities.${name}.sample has ${e.sample.length} items — max 20 (the critique scorer only uses the first few).`);
    }
    if (e.constraints && typeof e.constraints !== 'object') {
      errors.push(`entities.${name}.constraints must be an object`);
    }
    if (e.relations) {
      for (const [f, r] of Object.entries(e.relations)) {
        if (!r?.target || !['one', 'many', 'zero-or-one'].includes(r?.cardinality)) {
          errors.push(`entities.${name}.relations.${f} must have target + cardinality(one|many|zero-or-one)`);
        }
      }
    }
  }

  if (kit.required_states) {
    const valid = new Set(['loading', 'empty', 'error', 'populated', 'partial']);
    for (const s of kit.required_states) if (!valid.has(s)) errors.push(`required_states includes invalid value: ${s}`);
  }

  return errors;
}

// ── Small CLI helpers ────────────────────────────────────────────────────────
function readFlagValue(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

function printHelpAndExit(code) {
  console.log(`
/visionary-kit — content kit management

Subcommands:
  init [--force] [--locale sv]    Create visionary-kit.json template
  preview                         Show current kit + realism check
  validate                        Schema + realism validation
  auto-infer [--source ts|prisma|openapi] [--write] [--force]
                                  Run the auto-inference pipeline
`.trim());
  process.exit(code);
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);
  const sub = argv[0];
  const rest = argv.slice(1);
  const projectRoot = findProjectRoot(process.cwd());

  switch (sub) {
    case 'init': return subInit(rest, projectRoot);
    case 'preview': case 'show': return subPreview(rest, projectRoot);
    case 'validate': case 'check': return subValidate(rest, projectRoot);
    case 'auto-infer': case 'infer': return subAutoInfer(rest, projectRoot);
    case '--help': case '-h': case undefined: return printHelpAndExit(0);
    default:
      console.error(`Unknown subcommand: ${sub}`);
      printHelpAndExit(1);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  try { main(); }
  catch (e) { console.error('kit command failed:', e.message); process.exit(1); }
}

export {
  kitTemplate, realismWarnings, validateAgainstSchema, SCHEMA_PATH,
};
