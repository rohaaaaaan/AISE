import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: 'Next.js',
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
