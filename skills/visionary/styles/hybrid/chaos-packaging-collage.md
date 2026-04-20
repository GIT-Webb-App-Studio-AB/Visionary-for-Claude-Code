---
id: chaos-packaging-collage
category: hybrid
motion_tier: Expressive
density: dense
locale_fit: [all]
palette_tags: [light, neon, pastel, earth]
keywords: [chaos, collage, maximalist, anti-ai-slop, doodle, vintage, cut-and-paste, packaging, bjork, brand-new-school]
accessibility:
  contrast_floor: 4.5
  reduced_motion: opacity-only
  touch_target: 44
---

# Chaos Packaging Collage

**Category:** hybrid
**Motion tier:** Expressive

The deliberate anti-AI-slop rebellion. References: Björk's *Post* LP sleeve
(M/M Paris), Stefan Sagmeister's *The Happy Film*, Spike Jonze's *Her*
product packaging, 2024–2026 "hyper-maximalism" revival on NYT T Magazine
and in brand packaging (Liquid Death, Omsom, Graza). Shares DNA with
`post-internet-maximalism` (digital chaos) and `zine-diy` (cut-and-paste)
but sits at a different register: **craft-chaos, not low-fi**. Every
collage element looks handmade but the overall composition is fine-tuned.

## Typography

- **Display font:** **rotating mix per view** — combine 4 specific faces:
  GT Alpina Italic (editorial serif with character), Neue Haas Unica (neutral
  grotesque), Bureau Grotesque Ultra (slab display), and a hand-drawn SVG
  headline. The mix is the voice; a single face kills the register
- **Body font:** Neue Haas Unica 16px
- **Tracking:** display varies per face; body -0.005em
- **Feature:** physical paste-up — overlapping type in `mix-blend-mode:
  multiply`, slight rotation (±1.5°) on headlines, hand-annotated callouts

## Colors

- **Background:** `#F4EDE0` (off-white packaging card) or photography backdrop
- **Palette:** **4–6 colors, all non-digital** — avoid pure web hex (`#FF0000`,
  `#0000FF`). Prefer: `#E63946` (risograph red), `#F4A261` (sunset orange),
  `#2A9D8F` (vintage teal), `#264653` (deep slate), `#E9C46A` (ochre),
  `#8E6B3A` (coffee). Never neon, never dark-mode
- **Signature move:** **photocopied grain** (`background-image: svg noise at
  8% opacity`) + torn-paper `clip-path` on images
- **Elevation model:** physical — hard offset shadows (3–5 px, no blur),
  slight rotation, tape-strip pseudo-elements

## Motion

- **Tier:** Expressive
- **Spring tokens:** `{ bounce: 0.35, visualDuration: 0.4 }` — physical but
  not playful-bouncy
- **Enter animation:** staggered paper-cut drop — each element fades + rotates
  2° into place over 400 ms, staggered 60 ms
- **Micro-interactions:** hover = 1.5° rotate + 3 px lift (paper under finger);
  press = settle back flat
- **Forbidden:** gradients with smooth color transitions, blur, glow, any
  "digital perfection"

## Spacing

- **Base grid:** intentionally fuzzy — 8 px for hit targets, ±4 px offset for
  visual composition
- **Border-radius:** 0–4 px; edges are cut, not extruded

## Code Pattern

```css
.chaos-canvas {
  background: #F4EDE0;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
  padding: 40px;
}
.chaos-headline {
  font-family: 'GT Alpina', 'Playfair Display', serif;
  font-style: italic;
  font-weight: 700;
  font-size: clamp(3rem, 6vw, 6rem);
  line-height: 0.95;
  color: #E63946;
  transform: rotate(-1.2deg);
  mix-blend-mode: multiply;
}
.chaos-card {
  background: #FFFFFF;
  border: 1px solid #264653;
  box-shadow: 5px 5px 0 #264653;
  padding: 24px;
  transform: rotate(0.6deg);
  transition: transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.chaos-card:hover { transform: rotate(1.5deg) translate(-3px, -3px); }
```

## Accessibility

### Contrast
All palette pairs must clear 4.5:1 on their paper backdrop. Mix-blend-mode
can drop measured contrast — always verify computed final color, not just
raw hex. APCA Lc ≥ 75 on body.

### Focus
3 px dashed outline in the view's dominant accent color, 4 px offset — reads
as a hand-drawn circle around the focused item.

### Motion
Rotation is static visual transform (not animated continuously) — safe.
Hover rotations honor `prefers-reduced-motion: reduce` by zeroing out.

### Touch target
44×44 minimum. Rotated buttons feel smaller — pad generously.

### RTL / Logical properties
Fully logical. Rotation direction can be authored per-locale; Arabic/Hebrew
readers might prefer the opposite tilt as natural — mirror the rotation
angles via a CSS variable.

## Slop Watch

- Clean gradients or glossy surfaces = digital, wrong register
- Single typeface = not chaos-collage (see `editorial-serif-revival`)
- Pure black + pure white = cold, wrong palette
- Symmetrical composition = defeats the aesthetic
- "Fake" collage (AI-generated collage sprite pasted wholesale) = fail;
  each element must be independently-composed
