import { Redis } from '@upstash/redis';
import { IMAGE_PRICE_MICRODOLLARS } from './images';
import { upstashConfigured } from './rate-limit-shared';

/**
 * Daily Together spend, stored in Upstash Redis.
 *
 * The ledger is integer microdollars (millionths of a dollar) so a card
 * image is not rounded away. Each paid call reserves its estimate with one
 * Redis script, then settles to the measured cost. The script is the critical
 * section: Redis runs it atomically, so two servers cannot both pass a check
 * against a stale total.
 *
 * There is no in-memory ledger. If Redis is missing or errors, the call is
 * refused. Vercel Runtime Cache is ephemeral and per-region, so it cannot
 * hold this cap. A new database is unnecessary; Upstash is already on the project.
 */

export const MICRODOLLARS_PER_CENT = 10_000;
export const DEFAULT_DAILY_SPEND_CAP_CENTS = 200;

/**
 * Together list price for Qwen3.5 9B, USD per 1M tokens.
 * Together does not publish a cheaper cached-input rate for this model,
 * so cached tokens are reserved at the input price.
 */
export const CHAT_INPUT_USD_PER_MILLION = 0.17;
export const CHAT_CACHED_INPUT_USD_PER_MILLION = 0.17;
export const CHAT_OUTPUT_USD_PER_MILLION = 0.25;

/**
 * Input-token upper bound. English is about 4 characters per token; dividing
 * by 2 reserves roughly twice the likely input so the later settle only refunds.
 */
export const CHARS_PER_TOKEN_UPPER = 2;

/** Catalog estimate for one FLUX.1 Kontext [pro] card at 2:3, in microdollars. */
export { IMAGE_PRICE_MICRODOLLARS };

/**
 * Together bills reference images from the provider and does not publish the
 * surcharge. Reserve twice the catalog estimate and do not refund it on success.
 */
export const REFERENCE_IMAGE_PRICE_MULTIPLIER = 2;
export const IMAGE_REFERENCE_PRICE_MICRODOLLARS =
  IMAGE_PRICE_MICRODOLLARS * REFERENCE_IMAGE_PRICE_MULTIPLIER;

export type ChatUsage = {
  prompt_tokens: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
};

export type SpendReservation =
  | {
      ok: true;
      estimateMicro: number;
      settle: (actualMicro: number) => Promise<void>;
    }
  | { ok: false; reason: 'cap' | 'unavailable'; retryAfterSeconds: number };

export type RedisEval = (script: string, keys: string[], args: string[]) => Promise<unknown>;

export const RESERVE_SCRIPT = `-- tarot-reserve-v1
local cap = tonumber(ARGV[1])
local estimate = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])
if estimate == nil or estimate < 1 or cap == nil or cap < 0 then
  return {0, 0}
end
local spent = tonumber(redis.call('GET', KEYS[1]) or '0') or 0
if spent + estimate > cap then
  return {0, spent}
end
local nxt = spent + estimate
redis.call('SET', KEYS[1], nxt, 'EX', ttl)
return {1, nxt}
`;

export const SETTLE_SCRIPT = `-- tarot-settle-v1
local estimate = tonumber(ARGV[1])
local actual = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])
if estimate == nil or estimate < 0 then
  return -1
end
if actual == nil or actual < 0 then
  actual = 0
end
if actual > estimate then
  actual = estimate
end
local spent = tonumber(redis.call('GET', KEYS[1]) or '0') or 0
local nxt = spent - estimate + actual
if nxt < 0 then
  nxt = 0
end
redis.call('SET', KEYS[1], nxt, 'EX', ttl)
return nxt
`;

export function dailySpendCapMicrodollars(
  raw: string | undefined = process.env.TAROT_DAILY_SPEND_CAP_CENTS,
): number {
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_DAILY_SPEND_CAP_CENTS * MICRODOLLARS_PER_CENT;
  }
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return 0;
  const cents = Number(trimmed);
  if (!Number.isSafeInteger(cents)) return 0;
  return cents * MICRODOLLARS_PER_CENT;
}

export function spendKey(now = Date.now()): string {
  return `tarot:spend:${new Date(now).toISOString().slice(0, 10)}`;
}

/** Keep the key through the UTC day, plus two hours for a late settle. */
export function spendTtlSeconds(now = Date.now()): number {
  const dayMs = 24 * 60 * 60 * 1000;
  const nextMidnight = Math.ceil((now + 1) / dayMs) * dayMs;
  return Math.max(120, Math.ceil((nextMidnight - now) / 1000) + 2 * 60 * 60);
}

export function secondsUntilUtcMidnight(now = Date.now()): number {
  const dayMs = 24 * 60 * 60 * 1000;
  const nextMidnight = Math.ceil((now + 1) / dayMs) * dayMs;
  return Math.max(1, Math.ceil((nextMidnight - now) / 1000));
}

export function estimateChatMicrodollars(inputChars: number, maxOutputTokens: number): number {
  const inputTokens = Math.max(1, Math.ceil(Math.max(0, inputChars) / CHARS_PER_TOKEN_UPPER));
  const outputTokens = Math.max(0, Math.floor(maxOutputTokens));
  return Math.ceil(
    inputTokens * CHAT_INPUT_USD_PER_MILLION + outputTokens * CHAT_OUTPUT_USD_PER_MILLION,
  );
}

export function estimateMessagesMicro(
  messages: { content: string }[],
  maxOutputTokens: number,
): number {
  const chars = messages.reduce((sum, message) => sum + message.content.length, 0);
  return estimateChatMicrodollars(chars, maxOutputTokens);
}

export function chatUsageMicrodollars(usage: ChatUsage): number {
  const prompt = Math.max(0, usage.prompt_tokens);
  const completion = Math.max(0, usage.completion_tokens ?? 0);
  const cached = Math.min(Math.max(0, usage.prompt_tokens_details?.cached_tokens ?? 0), prompt);
  const uncached = prompt - cached;
  return Math.ceil(
    uncached * CHAT_INPUT_USD_PER_MILLION +
      cached * CHAT_CACHED_INPUT_USD_PER_MILLION +
      completion * CHAT_OUTPUT_USD_PER_MILLION,
  );
}

/** Actual chat cost, never above the reservation that already cleared the cap. */
export function settleMicro(estimateMicro: number, usage: ChatUsage | null): number {
  if (!usage || typeof usage.prompt_tokens !== 'number') return estimateMicro;
  return Math.min(estimateMicro, Math.max(0, chatUsageMicrodollars(usage)));
}

let spendEvalOverride: RedisEval | null = null;
let redis: Redis | undefined;

export function setSpendRedisForTests(evalFn: RedisEval | null): void {
  spendEvalOverride = evalFn;
  redis = undefined;
}

async function evalSpend(script: string, keys: string[], args: string[]): Promise<unknown> {
  if (spendEvalOverride) return spendEvalOverride(script, keys, args);
  if (!upstashConfigured()) throw new Error('spend-cap: upstash is not configured');
  if (!redis) redis = Redis.fromEnv();
  return redis.eval(script, keys, args);
}

function readReserveReply(raw: unknown): { ok: boolean; spent: number } {
  let pair: unknown[] | null = null;
  if (Array.isArray(raw)) pair = raw;
  else if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    pair = [record[1] ?? record['1'], record[2] ?? record['2']];
  }
  if (!pair || pair.length < 2) throw new Error('spend-cap: unexpected reserve reply');
  const ok = Number(pair[0]);
  const spent = Number(pair[1]);
  if (!Number.isFinite(ok) || !Number.isFinite(spent)) {
    throw new Error('spend-cap: unexpected reserve reply');
  }
  return { ok: ok === 1, spent };
}

export async function reserveDailySpend(
  estimateMicro: number,
  now = Date.now(),
): Promise<SpendReservation> {
  if (!Number.isInteger(estimateMicro) || estimateMicro <= 0) {
    return { ok: false, reason: 'unavailable', retryAfterSeconds: 30 };
  }

  const cap = dailySpendCapMicrodollars();
  const key = spendKey(now);
  const ttl = String(spendTtlSeconds(now));

  let reserved: { ok: boolean; spent: number };
  try {
    reserved = readReserveReply(
      await evalSpend(RESERVE_SCRIPT, [key], [String(cap), String(estimateMicro), ttl]),
    );
  } catch (err) {
    console.error(
      `spend-cap: reserve failed, blocking paid call (${err instanceof Error ? err.name : 'Error'})`,
    );
    return { ok: false, reason: 'unavailable', retryAfterSeconds: 30 };
  }

  if (!reserved.ok) {
    const retryAfterSeconds = secondsUntilUtcMidnight(now);
    console.error(
      `spend-cap: daily cap reached estimate=${estimateMicro} spent=${reserved.spent} cap=${cap} retryAfter=${retryAfterSeconds}s`,
    );
    return { ok: false, reason: 'cap', retryAfterSeconds };
  }

  let settled = false;
  return {
    ok: true,
    estimateMicro,
    async settle(actualMicro: number) {
      if (settled) return;
      settled = true;
      const actual = Math.min(
        estimateMicro,
        Math.max(0, Number.isFinite(actualMicro) ? Math.floor(actualMicro) : 0),
      );
      try {
        await evalSpend(SETTLE_SCRIPT, [key], [String(estimateMicro), String(actual), ttl]);
      } catch (err) {
        console.error(
          `spend-cap: settle failed, reservation kept (${err instanceof Error ? err.name : 'Error'})`,
        );
      }
    },
  };
}
