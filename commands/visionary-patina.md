---
name: visionary-patina
description: >
  Inspect, freeze and unfreeze patina-mode — the runtime mechanism that lets
  generated UI age with the codebase. Drift rates are derived from
  `git blame --first-parent` of the source file, applied per token (chroma,
  radius, motion duration, edge sharpness), and clamped against APCA Lc 60.
  Sub-commands: status, freeze, unfreeze. Invoked as /visionary-patina or
  /patina.
---

# /visionary-patina — Patina-mode CLI

Patina-mode is one of three Sprint 23 runtime-context mechanisms (alongside
F1 circadian palette-shift and F4 network-aware visual budget). Where
circadian responds to time-of-day and network-aware responds to bandwidth,
patina responds to **age** — the file's first-commit-date as reported by
`git blame --first-parent`.

A component built today renders crisp. The same component, twelve months
later, has slightly lower chroma, slightly larger corner radius, slightly
slower motion, slightly softer edges. Designs *age* the way physical
objects age — predictably, gracefully, with measurable drift-rates. The
intent is "lived-in, not abandoned"; it's an anti-convergence move that
makes a long-running codebase visually distinguishable from a
freshly-generated one.

This command is the human interface to that mechanism. Use it to inspect
applied drifts, freeze a file's patina at a specific age (for stable
releases), or release the freeze.

## Usage

```
/visionary-patina <sub-command> [args]
```

Sub-commands:

| Sub-command | Purpose |
|---|---|
| `status [file]` | Show current age + estimated drifts for one file or all tracked files |
| `freeze [age-months]` | Lock patina at a specific age (defaults to current age) |
| `unfreeze` | Release the freeze and return to live, age-driven patina |

## Sub-commands

### `status [file]`

Shows the file's age (in months, derived from `git blame --first-parent`),
the drifts that *would* be applied at that age, and any active floor-
clamps (APCA Lc 60, chroma min 0.05).

```
/visionary-patina status
/visionary-patina status src/components/Hero.tsx
```

Output shape:

```
src/components/Hero.tsx
  age:         3.4 months
  drifts:
    chroma           -0.068  (capped to chroma_min 0.05? no)
    radius           +1.7px
    motion_duration  +17ms
    edge_sharpness   -0.034
  floors_hit:        none
  frozen:            false
  source:            git blame --first-parent (commit 8a3f1c2, 2026-01-21)
```

Without `[file]`, lists every file with patina applied (sorted by age,
descending). Trace event `patina_status_inspected` is emitted with
`{files_count, max_age_months, frozen_count}`.

### `freeze [age-months]`

Locks patina at a specific age. Useful for stable releases where you want
the design to **stop aging** at a known good state — e.g. shipping v2.0
with the look it had when v2.0 was tagged, even though the codebase keeps
evolving.

```
/visionary-patina freeze              # freeze at current age
/visionary-patina freeze 6            # freeze at 6 months (regardless of actual age)
/visionary-patina freeze 0            # reset to "freshly generated" look
```

Writes a `frozen_age_months: <n>` entry into `tokens/runtime/patina.json`
under a per-file key. Subsequent generations read the frozen value
instead of recomputing from git. The freeze persists across sessions and
git operations (it's a config entry, not a git artifact).

Trace event `patina_frozen` with `{file, frozen_age_months, prior_age_months}`.

### `unfreeze`

Removes the freeze and returns to live, age-driven patina. The next
generation reads age from `git blame` again.

```
/visionary-patina unfreeze
/visionary-patina unfreeze src/components/Hero.tsx
```

Without a file argument, unfreezes all currently-frozen files (with
confirmation prompt). Trace event `patina_unfrozen` with `{file,
prior_frozen_age_months}`.

## Composition with other runtime mechanisms

Patina is the lowest-precedence mechanism in the runtime-context
coordinator. The full chain is:

```
system pref (prefers-reduced-motion / prefers-color-scheme)
  > network-budget (bandwidth urgency)
  > circadian (time-of-day)
  > patina (age)
```

If circadian is mid-shift and patina would also drift the same token,
**circadian wins** for the duration of the phase, then patina re-applies
on top of the new base. The combined-drift-cap (`<15%` from base in any
dimension) holds across all three mechanisms — patina is clamped first
when the cap is hit, since it's the slowest-accumulating signal.

`prefers-reduced-motion` ALWAYS wins over patina's motion-duration drift.
A 12-month-old component with `+60ms` patina drift on its motion still
collapses to motion-tier 0 if the user has reduced-motion enabled.

## Privacy + ethics

- **Zero-permission**: patina reads `git blame` at build-time only. No
  runtime telemetry, no server roundtrip, no fingerprint surface.
- **Opt-in**: patina is OFF by default. Activate per stil via
  `tokens/runtime/patina.json`'s `enabled: true` flag, or globally via
  `--patina` on `/visionary`.
- **APCA-floor is hard**: drift that would break Lc 60 is clamped at the
  token-pipeline level. There is no path to "patina makes this
  unreadable" — the floor is enforced before render.
- **Freeze for production**: stable releases SHOULD freeze patina at a
  known-good age. Live patina on a marketing site means the site's look
  shifts under the user's feet over months, which can confuse returning
  visitors. Freeze is the production-safety mechanism.

## Reference implementation

- Drift engine: [`hooks/scripts/lib/runtime/patina.mjs`](../hooks/scripts/lib/runtime/patina.mjs)
- Config: [`tokens/runtime/patina.json`](../tokens/runtime/patina.json)
- Coordinator: [`hooks/scripts/lib/runtime/coordinator.mjs`](../hooks/scripts/lib/runtime/coordinator.mjs)
- Doc: [`docs/patina-mode.md`](../docs/patina-mode.md)
- Master doc: [`docs/runtime-context.md`](../docs/runtime-context.md)

## Acceptance criteria (Sprint 23 Task 42.3)

- `status` reports age within ±0.1 months of `git blame --first-parent` truth
- `freeze` persists across sessions (writes to `patina.json`, not memory)
- `unfreeze` restores live age-driven drift exactly
- APCA Lc 60 floor holds for every drift output (verified across 1000 random
  fixtures, 0 violations)
- Trace events emitted for all three sub-commands

## Related

- `/visionary` — main generation. Reads patina state when `--patina` is set.
- [`docs/patina-mode.md`](../docs/patina-mode.md) — design rationale + drift-rate table
- [`docs/runtime-context.md`](../docs/runtime-context.md) — how the three mechanisms compose
- [`docs/circadian-design.md`](../docs/circadian-design.md) — F1 (companion mechanism)
- [`docs/network-aware.md`](../docs/network-aware.md) — F4 (companion mechanism)
