# Critique Principles — Evidence Over Vibes

**Status:** normative for the visual-critic subagent and the Sprint 3 Rulers
framework. Last updated 2026-04-22.

---

## Why evidence-anchored scoring

LLM critics drift. When they have permission to lower a score on
impression alone — "feels cramped", "the typography is off", "this
colour doesn't work" — the same critic will score the same screenshot
differently on a second pass. Self-confidence becomes a score. That is a
noise generator, not a quality signal.

The Rulers framework (ICML 2025, Wei et al.) demonstrates that LLM-as-judge
evaluations are reliable only when every sub-score can be traced to a
machine-verifiable citation. Remove the citation, and the judge is doing
self-report, which correlates poorly with human consensus.

Our implementation of that finding is direct:

1. The critic sees a fixed rubric (0–10 per dimension).
2. The critic scores.
3. Every score **below 7** must be justified by a mechanical citation —
   axe-core rule, CSS selector, numeric metric, or pixel coordinate.
4. Un-cited low scores are treated as unjustified and forced back to 7.

The design-system literature already knows this: "Evidence-based design" is
a principle in the HCI community because intuition alone makes designers
disagree. LLMs are worse — their intuition is an average of their training
distribution, which bakes in the default-Tailwind-dashboard aesthetic we're
trying to escape.

---

## Bad evidence vs good evidence

### Bad

> "The hero feels cramped."

Unfalsifiable. No way to validate against the DOM. A second critic might
feel the opposite.

> "The typography scale is weak."

Weak compared to what? No citation, no mechanical basis.

> "The colours don't harmonise."

An opinion that could mean a dozen different things.

> "Accessibility needs improvement."

Which rule? Which element? Unactionable.

### Good

> `.hero h1 { font-size: 24px; line-height: 24px }` — no leading on the
> largest element.

Verifiable: run the selector, inspect computed style, measure.

> Axe rule `color-contrast` fails on `button.primary`: 3.2:1 against a
> 4.5:1 requirement.

Machine-graded. axe-core returns the exact measurement.

> `contrast_entropy=0.32` against the 0.70 threshold — the composition is
> near-uniform lightness across the 32×32 sample.

Deterministic numeric scorer. The metric is reproducible from the screenshot.

> Touch target at coordinate `x=872,y=142` measures `26×26` against the
> 44×44 floor for non-dense surfaces.

Coordinate-and-size citation. Reproducible by running the selector or
re-measuring from the PNG.

---

## When a dimension may score below 7 without evidence

**Never — with one exception.** The aggregated composite `craft_measurable`
is produced by the numeric scorer, not by the critic, and may be any value
in [0, 10] (including null when the scorer was disabled). That dimension is
already mechanically grounded — the scorer output IS the citation.

Every other dimension scored below 7 must have an `evidence` object on the
corresponding entry in `top_3_fixes`. The schema enforces `evidence` as
required; the loop-control gate treats missing evidence as a parse failure
and retries the critique.

---

## The evidence taxonomy

Four types; the choice is forced by the observation you're making:

| type       | use when                                                                     |
|------------|------------------------------------------------------------------------------|
| `axe`      | An axe-core rule fired. Value = rule ID (`"color-contrast"`).                |
| `selector` | The issue is localised to a DOM element. Value = CSS selector.               |
| `metric`   | A numeric scorer flagged a sub-score below 0.7. Value = `"<key>=<value>"`.   |
| `coord`    | The issue is positional (overlap, alignment, touch target). Value = `"x=..,y=.."` or a computed-style pair. |

Prefer the most specific type available. If an axe rule fires, cite `axe`.
If the issue is structural but not axe-detectable, cite `selector`. If it's
a composition-level concern, cite the `metric` that surfaced it.

---

## Validation

Selector citations are verified by `hooks/scripts/lib/validate-evidence.mjs`.
After each critique round the hook re-runs every cited selector via
`document.querySelector` in the live DOM. Citations that match zero elements
are flagged `evidence_invalid: true` and surfaced back to the critic as a
warning in the next round:

> your previous selector `.hero h1` matched nothing — verify before citing.

Two or more invalid citations per round trigger a critique retry with an
alternate model. This is not a policy decision — it is the only way to stop
a critic from inventing structure that does not exist in the rendered page.

Axe citations are validated against the axe-core output implicitly: if the
rule ID in `evidence.value` does not appear in `axe_result.violations[]`,
the critic has fabricated a rule. A follow-up sprint will add explicit
validation here; for now the critic is trusted to paste rule IDs from the
axe JSON it was given.

Metric citations are validated against the numeric scorer output:
`<key>=<value>` must parse, and `<key>` must be a known key from
`numeric_scores`. Coord citations are validated by format, not semantics —
there is no cheap way to verify a coordinate-and-size pair short of re-
measuring the screenshot, which is out of scope.

---

## How this interacts with the rest of the framework

- **Early-exit gating** (`hooks/scripts/lib/loop-control.mjs`): requires
  `min(scores) >= 8.0`. Evidence-anchoring floors every dim at 7 when
  unjustified, so drafts that would have scored 4 across the board on
  impressionistic vibes now score 7 with no fix proposed. The early-exit
  gate still blocks (7 < 8.0), but the loop doesn't spiral on fabricated
  critique.

- **Calibration** (`scripts/calibrate.mjs`): fits a per-dimension linear
  correction against the gold-set's human consensus. Only the committed
  score survives — evidence is not weighted into the fit because evidence
  is binary (present or absent). The presence requirement makes the
  critic's output more trustable, which is what calibration needs as input.

- **Version locking** (`skills/visionary/critique-schema.md#version-locked-prompt`):
  every critique emits `prompt_hash`. A change to this document or to
  `agents/visual-critic.md` bumps the hash and invalidates the current
  calibration — a fresh fit is required.

---

## Further reading

- Sprint 03 implementation plan: `docs/sprints/sprint-03-matbar-kvalitet.md`
- Critique schema: `skills/visionary/schemas/critique-output.schema.json`
- Loop control predicates: `hooks/scripts/lib/loop-control.mjs`
- Evidence validator: `hooks/scripts/lib/validate-evidence.mjs`
- Calibration: `scripts/calibrate.mjs`, `skills/visionary/calibration.json`
