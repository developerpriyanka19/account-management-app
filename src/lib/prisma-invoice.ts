import type { PrismaClient } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

type InvoiceClient = PrismaClient["invoice"];

export async function countInvoices(): Promise<number> {
  const prisma = getPrisma();
  if (prisma.invoice) {
    return prisma.invoice.count();
  }
  const rows = await prisma.$queryRaw<[{ count: number }]>`SELECT COUNT(*)::int AS count FROM invoices`;
  return rows[0]?.count ?? 0;
}

/** Invoice delegate — uses runtime-loaded Prisma client. */
export function invoiceDb(): InvoiceClient {
  const db = getPrisma().invoice;
  if (!db) {
    throw new Error(
      "Database client is missing Invoice. Run: npx prisma generate && rm -rf .next && npm run dev",
    );
  }
  return db;
}
