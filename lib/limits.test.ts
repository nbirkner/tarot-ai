import assert from 'node:assert/strict';
import fs from 'node:fs';
import { afterEach, describe, it } from 'node:test';
import { failClosedQuota, getReadingQuota, resetLimitsForTests } from './rate-limit.ts';

describe('limit store outage', () => {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  afterEach(() => {
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
    resetLimitsForTests();
  });

  it('blocks every IP when Upstash is not configured', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    resetLimitsForTests();
    const now = Date.parse('2026-11-11T12:00:00Z');
    const first = await getReadingQuota().consume('203.0.113.1', 'reading-aaaaaa', now);
    const second = await getReadingQuota().consume('203.0.113.2', 'reading-bbbbbb', now);
    assert.equal(first.ok, false);
    assert.equal(second.ok, false);
    if (!first.ok) assert.equal(first.scope, 'unavailable');
    if (!second.ok) assert.equal(second.scope, 'unavailable');
  });

  it('keeps blocking after redis throws instead of using memory', async () => {
    const quota = failClosedQuota({
      async consume() {
        throw new Error('ECONNRESET');
      },
    });
    const first = await quota.consume('203.0.113.3', 'reading-cccccc');
    const second = await quota.consume('198.51.100.4', 'reading-dddddd');
    assert.equal(first.ok, false);
    assert.equal(second.ok, false);
    if (!first.ok) assert.equal(first.scope, 'unavailable');
    if (!second.ok) assert.equal(second.scope, 'unavailable');
  });

  it('keeps the production limiter on the shared Upstash keys', () => {
    const src = fs.readFileSync(new URL('./rate-limit.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(src, /createMemoryQuota/);
    assert.doesNotMatch(src, /image:\$\{/);
    assert.match(src, /tarot:status:\$\{ip\}:\$\{readingId\}/);
  });
});
