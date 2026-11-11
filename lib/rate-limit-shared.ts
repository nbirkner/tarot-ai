export const RATE_LIMIT_MESSAGE = 'The cards need rest, come back later';
export const SPEND_CAP_MESSAGE = 'The deck is resting, try again tomorrow';
export const LIMITS_UNAVAILABLE_MESSAGE =
  'The cards cannot be drawn right now. Please try again later.';

/** Signed-out limits. A later signed-in cap must stay under the same daily dollar cap. */
export const READING_LIMITS = {
  perIpPerHour: 5,
  perIpPerDay: 20,
  globalPerDay: 300,
} as const;

export function upstashConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

/** Map a limiter HTTP response to the sentence the reading page shows. */
export function messageForLimitResponse(status: number, body: string): string | null {
  if (body.includes('"spend_cap"') || body.includes(SPEND_CAP_MESSAGE)) return SPEND_CAP_MESSAGE;
  if (status === 429 && (body.includes('"rate_limited"') || body.includes(RATE_LIMIT_MESSAGE))) {
    return RATE_LIMIT_MESSAGE;
  }
  if (status === 503 && body.includes('"limits_unavailable"')) return LIMITS_UNAVAILABLE_MESSAGE;
  return null;
}

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
/** How long one IP may reuse a reading id before it has to spend again. */
export const READING_ID_TTL_MS = 15 * 60 * 1000;

/** Celtic Cross is the largest spread. */
export const MAX_SPREAD_CARDS = 10;
/**
 * Text calls that reuse one reading id.
 * Celtic Cross is 10 card interpretations plus one synthesis.
 * The client retries one failed call, so there is a single spare.
 */
export const MAX_TEXT_CALLS_PER_READING = MAX_SPREAD_CARDS + 2;
/**
 * Image calls that reuse one reading id.
 * One generation per card, plus one retry. A second spare is unused by the UI.
 */
export const MAX_IMAGE_CALLS_PER_READING = MAX_SPREAD_CARDS + 1;

export function maxCallsFor(kind: QuotaKind): number {
  return kind === 'image' ? MAX_IMAGE_CALLS_PER_READING : MAX_TEXT_CALLS_PER_READING;
}

export type QuotaScope = 'hour' | 'day' | 'global' | 'reading' | 'unavailable';

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
 * In-process model of the reading windows, for tests.
 * Production must not use this. Signed-out limits live in Upstash, and a
 * Redis error blocks the paid call instead of falling back here.
 * One reading id spends a single shared IP/global slot. Text and image calls
 * then have their own per-reading counters, so a direct image call cannot
 * open a second hourly budget.
 */
export function createMemoryQuota(
  limits: {
    perIpPerHour: number;
    perIpPerDay: number;
    globalPerDay: number;
  } = READING_LIMITS,
): ReadingQuota {
  const hits = new Map<string, number[]>();
  const sessions = new Map<string, number>();
  const calls = new Map<string, { at: number; calls: number }>();

  function windowHits(key: string, now: number, windowMs: number): number[] {
    const fresh = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    hits.set(key, fresh);
    return fresh;
  }

  return {
    async consume(ip, readingId, now = Date.now(), kind = 'reading') {
      if (sessions.size > 2000) {
        for (const [key, at] of sessions) {
          if (now - at < READING_ID_TTL_MS) continue;
          sessions.delete(key);
          for (const callKey of calls.keys()) {
            if (callKey.endsWith(`:${key}`)) calls.delete(callKey);
          }
        }
      }

      const sessionKey = `${ip}:${readingId}`;
      const callKey = `${kind}:${sessionKey}`;
      const sessionAt = sessions.get(sessionKey);
      const maxCalls = maxCallsFor(kind);

      if (sessionAt !== undefined && now - sessionAt < READING_ID_TTL_MS) {
        const entry = calls.get(callKey);
        const used = entry && entry.at === sessionAt ? entry.calls : 0;
        if (used >= maxCalls) {
          return {
            ok: false,
            scope: 'reading',
            retryAfterSeconds: Math.max(1, Math.ceil((sessionAt + READING_ID_TTL_MS - now) / 1000)),
          };
        }
        calls.set(callKey, { at: sessionAt, calls: used + 1 });
        return { ok: true };
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
      sessions.set(sessionKey, now);
      calls.set(callKey, { at: now, calls: 1 });
      return { ok: true };
    },
  };
}
