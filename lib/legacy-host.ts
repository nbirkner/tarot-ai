/**
 * tarotacle.vercel.app was an earlier deployment host. Only that host
 * permanently redirects onto the canonical site. Other hosts, including
 * www.nikibirkner.com and later Vercel preview hosts, stay where they are.
 */
export const TAROTACLE_HOST = 'tarotacle.vercel.app';
export const CANONICAL_ORIGIN = 'https://www.nikibirkner.com';

export type HostRedirect = {
  source: string;
  has: { type: 'host'; value: string }[];
  destination: string;
  permanent: true;
};

function hostHas(): HostRedirect['has'] {
  return [{ type: 'host', value: TAROTACLE_HOST }];
}

/**
 * More specific /tarot-ai rules come first so a path that already has the
 * prefix is not prefixed again.
 */
export function legacyHostRedirects(): HostRedirect[] {
  return [
    {
      source: '/tarot-ai',
      has: hostHas(),
      destination: `${CANONICAL_ORIGIN}/tarot-ai`,
      permanent: true,
    },
    {
      source: '/tarot-ai/:path*',
      has: hostHas(),
      destination: `${CANONICAL_ORIGIN}/tarot-ai/:path*`,
      permanent: true,
    },
    {
      source: '/',
      has: hostHas(),
      destination: `${CANONICAL_ORIGIN}/tarot-ai`,
      permanent: true,
    },
    {
      source: '/:path*',
      has: hostHas(),
      destination: `${CANONICAL_ORIGIN}/tarot-ai/:path*`,
      permanent: true,
    },
  ];
}

function matchSource(source: string, pathname: string): Record<string, string> | null {
  if (source === '/') return pathname === '/' ? {} : null;
  if (source === '/tarot-ai') return pathname === '/tarot-ai' ? {} : null;
  if (source === '/tarot-ai/:path*') {
    if (!pathname.startsWith('/tarot-ai/')) return null;
    return { path: pathname.slice('/tarot-ai/'.length) };
  }
  if (source === '/:path*') {
    if (pathname === '/') return { path: '' };
    if (pathname.startsWith('/')) return { path: pathname.slice(1) };
  }
  return null;
}

function fill(destination: string, params: Record<string, string>): string {
  return destination.replace(':path*', params.path ?? '');
}

/** Apply the redirect list the same way Next matches it: first hit wins. */
export function resolveLegacyHostRedirect(hostHeader: string, pathname: string): string | null {
  const hostname = hostHeader.toLowerCase().split(':')[0];
  for (const rule of legacyHostRedirects()) {
    const required = rule.has.find((item) => item.type === 'host')?.value;
    if (required !== hostname) continue;
    const params = matchSource(rule.source, pathname);
    if (!params) continue;
    return fill(rule.destination, params);
  }
  return null;
}
