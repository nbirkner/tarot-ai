import type { Metadata } from 'next';
import { pageMetadata } from '../../lib/page-meta';

export const metadata: Metadata = pageMetadata({
  title: 'Draw a Reading',
  description: 'Pick a spread and a deck, ask a question, and get cards illustrated for your reading.',
  path: '/reading',
});

export default function ReadingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
