# Glitchcore

**Category:** internet
**Motion tier:** Kinetic

## Typography
- **Display font:** IBM Plex Mono 700 — the Bold weight of IBM Plex Mono is the only monospace that survives RGB channel splitting intact; when `text-shadow` applies red and blue offsets at 3-4px, thin or medium monospace letterforms lose readability, with strokes blending into the channel colors; IBM Plex Mono 700's stroke width holds structure under channel offset, and its IBM heritage (machine, mainframe, system) fits the corrupted-digital-media context
- **Body font:** IBM Plex Mono 400 — family consistency; the regular weight for body text keeps the terminal/corrupted-system reading without competing with the Bold display glitch
- **Tracking:** 0.06em (slight mono-grid looseness, as if character cells are slightly out of alignment) | **Leading:** 1.6 (enough for channel offsets to not bleed between lines)

## Colors
- **Background:** #0A0A0A — near-black maximum contrast; not pure black (#000000, the RGB channels need headroom to read against the background); not dark grey (#1A1A1A, reduces channel pop); #0A0A0A provides the maximum contrast surface for pure R, G, B channel offsets to read as distinct colors rather than blending
- **Primary action:** pure red channel #FF0033 — the R channel of corrupted RGB data; not crimson, not coral, not hot pink; the red must be pure channel-shift red so the channel-split effect reads as data corruption rather than design choice; any deviation toward warmth or pink reads as synthwave
- **Accent:** pure green channel #00FF00 — the G channel; not lime, not neon green, not sage; must be the exact pure-green RGB value that appears when a green channel is isolated; the B channel (#0000FF) is available as tertiary where three-channel corruption is needed
- **Elevation model:** none — RGB channel offset IS the depth signal; elements appear "closer" by having more intense channel offset; background elements have no channel split; foreground elements have 2-4px offset; focal elements have 6-8px offset; this is the only dimensionality system in glitchcore — there are no shadows, borders, or gradients for depth

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `--spring-glitch-snap: steps(1) 50ms` (instantaneous — glitches are binary, not interpolated), `--spring-glitch-settle: cubic-bezier(0.25, 0.46, 0.45, 0.94) 150ms` (fast settle after the disruptive frames), `--spring-idle: none` (2-4 seconds of no motion between glitch bursts)
- **Enter animation:** `glitch-in` — 3-frame sequence: frame 1 (50ms) text-shadow shifts red channel 4px left + blue channel 4px right with `clip-path: inset(15% 0 75% 0)` partial reveal; frame 2 (50ms) channels flip — red right, blue left, `clip-path: inset(35% 0 45% 0)` different slice; frame 3 (150ms) channels snap to center, full element visible, glitch resolves; total duration 250ms; the frame sequence mimics data corruption during file read, resolving to stable state
- **Forbidden:** constant glitch animation without idle periods (real data corruption is episodic; permanent glitch removes the contrast that makes glitch readable and prevents users from reading content; idle periods of 2-4 seconds are mandatory), pastel or aesthetic channel splits (RGB channels must be pure #FF0000/#00FF00/#0000FF variants — desaturated or pastel channel colors read as lo-fi aesthetic rather than data corruption)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** everything: 0px — glitchcore is hard edges and digital artifacting; rounded elements read as UI design intent; glitchcore is anti-design, presenting as corrupted system output; 0px enforces the machine aesthetic; even interactive elements like buttons must be square; the only exception is `clip-path` shapes used for glitch slices which are rectangular by definition

## Code Pattern
```css
/* Near-black max-contrast base */
.glitch-page {
  background: #0A0A0A;
  color: #00FF00;
  font-family: "IBM Plex Mono", "Courier New", monospace;
  font-weight: 400;
  min-height: 100vh;
  overflow-x: hidden;
}

/* Glitch-in: 3-frame RGB channel corruption entrance */
@keyframes glitch-in {
  0% {
    opacity: 0;
    text-shadow:
      -4px 0 #FF0033,
       4px 0 #0000FF;
    clip-path: inset(15% 0 75% 0);
    transform: translate(-2px, 0);
  }
  20% {
    opacity: 1;
    text-shadow:
       4px 0 #FF0033,
      -4px 0 #0000FF;
    clip-path: inset(35% 0 45% 0);
    transform: translate(3px, 0);
  }
  40% {
    text-shadow:
      -2px 0 #FF0033,
       2px 0 #0000FF;
    clip-path: inset(0% 0 0% 0);
    transform: translate(0, 0);
  }
  100% {
    opacity: 1;
    text-shadow: none;
    clip-path: inset(0% 0 0% 0);
    transform: translate(0, 0);
  }
}

/* Idle glitch burst — fires every 3s, allows 2.75s of rest */
@keyframes glitch-idle {
  0%, 91%   { text-shadow: none; transform: translate(0); }
  92%       {
    text-shadow: -3px 0 #FF0033, 3px 0 #0000FF;
    transform: translate(-2px, 1px);
  }
  93%       {
    text-shadow: 3px 0 #FF0033, -3px 0 #0000FF;
    transform: translate(2px, -1px);
    clip-path: inset(20% 0 60% 0);
  }
  94%       {
    text-shadow: -1px 0 #FF0033, 1px 0 #0000FF;
    transform: translate(0);
    clip-path: inset(0);
  }
  100%      { text-shadow: none; transform: translate(0); }
}

/* Glitch text component with mandatory idle period */
.glitch {
  display: inline-block;
  font-family: "IBM Plex Mono", monospace;
  font-weight: 700;
  color: #00FF00;
  animation:
    glitch-in 250ms steps(1) both,
    glitch-idle 3000ms steps(1) 250ms infinite;
}

/* Channel-split as depth signal — foreground element */
.glitch-foreground {
  text-shadow:
    -4px 0 rgba(255, 0, 51, 0.8),
     4px 0 rgba(0, 0, 255, 0.8);
}

/* Background element — no channel split */
.glitch-background {
  opacity: 0.4;
}

/* clip-path slice for horizontal data-corruption cuts */
.glitch-slice {
  position: relative;
}

.glitch-slice::before {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  color: #FF0033;
  clip-path: inset(30% 0 55% 0);
  transform: translate(-4px, 0);
}

.glitch-slice::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  color: #0000FF;
  clip-path: inset(55% 0 20% 0);
  transform: translate(4px, 0);
}
```

## Slop Watch
- **Running the glitch animation continuously without idle periods:** Real data corruption is episodic — it occurs during reads, writes, or transmission errors, then resolves. A permanently glitching interface means users can never read the content, which defeats the purpose of the medium and reads as amateur animation rather than data corruption simulation. The 2-4 second idle window between glitch bursts is the mechanism that makes glitch legible as a system event rather than decoration.
- **Using desaturated, pastel, or "aesthetic" channel split colors instead of pure RGB:** The glitch effect requires pure #FF0033 (red channel), #00FF00 (green channel), and #0000FF (blue channel) — the actual colors of individual RGB display channels. Using pastel splits like pink/lavender/mint reads as vaporwave or lo-fi aesthetic and demonstrates the design is referencing the look of glitch without understanding its technical origin. Pure channels are the technical fact that the aesthetic is built on.
