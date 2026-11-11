import type { Metadata } from 'next';
import { Azeret_Mono, Host_Grotesk } from 'next/font/google';
import { Navigation } from '../components/Navigation';
import { SiteFooter } from '../components/SiteFooter';
import { BasePathProvider } from '../components/BasePath';
import { BASE_PATH } from '../lib/base-path';
import { headers } from 'next/headers';
import './globals.css';

const display = Host_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const mono = Azeret_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-face',
  display: 'swap',
});

const description =
  'Ancient practice. Freshly hallucinated. A pocket-sized tarot oracle with cards drawn and illustrated for you.';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nikibirkner.com'),
  title: 'tarotai. Your Future Called.',
  description,
  openGraph: {
    title: 'tarotai. Your Future Called.',
    description: 'Your future called. It has notes. Not a prediction. A prompt.',
    images: [
      {
        url: `${BASE_PATH}/og.png`,
        width: 1200,
        height: 630,
        alt: 'tarotai on ember orange. Your future called. It has notes.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'tarotai. Your Future Called.',
    description,
    images: [`${BASE_PATH}/og.png`],
  },
  icons: {
    icon: [
      { url: `${BASE_PATH}/icon.svg`, type: 'image/svg+xml' },
      { url: `${BASE_PATH}/favicon-32.png`, sizes: '32x32', type: 'image/png' },
    ],
    apple: `${BASE_PATH}/apple-icon.png`,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const base = headerStore.get('x-tarot-base') === BASE_PATH ? BASE_PATH : '';

  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`} data-base-path={base || undefined}>
      <body>
        <BasePathProvider base={base}>
          <div className="app-shell">
            <a className="skip" href="#content">
              Skip to Content
            </a>
            <div className="wrap">
              <Navigation />
              <div className="wrap-inner" id="content">
                {children}
              </div>
              <SiteFooter />
            </div>
          </div>
        </BasePathProvider>
      </body>
    </html>
  );
}
