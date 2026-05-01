// Path resolution helpers for the MCP server.
//
// The package lives at <repo>/packages/mcp-server/. From any file under
// src/<subdir>/<file>.mjs we want REPO_ROOT pointing at the Visionary repo
// root so resources can read styles/, taste/, .visionary/ etc.

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Resolve REPO_ROOT relative to THIS file's location (src/paths.mjs).
//   src/paths.mjs        → packages/mcp-server/src/
//   ..                   → packages/mcp-server/
//   ../..                → packages/
//   ../../..             → REPO_ROOT
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PKG_ROOT = resolve(__dirname, '..');
export const REPO_ROOT = resolve(__dirname, '..', '..', '..');
