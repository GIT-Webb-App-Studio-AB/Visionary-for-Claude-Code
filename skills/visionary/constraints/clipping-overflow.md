---
id: clipping-overflow
category: form
css_rules:
  - "At least 1 image OR shape element MUST be clipped above the normal content flow (e.g. image leaks above hero margin, character peeks out of card edge)"
  - "Implementation via overflow: visible on parent + transform: translateY(-Npx) on child OR clip-path on the parent letting child poke out"
  - "Excluded: shadow effects (those are not clipping)"
invariants:
  - "At least one element has bbox.top < bbox(parent).top - 16 OR bbox.bottom > bbox(parent).bottom + 16"
  - "And computed parent overflow !== 'hidden' OR a clip-path admits the child silhouette"
conflict_set: ["pixel-perfect-grid", "swiss-rationalism-strict"]
rationale: "Letting content visually escape its container — a character's hat poking above a card's top edge, a hand reaching into the next section — is a decades-old print-illustration move that web design has slowly relearned. It rejects the clean-rectangle-clipping default and adds physical depth. Common in editorial publishing, comic-book-inspired SaaS landing pages, and the Apple iPhone product-page genre."
examples: ["Apple.com iPhone product pages — phone leaks above background frame", "Notion's marketing pages — character illustrations escaping section boundaries"]
---

# clipping-overflow

At least one image or graphic poke above its parent container's normal
flow. The element should visibly escape its bounding rectangle.

## Compliant patterns

```css
.hero {
  position: relative;
  overflow: visible; /* explicitly NOT hidden */
}

.hero-figure {
  position: absolute;
  inset-block-start: -80px;  /* leaks above the hero box */
  inline-size: 320px;
  z-index: 2;
}

/* Or via translate */
.product-shot {
  transform: translateY(-15%);
}
```

## Non-compliant

```css
.hero { overflow: hidden; }
/* All children clipped to parent bounds — no visual escape */
```

## Validation

Walk the DOM. For each visible image, find its layout parent. Check that
`child.bbox.top < parent.bbox.top - 16` AND `parent.overflow !== 'hidden'`.
Pass if at least one such pair exists.
