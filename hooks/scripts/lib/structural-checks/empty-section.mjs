// hooks/scripts/lib/structural-checks/empty-section.mjs
import { isVisible } from './types.mjs';

export const ID = 'empty-section';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3']);
const STRUCTURAL_CONTENT_TAGS = new Set([
  'ul', 'ol', 'dl', 'table', 'figure', 'picture', 'video', 'iframe',
  'img', 'svg', 'blockquote', 'pre', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]);
const MIN_EMPTY_FOR_FAIL = 2;

export function check(domSnapshot, viewport) {
  void viewport;
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];

  const empties = [];
  for (const el of domSnapshot.elements) {
    if (!HEADING_TAGS.has(el?.tagName)) continue;
    if (!isVisible(el)) continue;
    const sibTag = typeof el.nextElementSiblingTag === 'string' ? el.nextElementSiblingTag : null;
    const sibText = typeof el.nextElementSiblingText === 'string' ? el.nextElementSiblingText.trim() : '';

    if (sibTag == null) {
      empties.push({ selector: el.selector, text: el.text || '' });
      continue;
    }
    if (STRUCTURAL_CONTENT_TAGS.has(sibTag)) continue;
    if (sibText.length > 0) continue;
    empties.push({ selector: el.selector, text: el.text || '' });
  }

  if (empties.length < MIN_EMPTY_FOR_FAIL) return [];

  return [{
    check_id: ID,
    selector: empties[0].selector,
    observed: { empty_headings: empties, count: empties.length },
    message: `${empties.length} headings without following content (layout collapse)`,
  }];
}
