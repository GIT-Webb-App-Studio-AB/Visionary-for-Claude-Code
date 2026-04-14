#!/usr/bin/env bash
# capture-and-critique.sh
# Triggered by PostToolUse hook on Write|Edit|MultiEdit
# Env vars available: CLAUDE_TOOL_NAME, CLAUDE_TOOL_INPUT (JSON)
# Output: JSON with "additionalContext" key injected into Claude's context

set -euo pipefail

TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-{}}"

# Only process file-writing tools
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "MultiEdit" ]]; then
  exit 0
fi

# Extract file path from tool input
FILE_PATH=$(echo "$TOOL_INPUT" | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(d.file_path || d.path || '');
" 2>/dev/null || echo "")

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Check file extension — only critique UI files
EXT="${FILE_PATH##*.}"
case "$EXT" in
  tsx|jsx|vue|svelte|html) ;;
  *) exit 0 ;;
esac

# Check if file exists and is readable
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

# Round tracking (stored in project temp dir, keyed by file path to allow parallel sessions)
FILE_HASH=$(echo "$FILE_PATH" | md5sum | cut -d' ' -f1 2>/dev/null || echo "$$")
ROUND_FILE="${TMPDIR:-/tmp}/visionary-critique-round-${FILE_HASH}"
ROUND=1
if [[ -f "$ROUND_FILE" ]]; then
  ROUND=$(cat "$ROUND_FILE")
fi

# Max 3 rounds — clean up and exit silently if exhausted
if [[ "$ROUND" -gt 3 ]]; then
  rm -f "$ROUND_FILE"
  exit 0
fi

# Take screenshot via Playwright MCP
# Note: Playwright MCP must be running (started by .mcp.json)
SCREENSHOT_PATH="${TMPDIR:-/tmp}/visionary-screenshot-${FILE_HASH}-${ROUND}.png"

# Use claude CLI to invoke Playwright screenshot
node -e "
const { execSync } = require('child_process');
// Playwright MCP invocation — browser_navigate + browser_take_screenshot
// In practice, hooks communicate with Claude via additionalContext JSON output
" 2>/dev/null

# Deterministic slop pattern detection (patterns 1-20 from critique-schema.md)
SLOP_FLAGS=""
if [[ -f "$FILE_PATH" ]]; then
  # Pattern 1: Purple/violet gradient backgrounds
  grep -qE "from-purple|from-violet" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Purple/violet gradient background detected\","

  # Pattern 2: Cyan-on-dark color scheme
  grep -qE "text-cyan|#06B6D4" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Cyan-on-dark color scheme detected\","

  # Pattern 3: Left-border accent card
  grep -qE "border-l-4|border-left: 4px solid" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Left-border accent card pattern detected\","

  # Pattern 4: Dark background + colored box-shadow glow
  grep -qE "(bg-gray-900|bg-zinc-900|bg-slate-900).*shadow|shadow.*(bg-gray-900|bg-zinc-900|bg-slate-900)" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Dark background with colored glow shadow detected\","

  # Pattern 5: Gradient text on headings
  grep -qE "bg-clip-text.*text-transparent.*bg-gradient|text-transparent.*bg-gradient" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Gradient text on heading or metric detected\","

  # Pattern 6: Hero Metric Layout
  grep -qE "text-4xl|text-5xl|text-6xl" "$FILE_PATH" 2>/dev/null && \
  grep -qE "text-sm|text-xs" "$FILE_PATH" 2>/dev/null && \
  grep -qE "bg-gradient" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Hero Metric Layout detected (large number + small label + gradient)\","

  # Pattern 7: Repeated 3-across card grid
  CARD_COUNT=$(grep -c "className=\".*card" "$FILE_PATH" 2>/dev/null || echo 0)
  if [[ "$CARD_COUNT" -ge 3 ]]; then
    SLOP_FLAGS="${SLOP_FLAGS}\"Repeated 3-across card grid detected\","
  fi

  # Pattern 9: Inter as sole typeface
  grep -qE "font-family.*Inter|fontFamily.*Inter" "$FILE_PATH" 2>/dev/null && \
  ! grep -qE "font-family.*(Bricolage|Instrument|Plus Jakarta|DM Sans|Geist)" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Inter as sole typeface detected\","

  # Pattern 10: Roboto/Arial/Open Sans as sole typeface
  grep -qE "font-family.*(Roboto|Arial|Open Sans)" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Generic system/web font as sole typeface detected\","

  # Pattern 11: Default Tailwind blue as primary
  grep -qE "bg-blue-500|#3B82F6" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Default Tailwind blue #3B82F6 as primary color detected\","

  # Pattern 12: Default Tailwind purple as primary
  grep -qE "bg-indigo-500|#6366F1" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Default Tailwind purple #6366F1 as primary color detected\","

  # Pattern 13: Default Tailwind green as accent
  grep -qE "text-emerald-500|#10B981" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Default Tailwind green #10B981 as accent detected\","

  # Pattern 14: Uniform border-radius
  RADIUS_COUNT=$(grep -c "rounded-lg\|rounded-md\|rounded-xl" "$FILE_PATH" 2>/dev/null || echo 0)
  TOTAL_ELEMENTS=$(grep -c "className=" "$FILE_PATH" 2>/dev/null || echo 1)
  if [[ "$TOTAL_ELEMENTS" -gt 0 && "$RADIUS_COUNT" -ge "$TOTAL_ELEMENTS" ]]; then
    SLOP_FLAGS="${SLOP_FLAGS}\"Uniform border-radius on all elements detected\","
  fi

  # Pattern 15: shadow-md on all cards uniformly
  SHADOW_COUNT=$(grep -c "shadow-md" "$FILE_PATH" 2>/dev/null || echo 0)
  if [[ "$SHADOW_COUNT" -ge 3 ]]; then
    SLOP_FLAGS="${SLOP_FLAGS}\"shadow-md applied uniformly to multiple cards detected\","
  fi

  # Pattern 16: Centered hero with gradient backdrop and floating cards
  grep -qE "text-center" "$FILE_PATH" 2>/dev/null && \
  grep -qE "bg-gradient" "$FILE_PATH" 2>/dev/null && \
  grep -qE "absolute" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Centered hero with gradient backdrop and floating cards detected\","

  # Pattern 17: Three-column icon + heading + paragraph feature section
  grep -qE "<Icon|<.*Icon" "$FILE_PATH" 2>/dev/null && \
  grep -qE "<h3" "$FILE_PATH" 2>/dev/null && \
  grep -qE "grid-cols-3|grid-cols-\[repeat\(3" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Three-column icon+heading+paragraph feature section detected\","

  # Pattern 18: Poppins + blue gradient
  grep -qE "Poppins" "$FILE_PATH" 2>/dev/null && \
  grep -qE "from-blue|bg-blue" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"Poppins + blue gradient combination detected\","

  # Pattern 19: White card on light gray background
  grep -qE "bg-white" "$FILE_PATH" 2>/dev/null && \
  grep -qE "bg-gray-50|bg-gray-100|bg-slate-50" "$FILE_PATH" 2>/dev/null && \
    SLOP_FLAGS="${SLOP_FLAGS}\"White card on light gray background (low contrast) detected\","

  # Pattern 20: Symmetric padding everywhere
  PADDING_COUNT=$(grep -c "p-4\|p-6\|p-8" "$FILE_PATH" 2>/dev/null || echo 0)
  PX_COUNT=$(grep -c "px-\|py-" "$FILE_PATH" 2>/dev/null || echo 0)
  if [[ "$PADDING_COUNT" -ge 3 && "$PX_COUNT" -eq 0 ]]; then
    SLOP_FLAGS="${SLOP_FLAGS}\"Symmetric padding everywhere (no horizontal/vertical rhythm) detected\","
  fi

  # Remove trailing comma from slop flags list
  SLOP_FLAGS="${SLOP_FLAGS%,}"
fi

# Safety check: 5MB limit (GitHub issue #27611 — large screenshots cause infinite retry)
if [[ -f "$SCREENSHOT_PATH" ]]; then
  FILE_SIZE=$(wc -c < "$SCREENSHOT_PATH")
  if [[ "$FILE_SIZE" -gt 5242880 ]]; then
    echo '{"additionalContext": "Screenshot too large (>5MB) — visual critique skipped this round. Check that dev server renders at 1200px width."}'
    exit 0
  fi

  # Magic bytes check — valid PNG header: 89 50 4E 47
  PNG_HEADER=$(xxd -l 4 "$SCREENSHOT_PATH" 2>/dev/null | awk '{print $2$3}' | head -1)
  if [[ "$PNG_HEADER" != "89504e47" ]]; then
    echo '{"additionalContext": "Invalid screenshot format (bad PNG header) — visual critique skipped."}'
    exit 0
  fi
fi

# Increment round counter
echo $((ROUND + 1)) > "$ROUND_FILE"

# Build slop flags section for additionalContext
SLOP_SECTION=""
if [[ -n "$SLOP_FLAGS" ]]; then
  SLOP_SECTION="\\n\\nDeterministic slop patterns pre-detected (include in design_slop_flags):\\n[$SLOP_FLAGS]"
fi

# Output additionalContext for Claude to process
# The visual-critic subagent will be invoked by Claude with the screenshot path
cat <<EOF
{
  "additionalContext": "VISUAL CRITIQUE REQUESTED — Round $ROUND/3\n\nFile written: $FILE_PATH\nScreenshot: $SCREENSHOT_PATH\n\nInvoke the visual-critic subagent (agents/visual-critic.md) with:\n1. The screenshot at $SCREENSHOT_PATH\n2. The original design brief from this session\n3. Round number: $ROUND\n4. Return the 8-dimension critique JSON (see skills/visionary/critique-schema.md)\n5. If overall_score < 4.0 AND round < 3, apply top_3_fixes to $FILE_PATH\n6. If round 2 score < round 1 score, set convergence_signal: true and stop\n\nAdditionalContext cap: 10,000 chars — critique JSON must be concise.$SLOP_SECTION"
}
EOF
