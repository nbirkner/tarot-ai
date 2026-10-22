import type { NextConfig } from 'next';
import { BASE_PATH } from './lib/base-path';

const nextConfig: NextConfig = {
  // Scripts, CSS, and fonts are requested at /tarot-ai/_next even on the root
  // host. The rewrite below serves that prefix from the real /_next files, so
  // nikibirkner.com/tarot-ai and the root deployment both resolve assets.
  assetPrefix: BASE_PATH,
  async rewrites() {
    return {
      beforeFiles: [
        { source: BASE_PATH, destination: '/' },
        { source: `${BASE_PATH}/:path*`, destination: '/:path*' },
      ],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.together.ai',
      },
      {
        protocol: 'https',
        hostname: 'api.together.xyz',
      },
      {
        protocol: 'https',
        hostname: '**.togetherai.com',
      },
    ],
  },
};

export default nextConfig;
