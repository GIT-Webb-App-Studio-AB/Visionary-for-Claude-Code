// Run: node --test hooks/scripts/lib/audio/__tests__/spotify-features.test.mjs
//
// Sprint 19 Task 36.1 — Spotify Web API client tests.
// Strategy: never hit the real Spotify API. We use __setFetchOverride to
// inject a fake fetch that responds with fixture data, and __setCredsOverride
// to skip filesystem creds entirely.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  parseTrackId,
  fetchAudioFeatures,
  getAccessToken,
  loadCreds,
  __resetTokenCache,
  __setFetchOverride,
  __setCredsOverride,
} from '../spotify-features.mjs';

const __filename = fileURLToPath(import.meta.url);
const FIXTURES = resolve(dirname(__filename), '__fixtures__');
const TRACK_FIXTURE = JSON.parse(
  readFileSync(resolve(FIXTURES, 'spotify-track.json'), 'utf8'),
);

// Helper: mock-Response factory that the production code can call .ok / .status
// / .json() / .text() / .headers.get() on, matching the WHATWG fetch shape.
function mockResponse({ status = 200, body = {}, headers = {} } = {}) {
  const headersMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)]));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k) => headersMap.get(String(k).toLowerCase()) ?? null },
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

function tokenResponse({ token = 'fake-token-abc', expires_in = 3600 } = {}) {
  return mockResponse({ status: 200, body: { access_token: token, expires_in, token_type: 'Bearer' } });
}

function resetAll() {
  __resetTokenCache();
  __setFetchOverride(null);
  __setCredsOverride({ client_id: 'test-id', client_secret: 'test-secret' });
}

// ── parseTrackId ────────────────────────────────────────────────────────────

test('parseTrackId: bare 22-char base62 ID', () => {
  assert.equal(parseTrackId('4iV5W9uYEdYUVa79Axb7Rh'), '4iV5W9uYEdYUVa79Axb7Rh');
});

test('parseTrackId: spotify:track URI', () => {
  assert.equal(parseTrackId('spotify:track:4iV5W9uYEdYUVa79Axb7Rh'), '4iV5W9uYEdYUVa79Axb7Rh');
});

test('parseTrackId: open.spotify.com web URL', () => {
  assert.equal(
    parseTrackId('https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh?si=abc123'),
    '4iV5W9uYEdYUVa79Axb7Rh',
  );
});

test('parseTrackId: open.spotify.com with /intl-xx/ locale prefix', () => {
  assert.equal(
    parseTrackId('https://open.spotify.com/intl-en/track/4iV5W9uYEdYUVa79Axb7Rh'),
    '4iV5W9uYEdYUVa79Axb7Rh',
  );
});

test('parseTrackId: rejects non-Spotify input', () => {
  assert.equal(parseTrackId('https://music.apple.com/track/123'), null);
  assert.equal(parseTrackId('not a url'), null);
  assert.equal(parseTrackId(''), null);
  assert.equal(parseTrackId(null), null);
  assert.equal(parseTrackId(undefined), null);
});

test('parseTrackId: rejects 21-char or 23-char IDs (must be exactly 22)', () => {
  assert.equal(parseTrackId('4iV5W9uYEdYUVa79Axb7R'), null);  // 21 chars
  assert.equal(parseTrackId('4iV5W9uYEdYUVa79Axb7RhX'), null); // 23 chars
});

// ── Token cache ─────────────────────────────────────────────────────────────

test('getAccessToken: caches token across calls within expiry', async () => {
  resetAll();
  let tokenRequests = 0;
  __setFetchOverride(async (url) => {
    if (url.includes('/api/token')) {
      tokenRequests++;
      return tokenResponse({ expires_in: 3600 });
    }
    throw new Error(`unexpected fetch: ${url}`);
  });

  const t1 = await getAccessToken();
  const t2 = await getAccessToken();
  const t3 = await getAccessToken();

  assert.equal(tokenRequests, 1, 'second & third call should hit cache');
  assert.equal(t1.access_token, 'fake-token-abc');
  assert.equal(t2.access_token, 'fake-token-abc');
  assert.equal(t3.access_token, 'fake-token-abc');
});

test('getAccessToken: surfaces token endpoint 4xx with diagnostic message', async () => {
  resetAll();
  __setFetchOverride(async () => mockResponse({
    status: 400,
    body: 'invalid_client',
  }));

  await assert.rejects(
    () => getAccessToken(),
    /token request failed.*400/,
  );
});

test('getAccessToken: rejects malformed token response (missing fields)', async () => {
  resetAll();
  __setFetchOverride(async () => mockResponse({ status: 200, body: { wat: 'no token' } }));
  await assert.rejects(() => getAccessToken(), /malformed token response/);
});

// ── fetchAudioFeatures ──────────────────────────────────────────────────────

test('fetchAudioFeatures: happy path returns features object', async () => {
  resetAll();
  __setFetchOverride(async (url) => {
    if (url.includes('/api/token')) return tokenResponse();
    if (url.includes('/audio-features/')) return mockResponse({ status: 200, body: TRACK_FIXTURE });
    throw new Error(`unexpected fetch: ${url}`);
  });

  const features = await fetchAudioFeatures('spotify:track:4iV5W9uYEdYUVa79Axb7Rh');
  assert.equal(features.id, TRACK_FIXTURE.id);
  assert.equal(features.tempo, TRACK_FIXTURE.tempo);
  assert.equal(features.valence, TRACK_FIXTURE.valence);
});

test('fetchAudioFeatures: rejects unparseable input before network call', async () => {
  resetAll();
  let calls = 0;
  __setFetchOverride(async () => { calls++; return tokenResponse(); });

  await assert.rejects(
    () => fetchAudioFeatures('https://music.apple.com/track/123'),
    /could not parse track ID/,
  );
  assert.equal(calls, 0, 'must not hit the network when input is invalid');
});

test('fetchAudioFeatures: handles 429 rate-limit with Retry-After then succeeds', async () => {
  resetAll();
  let attempt = 0;
  __setFetchOverride(async (url) => {
    if (url.includes('/api/token')) return tokenResponse();
    attempt++;
    if (attempt === 1) {
      return mockResponse({ status: 429, body: 'rate limited', headers: { 'retry-after': '0' } });
    }
    return mockResponse({ status: 200, body: TRACK_FIXTURE });
  });

  // Use a no-op sleep so the test is fast.
  const features = await fetchAudioFeatures(
    'spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
    { sleep: async () => {} },
  );
  assert.equal(attempt, 2, 'should retry once after 429');
  assert.equal(features.id, TRACK_FIXTURE.id);
});

test('fetchAudioFeatures: handles 5xx with backoff retry', async () => {
  resetAll();
  let attempt = 0;
  __setFetchOverride(async (url) => {
    if (url.includes('/api/token')) return tokenResponse();
    attempt++;
    if (attempt < 3) return mockResponse({ status: 503, body: 'service unavailable' });
    return mockResponse({ status: 200, body: TRACK_FIXTURE });
  });

  const features = await fetchAudioFeatures(
    'spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
    { sleep: async () => {} },
  );
  assert.equal(attempt, 3);
  assert.equal(features.id, TRACK_FIXTURE.id);
});

test('fetchAudioFeatures: gives up after MAX_RETRIES on persistent 429', async () => {
  resetAll();
  let attempt = 0;
  __setFetchOverride(async (url) => {
    if (url.includes('/api/token')) return tokenResponse();
    attempt++;
    return mockResponse({ status: 429, headers: { 'retry-after': '0' }, body: 'still limited' });
  });

  await assert.rejects(
    () => fetchAudioFeatures(
      'spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
      { sleep: async () => {}, maxRetries: 2 },
    ),
    /rate-limited.*429/,
  );
  // initial attempt + 2 retries = 3 total attempts
  assert.equal(attempt, 3);
});

test('fetchAudioFeatures: surfaces non-retryable 4xx immediately', async () => {
  resetAll();
  let attempt = 0;
  __setFetchOverride(async (url) => {
    if (url.includes('/api/token')) return tokenResponse();
    attempt++;
    return mockResponse({ status: 404, body: 'track not found' });
  });

  await assert.rejects(
    () => fetchAudioFeatures(
      'spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
      { sleep: async () => {} },
    ),
    /request failed 404/,
  );
  assert.equal(attempt, 1, '404 must not be retried');
});

// ── loadCreds ───────────────────────────────────────────────────────────────

test('loadCreds: returns the override when one is set (test seam)', () => {
  __setCredsOverride({ client_id: 'a', client_secret: 'b' });
  const creds = loadCreds();
  assert.equal(creds.client_id, 'a');
  assert.equal(creds.client_secret, 'b');
});

test('loadCreds: surfaces actionable error when creds file missing', () => {
  __setCredsOverride(null);
  // Point at a path that absolutely does not exist.
  const prev = process.env.VISIONARY_SPOTIFY_CREDS;
  process.env.VISIONARY_SPOTIFY_CREDS = '/definitely/does/not/exist/spotify-creds.json';
  try {
    assert.throws(
      () => loadCreds(),
      /credentials file not found/,
    );
  } finally {
    if (prev === undefined) delete process.env.VISIONARY_SPOTIFY_CREDS;
    else process.env.VISIONARY_SPOTIFY_CREDS = prev;
  }
});
