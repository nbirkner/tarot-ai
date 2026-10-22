import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  MAX_CALLS_PER_READING,
  READING_ID_TTL_MS,
  READING_LIMITS,
  type QuotaKind,
  type QuotaScope,
  type ReadingQuota,
  createMemoryQuota,
} from './rate-limit-shared';

export {
  MAX_CALLS_PER_READING,
  RATE_LIMIT_MESSAGE,
  READING_LIMITS,
  clientIp,
  normalizeReadingId,
} from './rate-limit-shared';
export type { QuotaKind, QuotaScope } from './rate-limit-shared';

export function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function secondsUntil(resetMs: number, now = Date.now()): number {
  return Math.max(1, Math.ceil((resetMs - now) / 1000));
}

function createUpstashQuota(): ReadingQuota {
  const redis = Redis.fromEnv();
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

  const windows: { scope: Exclude<QuotaScope, 'reading'>; limit: Ratelimit; id: (ip: string, kind: QuotaKind) => string }[] = [
    { scope: 'hour', limit: hour, id: (ip, kind) => (kind === 'reading' ? ip : `image:${ip}`) },
    { scope: 'day', limit: day, id: (ip, kind) => (kind === 'reading' ? ip : `image:${ip}`) },
    { scope: 'global', limit: global, id: (_ip, kind) => (kind === 'reading' ? 'all' : 'image:all') },
  ];

  const ttlSec = Math.ceil(READING_ID_TTL_MS / 1000);

  return {
    async consume(ip, readingId, _now, kind = 'reading') {
      const countKey = `tarot:count:${kind}:${ip}:${readingId}`;
      const statusKey = `tarot:status:${kind}:${ip}:${readingId}`;

      const status = await redis.get<string>(statusKey);
      if (status === 'no') {
        return { ok: false, scope: 'hour', retryAfterSeconds: 30 };
      }

      const count = await redis.incr(countKey);
      if (count === 1) await redis.expire(countKey, ttlSec);
      if (count > MAX_CALLS_PER_READING) {
        const ttl = await redis.ttl(countKey);
        return {
          ok: false,
          scope: 'reading',
          retryAfterSeconds: Math.max(1, typeof ttl === 'number' && ttl > 0 ? ttl : ttlSec),
        };
      }
      if (status === 'ok') return { ok: true };

      if (count > 1) {
        for (let i = 0; i < 25; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const value = await redis.get<string>(statusKey);
          if (value === 'ok') return { ok: true };
          if (value === 'no') return { ok: false, scope: 'hour', retryAfterSeconds: 30 };
        }
        return { ok: false, scope: 'hour', retryAfterSeconds: 5 };
      }

      const statusNow = await redis.get<string>(statusKey);
      if (statusNow === 'no') {
        await redis.del(countKey);
        return { ok: false, scope: 'hour', retryAfterSeconds: 30 };
      }
      if (statusNow === 'ok') return { ok: true };

      try {
        for (const window of windows) {
          const result = await window.limit.limit(window.id(ip, kind));
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
        throw err;
      }
    },
  };
}

let cached: ReadingQuota | undefined;
let cachedMode: 'upstash' | 'memory' | undefined;

/** Upstash when both REST env vars are set; otherwise an in-memory limiter. */
export function getReadingQuota(): ReadingQuota {
  const mode = upstashConfigured() ? 'upstash' : 'memory';
  if (!cached || cachedMode !== mode) {
    cachedMode = mode;
    if (mode === 'memory') {
      cached = createMemoryQuota();
      return cached;
    }
    const memory = createMemoryQuota();
    const upstash = createUpstashQuota();
    cached = {
      async consume(ip, readingId, now, kind) {
        try {
          return await upstash.consume(ip, readingId, now, kind);
        } catch (err) {
          console.error(
            `reading-quota: redis unavailable, using in-memory limiter (${err instanceof Error ? err.name : 'Error'})`,
          );
          return memory.consume(ip, readingId, now, kind);
        }
      },
    };
  }
  return cached;
}
