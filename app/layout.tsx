import type { Metadata } from 'next';
import { Navigation } from '../components/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'tarot-ai — Your Personal Oracle',
  description: 'Personalized tarot readings with AI-generated card art. Powered by Together AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
