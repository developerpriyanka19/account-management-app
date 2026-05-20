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
  const subtotal = lines.reduce(
    (sum, l) => sum + (l.debitNote > 0 ? l.debitNote : (l.amount ?? 0)),
    0,
  );
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

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitsToWords(n: number): string {
  if (n < 20) return ONES[n]!;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${TENS[tens]}${ones ? ` ${ONES[ones]}` : ""}`.trim();
}

function threeDigitsToWords(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const hundredPart = hundred ? `${ONES[hundred]} Hundred` : "";
  const restPart = rest ? twoDigitsToWords(rest) : "";
  return [hundredPart, restPart].filter(Boolean).join(" ").trim();
}

export function amountToIndianWords(amount: number): string {
  const rounded = Math.floor(amount);
  if (rounded <= 0) return "Rupees Zero Only";
  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const rest = rounded % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (rest) parts.push(threeDigitsToWords(rest));
  return `Rupees ${parts.join(" ").replace(/\s+/g, " ").trim()} Only`;
}
