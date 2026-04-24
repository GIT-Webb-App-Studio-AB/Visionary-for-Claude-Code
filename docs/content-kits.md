# Content kits — generation that survives real data

**Status:** Stable since Sprint 07.

## The problem content kits solve

Every AI component generator has the same tell. Give it a "user list"
brief and you get three cards: **Jane Doe**, **John Smith**, **Sofia
Martinez**. The avatars are placeholder circles. The emails are
`name@example.com`. The designs look great.

Then a real user hits the page. Her name is **Åke Sköld-Östergren**. The
card was built for 12 characters; hers is 19 with two diacritics. The
layout overflows. Her avatar field is null — the card now has an ugly
blank circle. The design doesn't look great anymore.

This is not an edge case. This is what real content looks like
everywhere outside the designer's sample data. **Figma Make** solves part
of the problem by letting teams publish sample datasets alongside designs
(see [Figma's content-first design precedent][figma-make]). Visionary's
content kits do the same for generated code: make the realism constraints
the generator has to honour **inputs**, not afterthoughts.

[figma-make]: https://www.figma.com/make/

## What a kit is

A `visionary-kit.json` file at the project root that declares:

- **Entities** — `User`, `Invoice`, `Product` — with realistic sample rows
- **Constraints** per field — `p95_length`, `may_contain_diacritics`,
  `nullable`, `null_rate`, `enum`, currency suffix, format hint
- **Component densities** — the median table has 12 rows, the p95 table
  has 47, the list empty-state rate is 18 %
- **Required states** — every component must render `loading`, `empty`,
  `error`, `populated`

The kit is read at two places in the Visionary pipeline:

1. **Generation** — the UserPromptSubmit hook
   (`hooks/scripts/inject-taste-context.mjs`) injects a kit excerpt into
   `additionalContext` when the project has one. The generator sees the
   shape before it writes any code.
2. **Critique** — the content-resilience scorer
   (`benchmark/scorers/content-resilience-scorer.mjs`) renders the
   component 3 times (p50 / p95 / empty content) and scores it on layout
   stability, empty-state quality, and typography robustness. This is the
   10th critique dimension.

## Quickstart — TypeScript project

Your `src/types.ts`:

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: 'admin' | 'member' | 'viewer';
}
```

Run the auto-inference:

```bash
/visionary-kit auto-infer --source ts --write
```

This produces a starter `visionary-kit.json` with realistic samples, enum
detection, nullable hints, and diacritic flags if the locale looks
Nordic. **Edit it.** The inference is ~80 % right; you know your domain
better. Aim for samples that exercise your actual length / diacritic /
null pressure.

Then validate:

```bash
/visionary-kit validate
```

First real generation:

```bash
/visionary user list
```

The generator will receive the kit excerpt and render a component that
uses props (not hard-coded names). The Playwright critique loop will
re-render against p50/p95/empty and score `content_resilience`.

## Full example — Swedish e-commerce with Prisma

Your `prisma/schema.prisma`:

```prisma
model Product {
  id          String @id @default(uuid())
  name        String
  price       Decimal
  currency    String   @default("SEK")
  in_stock    Int      @default(0)
  description String?
  images      Image[]
}
```

Infer the kit:

```bash
/visionary-kit auto-infer --source prisma --locale sv --write
```

The tool generates samples like:

```json
{
  "id": "prod_001",
  "name": "Örtkudde — Lavender & Kamomill, 40×25 cm",
  "price": 349.0,
  "currency": "SEK",
  "in_stock": 42,
  "description": "Höst på Gotland. Lorem-free sample."
}
```

Note **p95_length=64** on the product name — real Swedish product names
are long because they describe material + colour + dimensions. The
generated component has to wrap, truncate, or scale for that length.

Generate a product card:

```
/visionary product card
```

The kit injection tells the generator:

- Product names can be 64 chars with diacritics
- `description` is nullable at ~10 % rate
- Prices are in SEK with "kr" suffix
- `in_stock` can be 0 (empty state) or >9000 (stress case)

The critique loop then renders against:

- p50 content — median case
- p95 content — "Örtkudde — Lavender & Kamomill, 40×25 cm" with 9127 in stock
- empty state — no products

…and scores `content_resilience` based on whether the layout holds, the
empty state is useful, and the typography doesn't shrink to cope.

## The four auto-inference sources

| Source | Command | Notes |
|--------|---------|-------|
| TypeScript | `auto-infer --source ts` | Regex-based extractor for exported `interface` / `type`. MVP: no unions beyond `T \| null`, no generics. |
| Prisma | `auto-infer --source prisma` | Respects `@default()`, detects enums, maps relations to cardinality. |
| OpenAPI | `auto-infer --source openapi` | JSON-only for MVP — pipe YAML via `npx js-yaml` first. Resolves `$ref` and `allOf`. |
| Manual | `init` | Start from a template. Fastest when you know the domain. |

Auto-inference writes `inferred_from` in the kit so you know the
provenance — re-running inference on an existing kit requires `--force`
to avoid silent overwrites of hand-edited samples.

## FAQ

### Will a name like `'Å. Sköld-Östergren'` break?

No — provided you edit the kit to reflect realistic names. The
auto-inferrer uses a Swedish name pool when `--locale sv` is passed, so
the starter samples already include `Åke Sköld-Östergren` (19 chars, 3
diacritics, hyphen). `may_contain_diacritics=true` and
`may_contain_apostrophe=true` are set automatically. If the generated
component doesn't handle the apostrophe correctly, the critique loop
surfaces that.

### Does this replace Faker.js / Mock Service Worker?

No. It's not a runtime mock — kits don't run in your app. They're a
generation-time + critique-time declaration. You still need real mock
data for dev and testing; the kit just ensures the component *could*
handle real shapes before you plug the real data in.

### What if my domain model is 40 entities?

The kit excerpt injected into the generator caps at 6 entities (the
richest first). Rest are visible via `/visionary-kit preview` but don't
crowd the prompt. The generator works from the kit's shape conventions
even for entities it didn't see in the excerpt.

### Is content_resilience always scored?

No — only when a `visionary-kit.json` exists. Without a kit, the critic
emits `content_resilience: null` with `confidence: 3` (not applicable).
The loop control tolerates null for this dimension, same as
`craft_measurable`.

### What about i18n — do I need a kit per language?

One kit with `locale: "sv"` biases the samplers toward Swedish, but the
real test is whether your constraints reflect the demands of every
language you ship. If you support Swedish + Japanese + Arabic, bump
`p95_length` to cover the longest case and set `may_contain_diacritics`
true. Multiple-locale kits aren't in v1.0 — this is a design tradeoff:
one kit keeps the generator prompt small and the critique signal
deterministic.

### Is the kit versioned with my code?

Yes. `visionary-kit.json` is a source artifact, commit it. Treat schema
changes as breaking: teams that pin to a schema shape expect the kit to
evolve in lockstep. The kit format itself is versioned via
`schema_version` — the validator rejects files from a higher major
version.

## Non-goals

- **Runtime mocks** — use Faker / MSW for that.
- **Generating production data** — this is design-time shape, not a
  seeding tool.
- **Multi-entity narrative samples** — a kit entity stands alone; the
  generator composes relations based on the `relations` field but the
  kit doesn't ship pre-joined view shapes.

## Reference

- Kit schema: `skills/visionary/schemas/visionary-kit.schema.json`
- Example kit: `docs/sprints/artifacts/example-visionary-kit.json`
- Slash command: `commands/visionary-kit.md`
- Scorer: `benchmark/scorers/content-resilience-scorer.mjs`
- Sprint history: `docs/sprints/sprint-07-platform-play.md` Tasks 21.1–21.7
