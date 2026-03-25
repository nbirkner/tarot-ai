'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const path = usePathname();

  const links = [
    { href: '/', label: 'Read' },
    { href: '/collection', label: 'Collection' },
    { href: '/history', label: 'History' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-purple-900/40 bg-slate-950/80 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="text-purple-300 font-semibold tracking-wide text-sm">✦ tarot-ai</span>
        <div className="flex gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                path === l.href ? 'text-purple-200' : 'text-purple-600 hover:text-purple-400'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
