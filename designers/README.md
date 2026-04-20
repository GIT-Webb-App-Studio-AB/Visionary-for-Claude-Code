# Designer Packs — Named Taste Profiles

Opt-in taste profiles that blend Visionary's algorithmic style selection
with a specific designer's documented sensibility. Invoked via
`/designer <name>` (see `commands/designer.md`) or by writing a
`design-system/designer.json` file in your project root.

Each pack is a JSON descriptor — NOT a style. It biases the 8-step algorithm's
weighting so the selected style pool skews toward the designer's known
vocabulary. A Rams pack pushes toward `dieter-rams`, `swiss-rationalism`,
`white-futurism`; a Kowalski pack pushes toward motion-heavy modern styles.

## Available packs

| Pack | File | Defining work |
|---|---|---|
| Dieter Rams | `dieter-rams.json` | Braun industrial design 1960s–80s; *Less but Better* |
| Emil Kowalski | `emil-kowalski.json` | Motion-UI tutorials, Linear-era motion vocabulary |
| Massimo Vignelli | `massimo-vignelli.json` | Unimark International, NY Subway, American Airlines |
| Paula Scher | `paula-scher.json` | Pentagram, CBS Records, Public Theater posters |
| April Greiman | `april-greiman.json` | Hybrid Imagery, *Design Quarterly 133*, New Wave Swiss |

## Pack schema

```jsonc
{
  "name": "Dieter Rams",
  "era": "1960s–1980s Braun",
  "description": "Ten principles of good design. Functional restraint. Invisible UI.",
  "biases": {
    "style_weight_multipliers": {
      "dieter-rams": 5.0,
      "swiss-rationalism": 3.0,
      "white-futurism": 2.5,
      "light-mode-sanctuary": 2.0,
      "bauhaus-dessau": 1.8
    },
    "style_blocklist": [
      "neon-dystopia", "cyberpunk-neon", "synthwave",
      "post-internet-maximalism", "chaos-packaging-collage"
    ],
    "palette_tags_preferred": ["light", "editorial"],
    "motion_tier_cap": "Subtle",
    "touch_target_min": 44,
    "typography_preferred": ["Akzidenz-Grotesk", "Helvetica", "Futura"]
  },
  "rules": [
    "Prefer neutral / muted palettes (no saturated accents over 5% of surface)",
    "Radius 0–4px only — plastic-extruded look breaks the register",
    "Motion: opacity + 2px translate maximum; never bounce"
  ]
}
```

## Usage

```bash
# One-off: apply a designer pack to the current generation only
/designer dieter-rams

# Persist for the project
/designer dieter-rams --persist

# Blend two designers (experimental)
/designer "70% rams, 30% kowalski-motion"

# List available packs
/designer --list

# Remove the persistent pack
/designer --unset
```

Under the hood, `/designer` writes (or removes) `design-system/designer.json`
in the project root. The SKILL reads that file in Stage 1 (Context Inference)
and applies the weights to the style pool BEFORE the weighted-random pick.

## Contributing

New packs welcome. Each pack needs:

- A non-trivial body of published work (books, monographs, significant
  professional reel)
- At least 5 `style_weight_multipliers` entries mapped to real Visionary styles
- A `style_blocklist` (what the designer explicitly rejected)
- 3+ prose `rules` capturing the designer's voice

Avoid packs for living designers without permission. Historic + well-
documented designers are the safest contributions.
