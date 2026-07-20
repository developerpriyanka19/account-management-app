import { formatDateOrDash } from "@/lib/date-format";

export function formatAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Whole numbers only (e.g. crop compensation). */
export function formatIntegerAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function cellText(value: string | number | null | undefined): string {
  if (value == null) return "—";
  if (typeof value === "number") {
    return Number.isNaN(value) ? "—" : String(value);
  }
  const t = String(value).trim();
  return t.length > 0 ? t : "—";
}

export function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

/** Display stored date strings as DD/MM/YYYY (or dash). */
export function formatOptionalDate(value: string | null | undefined): string {
  return formatDateOrDash(value);
}
