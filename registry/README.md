# Visionary shadcn/ui registry

Publish this `registry/` directory behind any static host and end users can install
any Visionary style into a shadcn/ui project with:

```bash
npx shadcn@latest add https://{host}/r/{style-id}.json
```

For example:

```bash
npx shadcn@latest add https://visionary.example.com/r/swiss-rationalism.json
npx shadcn@latest add https://visionary.example.com/r/liquid-glass-ios26.json
```

Each registry item is a `registry:style` — installing it writes the style's
OKLCH colors, typography, and radius tokens into the consumer's `globals.css`
under the standard shadcn `:root` / `.dark` blocks plus the Tailwind v4
`@theme` layer.

**202 styles available.**

Re-generate: `node scripts/build-shadcn-registry.mjs`.
