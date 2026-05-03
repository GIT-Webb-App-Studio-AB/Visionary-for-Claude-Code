// hooks/scripts/lib/structural-checks/heading-hierarchy-skip.mjs
import { isVisible } from './types.mjs';

export const ID = 'heading-hierarchy-skip';
const HEADING_RE = /^h([1-6])$/;

export function check(domSnapshot, viewport) {
  void viewport;
  if (!domSnapshot || !Array.isArray(domSnapshot.elements)) return [];

  const headings = [];
  for (const el of domSnapshot.elements) {
    const m = HEADING_RE.exec(el?.tagName || '');
    if (!m) continue;
    if (!isVisible(el)) continue;
    headings.push({ level: parseInt(m[1], 10), selector: el.selector });
  }

  const hits = [];
  let lastSeenLevel = null;
  for (const h of headings) {
    if (h.level === 1) {
      lastSeenLevel = 1;
      continue;
    }
    if (lastSeenLevel === null) {
      lastSeenLevel = h.level;
      continue;
    }
    if (h.level > lastSeenLevel + 1) {
      hits.push({
        check_id: ID,
        selector: h.selector,
        observed: { from_level: lastSeenLevel, to_level: h.level, selector_at_skip: h.selector },
        message: `Heading hierarchy skips from h${lastSeenLevel} to h${h.level}`,
      });
    }
    lastSeenLevel = h.level;
  }
  return hits;
}
