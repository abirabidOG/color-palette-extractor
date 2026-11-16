import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/palette-extractor",
        destination: "/",
        permanent: true,
      },
      {
        source: "/color-palette-extractor",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
