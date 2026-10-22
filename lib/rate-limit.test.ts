import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DAY_MS,
  HOUR_MS,
  RATE_LIMIT_MESSAGE,
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

  it('reads the client IP and keeps a stable reading id', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' });
    assert.equal(clientIp(headers), '203.0.113.9');
    assert.equal(clientIp(new Headers()), 'unknown');
    assert.equal(normalizeReadingId('reading-id-1'), 'reading-id-1');
    assert.notEqual(normalizeReadingId('no'), 'no');
    assert.equal(RATE_LIMIT_MESSAGE, 'The cards need rest, come back later');
  });
});
