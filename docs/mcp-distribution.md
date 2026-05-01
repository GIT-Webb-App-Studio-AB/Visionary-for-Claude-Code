# MCP Distribution

Sprint 10 extracts Visionary's deterministic core to `@visionary/mcp-server` so that hosts beyond Claude Code can consume it.

## What's exposed

- **3 tools** (deterministic, no LLM): `slop_gate`, `motion_score`, `validate_evidence`
- **3 resources** (read-only): `visionary://styles/...`, `visionary://taste/summary`, `visionary://traces/{id}`
- **2 prompts** (parameterised): `aesthetic_brief`, `slop_explanation`

## What's NOT exposed

- **Hooks** (SessionStart, PostToolUse) — harness-specific to Claude Code
- **Taste-flywheel writes** (`facts.jsonl`/`pairs.jsonl` mutations) — read-only over MCP
- **Direct Claude API generation** — host owns LLM invocation

## Hosts supported

| Host | Status |
|---|---|
| Cursor | tested via stdio |
| Windsurf | tested via stdio |
| Cline (VSCode) | tested via stdio |
| Claude Code | available alongside the existing plugin |
| Zed | best-effort |

## Publishing

Publication to registries is a maintainer task. Internal checklist:

- [ ] `npm publish --access public`
- [ ] PR to `registry.modelcontextprotocol.io/servers`
- [ ] Submit to PulseMCP (manual hand-review)
- [ ] Add to GitHub MCP Registry (PR to their index repo)
- [ ] Smithery (auto-pickup once npm-published with proper tags)

## Smoke-test checklist (manual)

For each target host:

1. Install via instructions in `packages/mcp-server/INSTALL.md`
2. Verify the host lists three tools
3. Run `visionary.slop_gate` with source containing `bg-cyan-400` → expects `rejected: true` if patterns >= 2
4. Run `visionary.motion_score` with `transition: opacity 200ms ease` → expects tier 1 (Subtle)
5. Read resource `visionary://styles/_index` → expects JSON listing
