import type { Metadata } from 'next';
import { BASE_PATH } from './base-path';

export const SITE_ORIGIN = 'https://www.nikibirkner.com';

export const OG_IMAGE = {
  url: `${BASE_PATH}/og.png`,
  width: 1200,
  height: 630,
  alt: 'tarotai on ember orange. Your future called. It has notes.',
};

/**
 * Every host that serves this app (the nikibirkner.com mount, the root of the
 * Vercel deployment, previews) names www.nikibirkner.com/tarot-ai as canonical.
 */
export function canonicalUrl(path: string): string {
  return `${SITE_ORIGIN}${BASE_PATH}${path === '/' ? '' : path}`;
}

type PageMeta = { title: string; description: string; path: string; index?: boolean };

/**
 * Metadata for one page. A page's openGraph and twitter replace the layout's
 * whole objects, so the share image is repeated here.
 */
export function pageMetadata({ title, description, path, index = true }: PageMeta): Metadata {
  const url = canonicalUrl(path);
  const shareTitle = `${title} · Tarot AI`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: shareTitle, description, url, images: [OG_IMAGE] },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [OG_IMAGE.url] },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}
