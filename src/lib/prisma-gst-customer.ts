import type { PrismaClient } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

type GstCustomerClient = PrismaClient["gstCustomer"];

/** GstCustomer delegate — recreates Prisma client if the dev cache is stale. */
export function gstCustomerDb(): GstCustomerClient {
  const db = getPrisma().gstCustomer;
  if (!db) {
    throw new Error(
      "Database client is missing GstCustomer. Run `npx prisma generate` and restart the dev server.",
    );
  }
  return db;
}
