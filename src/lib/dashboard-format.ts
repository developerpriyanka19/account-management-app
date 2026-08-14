/** Dashboard count — whole number, Indian grouping (e.g. 1,56). */
export function formatDashboardCount(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

/** Dashboard currency — always ₹ with 2 decimals (e.g. ₹12,45,678.00). */
export function formatDashboardCurrency(value: number): string {
  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

/** Compact dashboard currency — L / Cr for large values (e.g. ₹73.13 L). */
export function formatDashboardCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  }
  if (abs >= 100_000) {
    return `₹${(value / 100_000).toFixed(2)} L`;
  }
  if (abs >= 1_000) {
    return `₹${new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(value)}`;
  }
  return formatDashboardCurrency(value);
}

/** Current month label for dashboard header (e.g. Jul 2026). */
export function formatDashboardMonthYear(date = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
}
