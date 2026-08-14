import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import type { FarmerDebitNoteRecord } from "@/lib/farmer-debit-notes";

export type { FarmerDebitNoteRecord };

function canUseFarmerDebitNoteDelegate(): boolean {
  const client = getPrisma();
  const delegate = Reflect.get(client, "farmerDebitNote", client) as
    | { findMany?: unknown }
    | undefined;
  return delegate != null && typeof delegate.findMany === "function";
}

type FarmerDebitNoteRow = FarmerDebitNoteRecord & { customerId: number };

async function fetchViaPrisma(customerIds: number[]): Promise<FarmerDebitNoteRow[]> {
  const client = getPrisma();
  if (customerIds.length === 0) return [];
  return client.farmerDebitNote.findMany({
    where: { customerId: { in: customerIds } },
    orderBy: [{ category: "asc" }, { id: "asc" }],
    select: {
      id: true,
      category: true,
      dbNo: true,
      amount: true,
      remark: true,
      customerId: true,
    },
  });
}

async function fetchViaSql(customerIds: number[]): Promise<FarmerDebitNoteRow[]> {
  if (customerIds.length === 0) return [];
  const client = getPrisma();
  return client.$queryRaw<
    {
      id: number;
      customerId: number;
      category: string;
      dbNo: string | null;
      amount: number | null;
      remark: string | null;
    }[]
  >`
    SELECT id, "customerId", category, "dbNo", amount, remark
    FROM farmer_debit_notes
    WHERE "customerId" IN (${Prisma.join(customerIds)})
    ORDER BY category ASC, id ASC
  `;
}

/** Load debit notes for one or more farmers without using Customer include (works with stale clients). */
export async function fetchFarmerDebitNotesByCustomerIds(
  customerIds: number[],
): Promise<Map<number, FarmerDebitNoteRecord[]>> {
  const ids = [...new Set(customerIds.filter((id) => Number.isInteger(id) && id > 0))];
  const map = new Map<number, FarmerDebitNoteRecord[]>();
  for (const id of ids) map.set(id, []);

  if (ids.length === 0) return map;

  const rows = canUseFarmerDebitNoteDelegate()
    ? await fetchViaPrisma(ids)
    : await fetchViaSql(ids);

  for (const row of rows) {
    const customerId = row.customerId;
    const note: FarmerDebitNoteRecord = {
      id: row.id,
      category: row.category,
      dbNo: row.dbNo,
      amount: row.amount,
      remark: row.remark,
    };
    const list = map.get(customerId) ?? [];
    list.push(note);
    map.set(customerId, list);
  }
  return map;
}

export async function fetchFarmerDebitNotesForCustomer(
  customerId: number,
): Promise<FarmerDebitNoteRecord[]> {
  const map = await fetchFarmerDebitNotesByCustomerIds([customerId]);
  return map.get(customerId) ?? [];
}

/** Attach `farmerDebitNotes` to list rows for the farmers table. */
export async function attachFarmerDebitNotes<T extends { id: number }>(
  rows: T[],
): Promise<(T & { farmerDebitNotes: FarmerDebitNoteRecord[] })[]> {
  const map = await fetchFarmerDebitNotesByCustomerIds(rows.map((r) => r.id));
  return rows.map((row) => ({
    ...row,
    farmerDebitNotes: map.get(row.id) ?? [],
  }));
}
