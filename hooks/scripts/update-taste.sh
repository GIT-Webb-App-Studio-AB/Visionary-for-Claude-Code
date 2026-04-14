#!/usr/bin/env bash
# update-taste.sh
# Detects rejection/positive signals in conversation messages and updates
# the project's system.md taste profile so future generations learn from feedback.
#
# Trigger:  UserPromptSubmit hook
# Reads:    CLAUDE_USER_MESSAGE env var (recent user message text)
# Writes:   {project_root}/system.md

set -euo pipefail

# Walk up from cwd to find the nearest directory containing package.json or .git
# NOTE: Searches for .git as well — handles projects without package.json
find_project_root() {
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/package.json" || -d "$dir/.git" ]]; then
      echo "$dir"
      return
    fi
    dir="$(dirname "$dir")"
  done
  echo "$PWD"
}

PROJECT_ROOT=$(find_project_root)
SYSTEM_MD="$PROJECT_ROOT/system.md"
TODAY=$(date +%Y-%m-%d)

# Get conversation text from env (hook provides this)
CONV_TEXT="${CLAUDE_USER_MESSAGE:-}"

if [[ -z "$CONV_TEXT" ]]; then
  exit 0
fi

# Convert to lowercase for case-insensitive matching
CONV_LOWER=$(echo "$CONV_TEXT" | tr '[:upper:]' '[:lower:]')

# ── Rejection detection ──────────────────────────────────────────────────────
REJECTION=false
if echo "$CONV_LOWER" | grep -qiE \
  "ugly|hate this|hate it|too generic|looks like every|start over|try again|completely different|too corporate|too playful|too dark|too minimal|boring|bland|basic|like chatgpt"; then
  REJECTION=true
fi

# ── Positive signal detection ────────────────────────────────────────────────
POSITIVE=false
if echo "$CONV_LOWER" | grep -qiE \
  "this is it|love this|perfect|exactly what i wanted|keep that style|more like this|love the typography|love the colors|love the motion|great|yes exactly"; then
  POSITIVE=true
fi

# No signals — exit silently with no output (Claude sees nothing)
if [[ "$REJECTION" == "false" && "$POSITIVE" == "false" ]]; then
  exit 0
fi

# ── Ensure system.md exists with correct structure ───────────────────────────
if [[ ! -f "$SYSTEM_MD" ]]; then
  cat > "$SYSTEM_MD" <<HEADER
## visionary-claude Taste Profile — updated $TODAY

### Rejected styles

### Rejected typography

### Rejected motion patterns

### Rejected colors

### Positive signals (reinforce)

### Design DNA (confirmed)

### Style history
HEADER
fi

# Ensure Style history section exists in older system.md files
if ! grep -q "### Style history" "$SYSTEM_MD" 2>/dev/null; then
  echo -e "\n### Style history" >> "$SYSTEM_MD"
fi

# ── Count existing rejections to check permanent-flag threshold ───────────────
REJECTION_COUNT=0
if [[ "$REJECTION" == "true" && -f "$SYSTEM_MD" ]]; then
  REJECTION_COUNT=$(grep -c "detected rejection" "$SYSTEM_MD" 2>/dev/null || echo "0")
fi

# Truncate quote to 80 chars for readability
SHORT_QUOTE="${CONV_TEXT:0:80}"

# ── Write rejection entry ─────────────────────────────────────────────────────
if [[ "$REJECTION" == "true" ]]; then
  # Append entry under "### Rejected styles"
  # Using BSD sed (macOS) compatible in-place edit with backup
  sed -i.bak "/### Rejected styles/a\\
- (detected rejection — $TODAY: \"$SHORT_QUOTE\")" "$SYSTEM_MD" || true
  rm -f "${SYSTEM_MD}.bak"

  # After 3+ rejections, append permanent-flag notice
  NEW_COUNT=$(grep -c "detected rejection" "$SYSTEM_MD" 2>/dev/null || echo "0")
  if [[ "$NEW_COUNT" -ge 3 ]]; then
    # Only add the flag line if not already present
    if ! grep -q "PERMANENTLY FLAGGED" "$SYSTEM_MD" 2>/dev/null; then
      sed -i.bak "/### Rejected styles/a\\
- *** PERMANENTLY FLAGGED — rejected 3+ times. Exclude from candidate set unless explicitly re-requested. ***" "$SYSTEM_MD" || true
      rm -f "${SYSTEM_MD}.bak"
    fi
  fi
fi

# ── Write positive signal entry ───────────────────────────────────────────────
if [[ "$POSITIVE" == "true" ]]; then
  sed -i.bak "/### Positive signals (reinforce)/a\\
- (detected approval — $TODAY: \"$SHORT_QUOTE\")" "$SYSTEM_MD" || true
  rm -f "${SYSTEM_MD}.bak"
fi

# ── Update the date stamp in the header ──────────────────────────────────────
sed -i.bak "s/Taste Profile — updated [0-9-]*/Taste Profile — updated $TODAY/" "$SYSTEM_MD" || true
rm -f "${SYSTEM_MD}.bak"

# ── Output additionalContext to Claude ────────────────────────────────────────
if [[ "$REJECTION" == "true" && "$POSITIVE" == "false" ]]; then
  echo '{"additionalContext": "Taste profile updated in system.md: rejection recorded. Future designs will exclude this style direction."}'
elif [[ "$POSITIVE" == "true" && "$REJECTION" == "false" ]]; then
  echo '{"additionalContext": "Taste profile updated in system.md: positive signal recorded. This style direction will be ranked higher for this project."}'
else
  echo '{"additionalContext": "Taste profile updated in system.md: mixed signals recorded (rejection + approval). Review system.md for context."}'
fi
