# E-Girl

**Category:** internet
**Motion tier:** Expressive

## Typography
- **Display font:** Bebas Neue or bold italic grotesque (e.g. Archivo Black italic) — compressed, aggressive, high contrast; references band merch and alternative fashion zine typography
- **Body font:** DM Sans 500 or Poppins 400 — clean and legible; the body text must be readable so the pink/black duality in the UI carries the aesthetic weight
- **Tracking:** 0.1em (display Bebas), 0em (DM Sans body) | **Leading:** 1.0 (display — tight band-tee energy), 1.55 (body)

## Colors
- **Background:** Alternates zones — #0A0A0A (near-black dominant zones) and #FF1493 (deep pink accent zones); these two colors are equal design partners, not background/foreground; the UI switches between them at section boundaries
- **Primary action:** #FF1493 — deep pink is non-negotiable; this is not hot pink, not magenta, not bubblegum; it is specifically the deep electric pink of eyeliner lights and anime aesthetics
- **Accent:** #000000 — black functions as an equal accent color to pink; on pink surfaces, black is the contrast; on black surfaces, pink is the contrast; both read as foreground depending on context
- **Elevation model:** Hard offsets — on pink surfaces: 1px solid black border + 3px 3px 0 black box-shadow; on black surfaces: 1px solid #FF1493 border + 3px 3px 0 #FF1493 box-shadow; no blurred shadows anywhere; the hard offset references zine printing and neubrutalism filtered through TikTok punk

## Motion
- **Tier:** Expressive
- **Spring tokens:** stiffness: 320, damping: 14, mass: 0.8 — spring damping 0.5 (underdamped); elements bounce past their target and return; snappy and slightly aggressive
- **Enter animation:** Drop + bounce — elements enter from y: -20px with spring physics, overshoot by ~4px, settle; combined with opacity 0 to 1 over first 150ms; total animation ~350ms; the bounce reads as attitude, not playfulness
- **Forbidden:** Soft easing (cubic-bezier with no overshoot — reads as soft-girl, wrong tribe), light pink #FFB6C1 anywhere (this is the slop watch item; see below), gradients on interactive elements (they soften the hard-offset aesthetic), rounded corners on card/panel elements (neubrutalist elements must be 0px radius)

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** Two extremes only — 0px for all card, panel, button, and input elements (neubrutalist hard edges); 999px for badges, tags, and pill labels exclusively; nothing in between; intermediate radius (4px, 8px, 16px) does not exist in this vocabulary

## Code Pattern
```css
/* E-girl card — pink surface, black hard offset shadow */
.egirl-card {
  background: #FF1493;
  color: #000000;
  border: 1px solid #000000;
  /* Hard offset shadow — no blur radius */
  box-shadow: 3px 3px 0 #000000;
  border-radius: 0;
  padding: 24px;
  position: relative;
  transition: transform 200ms cubic-bezier(0.34, 1.4, 0.64, 1),
              box-shadow 200ms cubic-bezier(0.34, 1.4, 0.64, 1);
}

.egirl-card:hover {
  /* On hover: element shifts by exactly the shadow offset — lifts off surface */
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 #000000;
}

/* Button — black surface, pink offset shadow (inverted relationship) */
.egirl-button {
  background: #000000;
  color: #FF1493;
  border: 1px solid #FF1493;
  box-shadow: 3px 3px 0 #FF1493;
  border-radius: 0;
  padding: 10px 24px;
  font-family: 'DM Sans', 'Poppins', system-ui, sans-serif;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: transform 200ms cubic-bezier(0.34, 1.4, 0.64, 1),
              box-shadow 200ms cubic-bezier(0.34, 1.4, 0.64, 1);
}

.egirl-button:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #FF1493;
}

.egirl-button:active {
  /* Press: element snaps to shadow position — satisfying click */
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 #FF1493;
}

/* Badge — 999px pill radius, the one exception to 0px rule */
.egirl-badge {
  background: #000000;
  color: #FF1493;
  border-radius: 999px;
  padding: 4px 12px;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* On black zones — pink badge becomes the variant */
.egirl-badge--pink {
  background: #FF1493;
  color: #000000;
}

/* Display heading — tight, aggressive */
.egirl-heading {
  font-family: 'Bebas Neue', 'Archivo Black', Impact, sans-serif;
  font-style: italic;
  font-size: 3.5rem;
  line-height: 1.0;
  letter-spacing: 0.1em;
  /* Color alternates by zone context */
  color: inherit;
  text-transform: uppercase;
}

/* Zone alternation — sections flip the duality */
.egirl-zone--dark {
  background: #0A0A0A;
  color: #FF1493;
  padding: 48px 32px;
}

.egirl-zone--pink {
  background: #FF1493;
  color: #000000;
  padding: 48px 32px;
}

/* Drop-bounce entrance animation */
@keyframes egirl-drop-bounce {
  0% { opacity: 0; transform: translateY(-20px); }
  60% { opacity: 1; transform: translateY(4px); }
  80% { transform: translateY(-2px); }
  100% { transform: translateY(0); }
}

.egirl-card[data-animate],
.egirl-button[data-animate] {
  animation: egirl-drop-bounce 350ms cubic-bezier(0.34, 1.4, 0.64, 1) both;
}
```

## Slop Watch
- **Using #FFB6C1 (light pink) or any desaturated/pastel pink:** Light pink is the soft-girl aesthetic — it references baby clothes, Barbie, feminine gentleness. E-girl aesthetics deliberately refuse softness; the deep electric #FF1493 (deep pink / strong magenta) references anime highlights, alternative fashion, and punk-influenced TikTok culture. Substituting light pink destroys the duality and moves the read from edgy-alternative to cute-feminine — two entirely different tribes.
- **Removing black as an equal design partner or applying intermediate border-radius values:** E-girl UI operates on strict binary contrast — deep pink and black are equals; removing black (e.g. using white as the contrast color) collapses the punk tension into generic colorful design. Equally, introducing 8px or 12px border-radius on card/panel elements replaces the neubrutalist hard edge with softness. The two valid radius values (0px and 999px) enforce an aesthetic of no compromise: things are either completely hard or completely round, never negotiated.
