/**
 * Shared date helpers.
 * Storage: YYYY-MM-DD (ISO date string)
 * Display / user input: DD/MMM/YYYY (e.g. 04/Apr/2026)
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DISPLAY_DATE_MMM_RE =
  /^(\d{2})\/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/(\d{4})$/i;
const LEGACY_DISPLAY_DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export const MONTH_ABBREVS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const DATE_DISPLAY_PLACEHOLDER = "DD/MMM/YYYY";
export const DATE_DISPLAY_FORMAT_HINT = "Use DD/MMM/YYYY (e.g. 04/Apr/2026)";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function monthAbbrev(month: number): string {
  return MONTH_ABBREVS[month - 1] ?? "";
}

function parseMonthAbbrev(token: string): number | null {
  const key = token.trim().slice(0, 3).toLowerCase();
  const idx = MONTH_ABBREVS.findIndex((m) => m.toLowerCase() === key);
  return idx >= 0 ? idx + 1 : null;
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

/** Validate DD/MMM/YYYY display format. */
export function isValidDisplayDate(value: string | null | undefined): boolean {
  const t = value?.trim() ?? "";
  const match = DISPLAY_DATE_MMM_RE.exec(t);
  if (!match) return false;
  const day = Number(match[1]);
  const month = parseMonthAbbrev(match[2]!);
  const year = Number(match[3]);
  if (month == null) return false;
  return isRealCalendarDate(year, month, day);
}

/** Convert YYYY-MM-DD or legacy DD/MM/YYYY → DD/MMM/YYYY. */
export function toDisplayDate(value: string | null | undefined): string {
  const t = value?.trim() ?? "";
  if (!t) return "";

  const mmmMatch = DISPLAY_DATE_MMM_RE.exec(t);
  if (mmmMatch) {
    const month = parseMonthAbbrev(mmmMatch[2]!);
    if (month != null) {
      return `${mmmMatch[1]}/${monthAbbrev(month)}/${mmmMatch[3]}`;
    }
  }

  if (ISO_DATE_RE.test(t)) {
    const [y, m, d] = t.split("-").map(Number);
    if (isRealCalendarDate(y!, m!, d!)) {
      return `${pad2(d!)}/${monthAbbrev(m!)}/${y}`;
    }
  }

  const legacyMatch = LEGACY_DISPLAY_DATE_RE.exec(t);
  if (legacyMatch) {
    const day = Number(legacyMatch[1]);
    const month = Number(legacyMatch[2]);
    const year = Number(legacyMatch[3]);
    if (isRealCalendarDate(year, month, day)) {
      return `${pad2(day)}/${monthAbbrev(month)}/${year}`;
    }
  }

  return t;
}

/**
 * Convert user-facing date to YYYY-MM-DD for storage.
 * Accepts DD/MMM/YYYY, legacy DD/MM/YYYY, or already-valid YYYY-MM-DD.
 */
export function toStorageDate(value: string | null | undefined): string | null {
  const t = value?.trim() ?? "";
  if (!t) return null;
  if (isValidStorageDate(t)) return t;

  const mmmMatch = DISPLAY_DATE_MMM_RE.exec(t);
  if (mmmMatch) {
    const day = Number(mmmMatch[1]);
    const month = parseMonthAbbrev(mmmMatch[2]!);
    const year = Number(mmmMatch[3]);
    if (month != null && isRealCalendarDate(year, month, day)) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
    return null;
  }

  const legacyMatch = LEGACY_DISPLAY_DATE_RE.exec(t);
  if (legacyMatch) {
    const day = Number(legacyMatch[1]);
    const month = Number(legacyMatch[2]);
    const year = Number(legacyMatch[3]);
    if (isRealCalendarDate(year, month, day)) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
    return null;
  }

  return null;
}

/** Today as YYYY-MM-DD (local). */
export function todayStorageDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** Today as DD/MMM/YYYY (local). */
export function todayDisplayDate(): string {
  return toDisplayDate(todayStorageDate());
}

/** Display date or em dash for empty/missing. */
export function formatDateOrDash(value: string | null | undefined): string {
  const display = toDisplayDate(value);
  return display || "—";
}

/** Format a Date object as DD/MMM/YYYY. */
export function formatDateFromDate(value: Date): string {
  return toDisplayDate(
    `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`,
  );
}

/** Format a Date object as DD/MMM/YYYY with time (e.g. 04/Apr/2026, 7:30 pm). */
export function formatDateTimeDisplay(value: Date): string {
  const datePart = formatDateFromDate(value);
  const timePart = new Intl.DateTimeFormat("en-IN", { timeStyle: "short" }).format(value);
  return `${datePart}, ${timePart}`;
}
