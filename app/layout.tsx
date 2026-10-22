import type { Metadata } from 'next';
import Script from 'next/script';
import { headers } from 'next/headers';
import { Fragment_Mono, Schibsted_Grotesk } from 'next/font/google';
import { Navigation } from '../components/Navigation';
import { BasePathProvider } from '../components/BasePath';
import { BASE_PATH } from '../lib/base-path';
import './globals.css';

const sans = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-schibsted',
  display: 'swap',
});

const mono = Fragment_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-fragment',
  display: 'swap',
});

const themeBoot = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export const metadata: Metadata = {
  title: 'tarot-ai — Your Personal Oracle',
  description: 'Personalized tarot readings with AI-generated card art. Powered by Together AI.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const base = headerStore.get('x-tarot-base') === BASE_PATH ? BASE_PATH : '';

  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} data-base-path={base || undefined} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        <BasePathProvider base={base}>
          <div className="app-shell">
            <Navigation />
            <div className="app-main">{children}</div>
          </div>
        </BasePathProvider>
      </body>
    </html>
  );
}
