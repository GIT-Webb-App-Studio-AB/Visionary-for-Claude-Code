# Post-Internet Maximalism

**Category:** internet
**Motion tier:** Kinetic

## Typography
- **Display font:** Deliberately mixed — Bebas Neue (compressed all-caps), Impact (legacy web weight), and a serif (Georgia or Times New Roman) ALL active in the same viewport simultaneously; the clash is the content
- **Body font:** No single body font — Arial for one zone, Courier New for another; typographic authority is refused
- **Tracking:** varies per element: 0.2em (Bebas), -0.02em (serif), 0em (Impact) | **Leading:** 0.9 (Bebas headlines), 1.7 (body zones)

## Colors
- **Background:** No unified background — multiple color zones coexist: #FFFF00 zone beside #0000FF zone beside #FFFFFF zone; the viewport has no singular ground
- **Primary action:** #FF0000 — the loudest possible CTA; red as internet-detritus alert, not brand primary
- **Accent:** No single accent — #00FF00, #FF00FF, and #FFFF00 all function as accent simultaneously in different zones
- **Elevation model:** Everything simultaneously — drop shadows, hard pixel offsets, CSS outlines, glows, and inset borders all coexist without hierarchy; every element claims the top of a z-index stack that makes no sense

## Motion
- **Tier:** Kinetic
- **Spring tokens:** Multiple conflicting sets — stiffness: 400 (some elements), stiffness: 60 (others), no consistent damping; elements do not agree on their physical properties
- **Enter animation:** Everything enters at once but differently — some elements slide from left (400ms), others drop from top (200ms), others fade in (800ms), others scale up from 2x (150ms); simultaneous cacophony is the design intent
- **Forbidden:** Internal consistency — if all elements use the same easing, same duration, same entrance direction, it becomes merely loud design rather than post-internet maximalism. Consistency is the error.

## Spacing
- **Base grid:** Grid exists only to be broken — base 8px but elements are deliberately offset by 3px, overlap by 15px, extend 20px beyond their container
- **Border-radius vocabulary:** No vocabulary — 0px on some elements, 50% on adjacent elements, 7px on the next; radius is another dimension of visual conflict

## Code Pattern
```css
/* Post-internet: the container breaks its own grid */
.maximal-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0; /* no breathing room */
  background: #FFFF00;
  position: relative;
  overflow: visible; /* elements escape the container */
}

/* Elements deliberately overlap and claim conflicting z-index */
.maximal-element {
  position: relative;
  /* Three different border treatments simultaneously */
  border: 3px solid #FF0000;
  outline: 2px dashed #0000FF;
  box-shadow:
    4px 4px 0 #00FF00,       /* hard pixel offset */
    -2px -2px 8px #FF00FF,   /* glow in opposite corner */
    inset 0 0 0 1px #000000; /* inset border fourth treatment */
  z-index: calc(var(--element-index, 1) * 7 + 3); /* arbitrary z-index math */
  margin: -8px; /* deliberate overlap */
  background: #FFFFFF;
  padding: 16px;
}

/* Internet detritus reference: the 404 element */
.maximal-element[data-type="404"] {
  font-family: 'Courier New', monospace;
  color: #FF0000;
  font-size: 0.75rem;
  background: #000000;
  /* Blinking cursor — a reference to browser loading states */
  border-right: 2px solid #FF0000;
  animation: blink-cursor 1.1s step-end infinite;
}

/* Hyperlink reference — the blue underline as found object */
.maximal-hyperlink {
  color: #0000EE;
  text-decoration: underline;
  font-family: 'Times New Roman', serif;
  font-size: 1.2rem;
  /* Visited state styled differently — temporal internet memory */
  /* Post-internet treats hyperlinks as cultural artifacts */
}

.maximal-hyperlink:visited {
  color: #551A8B;
}

/* Loading bar — internet detritus as decorative element */
.maximal-loading {
  width: 100%;
  height: 8px;
  background: repeating-linear-gradient(
    90deg,
    #0000FF 0px, #0000FF 10px,
    #000080 10px, #000080 20px
  );
  animation: marquee-load 2s linear infinite;
}

/* Mixed font zones — typography as ideological conflict */
.maximal-zone-bebas {
  font-family: 'Bebas Neue', 'Impact', sans-serif;
  letter-spacing: 0.2em;
  font-size: 4rem;
  line-height: 0.9;
  color: #FFFF00;
  background: #FF0000;
  padding: 8px;
}

.maximal-zone-serif {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 0.8rem;
  line-height: 1.7;
  letter-spacing: -0.02em;
  color: #000000;
  background: #00FF00;
}

@keyframes blink-cursor {
  0%, 100% { border-color: #FF0000; }
  50% { border-color: transparent; }
}

@keyframes marquee-load {
  from { background-position: 0 0; }
  to { background-position: 40px 0; }
}
```

## Slop Watch
- **Internal typographic or color consistency:** If the color palette resolves to a coherent scheme (two colors, one typeface, consistent spacing) the result is merely loud graphic design — Memphis, maximalist branding — but not post-internet. Post-internet maximalism specifically references internet culture as raw material: mismatched found objects, decontextualized UI chrome, the detritus of web 1.0 aesthetics treated as fine art subject matter. Coherence is the failure mode.
- **Missing internet detritus references:** Using only loud colors and big type without referencing the actual substrate — hyperlinks (#0000EE underlined), cursor metaphors, loading indicators, 404 states, browser chrome artifacts — collapses post-internet into generic neo-expressionist graphic design. The internet itself (its broken states, its legacy UI, its loading bars) must appear as found-object content, not just as visual influence.
