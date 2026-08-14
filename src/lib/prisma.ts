import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "@/lib/database-url";

/** Bump when Prisma schema changes so dev HMR does not keep a stale client. */
const PRISMA_CLIENT_GENERATION = "20260711180000_debit_note_state";

/** Customer columns that must exist in the generated client. */
const REQUIRED_CUSTOMER_FIELDS = [
  "bankLoanDdDate",
  "bankLoanDdNo",
  "bankLoanBankName",
  "rentalDdDate",
  "rentalDdChequeNo",
  "rentalDdBankName",
  "balanceRentChequeNo",
  "state",
  "district",
  "taluk",
  "hobbli",
  "village",
] as const;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaGeneration?: string;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  return new PrismaClient({ adapter });
}

function customerModelHasField(fieldName: string): boolean {
  const customer = Prisma.dmmf.datamodel.models.find((m) => m.name === "Customer");
  return customer?.fields.some((f) => f.name === fieldName) ?? false;
}

/** True when generated client matches the current schema (avoids stale dev singleton). */
function clientMatchesCurrentSchema(client: PrismaClient): boolean {
  const delegate = Reflect.get(client, "farmerDebitNote", client) as
    | { aggregate?: unknown }
    | undefined;
  const hasDebitNotes =
    delegate != null && typeof delegate.aggregate === "function";
  const hasFarmerDdFields = REQUIRED_CUSTOMER_FIELDS.every(customerModelHasField);
  return hasDebitNotes && hasFarmerDdFields;
}

/** Singleton Prisma client (serverless-safe on Vercel). */
export function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (
    cached &&
    globalForPrisma.prismaGeneration === PRISMA_CLIENT_GENERATION &&
    clientMatchesCurrentSchema(cached)
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
