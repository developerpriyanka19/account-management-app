import { formatAmount, cellText, formatOptionalDate } from "@/lib/customer-display";

export type CustomerListRow = {
  id: number;
  farmerName: string | null;
  changedFarmerName: string | null;
  vendorCode: string | null;
  surveyNo: string | null;
  newSurveyNo: string | null;
  state?: string | null;
  district?: string | null;
  taluk?: string | null;
  hobbli?: string | null;
  village?: string | null;
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
  noOfYears: number | null;
  rentAmount: number | null;
  aesAdvanceDate: string | null;
  aesAdvanceChequeNo: string | null;
  aesAdvanceChequeAmount: number | null;
  aesAdvanceBankName: string | null;
  balanceRentAmount: number | null;
  tdsAmount: number | null;
  bankLoanDdDate: string | null;
  loanAmount: number | null;
  bankLoanDdNo: string | null;
  bankLoanBankName: string | null;
  rentalDdDate: string | null;
  leaseAmount: number | null;
  rentalDdChequeNo: string | null;
  rentalDdBankName: string | null;
  rentalDdPart1Date: string | null;
  rentalDdPart1Amount: number | null;
  rentalDdPart1ChequeNo: string | null;
  rentalDdPart1BankName: string | null;
  receivedDate: string | null;
  balanceRentChequeNo: string | null;
  receivedNeftAmount: number | null;
  shortageChequeAmount: number | null;
  shortageDate: string | null;
  shortageChequeNo: string | null;
  shortageBankName: string | null;
  shortageNote: string | null;
  shortageAmountSecondTime: number | null;
  shortageSecondDate: string | null;
  shortageSecondChequeNo: string | null;
  shortageSecondBankName: string | null;
  shortageThirdChequeAmount: number | null;
  shortageThirdDate: string | null;
  shortageThirdChequeNo: string | null;
  shortageThirdBankName: string | null;
  shortageAmountTotal: number | null;
  atlTotal: number | null;
  paoTotal: number | null;
  landConversion: number | null;
  otherRecoveries: number | null;
  podiFee: number | null;
  leaseDeedStampDuty: number | null;
  leaseDeedRegCharges: number | null;
  totalGovtFee: number | null;
  debitNoteNo: string | null;
  debitNoteAmount: number | null;
  balanceReceivable: number | null;
  otherCharges: number | null;
  cropCompensation: number | null;
  notes: string | null;
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
  if (hasValue(c.loanAmount)) parts.push(`Bank Loan ${fmtNum(c.loanAmount)}`);
  if (hasValue(c.leaseAmount)) parts.push(`Rental DD ${fmtNum(c.leaseAmount)}`);
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
  const stamp = c.leaseDeedStampDuty;
  const reg = c.leaseDeedRegCharges;
  if (stamp == null && reg == null) return "—";
  const total = (stamp ?? 0) + (reg ?? 0);
  return `₹${fmtNum(total)}`;
}

export function formatDebitNote(c: CustomerListRow): string {
  const no = c.debitNoteNo?.trim();
  const amt = hasValue(c.debitNoteAmount) ? fmtNum(c.debitNoteAmount) : "";
  if (no && amt) return `${no} · ₹${amt}`;
  if (no) return no;
  if (amt) return `₹${amt}`;
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
