# Slop-pattern avoid/consider directives

Sprint 08 Task 22.2. Each entry maps one of the 26 slop patterns detected
by `capture-and-critique.mjs` to concrete **avoid** + **consider instead**
guidance. When `hooks/scripts/lib/slop-gate.mjs` rejects a generation for
having ≥ 2 patterns, the matching directives from this file are spliced
into the next-round prompt as a negative-prompt block.

The directives live in a markdown file so they're diffable and reviewable
— a TOML or JSON file would force stylistic choices into a lookup table
that loses nuance. The parser (`buildDirectiveBlock` in
`hooks/scripts/lib/slop-directives.mjs`) extracts the `## Pattern:` headers
and their associated **Avoid** / **Consider** blocks.

Not every pattern has a directive yet — priority is the 10+ blocker-level
patterns the detector most commonly fires on. Unmapped patterns fall back
to a generic "avoid reproducing this pattern" line.

---

## Pattern: Purple/violet gradient background

**Avoid:** `from-purple-*`, `via-purple-*`, `to-purple-*`, `from-violet-*`, any `bg-gradient-to-*` that lands on the purple/violet family. No Spotify-2018-campaign-gradient-hero.

**Consider:** flat single-colour background from the style's palette tokens; if a gradient is called for, use two adjacent hues from the same family (oxblood→brick, paper→linen) rather than a saturated cross-spectrum jump.

---

## Pattern: Cyan-on-dark color scheme

**Avoid:** `text-cyan-*`, `bg-cyan-*`, `#06B6D4`, sci-fi-HUD cyan glow on `bg-gray-900`. This is the single most recognisable AI-default signature.

**Consider:** warm paper neutrals against a dark ink (`#1A1614` + `#F4EFE6`); if a cool accent is required, lean teal (`#0F766E`) or desaturated cerulean with APCA Lc > 60.

---

## Pattern: Left-border accent card

**Avoid:** `border-l-4` on feature cards, `border-left: 4px solid` with a saturated accent. Reads as Bootstrap-2014 alert component.

**Consider:** top-rule hairline with typographic indent; or remove the border entirely and rely on vertical rhythm + type weight to separate cards.

---

## Pattern: Dark background with colored glow shadow

**Avoid:** `bg-gray-900` / `bg-slate-900` + `shadow-cyan-500/50` or `shadow-purple-500/50`. The "it's dark AND it glows" stack is textbook 2024 SaaS.

**Consider:** hard-offset shadow (`4px 4px 0 #000`) for a brutalist feel, or no shadow at all with elevation through typographic scale and whitespace.

---

## Pattern: Gradient text on heading or metric

**Avoid:** `bg-clip-text text-transparent bg-gradient-to-r from-* to-*`. The shiny-number-hero is Stripe-2022-copy.

**Consider:** solid colour heading with a distinctive typeface choice doing the heavy lifting; or an oversized lowercase numeral in a display serif.

---

## Pattern: Hero Metric Layout (large number + small label + gradient)

**Avoid:** `text-6xl` number, `text-sm text-gray-500` label underneath, gradient backdrop. Fintech-2021-landing-page.

**Consider:** inline the number into running prose; or use a hand-drawn/serif number with asymmetric alignment.

---

## Pattern: Repeated 3-across card grid

**Avoid:** `grid grid-cols-3` with identical card components. The icon + title + paragraph × 3 layout is the most generic feature-section imaginable.

**Consider:** asymmetric composition — one large feature card + two smaller; staggered grid; or a scrollable horizontal strip with varied card widths.

---

## Pattern: Inter as sole typeface

**Avoid:** Inter (or `-apple-system, Inter, sans-serif`) as BOTH display and body. Inter + Inter is the font stack of every SaaS landing page since 2020.

**Consider:** Bricolage Grotesque + Instrument Sans; Editorial New + Switzer; Gentium Book + DM Sans; any distinctive display face with a workhorse body. Minimum: ONE face that isn't Inter.

---

## Pattern: Generic system/web font as sole typeface

**Avoid:** Roboto + Roboto, Arial + Arial, Open Sans + Open Sans as a full stack. These are the fonts that ship with the OS — not a design choice.

**Consider:** pair one of the distinctive families from `skills/visionary/styles/typography/` with a body face that contrasts in era/construction. System fonts as fallback only.

---

## Pattern: Default Tailwind blue (#3B82F6) as primary color

**Avoid:** `bg-blue-500`, `text-blue-500`, `#3B82F6`, `from-blue-500`. This is *the* default AI-generated CTA.

**Consider:** use the style's token palette primary (brand-accented or archetype-appropriate). If blue is the intent, go indigo-600 / navy-900 / teal-700 / electric-450 — anything but default blue-500.

---

## Pattern: Default Tailwind purple (#6366F1) as primary color

**Avoid:** `bg-indigo-500`, `#6366F1`. Second-most-default CTA after blue-500.

**Consider:** oxblood, plum, wine — any purple with named character instead of Tailwind-default.

---

## Pattern: Default Tailwind green (#10B981) as accent

**Avoid:** `text-emerald-500`, `#10B981` as the "success" accent. Linear/Notion/every-dashboard-2022.

**Consider:** forest-700, jade-600, olive-550, or drop the green entirely and signal success through typography/weight.

---

## Pattern: Uniform border-radius on all elements

**Avoid:** `rounded-lg` or `rounded-xl` applied to every surface. Uniform radius = default component library.

**Consider:** mixed radius schedule: square cards + pill buttons, or hard-corner surfaces + circular avatars. Radius should be a design decision per element role, not a global default.

---

## Pattern: shadow-md applied uniformly

**Avoid:** `shadow-md` on every card, button, and panel. Reads as Material Design 2015 copy-paste.

**Consider:** selective elevation — one or two elements lift, everything else is flat. Or replace shadow with a hairline border + background-tint contrast.

---

## Pattern: Centered hero with gradient backdrop and floating cards

**Avoid:** `text-center` headline, `bg-gradient-*` backdrop, absolutely-positioned `shadow-*` cards floating in front. This IS the 2023 SaaS template.

**Consider:** left-aligned editorial hero with oversized display type; or off-grid composition where the "hero" is a single photograph + caption.

---

## Pattern: Three-column icon + heading + paragraph

**Avoid:** `<Icon />` + `<h3 />` + `<p />` × 3 in `grid-cols-3`. Features-section.dx.

**Consider:** narrative prose with inline emphasis; or a two-column arrangement where one column is reference and one is argument; or a vertical list with bold first-line-lead paragraphs.

---

## Pattern: Poppins + blue gradient combination

**Avoid:** Poppins typeface + blue gradient. Single most "AI-agency-2024" combination.

**Consider:** literally anything else. If Poppins is required for a reason, pair it with a solid flat accent and keep the rest of the page type-restrained.

---

## Pattern: White card on light gray background (low contrast)

**Avoid:** `bg-white` cards on `bg-gray-50` / `bg-slate-50`. The contrast is near-zero and the layout reads as "I don't know what to do with my background".

**Consider:** if cards are needed, give the page background tint and keep cards white — or vice versa. Or drop card backgrounds entirely and separate via vertical rhythm.

---

## Pattern: Symmetric padding everywhere

**Avoid:** `p-4` / `p-6` / `p-8` on every element with no `px`/`py` distinction. No vertical/horizontal rhythm.

**Consider:** `px-*` and `py-*` scaled independently — horizontal breathing room for reading width, vertical rhythm tuned to type scale. Asymmetric padding signals intentional composition.

---

## Pattern: Placeholder name in source (kit present)

**Avoid:** "Jane Doe", "John Smith", "Acme Inc", "Lorem ipsum" when the project has `visionary-kit.json`. Ships stock data to production.

**Consider:** read from the kit's entity fixtures. If the component can't accept kit data, refactor it to accept props — that's the Sprint 7 contract.

---

## Pattern: Placeholder email domain (kit present)

**Avoid:** `example.com`, `test.com`, `acme.com` in rendered output.

**Consider:** kit-derived realistic emails (`kit.entities.users[0].email`). If the component doesn't accept kit data, refactor.
