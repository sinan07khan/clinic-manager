import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production asset compression (Gzip / Brotli)
  compress: true,
  // Strip X-Powered-By header to reduce response overhead and enhance security
  poweredByHeader: false,
  // Compiler-level package import optimization & aggressive tree-shaking
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@tanstack/react-query",
      "sonner",
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
