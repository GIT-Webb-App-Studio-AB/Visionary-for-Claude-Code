# Sprint 10 — MCP-server-extraction: Visionary i Cursor / Windsurf / Cline / Zed

**Vecka:** 17–18
**Fas:** 6 — Distribution (ny fas: marknad utanför Claude Code)
**Items:** 25 från roadmap (ny)
**Mål:** Extrahera Visionary-kärnan (8-step algorithm, kritikslinga, taste-flywheel-läs) till `@visionary/mcp-server` så att Cursor, Windsurf, Cline och Zed kan installera via Smithery / officiella MCP-registret. Marknad expanderar 5–10x utanför Claude Code utan att vi behöver underhålla N harness-versioner.

Strategisk avgränsning: hooks och taste-flywheel-skrivningar **stannar i Claude Code-pluginet** — de är harness-specifika (Claude Code:s SessionStart/PostToolUse-events finns inte i andra harnesses). MCP-servern exponerar *läsande* operationer + generation/critique/variants som tools.

## Scope

- Item 25 — MCP-server-extraktion: paketstruktur, 5 tools, 3 resources, 2 prompts, server.json + Streamable HTTP transport, publicering till officiella registret + PulseMCP + Smithery, smoke-test i tre target-harnesses.

## Pre-flight checklist

- [ ] Sprint 9 mergad till main — Motion Scoring v2 stable (servern måste exponera scorer på senaste version)
- [ ] MCP-protokoll spec 2025-06-18 läst igenom (`docs/external/mcp-spec-2025-06-18.md` — kopiera in)
- [ ] Anthropic-konto för MCP-registry-publication
- [ ] Feature-branch: `feat/sprint-10-mcp-server`

---

## Task 25.1 — Identifiera + isolera kärn-API:er [M]

**Fil:** `packages/mcp-server/src/core.mjs` (ny mapp-struktur)

**Steg:**
1. Inventera Visionary-funktionalitet: vad är harness-agnostiskt (kan flytta) vs harness-specifikt (stannar)?
2. Flytta till `packages/mcp-server/src/core/`:
   - `style-selection/` (8-step algorithm)
   - `critique/` (Playwright-integration via MCP samping av Playwright-MCP, inte direkt)
   - `slop-gate/` (Sprint 8)
   - `taste-read/` (read-only access till `taste/facts.jsonl` om tillgängligt)
3. Stannar kvar i `hooks/`: `inject-taste-context.mjs`, `harvest-git-signal.mjs`, hooks för `SessionStart`/`PostToolUse`.
4. Ny package.json med `"type": "module"`, exports-map, peerDeps på `@modelcontextprotocol/sdk`.

**AC:**
- `packages/mcp-server/` builds som standalone npm-paket
- Inga Claude-Code-specifika imports i `packages/mcp-server/src/core/`
- Existing Claude Code-plugin importerar fortfarande från `packages/mcp-server` när det är meningsfullt (DRY)

---

## Task 25.2 — Tool: `visionary.generate` [M]

**Fil:** `packages/mcp-server/src/tools/generate.mjs`

**Schema:**
```json
{
  "name": "visionary.generate",
  "description": "Generate a UI component using the 8-step style selection + motion-first generation pipeline.",
  "inputSchema": {
    "type": "object",
    "required": ["brief", "stack"],
    "properties": {
      "brief": { "type": "string", "description": "What to build" },
      "stack": { "enum": ["next-js", "vue", "svelte", "react-native", "swiftui", "vanilla", "..."] },
      "style_id": { "type": "string", "description": "Optional: skip selection, use this style" },
      "designer_pack": { "enum": ["rams", "kowalski", "vignelli", "scher", "greiman"] }
    }
  }
}
```

**Returns:** Generated source files as `content` array (file_path + content).

**Steg:**
1. Implementera tool-handler som anropar `core/style-selection/run.mjs` följt av `core/generator/run.mjs`.
2. Ingen kritikslinga här — den körs separat via `visionary.critique` (komponerbart).
3. Returnera files som MCP `content` med `type: "resource"` länk till genererad fil.

**AC:**
- Tool registreras korrekt i server-init
- E2E-test: `visionary.generate({brief: "user profile card", stack: "next-js"})` returnerar minst 1 fil med `.tsx`-extension
- Style-selection deterministisk vid `style_id` angivet

---

## Task 25.3 — Tool: `visionary.critique` [M]

**Fil:** `packages/mcp-server/src/tools/critique.mjs`

**Schema:**
```json
{
  "name": "visionary.critique",
  "description": "Run 10-dimension critique on a rendered component. Caller must provide screenshot path or URL.",
  "inputSchema": {
    "type": "object",
    "required": ["component_path", "screenshot_uri"],
    "properties": {
      "component_path": { "type": "string" },
      "screenshot_uri": { "type": "string", "description": "Path or data: URI" },
      "dimensions": {
        "type": "array",
        "items": { "enum": ["hierarchy", "layout", "typography", "contrast", "distinctiveness", "brief", "accessibility", "motion", "craft_measurable", "content_resilience"] }
      }
    }
  }
}
```

**Steg:**
1. Tool-handler tar screenshot URI (caller har redan kört Playwright via en separat MCP — Playwright-MCP).
2. Kör numerisk + heuristisk scorer-stack lokalt (no LLM).
3. Returnerar dim-scores + evidence.
4. Critic-LLM-anrop **görs av host**, inte av denna tool — vi exponerar bara mätbara delar (deterministisk path).

**AC:**
- Tool returnerar JSON med 10 sub-scores + evidence-array
- Inga externa nätverksanrop från tool-handlern (deterministisk, offline-möjligt)
- Schema validerar mot output

---

## Task 25.4 — Tool: `visionary.variants` [M]

**Fil:** `packages/mcp-server/src/tools/variants.mjs`

**Schema:** liknar `generate` men returnerar 3 mutually-distinct varianter med cosine-distance ≥ 0.6 i 8-axis embedding-space.

**Steg:**
1. Återanvänd `core/orthogonal-variants.mjs` från huvudpluginet.
2. Returnera alla 3 + en `pick_hint` som speglar Top-3 i sannolikhets-utrymmet.
3. Caller (host) fattar slutgiltigt val; vi rapporterar bara similarity-matriser + skäl.

**AC:**
- 3 distinkta filer returneras
- Cosine-distance-floor verifierad i output-payload

---

## Task 25.5 — Tools: `visionary.apply_taste` + `visionary.slop_gate` [M]

**Fil:** `packages/mcp-server/src/tools/apply-taste.mjs`, `packages/mcp-server/src/tools/slop-gate.mjs`

**`apply_taste`:** ger en preview av hur taste-profil skulle modifiera en komponent (utan att skriva). Read-only, använder `taste/facts.jsonl` om tillgänglig i workspace.

**`slop_gate`:** kör Sprint-8-gate på inkommande HTML/JSX-snippet, returnerar `{ rejected, blocking_patterns, suggestions }`.

**Steg:**
1. Båda tools är read-only — viktigt eftersom andra harnesses kan vara strikta om side-effects.
2. `slop_gate` exponeras även som resource för diskoverbarhet.
3. Båda dokumenteras i README som "preview/check"-tools.

**AC:**
- Båda tools returnerar JSON-strukturer som schema-validerar
- Inga side-effects (tester verifierar att inga filer skrivs)

---

## Task 25.6 — Resources: styles, taste-profile, traces [M]

**Fil:** `packages/mcp-server/src/resources/*.mjs`

**Resources att exponera:**
- `visionary://styles/{slug}` — markdown-content för stil + frontmatter (statiskt)
- `visionary://styles/_index` — JSON-listning av alla 202 stilar med metadata
- `visionary://taste/profile` — read-only sammanfattning av aktiv taste-profil (om workspace har en)
- `visionary://traces/{session-id}` — read-only trace-fil

**Steg:**
1. Implementera ListResources + ReadResource handlers.
2. URI-template-stöd (`{slug}`, `{session-id}`).
3. MIME-type: markdown för style-resources, application/json för _index och traces.

**AC:**
- `mcp inspector` kan lista alla resources
- Read fungerar på 3 random slugs + 1 trace-id

---

## Task 25.7 — Prompts: `aesthetic-brief`, `slop-explanation` [S]

**Fil:** `packages/mcp-server/src/prompts/*.mjs`

**`aesthetic-brief`-prompt:** parameteriserad — `(product_type, audience, archetype)` → utförlig brief med 8-step algorithmens output. Användbar för host som vill producera brief först, sen anropa generate.

**`slop-explanation`-prompt:** parameter `pattern_id` → mänsklig förklaring av varför pattern är slop + alternativ.

**Steg:**
1. Promp-template-strängar med `{{var}}`-syntax.
2. Implementera GetPrompt-handler.
3. Lista alla under ListPrompts.

**AC:**
- Båda prompts kan anropas från `mcp inspector`
- Output är välformaterad markdown

---

## Task 25.8 — Streamable HTTP transport [M]

**Fil:** `packages/mcp-server/src/transport/http.mjs`

**Steg:**
1. Implementera Streamable HTTP enligt MCP spec 2025-06-18 (single endpoint, GET för stream / POST för commands).
2. CORS-headers för cross-origin (Cursor/Windsurf kör webview).
3. Auth-header-stöd (`Authorization: Bearer ...`) — opt-in.
4. Stdio transport behålls som default (för Claude Code lokal-mode); HTTP är för cross-host.

**AC:**
- Båda transports konfigurerbara via env (`VISIONARY_MCP_TRANSPORT=stdio|http`)
- HTTP-transport bestått `mcp-spec-conformance-tests` (om sådan suite finns)

---

## Task 25.9 — Server card (.well-known/mcp/server.json) [S]

**Fil:** `packages/mcp-server/static/.well-known/mcp/server.json`

**Innehåll:**
```json
{
  "name": "@visionary/mcp-server",
  "version": "1.0.0",
  "description": "Design intelligence: 202 styles, 10-dim critique, taste flywheel, slop-gate",
  "categories": ["design", "frontend", "code-generation"],
  "mcp_protocol_version": "2025-06-18",
  "tools_changed_notifications": true,
  "screenshots": ["./images/before-after.png"],
  "homepage": "https://github.com/GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code"
}
```

**AC:**
- Server.json validerar mot officiella schemat
- Auto-discovery via `/.well-known/mcp/server.json` fungerar i lokala test

---

## Task 25.10 — Publicera till registries [M]

**Steg:**
1. **Officiella MCP-registret** (`registry.modelcontextprotocol.io`): submission via deras GitHub PR-flöde, inkludera screenshots av före/efter-output.
2. **PulseMCP**: manuell submission, hand-reviewed = bättre placering.
3. **Smithery**: paketera enligt deras CLI-format så `npx @smithery install visionary` fungerar.
4. **GitHub MCP Registry**: PR mot deras index-repo.
5. Versions-tag på huvudrepot: `mcp-server-v1.0.0`.

**AC:**
- Alla 4 registries har Visionary listat (eller PR pending)
- Ett vanligt-användar-flöde dokumenterat: `npx @smithery install visionary` → fungerande server i Cursor inom < 5 min

---

## Task 25.11 — Smoke-test i Cursor / Windsurf / Cline [M]

**Fil:** `packages/mcp-server/test/smoke/*.md` (manuella test-protokoll)

**Steg:**
1. Installera servern i varje harness via Smithery.
2. Kör `visionary.generate` med kanonisk prompt ("user profile card, next-js").
3. Kör `visionary.critique` på generated output.
4. Verifiera att stilar listas via `visionary://styles/_index`.
5. Dokumentera UX-friktion per harness.

**AC:**
- Alla 3 harnesses producerar fungerande output
- UX-friktioner dokumenterade i `docs/mcp-host-compat.md` (för framtida tweaks)

---

## Task 25.12 — Dokumentation [M]

**Fil:** `packages/mcp-server/README.md`, `docs/mcp-distribution.md`

**Innehåll:**
- Installation per host (Cursor, Windsurf, Cline, Zed, Claude Code)
- Env-konfiguration
- Tool/resource/prompt-API
- Begränsningar (taste-flywheel writes, hooks → bara i Claude Code-plugin)
- Migration-guide för befintliga Claude Code-användare

**AC:**
- Doc reviewed för klarhet (en utomstående dev provar Cursor-flödet utan support)

---

## Task 25.13 — Tester [M]

**Fil:** `packages/mcp-server/__tests__/*.test.mjs`

**Coverage:**
- Tool-handlers (5 st): input-validation, output-shape, error-cases
- Resource-handlers: URI-templating, ListResources-paginering
- Transport-tester: stdio + HTTP
- Schema-conformance: alla output-payloads validerar

**AC:**
- `node --test` grön
- Coverage ≥ 75 % på `packages/mcp-server/src/`

---

## Benchmark-verifiering

**Fil:** `results/sprint-10-distribution.md`

**Mätningar:**
- Install-success-rate per harness (förvänta 100 %, förbered fixes om < 100 %)
- Round-trip-tid för `generate` + `critique` via HTTP transport (förvänta < 30 s för enklare brief)
- Registry-listing-status (5/5 = grönt)

**AC:**
- Rapport publicerad

---

## Gemensamma risker

| Risk | Sannolikhet | Effekt | Mitigering |
|---|---|---|---|
| Cursor/Windsurf rendrar inte resources korrekt | Medel | Medel | Smoke-test tidigt, fall-back till tool-only-mode med tools som returnerar samma data |
| Taste-flywheel-läs över MCP exponerar PII | Låg | Hög | Endast aggregerad summary, aldrig rå facts.jsonl over the wire |
| Streamable HTTP-buggar i tidiga client-implementationer | Hög | Medel | Behåll stdio som default; HTTP markeras experimental i v1 |
| Smithery package-format ändras under sprint | Låg | Medel | Versionspinna mot specifik Smithery CLI-version |
| Registry-PR tar veckor att mergas | Hög | Låg | Publicera till PulseMCP + Smithery omedelbart, officiella registret är async |

---

## Definition of Done

- [ ] Alla tasks (25.1–25.13) klara
- [ ] `@visionary/mcp-server` publicerad till npm
- [ ] Server registrerad i minst 2 av 4 registries (PulseMCP + Smithery prio)
- [ ] Smoke-test grön i Cursor + Windsurf + Cline (Zed best-effort)
- [ ] Dokumentation komplett, en extern dev har provat flödet
- [ ] `results/sprint-10-distribution.md` publicerad
- [ ] Mergad till `main`

## Amendments

_Tomt._
