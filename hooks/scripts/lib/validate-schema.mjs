// Minimal JSON Schema validator — Draft 2020-12 subset sufficient for the
// Sprint 02 schemas (object / array / string / number|integer / enum with
// the common constraints). Intentionally dep-free: the repo has no
// package.json and adding Ajv would mean shipping ~1 MB of vendor code.
//
// Supported keywords:
//   Types      — type: "object"|"array"|"string"|"number"|"integer"|"boolean"
//   Object     — required, properties, additionalProperties
//   Array      — items, minItems, maxItems
//   String     — minLength, maxLength, pattern
//   Number     — minimum, maximum, exclusiveMinimum, exclusiveMaximum
//   Generic    — enum, $ref (intra-schema pointers starting with #/)
//
// Intentionally NOT supported (out of scope for this sprint's schemas):
//   allOf / oneOf / anyOf, format, dependencies, patternProperties, const.
//
// Result shape:
//   { ok: true }
//   { ok: false, errors: [{ path: "/scores/hierarchy", message: "..." }, ...] }

import { readFileSync } from 'node:fs';

export function validate(instance, schema, options = {}) {
  const errors = [];
  const rootSchema = schema;
  walk(instance, schema, '', errors, rootSchema);
  return errors.length === 0
    ? { ok: true, errors: [] }
    : { ok: false, errors };
}

export function validateFromFile(instance, schemaPath, options = {}) {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  return validate(instance, schema, options);
}

// ── Core walker ─────────────────────────────────────────────────────────────
function walk(value, schema, path, errors, rootSchema) {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, rootSchema);
    if (!resolved) {
      errors.push({ path, message: `unresolvable $ref: ${schema.$ref}` });
      return;
    }
    walk(value, resolved, path, errors, rootSchema);
    return;
  }

  // enum applies before type narrowing — an enum of mixed-type literals would
  // accept values whose JS type does not match any "type" keyword.
  if (Array.isArray(schema.enum)) {
    const matched = schema.enum.some((allowed) => deepEqual(allowed, value));
    if (!matched) {
      errors.push({
        path,
        message: `value is not in enum [${schema.enum.map((v) => JSON.stringify(v)).join(', ')}]`,
      });
      return;
    }
  }

  if (schema.type) {
    if (!typeMatches(value, schema.type)) {
      errors.push({
        path,
        message: `expected ${schema.type}, got ${jsTypeOf(value)}`,
      });
      return;
    }
  }

  const jsType = jsTypeOf(value);
  if (jsType === 'object') validateObject(value, schema, path, errors, rootSchema);
  if (jsType === 'array')  validateArray(value, schema, path, errors, rootSchema);
  if (jsType === 'string') validateString(value, schema, path, errors);
  if (jsType === 'number') validateNumber(value, schema, path, errors);
}

function validateObject(value, schema, path, errors, rootSchema) {
  if (Array.isArray(schema.required)) {
    for (const key of schema.required) {
      if (!(key in value)) {
        errors.push({ path: `${path}/${key}`, message: 'required property missing' });
      }
    }
  }
  const props = schema.properties || {};
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}/${key}`;
    if (props[key]) {
      walk(child, props[key], childPath, errors, rootSchema);
    } else if (schema.additionalProperties === false) {
      errors.push({ path: childPath, message: 'additional property not permitted' });
    } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      walk(child, schema.additionalProperties, childPath, errors, rootSchema);
    }
    // else: additionalProperties === true or undefined → skip validation
  }
}

function validateArray(value, schema, path, errors, rootSchema) {
  if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
    errors.push({ path, message: `array has ${value.length} items, minimum is ${schema.minItems}` });
  }
  if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
    errors.push({ path, message: `array has ${value.length} items, maximum is ${schema.maxItems}` });
  }
  if (schema.items && typeof schema.items === 'object') {
    value.forEach((item, i) => walk(item, schema.items, `${path}/${i}`, errors, rootSchema));
  }
}

function validateString(value, schema, path, errors) {
  if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
    errors.push({ path, message: `string length ${value.length} below minimum ${schema.minLength}` });
  }
  if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
    errors.push({ path, message: `string length ${value.length} above maximum ${schema.maxLength}` });
  }
  if (typeof schema.pattern === 'string') {
    // Regex is compiled per-validation; validator is called on modest JSON, not a hot path.
    let re;
    try { re = new RegExp(schema.pattern); }
    catch { errors.push({ path, message: `invalid pattern in schema: ${schema.pattern}` }); return; }
    if (!re.test(value)) {
      errors.push({ path, message: `string does not match pattern ${schema.pattern}` });
    }
  }
}

function validateNumber(value, schema, path, errors) {
  if (typeof schema.minimum === 'number' && value < schema.minimum) {
    errors.push({ path, message: `${value} below minimum ${schema.minimum}` });
  }
  if (typeof schema.maximum === 'number' && value > schema.maximum) {
    errors.push({ path, message: `${value} above maximum ${schema.maximum}` });
  }
  if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum) {
    errors.push({ path, message: `${value} not strictly above ${schema.exclusiveMinimum}` });
  }
  if (typeof schema.exclusiveMaximum === 'number' && value >= schema.exclusiveMaximum) {
    errors.push({ path, message: `${value} not strictly below ${schema.exclusiveMaximum}` });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function typeMatches(value, expected) {
  const actual = jsTypeOf(value);
  if (expected === 'integer') return actual === 'number' && Number.isInteger(value);
  if (Array.isArray(expected)) return expected.some((t) => typeMatches(value, t));
  return actual === expected;
}

function jsTypeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => deepEqual(x, b[i]));
  }
  if (typeof a === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

function resolveRef(ref, rootSchema) {
  if (!ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let node = rootSchema;
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) node = node[p];
    else return null;
  }
  return node;
}
