import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns", "@xyflow/react"],
  },
};

export default nextConfig;
