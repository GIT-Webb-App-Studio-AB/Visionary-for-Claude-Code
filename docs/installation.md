# Installation Guide

Complete installation reference for visionary-claude.

## Prerequisites

- Claude Code ≥ 1.0.0
- Node.js ≥ 18
- No Python required — shell + Node only
- macOS, Linux, or Windows (WSL recommended on Windows)

---

## Option A -- GitHub Marketplace (Recommended)

```bash
# Add the GitHub repo as a marketplace source
claude plugin marketplace add GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code

# Install the plugin
claude plugin install visionary-claude
```

Verify: type `/visionary` in a Claude Code session.

---

## Option B -- Local Development

### Session-only (no installation, for quick testing)

```bash
claude --plugin-dir /path/to/visionary-claude
```

### Local marketplace (persistent installation from local path)

```bash
# Register the local directory as a marketplace
claude plugin marketplace add /path/to/visionary-claude

# Install
claude plugin install visionary-claude
```

---

## Option C -- Scope Variants

Control where the plugin is installed using the `--scope` flag.

### User scope (all projects -- default)

```bash
claude plugin install visionary-claude --scope user
```

### Project scope (current project only)

```bash
claude plugin install visionary-claude --scope project
```

> **Team recommendation:** Use `--scope project` and commit `.claude/settings.json` to version control.

---

## Option D -- Enterprise / Air-Gapped

```bash
# Download the plugin archive
curl -L https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code/archive/refs/tags/v1.0.0.tar.gz \
  -o visionary-claude-v1.0.0.tar.gz

# Extract and load
tar -xzf visionary-claude-v1.0.0.tar.gz
claude --plugin-dir ./visionary-claude-1.0.0
```

---

## Verification

After installation, verify the plugin is working correctly:

### 1. Check plugin is loaded

```
/visionary:generating-visual-designs
```

Expected: Plugin description displayed.

### 2. Check framework detection ran

```bash
cat .visionary-cache/detected-framework.json
```

Expected: JSON file with `framework` field populated.

### 3. Run a test generation

```
Build a login form for a fintech app
```

Expected: Design Reasoning Brief shown before code generation. Style should be fintech-appropriate (not generic/pop).

### 4. Verify WCAG patterns in output

Check that generated CSS includes:
```bash
grep "focus-visible\|prefers-reduced-motion" [generated-file.css]
```

Expected: Both patterns present.

---

## Troubleshooting

### `/plugin marketplace add` command not found

Requires Claude Code ≥ 1.0.0 with marketplace support. Check your version:

```bash
claude --version
```

If on an older version, use Option B (local development) instead.

### `detected-framework.json` not created

The `detect-framework.sh` hook runs at `SessionStart`. Verify it is registered:

```bash
cat visionary-claude/hooks/hooks.json | grep SessionStart
```

If the hook is missing, check that `hooks/hooks.json` exists and the `SessionStart` entry points to `detect-framework.sh`.

> **Known limitation:** `CLAUDE_PLUGIN_ROOT` is not available in `SessionStart` hooks (Claude Code bug #27145). The script uses `pwd`-based project root detection instead.

### `system.md` not updating on rejection

The `update-taste.sh` hook runs at `Stop`. After saying "I hate this", end the session and check:

```bash
cat .visionary-cache/system.md
```

Expected: Rejection entry in the `## Rejected Styles` section.

### Generated code uses `framer-motion` instead of `motion/react`

The SKILL.md Generation Rules section explicitly prohibits `framer-motion`. If you see it:

1. Check that `visionary-claude/skills/visionary/SKILL.md` is correctly loaded
2. Verify the Generation Rules section contains: `NEVER: import { motion } from 'framer-motion'`
3. Restart the Claude Code session

### Plugin not activating for UI-related requests

The skill activates on requests containing: `/visionary`, `/ui`, `/design`, `/component`, `/motion`, or UI-intent phrases. If it is not activating:

1. Use an explicit trigger: `/visionary Build a hero section`
2. Or prefix your request: "Using visionary-claude, build a hero section"

---

## Uninstalling

### Remove user-scope installation

```bash
claude plugin uninstall visionary-claude --scope user
```

### Remove project-scope installation

```bash
claude plugin uninstall visionary-claude --scope project
```

### Remove taste calibration data

```bash
rm -rf .visionary-cache/
```

> **Note:** Removing `.visionary-cache/` deletes all learned taste preferences for this project. This cannot be undone.
