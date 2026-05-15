import { formatAmount, cellText, formatOptionalDate } from "@/lib/customer-display";

export type CustomerListRow = {
  id: number;
  farmerName: string | null;
  changedFarmerName: string | null;
  vendorCode: string | null;
  surveyNo: string | null;
  newSurveyNo: string | null;
  rtcExtentAcre: number | null;
  rtcExtentGunta: number | null;
  rtcAKharab: number | null;
  rtcBKharab: number | null;
  balanceExtentAcre: number | null;
  balanceExtentGunta: number | null;
  leaseExtentAcre: number | null;
  leaseExtentGunta: number | null;
  totalGunta: number | null;
  totalCents: number | null;
  rentPerAcre: number | null;
  aesAdvanceChequeAmount: number | null;
  aesAdvanceDate: string | null;
  aesAdvanceChequeNo: string | null;
  aesAdvanceBankName: string | null;
  balanceRentAmount: number | null;
  loanAmount: number | null;
  rentAmount: number | null;
  tdsAmount: number | null;
  shortageChequeAmount: number | null;
  shortageDate: string | null;
  shortageChequeNo: string | null;
  shortageBankName: string | null;
  atlStampDuty: number | null;
  atlRegCharges: number | null;
  atlTotal: number | null;
  paoStampDuty: number | null;
  paoRegCharges: number | null;
  paoTotal: number | null;
  landConversion: number | null;
  podiFee: number | null;
  leaseDeedStampDuty: number | null;
  leaseDeedRegCharges: number | null;
  debitNoteNo: string | null;
  debitNoteAmount: number | null;
  receivedNeftAmount: number | null;
  receivedDate: string | null;
  balanceReceivable: number | null;
  cropCompensation: number | null;
};

function hasValue(n: number | null | undefined): n is number {
  return n != null && !Number.isNaN(n);
}

function fmtNum(n: number | null | undefined): string {
  if (!hasValue(n)) return "";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(n);
}

/** Compact extent: "2A · 3G" or "—" */
export function formatExtentCompact(
  acre: number | null | undefined,
  gunta: number | null | undefined,
  extra?: { label: string; value: number | null | undefined }[],
): string {
  const parts: string[] = [];
  if (hasValue(acre)) parts.push(`${fmtNum(acre)}A`);
  if (hasValue(gunta)) parts.push(`${fmtNum(gunta)}G`);
  if (extra) {
    for (const e of extra) {
      if (hasValue(e.value)) parts.push(`${fmtNum(e.value)} ${e.label}`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function formatRtcExtent(c: CustomerListRow): string {
  return formatExtentCompact(c.rtcExtentAcre, c.rtcExtentGunta, [
    { label: "AK", value: c.rtcAKharab },
    { label: "BK", value: c.rtcBKharab },
  ]);
}

export function formatBalanceExtent(c: CustomerListRow): string {
  return formatExtentCompact(c.balanceExtentAcre, c.balanceExtentGunta);
}

export function formatLeaseExtent(c: CustomerListRow): string {
  return formatExtentCompact(c.leaseExtentAcre, c.leaseExtentGunta);
}

export function formatLeaseIssued(c: CustomerListRow): string {
  const parts: string[] = [];
  if (hasValue(c.loanAmount)) parts.push(`L ${fmtNum(c.loanAmount)}`);
  if (hasValue(c.rentAmount)) parts.push(`R ${fmtNum(c.rentAmount)}`);
  if (hasValue(c.tdsAmount)) parts.push(`T ${fmtNum(c.tdsAmount)}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function formatNa(c: CustomerListRow): string {
  const parts: string[] = [];
  if (hasValue(c.landConversion)) parts.push(`LC ${fmtNum(c.landConversion)}`);
  if (hasValue(c.podiFee)) parts.push(`P ${fmtNum(c.podiFee)}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function formatLeaseDeed(c: CustomerListRow): string {
  const parts: string[] = [];
  if (hasValue(c.leaseDeedStampDuty)) parts.push(`S ${fmtNum(c.leaseDeedStampDuty)}`);
  if (hasValue(c.leaseDeedRegCharges)) parts.push(`R ${fmtNum(c.leaseDeedRegCharges)}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function formatDebitNote(c: CustomerListRow): string {
  const no = c.debitNoteNo?.trim();
  const amt = hasValue(c.debitNoteAmount) ? fmtNum(c.debitNoteAmount) : "";
  if (no && amt) return `${no} · ₹${amt}`;
  if (no) return no;
  if (amt) return `₹${amt}`;
  return "—";
}

export function formatReceived(c: CustomerListRow): string {
  const amt = hasValue(c.receivedNeftAmount) ? `₹${fmtNum(c.receivedNeftAmount)}` : "";
  const date = formatOptionalDate(c.receivedDate);
  if (amt && date !== "—") return `${amt} · ${date}`;
  if (amt) return amt;
  if (date !== "—") return date;
  return "—";
}

export function formatAesAdvance(c: CustomerListRow): string {
  const amt = hasValue(c.aesAdvanceChequeAmount) ? `₹${fmtNum(c.aesAdvanceChequeAmount)}` : "";
  const date = formatOptionalDate(c.aesAdvanceDate);
  if (amt && date !== "—") return `${amt} · ${date}`;
  if (amt) return amt;
  if (date !== "—") return date;
  return "—";
}

export type BalanceStatus = "clear" | "pending" | "none";

export function getBalanceStatus(amount: number | null | undefined): BalanceStatus {
  if (amount == null || Number.isNaN(amount)) return "none";
  if (amount === 0) return "clear";
  return "pending";
}

export function formatMoneyDisplay(value: number | null | undefined): string {
  return formatAmount(value);
}

export function isNegativeMoney(value: number | null | undefined): boolean {
  return hasValue(value) && value < 0;
}

export function isPendingMoney(value: number | null | undefined): boolean {
  return hasValue(value) && value > 0;
}

export { cellText, formatAmount };
