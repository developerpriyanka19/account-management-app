import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  turbopack: {
    // Use this package as the workspace root (avoids picking a parent lockfile).
    root: path.join(__dirname),
  },
};

export default nextConfig;
