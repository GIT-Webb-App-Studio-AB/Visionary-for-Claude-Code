# Cottagecore

**Category:** internet
**Motion tier:** Expressive

## Typography
- **Display font:** Playfair Display — serif with ink-trap elegance, literary and warm
- **Body font:** Lora 400 — book-weight serif for readability
- **Tracking:** 0.01em | **Leading:** 1.75 — generous leading for a leisurely read

## Colors
- **Background:** #FDFAF5 — warm near-white like aged paper or cream linen
- **Primary action:** #5C8A5A — sage green, muted and natural
- **Accent:** #C17D8A — dusty rose, the cottagecore signature
- **Elevation model:** none — depth through typography and whitespace, not shadows

## Motion
- **Tier:** Expressive
- **Spring tokens:** gentle (page transitions), ui (hover reveals)
- **Enter animation:** fade-up with very gentle ease (500ms, cubic-bezier(0.22, 1, 0.36, 1))
- **Forbidden:** hard cuts, spring bounce, anything mechanical or urgent

## Spacing
- **Base grid:** 8px
- **Border-radius vocabulary:** 8px for cards, 4px for inputs, 999px for botanical tags — softness without excess

## Code Pattern
```css
.cottagecore-card {
  background: #FDFAF5;
  border: 1px solid rgba(92,138,90,0.2);
  border-radius: 8px;
  padding: 32px;
  font-family: 'Lora', serif;
}

.cottagecore-heading {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  color: #3D5A3E;
  letter-spacing: 0.01em;
}

/* Botanical divider */
.botanical-rule {
  border: none;
  text-align: center;
  color: #5C8A5A;
  opacity: 0.6;
}
.botanical-rule::before {
  content: '— ❧ —';
}
```

## Slop Watch
- **Dark mode cottagecore:** The entire aesthetic depends on warm light and cream backgrounds — dark mode destroys the pastoral feel
- **Sans-serif type:** Using Inter or Poppins in a cottagecore context looks like someone added floral clip art to a SaaS dashboard
