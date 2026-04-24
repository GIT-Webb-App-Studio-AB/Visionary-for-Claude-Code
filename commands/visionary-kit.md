---
name: visionary-kit
description: >
  Content kit management. A `visionary-kit.json` file declares the realistic
  data shapes, constraints, and states a component must render — so
  generations produce components that survive real data (long names,
  diacritics, empty lists, nullable fields) rather than hard-coding
  "Jane Doe" fixtures. Subcommands: init, preview, auto-infer, validate.
  Invoked as /visionary-kit or /kit.
---

# /visionary-kit — Content kits for content-resilient generation

Generators (Claude and otherwise) tend to emit components that look great
against the data the generator imagined — usually three users named *Jane
Doe*, *John Smith* and *Acme Corp*, with URLs that fit on one line and
nobody with an umlaut or apostrophe. Real data breaks those components.

A **content kit** is a `visionary-kit.json` file at the project root that
spells out:

- What entities your app renders (`User`, `Invoice`, `Product`, …) and what
  shape they have
- Realistic samples — including edge cases (long names, null avatars,
  diacritics)
- Per-field constraints (median string length, null rate, currency, enums)
- Per-component densities (p95 rows per table, empty-state rate per list)
- Which states every component must handle (`loading`, `empty`, `error`,
  `populated`)

Visionary reads this kit in two places:

1. **Generation** (Task 21.6) — the kit is injected into the system prompt
   so the generated component references realistic shapes instead of
   inventing placeholder data.
2. **Critique** (Task 21.5) — the content-resilience scorer renders the
   component three times (p50, p95, empty) using kit-derived data and
   grades whether the layout holds.

See also `docs/content-kits.md` for the full "why" and a worked example.

---

## Subcommands

### `/visionary-kit init`

Creates `visionary-kit.json` at the project root with a commented template
suitable for manual editing. If the file already exists, prints a diff
preview and refuses to overwrite (re-run with `--force`).

```bash
/visionary-kit init
/visionary-kit init --force          # overwrite existing file
/visionary-kit init --locale sv      # bias templates toward a locale
```

### `/visionary-kit preview`

Prints the active `visionary-kit.json` with per-entity counts, inferred
field types, and a "realism check" that flags obvious placeholder names
(`Jane Doe`, `john.smith@example.com`, `Acme Corp`) so you can replace
them before the first real generation.

```bash
/visionary-kit preview
```

### `/visionary-kit auto-infer [--source ts|prisma|openapi] [--write]`

Runs one of the three auto-inference pipelines (Tasks 21.2–21.4) to build
a kit from the project's existing type information:

- `--source ts` — parses TypeScript exported interfaces/types (see
  `scripts/infer-kit-from-ts.mjs`)
- `--source prisma` — parses `prisma/schema.prisma`
- `--source openapi` — parses `openapi.yaml` / `swagger.json`

Auto-detects the source if `--source` is omitted: the first of
`prisma/schema.prisma`, `openapi.yaml`, `swagger.json`, `tsconfig.json`
that exists wins.

Output goes to `stdout` by default. Pass `--write` to save to
`visionary-kit.json` (with a confirmation prompt unless `--force`).

```bash
/visionary-kit auto-infer --source prisma --write
/visionary-kit auto-infer --source ts
```

**Important:** Auto-inference is a *starting point*, not a finished kit.
You almost always want to hand-edit the sample values (the inference
generates realistic-looking placeholders but it can't know your domain
— "4,829 kr" is more useful than "1000" even if both pass the min/max
constraints).

### `/visionary-kit validate`

Two-part check:

1. **Schema validation** — the file conforms to
   `skills/visionary/schemas/visionary-kit.schema.json`.
2. **Realism validation** — warns about placeholder content that
   generators use as a crutch: names matching `Jane Doe|John Smith`,
   emails at `example.com` (prefer your real domain to trigger correct
   truncation behaviour), amounts that are conspicuously round (`1000`,
   `100`, `999`).

Exits non-zero if schema validation fails; exits zero with warnings if
only realism checks fail.

```bash
/visionary-kit validate
```

---

## File shape

A minimal kit:

```jsonc
{
  "$schema": "https://visionary-claude.dev/schemas/visionary-kit.schema.json",
  "schema_version": "1.0.0",
  "locale": "sv",
  "entities": {
    "User": {
      "sample": [
        { "id": "u_1", "name": "Kirsti Hagberg", "email": "kirsti.hagberg@example.se", "avatar_url": null }
      ],
      "constraints": {
        "name": { "p95_length": 28, "may_contain_diacritics": true },
        "avatar_url": { "nullable": true, "null_rate": 0.22 }
      }
    }
  },
  "required_states": ["loading", "empty", "error", "populated"]
}
```

A realistic kit (e-commerce in Swedish) lives at
`docs/sprints/artifacts/example-visionary-kit.json`.

The full JSON Schema is at
`skills/visionary/schemas/visionary-kit.schema.json`.

---

## Implementation

Backed by `scripts/visionary-kit.mjs`. Direct invocation:

```bash
node scripts/visionary-kit.mjs init
node scripts/visionary-kit.mjs preview
node scripts/visionary-kit.mjs auto-infer --source prisma --write
node scripts/visionary-kit.mjs validate
```

## Bash invocation

Parse arg string into `[subcommand, ...rest]`. Route to:

```bash
node scripts/visionary-kit.mjs <subcommand> <rest…>
```

The script owns arg parsing and usage-text for each subcommand.
