import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma on disk — Turbopack must not bundle a stale generated client.
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "@prisma/adapter-pg",
    "@prisma/client-runtime-utils",
    "prisma",
    "pg",
  ],
  async redirects() {
    return [
      { source: "/customers", destination: "/farmer", permanent: false },
      { source: "/customers/:path*", destination: "/farmer/:path*", permanent: false },
      { source: "/invoice/na-charges", destination: "/invoice/na", permanent: false },
      { source: "/invoice/atl", destination: "/invoice/service", permanent: false },
      { source: "/invoice/gpa", destination: "/invoice/service", permanent: false },
    ];
  },
  turbopack: {
    // Use this package as the workspace root (avoids picking a parent lockfile).
    root: path.join(__dirname),
  },
};

export default nextConfig;
