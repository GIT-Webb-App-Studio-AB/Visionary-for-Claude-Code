// Coherence scorer — internal consistency of a single surface.
// For multi-route scoring, a different runner path calls this with the
// concatenated sources and measures cross-route Jaccard similarity.

export async function scoreCoherence(source, files) {
  const src = source || '';
  let score = 5;

  // Count unique colors — heuristic for palette discipline
  const hexes = new Set((src.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toUpperCase()));
  if (hexes.size > 12) score -= 1.5;  // too many colors
  else if (hexes.size > 8) score -= 0.5;

  // Count unique font-families
  const fonts = new Set();
  for (const m of src.matchAll(/font-family:\s*['"]?([A-Za-z][A-Za-z0-9\s-]+?)['"]?[,;]/g)) {
    fonts.add(m[1].trim());
  }
  if (fonts.size > 3) score -= 1;

  // Border-radius vocabulary — should use ≤ 4 values, not everything uses one
  const radii = new Set((src.match(/border-radius:\s*\d+(?:\.\d+)?(?:px|rem)/g) || []));
  const tailwindRadii = new Set((src.match(/\brounded-(none|sm|md|lg|xl|2xl|3xl|full)\b/g) || []));
  if (radii.size + tailwindRadii.size > 5) score -= 0.5;

  // Spacing scale — penalize arbitrary px values
  const arbitraryPx = (src.match(/(margin|padding|gap):\s*\d+px/g) || []).length;
  const scaledPx = (src.match(/\b(p|m|gap)-\d+\b/g) || []).length;
  if (arbitraryPx > scaledPx && arbitraryPx > 5) score -= 0.5;

  // Multiple accent colors — checks if >1 saturated non-grayscale color
  // Heuristic: colors with measurable chroma. For offline scoring we just
  // count unique non-grayscale hexes.
  const chromaHexes = [...hexes].filter((h) => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    return Math.max(r, g, b) - Math.min(r, g, b) > 30;
  });
  if (chromaHexes.length > 4) score -= 0.5;

  return Math.max(1, Math.min(5, Math.round(score * 2) / 2));
}
