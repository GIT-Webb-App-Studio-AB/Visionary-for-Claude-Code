# Dreamcore

**Category:** internet
**Motion tier:** Subtle

## Typography
- **Display font:** EB Garamond Italic — the italic variant specifically because italic letterforms carry an inherent lean and softness that upright serifs do not; EB Garamond's thin strokes soften further at small sizes, creating the sensation of text that isn't fully present; the italic creates a floating quality as though text is slightly tilted away from the viewer, halfway between here and somewhere else
- **Body font:** EB Garamond 400 — same family; the regular weight maintains the thin serif strokes that feel semi-transparent against the washed yellow background; switching to a different body face would introduce too much grounding presence
- **Tracking:** -0.01em (slightly compressed, words press together like memory fragments) | **Leading:** 2.0 (very generous — dreamcore content needs air; the space between lines IS part of the content, representing what isn't said)

## Colors
- **Background:** #F5F5C8 — washed-out yellow, the liminal color signature of dreamcore; this specific hex reproduces the quality of fluorescent lighting in empty institutional spaces (hospital corridors, school hallways after hours, empty swimming pools) as captured on 1990s/early-2000s consumer cameras with slightly overexposed film; not cream (#F5EFE0, too warm), not pale yellow (#FFFF99, too saturated); #F5F5C8 is specifically the color of institutional spaces under harsh fluorescent light
- **Primary action:** muted teal #7BA3A0 — the color of a faded poster or weathered institutional signage; desaturated enough to feel like memory rather than direct perception; reads as guidance and navigation without asserting presence; not teal (#008080, too vivid), not sage (#9CAF88, wrong hue axis)
- **Accent:** dusty lilac #C8B8D4 — the color of something that was once more vibrant but has been left in light too long; suggests personal objects in abandoned spaces, faded fabric, old photographs; not purple (too deliberate), not pink (too warm and present)
- **Elevation model:** none — dreamcore rejects physicality entirely; shadows imply realness, depth, and tactility, which dreamcore denies; the aesthetic is about spaces that feel neither real nor unreal; all elements exist on the same plane without hierarchy; depth is instead implied by opacity reduction (background elements are `opacity: 0.6`, midground `opacity: 0.8`, foreground `opacity: 1.0`) — things that are "further away" are simply less present

## Motion
- **Tier:** Subtle
- **Spring tokens:** `--spring-memory-fade: ease-in-out 1000ms` (the slowest comfortable transition; memory doesn't snap into clarity), `--spring-drift: ease 1200ms` (for anything that must move; the extra 200ms removes any sense of urgency or intention)
- **Enter animation:** `memory-fade-in` — opacity 0 to 1 only, over 1000ms with `ease-in-out`; no transform, no scale, no translate; elements don't arrive from somewhere — they simply become more present, like a memory becoming clearer without moving toward you; any positional change is explicitly forbidden because movement implies physical space, which dreamcore denies
- **Forbidden:** snappy transitions under 600ms (they assert presence and intentionality; dreamcore should feel accidental and drifting), scale transforms of any kind (scale changes imply approach/recession and physical space), translate entrances (same reason; elements should not arrive from elsewhere, they should gradually become visible as though always having been there), any animation that draws attention to itself

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** images: 0px (photographs in dreamcore are direct, square, like found images); cards: 4px (the faintest softening, barely perceptible, like edges worn by handling); buttons: 4px; inputs: 2px; the intentional void elements: 0px (empty space in dreamcore should be perfectly geometric, not organic); dreamcore uses minimal radius — not 0 like webcore (too harsh), not fully rounded (too designed and present)

## Code Pattern
```css
/* Dreamcore — liminal institutional space */
.dreamcore-page {
  background-color: #F5F5C8;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "EB Garamond", "Georgia", serif;
  font-style: italic;
  color: rgba(60, 55, 45, 0.85);
}

/* Content that doesn't fully exist — slight transparency */
.dreamcore-content {
  max-width: 640px;
  width: 100%;
  padding: 64px 32px;
  line-height: 2.0;
  letter-spacing: -0.01em;
  font-size: 1.1rem;
  color: rgba(60, 55, 45, 0.82);
}

.dreamcore-content h1,
.dreamcore-content h2,
.dreamcore-content h3 {
  font-family: "EB Garamond", "Georgia", serif;
  font-style: italic;
  font-weight: 400;
  color: rgba(60, 55, 45, 0.75);
  line-height: 1.4;
}

/* Desaturated, low contrast images — things half-remembered */
.dreamcore-image {
  width: 100%;
  filter: saturate(0.4) contrast(0.85) brightness(1.05);
  display: block;
  border-radius: 0;
}

/* Memory fade entrance — opacity only, no movement */
@keyframes memory-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.dreamcore-enter {
  animation: memory-fade-in 1000ms ease-in-out both;
}

/* Intentional empty space — the void is content */
.dreamcore-void {
  height: 120px;
  width: 100%;
  display: block;
}

/* Muted teal for primary actions — navigation without assertion */
.dreamcore-link {
  color: #7BA3A0;
  text-decoration: none;
  font-style: italic;
  transition: color 1000ms ease-in-out, opacity 1000ms ease-in-out;
}

.dreamcore-link:hover {
  color: #5A8280;
  opacity: 0.8;
}

/* Dusty lilac accent — for secondary or decorative text */
.dreamcore-accent {
  color: #C8B8D4;
  font-style: italic;
  opacity: 0.9;
}

/* Depth via opacity rather than shadow */
.dreamcore-background-element {
  opacity: 0.6;
}

.dreamcore-midground-element {
  opacity: 0.8;
}
```

## Slop Watch
- **Using scale transforms or translate entrances for motion:** Scale transforms (element growing from 0.95 to 1.0) and translate entrances (element sliding from below) both imply physical space — the element exists somewhere and moves to its destination. Dreamcore's central aesthetic claim is that space is ambiguous and physicality is absent. Any motion that implies an object moving through space directly contradicts the liminal, between-states quality. Only opacity transitions are permitted, because they suggest presence increasing rather than movement occurring.
- **Using snappy transitions or anything that draws attention to itself:** A transition that completes in 150-200ms is noticeable as a design event. Dreamcore should be so subtle in its motion that users aren't sure if anything moved at all — like catching something in peripheral vision that's gone when you look directly. Snappy motion asserts intention, precision, and responsiveness — all qualities of designed digital interfaces. Dreamcore should feel undesigned, drifting, and slightly outside the frame of normal UI behavior.
