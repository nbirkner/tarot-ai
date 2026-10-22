import { NextRequest, NextResponse } from 'next/server';
import { fetchProxiedImage } from '../../../lib/proxy-image';

export const runtime = 'nodejs';

const NOSNIFF = { 'X-Content-Type-Options': 'nosniff' };

/**
 * Server-side image proxy for PDF generation.
 * Only https Together image CDN hosts are fetched, and only image/* bodies
 * under the size cap are returned.
 */
export async function GET(req: NextRequest) {
  const result = await fetchProxiedImage(req.nextUrl.searchParams.get('url'));
  if (!result.ok) {
    if (result.error !== 'missing') {
      console.error(`proxy-image: rejected reason=${result.error}`);
    }
    const error = result.error === 'missing' ? 'Missing url param' : 'Invalid image url';
    return NextResponse.json({ error }, { status: 400, headers: NOSNIFF });
  }

  return new NextResponse(Buffer.from(result.bytes), {
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
