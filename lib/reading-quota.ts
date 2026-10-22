import { NextResponse } from 'next/server';
import { RATE_LIMIT_MESSAGE, clientIp, getReadingQuota, normalizeReadingId } from './rate-limit';

export async function readingLimitResponse(request: { headers: Headers }): Promise<NextResponse | null> {
  const decision = await getReadingQuota().consume(
    clientIp(request.headers),
    normalizeReadingId(request.headers.get('x-reading-id')),
  );
  if (decision.ok) return null;

  console.error(
    `reading-quota: denied scope=${decision.scope} retryAfter=${decision.retryAfterSeconds}s`,
  );
  return NextResponse.json(
    { error: 'rate_limited', message: RATE_LIMIT_MESSAGE },
    {
      status: 429,
      headers: { 'Retry-After': String(decision.retryAfterSeconds) },
    },
  );
}
