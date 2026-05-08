#!/usr/bin/env node
// test-spotify-connection.mjs — Sprint 19
// Verifies Spotify credentials work + fetches audio-features for a sample track.
// Usage: node scripts/test-spotify-connection.mjs <spotify-url>

import { extractTrackId, getAudioFeatures } from '../hooks/scripts/lib/audio/spotify-features.mjs';

const url = process.argv[2];
if (!url) {
  console.error('Usage: node scripts/test-spotify-connection.mjs <spotify-url>');
  console.error('Example: node scripts/test-spotify-connection.mjs https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
  process.exit(1);
}

(async () => {
  try {
    console.log(`Testing Spotify connection with: ${url}`);
    const trackId = extractTrackId(url);
    console.log(`Track ID: ${trackId}`);

    const features = await getAudioFeatures(trackId);
    console.log('\nAudio Features:');
    console.log(`  valence: ${features.valence}`);
    console.log(`  energy: ${features.energy}`);
    console.log(`  tempo: ${features.tempo} BPM`);
    console.log(`  danceability: ${features.danceability}`);
    console.log(`  acousticness: ${features.acousticness}`);
    console.log(`  instrumentalness: ${features.instrumentalness}`);
    console.log('\n✓ Spotify integration works.');
  } catch (err) {
    console.error(`✗ Spotify test failed: ${err.message}`);
    if (err.message.includes('credentials')) {
      console.error('\nSetup instructions: docs/spotify-setup.md');
    }
    process.exit(1);
  }
})();
