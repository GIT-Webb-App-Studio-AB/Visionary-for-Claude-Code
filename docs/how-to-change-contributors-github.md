# How to remove a stale contributor from GitHub's UI

Context: after rewriting git history to remove "claude Claude" (or any other unwanted contributor), the GitHub contributors widget on the repo landing page can keep showing the old name for hours, days, or even weeks. This is a well-known UI-cache issue — the git history is already clean, only the rendered sidebar lags behind.

## Step 0 — confirm it really is a stale cache

The contributors sidebar and the API are two different data paths. If the API agrees with your clean history but the UI disagrees, it is definitely a cache issue (not a real git problem).

```bash
# authoritative list from git — what SHOULD be shown
gh api "repos/<owner>/<repo>/contributors" --jq '.[] | {login, contributions}'

# sanity check: no Co-Authored-By: Claude trailers anywhere
git log --all --format="%B" | grep -i "noreply@anthropic\|claude@anthropic"

# sanity check: no Claude commits by author
gh api "repos/<owner>/<repo>/commits?per_page=100&author=claude" --jq '. | length'
```

If the API returns a clean list but the UI still shows extra contributors, continue below.

## Step 1 — the branch-rename trick (try this first)

Renaming the default branch and renaming it back forces GitHub to re-process the branch's commit graph, which often kicks the contributors widget.

```bash
# check nothing will break
gh api "repos/<owner>/<repo>" --jq '{default_branch}'
gh pr list --repo <owner>/<repo> --state open

# rename main -> main-tmp -> main
gh api -X POST "repos/<owner>/<repo>/branches/main/rename" -f new_name=main-tmp
gh api -X POST "repos/<owner>/<repo>/branches/main-tmp/rename" -f new_name=main
```

This endpoint automatically updates the default branch, open PRs, and branch protection rules, so nothing breaks. Local clones are unaffected — they still track `origin/main`.

After running, hard-refresh the repo landing page (Ctrl+F5). If the widget is still stale, wait 5–15 minutes for the frontend cache and reload again.

Worked for this repo on 2026-04-21.

## Step 2 — toggle repo visibility (if step 1 didn't work)

Settings -> General -> Change visibility -> Private -> wait ~5 min -> Public. Documented as a cache-reset mechanism in community discussions but more disruptive than step 1 (breaks stargazers' private view briefly, triggers webhooks).

## Step 3 — GitHub Support (only guaranteed fix)

File a ticket at [support.github.com/contact](https://support.github.com/contact) under **Repositories > Graphs and Insights > Contributors Graph**. Include the API-vs-UI discrepancy as proof it is not just "wait for cache":

> Repository: https://github.com/<owner>/<repo>
>
> The contributors UI shows N contributors including "<stale name>", but `GET /repos/.../contributors` returns only M users. Every commit on main has author `<you>` mapping to `<your GitHub login>`. There are zero Co-Authored-By trailers, zero anthropic.com emails, and the history is clean.
>
> The discrepancy between API and UI has persisted for X days after history rewrite. Please recompute/refresh the contributors graph for this repository.

## Prevention — stop Claude Code from adding itself as co-author

Add to `~/.claude/settings.json` (or `%APPDATA%\claude-code\settings.json` on Windows):

```json
{
  "attribution": {
    "commit": "",
    "pr": ""
  }
}
```

This disables the `Co-Authored-By: Claude <noreply@anthropic.com>` trailer in future commits and PR bodies. It does not clean past history — for that, use `git filter-repo` or `git rebase -i --root` before pushing.

## What does NOT work

- **Making extra commits to "bust the cache"** — GitHub does not reprocess the contributors graph on every push. Commits like `chore: trigger contributor cache refresh` are no-ops for this problem.
- **The "AI contribution attribution" repo setting** — does not exist in GitHub. The community post claiming it does (#188915) is likely AI-hallucinated; the user who "confirmed the fix" did so 33 days after posting, consistent with a natural cache re-index, not a setting toggle.
- **`git push --force` after a rewrite** — necessary to get the clean history onto GitHub, but by itself does not refresh the UI widget.

## References

- [Incorrect AI contributor "claude Claude" showing in repository · #188915](https://github.com/orgs/community/discussions/188915)
- [I want to remove Claude AI name from Contributor list · #191565](https://github.com/orgs/community/discussions/191565) — source of the branch-rename trick
- [Contributor List not refreshing · #166884](https://github.com/orgs/community/discussions/166884)
- [Incorrect contributor showing on repository after history rewrite · #176218](https://github.com/orgs/community/discussions/176218)
- [Managing security and analysis settings · GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository) — confirms no "AI-powered features" section exists
