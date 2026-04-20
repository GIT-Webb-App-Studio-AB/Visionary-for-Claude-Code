// Motion readiness scorer — source-level.

export function scoreMotion(source) {
  const src = source || '';
  let score = 1; // start low; each positive signal adds

  // Token usage (motion-tokens.ts or CSS custom props)
  if (/spring\.(micro|snappy|ui|gentle|bounce|layout)\b/.test(src)) score += 1.5;
  if (/visualDuration|bounce:\s*0\.\d/.test(src)) score += 0.5;

  // CSS-first motion
  if (/@starting-style\b/.test(src)) score += 0.5;
  if (/animation-timeline:\s*(view|scroll)\b/.test(src)) score += 0.5;
  if (/@view-transition\b/.test(src)) score += 0.5;
  if (/linear\(/.test(src)) score += 0.3;

  // Reduced-motion gate
  if (/@media\s*\(prefers-reduced-motion/.test(src)) score += 1;

  // WCAG 2.2.2 pause control (if animation > 5s detected)
  const hasLongAnimation = /(animation:\s*[^;]*\d+s|duration:\s*(\d{4,}|[5-9]\d+\d*ms))/.test(src);
  const hasPauseControl = /animation-play-state|pauseAll|pauseMotion/.test(src);
  if (hasLongAnimation) {
    if (hasPauseControl) score += 0.5;
    else score -= 1; // penalty for unguarded long animation
  }

  // Hardcoded-duration penalty
  const hardcodedDurations = (src.match(/duration:\s*(100|200|300|400|500)ms/g) || []).length;
  if (hardcodedDurations > 3) score -= 0.5;

  // Motion library
  if (/from\s+['"]motion\/react['"]/.test(src)) score += 0.5;
  if (/from\s+['"]framer-motion['"]/.test(src)) score -= 0.5; // deprecated name

  return Math.max(1, Math.min(5, Math.round(score * 2) / 2));
}
