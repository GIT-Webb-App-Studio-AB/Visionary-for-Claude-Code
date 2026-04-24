// kit-sampler.mjs — Shared sample generators for visionary-kit auto-inference.
//
// Both infer-kit-from-ts.mjs and infer-kit-from-prisma.mjs need to turn a
// field name + type into a realistic sample value. Consolidating here keeps
// the samplers consistent across input formats (TS, Prisma, OpenAPI) and
// makes locale behaviour auditable.
//
// Design:
//   - Field name is the strongest signal (`email`, `avatar_url`, `price`
//     → obvious). Type is the fallback.
//   - Locale biases string pools (Swedish names when locale=sv, German
//     when locale=de, etc.). Fall back to English when no locale.
//   - Generators are deterministic given the same (name, type, locale,
//     index) — `index` is used to produce multiple distinct samples per
//     entity without a PRNG dependency.
//
// Zero dependencies. Pure functions.

// ── Locale name pools ───────────────────────────────────────────────────────
const NAMES = {
  sv: [
    'Kirsti Hagberg', 'Åke Sköld-Östergren', 'Mohammed Larsson',
    'Sigrid Björkman', 'Emil Fällgren', 'Linnéa Ödmark',
    'Johan Wålhström', 'Anna-Karin Öhlin',
  ],
  de: [
    'Jürgen Müller', 'Anneliese Köhler', 'Stefan Größler',
    'Monika Hübner-Kaufmann', 'Wolfgang Schäfer', 'Ingrid Weiß',
  ],
  fr: [
    'Élodie Martineau', 'François Lévêque', 'Jean-Baptiste Ménard',
    'Camille Thibault', 'Émilie Rousseau', 'Marc-André Pêcheur',
  ],
  es: [
    'María José García', 'José Luis Peña', 'Íñigo Álvarez-Núñez',
    'Carmen Gutiérrez', 'Rubén Sánchez', 'Ángel Cortés',
  ],
  en: [
    'Sofia Martinez', 'David Thompson', 'Priya Shah',
    'Lukas Weber', 'Mei Chen', 'Olumide Johnson',
    'Hannah Whitcomb-Feinstein',
  ],
};

const COMPANIES = {
  sv: ['Ödmark & Berggren AB', 'Hansen Förlag', 'Örebro Verkstad'],
  de: ['Zimmermann GmbH', 'Hühner & Söhne AG', 'Weißbrot-Bäckerei'],
  fr: ['Maison Lévêque SARL', 'Édition Thibault', 'Atelier Pêcheur'],
  en: ['Northwind Supplies', 'Pine Harbor Studio', 'Kite & Fox Ltd'],
};

const EMAIL_DOMAINS = {
  sv: 'example.se',
  de: 'example.de',
  fr: 'example.fr',
  es: 'example.es',
  en: 'example.com',
};

const STRING_SAMPLES = {
  sv: ['Örtkudde med lavendel', 'Höst på Gotland', 'Bokföringsrapport Q3'],
  de: ['Straßenfest im München', 'Jahresbericht 2026', 'Küchenartikel'],
  fr: ['Résumé de la réunion', 'Été à Cannes', 'Bénéfice net'],
  en: ['Quarterly retrospective', 'Rollout timeline', 'Support tier 2'],
};

// ── Name-based type hints ───────────────────────────────────────────────────
// Ordered: first match wins. Returns a generator closure.
const FIELD_HINTS = [
  { re: /^(id|uuid)$/i, gen: (ctx) => `${prefix(ctx.entityName)}_${String(ctx.index + 1).padStart(3, '0')}` },
  { re: /_id$/i, gen: (ctx) => `${ctx.fieldName.replace(/_id$/i, '')}_${String(ctx.index + 1).padStart(3, '0')}` },
  { re: /^(name|full_name|display_name)$/i, gen: (ctx) => pickLocale(NAMES, ctx.locale, ctx.index) },
  { re: /^(first_name|firstname|given_name)$/i, gen: (ctx) => pickLocale(NAMES, ctx.locale, ctx.index).split(' ')[0] },
  { re: /^(last_name|lastname|family_name|surname)$/i, gen: (ctx) => pickLocale(NAMES, ctx.locale, ctx.index).split(' ').slice(1).join(' ') },
  { re: /^(email|e_?mail|contact)$/i, gen: (ctx) => emailFromName(pickLocale(NAMES, ctx.locale, ctx.index), ctx.locale) },
  { re: /^(company|organization|org)$/i, gen: (ctx) => pickLocale(COMPANIES, ctx.locale, ctx.index) },
  { re: /^(phone|mobile|tel)$/i, gen: (ctx) => phoneFor(ctx.locale, ctx.index) },
  { re: /^(avatar|avatar_url|image|image_url|photo)$/i, gen: (ctx) => ctx.index === 0 ? null : `https://cdn.${EMAIL_DOMAINS[ctx.locale || 'en']}/av/${ctx.index}.jpg` },
  { re: /^(url|website|homepage|link)$/i, gen: (ctx) => `https://${EMAIL_DOMAINS[ctx.locale || 'en']}/p/${ctx.index + 1}` },
  { re: /^(price|amount|total|cost|fee)$/i, gen: (ctx) => priceFor(ctx.locale, ctx.index) },
  { re: /^(count|quantity|qty|stock|in_stock)$/i, gen: (ctx) => ctx.index === 1 ? 0 : 42 + ctx.index },
  { re: /^(percent|percentage|ratio|rate)$/i, gen: (ctx) => 0.1 + (ctx.index * 0.07) },
  { re: /^(created_at|updated_at|issued_at|deleted_at|timestamp)$/i, gen: (ctx) => daysAgo(ctx.index + 1).toISOString() },
  { re: /^(date|due_date|birthday|birth_date)$/i, gen: (ctx) => daysAgo(ctx.index * 30 + 1).toISOString().slice(0, 10) },
  { re: /^(is_|has_|can_|should_)/i, gen: (ctx) => ctx.index % 2 === 0 },
  { re: /^(active|enabled|paid|verified|admin)$/i, gen: (ctx) => ctx.index % 2 === 0 },
  { re: /^(status|state)$/i, gen: (ctx) => ['active', 'pending', 'archived'][ctx.index % 3] },
  { re: /^(role|type|category|tier)$/i, gen: (ctx) => ['admin', 'member', 'viewer'][ctx.index % 3] },
  { re: /^(title|heading|subject)$/i, gen: (ctx) => pickLocale(STRING_SAMPLES, ctx.locale, ctx.index) },
  { re: /^(description|body|content|summary|notes)$/i, gen: (ctx) => `${pickLocale(STRING_SAMPLES, ctx.locale, ctx.index)}. Lorem-free sample.` },
  { re: /^(currency)$/i, gen: (ctx) => currencyFor(ctx.locale) },
  { re: /^(country|country_code)$/i, gen: (ctx) => ({ sv: 'SE', de: 'DE', fr: 'FR', es: 'ES', en: 'US' }[ctx.locale || 'en']) },
  { re: /^(language|lang|locale)$/i, gen: (ctx) => ctx.locale || 'en' },
];

// ── Public: sample a field ───────────────────────────────────────────────────
// ctx = { entityName, fieldName, index, locale, type }
// type is the type hint extracted from source (ts type/prisma type). We fall
// back to it when no name-hint matches.
export function sampleFor(ctx) {
  for (const h of FIELD_HINTS) {
    if (h.re.test(ctx.fieldName)) return h.gen(ctx);
  }
  return sampleByType(ctx);
}

function sampleByType(ctx) {
  const t = String(ctx.type || '').toLowerCase().replace(/\[\]$/, '').trim();
  if (t === 'string' || t === 'string?' || t === 'text') return pickLocale(STRING_SAMPLES, ctx.locale, ctx.index);
  if (t === 'number' || t === 'int' || t === 'bigint' || t === 'float' || t === 'decimal') return 10 + ctx.index * 3;
  if (t === 'boolean' || t === 'bool') return ctx.index % 2 === 0;
  if (t === 'date' || t === 'datetime') return daysAgo(ctx.index + 1).toISOString();
  if (t === 'json' || t === 'object' || t === 'any') return {};
  const union = t.split('|').map((s) => s.trim()).filter(Boolean);
  if (union.length > 1) return unquote(union[0]) || union[0];
  return null;
}

// ── Public: constraint derivation ────────────────────────────────────────────
// Turn a field name + type into a reasonable constraints object. The kit
// editor will tune these by hand; we aim to get 80% right so the first
// generation already beats "Jane Doe" placeholders.
export function constraintsFor({ fieldName, type, locale }) {
  const f = String(fieldName).toLowerCase();
  const out = {};
  if (/email/.test(f)) { out.format = 'email'; out.p95_length = 48; }
  if (/url|link|avatar|image|photo|homepage/.test(f)) {
    out.format = 'url';
    if (/avatar|image|photo/.test(f)) { out.nullable = true; out.null_rate = 0.22; }
  }
  if (/phone|mobile|tel/.test(f)) { out.format = 'phone'; }
  if (/^(name|full_name|display_name|title|heading|subject|description|summary)$/.test(f)) {
    const p95 = /description|summary|body|content/.test(f) ? 220 : 28;
    out.p50_length = Math.round(p95 / 2);
    out.p95_length = p95;
    if (isHighDiacriticLocale(locale)) {
      out.may_contain_diacritics = true;
      out.may_contain_apostrophe = true;
    }
  }
  if (/^(price|amount|total|cost|fee)$/.test(f)) {
    out.min = 0; out.p95 = 100000;
    out.currency_suffix = currencyFor(locale);
  }
  if (/count|quantity|stock|qty/.test(f)) {
    out.min = 0; out.max = 9999;
  }
  if (/^(is_|has_|can_|should_)/.test(f)) { out.nullable = false; }
  if (/status|role|type|category|tier|state/.test(f)) {
    if (f === 'role') out.enum = ['admin', 'member', 'viewer'];
    else if (f === 'status' || f === 'state') out.enum = ['active', 'pending', 'archived'];
  }
  if (type && String(type).endsWith('?')) {
    out.nullable = true;
    if (out.null_rate === undefined) out.null_rate = 0.1;
  }
  return Object.keys(out).length ? out : undefined;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function pickLocale(table, locale, index) {
  const pool = table[locale] || table.en;
  return pool[index % pool.length];
}

function prefix(entityName) {
  if (!entityName) return 'id';
  return entityName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().slice(0, 4);
}

function emailFromName(name, locale) {
  const ascii = name.normalize('NFKD').replace(/[^\x00-\x7F]/g, '').replace(/-/g, '.').replace(/\s+/g, '.').toLowerCase();
  const domain = EMAIL_DOMAINS[locale || 'en'];
  return `${ascii}@${domain}`;
}

function phoneFor(locale, index) {
  const base = {
    sv: `+46 70 ${String(index).padStart(3, '0')} 01 0${index}`,
    de: `+49 30 ${String(90000 + index)}`,
    fr: `+33 6 ${String(10000000 + index)}`,
    en: `+1 555 01${String(10 + index).padStart(2, '0')}`,
  };
  return base[locale] || base.en;
}

function priceFor(_locale, index) {
  return [129.0, 349.0, 89.5, 1299.9, 42.0][index % 5];
}

function currencyFor(locale) {
  return ({ sv: 'SEK', de: 'EUR', fr: 'EUR', es: 'EUR', en: 'USD' })[locale || 'en'];
}

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function unquote(s) {
  const m = /^['"](.*)['"]$/.exec(s);
  return m ? m[1] : null;
}

function isHighDiacriticLocale(locale) {
  return ['sv', 'de', 'fr', 'es', 'pt', 'pl', 'cs', 'tr', 'is', 'ro', 'fi', 'nb', 'da'].includes(locale || '');
}
