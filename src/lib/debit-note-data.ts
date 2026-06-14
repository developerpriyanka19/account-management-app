import type { DebitNotePayload } from "@/lib/debit-note-types";
import { snapshotFromRecord } from "@/lib/bank-details-types";
import { normalizeDebitNoteType, DebitNoteType } from "@/lib/debit-note-types";

type DebitNoteRecord = {
  id: number;
  type: string;
  customerId: number;
  debitNoteNo: string;
  date: string;
  district: string | null;
  taluk: string | null;
  village: string | null;
  hobbli: string | null;
  subtotal: number;
  gst: number;
  total: number;
  remarks: string | null;
  status: string;
  bankDetailsId?: number | null;
  bankName?: string | null;
  accountHolderName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  branchName?: string | null;
  items: Array<{
    farmerId: number | null;
    farmerName: string | null;
    surveyNo: string | null;
    acres: number | null;
    guntas: number | null;
    landConversionChallanRefNo: string | null;
    landConversionFee: number | null;
    podiChallanRefNo: string | null;
    podiFee: number | null;
    recoveryChallanRefNo: string | null;
    recoveryFee: number | null;
    rtcAcre: number | null;
    rtcGunta: number | null;
    leaseAcre: number | null;
    leaseGunta: number | null;
    atlCharges: number | null;
    poaCharges: number | null;
    chequePart1No: string | null;
    chequePart1Date: string | null;
    chequePart1Amount: number | null;
    chequePart1BankName: string | null;
    cashAmount: number | null;
    total: number;
    remarks: string | null;
  }>;
};

export function debitNoteRecordToPayload(record: DebitNoteRecord): DebitNotePayload {
  const type = normalizeDebitNoteType(record.type);
  const rows =
    type === DebitNoteType.LAND_CONVERSION
      ? record.items.map((item) => ({
          farmerId: item.farmerId,
          farmerName: item.farmerName ?? "",
          surveyNo: item.surveyNo ?? "",
          acres: item.acres,
          guntas: item.guntas,
          landConversionChallanRefNo: item.landConversionChallanRefNo ?? "",
          landConversionFee: item.landConversionFee ?? 0,
          podiChallanRefNo: item.podiChallanRefNo ?? "",
          podiFee: item.podiFee ?? 0,
          recoveryChallanRefNo: item.recoveryChallanRefNo ?? "",
          recoveryFee: item.recoveryFee ?? 0,
          total: item.total ?? 0,
          remarks: item.remarks ?? "",
        }))
      : record.items.map((item) => ({
          farmerId: item.farmerId,
          farmerName: item.farmerName ?? "",
          surveyNo: item.surveyNo ?? "",
          rtcAcre: item.rtcAcre,
          rtcGunta: item.rtcGunta,
          leaseAcre: item.leaseAcre,
          leaseGunta: item.leaseGunta,
          atlCharges: item.atlCharges ?? 0,
          poaCharges: item.poaCharges ?? 0,
          chequeNo: item.chequePart1No ?? "",
          chequeDate: item.chequePart1Date ?? "",
          chequeAmount: item.chequePart1Amount ?? 0,
          bankName: item.chequePart1BankName ?? "",
          cashAmount: item.cashAmount ?? 0,
          total: item.total ?? 0,
          remarks: item.remarks ?? "",
        }));

  return {
    id: record.id,
    type,
    customerId: record.customerId,
    debitNoteNo: record.debitNoteNo,
    date: record.date,
    district: record.district ?? "",
    taluk: record.taluk ?? "",
    village: record.village ?? "",
    hobbli: record.hobbli ?? "",
    remarks: record.remarks ?? "",
    subtotal: record.subtotal ?? 0,
    gst: record.gst ?? 0,
    total: record.total ?? 0,
    status: (record.status ?? "DRAFT").toUpperCase() === "FINAL" ? "FINAL" : "DRAFT",
    rows,
    bank: snapshotFromRecord(record),
  };
}
