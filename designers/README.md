# Designer Packs — Named Taste Profiles

Opt-in taste profiles that blend Visionary's algorithmic style selection
with a specific designer's documented sensibility. Invoked via
`/designer <name>` (see `commands/designer.md`) or by writing a
`design-system/designer.json` file in your project root.

Each pack is a JSON descriptor — NOT a style. It biases the 8-step algorithm's
weighting so the selected style pool skews toward the designer's known
vocabulary. A Rams pack pushes toward `dieter-rams`, `swiss-rationalism`,
`white-futurism`; a Kowalski pack pushes toward motion-heavy modern styles.

## Two formats side-by-side

Since Sprint 07, every pack ships in **two** formats:

| File | Consumer |
|------|----------|
| `<handle>.json` | `/designer <name>` (legacy) — biases the Stage 1 style pool |
| `<handle>.taste` | `/visionary-taste import <handle>` — merges into the flywheel |

The `.json` version drives the original `/designer` override path (one-off
style bias). The `.taste` version is the *shareable* platform format — it
can be `inherits_from`ed by user-authored `.taste` files and imported into
any project's flywheel. See `docs/taste-dotfile-spec.md` for the schema.

Regenerate the `.taste` files after editing JSON:

```bash
node scripts/migrate-designers-to-taste.mjs
```

## Using a pack as a base for your own taste

A designer pack is the intended *starting point* for a team or personal
`.taste` file:

```toml
# our-team.taste
schema_version = "1.0.0"
handle         = "our-team-2026-04"
inherits_from  = ["dieter-rams"]     # pulls in all of Rams's prefs + rules

[preferences]
prefer_styles = [
  { id = "our-custom-style", confidence = 0.8 },   # team-specific override
]
```

Import resolves `inherits_from` left-to-right with cycle detection. The
child's preferences layer on top; constitutions are concatenated with a
header identifying each source.

## Available packs

### Print / UI (Sprint 15) — `category: print`

JSON-format packs scored against the 10 critique dims defined in
`skills/visionary/schemas/critique-output.schema.json`. See `_schema.md`.

| Pack | File | Defining work |
|---|---|---|
| Dieter Rams | `dieter-rams.json` | Braun industrial design 1960s–80s; *Less but Better* |
| Emil Kowalski | `emil-kowalski.json` | Motion-UI tutorials, Linear-era motion vocabulary |
| Massimo Vignelli | `massimo-vignelli.json` | Unimark International, NY Subway, American Airlines |
| Paula Scher | `paula-scher.json` | Pentagram, CBS Records, Public Theater posters |
| April Greiman | `april-greiman.json` | Hybrid Imagery, *Design Quarterly 133*, New Wave Swiss |

### Cinematic / film-directors (Sprint 20) — `category: filmmaker`

YAML-frontmatter packs with three extra fields (`cinema_palette`,
`motion_signature`, `composition`) on top of the Sprint-15 schema. See
`_director-schema.md` for the schema extension. Activated via
`/designer <id>` or the dedicated `/visionary-cinematic <id>` wrapper
(adds the opt-in `--cinematic-grade` LUT pass).

| Pack | File | Defining work |
|---|---|---|
| Wong Kar-wai | `wong-kar-wai.md` | *In the Mood for Love*, *Chungking Express*, *2046* |
| Denis Villeneuve | `villeneuve.md` | *Arrival*, *Blade Runner 2049*, *Dune* |
| Wes Anderson | `wes-anderson.md` | *Grand Budapest Hotel*, *Moonrise Kingdom*, *Asteroid City* |
| Christopher Nolan | `nolan.md` | *Inception*, *Interstellar*, *Tenet*, *Oppenheimer* |
| Stanley Kubrick | `kubrick.md` | *2001*, *The Shining*, *Barry Lyndon*, *A Clockwork Orange* |
| David Lynch | `lynch.md` | *Mulholland Drive*, *Twin Peaks*, *Blue Velvet* |
| Andrei Tarkovsky | `tarkovsky.md` | *Stalker*, *Solaris*, *Mirror*, *Andrei Rublev* |
| Claire Denis | `denis.md` | *Beau Travail*, *Trouble Every Day*, *High Life* |
| Bong Joon-ho | `bong.md` | *Parasite*, *Memories of Murder*, *The Host* |
| Alan Parker | `parker.md` | *Fame*, *Pink Floyd – The Wall*, *Bugsy Malone* |
| Alex Garland | `garland.md` | *Ex Machina*, *Annihilation*, *Devs*, *Civil War* |
| Sofia Coppola | `coppola.md` | *Lost in Translation*, *The Virgin Suicides*, *Marie Antoinette* |

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
