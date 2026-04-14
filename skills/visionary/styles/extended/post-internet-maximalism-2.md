# Post-Internet Maximalism (Extended)

**Category:** extended/internet-chaos
**Motion tier:** Kinetic

## Typography
- **Display font:** Mix of 3–5 contrasting typefaces (GT Pressura, Maax Medium, Grotesk LLSans, Comic Sans, etc.)
- **Body font:** System stack chaos — varies per section
- **Tracking:** varies wildly per element (0em to 0.2em)
- **Leading:** 0.9 to 2.0 — no consistency
- **Feature:** Text rotates, scales, and skews on hover; fonts change weight mid-word

## Colors
- **Palette:** Every saturated color simultaneously — #FF00FF + #00FFFF + #FFFF00 + #FF0099 overlapping
- **Background:** animated gradient shift cycling through the full color wheel every 8s
- **Text:** every color at once via mix-blend-mode: multiply / screen / overlay
- **Accents:** neon, electric, impossible — colors that shouldn't exist on screen

## Motion
- **Tier:** Kinetic
- **Spring tokens:** `{ stiffness: 450, damping: 18, mass: 0.75 }` — hyperactive, jittery, responsive
- **Enter animation:** explosion — elements explode outward from center, then settle with bounce
- **Micro-interactions:** constant jitter (±1–2px), scale pulse on idle, rotation on scroll, skew on click
- **Every UI element must move** — nothing static, nothing calm, constant low-level motion
- **Forbidden:** whitespace, silence, single colors, minimal anything, professionalism

## Spacing
- **Base grid:** None. Intentionally chaotic positioning.
- **Border-radius vocabulary:** varies per element (0, 4px, 50%, 200%, asymmetric clip-paths)
- **Overlap allowed**: elements can layer on top of each other; collision is feature not bug

## Code Pattern
```css
.maximalist-chaos {
  background: linear-gradient(45deg, #FF00FF, #00FFFF, #FFFF00, #FF0099);
  background-size: 400% 400%;
  animation: color-shift 8s ease infinite;
  mix-blend-mode: screen;
  overflow: hidden;
  padding: clamp(1rem, 5vw, 3rem);
}

@keyframes color-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.maximalist-text {
  font-size: clamp(1rem, 8vw, 4rem);
  font-family: "GT Pressura", "Grotesk LLSans", "Comic Sans MS", monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #FFFF00;
  mix-blend-mode: multiply;
  animation: text-jitter 0.3s ease-in-out infinite;
  transform: rotate(-2deg) skew(-5deg);
}

@keyframes text-jitter {
  0%, 100% { transform: translate(0, 0) rotate(-2deg) skew(-5deg); }
  25% { transform: translate(2px, -2px) rotate(-1.5deg) skew(-4deg); }
  50% { transform: translate(-2px, 2px) rotate(-2.5deg) skew(-6deg); }
  75% { transform: translate(1px, -1px) rotate(-1.8deg) skew(-4.5deg); }
}

.maximalist-element {
  position: absolute;
  clip-path: polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%);
  animation: element-pulse 2s ease-in-out infinite;
}

@keyframes element-pulse {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.9; }
  50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
}

@media (prefers-reduced-motion: no-preference) {
  .maximalist-chaos * {
    animation-play-state: running !important;
  }
}

/* Force motion even with reduced-motion preference for maximum chaos */
@media (prefers-reduced-motion: reduce) {
  /* Maximalism ignores reduced-motion — at minimum, color still cycles */
  .maximalist-chaos {
    animation: color-shift 8s ease infinite;
  }
}
```

## Slop Watch
- Colors MUST clash — if colors are harmonious, it's not maximalist
- Never use only one typeface — variety is the point
- All text must be rotated/skewed/scaled differently — alignment is antithetical
- Whitespace is the enemy — fill every pixel
- Motion must be visible and constant — static content breaks the maximalist energy
- Never follow a grid — randomness and chaos are the aesthetic
- Mix blend modes are essential — overlapping + blend modes = core technique
- This style should make minimalists weep
