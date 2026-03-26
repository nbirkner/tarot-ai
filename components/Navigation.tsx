'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function Navigation() {
  const path = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isDarkPage = false; // reading page is now always light

  const links = [
    { href: '/reading', label: 'Oracle' },
    { href: '/history', label: 'History' },
    { href: '/about', label: 'Built with' },
  ];

  const navBg = isDarkPage
    ? 'rgba(6, 12, 34, 0.82)'
    : 'rgba(248, 244, 239, 0.88)';
  const navBorder = isDarkPage
    ? 'rgba(196, 146, 42, 0.12)'
    : 'rgba(196, 146, 42, 0.14)';
  const logoColor = isDarkPage ? 'rgba(248,244,239,0.75)' : 'var(--brown-dark)';
  const linkColor = isDarkPage ? 'rgba(248,244,239,0.5)' : 'var(--brown-mid)';
  const linkActive = 'var(--gold)';

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: navBg,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${navBorder}`,
          transition: 'background 0.6s ease, border-color 0.6s ease',
        }}
      >
        <div className="w-full px-6 sm:px-10 flex items-center justify-between h-14">

          {/* Wordmark */}
          <Link href="/" onClick={() => setIsOpen(false)}>
            <span
              style={{
                fontFamily: 'var(--font-cinzel), serif',
                fontSize: 12,
                letterSpacing: '0.26em',
                color: logoColor,
                transition: 'color 0.4s ease',
                textTransform: 'uppercase',
              }}
            >
              ✦ TAROT · AI
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-8">
            {links.map((l) => {
              const isActive = path === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    fontFamily: 'var(--font-spectral), serif',
                    fontSize: 15,
                    letterSpacing: '0.06em',
                    color: isActive ? linkActive : linkColor,
                    borderBottom: isActive ? '1px solid var(--gold)' : '1px solid transparent',
                    paddingBottom: 2,
                    transition: 'color 0.2s ease, border-color 0.2s ease',
                    fontStyle: isActive ? 'italic' : 'normal',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = isDarkPage ? 'rgba(248,244,239,0.85)' : 'var(--brown-dark)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = linkColor;
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex sm:hidden items-center justify-center"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isDarkPage ? 'rgba(248,244,239,0.65)' : 'var(--brown-dark)',
              fontSize: 18,
              lineHeight: 1,
              padding: '8px',
              minHeight: 44,
              minWidth: 44,
              transition: 'color 0.4s ease',
            }}
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {isOpen && (
        <div
          className="sm:hidden fixed left-0 right-0"
          style={{
            top: 56,
            zIndex: 49,
            background: isDarkPage ? 'rgba(6,12,34,0.96)' : 'rgba(248,244,239,0.97)',
            backdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${navBorder}`,
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
                fontFamily: 'var(--font-spectral), serif',
                fontSize: 18,
                letterSpacing: '0.05em',
                color: path === l.href ? 'var(--gold)' : (isDarkPage ? 'rgba(248,244,239,0.65)' : 'var(--brown-mid)'),
                fontStyle: path === l.href ? 'italic' : 'normal',
                borderBottom: `1px solid ${isDarkPage ? 'rgba(196,146,42,0.1)' : 'var(--border-gold)'}`,
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
