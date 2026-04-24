# Stack Guidelines — Platform-Idiomatic Code Generation

> Maps Visionary's spring token system to 15 framework-native animation APIs.
> Each stack section has 9 fields. All 5 spring tokens (micro, snappy, ui, gentle, bounce) are mapped for every stack.
> Motion safety (WCAG 2.3.3) is mandatory everywhere.

---

## Canonical Spring Tokens (reference)

```
micro:   { stiffness: 500, damping: 35, mass: 0.5 }
snappy:  { stiffness: 400, damping: 28, mass: 0.8 }
ui:      { stiffness: 300, damping: 25, mass: 1   }
gentle:  { stiffness: 180, damping: 22, mass: 1   }
bounce:  { stiffness: 400, damping: 10, mass: 0.8 }
```

---

## Canonical CSS Cascade (Sprint 4 — Baseline-2026 primitives)

**Every generated stylesheet MUST declare the cascade layers up-front and
scope component styles to prevent leak.** The loop's slop-scanner flags
patterns #27 (missing `@layer`) and #30 (non-scoped modal) as blockers.

```css
/* First line of every top-level stylesheet the generator emits. */
@layer reset, tokens, base, components, variants, utilities, overrides;

/* Component styles land inside @scope blocks so they cannot leak into
   nested user content or sibling components. */
@scope (.vn-card) to (.vn-card-nested) {
  h1 { font-size: var(--vn-step-5); }
  .meta { color: var(--vn-ink-muted); }
}
```

Why it matters:

- **`@layer`** gives us an explicit precedence order that overrides specificity.
  We lose unpredictable specificity wars between `@import`ed shadcn/ui primitives,
  Tailwind utilities, and bespoke component styles. Without layers, adding one
  utility class in the wrong place silently undoes three rules four imports up.
- **`@scope`** is the CSS-native replacement for BEM/CSS-Modules scoping. It
  isolates a component's internal styles from nested user content (e.g. a
  card rendering a third-party markdown block) without naming-convention
  discipline. The `to (...)` boundary names the inner-scope root.
- **Progressive enhancement**: `@scope` has uneven Chromium/Firefox/Safari
  support; gate any critical scoping with `@supports (selector(:scope))`.
  `@layer` is Baseline-2024 (universally supported) — no guard needed.

This cascade is MANDATORY for every stack below. Framework-specific notes
cover only the plumbing (where the stylesheet lives, how Vite/Next/Nuxt
inline it, etc.) — the cascade layers and scope boundaries themselves are
identical across React, Vue, Svelte, Angular, Astro, Laravel, Flutter-web,
SwiftUI-web-preview, HTML/CSS, Lit, Solid, Qwik.

---

## Canonical Form Controls (Sprint 4 — `field-sizing`)

Every `<textarea>` and growable `<select>` the generator emits MUST use
`field-sizing: content` with an `@supports` fallback so pre-Baseline
browsers get a sensible default:

```css
.vn-textarea {
  field-sizing: content;
  min-block-size: 3lh;           /* prevents collapse to 1 line */
  max-block-size: 30lh;          /* caps runaway growth */
}

@supports not (field-sizing: content) {
  .vn-textarea { min-block-size: 6rem; }
}
```

Rationale: `field-sizing: content` replaces the `rows={N}` + manual
auto-resize hook pattern. A zero-JS baseline that grows with content,
respects reading order, and doesn't require measuring-DOM shenanigans.
Slop-scanner pattern #29 flags `<textarea rows={...}>` without
field-sizing.

---

## Canonical Colour Contrast (Sprint 4 — `contrast-color()`)

When the generator needs a foreground that guarantees contrast against a
token-driven background, use the native `contrast-color()` with a fallback:

```css
.vn-button {
  background: var(--vn-bg-primary);
  color: contrast-color(var(--vn-bg-primary));
}

@supports not (color: contrast-color(black)) {
  .vn-button { color: var(--vn-fg-on-primary); }
}
```

Slop-scanner pattern #28 (`@floating-ui/react` import) and #31 (`useRef`
for dropdown position) flag places where the new native primitives should
be used instead — see `commands/apply.md` for the migration mapping.

---

## Web Frameworks

### 1. React

- **Detection**: `package.json` contains `"react"` or `"react-dom"` as dependency; `.jsx`/`.tsx` files present; no `next.config` (otherwise Next.js)
- **Component base**: shadcn/ui + Radix UI primitives. Import from `@radix-ui/*`. Use `class-variance-authority` for variant styling.
- **Motion system**: `motion/react` (v11+). NEVER import from `framer-motion`. Use `<motion.div>` with `transition` prop referencing spring tokens from `motion-tokens.ts`.
- **Spring token mapping**: Direct — tokens use the same `{ type: "spring", stiffness, damping, mass }` format natively. Import `spring` from `motion-tokens.ts` and pass as `transition`.
- **Motion safety**: `useReducedMotion()` hook from `motion/react`. Conditionally replace spring transitions with `{ duration: 0 }`. Wrap animated content in `<LazyMotion features={domAnimation}>` for tree-shaking.
- **Accessibility API**: Radix handles roles, focus trapping, keyboard navigation, and aria attributes. Use `aria-label`, `aria-describedby`, `role`. Focus management via `autoFocus` or Radix `FocusScope`. Touch targets: minimum 44px (web standard).
- **Typography loading**: CSS `@font-face` with `font-display: swap`. Use `fontsource` packages (`@fontsource/inter`) for self-hosted Google Fonts. Specify `latin-ext` subset for diacritics (å, ä, ö).
- **Color system**: CSS custom properties on `:root`. Follow shadcn/ui HSL token convention: `--primary: 222 47% 11%`. Use `oklch()` for perceptual uniformity when generating palettes.
- **Anti-patterns**: Never use `framer-motion` package name. Never hardcode `duration: 300ms` — use spring tokens. Never `useEffect` for animations — use Motion variants. Never inline styles for theming — use CSS custom properties. Never skip `key` prop on animated lists.

### 2. Next.js

- **Detection**: `next.config.js` or `next.config.mjs` or `next.config.ts` present; `package.json` contains `"next"`; `app/` or `pages/` directory structure
- **Component base**: shadcn/ui + Radix UI. Server Components by default — only add `"use client"` when component uses motion, hooks, or browser APIs.
- **Motion system**: `motion/react` with `"use client"` directive at top of file. Animated components MUST be Client Components. Use `<AnimatePresence>` for route transitions in `layout.tsx`.
- **Spring token mapping**: Same as React — direct `{ type: "spring", stiffness, damping, mass }` objects. Keep `motion-tokens.ts` in a shared `lib/` directory importable by Client Components.
- **Motion safety**: `useReducedMotion()` from `motion/react` in Client Components. For Server Components, use `@media (prefers-reduced-motion: reduce)` in CSS modules or Tailwind `motion-reduce:` variant.
- **Accessibility API**: Same as React (Radix). Server Components can render semantic HTML and ARIA statically. Client Components handle interactive a11y (focus management, keyboard events).
- **Typography loading**: `next/font` module — NEVER use `<link>` tags for Google Fonts. Use `const inter = Inter({ subsets: ['latin', 'latin-ext'] })` and apply via `className`. This enables automatic font optimization, self-hosting, and zero layout shift.
- **Color system**: CSS custom properties in `globals.css`. Tailwind `theme.extend.colors` referencing CSS variables. Follow shadcn/ui convention: `hsl(var(--primary))`.
- **Anti-patterns**: Never load fonts via `<link>` in `<head>` — use `next/font`. Never add `"use client"` to Server Components that do not need interactivity. Never import `motion/react` in Server Components. Never use `getServerSideProps` in App Router — use `async` Server Components. Never put animation logic in `layout.tsx` without `"use client"`.

### 3. Vue 3

- **Detection**: `package.json` contains `"vue"` (v3+); `.vue` files present; `vite.config.ts` with `@vitejs/plugin-vue`; no `nuxt.config` (otherwise Nuxt)
- **Component base**: Radix Vue (`radix-vue`) or Headless UI (`@headlessui/vue`). Use `<script setup lang="ts">` SFC syntax.
- **Motion system**: `@vueuse/motion` (motion/vue) or native `<Transition>`/`<TransitionGroup>` with CSS classes. For spring physics, use `@vueuse/motion` with `v-motion` directive.
- **Spring token mapping**: `@vueuse/motion` accepts `{ type: 'spring', stiffness, damping, mass }` — same format as canonical tokens. For native `<Transition>`: use CSS `cubic-bezier` approximations — micro: `150ms cubic-bezier(0.25,0.1,0.25,1)`, snappy: `200ms cubic-bezier(0.25,0.1,0.25,1)`, ui: `300ms cubic-bezier(0.4,0,0.2,1)`, gentle: `500ms cubic-bezier(0.4,0,0.2,1)`, bounce: `400ms cubic-bezier(0.68,-0.55,0.27,1.55)`.
- **Motion safety**: `usePreferredReducedMotion()` from VueUse. Conditionally disable transitions: `<Transition :css="!prefersReduced">`. In CSS: `@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }`.
- **Accessibility API**: Radix Vue provides roles, focus trapping, and keyboard navigation. Use `aria-*` attributes in templates. `useFocusTrap` from VueUse for custom dialogs. Touch targets: minimum 44px.
- **Typography loading**: Vite plugin `vite-plugin-webfont-dl` or `@fontsource` packages. Include `latin-ext` subset. Use `font-display: swap` in CSS.
- **Color system**: CSS custom properties. For Tailwind: extend `theme.colors` with CSS variable references. For non-Tailwind: provide/inject a reactive theme object.
- **Anti-patterns**: Never use Options API for new components — use `<script setup>`. Never use `v-html` for user content (XSS risk). Never mutate props directly. Never use `<Transition>` without `name` or CSS classes defined. Never use `$refs` for animation — use `v-motion` directive or template refs with `useMotion`.

### 4. Nuxt.js

- **Detection**: `nuxt.config.ts` or `nuxt.config.js` present; `package.json` contains `"nuxt"`; `.nuxt/` directory
- **Component base**: Nuxt UI (`@nuxt/ui`) for pre-styled components. Falls back to Radix Vue or Headless UI for custom designs.
- **Motion system**: `@vueuse/motion` with Nuxt module auto-import. `pageTransition` and `layoutTransition` in `nuxt.config.ts` for route animations. Native `<Transition>` for component-level motion.
- **Spring token mapping**: Same as Vue 3 — `@vueuse/motion` accepts `{ type: 'spring', stiffness, damping, mass }` directly. For `pageTransition` config, use CSS classes with cubic-bezier approximations matching each token.
- **Motion safety**: `usePreferredReducedMotion()` from VueUse (auto-imported via `@vueuse/nuxt`). Disable `pageTransition` conditionally. CSS `@media (prefers-reduced-motion: reduce)` in global stylesheet.
- **Accessibility API**: Nuxt UI includes built-in a11y. For custom components, same as Vue 3. Use `useHead()` for `<title>` and meta a11y. Touch targets: minimum 44px.
- **Typography loading**: `@nuxtjs/google-fonts` module in `nuxt.config.ts`. Configure with `{ families: { Inter: { wght: [400, 500, 600, 700] } }, subsets: ['latin-ext'], display: 'swap' }`. NEVER use `<link>` tags in `app.vue`.
- **Color system**: Nuxt UI uses `app.config.ts` with `ui.primary` and `ui.gray` color definitions. CSS custom properties in `assets/css/main.css`. Tailwind via `@nuxtjs/tailwindcss`.
- **Anti-patterns**: Never load fonts via `<link>` in `app.vue` — use `@nuxtjs/google-fonts` module. Never use `asyncData` (Nuxt 2 pattern) — use `useAsyncData` or `useFetch`. Never mix Nuxt UI and manual Radix Vue for the same component. Never define `pageTransition` without a reduced-motion fallback. Never create `plugins/` for what a module handles.

### 5. Svelte 5

- **Detection**: `package.json` contains `"svelte"` (v5+); `.svelte` files using runes (`$state`, `$derived`); `svelte.config.js` present
- **Component base**: Svelte native elements. Use Melt UI (`@melt-ui/svelte`) or Bits UI for accessible primitives.
- **Motion system**: Svelte `Spring` class (imported from `svelte/motion`). NOT the deprecated `spring()` function. Stiffness and damping are normalized to 0-1 range.
- **Spring token mapping**: Svelte normalizes stiffness and damping to 0-1. Mapping: micro → `new Spring(value, { stiffness: 0.5, damping: 0.7 })`, snappy → `(0.4, 0.55)`, ui → `(0.3, 0.5)`, gentle → `(0.18, 0.45)`, bounce → `(0.4, 0.2)`.
- **Motion safety**: Check `$state` with `window.matchMedia('(prefers-reduced-motion: reduce)')`. Svelte 5: `let reduced = $state(false)` initialized in `$effect`. When reduced, bypass Spring and set values directly.
- **Accessibility API**: Melt UI or Bits UI provide roles, focus management, keyboard navigation. Use `aria-*` attributes on elements. Svelte actions (`use:action`) for custom a11y behaviors. Touch targets: minimum 44px.
- **Typography loading**: `@fontsource` packages in `+layout.svelte`. Or `<link>` in `app.html` with `latin-ext` subset and `font-display=swap`. For SvelteKit: use `handle` hook to inject font preload headers.
- **Color system**: CSS custom properties in global `app.css`. Tailwind with `@tailwindcss/vite` plugin. Theme tokens via Svelte context with `setContext`/`getContext`.
- **Anti-patterns**: Never use deprecated `spring()` function — use `new Spring()` class (Svelte 5). Never use `$:` reactive declarations — use `$derived` rune. Never use `export let` for props — use `$props()`. Never use `<script context="module">` — use `<script module>`. Never animate with CSS transitions when Spring class is available for physics-based motion.

### 6. Angular

- **Detection**: `angular.json` or `angular-cli.json` present; `package.json` contains `"@angular/core"`; `.component.ts` files
- **Component base**: Angular CDK (`@angular/cdk`) for primitives. Angular Material for styled components. Use standalone components (not NgModules).
- **Motion system**: `@angular/animations` module with `BrowserAnimationsModule`. Define animations in component `animations` metadata array. Use `trigger()`, `state()`, `transition()`, `animate()`.
- **Spring token mapping**: Angular uses duration-based timing, not spring physics. Mapping: micro → `'150ms ease-out'`, snappy → `'200ms cubic-bezier(0.25,0.1,0.25,1)'`, ui → `'300ms cubic-bezier(0.4,0,0.2,1)'`, gentle → `'500ms cubic-bezier(0.4,0,0.2,1)'`, bounce → `'400ms cubic-bezier(0.68,-0.55,0.27,1.55)'`.
- **Motion safety**: Query `prefers-reduced-motion` via `MediaMatcher` from `@angular/cdk/layout`. Conditionally use `NoopAnimationsModule` instead of `BrowserAnimationsModule`. Or use `@media (prefers-reduced-motion: reduce)` to override animation durations to `0ms`.
- **Accessibility API**: Angular CDK a11y module: `FocusTrapFactory`, `LiveAnnouncer`, `FocusMonitor`. Use `@angular/cdk/a11y`. ARIA attributes via property binding `[attr.aria-label]`. Touch targets: minimum 48dp (Material Design spec).
- **Typography loading**: Google Fonts via `angular.json` styles array or CSS `@import` in `styles.scss`. Include `latin-ext` subset. Use `font-display: swap`. For performance: self-host with `@fontsource`.
- **Color system**: Angular Material theming with `@angular/material` SCSS API. Define `$theme` with `mat.define-theme()`. CSS custom properties for runtime theme switching.
- **Anti-patterns**: Never use NgModules for new components — use standalone components. Never define animations inline in templates. Never import `BrowserAnimationsModule` without a reduced-motion alternative. Never use `ViewEncapsulation.None` for component styles. Never use `setTimeout` for animation sequencing — use Angular animation callbacks.

### 7. Astro

- **Detection**: `astro.config.mjs` or `astro.config.ts` present; `package.json` contains `"astro"`; `.astro` files in `src/pages/`
- **Component base**: Framework islands — use React/Vue/Svelte/Solid components within `.astro` pages via `client:load` or `client:visible`. Static content in `.astro` templates.
- **Motion system**: View Transitions API via `<ViewTransitions />` in layout. CSS transitions/animations for static components. Framework-specific motion (motion/react, @vueuse/motion) inside interactive islands only.
- **Spring token mapping**: For CSS-only (static): use cubic-bezier approximations — micro: `150ms cubic-bezier(0.25,0.1,0.25,1)`, snappy: `200ms cubic-bezier(0.25,0.1,0.25,1)`, ui: `300ms cubic-bezier(0.4,0,0.2,1)`, gentle: `500ms cubic-bezier(0.4,0,0.2,1)`, bounce: `400ms cubic-bezier(0.68,-0.55,0.27,1.55)`. Inside framework islands: use that framework's native mapping.
- **Motion safety**: CSS `@media (prefers-reduced-motion: reduce)` for CSS animations. View Transitions API respects `prefers-reduced-motion` natively in supporting browsers. Inside islands: use framework's reduced-motion hook.
- **Accessibility API**: Semantic HTML in `.astro` templates. ARIA attributes directly on elements. For interactive islands: use the island framework's a11y primitives (Radix, Headless UI, etc.). Touch targets: minimum 44px.
- **Typography loading**: `@fontsource` packages imported in layout. Or `<link>` in `<head>` of layout with `font-display=swap` and `latin-ext` subset. Astro optimizes linked fonts automatically.
- **Color system**: CSS custom properties in global stylesheet. Tailwind via `@astrojs/tailwind` integration. Theme tokens defined in `:root`.
- **Anti-patterns**: Never use `client:load` when `client:visible` or `client:idle` suffice — hydration budget matters. Never put motion libraries in `.astro` components (they are server-rendered). Never skip `transition:name` on View Transition elements. Never use SPA patterns — Astro is MPA-first. Never bundle a full framework for a simple animation — use CSS.

### 8. SolidJS

- **Detection**: `package.json` contains `"solid-js"`; `.tsx`/`.jsx` files using `createSignal`, `createEffect`; `vite.config.ts` with `vite-plugin-solid`
- **Component base**: Kobalte (`@kobalte/core`) for accessible UI primitives. Follows Radix-like API patterns.
- **Motion system**: `solid-motionone` (Motion One for Solid) or Web Animations API via `element.animate()`. Use `<Motion>` component from `solid-motionone`.
- **Spring token mapping**: `solid-motionone` supports spring animations: `<Motion animate={{ opacity: 1 }} transition={{ easing: spring({ stiffness: 500, damping: 35, mass: 0.5 }) }}>`. Map each token by passing stiffness/damping/mass values to `spring()` from Motion One.
- **Motion safety**: `createMediaQuery` from `@solid-primitives/media` to detect `prefers-reduced-motion`. Conditionally set `transition` to `{ duration: 0 }`. Or CSS `@media (prefers-reduced-motion: reduce)`.
- **Accessibility API**: Kobalte provides roles, focus management, keyboard navigation, aria attributes. Use `@kobalte/core` components. Touch targets: minimum 44px.
- **Typography loading**: `@fontsource` packages. Or `<link>` in `index.html` with `latin-ext` subset and `font-display=swap`. For SolidStart: use `<Head>` component.
- **Color system**: CSS custom properties. Tailwind CSS integration. Reactive theme via `createSignal` for runtime switching.
- **Anti-patterns**: Never use React patterns (useState, useEffect) — use `createSignal`, `createEffect`. Never destructure props (kills reactivity) — access as `props.name`. Never use `solid-motionone` without checking bundle size — prefer Web Animations API for simple cases. Never wrap components in unnecessary `<Show>` — Solid does not re-render like React. Never use `className` — use `class`.

### 9. Lit / Web Components

- **Detection**: `package.json` contains `"lit"`; files extending `LitElement`; `.ts` files with `@customElement` decorator; `customElements.define()` calls
- **Component base**: Native custom elements extending `LitElement`. Use `@lit-labs/motion` for animate directive. Shadow DOM encapsulation by default.
- **Motion system**: `@lit-labs/motion` (animate directive) for FLIP-based transitions. CSS transitions within Shadow DOM for simple animations. Web Animations API (`this.shadowRoot.querySelector(...).animate()`) for programmatic control.
- **Spring token mapping**: CSS transitions within Shadow DOM using cubic-bezier approximations — micro: `150ms cubic-bezier(0.25,0.1,0.25,1)`, snappy: `200ms cubic-bezier(0.25,0.1,0.25,1)`, ui: `300ms cubic-bezier(0.4,0,0.2,1)`, gentle: `500ms cubic-bezier(0.4,0,0.2,1)`, bounce: `400ms cubic-bezier(0.68,-0.55,0.27,1.55)`. For Web Animations API: use `{ easing: 'cubic-bezier(...)' }` in keyframe options.
- **Motion safety**: CSS `@media (prefers-reduced-motion: reduce)` inside component's `static styles`. Or `window.matchMedia('(prefers-reduced-motion: reduce)')` check in `connectedCallback`.
- **Accessibility API**: Use `delegatesFocus: true` in Shadow DOM options for automatic focus delegation. Apply ARIA attributes in `render()`. Use `role`, `aria-label`, `tabindex` on host element. Touch targets: minimum 44px.
- **Typography loading**: `@import` in component's `static styles` or shared stylesheet adopted via `adoptedStyleSheets`. For Shadow DOM: fonts must be loaded in both light DOM and shadow DOM, or use `@font-face` in a shared constructable stylesheet.
- **Color system**: CSS custom properties pierce Shadow DOM — define on `:host` or document `:root`. Use `css` tagged template for component-scoped tokens. Expose customization via `::part()` selectors.
- **Anti-patterns**: Never forget `delegatesFocus: true` when component contains focusable elements. Never load fonts only inside Shadow DOM (they won't resolve). Never use `innerHTML` in render — use `html` tagged template. Never skip `static styles` in favor of inline styles. Never use global CSS that cannot pierce Shadow DOM — use custom properties for theming.

### 10. Laravel (Blade + Alpine.js)

- **Detection**: `composer.json` contains `"laravel/framework"`; `resources/views/` with `.blade.php` files; `artisan` file in root
- **Component base**: Blade components (`<x-component>`). Filament for admin panels. Alpine.js (`x-data`, `x-show`, `x-transition`) for interactivity.
- **Motion system**: Alpine.js `x-transition` directive for enter/leave animations. Livewire `wire:transition` for server-driven UI updates. CSS transitions for hover/focus states.
- **Spring token mapping**: Alpine.js uses CSS transition classes. Map via `x-transition` modifiers — micro: `x-transition:enter="transition duration-150 ease-out"`, snappy: `x-transition:enter="transition duration-200 ease-out"`, ui: `x-transition:enter="transition duration-300 ease-in-out"`, gentle: `x-transition:enter="transition duration-500 ease-in-out"`, bounce: custom CSS with `cubic-bezier(0.68,-0.55,0.27,1.55)` and `duration-[400ms]` (Tailwind arbitrary value).
- **Motion safety**: CSS `@media (prefers-reduced-motion: reduce)` in global stylesheet. Alpine.js: check `window.matchMedia` in `x-init` and conditionally skip transitions. Tailwind: `motion-reduce:transition-none` utility.
- **Accessibility API**: Blade components accept ARIA attributes as props. Alpine.js `x-bind:aria-expanded`, `x-bind:role`. Use `@focus-trap` Alpine plugin for modals. Livewire components: add ARIA in Blade template. Touch targets: minimum 44px.
- **Typography loading**: Vite asset pipeline — `@fontsource` packages imported in `resources/css/app.css`. Or Google Fonts `<link>` in `resources/views/layouts/app.blade.php` with `latin-ext` subset and `font-display=swap`.
- **Color system**: Tailwind CSS via `tailwind.config.js`. CSS custom properties in `resources/css/app.css`. Filament uses its own color system configurable in `AdminPanelProvider`.
- **Anti-patterns**: Never mix Alpine.js and jQuery in the same component. Never use Livewire `wire:transition` without a fallback for non-Livewire pages. Never inline complex JavaScript in Blade — extract to Alpine component. Never skip `@csrf` in forms. Never use `x-transition` without corresponding `x-show` or `x-if` — transitions need a conditional trigger.

---

## Mobile / Native

### 11. Flutter

- **Detection**: `pubspec.yaml` present; `lib/` directory with `.dart` files; `package.json` absent; `android/` and `ios/` directories
- **Component base**: Material 3 widgets (`MaterialApp`, `Scaffold`, `AppBar`). Cupertino widgets for iOS-specific UI. Custom widgets extending `StatefulWidget` or `StatelessWidget`.
- **Motion system**: `AnimationController` + `SpringSimulation` for spring physics. `AnimatedBuilder` or `AnimatedWidget` for declarative animation. `Hero` widget for shared element transitions.
- **Spring token mapping**: `SpringSimulation` accepts mass, stiffness, damping directly. Mapping: micro → `SpringDescription(mass: 0.5, stiffness: 500, damping: 35)`, snappy → `SpringDescription(mass: 0.8, stiffness: 400, damping: 28)`, ui → `SpringDescription(mass: 1, stiffness: 300, damping: 25)`, gentle → `SpringDescription(mass: 1, stiffness: 180, damping: 22)`, bounce → `SpringDescription(mass: 0.8, stiffness: 400, damping: 10)`.
- **Motion safety**: `MediaQuery.of(context).disableAnimations` or `MediaQueryData.disableAnimations`. Check `WidgetsBinding.instance.window.accessibilityFeatures.disableAnimations`. When true, set `AnimationController.duration` to `Duration.zero`.
- **Accessibility API**: `Semantics` widget for screen reader labels and roles. `MergeSemantics` to combine child semantics. `ExcludeSemantics` to hide decorative elements. Touch targets: minimum 48dp (Material Design guideline) — enforce via `SizedBox` or `ConstrainedBox` with `minWidth: 48, minHeight: 48`.
- **Typography loading**: Google Fonts via `google_fonts` package. `GoogleFonts.inter(textStyle: ...)`. For offline: bundle `.ttf` files in `assets/fonts/` and declare in `pubspec.yaml`.
- **Color system**: Material 3 `ColorScheme.fromSeed()` for dynamic theming. `ThemeData` with `colorSchemeSeed`. Custom `ThemeExtension` for additional tokens.
- **Anti-patterns**: Never use `setState` for complex animations — use `AnimationController`. Never hardcode pixel values — use `MediaQuery` and `LayoutBuilder` for responsive sizing. Never forget to dispose `AnimationController` in `dispose()`. Never use fixed `Duration` when spring physics are appropriate. Never set touch targets below 48dp — Material Design minimum.

### 12. SwiftUI

- **Detection**: `.xcodeproj` or `.xcworkspace` or `Package.swift` present; `.swift` files with `import SwiftUI`; `ContentView.swift` typical entry point
- **Component base**: Native SwiftUI views (`VStack`, `HStack`, `ZStack`, `List`, `NavigationStack`). No third-party component library needed.
- **Motion system**: `.animation()` modifier with `.spring()`. `withAnimation { }` for imperative triggers. `matchedGeometryEffect` for shared element transitions. `PhaseAnimator` and `KeyframeAnimator` for complex sequences (iOS 17+).
- **Spring token mapping**: SwiftUI `.spring()` has built-in presets and custom parameters. Mapping: micro → `.spring(.snappy)` (closest built-in) or `.spring(duration: 0.2, bounce: 0.1)`, snappy → `.spring(.snappy)` or `.spring(duration: 0.35, bounce: 0.15)`, ui → `.spring(.smooth)` or `.spring(duration: 0.5, bounce: 0.2)`, gentle → `.spring(.smooth(duration: 0.7))` or `.spring(duration: 0.7, bounce: 0.1)`, bounce → `.spring(.bouncy)` or `.spring(duration: 0.5, bounce: 0.4)`.
- **Motion safety**: `@Environment(\.accessibilityReduceMotion) var reduceMotion`. Conditionally apply: `.animation(reduceMotion ? .none : .spring(.smooth), value: trigger)`. For `withAnimation`: guard with `if !reduceMotion { withAnimation { ... } } else { ... }`.
- **Accessibility API**: `.accessibilityLabel()`, `.accessibilityHint()`, `.accessibilityRole()` modifiers. `.accessibilityAction()` for custom actions. `.focusable()` and `@FocusState` for keyboard/focus management. Touch targets: minimum 44pt (Apple HIG) — enforced via `.frame(minWidth: 44, minHeight: 44)`.
- **Typography loading**: System fonts via `Font.system()`. Custom fonts: add `.ttf`/`.otf` to Xcode target, register in `Info.plist` under `UIAppFonts`, use `Font.custom("FontName", size:)`.
- **Color system**: `Color("name")` from Asset Catalog with light/dark variants. `ShapeStyle` conformance for custom tokens. `@Environment(\.colorScheme)` for manual dark mode handling.
- **Anti-patterns**: Never use UIKit animation APIs in SwiftUI views — use `.animation()` modifier. Never apply `.animation()` without a `value` parameter (iOS 17 deprecation). Never forget `reduceMotion` check on animated views. Never use `GeometryReader` when `Layout` protocol suffices. Never set touch targets below 44pt — Apple HIG minimum.

### 13. Jetpack Compose

- **Detection**: `build.gradle.kts` or `build.gradle` with `compose` dependencies; `.kt` files with `@Composable` annotation; `androidx.compose.*` imports
- **Component base**: Material 3 (`androidx.compose.material3`). Compose foundation for low-level primitives. `Modifier` chain for styling and behavior.
- **Motion system**: `spring()` animation spec from `androidx.compose.animation.core`. `animateFloatAsState`, `animateDpAsState`, `AnimatedVisibility`, `AnimatedContent` for declarative animations. `Animatable` for imperative control.
- **Spring token mapping**: `spring(dampingRatio, stiffness)` — note: Compose uses `dampingRatio` (not raw damping) and has named constants. Mapping: micro → `spring(dampingRatio = 0.7f, stiffness = StiffnessHigh)`, snappy → `spring(dampingRatio = 0.55f, stiffness = StiffnessMediumLow)`, ui → `spring(dampingRatio = 0.5f, stiffness = StiffnessMedium)`, gentle → `spring(dampingRatio = 0.45f, stiffness = StiffnessLow)`, bounce → `spring(dampingRatio = 0.2f, stiffness = StiffnessMediumLow)`.
- **Motion safety**: Check `LocalReducedMotion.current` (Compose 1.6+). Or `ViewCompat.getAccessibilityManager(context).isEnabled` for system-level animation reduction. Wrap animated content: `if (reduceMotion) snap() else spring(...)`.
- **Accessibility API**: `Modifier.semantics { contentDescription = "..." }`, `Modifier.clickable(onClickLabel = "...")`. `FocusRequester` for focus management. `LocalFocusManager.current` for programmatic focus. Touch targets: minimum 48dp — enforced via `Modifier.sizeIn(minWidth = 48.dp, minHeight = 48.dp)` or `Modifier.minimumInteractiveComponentSize()`.
- **Typography loading**: Downloadable Fonts API via `FontFamily.Resolver`. Or bundle `.ttf` in `res/font/` and reference: `FontFamily(Font(R.font.inter_regular))`. Google Fonts via `GoogleFont` provider.
- **Color system**: Material 3 `MaterialTheme.colorScheme`. Dynamic color via `dynamicLightColorScheme()` / `dynamicDarkColorScheme()` (Android 12+). Custom `ColorScheme` for brand tokens.
- **Anti-patterns**: Never use View-based animation APIs (`ObjectAnimator`, `ValueAnimator`) in Compose. Never recompose for animation — use `animate*AsState`. Never set touch targets below 48dp — Material Design minimum. Never use `LaunchedEffect` for simple state animations — use `animateFloatAsState`. Never hardcode colors — use `MaterialTheme.colorScheme`.

---

## Cross-Platform + Vanilla

### 14. React Native

- **Detection**: `package.json` contains `"react-native"`; `metro.config.js` or `app.json` with `"expo"` present; `ios/` and `android/` directories or Expo project structure
- **Component base**: React Native core (`View`, `Text`, `Pressable`, `ScrollView`). UI library: Tamagui, NativeWind, or React Native Paper. For Expo: `expo-router` for navigation.
- **Motion system**: `react-native-reanimated` v3 (`withSpring`, `useAnimatedStyle`, `useSharedValue`). `react-native-reanimated` is the standard — not `Animated` from React Native core.
- **Spring token mapping**: `withSpring` accepts `{ stiffness, damping, mass }` — same format as canonical Visionary tokens. Direct mapping: micro → `withSpring(target, { stiffness: 500, damping: 35, mass: 0.5 })`, snappy → `{ stiffness: 400, damping: 28, mass: 0.8 }`, ui → `{ stiffness: 300, damping: 25, mass: 1 }`, gentle → `{ stiffness: 180, damping: 22, mass: 1 }`, bounce → `{ stiffness: 400, damping: 10, mass: 0.8 }`.
- **Motion safety**: `import { AccessibilityInfo } from 'react-native'`. `AccessibilityInfo.isReduceMotionEnabled()` returns a promise. Or `useReducedMotion()` hook from `react-native-reanimated`. When true, use `withTiming(target, { duration: 0 })` instead of `withSpring`.
- **Accessibility API**: `accessible={true}`, `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` props on core components. `AccessibilityInfo.announceForAccessibility()` for live announcements. Touch targets: minimum 48dp (Android) / 44pt (iOS) — use `hitSlop` prop or `minHeight`/`minWidth` style.
- **Typography loading**: Expo: `expo-font` with `useFonts` hook. Bare RN: `react-native-asset` to link font files. Load from `assets/fonts/`. Include full character set for diacritics.
- **Color system**: React Native `StyleSheet` or NativeWind (Tailwind for RN). Theme via React Context or Tamagui's `createTamagui`. `useColorScheme()` for system dark mode detection.
- **Anti-patterns**: Never use `Animated` from `react-native` core — use `react-native-reanimated`. Never run animations on the JS thread — `reanimated` runs on UI thread via worklets. Never use `transform: [{ translateX: value }]` without shared values. Never set touch targets below 48dp/44pt. Never use `opacity: 0` to hide elements from screen readers — use `accessibilityElementsHidden` or `importantForAccessibility="no-hide-descendants"`.

### 15. Vanilla JS / HTML + CSS (continued below)

---

## Version-Specific Emitters

When `hooks/scripts/detect-framework.mjs` reports a specific framework version,
the generator MUST emit the syntax that matches. These sections are the
authoritative mappings for the version-sensitive surfaces.

### Tailwind v3 vs v4 — Dual Emitter

`detect-framework.mjs` writes `styling.version` and appends `@theme` / Oxide
plugin detection. Choose emitter based on the detected variant.

#### v3 emitter (existing projects — backward compatibility)

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'visionary-primary': 'var(--visionary-color-primary)',
      },
      fontFamily: {
        display: ['Geist', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

```css
/* globals.css — v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --accent: 210 50% 50%;
  --visionary-color-primary: #0066FF;
}
```

#### v4 emitter (default for new projects — 5× faster, oklch-first)

```css
/* app.css — v4 (CSS-first, NO tailwind.config.js) */
@import "tailwindcss";

@theme {
  --color-accent: oklch(0.62 0.18 252);
  --color-visionary-primary: oklch(0.62 0.18 252);
  --font-display: "Geist", system-ui, sans-serif;
  --radius-md: 12px;
  --spacing-section: 4rem;
}

/* Variants on top of the theme */
@variant dark (&:where(.dark, .dark *));
```

`vite.config.ts` (or `postcss.config.js`) swap:

```ts
// v4 Vite
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [tailwindcss()] });
```

```js
// v4 PostCSS (non-Vite)
module.exports = { plugins: { "@tailwindcss/postcss": {} } };
```

#### Emitter-selection rule

Read `.visionary-cache/detected-framework.json` (or `CLAUDE_PLUGIN_DATA/visionary-cache/…`):

- `styling.system === "tailwind"` AND `styling.notes` contains `"v4"` → v4 emitter
- `styling.system === "tailwind"` AND major < 4 → v3 emitter
- No tailwind detected → fall back to CSS Modules / vanilla CSS with
  `--visionary-color-*` custom properties

NEVER mix v3 and v4 syntax in the same project — `@theme` blocks break v3 JIT,
and `tailwind.config.js` is silently ignored by v4 Oxide.

#### Differences worth memorizing

| Concept | v3 | v4 |
|---|---|---|
| Config location | `tailwind.config.js` | `@theme` block in CSS |
| Content scanning | `content: [...]` array required | Automatic (Oxide) |
| Color format | hex / hsl custom-props | oklch native |
| Plugin | `tailwindcss` (PostCSS) | `@tailwindcss/vite` / `@tailwindcss/postcss` |
| CSS nesting | requires `tailwindcss/nesting` | Native CSS nesting |
| Container queries | plugin | Built-in `@container` |
| Opacity modifier | `bg-red-500/50` + `<alpha-value>` | Native `color-mix()` |

---

### Next.js 16 — Cache Components + React Compiler + `<Form>`

`detect-framework.mjs` flags Next 16 when `cacheComponents: true` is in
`next.config.*` OR `next` major ≥ 16. Emit the v16 syntax below. On v15 or
earlier, fall back to the pre-16 patterns in section 2 above.

#### Cache Components (default in v16)

```tsx
// app/dashboard/page.tsx — Cache Components default behavior
import { Suspense } from "react";
import { Dashboard } from "@/components/Dashboard";

// No more `force-dynamic` / `revalidate` ceremony for most pages.
// Static by default; explicitly opt into dynamic with `use cache: false`
// or by reading cookies/headers inside a child component.
export default async function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
```

```tsx
// Opt out of caching for a specific leaf — no page-level directive needed
"use cache: false";

export async function LiveStats() {
  const data = await fetch("/api/stats", { cache: "no-store" }).then(r => r.json());
  return <div>{data.count}</div>;
}
```

#### React Compiler (stable in v16 — delete your useMemo / useCallback chain)

```tsx
// Before (React 18 / Next 14-15 era)
function Card({ item }: { item: Item }) {
  const label = useMemo(() => formatLabel(item), [item]);
  const onClick = useCallback(() => select(item.id), [item.id]);
  return <button onClick={onClick}>{label}</button>;
}

// After (Next 16 with compiler stable) — JUST DELETE THEM
function Card({ item }: { item: Item }) {
  const label = formatLabel(item);
  const onClick = () => select(item.id);
  return <button onClick={onClick}>{label}</button>;
}
```

Generated code MUST NOT add `useMemo` / `useCallback` / `React.memo` in Next
16 projects — the compiler handles it, and manual memoization actively hurts
(runs before compiler optimizations, introducing dead code).

#### `<Form>` component — progressive-enhancement forms

```tsx
// app/search/page.tsx
import Form from "next/form";

export default function SearchPage() {
  return (
    // <Form> prefetches the action route, handles client-nav if JS is on,
    // and falls back to real <form> submission if not. Beats <form action=...>
    // for any search / filter UI.
    <Form action="/search">
      <input name="q" type="search" aria-label="Search" />
      <button type="submit">Search</button>
    </Form>
  );
}
```

#### PPR (Partial Prerendering) — default, no opt-in needed

Don't add `experimental: { ppr: true }` to `next.config.*` — it's the v16
default. Remove the flag if migrating from v15.

#### Turbopack — default dev + build

`next dev` and `next build` both run Turbopack by default in v16. Don't emit
`--turbo` flags in scripts (no-op and will warn).

#### What changed in the generated code

| Surface | v15 pattern | v16 pattern |
|---|---|---|
| Memoization | `useMemo`, `useCallback`, `React.memo` | **Omit — compiler handles it** |
| Cache opt-in | `fetch(..., { next: { revalidate } })` | `"use cache"` directive OR implicit via Cache Components |
| Dynamic opt-in | `export const dynamic = "force-dynamic"` | Read cookies/headers in a child component, OR `"use cache: false"` |
| Forms | `<form action={...}>` or manual `router.push` | `<Form action="/route">` from `next/form` |
| Params type | `params: { id: string }` | `params: Promise<{ id: string }>` (await it) |

```tsx
// v16 async params (breaking change from v15)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

### 15. Vanilla JS / HTML + CSS

- **Detection**: No `package.json` with framework dependencies; plain `.html`, `.css`, `.js` files; no build tool config (or only simple bundler like Parcel/esbuild); `<script>` tags in HTML
- **Component base**: Semantic HTML elements (`<nav>`, `<main>`, `<article>`, `<dialog>`, `<details>`). No component library — build with native elements and ARIA attributes.
- **Motion system**: CSS `transition` and `@keyframes` animation. Web Animations API (`element.animate()`) for programmatic control. No JavaScript animation library by default.
- **Spring token mapping**: CSS cubic-bezier approximations with duration. Mapping: micro → `transition: transform 150ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 150ms ease`, snappy → `transition: transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 200ms ease`, ui → `transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease`, gentle → `transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms ease`, bounce → `transition: transform 400ms cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 400ms ease`. Define as CSS custom properties: `--spring-micro: 150ms cubic-bezier(0.25, 0.1, 0.25, 1)`.
- **Motion safety**: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }`. In JS: `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
- **Accessibility API**: Native HTML semantics (`<button>`, `<nav>`, `<dialog>`). ARIA attributes: `aria-label`, `aria-expanded`, `aria-live`, `role`. Focus management: `element.focus()`, `tabindex`, `inert` attribute. Touch targets: minimum 44px — set via `min-width` and `min-height` in CSS.
- **Typography loading**: `<link rel="preconnect" href="https://fonts.googleapis.com">` then `<link>` to Google Fonts with `&subset=latin-ext` and `&display=swap`. Or self-host with `@font-face` and `font-display: swap`. Preload critical fonts with `<link rel="preload" as="font">`.
- **Color system**: CSS custom properties on `:root`. Dark mode via `@media (prefers-color-scheme: dark)` overriding `:root` variables. Use `oklch()` or `hsl()` for palette generation.
- **Anti-patterns**: Never use `<div>` where semantic elements exist (`<button>`, `<nav>`, `<main>`). Never animate `width`/`height` — animate `transform` and `opacity` for GPU compositing. Never use `setTimeout`/`setInterval` for animations — use CSS transitions or `requestAnimationFrame`. Never use `!important` for animation properties outside the reduced-motion media query. Never use `transition: all` in production — specify exact properties for performance.
