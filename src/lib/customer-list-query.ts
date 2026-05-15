import type { Prisma } from "@prisma/client";

export const CUSTOMERS_PAGE_SIZE = 10;

export const CUSTOMER_LIST_SELECT = {
  id: true,
  farmerName: true,
  changedFarmerName: true,
  vendorCode: true,
  surveyNo: true,
  newSurveyNo: true,
  rtcExtentAcre: true,
  rtcExtentGunta: true,
  rtcAKharab: true,
  rtcBKharab: true,
  balanceExtentAcre: true,
  balanceExtentGunta: true,
  leaseExtentAcre: true,
  leaseExtentGunta: true,
  totalGunta: true,
  totalCents: true,
  rentPerAcre: true,
  aesAdvanceChequeAmount: true,
  aesAdvanceDate: true,
  aesAdvanceChequeNo: true,
  aesAdvanceBankName: true,
  balanceRentAmount: true,
  loanAmount: true,
  rentAmount: true,
  tdsAmount: true,
  shortageChequeAmount: true,
  shortageDate: true,
  shortageChequeNo: true,
  shortageBankName: true,
  atlStampDuty: true,
  atlRegCharges: true,
  atlTotal: true,
  paoStampDuty: true,
  paoRegCharges: true,
  paoTotal: true,
  landConversion: true,
  podiFee: true,
  leaseDeedStampDuty: true,
  leaseDeedRegCharges: true,
  debitNoteNo: true,
  debitNoteAmount: true,
  receivedNeftAmount: true,
  receivedDate: true,
  balanceReceivable: true,
  cropCompensation: true,
} as const;

export function customerListWhere(query: string): Prisma.CustomerWhereInput | undefined {
  const q = query.trim();
  if (!q) return undefined;
  return { farmerName: { contains: q, mode: "insensitive" } };
}
