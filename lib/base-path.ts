/** Public mount used by nikibirkner.com/tarot-ai. The app also serves at `/`. */
export const BASE_PATH = '/tarot-ai';

export function basePathFromPathname(pathname: string): '' | typeof BASE_PATH {
  if (pathname === BASE_PATH || pathname.startsWith(`${BASE_PATH}/`)) return BASE_PATH;
  return '';
}

export function stripBasePath(pathname: string): string {
  if (pathname === BASE_PATH) return '/';
  if (pathname.startsWith(`${BASE_PATH}/`)) return pathname.slice(BASE_PATH.length) || '/';
  return pathname || '/';
}

/** Prefix an absolute path when the page is mounted under `/tarot-ai`. */
export function withBasePath(path: string, basePath: string = BASE_PATH): string {
  if (!path.startsWith('/')) return path;
  if (!basePath || basePath === '/') return path;
  const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  if (path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}

/** Browser fetch URL. Root stays `/api/...`; a `/tarot-ai` page uses `/tarot-ai/api/...`. */
export function apiUrl(path: string): string {
  const base = typeof window === 'undefined' ? '' : basePathFromPathname(window.location.pathname);
  return withBasePath(path, base);
}
