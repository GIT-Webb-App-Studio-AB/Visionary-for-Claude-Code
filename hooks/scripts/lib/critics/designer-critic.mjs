// Designer critic — Sprint 15 + Sprint 20 cinematic-pack support.
//
// Loads a designer pack from designers/<id>.json (Sprint 15) or
// designers/<id>.md with YAML frontmatter (Sprint 20 cinematic packs),
// validates the critic_persona block, and produces a per-dim scoring
// contribution based on the pack's priorities + a heuristic
// interpretation of the component source. The actual LLM-driven
// critique is invoked by the host (capture-and-critique) via the
// agents/designer-critic.md agent when an MLLM pass is desired; this
// module produces a deterministic baseline that the LLM round can
// override.
//
// Sprint-20 cinematic packs author scoring_priorities against an
// 11-dim cinematic vocabulary (motion_coherence, emotional_resonance,
// color_harmony, density, whitespace, structural_integrity, brand_fit)
// that does not match the runtime-canonical 10-dim list in
// critique-output.schema.json. DIM_TRANSLATIONS below is the Resolution
// (c) translation table from designers/_director-schema.md — additive,
// non-breaking. Cinematic-dim names are translated to the closest
// runtime-canonical dim before the KNOWN_DIMS gate.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
// __filename: <repo>/hooks/scripts/lib/critics/designer-critic.mjs
// Walk up 5 levels to reach the repo root.
const REPO_ROOT = dirname(dirname(dirname(dirname(dirname(__filename)))));
const DESIGNERS_DIR = join(REPO_ROOT, 'designers');

const KNOWN_DIMS = [
  'hierarchy', 'layout', 'typography', 'contrast', 'distinctiveness',
  'brief_conformance', 'accessibility', 'motion_readiness', 'craft_measurable',
  'content_resilience', 'visual_style_match',
];

// Sprint 20 cinematic-dim → runtime-canonical dim (per critique-output.schema.json).
// Identity entries make `translateDim` safe to call on already-canonical names.
const DIM_TRANSLATIONS = {
  // Sprint 20 cinematic dims → runtime dims
  motion_coherence:     'motion_readiness',
  emotional_resonance:  'distinctiveness',  // best-fit: emotional register → distinctiveness
  color_harmony:        'contrast',
  density:              'layout',
  whitespace:           'layout',
  structural_integrity: 'hierarchy',
  brand_fit:            'brief_conformance',
  // Identity mappings (already runtime-canonical)
  hierarchy:            'hierarchy',
  typography:           'typography',
  accessibility:        'accessibility',
  distinctiveness:      'distinctiveness',
  // Sprint 15 print-pack dims that already match the runtime list
  contrast:             'contrast',
  layout:               'layout',
  motion_readiness:     'motion_readiness',
  brief_conformance:    'brief_conformance',
  craft_measurable:     'craft_measurable',
  content_resilience:   'content_resilience',
  visual_style_match:   'visual_style_match',
};

export function translateDim(dimName) {
  if (!dimName) return dimName;
  return DIM_TRANSLATIONS[dimName] || dimName;
}

// ---------------------------------------------------------------------------
// Minimal YAML frontmatter parser (Sprint 20).
//
// Supports exactly the subset that appears in Sprint 15 + Sprint 20 designer
// packs — no anchors, aliases, tags, multi-document streams or flow blocks
// beyond inline-flow objects. Adding js-yaml as a dep would be overkill for
// this scope, so we hand-roll. Patterns supported:
//
//   key: scalar                       (string / number / bool / "quoted")
//   key:                              (block-folded scalar)
//     >  multi-line text indented one level
//   key:                              (list of strings)
//     - "item1"
//     - item2
//   key:                              (list of inline-flow mappings)
//     - { sub: val, sub2: "val2" }
//   key:                              (nested mapping, one level deep)
//     subkey: value
//     subkey2:
//       - listitem
//
// Frontmatter delimiter: leading `---` line, terminating `---` line.
// ---------------------------------------------------------------------------

export function parseYamlFrontmatter(text) {
  if (typeof text !== 'string') return null;
  // Frontmatter must start with --- on its own line.
  const lines = text.split(/\r?\n/);
  if (lines[0].trim() !== '---') return null;

  // Find closing ---.
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end < 0) return null;

  const body = lines.slice(1, end);
  return parseBlock(body, 0);
}

function parseScalar(raw) {
  const s = raw.trim();
  if (s === '') return '';
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  // Quoted strings.
  if ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  // Number?
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

// Parse a flow-style inline mapping like `{ dim: motion_coherence, weight: 1.6, direction: "x, y" }`.
function parseFlowMapping(raw) {
  const inner = raw.trim().slice(1, -1); // strip braces
  const result = {};
  // Split on commas not inside quoted strings.
  const parts = [];
  let buf = '';
  let inQuote = null;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (inQuote) {
      buf += c;
      if (c === inQuote) inQuote = null;
    } else if (c === '"' || c === "'") {
      buf += c;
      inQuote = c;
    } else if (c === ',') {
      parts.push(buf);
      buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim() !== '') parts.push(buf);
  for (const part of parts) {
    const colonIdx = indexOfUnquoted(part, ':');
    if (colonIdx < 0) continue;
    const key = part.slice(0, colonIdx).trim();
    const value = part.slice(colonIdx + 1);
    result[key] = parseScalar(value);
  }
  return result;
}

function indexOfUnquoted(str, ch) {
  let inQuote = null;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inQuote) {
      if (c === inQuote) inQuote = null;
    } else if (c === '"' || c === "'") {
      inQuote = c;
    } else if (c === ch) {
      return i;
    }
  }
  return -1;
}

function leadingSpaces(line) {
  let n = 0;
  while (n < line.length && line[n] === ' ') n++;
  return n;
}

// Parse a block of YAML lines belonging to the same indentation context.
// `lines` is an array; `baseIndent` is the indent column expected for top-level keys here.
// Returns either a mapping object, a list, or a string (folded scalar).
function parseBlock(lines, baseIndent) {
  // Strip blank lines and detect content shape.
  const filtered = lines.filter(l => l.trim() !== '' && !l.trim().startsWith('#'));
  if (filtered.length === 0) return {};

  // List? (first non-blank line at baseIndent starts with `- `)
  const first = filtered[0];
  const firstIndent = leadingSpaces(first);
  if (firstIndent === baseIndent && first.trim().startsWith('- ')) {
    return parseListBlock(lines, baseIndent);
  }

  // Mapping.
  return parseMappingBlock(lines, baseIndent);
}

function parseMappingBlock(lines, baseIndent) {
  const result = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) { i++; continue; }
    const indent = leadingSpaces(line);
    if (indent < baseIndent) break;
    if (indent > baseIndent) { i++; continue; } // shouldn't happen at top of mapping

    const colonIdx = indexOfUnquoted(line, ':');
    if (colonIdx < 0) { i++; continue; }
    const key = line.slice(indent, colonIdx).trim();
    let rest = line.slice(colonIdx + 1);
    // Strip inline comment from rest (only if not inside quotes).
    const hashIdx = indexOfUnquoted(rest, '#');
    if (hashIdx >= 0) rest = rest.slice(0, hashIdx);
    const restTrim = rest.trim();

    if (restTrim === '' || restTrim === '|' || restTrim === '>') {
      // Block scalar or nested block — gather child lines (indent > baseIndent).
      const child = [];
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j];
        if (l.trim() === '') { child.push(l); j++; continue; }
        if (leadingSpaces(l) <= baseIndent) break;
        child.push(l);
        j++;
      }
      if (restTrim === '>' || restTrim === '|') {
        // Folded/literal scalar — join trimmed lines with single space (folded) or newline (literal).
        const joiner = restTrim === '>' ? ' ' : '\n';
        result[key] = child
          .filter(l => l.trim() !== '')
          .map(l => l.trim())
          .join(joiner);
      } else if (child.length > 0) {
        // Detect child indent.
        const childIndent = (() => {
          for (const l of child) {
            if (l.trim() !== '') return leadingSpaces(l);
          }
          return baseIndent + 2;
        })();
        result[key] = parseBlock(child, childIndent);
      } else {
        result[key] = null;
      }
      i = j;
    } else if (restTrim.startsWith('{') && restTrim.endsWith('}')) {
      result[key] = parseFlowMapping(restTrim);
      i++;
    } else if (restTrim.startsWith('[') && restTrim.endsWith(']')) {
      // Inline-flow list, rare in our packs — treat as list of scalars.
      const inner = restTrim.slice(1, -1);
      result[key] = inner.split(',').map(s => parseScalar(s));
      i++;
    } else {
      result[key] = parseScalar(restTrim);
      i++;
    }
  }
  return result;
}

function parseListBlock(lines, baseIndent) {
  const result = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) { i++; continue; }
    const indent = leadingSpaces(line);
    if (indent < baseIndent) break;
    if (indent > baseIndent) { i++; continue; }
    const trimmed = line.trim();
    if (!trimmed.startsWith('- ') && trimmed !== '-') { break; }

    // `- ` prefix; what follows is either a scalar, a flow mapping, or a child mapping.
    let after = trimmed === '-' ? '' : trimmed.slice(2);
    // Strip inline comment.
    const hashIdx = indexOfUnquoted(after, '#');
    if (hashIdx >= 0) after = after.slice(0, hashIdx).trim();

    if (after.startsWith('{') && after.endsWith('}')) {
      result.push(parseFlowMapping(after));
      i++;
    } else if (after === '') {
      // Multi-line mapping item: gather indented children.
      const child = [];
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j];
        if (l.trim() === '') { child.push(l); j++; continue; }
        if (leadingSpaces(l) <= baseIndent) break;
        child.push(l);
        j++;
      }
      const childIndent = (() => {
        for (const l of child) {
          if (l.trim() !== '') return leadingSpaces(l);
        }
        return baseIndent + 2;
      })();
      result.push(child.length > 0 ? parseBlock(child, childIndent) : null);
      i = j;
    } else if (indexOfUnquoted(after, ':') >= 0 && !looksLikeScalarWithColon(after)) {
      // Mapping item starting on the same line as `- `: e.g. `- key: value`
      // Collect this line's k/v plus any continuation lines indented further.
      const itemLines = [' '.repeat(baseIndent + 2) + after];
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j];
        if (l.trim() === '') { itemLines.push(l); j++; continue; }
        if (leadingSpaces(l) <= baseIndent) break;
        itemLines.push(l);
        j++;
      }
      result.push(parseMappingBlock(itemLines, baseIndent + 2));
      i = j;
    } else {
      result.push(parseScalar(after));
      i++;
    }
  }
  return result;
}

// Heuristic: a string like `"foo: bar (year)"` should be treated as a scalar even though
// it contains an unquoted colon — but quoted strings handle this already. This guard
// catches the rare edge where a plain scalar happens to contain a colon (e.g. URL).
// Returns true when the string is wrapped in quotes (already handled as scalar above).
function looksLikeScalarWithColon(s) {
  const t = s.trim();
  return (t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"));
}

export async function loadDesignerPack(designerId) {
  if (!designerId) return null;

  // Sprint 15: <id>.json — preferred when present.
  const jsonPath = join(DESIGNERS_DIR, `${designerId}.json`);
  if (existsSync(jsonPath)) {
    try {
      const raw = await readFile(jsonPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // Sprint 20: <id>.md with YAML frontmatter.
  const mdPath = join(DESIGNERS_DIR, `${designerId}.md`);
  if (existsSync(mdPath)) {
    try {
      const raw = await readFile(mdPath, 'utf8');
      const parsed = parseYamlFrontmatter(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  return null;
}

export function hasCriticPersona(pack) {
  return !!(pack && pack.critic_persona && Array.isArray(pack.critic_persona.scoring_priorities));
}

function scoreFromPriority(priority, sourceContext = {}) {
  // Heuristic: a "strict hierarchy" prefers components with clear focal points
  // and clear secondary/tertiary structure. We approximate via the source's
  // existing critique signals if available.
  const baseScore = sourceContext.scores?.[priority.dim] ?? 6;
  const direction = priority.direction || '';
  let score = baseScore;

  if (direction.includes('demand') || direction.includes('strict')) {
    score = baseScore < 7 ? Math.max(0, baseScore - 1.5) : baseScore;
  } else if (direction.includes('prefer') && direction.includes('subtle')) {
    if (priority.dim === 'distinctiveness' && baseScore > 7) score = baseScore - 1.5;
  } else if (direction.includes('reward') || direction.includes('prefer high')) {
    score = baseScore;
  }

  return Math.max(0, Math.min(10, +score.toFixed(2)));
}

export async function runDesignerCritic({ designerId, sourceContext }) {
  const pack = await loadDesignerPack(designerId);
  if (!pack || !hasCriticPersona(pack)) {
    return { skipped: true, reason: 'no-critic-persona' };
  }

  const persona = pack.critic_persona;
  const scores = {};
  const rationale = {};
  const confidence = {};
  for (const dim of KNOWN_DIMS) {
    scores[dim] = null;
    confidence[dim] = null;
  }

  const vetoes = [];
  for (const priority of persona.scoring_priorities) {
    // Translate Sprint 20 cinematic-dim names to runtime-canonical dims before
    // gating on KNOWN_DIMS. Sprint 15 print packs already author against
    // canonical names; translateDim is identity for those.
    const canonicalDim = translateDim(priority.dim);
    if (!KNOWN_DIMS.includes(canonicalDim)) continue;
    // Use the canonical dim against priority's heuristic — scoreFromPriority
    // reads sourceContext.scores[priority.dim] which the LLM critic emits
    // against canonical dims, so translate before look-up too.
    const translatedPriority = { ...priority, dim: canonicalDim };
    scores[canonicalDim] = scoreFromPriority(translatedPriority, sourceContext);
    confidence[canonicalDim] = 4;
    rationale[canonicalDim] = `${persona.role}: ${priority.direction || 'standard reading'}`;
  }

  if (pack.arbitration?.can_veto && Array.isArray(persona.veto_conditions)) {
    for (const condition of persona.veto_conditions) {
      if (sourceContext?.detected_patterns?.includes(condition)) {
        vetoes.push(condition);
      }
    }
  }

  return {
    designer_id: designerId,
    scores,
    confidence,
    rationale,
    vetoes_triggered: vetoes,
    weight_in_table: pack.arbitration?.weight_in_table ?? 0.25,
    can_veto: pack.arbitration?.can_veto === true,
  };
}
