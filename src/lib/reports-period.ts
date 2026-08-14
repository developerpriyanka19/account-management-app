import { todayStorageDate } from "@/lib/date-format";

export type ReportPeriodPreset = "annual" | "last6" | "last3" | "custom";

export type ReportPeriodFilter = {
  preset: ReportPeriodPreset;
  dateFrom?: string;
  dateTo?: string;
};

/** Inclusive YYYY-MM-DD range for a period preset. */
export function resolveReportPeriod(
  filter: ReportPeriodFilter,
): { from: string; to: string } | null {
  const today = todayStorageDate();
  if (filter.preset === "custom") {
    const from = filter.dateFrom?.trim() ?? "";
    const to = filter.dateTo?.trim() ?? "";
    if (!from && !to) return null;
    return { from: from || "0000-01-01", to: to || today };
  }

  const end = new Date(`${today}T12:00:00`);
  const start = new Date(end);
  if (filter.preset === "annual") {
    start.setFullYear(start.getFullYear() - 1);
  } else if (filter.preset === "last6") {
    start.setMonth(start.getMonth() - 6);
  } else {
    start.setMonth(start.getMonth() - 3);
  }
  const from = start.toISOString().slice(0, 10);
  return { from, to: today };
}

/**
 * Prefer payment-related dates when present; otherwise fall back to createdAt.
 * Returns YYYY-MM-DD.
 */
export function farmerPaymentDate(farmer: {
  aesAdvanceDate?: string | null;
  bankLoanDdDate?: string | null;
  rentalDdDate?: string | null;
  rentalDdPart1Date?: string | null;
  createdAt: Date;
}): string {
  const candidates = [
    farmer.aesAdvanceDate,
    farmer.bankLoanDdDate,
    farmer.rentalDdPart1Date,
    farmer.rentalDdDate,
  ]
    .map((d) => d?.trim() ?? "")
    .filter(Boolean)
    .sort();
  if (candidates.length > 0) return candidates[candidates.length - 1]!;
  return farmer.createdAt.toISOString().slice(0, 10);
}

export function dateInRange(
  date: string,
  range: { from: string; to: string } | null,
): boolean {
  if (!range) return true;
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}
