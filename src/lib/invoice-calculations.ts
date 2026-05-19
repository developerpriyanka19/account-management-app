import type { InvoiceLineInput } from "@/lib/invoice-types";

const SGST_RATE = 0.09;
const CGST_RATE = 0.09;

export type InvoiceTotals = {
  subtotal: number;
  sgst: number;
  cgst: number;
  grandTotal: number;
};

export function lineAmountFromAcreage(acres: number | null | undefined, ratePerAcre: number): number {
  const a = acres ?? 0;
  if (!Number.isFinite(a) || !Number.isFinite(ratePerAcre)) return 0;
  return Math.round(a * ratePerAcre * 100) / 100;
}

export function computeLineAmounts(
  lines: InvoiceLineInput[],
  ratePerAcre: number,
  category: "na" | "service",
): InvoiceLineInput[] {
  return lines.map((line) => {
    if (line.amount != null && line.amount > 0 && category === "service") {
      return line;
    }
    const computed = lineAmountFromAcreage(line.acres, ratePerAcre);
    return { ...line, amount: line.amount && line.amount > 0 ? line.amount : computed };
  });
}

export function computeInvoiceTotals(lines: InvoiceLineInput[]): InvoiceTotals {
  const subtotal = lines.reduce((sum, l) => sum + (l.amount ?? 0), 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const sgst = Math.round(roundedSubtotal * SGST_RATE * 100) / 100;
  const cgst = Math.round(roundedSubtotal * CGST_RATE * 100) / 100;
  const grandTotal = Math.round((roundedSubtotal + sgst + cgst) * 100) / 100;
  return { subtotal: roundedSubtotal, sgst, cgst, grandTotal };
}

export function formatInvoiceMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Integer / quantity display (e.g. cents) with Indian grouping — no overlap in cells. */
export function formatInvoiceInteger(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatInvoiceNumber(category: "na" | "service", seq: number): string {
  const prefix = category === "na" ? "NA" : "SRV";
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `INV-${prefix}-${ymd}-${String(seq).padStart(4, "0")}`;
}
