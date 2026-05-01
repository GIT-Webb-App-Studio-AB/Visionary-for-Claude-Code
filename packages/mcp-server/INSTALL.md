# Installing @visionary/mcp-server

## Cursor

Edit `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "visionary": {
      "command": "npx",
      "args": ["-y", "@visionary/mcp-server"]
    }
  }
}
```

## Windsurf

Open Settings → MCP → Edit Config:
```json
{
  "visionary": {
    "command": "npx",
    "args": ["-y", "@visionary/mcp-server"]
  }
}
```

## Cline (VSCode)

Settings → Cline → MCP Servers → Add:
```json
"visionary": {
  "command": "npx",
  "args": ["-y", "@visionary/mcp-server"]
}
```

## Claude Code

Already integrated as plugin — MCP-server is for cross-host distribution. If you want to use it via MCP from Claude Code:
```bash
claude mcp add visionary npx -y @visionary/mcp-server
```

## Zed

Edit `~/.config/zed/settings.json`:
```json
{
  "context_servers": {
    "visionary": {
      "command": { "path": "npx", "args": ["-y", "@visionary/mcp-server"] }
    }
  }
}
```

## Smithery

```bash
npx -y @smithery/cli install @visionary/mcp-server --client cursor
npx -y @smithery/cli install @visionary/mcp-server --client windsurf
```

## Verify

After install, in your AI chat, ask:
> "List visionary MCP tools"

You should see: `visionary.slop_gate`, `visionary.motion_score`, `visionary.validate_evidence`.
