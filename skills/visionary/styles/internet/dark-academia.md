# Dark Academia

**Category:** internet
**Motion tier:** Subtle

## Typography
- **Display font:** EB Garamond — the definitive old-style serif, conjures Latin manuscripts
- **Body font:** EB Garamond 400, falling back to Georgia
- **Tracking:** 0.02em body, -0.01em display | **Leading:** 1.8

## Colors
- **Background:** #1A1510 — warm dark brown that reads as candlelit library
- **Primary action:** #C9A84C — aged gold for links and interactive elements
- **Accent:** #8B7355 — parchment tan as secondary text and borders
- **Elevation model:** none — depth through typography hierarchy, candlelight palette, zero digital shadows

## Motion
- **Tier:** Subtle
- **Spring tokens:** gentle (page load), ui (hover state)
- **Enter animation:** cross-dissolve at 600ms — like turning a page gently
- **Forbidden:** fast snappy transitions, scale-bounce, anything that feels modern or digital-native

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 0px for text containers (manuscript edges are straight), 4px max for any interactive element

## Code Pattern
```css
.dark-academia-body {
  background: #1A1510;
  color: #D4C5A9; /* parchment text */
  font-family: 'EB Garamond', Georgia, serif;
  line-height: 1.8;
}

.dark-academia-heading {
  color: #C9A84C;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-style: italic;
  font-weight: 400; /* Garamond weight is in its letterform, not its weight */
}

.dark-academia-rule {
  border: none;
  border-top: 1px solid rgba(201,168,76,0.3);
  margin: 3rem 0;
}

blockquote {
  border-left: 2px solid #C9A84C;
  padding-left: 1.5rem;
  font-style: italic;
  color: #8B7355;
}
```

## Slop Watch
- **Adding photos of libraries:** Dark academia as UI design means typographic atmosphere, not literal imagery of ivy and bookshelves
- **Using Cinzel instead of Garamond:** Cinzel is Roman capitals — academic, yes, but too formal and display-only. EB Garamond handles body text and creates warmth
