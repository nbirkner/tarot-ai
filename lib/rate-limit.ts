import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  READING_ID_TTL_MS,
  READING_LIMITS,
  maxCallsFor,
  upstashConfigured,
  type QuotaKind,
  type QuotaScope,
  type ReadingQuota,
} from './rate-limit-shared';

export {
  LIMITS_UNAVAILABLE_MESSAGE,
  MAX_IMAGE_CALLS_PER_READING,
  MAX_TEXT_CALLS_PER_READING,
  RATE_LIMIT_MESSAGE,
  READING_LIMITS,
  SPEND_CAP_MESSAGE,
  clientIp,
  maxCallsFor,
  messageForLimitResponse,
  normalizeReadingId,
  upstashConfigured,
} from './rate-limit-shared';
export type { QuotaKind, QuotaScope } from './rate-limit-shared';

function secondsUntil(resetMs: number, now = Date.now()): number {
  return Math.max(1, Math.ceil((resetMs - now) / 1000));
}

const unavailableQuota: ReadingQuota = {
  async consume() {
    return { ok: false, scope: 'unavailable', retryAfterSeconds: 30 };
  },
};

/** Redis errors block the paid call. They never fall through to process memory. */
export function failClosedQuota(inner: ReadingQuota): ReadingQuota {
  return {
    async consume(ip, readingId, now, kind) {
      try {
        return await inner.consume(ip, readingId, now, kind);
      } catch (err) {
        console.error(
          `reading-quota: redis unavailable, blocking paid calls (${err instanceof Error ? err.name : 'Error'})`,
        );
        return { ok: false, scope: 'unavailable', retryAfterSeconds: 30 };
      }
    },
  };
}

type WindowLimit = {
  scope: Exclude<QuotaScope, 'reading' | 'unavailable'>;
  limit: Ratelimit;
  id: (ip: string) => string;
};

export function createUpstashQuota(redis: Redis): ReadingQuota {
  const hour = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(READING_LIMITS.perIpPerHour, '1 h'),
    prefix: 'tarot:ip:hour',
    analytics: false,
  });
  const day = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(READING_LIMITS.perIpPerDay, '1 d'),
    prefix: 'tarot:ip:day',
    analytics: false,
  });
  const global = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(READING_LIMITS.globalPerDay, '1 d'),
    prefix: 'tarot:global:day',
    analytics: false,
  });

  // Text and image routes share these ids. A direct image call spends the
  // same per-IP and global reading slots as a text call.
  const windows: WindowLimit[] = [
    { scope: 'hour', limit: hour, id: (ip) => ip },
    { scope: 'day', limit: day, id: (ip) => ip },
    { scope: 'global', limit: global, id: () => 'all' },
  ];

  const ttlSec = Math.ceil(READING_ID_TTL_MS / 1000);

  return {
    async consume(ip, readingId, _now, kind: QuotaKind = 'reading') {
      const countKey = `tarot:count:${kind}:${ip}:${readingId}`;
      const statusKey = `tarot:status:${ip}:${readingId}`;
      const lockKey = `tarot:lock:${ip}:${readingId}`;
      const maxCalls = maxCallsFor(kind);

      const status = await redis.get<string>(statusKey);
      if (status === 'no') {
        return { ok: false, scope: 'hour', retryAfterSeconds: 30 };
      }

      const count = await redis.incr(countKey);
      if (count === 1) await redis.expire(countKey, ttlSec);
      if (count > maxCalls) {
        const ttl = await redis.ttl(countKey);
        return {
          ok: false,
          scope: 'reading',
          retryAfterSeconds: Math.max(1, typeof ttl === 'number' && ttl > 0 ? ttl : ttlSec),
        };
      }
      if (status === 'ok') return { ok: true };

      if (count > 1) {
        return waitForStatus(redis, statusKey, countKey);
      }

      const lock = await redis.set(lockKey, '1', { nx: true, ex: 30 });
      if (!lock) {
        return waitForStatus(redis, statusKey, countKey);
      }

      const statusNow = await redis.get<string>(statusKey);
      if (statusNow === 'no') {
        await redis.del(countKey);
        return { ok: false, scope: 'hour', retryAfterSeconds: 30 };
      }
      if (statusNow === 'ok') return { ok: true };

      try {
        for (const window of windows) {
          const result = await window.limit.limit(window.id(ip));
          if (!result.success) {
            await redis.set(statusKey, 'no', { ex: 30 });
            await redis.del(countKey);
            return {
              ok: false,
              scope: window.scope,
              retryAfterSeconds: secondsUntil(result.reset),
            };
          }
        }
        await redis.set(statusKey, 'ok', { ex: ttlSec });
        await redis.expire(countKey, ttlSec);
        return { ok: true };
      } catch (err) {
        await redis.del(countKey);
        await redis.del(lockKey);
        throw err;
      }
    },
  };
}

async function waitForStatus(redis: Redis, statusKey: string, countKey: string) {
  for (let i = 0; i < 25; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const value = await redis.get<string>(statusKey);
    if (value === 'ok') return { ok: true as const };
    if (value === 'no') {
      await redis.del(countKey);
      return { ok: false as const, scope: 'hour' as const, retryAfterSeconds: 30 };
    }
  }
  return { ok: false as const, scope: 'unavailable' as const, retryAfterSeconds: 5 };
}

let cached: ReadingQuota | undefined;
let quotaOverride: ReadingQuota | null = null;

export function setReadingQuotaForTests(quota: ReadingQuota | null): void {
  quotaOverride = quota;
  cached = undefined;
}

export function resetLimitsForTests(): void {
  cached = undefined;
  quotaOverride = null;
}

export function getReadingQuota(): ReadingQuota {
  if (quotaOverride) return failClosedQuota(quotaOverride);
  if (!upstashConfigured()) return unavailableQuota;
  if (!cached) cached = failClosedQuota(createUpstashQuota(Redis.fromEnv()));
  return cached;
}
