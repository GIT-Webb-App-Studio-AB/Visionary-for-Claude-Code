# Taste Inheritance

Sprint 15 promotes designer packs from prompt-bias to embedded sub-critics.

## Before

`/designer rams` injected a few "less-but-better" directives into the generation prompt. Once the component was rendered, Dieter's voice was gone — the critic-craft + critic-aesthetic merge proceeded without his perspective.

## After

When a pack contains a `critic_persona` block (Sprint 15), it gets a row in the arbitration table:

| Dim | Craft | Aesthetic | Rams (0.25) | Merged |
|---|---|---|---|---|
| hierarchy | 7 | 8 | 9 | 7.7 |
| distinctiveness | 8 | 9 | 5 | 7.6 (conflict) |

Rams's row contributes weighted by `arbitration.weight_in_table` (default 0.25 — designer doesn't dominate craft + aesthetic).

## Conflict resolution

When max-min spread > 2.5, three strategies fire in order:

1. **Strategy A — Designer tie-breaker.** If craft and aesthetic agree (spread <= 1.0), the designer's row breaks the tie.
2. **Strategy B — MLLM judge** (Sprint 12). Multimodal pass when A is insufficient.
3. **Strategy C — User escalation.** If A and B fail, the merge surfaces "unresolvable conflict" and asks the user.

## Veto

Each pack declares `arbitration.can_veto`. v1 default: `false`. If `true` AND a veto-condition pattern is detected: regen forced. v1 ships all 5 packs with `can_veto: false`; community can opt in via PR.

## Five packs updated for Sprint 15

- `dieter-rams` — strict hierarchy, high contrast, subtle distinction
- `emil-kowalski` — bold typographic gestures, narrative arc, expressive motion
- `massimo-vignelli` — grid-anchored typography, modular scale
- `paula-scher` — heroic display type, unmistakable identity
- `april-greiman` — computational layering, asymmetric composition

## Packs without `critic_persona`

Older packs continue to work as prompt-bias-only. The arbitration table simply skips the designer row; merge proceeds with craft + aesthetic only.
