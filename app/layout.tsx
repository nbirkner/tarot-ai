import type { Metadata } from 'next';
import Script from 'next/script';
import { Fragment_Mono, Schibsted_Grotesk } from 'next/font/google';
import { Navigation } from '../components/Navigation';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        <div className="app-shell">
          <Navigation />
          <div className="app-main">{children}</div>
        </div>
      </body>
    </html>
  );
}
