import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "@/lib/database-url";

/** Bump when Prisma schema changes so dev HMR does not keep a stale client. */
const PRISMA_CLIENT_GENERATION = "20260601160000_farmer_debit_notes_v2";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaGeneration?: string;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  return new PrismaClient({ adapter });
}

/** True when generated client includes FarmerDebitNote (avoids stale dev singleton). */
function clientSupportsFarmerDebitNotes(client: PrismaClient): boolean {
  const delegate = Reflect.get(client, "farmerDebitNote", client) as
    | { aggregate?: unknown }
    | undefined;
  return delegate != null && typeof delegate.aggregate === "function";
}

/** Singleton Prisma client (serverless-safe on Vercel). */
export function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (
    cached &&
    globalForPrisma.prismaGeneration === PRISMA_CLIENT_GENERATION &&
    clientSupportsFarmerDebitNotes(cached)
  ) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect();
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaGeneration = PRISMA_CLIENT_GENERATION;
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
