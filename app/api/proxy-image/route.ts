import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Server-side image proxy for PDF generation.
 * Fetches external images (Together AI CDN) server-side so the browser
 * never has to deal with CORS or expiring signed URLs.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: 'image/jpeg,image/png,image/*' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('proxy-image error:', err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
  }
}
