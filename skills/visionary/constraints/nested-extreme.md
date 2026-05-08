---
id: nested-extreme
category: layout
css_rules:
  - "DOM depth from top-level section to leaf text node MUST be >= 6 levels"
  - "Implementation: deliberate wrapper hierarchy that adds compositional layers (frame > matte > inner-frame > content > caption-wrapper > caption-text)"
  - "Each wrapper should serve a visual purpose — not be empty divs for the sake of nesting"
invariants:
  - "Walking from top-level section to deepest text-bearing leaf, max depth >= 6 elements"
conflict_set: ["swiss-rationalism-strict"]
rationale: "Deep nesting is the editorial-frame-within-frame aesthetic — think a magazine spread where the title sits inside a matte, inside a frame, inside a colored section, inside the page. Modern utility-first frameworks (Tailwind) push toward flat, single-element layouts; this constraint rejects that flatness in favor of deliberate compositional depth."
examples: ["Aperture monograph layouts 2024", "magazine-style portfolio 2025 (Pian, Roselli)", "editorial print spreads from Aperture"]
---

# nested-extreme

Deliberate deep DOM nesting. Each wrapper carries visual meaning —
frame, matte, inner-frame, content, caption-wrapper. Reference to
editorial print where compositional layers were the norm.

## Compliant patterns

```html
<section class="page">                           <!-- 1 -->
  <div class="page-frame">                       <!-- 2 -->
    <div class="page-matte">                     <!-- 3 -->
      <article class="article">                  <!-- 4 -->
        <div class="article-inner">              <!-- 5 -->
          <h2>Editorial</h2>                     <!-- 6 — leaf -->
        </div>
      </article>
    </div>
  </div>
</section>
```

## Non-compliant

```html
<section><h1>Hero</h1></section>   <!-- 2 levels — too flat -->
```

## Validation

Walk DOM. For each leaf text node, compute its depth (count of ancestor
elements until reaching the document root or nearest top-level section).
Pass if at least one path has depth ≥ 6.
