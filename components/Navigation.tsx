'use client';

import { usePathname } from 'next/navigation';
import { AppLink } from './BasePath';
import { Sigil } from './Sigil';
import { stripBasePath } from '../lib/base-path';

const links = [
  { href: '/reading', label: 'Oracle' },
  { href: '/history', label: 'History' },
  { href: '/about', label: 'About' },
];

export function Navigation() {
  const path = stripBasePath(usePathname() || '/');

  return (
    <header className="mast">
      <AppLink href="/" className="wordmark" aria-current={path === '/' ? 'page' : undefined}>
        <Sigil />
        <span>tarotai</span>
      </AppLink>
      <p className="mast-kicker">A Pocket-Sized Oracle</p>
      <nav className="mast-nav" aria-label="Primary">
        {links.map((link) => (
          <AppLink key={link.href} href={link.href} aria-current={path === link.href ? 'page' : undefined}>
            {link.label}
          </AppLink>
        ))}
      </nav>
      <nav className="tabbar" aria-label="Primary">
        {links.map((link) => (
          <AppLink key={link.href} href={link.href} aria-current={path === link.href ? 'page' : undefined}>
            {link.label}
          </AppLink>
        ))}
      </nav>
    </header>
  );
}
