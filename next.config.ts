import type { NextConfig } from "next";

const staticCdn = process.env.STATIC_CDN;

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  ...(staticCdn
    ? {
        output: "export" as const,
        trailingSlash: true,
        assetPrefix: staticCdn,
      }
    : {}),
};

export default nextConfig;
