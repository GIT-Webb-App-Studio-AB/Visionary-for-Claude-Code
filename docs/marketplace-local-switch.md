# Marketplace switch — local v1.6.0 ↔ live GitHub v1.5.4

**Skapad:** 2026-05-06
**Syfte:** Testa Visionary v1.6.0 lokalt i Claude Code via marketplace-switch utan att tappa möjligheten att gå tillbaka till live GitHub-installationen.

## Bakgrund — vad är "marketplace" i Claude Code?

Claude Code hanterar plugins via *marketplaces* — registrerade källor (GitHub-repos eller lokala paths) som listar tillgängliga plugins. När du gör `claude plugin install <plugin>` klonas/kopieras plugin-katalogen från marketplace-källan in till `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`.

**Visionary's marketplace-registrering:**
- **Marketplace-namn**: `visionary-marketplace`
- **Plugin-namn**: `visionary-claude`
- **Live source (default)**: `github:GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code`
- **Lokal source (test-mode)**: `C:\dev\Visionary-for-Claude-Code` (denna repo med v1.6.0)

## Filer som påverkas

```
~/.claude/plugins/
├── known_marketplaces.json                     ← marketplace-registrering (source-typ)
├── installed_plugins.json                      ← installerade plugins + versioner
├── marketplaces/
│   └── visionary-marketplace/                  ← marketplace-clone (laddar plugin från denna)
└── cache/
    └── visionary-marketplace/
        └── visionary-claude/
            └── <version>/                      ← installerad plugin-kopia (Claude Code läser härifrån)
```

## ⚠️  Lärdom 2026-05-06 — gör INTE manuell config-edit

Första försöket editerade `known_marketplaces.json` direkt och satte `"source": "local"` — **det är inte ett giltigt värde** i Claude Code's schema. Resultatet blev felmeddelande:

```
Marketplace configuration file is corrupted: visionary-marketplace.source.source: Invalid input
```

**Använd istället Claude Code's CLI-kommandon** — de skapar rätt schema-validerat format själv. Junction-tricket är fortfarande användbart men kombineras med CLI-add istället för manuell config-edit.

## Switch till lokal v1.6.0 — RÄTT METOD (CLI-driven)

### Steg 1 — Backup nuvarande state (live v1.5.4)

```powershell
# I PowerShell
$BACKUP_DIR = "$HOME\.claude\plugins\.visionary-backup-pre-v1.6.0-local"
New-Item -ItemType Directory -Path $BACKUP_DIR -Force

# Backup marketplace clone (live v1.5.4)
Copy-Item -Recurse "$HOME\.claude\plugins\marketplaces\visionary-marketplace" "$BACKUP_DIR\marketplaces-visionary-marketplace"

# Backup config files
Copy-Item "$HOME\.claude\plugins\known_marketplaces.json" "$BACKUP_DIR\known_marketplaces.json"
Copy-Item "$HOME\.claude\plugins\installed_plugins.json" "$BACKUP_DIR\installed_plugins.json"

# Backup cached plugin install (1.5.4)
if (Test-Path "$HOME\.claude\plugins\cache\visionary-marketplace") {
  Copy-Item -Recurse "$HOME\.claude\plugins\cache\visionary-marketplace" "$BACKUP_DIR\cache-visionary-marketplace"
}
```

### Steg 2 — I Claude Code CLI: ta bort live-marketplace + lägg till lokal

Öppna Claude Code i en ny terminal och kör interaktivt:

```
/plugin marketplace remove visionary-marketplace
/plugin marketplace add C:/dev/Visionary-for-Claude-Code
/plugin install visionary-claude
```

`/plugin marketplace add` med en lokal absolut path känner Claude Code igen och skapar rätt schema-validerat source-block automatiskt (sannolikt `{ "source": "directory", "path": "..." }` eller motsvarande — vi behöver inte gissa).

`/plugin install visionary-claude` läser den nya marketplace.json (v1.6.0) och installerar plugin-katalogen direkt från lokala paths.

### Steg 3 (valfritt) — Verifiera switchen

```powershell
# Kolla att new source är giltig (ingen corrupted-error)
cat "$HOME\.claude\plugins\known_marketplaces.json" | Select-String -Pattern "visionary" -Context 0,5

# Kolla version i installed_plugins.json
cat "$HOME\.claude\plugins\installed_plugins.json" | Select-String -Pattern "visionary-claude@" -Context 0,8
# Ska visa version: 1.6.0
```

I Claude Code: typ `/` och scrolla — alla 8 nya commands från Sprint 16-24 ska finnas.

**Verifiera i Claude Code-session:**
```
/visionary-from-photo    ← ska finnas (Sprint 18)
/visionary-mood          ← ska finnas (Sprint 17)
/visionary-cinematic     ← ska finnas (Sprint 20)
/visionary-flow          ← ska finnas (Sprint 22)
/visionary-voice         ← ska finnas (Sprint 22)
/visionary-patina        ← ska finnas (Sprint 23)
/visionary-coined        ← ska finnas (Sprint 21)
```

Om alla 8 nya commands syns: switchen lyckades.

## Återställning till live v1.5.4

När du är klar med lokal-test och vill tillbaka till GitHub-installationen:

### Alternativ A — Snabb restore från backup

```powershell
$BACKUP_DIR = "$HOME\.claude\plugins\.visionary-backup-pre-v1.6.0-local"

# Ta bort junction
Remove-Item -Force "$HOME\.claude\plugins\marketplaces\visionary-marketplace"

# Restore marketplace-clone från backup
Copy-Item -Recurse "$BACKUP_DIR\marketplaces-visionary-marketplace" "$HOME\.claude\plugins\marketplaces\visionary-marketplace"

# Restore config files
Copy-Item -Force "$BACKUP_DIR\known_marketplaces.json" "$HOME\.claude\plugins\known_marketplaces.json"
Copy-Item -Force "$BACKUP_DIR\installed_plugins.json" "$HOME\.claude\plugins\installed_plugins.json"

# Restore cached plugin install
if (Test-Path "$BACKUP_DIR\cache-visionary-marketplace") {
  Remove-Item -Recurse -Force "$HOME\.claude\plugins\cache\visionary-marketplace" -ErrorAction SilentlyContinue
  Copy-Item -Recurse "$BACKUP_DIR\cache-visionary-marketplace" "$HOME\.claude\plugins\cache\visionary-marketplace"
}
```

### Alternativ B — Ren installation via Claude Code CLI

Om du föredrar att börja om från scratch (rekommenderas efter att v1.6.0 är publicerat på GitHub):

```bash
# I Claude Code (interaktiv terminal)
/plugin marketplace remove visionary-marketplace
/plugin marketplace add GIT-Webb-App-Studio-AB/Visionary-for-Claude-Code
/plugin install visionary-claude
```

Claude Code klonar färsk kopia från GitHub.

## Verifiera vilket läge du är i

```powershell
# Kolla source-typ i known_marketplaces.json
cat "$HOME\.claude\plugins\known_marketplaces.json" | Select-String -Pattern "visionary" -Context 0,5

# Kolla om visionary-marketplace är junction (=lokal-mode) eller riktig directory (=live-mode)
$path = "$HOME\.claude\plugins\marketplaces\visionary-marketplace"
(Get-Item $path).LinkType
# Returnerar "Junction" om lokal-mode, $null om live-mode

# Kolla version
cat "$path\.claude-plugin\plugin.json" | Select-String -Pattern "version"
# Lokal: "1.6.0", Live: "1.5.4"
```

## Vanliga problem

**Problem:** "Junction kunde inte skapas — Access Denied"
**Lösning:** Kör PowerShell som administrator, ELLER använd `cmd /c mklink /J` istället för PowerShell `New-Item -ItemType SymbolicLink` (junctions kräver inte admin).

**Problem:** Claude Code visar fortfarande v1.5.4 commands efter switch
**Lösning:** Plugin-cache i `~/.claude/plugins/cache/visionary-marketplace/visionary-claude/1.5.4/` används fortfarande. Antingen:
- Radera cache: `Remove-Item -Recurse "$HOME\.claude\plugins\cache\visionary-marketplace"` och starta om Claude Code
- Eller låta Claude Code reinstallera via `/plugin install visionary-claude`

**Problem:** Auto-update försöker pulla från GitHub
**Lösning:** Verifiera att `known_marketplaces.json` har `source.source: "local"` (inte `"github"`). Om GitHub: redigera filen.

## Nuvarande session — vad gjordes

Datum: 2026-05-06

**Försök 1 (manuell config-edit, FAILED):**
- Backup placerad i: `~/.claude/plugins/.visionary-backup-pre-v1.6.0-local/` (32 MB)
- Junction skapad: `~/.claude/plugins/marketplaces/visionary-marketplace` → `C:\dev\Visionary-for-Claude-Code`
- Config uppdaterad: `known_marketplaces.json` `source.source` = `"github"` → `"local"`
- **Problem:** `"local"` är inte giltigt schema-värde → Claude Code rapporterade "corrupted"
- **Rollback:** Junction borttagen, marketplace-clone restored från backup, config restored

**Försök 2 (CLI-driven, RECOMMENDED):**
- Restore till live v1.5.4-state genomförd ✓
- Backup behålls i `~/.claude/plugins/.visionary-backup-pre-v1.6.0-local/` (för future reference)
- **Användaren ska nu köra i Claude Code CLI:**
  1. `/plugin marketplace remove visionary-marketplace`
  2. `/plugin marketplace add C:/dev/Visionary-for-Claude-Code`
  3. `/plugin install visionary-claude`

För att switcha tillbaka till GitHub-source: följ "Återställning Alternativ B" eller restore från backup ("Alternativ A").
