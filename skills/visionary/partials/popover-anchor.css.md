# Popover + Anchor + Invoker — zero-JS overlay primitives

Baseline-2026 CSS gives us three intersecting primitives that replace most
React/Vue portal libraries:

- **Popover API** (`[popover]`) — the browser manages top-layer rendering,
  light-dismiss, focus return, and ESC handling.
- **Anchor positioning** (`anchor-name` + `position-anchor` +
  `position-area`) — the browser positions an overlay relative to a named
  anchor, flipping to a fallback area when the primary position overflows.
- **Invokers** (`commandfor` + `command`) — the browser wires the button's
  click to a target popover/dialog without any JS hookup.

Put together: a menu, tooltip, dropdown, or dialog with zero lines of JS
for opening, positioning, or dismissing. Slop-scanner pattern #31 flags
`useRef` for dropdown position; pattern #28 flags `@floating-ui/react`
imports. Use these partials instead.

---

## Base CSS (dropped into every stack's global sheet)

```css
@layer base {
  /* Reset the browser's default popover chrome */
  [popover] {
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    inset: unset;
  }

  /* Entry + exit animation using @starting-style + allow-discrete */
  [popover] {
    transition:
      opacity 200ms,
      translate 200ms,
      display 200ms allow-discrete,
      overlay 200ms allow-discrete;
    opacity: 1;
    translate: 0 0;
  }
  [popover]:not(:popover-open) {
    opacity: 0;
    translate: 0 -4px;
  }
  @starting-style {
    [popover]:popover-open {
      opacity: 0;
      translate: 0 -4px;
    }
  }

  /* Progressive enhancement — pre-Baseline browsers get a usable
     non-animated popover. @supports gates the anchor positioning only. */
  @supports (position-anchor: --x) {
    [popover][data-vn-anchored] {
      position: absolute;
      inset: auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [popover] {
      transition: opacity 1ms;
      translate: 0 0;
    }
  }
}
```

---

## Dropdown menu — React template

```tsx
export function UserMenu({ items }: { items: MenuItem[] }) {
  return (
    <>
      <button
        type="button"
        popovertarget="user-menu"
        commandfor="user-menu"
        command="show-popover"
        aria-haspopup="menu"
        style={{ anchorName: '--user-menu-btn' } as CSSProperties}
      >
        Profile
      </button>
      <menu
        id="user-menu"
        popover="auto"
        data-vn-anchored
        role="menu"
        style={{
          positionAnchor: '--user-menu-btn',
          positionArea: 'block-end inline-end',
          positionTryFallbacks: 'flip-block, flip-inline',
        } as CSSProperties}
      >
        {items.map((item) => (
          <li role="none" key={item.id}>
            <button
              type="button"
              role="menuitem"
              command="close"
              commandfor="user-menu"
              onClick={item.onSelect}
            >
              {item.label}
            </button>
          </li>
        ))}
      </menu>
    </>
  );
}
```

Notes:

- `commandfor` + `command="show-popover"` on the opener and `command="close"`
  on the menu items replaces `onClick` state handlers entirely.
- `position-try-fallbacks: flip-block, flip-inline` lets the browser flip
  to the opposite side when the anchor is near a viewport edge.
- `aria-haspopup="menu"` is still required — Popover API handles focus but
  screen readers want the role hint.

---

## Tooltip — Vue template

```vue
<script setup lang="ts">
defineProps<{ id: string; label: string }>();
</script>

<template>
  <span :style="{ anchorName: `--tt-${id}` }">
    <slot />
  </span>
  <span
    :id="`tt-${id}`"
    popover="hint"
    data-vn-anchored
    role="tooltip"
    :style="{
      positionAnchor: `--tt-${id}`,
      positionArea: 'block-start center',
      positionTryFallbacks: 'flip-block',
    }"
  >
    {{ label }}
  </span>
</template>
```

`popover="hint"` is the weakest auto-close variant — it dismisses on any
outside interaction including focus changes, which is correct for
tooltips. `popover="auto"` is for menus / dropdowns; `popover="manual"`
is for dialogs that must stay open until code closes them.

---

## Context menu — Svelte template

```svelte
<script lang="ts">
  export let target: HTMLElement;
  export let items: { label: string; onSelect: () => void }[];

  let popover: HTMLMenuElement;

  function onContextMenu(event: MouseEvent) {
    event.preventDefault();
    target.style.setProperty('--ctx-x', `${event.clientX}px`);
    target.style.setProperty('--ctx-y', `${event.clientY}px`);
    popover.showPopover();
  }
</script>

<svelte:window oncontextmenu={onContextMenu} />

<menu
  bind:this={popover}
  popover="auto"
  role="menu"
  style="position: fixed; left: var(--ctx-x); top: var(--ctx-y);"
>
  {#each items as item}
    <li role="none">
      <button role="menuitem" command="close" commandfor={popover.id} onclick={item.onSelect}>
        {item.label}
      </button>
    </li>
  {/each}
</menu>
```

Context menus are the one case where anchor positioning doesn't fit —
the anchor is a literal cursor position, not a DOM element. Falls back
to `position: fixed` + cursor coords, but the Popover API still handles
light-dismiss and focus return.

---

## Dialog — HTML template (framework-agnostic)

```html
<button popovertarget="confirm-dialog" commandfor="confirm-dialog" command="show-popover">
  Delete account
</button>
<div id="confirm-dialog" popover="manual" role="alertdialog" aria-labelledby="cd-title">
  <h2 id="cd-title">Delete account?</h2>
  <p>This cannot be undone.</p>
  <form method="dialog">
    <button type="button" commandfor="confirm-dialog" command="close">Cancel</button>
    <button type="submit" commandfor="confirm-dialog" command="close" data-variant="danger">
      Delete
    </button>
  </form>
</div>
```

`popover="manual"` prevents light-dismiss — required for destructive
confirmations where ESC-to-close is correct but outside-click-to-close
would be dangerous. The native `<dialog>` element is the other Baseline-
2026 option; pick `<dialog>` when you need true modality (background
inert) and `popover` when you want overlay behaviour without inert.

---

## When to still reach for JS

The partials above cover ~90 % of overlay patterns. Reach for JS only
when:

- The popover content depends on data that can't be pre-rendered (e.g.
  autocomplete fetching suggestions while the user types).
- The anchor is a moving target (drag-in-progress, animated scroll).
- The opening is gated on asynchronous permission (camera prompt,
  network-first auth check).

In those cases use a single `popover.showPopover()` call and let the
browser handle the rest — do NOT reach for `@floating-ui/react`
(slop-scanner pattern #28).

---

## Accessibility checklist

- [ ] `aria-haspopup` matches the popover type (`menu`, `listbox`,
      `dialog`, `grid`, `tree`)
- [ ] The popover has a `role` (`menu`, `listbox`, `tooltip`,
      `dialog`, `alertdialog`)
- [ ] Items inside menus / listboxes have their own role
      (`menuitem`, `option`, etc.)
- [ ] Keyboard: ESC closes (Popover API handles), Enter activates
      (native button behaviour)
- [ ] Focus returns to the invoker on close (Popover API handles when
      `commandfor` is used)
- [ ] Touch target: opener button ≥ 44×44 CSS px unless style frontmatter
      declares `touch_target: 24`
- [ ] Reduced-motion: entry animation respects `@media (prefers-reduced-motion: reduce)`
- [ ] Fallback: pre-Baseline browsers get a non-positioned but functional
      overlay (native `<dialog>` for dialogs, inline block for menus)
