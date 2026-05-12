import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native module: do not bundle into RSC / server chunks (avoids Turbopack oddities).
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
  ],
  turbopack: {
    // Use this package as the workspace root (avoids picking a parent lockfile).
    root: path.join(__dirname),
  },
};

export default nextConfig;
