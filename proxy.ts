import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { BASE_PATH } from './lib/base-path';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === BASE_PATH || pathname.startsWith(`${BASE_PATH}/`)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tarot-base', BASE_PATH);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/tarot-ai', '/tarot-ai/((?!_next/).*)'],
};
