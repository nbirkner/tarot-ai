import { NextResponse } from 'next/server';
import {
  LIMITS_UNAVAILABLE_MESSAGE,
  RATE_LIMIT_MESSAGE,
  SPEND_CAP_MESSAGE,
  clientIp,
  getReadingQuota,
  normalizeReadingId,
  type QuotaKind,
} from './rate-limit';
import { reserveDailySpend } from './spend';

export async function readingLimitResponse(
  request: { headers: Headers },
  kind: QuotaKind = 'reading',
): Promise<NextResponse | null> {
  let decision;
  try {
    decision = await getReadingQuota().consume(
      clientIp(request.headers),
      normalizeReadingId(request.headers.get('x-reading-id')),
      undefined,
      kind,
    );
  } catch (err) {
    console.error(
      `reading-quota: store unavailable, blocking paid call (${err instanceof Error ? err.name : 'Error'})`,
    );
    decision = { ok: false as const, scope: 'unavailable' as const, retryAfterSeconds: 30 };
  }
  if (decision.ok) return null;

  if (decision.scope === 'unavailable') {
    console.error('reading-quota: denied scope=unavailable');
    return limitsUnavailableResponse();
  }

  console.error(
    `reading-quota: denied kind=${kind} scope=${decision.scope} retryAfter=${decision.retryAfterSeconds}s`,
  );
  return NextResponse.json(
    { error: 'rate_limited', message: RATE_LIMIT_MESSAGE },
    {
      status: 429,
      headers: { 'Retry-After': String(decision.retryAfterSeconds) },
    },
  );
}

export function spendCapResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: 'spend_cap', message: SPEND_CAP_MESSAGE },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    },
  );
}

export function limitsUnavailableResponse(): NextResponse {
  return NextResponse.json(
    { error: 'limits_unavailable', message: LIMITS_UNAVAILABLE_MESSAGE },
    { status: 503 },
  );
}

export async function takeSpend(estimateMicro: number) {
  const reserved = await reserveDailySpend(estimateMicro);
  if (reserved.ok) return reserved;
  if (reserved.reason === 'cap') {
    return { ok: false as const, response: spendCapResponse(reserved.retryAfterSeconds) };
  }
  return { ok: false as const, response: limitsUnavailableResponse() };
}
