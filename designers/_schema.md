# Designer pack schema (Sprint 15)

## New blocks (in addition to existing biases / rules / references)

```json
{
  "critic_persona": {
    "role": "design auditor in the spirit of <designer>",
    "scoring_priorities": [
      { "dim": "hierarchy", "weight": 1.5, "direction": "demand strict hierarchy" },
      { "dim": "distinctiveness", "weight": 0.5, "direction": "prefer subtle distinction over loud" }
    ],
    "veto_conditions": [
      "ornament without function",
      "decoration that obscures content"
    ],
    "argument_style": "concise, evidence-anchored, avoids superlatives"
  },
  "arbitration": {
    "weight_in_table": 0.25,
    "can_veto": false
  }
}
```

## Field reference

- `critic_persona.role` — short string explaining who is judging
- `critic_persona.scoring_priorities[].dim` — one of the 11 critique dims
- `critic_persona.scoring_priorities[].weight` — multiplier on this dim's contribution to the designer's per-dim score (>=0)
- `critic_persona.scoring_priorities[].direction` — short qualifier the designer applies (e.g. "prefer high APCA Lc")
- `critic_persona.veto_conditions` — strings describing what would trigger a veto (only consulted when `can_veto: true`)
- `critic_persona.argument_style` — meta-instruction for the rationale phrasing
- `arbitration.weight_in_table` — designer-row vote weight (defaults 0.25 against craft 1.0 + aesthetic 1.0)
- `arbitration.can_veto` — opt-in. Default `false`. v1: no designer has veto.

Backward compat: packs without `critic_persona` continue to work as prompt-bias-only via the existing `/designer` flow.

## Schema extensions

- **Sprint 20 — cinematic / filmmaker packs.** See [`_director-schema.md`](./_director-schema.md)
  for the additive `category: filmmaker`, `era`, `films`, `cinema_palette`,
  `motion_signature`, `composition` fields. Existing print packs (Rams, Kowalski,
  Vignelli, Scher, Greiman) need no changes — absence of `category` defaults
  to `category: print` and the runtime treats the two formats interchangeably.
  YAML-frontmatter (`.md`) packs and JSON (`.json`) packs are both valid;
  the loader resolves whichever exists for `<id>`.
