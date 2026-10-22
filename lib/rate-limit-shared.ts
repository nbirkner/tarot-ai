export const RATE_LIMIT_MESSAGE = 'The cards need rest, come back later';

export const READING_LIMITS = {
  perIpPerHour: 5,
  perIpPerDay: 20,
  globalPerDay: 300,
} as const;

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
/** How long one IP may reuse a reading id before it has to spend again. */
export const READING_ID_TTL_MS = 15 * 60 * 1000;

/** Celtic Cross is the largest spread. */
export const MAX_SPREAD_CARDS = 10;
/**
 * Hard cap on calls that reuse one reading id.
 * One call per card, plus synthesis and a single spare (cards + 2).
 * Image generations use a separate counter with the same cap.
 */
export const MAX_CALLS_PER_READING = MAX_SPREAD_CARDS + 2;

export type QuotaScope = 'hour' | 'day' | 'global' | 'reading';

/** Text/chat routes share a reading allowance. Card images spend on their own. */
export type QuotaKind = 'reading' | 'image';

export type QuotaDecision =
  | { ok: true }
  | { ok: false; scope: QuotaScope; retryAfterSeconds: number };

export interface ReadingQuota {
  consume(
    ip: string,
    readingId: string,
    now?: number,
    kind?: QuotaKind,
  ): Promise<QuotaDecision>;
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
type Allowance = { at: number; calls: number };

export function createMemoryQuota(
  limits: {
    perIpPerHour: number;
    perIpPerDay: number;
    globalPerDay: number;
  } = READING_LIMITS,
): ReadingQuota {
  const hits = new Map<string, number[]>();
  const allowances = new Map<string, Allowance>();

  function windowHits(key: string, now: number, windowMs: number): number[] {
    const fresh = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    hits.set(key, fresh);
    return fresh;
  }

  return {
    async consume(ip, readingId, now = Date.now(), kind = 'reading') {
      if (allowances.size > 2000) {
        for (const [key, entry] of allowances) {
          if (now - entry.at >= READING_ID_TTL_MS) allowances.delete(key);
        }
      }

      // Image generations do not ride a text allow. Each kind has its own
      // counter, and the first call of that kind consumes the spend windows.
      const allowanceKey = `${kind}:${ip}:${readingId}`;
      const entry = allowances.get(allowanceKey);
      if (entry && now - entry.at < READING_ID_TTL_MS) {
        if (entry.calls >= MAX_CALLS_PER_READING) {
          return {
            ok: false,
            scope: 'reading',
            retryAfterSeconds: Math.max(1, Math.ceil((entry.at + READING_ID_TTL_MS - now) / 1000)),
          };
        }
        entry.calls += 1;
        return { ok: true };
      }

      // Same numeric spend limits as readings, on a separate counter so card
      // images are not waived by an earlier text allow and do not eat it either.
      const hour = windowHits(`${kind}:hour:${ip}`, now, HOUR_MS);
      const day = windowHits(`${kind}:day:${ip}`, now, DAY_MS);
      const global = windowHits(`${kind}:global`, now, DAY_MS);

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
      allowances.set(allowanceKey, { at: now, calls: 1 });
      return { ok: true };
    },
  };
}
