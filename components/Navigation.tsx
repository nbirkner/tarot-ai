'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const path = usePathname();

  const links = [
    { href: '/reading', label: 'Oracle' },
    { href: '/collection', label: 'Collection' },
    { href: '/history', label: 'History' },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(248, 244, 239, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(196, 146, 42, 0.15)',
      }}
    >
      <div className="max-w-3xl mx-auto px-6 flex items-center justify-between h-14">
        <Link href="/">
          <span
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 13,
              letterSpacing: '0.2em',
              color: 'var(--brown-dark)',
            }}
          >
            ✦ TAROT · AI
          </span>
        </Link>

        <div className="flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 16,
                letterSpacing: '0.05em',
                color: path === l.href ? 'var(--gold)' : 'var(--brown-mid)',
                borderBottom: path === l.href ? '1px solid var(--gold)' : '1px solid transparent',
                paddingBottom: 2,
                transition: 'all 0.2s ease',
                fontStyle: path === l.href ? 'italic' : 'normal',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
