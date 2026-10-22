'use client';

import Link from 'next/link';
import { ComponentProps, createContext, useContext, useEffect, useState } from 'react';
import { BASE_PATH, basePathFromPathname, withBasePath } from '../lib/base-path';

const BasePathContext = createContext('');

export function BasePathProvider({
  base,
  children,
}: {
  base: string;
  children: React.ReactNode;
}) {
  const [value, setValue] = useState(base);

  useEffect(() => {
    const fromUrl = basePathFromPathname(window.location.pathname);
    if (fromUrl === BASE_PATH) setValue(BASE_PATH);
  }, []);

  return <BasePathContext.Provider value={value}>{children}</BasePathContext.Provider>;
}

export function useBasePath(): string {
  return useContext(BasePathContext);
}

export function AppLink({ href, ...props }: ComponentProps<typeof Link>) {
  const base = useBasePath();
  const prefixed = typeof href === 'string' ? withBasePath(href, base) : href;
  return <Link href={prefixed} {...props} />;
}
