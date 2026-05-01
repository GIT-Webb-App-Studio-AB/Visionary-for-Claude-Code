// MCP resource: visionary://styles/...
//
// Exposes the 200+ Visionary styles as read-only resources.
//
//   visionary://styles/_index   → full _index.json (202 entries with metadata)
//   visionary://styles/<slug>   → markdown body of styles/<category>/<slug>.md
//
// list() returns the index plus the first 50 styles individually so hosts
// that don't auto-fetch _index still surface a meaningful sample. The full
// catalogue is always reachable via visionary://styles/_index.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../paths.mjs';

const PREFIX = 'visionary://styles/';
const INDEX_URI = 'visionary://styles/_index';
const INDEX_PATH = join(REPO_ROOT, 'skills', 'visionary', 'styles', '_index.json');

let _cachedIndex = null;
function loadIndex() {
  if (_cachedIndex) return _cachedIndex;
  if (!existsSync(INDEX_PATH)) {
    _cachedIndex = [];
    return _cachedIndex;
  }
  try {
    _cachedIndex = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
  } catch {
    _cachedIndex = [];
  }
  if (!Array.isArray(_cachedIndex)) _cachedIndex = [];
  return _cachedIndex;
}

export const resource = {
  prefix: PREFIX,

  matches(uri) {
    return typeof uri === 'string' && uri.startsWith(PREFIX);
  },

  async list() {
    const idx = loadIndex();
    const out = [
      {
        uri: INDEX_URI,
        name: 'Visionary styles index',
        mimeType: 'application/json',
        description: `${idx.length} design styles with metadata (category, motion tier, density, palette tags, keywords, accessibility floors).`,
      },
    ];
    // Surface first 50 styles individually so hosts that don't auto-fetch
    // _index still see a meaningful sample. Truncate to keep ListResources
    // payload compact.
    const sample = idx.slice(0, 50);
    for (const entry of sample) {
      if (!entry || typeof entry.id !== 'string') continue;
      out.push({
        uri: `${PREFIX}${entry.id}`,
        name: entry.id,
        mimeType: 'text/markdown',
        description: `[${entry.category || 'style'}] motion=${entry.motion_tier || '?'} density=${entry.density || '?'}`,
      });
    }
    return out;
  },

  async read(uri) {
    const slug = uri.slice(PREFIX.length);

    if (slug === '_index') {
      if (!existsSync(INDEX_PATH)) {
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: '[]',
          }],
        };
      }
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: readFileSync(INDEX_PATH, 'utf8'),
        }],
      };
    }

    const idx = loadIndex();
    const entry = idx.find((e) => e && e.id === slug);
    if (!entry || typeof entry.path !== 'string') {
      throw new Error(`Unknown style: ${slug}`);
    }
    const filePath = join(REPO_ROOT, entry.path);
    if (!existsSync(filePath)) {
      throw new Error(`Style file missing: ${entry.path}`);
    }
    return {
      contents: [{
        uri,
        mimeType: 'text/markdown',
        text: readFileSync(filePath, 'utf8'),
      }],
    };
  },
};
