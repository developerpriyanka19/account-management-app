/**
 * Shared date helpers.
 * Storage: YYYY-MM-DD (ISO date string)
 * Display / user input: DD/MM/YYYY
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DISPLAY_DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export const DATE_DISPLAY_PLACEHOLDER = "DD/MM/YYYY";
export const DATE_DISPLAY_FORMAT_HINT = "Use DD/MM/YYYY";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** True if year/month/day form a real calendar date. */
export function isRealCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/** Validate YYYY-MM-DD storage format. */
export function isValidStorageDate(value: string | null | undefined): boolean {
  const t = value?.trim() ?? "";
  if (!ISO_DATE_RE.test(t)) return false;
  const [y, m, d] = t.split("-").map(Number);
  return isRealCalendarDate(y!, m!, d!);
}

/** Validate DD/MM/YYYY display format. */
export function isValidDisplayDate(value: string | null | undefined): boolean {
  const t = value?.trim() ?? "";
  const match = DISPLAY_DATE_RE.exec(t);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  return isRealCalendarDate(year, month, day);
}

/** Convert YYYY-MM-DD → DD/MM/YYYY. Returns "" for empty; original string if unrecognized. */
export function toDisplayDate(value: string | null | undefined): string {
  const t = value?.trim() ?? "";
  if (!t) return "";
  if (isValidDisplayDate(t)) return t;
  if (ISO_DATE_RE.test(t)) {
    const [y, m, d] = t.split("-");
    if (isRealCalendarDate(Number(y), Number(m), Number(d))) {
      return `${d}/${m}/${y}`;
    }
  }
  return t;
}

/**
 * Convert user-facing date to YYYY-MM-DD for storage.
 * Accepts DD/MM/YYYY or already-valid YYYY-MM-DD.
 * Returns null for empty; null + invalid if not a real date.
 */
export function toStorageDate(value: string | null | undefined): string | null {
  const t = value?.trim() ?? "";
  if (!t) return null;
  if (isValidStorageDate(t)) return t;
  const match = DISPLAY_DATE_RE.exec(t);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!isRealCalendarDate(year, month, day)) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Today as YYYY-MM-DD (local). */
export function todayStorageDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** Today as DD/MM/YYYY (local). */
export function todayDisplayDate(): string {
  return toDisplayDate(todayStorageDate());
}

/** Display date or em dash for empty/missing. */
export function formatDateOrDash(value: string | null | undefined): string {
  const display = toDisplayDate(value);
  return display || "—";
}
