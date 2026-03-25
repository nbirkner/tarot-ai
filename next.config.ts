import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.together.ai",
      },
      {
        protocol: "https",
        hostname: "api.together.xyz",
      },
      {
        protocol: "https",
        hostname: "**.togetherai.com",
      },
    ],
  },
};

export default nextConfig;
