export const RATE_LIMIT_MESSAGE = 'The cards need rest, come back later';

export const READING_LIMITS = {
  perIpPerHour: 5,
  perIpPerDay: 20,
  globalPerDay: 300,
} as const;

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
/** Retries inside one spread share a reading id and do not count again. */
export const READING_ID_TTL_MS = 15 * 60 * 1000;

export type QuotaScope = 'hour' | 'day' | 'global';

export type QuotaDecision =
  | { ok: true }
  | { ok: false; scope: QuotaScope; retryAfterSeconds: number };

export interface ReadingQuota {
  consume(ip: string, readingId: string, now?: number): Promise<QuotaDecision>;
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real.slice(0, 80);
  return 'unknown';
}

export function normalizeReadingId(raw: string | null | undefined): string {
  const id = raw?.trim() ?? '';
  if (/^[A-Za-z0-9_-]{8,80}$/.test(id)) return id;
  return crypto.randomUUID();
}

function retryAfter(hits: number[], now: number, windowMs: number): number {
  if (hits.length === 0) return 1;
  const oldest = hits[0];
  return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
}

/**
 * Sliding-window limiter used when Upstash env vars are absent, and as the
 * fallback if Redis throws. One process only — production should set Upstash
 * so the cap is shared across serverless instances.
 */
export function createMemoryQuota(
  limits: {
    perIpPerHour: number;
    perIpPerDay: number;
    globalPerDay: number;
  } = READING_LIMITS,
): ReadingQuota {
  const hits = new Map<string, number[]>();
  const seen = new Map<string, number>();

  function windowHits(key: string, now: number, windowMs: number): number[] {
    const fresh = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    hits.set(key, fresh);
    return fresh;
  }

  return {
    async consume(ip, readingId, now = Date.now()) {
      const seenKey = `${ip}:${readingId}`;
      const seenAt = seen.get(seenKey);
      if (seenAt !== undefined && now - seenAt < READING_ID_TTL_MS) return { ok: true };

      if (seen.size > 2000) {
        for (const [key, at] of seen) {
          if (now - at >= READING_ID_TTL_MS) seen.delete(key);
        }
      }

      const hour = windowHits(`hour:${ip}`, now, HOUR_MS);
      const day = windowHits(`day:${ip}`, now, DAY_MS);
      const global = windowHits('global', now, DAY_MS);

      if (hour.length >= limits.perIpPerHour) {
        return { ok: false, scope: 'hour', retryAfterSeconds: retryAfter(hour, now, HOUR_MS) };
      }
      if (day.length >= limits.perIpPerDay) {
        return { ok: false, scope: 'day', retryAfterSeconds: retryAfter(day, now, DAY_MS) };
      }
      if (global.length >= limits.globalPerDay) {
        return { ok: false, scope: 'global', retryAfterSeconds: retryAfter(global, now, DAY_MS) };
      }

      hour.push(now);
      day.push(now);
      global.push(now);
      seen.set(seenKey, now);
      return { ok: true };
    },
  };
}
