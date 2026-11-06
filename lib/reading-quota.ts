import { NextResponse } from 'next/server';
import {
  RATE_LIMIT_MESSAGE,
  clientIp,
  getReadingQuota,
  normalizeReadingId,
  type QuotaKind,
} from './rate-limit';

export async function readingLimitResponse(
  request: { headers: Headers },
  kind: QuotaKind = 'reading',
): Promise<NextResponse | null> {
  const decision = await getReadingQuota().consume(
    clientIp(request.headers),
    normalizeReadingId(request.headers.get('x-reading-id')),
    undefined,
    kind,
  );
  if (decision.ok) return null;

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
