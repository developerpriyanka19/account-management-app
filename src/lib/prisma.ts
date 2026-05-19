import { createRequire } from "node:module";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import type { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Load PrismaClient from disk at runtime (Turbopack must not bundle a stale client). */
function loadPrismaClientConstructor(): typeof PrismaClient {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const loaded = require("@prisma/client") as { PrismaClient: typeof PrismaClient };
  return loaded.PrismaClient;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const PrismaClientConstructor = loadPrismaClientConstructor();
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClientConstructor({ adapter });
}

/**
 * Singleton Prisma client for the server.
 * Recreates when the cached instance is missing newer model delegates.
 */
export function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && cached.invoice && cached.gstCustomer) {
    return cached;
  }

  const client = createPrismaClient();
  if (!client.invoice || !client.gstCustomer) {
    throw new Error(
      "Prisma client is out of date. Run: npx prisma generate && rm -rf .next && npm run dev",
    );
  }

  globalForPrisma.prisma = client;
  return client;
}

/** Lazy proxy so existing `prisma.customer` imports keep working. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client) as unknown;
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
