---
name: visionary-annotate
description: >
  Design Mode parity — accept browser-annotated feedback on a rendered page
  and translate it into Claude-actionable edits. Pair with Playwright's
  browser_take_screenshot + browser_evaluate to let users mark up what they
  want changed directly in the preview. Invoked as /annotate or
  /visionary-annotate.
---

# /annotate — Browser-Annotation → Code Edit

Cursor 3's Design Mode lets users click on a live DOM element and describe
what they want changed, then the agent performs the edit. This command
delivers parity for Claude Code via Playwright MCP — no Cursor dependency,
no proprietary extension.

## When to invoke

- User wants to tweak a specific element they can SEE in the preview —
  "that button is too blue", "the spacing between cards is too tight",
  "align the header to the left"
- After `/visionary` or `/variants` generated something close, but not
  quite right — annotating is faster than re-prompting
- For small UI-polish passes where the precise change is visual, not
  textual

## Behavior

### Step 1 — Enter annotation mode

Inject `skills/visionary/annotate-runtime.js` into the dev-server page via
`mcp__playwright__browser_evaluate`. The runtime:

1. Adds a floating toolbar with "Annotate" + "Done" buttons
2. On "Annotate": every element gets a hover outline + click becomes an
   annotation pin
3. User clicks an element, types a short description of the desired
   change ("make this smaller", "use the accent color", "add padding")
4. Pins accumulate in a sidebar with element selector + description

### Step 2 — Capture annotations

On "Done", read the pin list via `browser_evaluate`:

```js
() => window.__visionaryAnnotations__
```

Returns an array like:

```json
[
  { "selector": "#hero > button.cta",
    "element_html": "<button class='cta bg-blue-500 px-6 py-2 text-white rounded-md'>Get started</button>",
    "description": "too saturated — use the style's accent instead",
    "bbox": { "x": 320, "y": 180, "w": 160, "h": 44 } },
  { "selector": "#features > .card:nth-child(2)",
    "element_html": "…",
    "description": "add more breathing room above the heading",
    "bbox": { "x": 0, "y": 640, "w": 380, "h": 280 } }
]
```

### Step 3 — Resolve selectors to source

For each annotation:

1. Find the React/Vue/Svelte component that renders this element
2. Use the `data-source` attributes (React DevTools convention) or the
   framework's source-map to locate the exact file:line:column
3. Attach the description to the source location

If the target file can't be resolved automatically, ask the user:
"Which file renders the element at selector `#hero > button.cta`?"

### Step 4 — Generate edits

Claude applies each annotation as a `MultiEdit`:

1. Read the target file
2. Compose the edit based on the description
3. Respect the project's locked style (see `/apply`) — "use the accent" means
   `var(--visionary-color-accent)`, not a new color
4. Apply via `MultiEdit`, letting the `capture-and-critique.mjs` hook fire
   once at the end of the batch (debounce collapses multiple edits)

### Step 5 — Re-render and iterate

After the edits apply:

1. The hook fires → Playwright captures a new screenshot
2. The visual-critic agent runs one more round
3. User sees the updated preview
4. They can annotate again — the loop continues until they're satisfied

## Output

Each annotation produces a code edit + a short explanation. Example:

```
Annotation 1 of 2 — #hero > button.cta
  "too saturated — use the style's accent instead"
  → src/components/Hero.tsx:42
  - bg-blue-500 text-white
  + bg-[var(--visionary-color-accent)] text-[var(--visionary-color-bg)]

Annotation 2 of 2 — #features > .card:nth-child(2)
  "add more breathing room above the heading"
  → src/components/Features.tsx:18 (the h3 in the second Card)
  + `class="mt-8"` added

Applied 2 edits. Preview re-rendering…
```

## Rules

- Never re-skin the whole page based on a single annotation — respect the
  surgical nature of the request
- If an annotation contradicts the project's locked style (via `/apply`),
  surface the contradiction and ask before breaking the lock
- Multiple annotations on the same element collapse into a single edit
- If an annotation cannot be translated into a concrete code change
  (too vague, conflicting requirements), respond with a clarifying
  question instead of a bad edit

## Integration with other commands

- `/variants` — after a variant wins, annotations are a faster polish path
  than generating a new variant
- `/apply` — annotations run INSIDE the locked-style pool; they can't
  introduce off-palette colors or off-scale spacing unless the user
  explicitly says so
- `/designer` — the designer pack's rules constrain annotation resolution
  ("use the accent" → only the designer's accent, not a free choice)

## Why this beats Cursor 3 Design Mode

- Claude Code works across 15 stacks, Cursor is React-heavy
- Annotations become code, not ephemeral session state — if the user
  closes the browser, the edits persist in git
- Free and open-source; Cursor's Design Mode requires a paid Cursor license
- Works with Playwright MCP — standard Claude Code install, no extra
  extensions to set up
