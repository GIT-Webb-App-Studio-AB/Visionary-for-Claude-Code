// Run: node --test hooks/scripts/lib/__tests__/embed-brief.test.mjs
//
// Exercises the hashed-ngram embedder's contract: determinism, dimension,
// normalisation, cosine ranking. We don't test semantic quality — that's
// a different bar — but we verify that briefs describing similar concepts
// rank closer than unrelated ones at the lexical level.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  embedBrief,
  cosine,
  topK,
  normaliseBrief,
  embedderId,
  EMBEDDING_DIMS,
  _clearCacheForTest,
} from '../embed-brief.mjs';

test('embedder identity is stable + documented', () => {
  assert.equal(embedderId, 'hashed-ngram-v1');
  assert.equal(EMBEDDING_DIMS, 384);
});

test('same text produces same vector across calls', () => {
  _clearCacheForTest();
  const a = embedBrief('A pricing page for B2B SaaS');
  _clearCacheForTest();
  const b = embedBrief('A pricing page for B2B SaaS');
  assert.equal(a.length, EMBEDDING_DIMS);
  assert.equal(b.length, EMBEDDING_DIMS);
  for (let i = 0; i < EMBEDDING_DIMS; i++) {
    assert.equal(a[i], b[i]);
  }
});

test('normalisation collapses case and whitespace', () => {
  assert.equal(
    normaliseBrief('  A  Pricing PAGE for b2b   SaaS!!  '),
    'a pricing page for b2b saas',
  );
});

test('output vector is L2-normalised', () => {
  const v = embedBrief('A quiet editorial landing page with a serif heading');
  let sq = 0;
  for (let i = 0; i < v.length; i++) sq += v[i] * v[i];
  const mag = Math.sqrt(sq);
  assert.ok(Math.abs(mag - 1) < 1e-9, `magnitude ${mag} should be ~1`);
});

test('empty input returns zero vector', () => {
  const v = embedBrief('');
  assert.equal(v.length, EMBEDDING_DIMS);
  for (let i = 0; i < v.length; i++) assert.equal(v[i], 0);
  // Cosine against zero is 0 — the RAG consumer treats 0 as "not comparable".
  assert.equal(cosine(v, embedBrief('something')), 0);
});

test('cosine between similar briefs ranks higher than dissimilar', () => {
  // Two pricing briefs should rank closer than pricing vs. a dashboard brief.
  const pricing1 = embedBrief('A pricing page for B2B SaaS with three tiers');
  const pricing2 = embedBrief('A B2B SaaS pricing page with tier comparison');
  const dashboard = embedBrief('An admin dashboard for server monitoring with live charts');

  const pp = cosine(pricing1, pricing2);
  const pd = cosine(pricing1, dashboard);
  assert.ok(pp > pd, `pricing-pricing (${pp.toFixed(3)}) should beat pricing-dashboard (${pd.toFixed(3)})`);
  assert.ok(pp > 0.15, `pricing-pricing cosine should be well above zero, got ${pp.toFixed(3)}`);
});

test('cosine returns 0 on dimension mismatch', () => {
  const a = embedBrief('x');
  const b = new Float64Array(100); // wrong dim
  assert.equal(cosine(a, b), 0);
});

test('cosine is clamped to [-1, 1]', () => {
  const v = embedBrief('x');
  const c = cosine(v, v);
  assert.ok(c <= 1 && c >= -1);
  // For identical vectors, cosine should be very close to 1.
  assert.ok(Math.abs(c - 1) < 1e-9, `identical cosine ${c} should be 1`);
});

test('topK returns highest-scoring candidates first', () => {
  const query = embedBrief('pricing page for B2B SaaS');
  const candidates = [
    { id: 'a', embedding: embedBrief('hero section for consumer mobile app') },
    { id: 'b', embedding: embedBrief('B2B SaaS pricing tiers with annual billing') },
    { id: 'c', embedding: embedBrief('404 error page with retro pixel art') },
    { id: 'd', embedding: embedBrief('SaaS pricing comparison table') },
  ];
  const top3 = topK(query, candidates, 3);
  assert.equal(top3.length, 3);
  assert.ok(top3[0].score >= top3[1].score, 'sorted descending');
  assert.ok(top3[1].score >= top3[2].score, 'sorted descending');
  // The two pricing-y briefs should be in the top 3.
  const ids = top3.map((t) => t.id);
  assert.ok(ids.includes('b'));
  assert.ok(ids.includes('d'));
});

test('topK tolerates number[] embeddings on candidates (read from JSONL)', () => {
  const query = embedBrief('pricing page');
  const vecAsArray = Array.from(embedBrief('pricing page'));
  const candidates = [{ id: 'jsonl', embedding: vecAsArray }];
  const top = topK(query, candidates, 1);
  assert.equal(top[0].id, 'jsonl');
  assert.ok(Math.abs(top[0].score - 1) < 1e-9);
});
