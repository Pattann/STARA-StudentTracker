import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@xyflow/react",
      "recharts",
      "date-fns",
    ],
  },
  devIndicators: false,
};

export default nextConfig;
