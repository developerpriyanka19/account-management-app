import { FARMER_DEBIT_NOTE_CATEGORIES } from "@/lib/farmer-debit-note-categories";

export type FarmerDebitNoteRecord = {
  id: number;
  category: string;
  dbNo: string | null;
  amount: number | null;
  remark: string | null;
};

export type FarmerDebitNoteInput = {
  id?: number;
  category: string;
  dbNo: string;
  amount: number | null;
  remark: string;
};

export function parseFarmerDebitNotesJson(
  raw: string | null | undefined,
): FarmerDebitNoteInput[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: FarmerDebitNoteInput[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const category = String(o.category ?? "").trim();
      if (!category) continue;
      const amountRaw = o.amount;
      let amount: number | null = null;
      if (amountRaw !== "" && amountRaw != null) {
        const n = Number(amountRaw);
        amount = Number.isFinite(n) ? n : null;
      }
      const row: FarmerDebitNoteInput = {
        category,
        dbNo: String(o.dbNo ?? "").trim(),
        amount,
        remark: String(o.remark ?? "").trim(),
      };
      if (typeof o.id === "number") row.id = o.id;
      out.push(row);
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeFarmerDebitNotesForForm(notes: FarmerDebitNoteRecord[]): string {
  return JSON.stringify(
    notes.map((n) => ({
      id: n.id,
      category: n.category,
      dbNo: n.dbNo ?? "",
      amount: n.amount ?? "",
      remark: n.remark ?? "",
    })),
  );
}

export function getFarmerDebitNoteByCategory(
  notes: FarmerDebitNoteRecord[] | undefined,
  category: string,
): FarmerDebitNoteRecord | undefined {
  return notes?.find((n) => n.category === category);
}

/** First matching row when multiple exist per category. */
export function farmerDebitNoteField(
  notes: FarmerDebitNoteRecord[] | undefined,
  category: string,
  field: "dbNo" | "amount" | "remark",
): string | number | null {
  const row = getFarmerDebitNoteByCategory(notes, category);
  if (!row) return field === "amount" ? null : "";
  if (field === "amount") return row.amount;
  if (field === "dbNo") return row.dbNo;
  return row.remark;
}

export function totalFarmerDebitNoteAmount(notes: FarmerDebitNoteRecord[] | undefined): number {
  if (!notes?.length) return 0;
  return notes.reduce((sum, n) => sum + (n.amount ?? 0), 0);
}

export function buildDebitNoteExportColumnIds(): string[] {
  const ids: string[] = [];
  for (const cat of FARMER_DEBIT_NOTE_CATEGORIES) {
    ids.push(`dn_${cat.id}_dbNo`, `dn_${cat.id}_amount`, `dn_${cat.id}_remark`);
  }
  return ids;
}

export function debitNoteExportLabel(columnId: string): string {
  for (const cat of FARMER_DEBIT_NOTE_CATEGORIES) {
    const prefix = `dn_${cat.id}_`;
    if (!columnId.startsWith(prefix)) continue;
    const field = columnId.slice(prefix.length);
    if (field === "dbNo") return `${cat.label} DB No`;
    if (field === "amount") return `${cat.label} Amount`;
    if (field === "remark") return `${cat.label} Remark`;
  }
  return columnId;
}

export function debitNoteCategoryFromColumnId(columnId: string): {
  category: string;
  field: "dbNo" | "amount" | "remark";
} | null {
  for (const cat of FARMER_DEBIT_NOTE_CATEGORIES) {
    const prefix = `dn_${cat.id}_`;
    if (!columnId.startsWith(prefix)) continue;
    const field = columnId.slice(prefix.length);
    if (field === "dbNo" || field === "amount" || field === "remark") {
      return { category: cat.id, field };
    }
  }
  return null;
}
