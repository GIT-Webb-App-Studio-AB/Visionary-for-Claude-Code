// hooks/scripts/lib/structural-checks/duplicate-heading.mjs
import { isVisible, normaliseHeadingText } from './types.mjs';

export const ID = 'duplicate-heading';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3']);

export function check(domSnapshot, viewport) {
  void viewport;
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];

  const groups = new Map();
  for (const el of domSnapshot.elements) {
    if (!HEADING_TAGS.has(el?.tagName)) continue;
    if (!isVisible(el)) continue;
    const norm = normaliseHeadingText(el.text);
    if (norm === '') continue;
    const arr = groups.get(norm) || [];
    arr.push(el);
    groups.set(norm, arr);
  }

  const hits = [];
  for (const [norm, arr] of groups.entries()) {
    if (arr.length < 2) continue;
    hits.push({
      check_id: ID,
      selector: arr[0].selector,
      observed: {
        text: arr[0].text,
        normalised: norm,
        count: arr.length,
        all_selectors: arr.map((e) => e.selector),
      },
      message: `${arr.length}× duplicate heading "${arr[0].text.slice(0, 60)}"`,
    });
  }
  return hits;
}
