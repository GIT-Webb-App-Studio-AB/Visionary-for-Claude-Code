# Marketplace Submissions

Tracking submissions to the four Claude Code plugin marketplaces identified
in the deep-analysis report. Each row has a status + a reference to the
prepared submission artifact under `.marketplaces/`.

Submissions require external action (PRs, forms) by the project maintainer —
this directory holds the ready-to-go submission content.

## Status

| # | Marketplace | Submission path | Listing URL | Status |
|---|---|---|---|---|
| 1 | Anthropic official plugin marketplace | [`.marketplaces/anthropic-plugins.json`](./.marketplaces/anthropic-plugins.json) | https://github.com/anthropics/claude-plugins (hypothetical path) | Ready to submit |
| 2 | aitmpl.com | [`.marketplaces/aitmpl-submission.md`](./.marketplaces/aitmpl-submission.md) | https://aitmpl.com/plugins/visionary-claude | Ready to submit |
| 3 | claudemarketplaces.com | [`.marketplaces/claudemarketplaces-submission.md`](./.marketplaces/claudemarketplaces-submission.md) | https://claudemarketplaces.com/listings/visionary-claude | Ready to submit |
| 4 | ClaudePluginHub | [`.marketplaces/claude-plugin-hub-submission.md`](./.marketplaces/claude-plugin-hub-submission.md) | https://claudepluginhub.com/plugins/visionary-claude | Ready to submit |

## Submission procedure

Each submission is prepared as a structured artifact that matches (as best
we could ascertain in April 2026) the target marketplace's expected format.
Maintainer actions needed:

1. Review the generated content — tone, feature list, category, tags
2. Upload / PR / form-submit per the marketplace's channel
3. Update the status in this file from "Ready to submit" to "Submitted {date}"
   once the PR / form is confirmed
4. Update to "Listed {date}" when the plugin appears on the marketplace

## Why these four

From the deep-analysis report (2026-04-18):

> Marketplace-partnerships — Anthropic (101 plugins), ClaudePluginHub,
> claudemarketplaces.com, aitmpl.com.

Anthropic's official marketplace is the highest-value — the "101 plugins"
figure suggests an official curated registry with real install volume.
The other three are third-party aggregators with narrower audiences but
meaningful discoverability for a new plugin.

## Submission checklist (all four channels)

Before submitting to any marketplace:

- [x] `plugin.json` version is current and matches git tag (1.5.0)
- [x] `README.md` headline is tight, category-tagged, install-command visible
- [x] License is clear (Apache-2.0)
- [x] `docs/banner.svg` referenced in README is committed and 2:1 aspect ratio
- [x] At least one published benchmark result in `results/` (shows evidence,
      not just claims) — see `results/visionary-1.5.0.json` (18.35/20)
- [x] `CHANGELOG.md` has an entry for the published version (v1.5.0)
- [ ] Maintainer has pushed a signed git tag `v1.5.0` (maintainer action)
- [ ] Maintainer has created a GitHub release with release notes (maintainer)
- [ ] Each marketplace's submission artifact has been reviewed for tone
      (maintainer; content is pre-drafted)

## After first listing — maintenance

- Update each marketplace listing on every minor version bump
- Re-run the benchmark each release and append the JSON to `results/`
- Marketplaces that track star counts / installs get a one-line update in
  this `MARKETPLACES.md` quarterly
- A dead-listing SHOULD be deleted promptly, not left stale

## Why we didn't auto-submit

Auto-submission would require cross-marketplace authentication the plugin
doesn't have access to. Worth revisiting when/if Anthropic publishes an
official submission API — see
https://github.com/anthropics/claude-code/discussions (hypothetical).
