import type { Metadata } from 'next';
import { Spectral, Cinzel, Playfair_Display, Pinyon_Script } from 'next/font/google';
import { Navigation } from '../components/Navigation';
import './globals.css';

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const pinyon = Pinyon_Script({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pinyon',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'tarot-ai — Your Personal Oracle',
  description: 'Personalized tarot readings with AI-generated card art. Powered by Together AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spectral.variable} ${cinzel.variable} ${playfair.variable} ${pinyon.variable}`}>
      <body>
        <Navigation />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
