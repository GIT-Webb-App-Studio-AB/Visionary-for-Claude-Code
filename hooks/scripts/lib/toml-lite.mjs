// toml-lite.mjs — Minimal TOML 1.0 serializer + parser for `.taste` files.
//
// Scope: what the `.taste` spec (docs/taste-dotfile-spec.md) actually uses.
// Explicitly NOT supported:
//   - arrays of tables ([[foo]])
//   - dotted keys (foo.bar = "baz")
//   - datetime literals (we write ISO strings as plain strings)
//   - literal strings ('...' or '''...''') — only basic + multi-line basic
//   - nested tables beyond one level (section.subsection not implemented)
//
// The exporter and importer both round-trip data through this module. If the
// spec gains a new shape, extend here first, then bump the file-level
// schema_version.
//
// Zero dependencies. Pure functions. No I/O.

// ── Tokenizer / scanner primitives ──────────────────────────────────────────
// Parse is line-oriented with a small sub-scanner for values (inline tables
// and arrays may span lines).

const WS = /^[ \t]*/;

function stripLineComment(line) {
  // A `#` outside strings ends the line. We scan char-by-char because naive
  // split('#') would break on strings containing `#`.
  let inBasic = false;    // inside "…"
  let inMulti = false;    // inside """…"""
  let inLiteral = false;  // defensive — we reject single-quote strings upstream
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const next3 = line.slice(i, i + 3);
    if (!inBasic && !inLiteral && next3 === '"""') {
      inMulti = !inMulti;
      i += 2;
      continue;
    }
    if (!inMulti && !inLiteral && c === '"' && line[i - 1] !== '\\') {
      inBasic = !inBasic;
      continue;
    }
    if (!inBasic && !inMulti && !inLiteral && c === '#') {
      return line.slice(0, i);
    }
  }
  return line;
}

// ── Value parsing ───────────────────────────────────────────────────────────

function parseValue(raw, ctx) {
  const s = raw.trim();
  if (s === '') throw errAt(ctx, 'Empty value');

  // Multi-line basic string (could be multi-line but parse caller collapses)
  if (s.startsWith('"""')) {
    if (!s.endsWith('"""') || s.length < 6) {
      throw errAt(ctx, 'Unterminated multi-line basic string');
    }
    let body = s.slice(3, -3);
    // Trim leading newline per TOML spec.
    if (body.startsWith('\r\n')) body = body.slice(2);
    else if (body.startsWith('\n')) body = body.slice(1);
    return unescapeBasic(body);
  }
  // Basic string
  if (s.startsWith('"')) {
    if (!s.endsWith('"')) throw errAt(ctx, 'Unterminated basic string');
    return unescapeBasic(s.slice(1, -1));
  }
  // Boolean
  if (s === 'true') return true;
  if (s === 'false') return false;
  // Array
  if (s.startsWith('[')) {
    if (!s.endsWith(']')) throw errAt(ctx, 'Unterminated array');
    return parseArray(s.slice(1, -1), ctx);
  }
  // Inline table
  if (s.startsWith('{')) {
    if (!s.endsWith('}')) throw errAt(ctx, 'Unterminated inline table');
    return parseInlineTable(s.slice(1, -1), ctx);
  }
  // Numeric
  if (/^-?\d/.test(s)) {
    if (/^-?\d+$/.test(s)) return parseInt(s, 10);
    if (/^-?\d+\.\d+(e[-+]?\d+)?$/i.test(s) || /^-?\d+(e[-+]?\d+)$/i.test(s)) return Number(s);
  }
  throw errAt(ctx, `Unrecognized value: ${s.slice(0, 60)}`);
}

function unescapeBasic(s) {
  // TOML basic-string escapes: \" \\ \n \r \t \b \f \uXXXX \UXXXXXXXX
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== '\\') { out += c; continue; }
    const n = s[i + 1];
    switch (n) {
      case '"': out += '"'; i++; break;
      case '\\': out += '\\'; i++; break;
      case 'n': out += '\n'; i++; break;
      case 'r': out += '\r'; i++; break;
      case 't': out += '\t'; i++; break;
      case 'b': out += '\b'; i++; break;
      case 'f': out += '\f'; i++; break;
      case 'u': {
        const hex = s.slice(i + 2, i + 6);
        out += String.fromCharCode(parseInt(hex, 16));
        i += 5;
        break;
      }
      case 'U': {
        const hex = s.slice(i + 2, i + 10);
        out += String.fromCodePoint(parseInt(hex, 16));
        i += 9;
        break;
      }
      default:
        // Unknown escape — keep literal (forgiving parse).
        out += c;
    }
  }
  return out;
}

function parseArray(body, ctx) {
  // body is the inside of [...] without outer brackets.
  if (!body.trim()) return [];
  const items = splitTopLevel(body, ',', ctx).map((it) => it.trim()).filter((it) => it.length);
  return items.map((it) => parseValue(it, ctx));
}

function parseInlineTable(body, ctx) {
  if (!body.trim()) return {};
  const pairs = splitTopLevel(body, ',', ctx);
  const out = {};
  for (const p of pairs) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    const eq = findTopLevelChar(trimmed, '=');
    if (eq < 0) throw errAt(ctx, `Inline table pair missing '=': ${trimmed.slice(0, 40)}`);
    const key = trimmed.slice(0, eq).trim().replace(/^"|"$/g, '');
    const value = trimmed.slice(eq + 1).trim();
    out[key] = parseValue(value, ctx);
  }
  return out;
}

// Split `body` on `sep` but only at top nesting level (not inside strings,
// arrays, or inline tables). Needed because `a = "x,y"` must not split.
function splitTopLevel(body, sep, ctx) {
  const out = [];
  let depth = 0;   // counts [...] and {...}
  let inBasic = false;
  let inMulti = false;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    const next3 = body.slice(i, i + 3);
    if (!inBasic && next3 === '"""') {
      inMulti = !inMulti;
      i += 2;
      continue;
    }
    if (!inMulti && c === '"' && body[i - 1] !== '\\') { inBasic = !inBasic; continue; }
    if (inBasic || inMulti) continue;
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    else if (c === sep && depth === 0) {
      out.push(body.slice(start, i));
      start = i + 1;
    }
  }
  if (start <= body.length) out.push(body.slice(start));
  return out;
}

function findTopLevelChar(s, ch) {
  let inBasic = false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' && s[i - 1] !== '\\') { inBasic = !inBasic; continue; }
    if (inBasic) continue;
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    else if (c === ch && depth === 0) return i;
  }
  return -1;
}

function errAt(ctx, msg) {
  const line = ctx?.line ?? '?';
  return new Error(`TOML parse (line ${line}): ${msg}`);
}

// ── Multi-line collector ────────────────────────────────────────────────────
// Scans input and collapses logical lines: a value that opens `[` or `{` or
// `"""` continues across physical lines until the matching close.
function collectLogicalLines(src) {
  const rawLines = src.split(/\r?\n/);
  const out = []; // { line: number, text: string }
  let i = 0;
  while (i < rawLines.length) {
    let text = rawLines[i];
    const startLine = i + 1;

    const equalsIdx = findTopLevelChar(text, '=');
    const needsContinuation = () => {
      const depth = bracketDepth(text);
      const unterminatedMulti = countOccurrences(text, '"""') % 2 === 1;
      const unterminatedBasic = unterminatedBasicString(text);
      return depth > 0 || unterminatedMulti || unterminatedBasic;
    };

    if (equalsIdx >= 0 && needsContinuation()) {
      while (++i < rawLines.length) {
        text += '\n' + rawLines[i];
        if (!needsContinuation()) break;
      }
    }
    out.push({ line: startLine, text });
    i++;
  }
  return out;
}

function bracketDepth(s) {
  let depth = 0;
  let inBasic = false;
  let inMulti = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next3 = s.slice(i, i + 3);
    if (!inBasic && next3 === '"""') { inMulti = !inMulti; i += 2; continue; }
    if (!inMulti && c === '"' && s[i - 1] !== '\\') { inBasic = !inBasic; continue; }
    if (inBasic || inMulti) continue;
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
  }
  return depth;
}

function unterminatedBasicString(s) {
  let inBasic = false;
  let inMulti = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next3 = s.slice(i, i + 3);
    if (!inBasic && next3 === '"""') { inMulti = !inMulti; i += 2; continue; }
    if (!inMulti && c === '"' && s[i - 1] !== '\\') { inBasic = !inBasic; continue; }
  }
  return inBasic; // multi-line basic handled separately
}

function countOccurrences(s, needle) {
  let n = 0; let i = 0;
  while ((i = s.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  return n;
}

// ── Public: parse ───────────────────────────────────────────────────────────
export function parse(src) {
  if (typeof src !== 'string') throw new Error('TOML parse: input must be a string');
  const root = {};
  let current = root;
  let currentSection = '';

  const logical = collectLogicalLines(src);
  for (const { line, text } of logical) {
    const clean = stripLineComment(text).trim();
    if (!clean) continue;

    // Section header: [foo] or [foo.bar]
    if (clean.startsWith('[') && clean.endsWith(']') && !clean.startsWith('[[')) {
      const name = clean.slice(1, -1).trim();
      if (!name) throw errAt({ line }, 'Empty section header');
      // We do not support dotted-section paths in v1 (not used by .taste).
      if (name.includes('.')) {
        throw errAt({ line }, `Dotted section headers not supported: [${name}]`);
      }
      if (Object.prototype.hasOwnProperty.call(root, name) && typeof root[name] === 'object' && !Array.isArray(root[name])) {
        // Re-entering same section is allowed (merge).
        current = root[name];
      } else {
        root[name] = {};
        current = root[name];
      }
      currentSection = name;
      continue;
    }

    const eq = findTopLevelChar(clean, '=');
    if (eq < 0) throw errAt({ line }, `Line is neither section nor key=value: ${clean.slice(0, 60)}`);
    const rawKey = clean.slice(0, eq).trim();
    const key = rawKey.replace(/^"|"$/g, '');
    if (!key) throw errAt({ line }, 'Empty key');
    const value = clean.slice(eq + 1).trim();
    current[key] = parseValue(value, { line });
  }
  return root;
}

// ── Public: stringify ───────────────────────────────────────────────────────
// Emits the canonical `.taste` layout: file-level scalar keys first, then one
// [section] per top-level object. Options let the caller inject comments and
// fix section order.
export function stringify(obj, opts = {}) {
  const sectionOrder = opts.sectionOrder || [];
  const headerComment = opts.headerComment || null;
  const sectionComments = opts.sectionComments || {};

  const out = [];
  if (headerComment) {
    for (const line of headerComment.split('\n')) out.push('# ' + line);
    out.push('');
  }

  // File-level keys (non-object values). Preserve definition order.
  const topKeys = Object.keys(obj).filter((k) => !isPlainObject(obj[k]));
  const sectionKeys = Object.keys(obj).filter((k) => isPlainObject(obj[k]));

  for (const k of topKeys) {
    out.push(`${emitKey(k)} = ${emitValue(obj[k], 0)}`);
  }
  if (topKeys.length) out.push('');

  // Sections in the requested order, then any remaining in definition order.
  const ordered = [];
  for (const k of sectionOrder) if (sectionKeys.includes(k)) ordered.push(k);
  for (const k of sectionKeys) if (!ordered.includes(k)) ordered.push(k);

  for (const section of ordered) {
    const comment = sectionComments[section];
    if (comment) {
      for (const line of comment.split('\n')) out.push('# ' + line);
    }
    out.push(`[${section}]`);
    for (const [k, v] of Object.entries(obj[section])) {
      if (Array.isArray(v) && v.length > 0 && v.every(isPlainObject)) {
        // Array of inline tables — emit multi-line for readability.
        out.push(`${emitKey(k)} = [`);
        for (let i = 0; i < v.length; i++) {
          const comma = i === v.length - 1 ? '' : ',';
          out.push(`  ${emitInlineTable(v[i])}${comma}`);
        }
        out.push(']');
      } else if (typeof v === 'string' && v.includes('\n')) {
        // Multi-line string. TOML trims the initial newline after """; we
        // mirror that on output by rendering:
        //   key = """
        //   <body>
        //   """
        // To keep round-trips exact we strip at most one trailing \n from
        // the body — the one we add back as the line break before `"""`.
        out.push(`${emitKey(k)} = """`);
        const body = v.endsWith('\n') ? v.slice(0, -1) : v;
        out.push(body);
        out.push('"""');
      } else {
        out.push(`${emitKey(k)} = ${emitValue(v, 0)}`);
      }
    }
    out.push('');
  }

  return out.join('\n').replace(/\n+$/, '\n');
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function emitKey(k) {
  // Bare-key allowed: A-Za-z0-9_-
  if (/^[A-Za-z0-9_-]+$/.test(k)) return k;
  return `"${escapeBasic(k)}"`;
}

function emitValue(v, depth) {
  if (v === null || v === undefined) throw new Error('TOML stringify: null/undefined not allowed');
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error('TOML stringify: non-finite number');
    return String(v);
  }
  if (typeof v === 'string') return `"${escapeBasic(v)}"`;
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    const items = v.map((it) => emitValue(it, depth + 1));
    // If any item is a string that's long, or there are more than 4 items,
    // wrap multi-line for readability.
    const totalLen = items.reduce((n, s) => n + s.length, 0);
    if (totalLen > 60 || items.length > 4) {
      const indent = '  '.repeat(depth + 1);
      const closeIndent = '  '.repeat(depth);
      return `[\n${items.map((it) => indent + it).join(',\n')},\n${closeIndent}]`;
    }
    return `[${items.join(', ')}]`;
  }
  if (isPlainObject(v)) return emitInlineTable(v);
  throw new Error(`TOML stringify: unsupported value type: ${typeof v}`);
}

function emitInlineTable(obj) {
  const entries = Object.entries(obj).map(([k, val]) => `${emitKey(k)} = ${emitValue(val, 0)}`);
  return `{ ${entries.join(', ')} }`;
}

function escapeBasic(s) {
  // TOML basic strings escape backslash and double-quote; control chars use
  // \n \r \t etc. We keep \n as a literal newline in multi-line strings —
  // this function is only used for single-line basic strings.
  let out = '';
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (ch === '\\') out += '\\\\';
    else if (ch === '"') out += '\\"';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else if (ch === '\b') out += '\\b';
    else if (ch === '\f') out += '\\f';
    else if (code < 0x20) out += `\\u${code.toString(16).padStart(4, '0')}`;
    else out += ch;
  }
  return out;
}
