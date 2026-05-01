# @visionary/mcp-server

Visionary design intelligence as a Model Context Protocol server. Exposes
deterministic Visionary capabilities to any MCP host (Cursor, Windsurf,
Claude Code, etc.) over stdio.

The host owns LLM generation. This server only ships deterministic data
and deterministic logic — it does not call any model.

## Install

```bash
npm install -g @visionary/mcp-server
```

## Configure

**Cursor / Windsurf** (`mcp.json` or equivalent):
```json
{
  "mcpServers": {
    "visionary": { "command": "visionary-mcp" }
  }
}
```

**Claude Code** (`.mcp.json`):
```json
{
  "mcpServers": {
    "visionary": { "command": "visionary-mcp", "args": [] }
  }
}
```

## Capabilities

**Tools** (deterministic):
- `visionary.slop_gate` — detect slop patterns in HTML/JSX/CSS, return `rejected` + `blocking_patterns`.
- `visionary.motion_score` — Motion Scoring 2.0 (6 sub-dim weighted aggregator + Maturity tier 0..4).
- `visionary.validate_evidence` — structural validation of critique-output `top_3_fixes` evidence; optional DOM-match folding.

**Resources** (read-only):
- `visionary://styles/_index` and `visionary://styles/<slug>` — 200+ design styles.
- `visionary://taste/summary` — aggregate-only taste-flywheel summary (no raw rejection prose).
- `visionary://traces/_list` and `visionary://traces/<session_id>` — recent session traces.

**Prompts** (parameterised):
- `visionary.aesthetic_brief` — args: `product_type`, `audience`, `archetype`.
- `visionary.slop_explanation` — args: `pattern_id` (1..26).

## Limitations

- Hooks (capture-and-critique, slop-gate auto-fire) and taste-flywheel writes live only in the Claude Code plugin. This server is read-and-analyze only.
- Selectors are validated structurally; DOM-match validation requires the host to run them via Playwright MCP and pass results back via `dom_match_results`.
- The server reads files from the Visionary repo at runtime — install location matters when running outside the repo.
