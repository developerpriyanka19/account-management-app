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

export function cellText(value: string | null | undefined): string {
  const t = value?.trim();
  return t && t.length > 0 ? t : "—";
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
