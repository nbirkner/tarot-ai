import type { Metadata } from 'next';
import { pageMetadata } from '../../lib/page-meta';

// History lives in this browser's storage, so the page is empty for a crawler.
export const metadata: Metadata = pageMetadata({
  title: 'Reading History',
  description: 'Readings you saved on this device.',
  path: '/history',
  index: false,
});

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
