# Release process — visionary-claude

End-users get updates automatically via a `SessionStart` hook that runs
`claude plugin marketplace update` + `claude plugin update visionary-claude`
in the background (rate-limited to once per 24h). A downloaded update
activates on the **next Claude Code restart**.

## 1. Bump version

Three places must match:

| File | Field |
| --- | --- |
| `.claude-plugin/plugin.json` | `version` |
| `.claude-plugin/marketplace.json` | `metadata.version` |
| `.claude-plugin/marketplace.json` | `plugins[0].version` |

Also update `CHANGELOG.md`.

## 2. Publish

```bash
git add -A
git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

The marketplace source is this Git repo, so the tagged commit becomes
the new version for every user whose marketplace points at it.

## 3. How users receive the update

1. `SessionStart` fires the auto-update hook (at most once per 24h per user).
2. Hook spawns a detached child that runs:
   - `claude plugin marketplace update visionary-marketplace`
   - `claude plugin update visionary-claude`
3. New version is downloaded in the background.
4. It **activates on next Claude Code restart** (the CLI requires this).

### Force an update immediately

```bash
claude plugin marketplace update visionary-marketplace
claude plugin update visionary-claude
# restart Claude Code
```

### Disable auto-update (per user)

```bash
export VISIONARY_NO_AUTOUPDATE=1
```

### Inspect the auto-update log

Log lives in `$CLAUDE_PLUGIN_DATA/autoupdate.log` (falls back to the
OS tmp dir if the env var isn't set). One line per run:

```
[2026-04-21T10:32:14.812Z] check-start
[2026-04-21T10:32:15.934Z] marketplace exit=0 :: Updated marketplace
[2026-04-21T10:32:17.118Z] update exit=0 :: Already up to date
[2026-04-21T10:32:17.120Z] check-end
```

## 4. Local-dev marketplace (maintainer only)

If your marketplace source is a local directory (e.g. `claude plugin marketplace list`
shows `Source: Directory (...)`), files in that directory must be copied
from the released repo for `marketplace update` to pick up the new version.
This only affects the maintainer — end users install from the GitHub source.

## 5. Verify a release

```bash
claude plugin list | grep visionary-claude          # installed version
claude plugin marketplace update visionary-marketplace
claude plugin update visionary-claude
# restart Claude Code
claude plugin list | grep visionary-claude          # should show the new version
```
