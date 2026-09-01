import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Vercel Services does not expose the /_next/image optimizer, so every
  // next/image request 404s. Serve public assets as-is instead.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
