/**
 * Title shown at the top of printed customer profiles.
 * Set `COMPANY_PRINT_TITLE` in `.env` to customize (server-side).
 */
export function getCompanyPrintTitle(): string {
  const t = process.env.COMPANY_PRINT_TITLE?.trim();
  return t && t.length > 0 ? t : "Account Management";
}
