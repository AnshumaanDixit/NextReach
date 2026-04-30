import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  /* config options here */
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
