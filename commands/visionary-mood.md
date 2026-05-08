---
name: visionary-mood
description: >
  Set a mood for the next /visionary generation using Russell's circumplex
  (valence × arousal). Maps "calm and serious" or "happy-anxious" — or raw
  numeric coords — into a quadrant of the 202-style catalog and biases the
  candidate pool accordingly. Designed for users who don't want to learn 202
  style names but do know how the result should *feel*. Invoked as
  /visionary-mood or /mood.
---

# /visionary-mood — Mood-Driven Style Selection

Most users don't know whether they want `swiss-rationalism` or `dieter-rams` —
but they do know they want something that feels *calm and serious* (vs.
*excited and bright*). This command exposes a 2D control plane on top of the
catalog: pick a point on Russell's circumplex (valence × arousal) and
`/visionary` runs Stage 2 inference biased toward styles that live in the
matching quadrant.

## Usage

Two input shapes:

```
/visionary-mood 0.8,0.2          # numeric coords:  valence,arousal in [0, 1]
/visionary-mood happy-anxious    # text label looked up in the mood table
```

Examples:

| Invocation                          | Resolves to                  | Quadrant      |
| ----------------------------------- | ---------------------------- | ------------- |
| `/visionary-mood 0.8,0.2`           | calm-positive                | Q4 (soft/glass) |
| `/visionary-mood 0.85,0.85`         | excited / vibrant            | Q1 (vibrant)    |
| `/visionary-mood 0.15,0.15`         | calm-serious                 | Q3 (swiss/calm) |
| `/visionary-mood 0.2,0.8`           | aggressive / glitchy         | Q2 (brutalist)  |
| `/visionary-mood happy-anxious`     | (0.70, 0.85) high-V / high-A | Q1              |
| `/visionary-mood calm-melancholic`  | (0.30, 0.20) low-V / low-A   | Q3              |
| `/visionary-mood angry`             | (0.20, 0.85) low-V / high-A  | Q2              |
| `/visionary-mood serene`            | (0.70, 0.15) high-V / low-A  | Q4              |

## Russell's circumplex in one paragraph

Affect researchers (Russell 1980) showed that most felt emotions decompose
neatly onto two orthogonal axes: **valence** (negative ↔ positive) and
**arousal** (low energy ↔ high energy). That makes mood a 2D plane — and
2D planes map cleanly to UI vocabulary:

- **valence** → palette saturation (low V = muted greys, high V = vibrant chroma)
- **arousal** → motion intensity (low A = static, high A = kinetic)

Each quadrant then anchors a coherent slice of the 202-style catalog:

```
                    arousal = high
                          │
           Q2: low-V/high-A│Q1: high-V/high-A
           brutalist /     │ vibrant maximalist
           glitch / raw    │ memphis, vaporwave,
           brutalist-web,  │ post-internet-maximalism,
           glitchcore,     │ y2k-futurism, latin-fiesta,
           neubrutalism,   │ witchcore-ui, frutiger-aero,
           cyberpunk-neon  │ dopamine-design
   valence = ──────────────┼────────────── valence = high
   low                     │
           Q3: low-V/low-A │Q4: high-V/low-A
           swiss / mono /  │ soft / glass / dreamy
           calm-serious    │ liquid-glass, dreamcore,
           swiss-           │ cottagecore-tech,
           rationalism,    │ glassmorphism, neumorphism,
           liminal-space,  │ frutiger-aero,
           terminal-cli,   │ light-mode-sanctuary
           monochrome,     │
           zen-void        │
                          │
                    arousal = low
```

## Text-mood vocabulary

The text-input form recognises 16 primary mood phrases plus 4 axis-aliases.
Each phrase maps to fixed (valence, arousal) coords; the quadrant follows
mechanically.

| Phrase                | (valence, arousal) | Quadrant |
| --------------------- | ------------------ | -------- |
| `happy`               | (0.85, 0.60)       | Q1       |
| `happy-anxious`       | (0.70, 0.85)       | Q1       |
| `excited`             | (0.80, 0.85)       | Q1       |
| `energetic`           | (0.60, 0.90)       | Q1       |
| `calm`                | (0.65, 0.20)       | Q4       |
| `calm-positive`       | (0.70, 0.25)       | Q4       |
| `serene`              | (0.70, 0.15)       | Q4       |
| `peaceful`            | (0.70, 0.18)       | Q4       |
| `melancholic`         | (0.30, 0.30)       | Q3       |
| `calm-melancholic`    | (0.30, 0.20)       | Q3       |
| `sad`                 | (0.20, 0.35)       | Q3       |
| `depressed`           | (0.15, 0.20)       | Q3       |
| `angry`               | (0.20, 0.85)       | Q2       |
| `tense`               | (0.30, 0.80)       | Q2       |
| `aggressive`          | (0.25, 0.90)       | Q2       |
| `anxious`             | (0.35, 0.80)       | Q2       |
| `positive` (alias)    | (0.80, 0.50)       | Q1       |
| `negative` (alias)    | (0.20, 0.50)       | Q3       |
| `high-energy` (alias) | (0.50, 0.90)       | Q2       |
| `low-energy` (alias)  | (0.50, 0.15)       | Q4       |

(Phrases not in this table return an explicit error rather than a silent
fallback — typos surface fast.)

## Behaviour

When `/visionary-mood` is active for the next generation, Stage 1 (Context
Inference) and Stage 2 (Style Selection) run with a biased candidate pool:

1. The mood is resolved via `mapMood(input)` in
   `hooks/scripts/lib/mood-mapper.mjs` → `{ quadrant, primary_styles,
   secondary_styles, motion_tier, saturation_hint }`.
2. Stage 2 weights `primary_styles` heavily (≈4× boost) and `secondary_styles`
   moderately (≈2× boost). All other catalog styles remain in the pool but
   start cold.
3. The `motion_tier` and `saturation_hint` flow into the DesignReasoningBrief
   as suggestions — not hard-overrides — so the resolver can still adjust
   them for accessibility or product-archetype fit.

Centrist inputs (close to (0.5, 0.5)) deliberately blur quadrant boundaries
and pull in styles from neighbouring quadrants — useful when the user wants
"a bit of warmth, a bit of energy" without committing to a single corner.

## Integration with `/visionary --blend`

`/visionary-mood` and `/visionary --blend` compose:

- `--blend "swiss-rationalism:0.7 + liminal-space:0.3"` is **explicit** —
  the user names exact anchors and weights. Blend wins.
- `/visionary-mood calm` is **implicit** — it biases the default candidate
  pool, then Stage 2 still picks the single best style (or runs `/variants`
  for a three-way).
- Combined: when both are set, `--blend` defines the final anchor recipe
  and `/visionary-mood` only affects which styles are *suggested* in
  Stage 2's UI hints. The blend always overrides.

A common pattern: invoke `/visionary-mood` first to lock the feeling, then
let Stage 2 surface 3 candidate styles inside that quadrant, then use
`/variants` to render all three.

## Reference implementation

- Mapper: [`hooks/scripts/lib/mood-mapper.mjs`](../hooks/scripts/lib/mood-mapper.mjs)
- Tests: [`hooks/scripts/lib/__tests__/mood-mapper.test.mjs`](../hooks/scripts/lib/__tests__/mood-mapper.test.mjs)
- Pipeline integration: Stage 2.5 (latent style mixing) consumes the
  `primary_styles` list as anchors when no explicit `--blend` is provided.
  See `skills/visionary/SKILL.md` for the full pipeline diagram.

## Acceptance criteria (Sprint 17 Task 33.5)

- 16 mood combinations produce logically grouped style picks (verified in
  `mood-mapper.test.mjs`).
- All text-mood phrases map to valid coords in [0, 1]² (no out-of-range
  values, no duplicates collapsing different phrases to identical points).
- Each quadrant exposes ≥ 6 distinct catalog styles to prevent the slider
  from degenerating into "the same 4 picks every time".

## Related

- `/visionary` — the main generation command. Mood is consumed by Stage 1.
- `/visionary --blend` — explicit anchor-and-weight control. Wins over mood.
- `/variants` — three-way preview. Plays well with mood (mood narrows the
  pool, variants surfaces three orthogonal picks inside it).
- `/visionary-taste` — taste flywheel. Permanent-avoid facts override mood
  picks (a banned style stays banned even if it's the quadrant's top hit).
