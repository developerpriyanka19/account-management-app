import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

/**
 * Resolves the repo root whether this file runs from `src/lib/` (source) or
 * `.next/server/...` (bundled). `../../` from the bundle path would land inside
 * `.next/` and open the wrong SQLite file — that caused “invalid password” with a
 * valid admin user.
 */
function findProjectRoot(): string {
  const starts = [
    path.dirname(fileURLToPath(import.meta.url)),
    process.cwd(),
  ];

  for (const start of starts) {
    let dir = start;
    for (let i = 0; i < 20; i++) {
      const pkg = path.join(dir, "package.json");
      const prismaSchema = path.join(dir, "prisma", "schema.prisma");
      if (fs.existsSync(pkg) && fs.existsSync(prismaSchema)) {
        return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  return process.cwd();
}

const PROJECT_ROOT = findProjectRoot();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function sqliteUrlFromEnv(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith("file:")) return url;
  return undefined;
}

/** Resolve `file:./dev.db` against repo root so Prisma always uses the migrated DB. */
function resolveSqliteFileUrl(url: string): string {
  if (!url.startsWith("file:")) return url;
  const rest = url.slice("file:".length);
  if (path.isAbsolute(rest)) {
    return `file:${rest}`;
  }
  return `file:${path.resolve(PROJECT_ROOT, rest)}`;
}

function createPrismaClient() {
  const rawUrl =
    sqliteUrlFromEnv() ?? `file:${path.join(PROJECT_ROOT, "dev.db")}`;
  const url = resolveSqliteFileUrl(rawUrl);

  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
