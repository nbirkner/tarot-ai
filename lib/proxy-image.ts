/**
 * Allowlist for the PDF image proxy.
 * Matches the Together image hosts in next.config.ts `images.remotePatterns`
 * (`**.together.ai`, `api.together.xyz`, `**.togetherai.com`). Anything else
 * is rejected so this route cannot be used as an open proxy.
 */
const TOGETHER_IMAGE_APEX = ['together.ai', 'togetherai.com'] as const;

export const MAX_PROXY_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const MAX_URL_LENGTH = 8192;

const PROXY_HEADERS = {
  Accept: 'image/jpeg,image/png,image/webp,image/*',
  'User-Agent': 'tarot-ai-image-proxy',
};

export type ProxyImageFailure = 'missing' | 'rejected' | 'redirect' | 'upstream' | 'type' | 'size' | 'fetch';

export type ProxyImageResult =
  | { ok: true; bytes: Uint8Array; contentType: string }
  | { ok: false; error: ProxyImageFailure };

export function allowedTogetherImageUrl(raw: string): URL | null {
  if (raw.length > MAX_URL_LENGTH) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== '443') return null;

  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!isTogetherImageHost(host)) return null;
  if (url.hostname !== host) url.hostname = host;
  return url;
}

function isTogetherImageHost(host: string): boolean {
  if (host === 'api.together.xyz') return true;
  return TOGETHER_IMAGE_APEX.some((apex) => host === apex || host.endsWith(`.${apex}`));
}

/** Media type only. Parameters and non-image types are refused. */
export function imageMediaType(header: string | null): string | null {
  if (!header) return null;
  const media = header.split(',')[0]?.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!/^image\/[a-z0-9.+-]+$/.test(media)) return null;
  return media;
}

async function readLimited(res: Response, max: number): Promise<Uint8Array | null> {
  const declared = res.headers.get('content-length');
  if (declared !== null) {
    if (!/^\d+$/.test(declared)) {
      await res.body?.cancel().catch(() => undefined);
      return null;
    }
    const n = Number(declared);
    if (n <= 0 || n > max) {
      await res.body?.cancel().catch(() => undefined);
      return null;
    }
  }

  if (!res.body) return null;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => undefined);
    return null;
  }

  if (total === 0) return null;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/**
 * Fetch one https Together image. Redirects are followed only while every hop
 * stays on the allowlist. Non-image and oversized bodies are refused.
 */
export async function fetchProxiedImage(
  raw: string | null | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<ProxyImageResult> {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) return { ok: false, error: 'missing' };

  let current = allowedTogetherImageUrl(trimmed);
  if (!current) return { ok: false, error: 'rejected' };

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res: Response;
    try {
      res = await fetchImpl(current, {
        redirect: 'manual',
        headers: PROXY_HEADERS,
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      return { ok: false, error: 'fetch' };
    }

    if (res.status >= 300 && res.status < 400) {
      await res.body?.cancel().catch(() => undefined);
      if (hop === MAX_REDIRECTS) return { ok: false, error: 'redirect' };
      const location = res.headers.get('location');
      if (!location) return { ok: false, error: 'redirect' };
      let next: URL;
      try {
        next = new URL(location, current);
      } catch {
        return { ok: false, error: 'redirect' };
      }
      const allowed = allowedTogetherImageUrl(next.toString());
      if (!allowed) return { ok: false, error: 'redirect' };
      current = allowed;
      continue;
    }

    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      return { ok: false, error: 'upstream' };
    }

    const contentType = imageMediaType(res.headers.get('content-type'));
    if (!contentType) {
      await res.body?.cancel().catch(() => undefined);
      return { ok: false, error: 'type' };
    }

    const bytes = await readLimited(res, MAX_PROXY_IMAGE_BYTES);
    if (!bytes) return { ok: false, error: 'size' };
    return { ok: true, bytes, contentType };
  }

  return { ok: false, error: 'redirect' };
}
