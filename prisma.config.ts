import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI datasource URL.
 * `prisma generate` does not connect to the DB — a placeholder is fine on Vercel install.
 * `prisma migrate` uses DIRECT_URL or DATABASE_URL from your shell / Vercel env.
 */
function datasourceUrl(): string {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) return direct;
  const database = process.env.DATABASE_URL?.trim();
  if (database) return database;
  return "postgresql://build:build@127.0.0.1:5432/build?schema=public";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl(),
  },
});
