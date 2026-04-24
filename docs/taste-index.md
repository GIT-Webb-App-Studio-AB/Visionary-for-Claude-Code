# Taste index — shareable `.taste` profiles

**Status:** MVP from Sprint 07. Index source + initial seed shipped; the
community-PR workflow is live but expected to fill out over months, not
weeks.

Visionary's moat is not the generator — it's that taste travels. The taste
index is the opt-in platform where designers can publish the `.taste`
profiles they've cultivated in their own projects, so any other Visionary
user can pull them in as an opinionated starting point.

---

## The shape of the index

The index is a **JSON file** hosted in a public Git repo,
[`visionary-tastes`](https://github.com/screamm/visionary-tastes). It is
not a live API — it's a static file, versioned in Git, updated via pull
request. That gives us:

- Full change history, attribution, and review
- Zero infrastructure cost
- Clear security posture (every listed URL passes through the same 50 KB /
  allowlisted-host / redirect-capped fetcher as direct URL imports)

### `index.json` shape

```jsonc
{
  "$schema": "https://visionary-claude.dev/schema/taste-index.json",
  "version": "1.0.0",
  "updated_at": "2026-04-22T00:00:00Z",
  "entries": [
    {
      "handle": "dieter-rams",
      "author": "Bundled",
      "description": "Ten principles of good design. Restraint. Invisible UI.",
      "inherits_from": [],
      "tags": ["minimalism", "industrial-honesty"],
      "url": "https://raw.githubusercontent.com/screamm/visionary-tastes/main/packs/dieter-rams.taste"
    },
    {
      "handle": "pawelk-2026-04",
      "author": "Pawel K.",
      "description": "Editorial-forward, Bauhaus-adjacent, motion-restrained.",
      "inherits_from": [],
      "tags": ["editorial", "swiss"],
      "url": "https://raw.githubusercontent.com/screamm/visionary-tastes/main/community/pawelk-2026-04.taste"
    }
  ]
}
```

Each entry is keyed by `handle` (unique, lowercased, matches the
`.taste` file's own `handle`). The `url` is where the `.taste` file
itself lives — it must be on the fetcher's allowlist
(`raw.githubusercontent.com`, `gist.githubusercontent.com`, etc.).

---

## Consumer commands

All three commands resolve against the same index. Set
`VISIONARY_TASTE_INDEX` to point at a mirror or a fork.

### Browse

```bash
/visionary-taste browse
/visionary-taste browse --search minimalism
```

Fetches `index.json`, lists entries with description + inherits_from.
`--search` filters as a plain substring match across the whole entry.

### Import by handle

```bash
/visionary-taste import pawelk-2026-04
/visionary-taste import pawelk-2026-04 --dry-run
```

Resolution order:

1. `<projectRoot>/designers/<handle>.taste`
2. `<pluginRoot>/designers/<handle>.taste` (bundled designer packs)
3. Community index (unless `--no-network`)

The resolved URL is then fetched through the normal allowlisted fetcher.

### Inherits-from by handle

```toml
# your-team.taste
inherits_from = ["dieter-rams", "pawelk-2026-04"]
```

Resolves handles the same way as `import`. Network access is required if
the handle isn't in a local `designers/` directory.

---

## Contributing a profile to the community index

**Prerequisites.** A `.taste` file you've authored and are willing to
publish under the repo's license (MIT). The file must:

- Pass `/visionary-taste import <file> --dry-run` without errors
- Have `handle` unique across existing entries
- Carry a `[privacy]` table if your file was generated from project data
  (`visionary taste export` applies scrubs by default; double-check the
  output before submitting)
- Contain **no embedded secrets** — PR review will reject anything that
  looks like an API token, internal hostname, or NDA-adjacent quote

**Workflow.**

1. Fork `screamm/visionary-tastes`.
2. Add your `<handle>.taste` under `community/`.
3. Add an entry to `index.json` (alphabetical by handle).
4. Open a PR. Automated CI will run schema validation and the scrubber.
5. A maintainer reviews for content/attribution and merges.

**Validation checklist CI runs:**

- TOML parses cleanly
- `schema_version` ≤ `1.0.0`
- Handle regex matches and doesn't collide
- `inherits_from` entries all resolve (no dangling references)
- No URL-like substrings inside `evidence` / `reason` / `constitution`
  (caught by `scripts/validate-taste-privacy.mjs` — stub for Sprint 8)
- File size under 16 KB

---

## Non-goals for v1.0

- No live API / search backend — the index is a static JSON file.
- No ratings, stars, or popularity metrics. Those push curation toward
  fashion rather than taste.
- No automatic suggestions in the generator UI. The flywheel is opt-in;
  `/visionary-taste import` is a deliberate user action.
- No monetisation or paid tiers. The index is permanently free and its
  license is permissive.

These may be revisited once the community seed grows past ~30 profiles.
Until then, static + conservative is the right default.

---

## Why this takes months

Visionary ships with 5 designer-pack seed profiles. That's the floor. The
valuable part — user-authored, hard-to-reproduce taste — only exists after
designers use the tool for long enough to grow an opinion worth sharing.
Sprint 07 delivers the *mechanism*; the content arrives on its own
timeline, primarily through dogfooding.

If you're reading this six months after Sprint 07 and the index is still
five entries, that's a flywheel-content problem, not a format problem.
Revisit `docs/sprints/sprint-07-platform-play.md` § Gemensamma risker —
"Community-repo för tastes saknar aktivitet" is called out explicitly.
