import { getPrisma } from "@/lib/prisma";
import type { FarmerDebitNoteInput } from "@/lib/farmer-debit-notes";

export async function replaceFarmerDebitNotes(
  customerId: number,
  notes: FarmerDebitNoteInput[],
) {
  const rows = notes.filter(
    (n) =>
      n.category.trim() &&
      (n.dbNo.trim() || n.amount != null || n.remark.trim()),
  );

  const client = getPrisma();
  const delegate = Reflect.get(client, "farmerDebitNote", client) as
    | {
        deleteMany: (args: unknown) => Promise<unknown>;
        createMany: (args: unknown) => Promise<unknown>;
      }
    | undefined;

  if (!delegate?.deleteMany) {
    await client.$executeRaw`
      DELETE FROM farmer_debit_notes WHERE "customerId" = ${customerId}
    `;
    for (const n of rows) {
      await client.$executeRaw`
        INSERT INTO farmer_debit_notes ("customerId", category, "dbNo", amount, remark)
        VALUES (
          ${customerId},
          ${n.category.trim()},
          ${n.dbNo.trim() || null},
          ${n.amount},
          ${n.remark.trim() || null}
        )
      `;
    }
    return;
  }

  await delegate.deleteMany({ where: { customerId } });
  if (rows.length > 0) {
    await delegate.createMany({
      data: rows.map((n) => ({
        customerId,
        category: n.category.trim(),
        dbNo: n.dbNo.trim() || null,
        amount: n.amount,
        remark: n.remark.trim() || null,
      })),
    });
  }
}
