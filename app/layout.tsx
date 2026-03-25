import type { Metadata } from 'next';
import { Navigation } from '../components/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'tarot-ai — AI-Generated Tarot Readings',
  description: 'Personalized tarot readings with AI-generated card art, powered by Together AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-purple-100 antialiased">
        <Navigation />
        {children}
      </body>
    </html>
  );
}
