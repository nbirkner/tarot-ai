'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppLink } from './BasePath';
import { stripBasePath } from '../lib/base-path';

const links = [
  { href: '/reading', label: 'Oracle' },
  { href: '/history', label: 'History' },
  { href: '/about', label: 'About' },
];

function themeIsDark() {
  const root = document.documentElement;
  if (root.dataset.theme) return root.dataset.theme === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function Navigation() {
  const path = stripBasePath(usePathname() || '/');
  const [label, setLabel] = useState('Toggle color theme');

  useEffect(() => {
    const sync = () => {
      setLabel(themeIsDark() ? 'Switch to light theme' : 'Switch to dark theme');
    };
    sync();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  function toggleTheme() {
    const next = themeIsDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode */
    }
    setLabel(next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  return (
    <header className="site-header">
      <div className="site-mark-wrap">
        <span className="where-clip">
          <span className="where" aria-hidden="true">on /tarot-ai</span>
        </span>
        <div className="site-mark">
          <a className="mark-home" href="https://www.nikibirkner.com">
            <svg
              className="arrow"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5" />
              <path d="M11 6l-6 6 6 6" />
            </svg>
            <span>Niki Birkner</span>
          </a>
          <span className="mark-sep" aria-hidden="true">/</span>
          <AppLink href="/" className="mark-app" aria-current={path === '/' ? 'page' : undefined}>
            tarot-ai
          </AppLink>
        </div>
      </div>
      <div className="tools">
        <button
          type="button"
          className="icon-btn"
          data-theme-toggle
          onClick={toggleTheme}
          aria-label={label}
          title={label}
        >
          <svg className="icon-moon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <svg className="icon-sun" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M12 2.5v2.2M12 19.3v2.2M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.8 19.2l1.6-1.6M17.6 6.4l1.6-1.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <nav className="top-nav" aria-label="Primary">
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
