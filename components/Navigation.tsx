'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function Navigation() {
  const path = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: '/reading', label: 'Oracle' },
    { href: '/collection', label: 'Collection' },
    { href: '/history', label: 'History' },
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(248, 244, 239, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(196, 146, 42, 0.15)',
        }}
      >
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" onClick={() => setIsOpen(false)}>
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

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-7">
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

          {/* Mobile hamburger button */}
          <button
            className="flex sm:hidden items-center justify-center"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--brown-dark)',
              fontSize: 20,
              lineHeight: 1,
              padding: '8px',
              minHeight: 44,
              minWidth: 44,
            }}
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div
          className="sm:hidden fixed left-0 right-0 z-49"
          style={{
            top: 56,
            zIndex: 49,
            background: 'rgba(248,244,239,0.97)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-gold)',
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setIsOpen(false)}
              style={{
                display: 'block',
                padding: '16px 24px',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 18,
                letterSpacing: '0.05em',
                color: path === l.href ? 'var(--gold)' : 'var(--brown-mid)',
                fontStyle: path === l.href ? 'italic' : 'normal',
                borderBottom: '1px solid var(--border-gold)',
                textDecoration: 'none',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
