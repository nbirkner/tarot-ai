import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DAY_MS,
  HOUR_MS,
  MAX_CALLS_PER_READING,
  MAX_SPREAD_CARDS,
  RATE_LIMIT_MESSAGE,
  READING_ID_TTL_MS,
  READING_LIMITS,
  clientIp,
  createMemoryQuota,
  normalizeReadingId,
} from './rate-limit-shared.ts';

describe('reading quota', () => {
  it('allows 5 readings an hour for one IP and blocks the 6th', async () => {
    const quota = createMemoryQuota();
    const now = Date.parse('2026-10-22T12:00:00Z');
    for (let i = 0; i < READING_LIMITS.perIpPerHour; i++) {
      const decision = await quota.consume('203.0.113.4', `reading-${i}`, now);
      assert.equal(decision.ok, true);
    }
    const blocked = await quota.consume('203.0.113.4', 'reading-extra', now);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.equal(blocked.scope, 'hour');
      assert.ok(blocked.retryAfterSeconds >= 1);
    }
  });

  it('counts one spread once when every card reuses the reading id', async () => {
    const quota = createMemoryQuota();
    const now = Date.parse('2026-10-22T12:00:00Z');
    const first = await quota.consume('203.0.113.5', 'spread-1', now);
    const again = await quota.consume('203.0.113.5', 'spread-1', now + 1000);
    assert.equal(first.ok, true);
    assert.equal(again.ok, true);

    for (let i = 0; i < 4; i++) {
      assert.equal((await quota.consume('203.0.113.5', `spread-${i + 2}`, now)).ok, true);
    }
    const sixth = await quota.consume('203.0.113.5', 'spread-6', now);
    assert.equal(sixth.ok, false);
    const replay = await quota.consume('203.0.113.5', 'spread-1', now);
    assert.equal(replay.ok, true);
  });

  it('resets the hourly window and still enforces 20 a day', async () => {
    const quota = createMemoryQuota();
    const start = Date.parse('2026-10-22T00:00:00Z');
    for (let i = 0; i < READING_LIMITS.perIpPerDay; i++) {
      const now = start + i * (HOUR_MS + 1000);
      const decision = await quota.consume('203.0.113.6', `day-${i}`, now);
      assert.equal(decision.ok, true, `reading ${i}`);
    }
    const blocked = await quota.consume(
      '203.0.113.6',
      'day-extra',
      start + READING_LIMITS.perIpPerDay * (HOUR_MS + 1000),
    );
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.scope, 'day');
    assert.ok(DAY_MS > HOUR_MS);
  });

  it('caps the whole app at 300 readings a day', async () => {
    const quota = createMemoryQuota();
    const now = Date.parse('2026-10-22T15:00:00Z');
    for (let i = 0; i < READING_LIMITS.globalPerDay; i++) {
      const decision = await quota.consume(`ip-${i}`, `g-${i}`, now);
      assert.equal(decision.ok, true);
    }
    const blocked = await quota.consume('198.51.100.99', 'g-extra', now);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.scope, 'global');
  });

  it('stops reusing a reading id after cards plus two calls', async () => {
    const quota = createMemoryQuota();
    const now = Date.parse('2026-10-22T12:00:00Z');
    assert.equal(MAX_CALLS_PER_READING, MAX_SPREAD_CARDS + 2);

    for (let i = 0; i < MAX_CALLS_PER_READING; i++) {
      const decision = await quota.consume('203.0.113.7', 'spread-cap', now + i);
      assert.equal(decision.ok, true, `call ${i}`);
    }
    const capped = await quota.consume('203.0.113.7', 'spread-cap', now + 50);
    assert.equal(capped.ok, false);
    if (!capped.ok) assert.equal(capped.scope, 'reading');

    // The repeated id spent one hourly slot, so the rest of the hour is still open.
    for (let i = 0; i < READING_LIMITS.perIpPerHour - 1; i++) {
      assert.equal((await quota.consume('203.0.113.7', `other-${i}`, now)).ok, true);
    }
    const blocked = await quota.consume('203.0.113.7', 'other-extra', now);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.scope, 'hour');
  });

  it('counts image generations on their own spend budget', async () => {
    const quota = createMemoryQuota();
    const now = Date.parse('2026-10-22T18:00:00Z');
    const ip = '203.0.113.8';

    assert.equal((await quota.consume(ip, 'spread-img', now, 'reading')).ok, true);
    for (let i = 0; i < MAX_CALLS_PER_READING; i++) {
      assert.equal((await quota.consume(ip, 'spread-img', now + i, 'image')).ok, true);
    }
    const imageCap = await quota.consume(ip, 'spread-img', now, 'image');
    assert.equal(imageCap.ok, false);
    if (!imageCap.ok) assert.equal(imageCap.scope, 'reading');

    for (let i = 0; i < READING_LIMITS.perIpPerHour - 1; i++) {
      assert.equal((await quota.consume(ip, `img-${i}`, now, 'image')).ok, true);
    }
    const imagesBlocked = await quota.consume(ip, 'img-extra', now, 'image');
    assert.equal(imagesBlocked.ok, false);
    if (!imagesBlocked.ok) assert.equal(imagesBlocked.scope, 'hour');

    // Text budget was charged once and is not shared with images.
    assert.equal((await quota.consume(ip, 'another-reading', now, 'reading')).ok, true);
  });

  it('charges a reading id again after its allowance expires', async () => {
    const quota = createMemoryQuota();
    const now = Date.parse('2026-10-22T12:00:00Z');
    assert.equal((await quota.consume('203.0.113.10', 'spread-ttl', now)).ok, true);
    assert.equal((await quota.consume('203.0.113.10', 'spread-ttl', now + READING_ID_TTL_MS - 1)).ok, true);
    assert.equal((await quota.consume('203.0.113.10', 'spread-ttl', now + READING_ID_TTL_MS)).ok, true);

    for (let i = 0; i < READING_LIMITS.perIpPerHour - 2; i++) {
      assert.equal((await quota.consume('203.0.113.10', `ttl-${i}`, now)).ok, true);
    }
    const blocked = await quota.consume('203.0.113.10', 'ttl-extra', now);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.scope, 'hour');
  });

  it('reads the client IP and keeps a stable reading id', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' });
    assert.equal(clientIp(headers), '203.0.113.9');
    assert.equal(clientIp(new Headers()), 'unknown');
    assert.equal(normalizeReadingId('reading-id-1'), 'reading-id-1');
    assert.notEqual(normalizeReadingId('no'), 'no');
    assert.equal(RATE_LIMIT_MESSAGE, 'The cards need rest, come back later');
  });
});
