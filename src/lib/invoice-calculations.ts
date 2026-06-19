import { extentToAcres } from "@/lib/customer-computed-totals";
import type { InvoiceLineInput } from "@/lib/invoice-types";

const SGST_RATE = 0.09;
const CGST_RATE = 0.09;

export type InvoiceTotals = {
  subtotal: number;
  sgst: number;
  cgst: number;
  grandTotal: number;
};

/** Coerce form/DB values to a finite number (avoids string concatenation in totals). */
export function toFiniteNumber(value: unknown): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Parse optional numeric input; null when empty or invalid. */
export function toOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Line extent in decimal acres from acres + guntas (40 guntas = 1 acre). */
export function lineExtentAcres(
  acres: number | null | undefined,
  gunta: number | null | undefined,
): number | null {
  const a = toOptionalNumber(acres);
  const g = toOptionalNumber(gunta);
  return extentToAcres(a, g);
}

/** Full-precision line amount from extent × rate; no rounding. */
export function lineAmountFromExtent(
  acres: number | null | undefined,
  gunta: number | null | undefined,
  ratePerAcre: number,
): number {
  const extent = lineExtentAcres(acres, gunta);
  const rate = toFiniteNumber(ratePerAcre);
  if (extent == null || extent <= 0 || rate <= 0) return 0;
  return extent * rate;
}

/** @deprecated Use lineAmountFromExtent — kept for callers passing acres only. */
export function lineAmountFromAcreage(acres: number | null | undefined, ratePerAcre: number): number {
  return lineAmountFromExtent(acres, null, ratePerAcre);
}

/** Line taxable amount: debit note override, else line amount when set. */
export function invoiceLineTaxableAmount(line: InvoiceLineInput): number {
  const debitNote = toFiniteNumber(line.debitNote);
  if (debitNote > 0) return debitNote;
  const amount = toOptionalNumber(line.amount);
  return amount ?? 0;
}

/** Whether a service line has a user-entered amount. */
export function serviceLineHasAmount(line: InvoiceLineInput): boolean {
  return toOptionalNumber(line.amount) != null;
}

export function computeLineAmounts(
  lines: InvoiceLineInput[],
  ratePerAcre: number,
  category: "na" | "service",
): InvoiceLineInput[] {
  const rate = toFiniteNumber(ratePerAcre);
  return lines.map((line) => {
    if (category === "service") {
      const manual = toOptionalNumber(line.amount);
      return { ...line, amount: manual };
    }
    const debitNote = toFiniteNumber(line.debitNote);
    const computed = lineAmountFromExtent(line.acres, line.gunta, rate);
    const manual = toOptionalNumber(line.amount);
    const amount =
      debitNote > 0 ? debitNote : computed > 0 ? computed : manual ?? 0;
    return { ...line, amount };
  });
}

export function computeInvoiceTotals(lines: InvoiceLineInput[]): InvoiceTotals {
  const subtotal = lines.reduce((sum, l) => {
    const taxable = invoiceLineTaxableAmount(l);
    if (taxable === 0 && toOptionalNumber(l.amount) == null && toFiniteNumber(l.debitNote) <= 0) {
      return sum;
    }
    return sum + taxable;
  }, 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const sgst = Math.round(roundedSubtotal * SGST_RATE * 100) / 100;
  const cgst = Math.round(roundedSubtotal * CGST_RATE * 100) / 100;
  const grandTotal = Math.round((roundedSubtotal + sgst + cgst) * 100) / 100;
  return { subtotal: roundedSubtotal, sgst, cgst, grandTotal };
}

export function formatInvoiceMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Decimal quantity display — 2 decimal places; blank when null. */
export function formatInvoiceDecimal(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** @deprecated Use formatInvoiceDecimal */
export function formatInvoiceInteger(value: number | null | undefined): string {
  return formatInvoiceDecimal(value);
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
