import { getPrisma } from "@/lib/prisma";

/** Sum of all farmer debit note amounts (for dashboard summary). */
export async function sumAllFarmerDebitNoteAmounts(): Promise<number> {
  const client = getPrisma();
  const delegate = client.farmerDebitNote;

  if (delegate && typeof delegate.aggregate === "function") {
    const result = await delegate.aggregate({ _sum: { amount: true } });
    return result._sum.amount ?? 0;
  }

  const rows = await client.$queryRaw<[{ sum: number | null }]>`
    SELECT COALESCE(SUM(amount), 0)::double precision AS sum
    FROM farmer_debit_notes
  `;
  return Number(rows[0]?.sum ?? 0);
}
