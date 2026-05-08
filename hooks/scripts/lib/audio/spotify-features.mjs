// spotify-features.mjs — Sprint 19 Task 36.1
// Spotify Web API client for audio-features endpoint.
//
// OAuth: client-credentials flow (free, no user-auth — public track data only).
// Creds: ~/.visionary/spotify-creds.json (gitignore'd) with { client_id, client_secret }.
// Override: env VISIONARY_SPOTIFY_CREDS=/abs/path/to/creds.json
//
// Public API:
//   parseTrackId(input) → string | null
//   loadCreds(opts?) → { client_id, client_secret } | throws with setup hint
//   getAccessToken(opts?) → { access_token, expires_at }   (cached in-memory)
//   fetchAudioFeatures(trackUrlOrId, opts?) → Spotify features object
//   __resetTokenCache() / __setFetchOverride(fn)           (test seams)
//
// Failure modes (all surfaced as Errors with actionable messages):
//   - Missing creds file → instruct user to create ~/.visionary/spotify-creds.json
//   - Malformed creds JSON → JSON parse error with file path
//   - Token endpoint 4xx → bad creds, surface body
//   - 429 rate-limit → respect Retry-After, exponential backoff, max 5 retries
//   - Other 5xx → exponential backoff, max 5 retries
//   - Final retry exhaustion → throw with last status

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const FEATURES_ENDPOINT = 'https://api.spotify.com/v1/audio-features';
const TRACK_ENDPOINT = 'https://api.spotify.com/v1/tracks';
const DEFAULT_CREDS_PATH = join(homedir(), '.visionary', 'spotify-creds.json');

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

// In-memory token cache (per process). Acceptable because the hook is short-lived.
let _tokenCache = null; // { access_token, expires_at }

// Test seams
let _fetchOverride = null;
let _credsOverride = null; // direct creds object, bypassing file read

export function __resetTokenCache() {
  _tokenCache = null;
}

export function __setFetchOverride(fn) {
  _fetchOverride = fn;
}

export function __setCredsOverride(creds) {
  _credsOverride = creds;
}

function doFetch(...args) {
  if (_fetchOverride) return _fetchOverride(...args);
  if (typeof fetch !== 'function') {
    throw new Error(
      'spotify-features: global fetch() unavailable. Use Node ≥ 18 or pass __setFetchOverride()'
    );
  }
  return fetch(...args);
}

// ── Track-ID extraction ──────────────────────────────────────────────────────

// Accepts:
//   - 22-char base62 ID directly
//   - spotify:track:<id>
//   - https://open.spotify.com/track/<id>?si=...
//   - https://open.spotify.com/intl-xx/track/<id>?si=...
//   - http(s)://spotify.link/<short>  (NOT resolved here — caller must follow redirect)
//
// Returns the bare track-id, or null when no match.
export function parseTrackId(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  if (s.length === 0) return null;

  // Bare ID — Spotify base62 IDs are exactly 22 chars
  if (/^[A-Za-z0-9]{22}$/.test(s)) return s;

  // spotify:track:<id>
  const uriMatch = s.match(/^spotify:track:([A-Za-z0-9]{22})$/);
  if (uriMatch) return uriMatch[1];

  // Web URL with optional /intl-xx/ prefix and query string
  const urlMatch = s.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([A-Za-z0-9]{22})/);
  if (urlMatch) return urlMatch[1];

  return null;
}

// ── Credentials ──────────────────────────────────────────────────────────────

export function getCredsPath() {
  return process.env.VISIONARY_SPOTIFY_CREDS || DEFAULT_CREDS_PATH;
}

export function loadCreds() {
  if (_credsOverride) return _credsOverride;

  const path = getCredsPath();
  if (!existsSync(path)) {
    throw new Error(
      `spotify-features: credentials file not found at ${path}.\n` +
      `Setup:\n` +
      `  1. Create a Spotify app at https://developer.spotify.com/dashboard (free).\n` +
      `  2. Copy the Client ID and Client Secret.\n` +
      `  3. Save them to ${DEFAULT_CREDS_PATH} as JSON:\n` +
      `       {\n` +
      `         "client_id": "<your-client-id>",\n` +
      `         "client_secret": "<your-client-secret>"\n` +
      `       }\n` +
      `  4. chmod 600 ${DEFAULT_CREDS_PATH}\n` +
      `  Or set VISIONARY_SPOTIFY_CREDS=/abs/path/to/creds.json to use a different location.`
    );
  }

  let parsed;
  try {
    const raw = readFileSync(path, 'utf8');
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `spotify-features: failed to parse credentials file ${path}: ${err.message}`
    );
  }

  if (!parsed || typeof parsed.client_id !== 'string' || typeof parsed.client_secret !== 'string') {
    throw new Error(
      `spotify-features: credentials file ${path} must contain { "client_id": "...", "client_secret": "..." }`
    );
  }
  return { client_id: parsed.client_id, client_secret: parsed.client_secret };
}

// ── Token cache ──────────────────────────────────────────────────────────────

function isTokenValid(cache, now = Date.now()) {
  // 30s safety margin — never return a token that's about to expire mid-request.
  return cache && cache.access_token && cache.expires_at > now + 30_000;
}

export async function getAccessToken({ creds = null } = {}) {
  if (isTokenValid(_tokenCache)) {
    return _tokenCache;
  }

  const c = creds || loadCreds();
  const body = new URLSearchParams({ grant_type: 'client_credentials' }).toString();
  // RFC 6749 §2.3.1 — basic auth header is more compatible than form-encoded creds.
  const basic = Buffer.from(`${c.client_id}:${c.client_secret}`).toString('base64');

  const res = await doFetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const text = await safeReadText(res);
    throw new Error(
      `spotify-features: token request failed (${res.status}): ${text}. ` +
      `Check that ${getCredsPath()} contains valid client_id/client_secret.`
    );
  }

  const json = await res.json();
  if (!json.access_token || typeof json.expires_in !== 'number') {
    throw new Error(`spotify-features: malformed token response: ${JSON.stringify(json)}`);
  }

  _tokenCache = {
    access_token: json.access_token,
    expires_at: Date.now() + json.expires_in * 1000,
  };
  return _tokenCache;
}

// ── Audio-features fetch with retry/backoff ──────────────────────────────────

async function fetchWithRetry(url, init, opts = {}) {
  const maxRetries = opts.maxRetries ?? MAX_RETRIES;
  const sleeper = opts.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  let attempt = 0;
  let backoff = INITIAL_BACKOFF_MS;
  let lastErr = null;

  while (attempt <= maxRetries) {
    let res;
    try {
      res = await doFetch(url, init);
    } catch (err) {
      lastErr = err;
      if (attempt >= maxRetries) break;
      await sleeper(backoff);
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      attempt++;
      continue;
    }

    if (res.ok) return res;

    // 429 — Retry-After header is gospel.
    if (res.status === 429) {
      const retryAfterRaw = res.headers?.get?.('retry-after') ?? res.headers?.get?.('Retry-After');
      const retryAfter = parseRetryAfter(retryAfterRaw);
      const waitMs = retryAfter !== null ? retryAfter * 1000 : backoff;
      if (attempt >= maxRetries) {
        lastErr = new Error(`spotify-features: rate-limited (429) after ${maxRetries + 1} attempts`);
        break;
      }
      await sleeper(Math.min(waitMs, MAX_BACKOFF_MS));
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      attempt++;
      continue;
    }

    // 5xx → backoff + retry
    if (res.status >= 500 && res.status < 600) {
      if (attempt >= maxRetries) {
        const text = await safeReadText(res);
        lastErr = new Error(`spotify-features: server error ${res.status}: ${text}`);
        break;
      }
      await sleeper(backoff);
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      attempt++;
      continue;
    }

    // 4xx other than 429 → don't retry, surface body.
    const text = await safeReadText(res);
    throw new Error(`spotify-features: request failed ${res.status}: ${text}`);
  }

  throw lastErr || new Error('spotify-features: exhausted retries with no response');
}

function parseRetryAfter(raw) {
  if (!raw) return null;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0) return n;
  // HTTP-date form unsupported — fall back to backoff heuristic.
  return null;
}

async function safeReadText(res) {
  try { return await res.text(); } catch { return '<unreadable body>'; }
}

// Public: fetch audio-features for a Spotify track URL/URI/ID.
// Returns the raw Spotify features object (valence, energy, danceability,
// tempo, acousticness, instrumentalness, speechiness, liveness, loudness,
// mode, key, time_signature, etc.).
export async function fetchAudioFeatures(trackUrlOrId, opts = {}) {
  const trackId = parseTrackId(trackUrlOrId);
  if (!trackId) {
    throw new Error(
      `spotify-features: could not parse track ID from "${trackUrlOrId}". ` +
      `Supported: bare 22-char ID, spotify:track:<id>, or open.spotify.com/track/<id> URLs.`
    );
  }

  const token = await getAccessToken({ creds: opts.creds });
  const res = await fetchWithRetry(
    `${FEATURES_ENDPOINT}/${trackId}`,
    {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token.access_token}` },
    },
    opts,
  );
  const features = await res.json();
  if (!features || typeof features !== 'object') {
    throw new Error(`spotify-features: malformed features response for ${trackId}`);
  }
  return features;
}

// Optional: fetch track metadata (name, artists) for receipts.
// Returns { name, artists: [{ name }], ... } or null when unavailable.
export async function fetchTrackMeta(trackUrlOrId, opts = {}) {
  const trackId = parseTrackId(trackUrlOrId);
  if (!trackId) return null;
  try {
    const token = await getAccessToken({ creds: opts.creds });
    const res = await fetchWithRetry(
      `${TRACK_ENDPOINT}/${trackId}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token.access_token}` },
      },
      opts,
    );
    return await res.json();
  } catch {
    // Receipt metadata is best-effort — never block features fetch on it.
    return null;
  }
}
