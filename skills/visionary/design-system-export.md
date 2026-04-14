# Design System Export

Persists a generated design system to disk so it can be reloaded in future sessions without re-running the style selection algorithm.

---

## 1. Trigger Conditions

### Explicit triggers
The export runs when the user says any of:
- "save design system", "persist design system", "export design system"
- "save my styles", "keep this design system"
- The `--save-system` flag on any visionary command

### Suggested trigger
After generating **3 or more components** in a single session, suggest the export:
```
You've generated 3 components with swiss-rationalism styling.
Save this design system for future sessions? (say "save design system" to export)
```

### Never automatic
The export **never runs without user consent**. Even after the suggestion, wait for explicit confirmation before writing files. The user's project structure is their domain.

---

## 2. Output Structure

The export creates a `design-system/` directory in the project root:

```
design-system/
+-- MASTER.md
+-- pages/
    +-- [page-name].md
```

- `MASTER.md` is the single source of truth for the project's design tokens.
- `pages/` contains optional per-page overrides that inherit from MASTER.md and only list fields that differ.
- If no page overrides exist, the `pages/` directory is not created.

---

## 3. MASTER.md Template

```markdown
# Design System — [project-name]

Generated: [YYYY-MM-DD]
Style: [style_id]
Visionary version: [version]

---

## Colors

| Token             | Value     | Contrast vs Background |
|-------------------|-----------|------------------------|
| Background        | [value]   | --                     |
| Primary action    | [value]   | [ratio]:1              |
| Accent            | [value]   | [ratio]:1              |
| Text              | [value]   | [ratio]:1              |
| Muted             | [value]   | [ratio]:1              |

All contrast ratios measured against Background. Text must meet WCAG 2.2 AA (4.5:1 normal, 3:1 large/UI).

## Typography

| Role      | Font              | Weight | Size  |
|-----------|-------------------|--------|-------|
| Display   | [display-font]    | [wght] | [rem] |
| Body      | [body-font]       | [wght] | [rem] |
| Monospace | [mono-font]       | [wght] | [rem] |

Google Fonts URL: `[full-url-with-subset]`

## Motion

- Tier: [Static | Subtle | Expressive | Kinetic]
- Spring tokens used: [comma-separated list, e.g. micro, snappy, ui]
- Reduced motion strategy: [description — e.g. "opacity transitions only, all transforms removed"]

## Spacing

- Base grid: [value, e.g. 8px]
- Border-radius vocabulary: [e.g. "0px (none), 4px (subtle), 8px (card), 16px (pill)"]
- Density: [sparse | balanced | dense]

## Anti-Patterns

Do not use the following in this project:
- [pattern 1 — e.g. "glassmorphism with dark backgrounds"]
- [pattern 2 — e.g. "gradient CTAs"]
- [pattern n]

## Taste

### Rejected
- [rejected-style-or-pattern]: [reason] ([date])

### Approved
- [approved-direction-or-style]: [reason] ([date])
```

### Field requirements

- **Project name**: Taken from `package.json` name, directory name, or user prompt.
- **Generation date**: The date of export, not the date the first component was generated.
- **style_id**: The exact `style_id` from the `StyleBrief` (e.g. `swiss-rationalism`, `newspaper-broadsheet`).
- **Visionary version**: The version string from the Visionary skill manifest. Used for compatibility checks on reload.
- **Contrast ratios**: Computed at export time, not placeholders. Every ratio must pass WCAG 2.2 AA minimums.
- **Google Fonts URL**: Must include the correct `subset` parameter (e.g. `latin,latin-ext` for Nordic languages). Never strip the subset.
- **Spring tokens**: List only the tokens actually used in the session, not the full set.
- **Taste sections**: Copied from `system.md` if it exists. See Section 6.

---

## 4. Page Override Template

Page overrides inherit every field from MASTER.md and only declare fields that differ. Each override must include a reason explaining why the page diverges.

```markdown
# Page Override — [page-name]

Inherits: MASTER.md

---

## Overrides

### Density
- Value: dense
- Reason: Dashboard page displays 12+ KPIs and tabular data; balanced density wastes vertical space.

### Motion
- Tier: Static
- Reason: Financial data tables update in real-time; animation near live numbers creates distrust.

### Spacing
- Border-radius vocabulary: 0px (none), 2px (subtle), 4px (card)
- Reason: Dense data tables require tighter radius to avoid wasted whitespace in cells.
```

### Concrete example: Dashboard override

For a project using `swiss-rationalism` (balanced density, Subtle motion) that includes a data-heavy dashboard page:

```markdown
# Page Override — dashboard

Inherits: MASTER.md

---

## Overrides

### Density
- Value: dense
- Reason: Dashboard displays invoice totals, cash flow chart, and 3 data tables simultaneously. Balanced density forces scrolling past the first table.

### Motion
- Tier: Static
- Reason: Real-time account balance and transaction feed visible. Any animation adjacent to financial numbers signals instability.

### Spacing
- Border-radius vocabulary: 0px (none), 2px (subtle), 4px (card)
- Reason: Table cells and KPI cards benefit from sharper edges at dense spacing to maximize data area.
```

### Rules for page overrides

- Only create a page override when a page genuinely needs different tokens. Do not create empty overrides.
- The override file name matches the page route: `dashboard.md`, `settings.md`, `invoices.md`.
- Fields not listed in the override inherit from MASTER.md without modification.
- If a page override contradicts a MASTER.md anti-pattern, the anti-pattern still applies unless the override explicitly acknowledges and overrides it with a reason.

---

## 5. Hierarchical Retrieval Logic

When Visionary activates (Stage 1 of SKILL.md), the design system is resolved through this decision tree:

```
1. Does design-system/MASTER.md exist in the project root?
   +-- NO  --> Run the full 8-step style selection algorithm (Steps 1-7 in context-inference.md)
   +-- YES --> Load MASTER.md
               Skip Steps 1-3 (category filter, motion filter, component filter, blocked default removal)
               Use MASTER.md values as the pre-decided StyleBrief
               Still run Step 4.5 (taste profile adjustment from system.md)
               Still run Step 6 (variety penalty — cross-session only, for additional components)
               Proceed to Stage 2 (Design Reasoning Brief) with loaded values

2. Does design-system/pages/[current-page].md exist?
   +-- NO  --> Use MASTER.md values as-is for this page
   +-- YES --> Load page override
               Merge: page override fields win over MASTER.md fields
               Non-overridden fields inherit from MASTER.md unchanged

3. Does the user provide explicit instructions in the current prompt?
   +-- YES --> User instruction overrides both MASTER.md and page overrides
               Example: "use expressive motion on the dashboard" overrides the Static tier
               from the dashboard page override
   +-- NO  --> Use the merged result from steps 1+2
```

### Priority order (highest wins)

1. **User instruction** in the current prompt
2. **Page override** (`design-system/pages/[page].md`)
3. **MASTER.md** (`design-system/MASTER.md`)
4. **Full algorithm** (when no MASTER.md exists)

### What "skip Steps 1-3" means concretely

When MASTER.md is loaded, the following are already decided and do not need to be re-computed:
- **Step 1** (Category filter): The `style_id` is known. No need to map product type to categories.
- **Step 2** (Motion tier filter): The motion tier is declared in MASTER.md.
- **Step 2.5** (Component compatibility): The style was already validated when first exported.
- **Step 3** (Blocked default removal): The style was approved by the user when they exported it. Even blocked defaults are allowed if the user chose them.

Steps that still run:
- **Step 4.5** (Taste adjustment): `system.md` may have new rejections since the export. These must be checked. If the MASTER.md style was rejected after export, warn the user rather than silently overriding.
- **Step 6** (Variety penalty): Only the cross-session component applies. Within a session, the exported style is the intended style and should not be penalized for reuse.

---

## 6. Taste Memory Integration

### On export

When writing MASTER.md, read `system.md` (project root or `.visionary-cache/`) and copy the taste sections:

1. Read `### Rejected styles`, `### Rejected typography`, `### Rejected colors`, `### Rejected motion` from `system.md`
2. Collapse them into the MASTER.md `## Taste > ### Rejected` section
3. Read `### Positive signals`, `### Design DNA (confirmed)` from `system.md`
4. Collapse them into the MASTER.md `## Taste > ### Approved` section
5. If `system.md` does not exist, leave the Taste sections empty (do not omit them)

### On load

When MASTER.md is loaded at the start of a session, merge taste data:

```
MASTER.md taste  +  system.md taste  -->  merged taste profile

Conflict resolution:
  - system.md wins on conflicts (it reflects more recent user feedback)
  - MASTER.md entries are preserved if they don't conflict
  - "More recent" = the entry with the later date wins

Example:
  MASTER.md: Approved: glassmorphism (2026-03-10)
  system.md: Rejected: glassmorphism with dark backgrounds (2026-04-02)
  Result:    glassmorphism is rejected (system.md is more recent)
```

### When no system.md exists

If a project has MASTER.md but no `system.md`:
- Use the MASTER.md taste sections as the starting taste profile for the session
- If the user rejects a pattern during the session, `update-taste.sh` creates `system.md` as normal
- The next export will re-merge both sources

---

## 7. Version Compatibility

The MASTER.md includes a `Visionary version` field to track which version of the skill generated the design system.

### Resolution rules

| Condition | Action |
|-----------|--------|
| Version in MASTER.md matches current Visionary version | Proceed normally. Full compatibility. |
| Version in MASTER.md is older than current version | Warn: "This design system was exported with Visionary [old]. Current version is [new]. Token names or style definitions may have changed. Consider re-exporting with `--save-system`." Proceed with best-effort loading. |
| Version field is missing from MASTER.md | Treat as compatible. This covers hand-edited or early-version files. |
| Version in MASTER.md is newer than current version | Warn: "This design system was exported with a newer Visionary version. Some tokens may not be recognized." Proceed with best-effort loading, ignoring unrecognized fields. |

### What "best-effort loading" means

- Load all recognized fields from MASTER.md
- Ignore fields that don't match the current schema (do not error)
- Log unrecognized fields to the Design Reasoning Brief so the user can see what was skipped
- Never silently drop recognized fields

---

## 8. Export Command Integration

### Workflow

When the user requests an export:

```
1. READ current session state
   - Collect the active StyleBrief (style_id, colors, typography, motion, spacing)
   - Collect all anti-patterns flagged during the session
   - Collect taste data from system.md (if it exists)

2. CONFIRM with user
   - Show a summary: "Exporting swiss-rationalism with 5 color tokens, DM Sans + DM Serif Display, Subtle motion"
   - Wait for confirmation (or let the user adjust before writing)

3. CREATE directory
   - mkdir design-system/ in the project root
   - mkdir design-system/pages/ only if page overrides are being exported

4. WRITE MASTER.md
   - Fill the template from Section 3 with actual session values
   - Compute contrast ratios at write time
   - Include the full Google Fonts URL with correct subset
   - Copy taste sections from system.md

5. WRITE page overrides (if any)
   - Only for pages where the user explicitly requested different tokens
   - Each override file lists only the differing fields with reasons

6. CONFIRM completion
   - "Design system exported to design-system/MASTER.md"
   - "Next session: Visionary will load this automatically and skip style selection."
   - If page overrides were written: "Page overrides: dashboard.md, settings.md"
```

### Integration with existing commands

- `/visionary --save-system`: Triggers export after the current generation completes.
- The export reads from the live session state, not from previously written component files. This ensures the MASTER.md reflects the exact tokens used, including any modifications from the critique loop.
- If the user runs `--save-system` before any component is generated, warn: "No design system to export yet. Generate at least one component first."
