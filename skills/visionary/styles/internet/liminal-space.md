# Liminal Space

**Category:** internet
**Motion tier:** Subtle

## Typography
- **Display font:** Arial or Helvetica — the anonymous institutional sans; chosen precisely because it has no personality, no brand association, no designer's fingerprint; it is the font that appeared when no one chose a font
- **Body font:** Arial or Helvetica (same face throughout — no typographic decision was made)
- **Tracking:** 0em everywhere | **Leading:** 1.5 (institutional default, never adjusted)

## Colors
- **Background:** #F2F0E8 — fluorescent-washed institutional off-white; not pure white (too crisp), not grey (too designed); the specific hue of linoleum-floor light at 2am
- **Primary action:** #5B8DB8 — faded corporate blue; the color of a 1998 intranet button that nobody updated; action but without urgency
- **Accent:** #D4A843 — yellowed linoleum gold; the color of something that was once cream-white but has absorbed decades of fluorescent light
- **Elevation model:** None — fluorescent overhead lighting is flat and total; it eliminates shadow because it comes from everywhere at once; any drop shadow immediately reads as a designed object placed in the space, breaking the institutional anonymity

## Motion
- **Tier:** Subtle
- **Spring tokens:** No spring — linear or ease only; organic spring physics implies life in the space, which is precisely absent
- **Enter animation:** Instant (0ms) for most state changes — lights do not fade on in empty hallways, they either work or they do not; for section transitions: very slow 800ms cross-fade (opacity only, no transform) — like fluorescent tubes warming up in an empty corridor
- **Forbidden:** Any motion that implies intentionality — slide-in (implies designed entrance), scale transforms (implies focus), spring physics (implies elasticity and life), bounce (implies joy). Motion must read as system behavior, not design decision.

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px exclusively — institutional architecture has no rounded corners; drop ceiling tiles, linoleum squares, corridor widths are all right angles

## Code Pattern
```css
/* The liminal space — vast empty center, wrong-scale content */
.liminal-space {
  min-height: 100vh;
  background-color: #F2F0E8;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Deliberate over-padding — content wrong-scale in its container */
  padding: 120px 40px;
  font-family: Arial, Helvetica, sans-serif;
}

/* Narrow corridor — content exists in a restricted channel */
.liminal-corridor {
  max-width: 480px;
  width: 100%;
  /* No background, no border — corridor is defined by what isn't there */
}

/* Text that seems slightly unreal — things feel wrong-weight here */
.liminal-text {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  color: #2A2A24;
  /* Slightly transparent — things seem less solid in liminal space */
  opacity: 0.82;
  letter-spacing: 0em;
}

.liminal-heading {
  font-family: Arial, Helvetica, sans-serif;
  font-weight: bold;
  font-size: 1.25rem;
  color: #1A1A16;
  margin-bottom: 24px;
  /* No tracking adjustment — no one adjusted this */
  letter-spacing: 0em;
}

/* Faded institutional action */
.liminal-button {
  background: #5B8DB8;
  color: #FFFFFF;
  border: none;
  border-radius: 0;
  padding: 8px 20px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 0.875rem;
  cursor: pointer;
  /* No hover animation — or extremely flat transition */
  transition: background 150ms linear;
}

.liminal-button:hover {
  background: #4A7BA6;
}

/* Yellowed accent — like old carpet trim or exit sign housing */
.liminal-accent {
  color: #D4A843;
  font-family: Arial, Helvetica, sans-serif;
}

/* Section cross-fade — slow as fluorescent tubes warming up */
.liminal-section {
  transition: opacity 800ms linear;
}

.liminal-section[aria-hidden="true"] {
  opacity: 0;
  pointer-events: none;
}

/* Fluorescent flicker — very subtle, 8s loop, almost imperceptible */
@keyframes flicker {
  0%, 95%, 100% { opacity: 1; }
  96% { opacity: 0.96; }
  97% { opacity: 1; }
  98% { opacity: 0.94; }
  99% { opacity: 1; }
}

.liminal-space {
  animation: flicker 8s linear infinite;
}

/* Wrong-scale image — too large or too small for its context */
.liminal-image {
  width: 100%;
  max-width: 420px;
  opacity: 0.75;
  /* Slightly desaturated — the fluorescent light drains color */
  filter: saturate(0.7) brightness(0.95);
}
```

## Slop Watch
- **Aesthetic intentionality — great type choices, art-directed color palette:** The entire logic of liminal space is that no one designed it; it emerged from institutional procurement decisions, municipal budgets, and maintenance neglect. If a designer's hand is visible — a beautiful serif, a considered color relationship, deliberate negative space — the viewer understands they are looking at designed content placed in liminal space, not liminal space itself. The aesthetic requires the appearance of zero design decisions having been made.
- **Literally blank layouts:** Liminal space is sparse and wrong-scale, not empty. The horror/uncanniness comes from content that exists but feels displaced — a vending machine in a corridor, a bulletin board in a room too large for it, a chair where no one would sit. Purely blank screens read as loading states or errors, not liminal space. Content must be present but feel orphaned.
