// rag-anchors.mjs — Sprint 06 Task 17.4
//
// Produces "anchor" text for the critic system prompt, built from the user's
// own accepted-examples history. The critic uses anchors as *scoring
// calibration*, not as required matches: "this user rated similar briefs
// at composite 8.4 for a similar-style output". The critic still scores
// the current output on its merits; anchors shift the floor.
//
// Flow:
//   1. Embed the current brief.
//   2. Cosine-rank against every accepted-example entry.
//   3. Return the top-3 anchors formatted for injection.
//   4. Cold-start fallback: when < MIN_EXAMPLES_FOR_RAG accepted entries
//      exist, return a designer-pack baseline anchor instead (Rams by
//      default, overridable via /designer or a documented env var).
//
// Call site: hooks/scripts/capture-and-critique.mjs. The output string
// goes into additionalContext alongside the standard critic instructions.
//
// Zero dependencies. Node 18+.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { embedBrief, topK, embedderId as EMBEDDER_ID } from './embed-brief.mjs';
import { listAcceptedExamples } from './accepted-store.mjs';
import { isTasteDisabled, findProjectRoot } from './taste-io.mjs';

export const MIN_EXAMPLES_FOR_RAG = 5;
export const DEFAULT_ANCHOR_COUNT = 3;

// ── Path helpers ────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..', '..');

function designersDir() { return join(repoRoot, 'designers'); }

// ── Public: buildAnchors ────────────────────────────────────────────────────
// Inputs:
//   briefSummary     — the current brief text (truncated internally to 500)
//   projectRoot      — discovery override for tests
//   designerOverride — "rams" | "kowalski" | "vignelli" | "scher" | "greiman"
//                      Wins over auto-default. Comes from /designer <name>.
//   k                — how many anchors to surface (default 3)
//
// Returns:
//   {
//     mode: 'rag' | 'cold-start' | 'disabled',
//     anchors: [{ id, similarity, style_id, composite, screenshot_path, brief_summary }],
//     anchor_text: string,    // ready to splice into additionalContext
//     reason: string,         // why this mode
//     example_count: number,
//   }
export function buildAnchors({
  briefSummary,
  projectRoot,
  designerOverride,
  k = DEFAULT_ANCHOR_COUNT,
} = {}) {
  if (isTasteDisabled()) {
    return { mode: 'disabled', anchors: [], anchor_text: '', reason: 'VISIONARY_DISABLE_TASTE=1', example_count: 0 };
  }
  const root = projectRoot || findProjectRoot();
  const brief = String(briefSummary || '').slice(0, 500);
  const { items } = listAcceptedExamples(root);
  const count = items.length;
  // Env override — test + power-user escape hatch
  const envMin = Number.parseInt(process.env.VISIONARY_RAG_MIN_EXAMPLES || '', 10);
  const minRequired = Number.isFinite(envMin) && envMin > 0 ? envMin : MIN_EXAMPLES_FOR_RAG;

  if (count < minRequired) {
    const pack = designerOverride || pickDesignerDefault();
    const text = buildColdStartAnchor(pack, count, minRequired);
    return {
      mode: 'cold-start',
      anchors: [],
      anchor_text: text,
      reason: `only ${count} accepted examples (< ${minRequired}); using designer-pack "${pack}"`,
      example_count: count,
    };
  }

  if (!brief) {
    return { mode: 'rag', anchors: [], anchor_text: '', reason: 'no brief provided', example_count: count };
  }

  const queryVec = embedBrief(brief);
  const candidates = items.map((e) => ({
    id: e.id,
    embedding: e.brief_embedding,
    meta: e,
  }));
  const ranked = topK(queryVec, candidates, k);
  const anchors = ranked.map((r) => ({
    id: r.id,
    similarity: Number.isFinite(r.score) ? roundTo(r.score, 3) : 0,
    style_id: r.candidate.meta.style_id,
    composite: r.candidate.meta.composite,
    screenshot_path: r.candidate.meta.screenshot_path,
    brief_summary: r.candidate.meta.brief_summary,
    product_archetype: r.candidate.meta.product_archetype || null,
    accepted_at: r.candidate.meta.accepted_at,
  }));

  return {
    mode: 'rag',
    anchors,
    anchor_text: buildAnchorText(anchors, { embedderId: EMBEDDER_ID }),
    reason: `top-${anchors.length} of ${count} accepted examples by cosine similarity`,
    example_count: count,
  };
}

function roundTo(v, p) { const m = 10 ** p; return Math.round(v * m) / m; }

// ── Cold-start designer packs ───────────────────────────────────────────────
// The designer directories contain .taste TOML files with a `principles`
// section we can excerpt. If a pack file is missing we fall back to
// hard-coded principle text so the critic never receives an empty anchor.
//
// This loader intentionally stays lenient: partial TOML is fine, we just
// grep lines rather than parse fully. Sprint 7 added a full TOML parser
// (hooks/scripts/lib/toml-lite.mjs) but we deliberately avoid the
// dependency here — pack excerpts are static data, not executable config.
const HARDCODED_PACKS = {
  rams: {
    title: 'Dieter Rams — 10 principles of good design',
    principles: [
      'Good design is innovative — advances possibility without novelty for its own sake.',
      'Good design makes a product useful — form serves function, not decoration.',
      'Good design is aesthetic — beauty follows function; nothing is ornamental.',
      'Good design makes a product understandable — no instructions needed.',
      'Good design is unobtrusive — neutral, restrained, leaves room for self-expression.',
      'Good design is honest — promises nothing it cannot deliver.',
      'Good design is long-lasting — avoids trend; endures aesthetic scrutiny.',
      'Good design is thorough — every detail intentional.',
      'Good design is environmentally friendly — conserves resources.',
      'Good design is as little design as possible — back to purity, back to simplicity.',
    ],
  },
  kowalski: {
    title: 'Emil Kowalski — editorial typographic intensity',
    principles: [
      'Typography is the architecture. A great serif pairing carries the design.',
      'High contrast between display and body; body stays readable at 16-18px.',
      'Negative space is a design element — not an accident.',
      'Motion respects hierarchy; the lede animates before the supporting copy.',
    ],
  },
  vignelli: {
    title: 'Massimo Vignelli — grid, Helvetica, modular discipline',
    principles: [
      'The grid is the foundation. Everything aligns.',
      'Typography: Helvetica (or its descendants). Modular scale. No decorative fonts.',
      'Colour is functional, not decorative. Limited palette, high contrast.',
      'Clarity beats cleverness. The reader must never feel lost.',
    ],
  },
  scher: {
    title: 'Paula Scher — typographic maximalism',
    principles: [
      'Type is the image. Scale without fear.',
      'Colour is primary — saturated, unapologetic, brand-forward.',
      'Compositions can be loud. Quiet is a deliberate choice, not a default.',
      'Rhythm comes from deliberate chaos — not symmetric grids.',
    ],
  },
  greiman: {
    title: 'April Greiman — digital-native layered geometry',
    principles: [
      'Digital is a native medium, not a substitute for print.',
      'Layering, transparency, and overlapping geometry signal the medium.',
      'Typography can interact with image — not just sit on top.',
      'Playful geometry is serious design when executed deliberately.',
    ],
  },
};

function pickDesignerDefault() {
  const env = (process.env.VISIONARY_DESIGNER_DEFAULT || '').toLowerCase();
  if (env && HARDCODED_PACKS[env]) return env;
  return 'rams';
}

function buildColdStartAnchor(packName, count, required) {
  const pack = HARDCODED_PACKS[packName] || HARDCODED_PACKS.rams;
  // Try pack file first if it exists — gives the user-customised version
  // precedence over hard-coded defaults.
  const fileAnchor = tryReadPackFile(packName);
  const principles = fileAnchor?.principles || pack.principles;
  const title = fileAnchor?.title || pack.title;
  const lines = [
    `=== RAG anchors: cold-start mode ===`,
    `No personal taste history yet (${count} of ${required} required accepted examples).`,
    `Calibration anchor: ${title}.`,
    ``,
    ...principles.map((p) => `  • ${p}`),
    ``,
    `Apply these principles as baseline taste. Once ${required}+ accepted examples exist, RAG retrieval replaces this fallback with the user's own demonstrated preferences.`,
  ];
  return lines.join('\n');
}

function tryReadPackFile(packName) {
  const dir = designersDir();
  if (!existsSync(dir)) return null;
  // Accept any file with the pack name as prefix: rams.taste, dieter-rams.taste, etc.
  let files;
  try { files = readdirSync(dir); } catch { return null; }
  const candidate = files.find((f) => f.toLowerCase().endsWith('.taste') && f.toLowerCase().includes(packName.toLowerCase()));
  if (!candidate) return null;
  let body;
  try { body = readFileSync(join(dir, candidate), 'utf8'); } catch { return null; }
  const principles = extractPrinciples(body);
  if (!principles.length) return null;
  return {
    title: extractTitle(body) || candidate.replace(/\.taste$/, ''),
    principles,
  };
}

// TOML-lite grep: pulls principle-like lines out of the file. Looks for
// `principles = [...]` array blocks OR `# Principle:` comment style.
function extractPrinciples(body) {
  const out = [];
  const arrayMatch = body.match(/principles\s*=\s*\[([\s\S]*?)\]/i);
  if (arrayMatch) {
    const entries = arrayMatch[1].match(/"([^"]+)"|'([^']+)'/g) || [];
    for (const e of entries) {
      out.push(e.slice(1, -1));
    }
  }
  if (!out.length) {
    // Fall back to `# Principle: ...` lines
    const lines = body.split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*#\s*Principle:\s*(.*)$/i);
      if (m && m[1].trim()) out.push(m[1].trim());
    }
  }
  return out.slice(0, 10);
}

function extractTitle(body) {
  const m = body.match(/^\s*title\s*=\s*"([^"]+)"/mi) || body.match(/^\s*name\s*=\s*"([^"]+)"/mi);
  return m ? m[1] : null;
}

// ── Anchor text formatting ──────────────────────────────────────────────────
// Renders the top-k anchors as a readable block for the critic's
// additionalContext. Deliberately terse — the anchor block should be
// <~1 KB on average so it doesn't crowd out critique instructions.
function buildAnchorText(anchors, { embedderId } = {}) {
  if (!anchors.length) return '';
  const lines = [
    `=== RAG anchors: personal taste calibration (embedder=${embedderId}) ===`,
    `This user previously rated the following outputs as acceptable for similar briefs.`,
    `Calibrate your scoring to their demonstrated taste — these are ANCHORS, not templates.`,
    '',
  ];
  anchors.forEach((a, i) => {
    const sim = (a.similarity * 100).toFixed(0);
    const comp = typeof a.composite === 'number' ? a.composite.toFixed(1) : '—';
    lines.push(`  ${i + 1}. brief="${escapeQuote(a.brief_summary)}" · style=${a.style_id} · composite=${comp}/10 · similarity=${sim}%`);
    if (a.screenshot_path) lines.push(`     screenshot: ${a.screenshot_path}`);
    if (a.product_archetype) lines.push(`     archetype: ${a.product_archetype}`);
    lines.push('');
  });
  lines.push('When scoring the current output, ask: is this output\'s craft and taste level consistent with these accepted anchors?');
  return lines.join('\n');
}

function escapeQuote(s) {
  return String(s || '').replace(/"/g, '\\"').slice(0, 180);
}

export default buildAnchors;
