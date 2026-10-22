import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  READING_ID_TTL_MS,
  READING_LIMITS,
  type QuotaScope,
  type ReadingQuota,
  createMemoryQuota,
} from './rate-limit-shared';

export {
  RATE_LIMIT_MESSAGE,
  READING_LIMITS,
  clientIp,
  normalizeReadingId,
} from './rate-limit-shared';

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

  const windows: { scope: QuotaScope; limit: Ratelimit; id: (ip: string) => string }[] = [
    { scope: 'hour', limit: hour, id: (ip) => ip },
    { scope: 'day', limit: day, id: (ip) => ip },
    { scope: 'global', limit: global, id: () => 'all' },
  ];

  return {
    async consume(ip, readingId) {
      const seenKey = `tarot:reading:${ip}:${readingId}`;
      const existing = await redis.get<string>(seenKey);
      if (existing === 'ok') return { ok: true };

      const lockKey = `tarot:lock:${ip}:${readingId}`;
      const locked = await redis.set(lockKey, '1', { nx: true, ex: 30 });
      if (locked !== 'OK') {
        for (let i = 0; i < 25; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const value = await redis.get<string>(seenKey);
          if (value === 'ok') return { ok: true };
          if (value === 'no') return { ok: false, scope: 'hour', retryAfterSeconds: 30 };
        }
        return { ok: false, scope: 'hour', retryAfterSeconds: 5 };
      }

      try {
        for (const window of windows) {
          const result = await window.limit.limit(window.id(ip));
          if (!result.success) {
            await redis.set(seenKey, 'no', { ex: 30 });
            return {
              ok: false,
              scope: window.scope,
              retryAfterSeconds: secondsUntil(result.reset),
            };
          }
        }
        await redis.set(seenKey, 'ok', { ex: Math.ceil(READING_ID_TTL_MS / 1000) });
        return { ok: true };
      } finally {
        await redis.del(lockKey);
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
      async consume(ip, readingId, now) {
        try {
          return await upstash.consume(ip, readingId, now);
        } catch (err) {
          console.error(
            `reading-quota: redis unavailable, using in-memory limiter (${err instanceof Error ? err.name : 'Error'})`,
          );
          return memory.consume(ip, readingId, now);
        }
      },
    };
  }
  return cached;
}
