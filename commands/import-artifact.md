---
name: visionary-import-artifact
description: >
  Import a Claude.ai Artifact into a Visionary-managed project — strip the
  sandbox-specific imports, re-skin with the project's locked style, drop the
  result into the right source location, run the critique loop. One-click
  (well, one-command) pipeline from "artifact I sketched in Claude.ai" to
  "component in my real codebase". Invoked as /import-artifact or
  /visionary-import.
---

# /import-artifact — Claude.ai Artifact → Codebase Pipeline

Claude.ai Artifacts are the fastest way to prototype UI (Claude sketches a
self-contained React component in a sandboxed iframe), but they don't live
in your codebase. The typical hand-off is: user copies the artifact source,
pastes it into the project, manually adjusts imports, styles, and
framework conventions — losing 10 minutes each time.

This command automates the hand-off: paste the artifact source (or a URL),
and it lands correctly in your project as a Visionary-styled component.

## When to invoke

- User has a Claude.ai Artifact they want to port into this codebase
- User pasted a large chunk of artifact source and asked "make this work
  here"
- User has a link to a shared artifact (`claude.ai/chat/...`) — though
  fetching the source requires them to paste it; Claude Code can't
  authenticate to claude.ai

## Usage

```
/import-artifact
  # Interactive — Claude asks for the artifact source

/import-artifact <paste artifact source here>
  # Direct — skip the prompt
```

## Behavior

### Step 1 — Parse the artifact

Artifacts follow a predictable shape:

- Single React component default-export
- `import React from 'react'` at the top
- Tailwind classes on elements (the artifact sandbox ships Tailwind)
- `lucide-react` for icons
- `recharts` for charts (common)
- No routing, no auth, no data-fetching — self-contained

Detect the artifact format by checking for:

- `export default function` with PascalCase component
- Imports limited to the sandbox whitelist (`react`, `lucide-react`,
  `recharts`, `@/components/ui/*`)
- Tailwind in className attributes

If the source doesn't match, ask the user what they're pasting.

### Step 2 — Target project analysis

Read the project via `detect-framework.mjs` output. Answer:

- Is this Next.js App Router? Add `"use client"`.
- Is this Vue/Svelte? The artifact is React — ask the user which file to
  translate to, or decline and suggest they paste the artifact into a
  `.tsx` harness file first.
- Is Tailwind v4 or v3? Adjust class syntax accordingly (mostly compatible
  but `backdrop-blur-*` arg syntax differs).
- Is shadcn/ui installed? The artifact references `@/components/ui/*`;
  if those don't exist, either `npx shadcn add` the required primitives
  or inline them.
- Is a locked Visionary style active (`/apply`)? If yes, re-skin during
  import (see Step 4).

### Step 3 — Pick the destination

Unless the user specifies `--to <path>`, infer:

- `src/components/{ArtifactName}.tsx` for a new component
- `app/{route-segment}/page.tsx` if the component looks like a page
- `components/widgets/{ArtifactName}.tsx` if the project uses a
  `widgets/` convention

Never overwrite an existing file silently — if the target exists, ask.

### Step 4 — Transform

Apply these transforms in order:

1. **Normalize imports**: replace relative paths where needed; swap
   `lucide-react` imports to the project's icon library if different.
2. **Add framework ceremony**: `"use client"` on Next.js App Router;
   `<script setup>` on Vue; `.svelte` wrapper on Svelte (or refuse if
   non-React target).
3. **Re-skin** (if a locked style is active):
   - Replace hardcoded hex colors with `var(--visionary-color-*)`
   - Replace Inter / Roboto / Open Sans with the style's display font
   - Adjust `rounded-*` to match the style's radius vocabulary
   - Gate motion on `prefers-reduced-motion` if the artifact ships any
4. **Remove artifact-isms**: `key={Math.random()}` patterns, `console.log`
   leftovers, `// TODO` placeholders.
5. **Fix imports**: remove unused, add missing. Use `eslint --fix` if the
   project has it configured.

### Step 5 — Write + critique

- `MultiEdit` or `Write` to the target file
- Let `capture-and-critique.mjs` fire — the hook captures a screenshot and
  runs the 8-dimension critique
- Emit a summary to the user:

```
Imported Claude.ai Artifact: PricingTable
  → src/components/PricingTable.tsx
  transforms: added "use client", swapped Inter for Geist, rekeyed to
              var(--visionary-color-*), removed 3 TODO comments
  critique: 3.8 / 5 (distinctiveness 3, layout 4, motion 4, a11y 5)
  suggested fixes: [see top_3_fixes]
```

### Step 6 — Optional re-scoping

If the user says "actually this should be a page, not a component" after
the import, rerun with `--as page` to move it into `app/{route}/page.tsx`
and wrap the default export as `export default function Page()`.

## Flags

- `--to <path>` — override destination
- `--as {component|page|layout|widget}` — specify the role
- `--no-reskin` — import the artifact as-is without applying the locked
  style (useful when the artifact already got the aesthetic right)
- `--no-critique` — skip the critique loop (useful for bulk imports)

## Rules

- Never commit. User controls VCS.
- Never silently overwrite. Ask on destination conflict.
- Never run `npm install` without explicit permission. If the artifact
  references a missing package, list what's needed.
- Respect the locked style — an artifact that brings purple gradients INTO
  a `swiss-rationalism`-locked project gets re-skinned, not imported
  verbatim. If the user wants verbatim, use `--no-reskin`.
- If the artifact depends on `recharts` / `lucide-react` and the project
  doesn't have them, surface that and propose the install commands. Never
  auto-install.

## Integration

- `/apply` — if a style is locked, `/import-artifact` respects it
- `/designer` — designer-pack rules constrain the re-skin
- `/annotate` — after import, user can annotate the rendered artifact to
  polish it
- `/variants` — less useful post-import (the user already picked an
  aesthetic by building the artifact); skip

## Edge cases

- **Artifact uses Claude.ai-specific globals**: strip them. They were
  sandbox-only.
- **Artifact uses data-fetching** (fetch, SWR): the artifact was probably
  using mock data; surface "this looks like it expects real data at
  `...`, what's the real endpoint?"
- **Artifact is 1000+ lines**: split into multiple files. Put the main
  component in `src/components/{Name}.tsx` and extract sub-components to
  `src/components/{Name}/`.
- **Multi-artifact imports**: accept an array of artifact sources,
  process each.
