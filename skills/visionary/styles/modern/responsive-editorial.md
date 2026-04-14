# Responsive Editorial

**Category:** modern
**Motion tier:** Expressive

## Typography
- **Display font:** Source Serif 4 — editorial authority, optical sizing support
- **Body font:** Source Serif 4 Regular (optical-size: auto)
- **Tracking:** 0em | **Leading:** 1.7 | **Weight range:** 300/400/700/900

## Colors
- **Background:** #FFFFFF
- **Primary action:** #1A1A1A
- **Accent:** #C41E3A (editorial red — link, pullquote, highlight)
- **Elevation model:** none — white space and type hierarchy create depth

## Motion
- **Tier:** Expressive
- **Spring tokens:** `stiffness: 160, damping: 18`
- **Enter animation:** reading-direction fade (opacity + translateY(12px) → 0, stagger per block, 80ms apart)
- **Forbidden:** bounce, scale transforms on text, horizontal slides that fight reading direction

## Spacing
- **Base grid:** 8px; text column max-width: 680px; wide media breakout: 110% of column
- **Border-radius vocabulary:** 0px for editorial elements; 4px only for UI affordances (buttons, tags)

## Code Pattern
```css
.editorial-column {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 24px;
}
.editorial-breakout {
  width: 110%;
  margin-left: -5%;
}
.editorial-pullquote {
  border-left: 4px solid #C41E3A;
  padding-left: 24px;
  font-size: 1.25rem;
  font-style: italic;
  color: #C41E3A;
}
.editorial-dropcap::first-letter {
  float: left;
  font-size: 4.5rem;
  line-height: 0.8;
  padding-right: 8px;
  font-weight: 700;
  color: #C41E3A;
}
```

## Slop Watch
Alternating max-width columns are a pattern, not a trick — use them when content has genuine visual rhythm (image → text → quote → image). Mechanical alternation of every single element reads as template-think, not editorial judgment.
