---
name: visionary-apply
description: >
  Lock the currently-chosen style across the entire product. Extracts a
  design-system token file from the selected style, scans all existing UI
  routes/components, and applies the style consistently — preventing the
  "each page has a different aesthetic" drift that Lovable, bolt.new, and v0
  struggle with at scale. Invoked as /visionary-apply or /apply.
---

# /visionary-apply — Consistency Across App

The #1 unmet need cited in research on `frontend-design` (Anthropic official)
and Lovable is: *"a style that looks great on one page looks random when
it's fifteen pages"*. Lovable breaks around ~10 screens; bolt.new emits
duplicate components per page.

This command is the antidote. Once a style has been picked (via `/visionary`,
`/visionary-variants`, or manually), `/apply` makes it the lock-in style for
the whole product — every new component Claude generates in this session
inherits its tokens, and existing components can be retrofitted on demand.

## When to invoke

- After `/visionary` or `/variants` delivered a satisfying result and the
  user says "do that everywhere", "apply this to the whole app", "ship it",
  "use this style across all pages"
- When starting a multi-route build: `/apply cassette-futurism` locks it in
  before any code is generated
- When auditing an existing app for consistency drift

## Behavior

### Step 1 — Resolve the style

- If invoked with an argument (`/apply swiss-rationalism`), use that style.
- Otherwise use the most-recently-generated style from the current session,
  read from `system.md`'s `### Style history` section.

### Step 2 — Emit DTCG tokens

Run `scripts/export-dtcg-tokens.mjs` if `tokens/{style-id}.tokens.json`
doesn't exist. Copy it to the project root as `design-system/tokens.json`.
If a `design-system/tokens.json` already exists, MERGE (style wins on
conflict) — don't overwrite silently.

### Step 3 — Emit a CSS layer

Write `design-system/style.css` that:
- Declares every color token as `--visionary-color-*` custom properties at
  `:root`, using `oklch()` with hex fallback
- Declares typography, motion, and spacing tokens the same way
- Publishes a Tailwind v4 `@theme` block mapping the tokens if Tailwind is
  detected, OR a CSS Modules shim otherwise
- Writes a `@media (prefers-color-scheme: dark)` variant if the style is a
  light style (and vice versa) using the OKLCH lightness-flip technique

### Step 4 — Scan and catalogue existing UI

Walk the source tree for `*.tsx|*.jsx|*.vue|*.svelte|*.html` files.
Build an inventory:

```
ui/Button.tsx          — uses hardcoded #3B82F6 (blue), Inter font
ui/Card.tsx            — uses shadow-md, 12px rounded
pages/dashboard.tsx    — uses grid-cols-3, white bg
```

### Step 5 — Propose retrofits (NEVER AUTO-APPLY)

For each file, emit a diff proposal:

```diff
- background: #3B82F6;
+ background: var(--visionary-color-primary);

- font-family: Inter, sans-serif;
+ font-family: var(--visionary-font-display), system-ui, sans-serif;
```

Present the full retrofit plan to the user. Ask: "apply to all?", "apply to
subset?", "show diffs?". DO NOT write changes without explicit confirmation
— retrofitting is a high-blast-radius operation.

### Step 6 — Apply selectively

On confirmation:
- Use `MultiEdit` on each file, one per hop (not one massive hop — surfaces
  errors per file)
- After each `MultiEdit`, the `capture-and-critique.mjs` hook fires and the
  debounce collapses a burst into a single critique at the end
- Commit ONLY if the user said "commit". This command never commits by default.

### Step 7 — Write a CONSISTENCY.md

Drop a `design-system/CONSISTENCY.md` in the project root documenting:
- The locked style (id + why)
- The token file (`design-system/tokens.json`)
- The CSS layer (`design-system/style.css`)
- A list of components known to be compliant vs non-compliant
- The date of the lock-in

This lets future Claude sessions (or other developers) understand what
aesthetic was chosen and why, without needing to re-run the selection.

## Enforcement options

- `/apply <style> --strict` — Claude will REJECT any subsequent generation
  that introduces a color, font, or motion value not present in the token
  file. The critique loop's `design_distinctiveness` dimension scores against
  the locked palette, not a generic "AI-slop" check.
- `/apply <style> --advisory` (default) — warnings only; user stays in control.
- `/apply --unlock` — remove the lock and return to per-component aesthetic
  selection. The token file stays for reference.

## Integration with critique loop

While a style is locked:
- Slop pattern #26 (neon-on-dark without thematic justification) runs against
  the locked style's palette, not the generic palette. If the locked style IS
  one of the neon-on-dark-legitimate styles, the rule is silenced.
- The `design_distinctiveness` score uses the locked-palette Hamming distance
  instead of the generic slop-pattern list.

## Rules

- Never overwrite an existing `design-system/tokens.json` without merging.
- Never commit. The user controls VCS.
- Never auto-apply retrofits. Always propose, confirm, execute.
- Always emit the CSS layer even in `--advisory` mode — the tokens need to
  exist for subsequent `/visionary` calls to inherit them.
- Light/dark variants are emitted both ways so the style works under OS theme.
