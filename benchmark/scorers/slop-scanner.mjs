// Deterministic slop scanner — same 21 patterns as capture-and-critique.mjs.
// Exported as a standalone scorer the benchmark runner can call offline.

function sanitize(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(^|\s)\/\/[^\n]*/g, '$1');
}

export function scanSlop(source) {
  const clean = sanitize(source || '');
  const flags = [];
  const push = (flag, cond) => { if (cond) flags.push(flag); };

  push('purple-gradient', /\b(from|via|to)-(purple|violet)-\d{2,3}\b/.test(clean));
  push('cyan-on-dark', /\btext-cyan-\d{2,3}\b|#06B6D4\b/i.test(clean));
  push('left-border-accent', /\bborder-l-4\b|border-left:\s*4px\s+solid/.test(clean));
  push('dark-bg-colored-glow', /\bbg-(gray|zinc|slate)-900\b[\s\S]{0,120}\bshadow-[a-z0-9]+/.test(clean));
  push('gradient-text-heading', /\bbg-clip-text\b[\s\S]{0,200}\btext-transparent\b[\s\S]{0,200}\bbg-gradient/.test(clean));
  push('hero-metric-layout', /\btext-(4xl|5xl|6xl)\b/.test(clean) && /\btext-(sm|xs)\b/.test(clean) && /\bbg-gradient-/.test(clean));
  push('repeated-card-grid', (clean.match(/className="[^"]*\bcard\b/g) || []).length >= 3);
  push('inter-sole-typeface', /font-family:\s*["']?Inter\b|--font-[a-z-]*:\s*["']?Inter\b/i.test(clean) && !/\b(Bricolage|Instrument|Plus Jakarta|DM Sans|Geist|Grotesk|Vela|Gentium|Cabinet)/i.test(clean));
  push('generic-font-sole', /font-family:\s*["']?(Roboto|Arial|Open Sans)\b/i.test(clean));
  push('tailwind-blue-3b82f6', /\bbg-blue-500\b|#3B82F6\b/i.test(clean));
  push('tailwind-indigo-6366f1', /\bbg-indigo-500\b|#6366F1\b/i.test(clean));
  push('tailwind-emerald-10b981', /\btext-emerald-500\b|#10B981\b/i.test(clean));
  const radiusCount = (clean.match(/\brounded-(lg|md|xl)\b/g) || []).length;
  const classCount = (clean.match(/\bclassName=/g) || []).length || 1;
  push('uniform-border-radius', radiusCount >= classCount);
  push('shadow-md-uniform', (clean.match(/\bshadow-md\b/g) || []).length >= 3);
  push('centered-hero-gradient', /\btext-center\b/.test(clean) && /\bbg-gradient-/.test(clean) && /\babsolute\b/.test(clean));
  push('three-col-icon-feature', /<[A-Z][A-Za-z]*Icon\b/.test(clean) && /<h3\b/.test(clean) && /\bgrid-cols-3\b/.test(clean));
  push('poppins-blue-gradient', /\bPoppins\b/.test(clean) && /\b(from-blue|bg-blue)-\d{2,3}\b/.test(clean));
  push('white-on-light-gray', /\bbg-white\b/.test(clean) && /\bbg-(gray-50|gray-100|slate-50)\b/.test(clean));
  const symPad = (clean.match(/\bp-(4|6|8)\b/g) || []).length;
  const axisPad = (clean.match(/\b(px|py)-\d/g) || []).length;
  push('symmetric-padding-no-rhythm', symPad >= 3 && axisPad === 0);
  push('neon-on-dark-untheme', /\bbg-(black|gray-950|zinc-950)\b/.test(clean) && /(shadow-(cyan|violet|fuchsia|pink|emerald)|text-(cyan|violet|fuchsia))/.test(clean));

  return { count: flags.length, flags };
}
