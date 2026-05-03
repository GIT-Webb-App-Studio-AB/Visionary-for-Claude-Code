// hooks/scripts/lib/structural-checks/mystery-text-node.mjs
export const ID = 'mystery-text-node';

const SKIP_TAGS = new Set([
  'li', 'button', 'a', 'label', 'th', 'td', 'dt', 'dd', 'caption', 'option',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]);
const SKIP_CLASS_RE = /\b(badge|chip|tag|pill|stat|metric)\b/i;
const MAX_CHAR_LEN = 12;
const BLOCK_DISPLAYS = new Set(['block', 'flex', 'grid', 'flow-root']);
const BLOCKY_TAGS = new Set(['div', 'section', 'article', 'header', 'footer', 'aside', 'main']);

export function check(domSnapshot, viewport) {
  void viewport;
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];

  const hits = [];
  for (const el of domSnapshot.elements) {
    if (!el?.tagName || SKIP_TAGS.has(el.tagName)) continue;
    if (typeof el.text !== 'string') continue;
    const t = el.text.trim();
    if (t.length === 0 || t.length > MAX_CHAR_LEN) continue;
    if (t.split(/\s+/).length !== 1) continue;
    const display = typeof el.display === 'string' ? el.display : null;
    const blockyTag = BLOCKY_TAGS.has(el.tagName);
    if (!blockyTag && (display == null || !BLOCK_DISPLAYS.has(display))) continue;
    if (typeof el.className === 'string' && SKIP_CLASS_RE.test(el.className)) continue;

    hits.push({
      check_id: ID,
      selector: el.selector,
      observed: { text: t, parent_tag: el.parentTag || null, length: t.length },
      message: `Single-word block "${t}" in <${el.parentTag || el.tagName}> — looks like an orphan label`,
    });
  }
  return hits;
}
