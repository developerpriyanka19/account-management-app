import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Neon: use DIRECT_URL (non-pooler host) for migrate — pooled URLs cause P1002 advisory lock timeouts.
    url: process.env.DIRECT_URL?.trim() || env("DATABASE_URL"),
  },
});
