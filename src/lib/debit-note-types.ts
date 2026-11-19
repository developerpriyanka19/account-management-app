import type { BankDetailsSnapshot } from "@/lib/bank-details-types";

export const DebitNoteType = {
  LAND_CONVERSION: "LAND_CONVERSION",
  ATL_POA: "ATL_POA",
  LEASE_DEED_EXECUTION: "LEASE_DEED_EXECUTION",
  SERVICE_ORDER: "SERVICE_ORDER",
  /** Land Conversion Fee clone — same layout; fee terminology is K2 Challan. */
  K2_CHALLAN: "K2_CHALLAN",
} as const;

export type DebitNoteType = (typeof DebitNoteType)[keyof typeof DebitNoteType];

export const DEBIT_NOTE_TYPE_OPTIONS: { value: DebitNoteType; label: string }[] = [
  { value: DebitNoteType.LAND_CONVERSION, label: "Land Conversion" },
  { value: DebitNoteType.ATL_POA, label: "ATL and POA/GPA" },
  { value: DebitNoteType.LEASE_DEED_EXECUTION, label: "Lease Deed Execution" },
  { value: DebitNoteType.SERVICE_ORDER, label: "Service Order" },
  { value: DebitNoteType.K2_CHALLAN, label: "K2 Challan" },
];

/** Classic land conversion debit note — NA extent + LC / Podi / Recovery fees. */
export function isLandConversionOnly(type: DebitNoteType): boolean {
  return type === DebitNoteType.LAND_CONVERSION;
}

/** K2 Challan debit note module (Land Conversion Fee layout clone). */
export function isK2ChallanModule(type: DebitNoteType): boolean {
  return type === DebitNoteType.K2_CHALLAN;
}

/**
 * Land Conversion–shaped document layout (LC or K2 Challan module).
 * Same table, form, and PDF structure; only fee labels / narration differ.
 */
export function isLandConversionLayout(type: DebitNoteType): boolean {
  return isLandConversionOnly(type) || isK2ChallanModule(type);
}

/**
 * Lease deed / service order — RTC + lease extent + K2 challan fee columns.
 * Distinct from {@link isK2ChallanModule} (the Land Conversion Fee clone).
 */
export function isK2ChallanDebitNote(type: DebitNoteType): boolean {
  return (
    type === DebitNoteType.LEASE_DEED_EXECUTION || type === DebitNoteType.SERVICE_ORDER
  );
}

/** Rows persisted as land-conversion-shaped line items (LC, K2 module, or lease/service). */
export function isLandConversionDataRow(type: DebitNoteType): boolean {
  return isLandConversionLayout(type) || isK2ChallanDebitNote(type);
}

/** @deprecated Use isLandConversionLayout or isK2ChallanDebitNote */
export function isLandConversionStyleDebitNote(type: DebitNoteType): boolean {
  return isLandConversionDataRow(type);
}

/** Normalize legacy stored values to current enum. */
export function normalizeDebitNoteType(type: string): DebitNoteType {
  if (type === DebitNoteType.ATL_POA || type === "atl-poa-gpa") {
    return DebitNoteType.ATL_POA;
  }
  if (
    type === DebitNoteType.LEASE_DEED_EXECUTION ||
    type === "lease-deed-execution"
  ) {
    return DebitNoteType.LEASE_DEED_EXECUTION;
  }
  if (type === DebitNoteType.SERVICE_ORDER || type === "service-order") {
    return DebitNoteType.SERVICE_ORDER;
  }
  if (type === DebitNoteType.K2_CHALLAN || type === "k2-challan") {
    return DebitNoteType.K2_CHALLAN;
  }
  return DebitNoteType.LAND_CONVERSION;
}

export type DebitNoteCustomerOption = {
  id: number;
  label: string;
  firstName: string;
  lastName: string;
  gstNumber: string;
  companyName: string | null;
  companyAddress: string | null;
  buildingNumber: string | null;
  street: string | null;
  locality: string | null;
  village: string | null;
  taluk: string | null;
  hobbli: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
};

export type DebitNoteFarmerOption = {
  id: number;
  farmerName: string;
  changedFarmerName?: string | null;
  vendorCode?: string | null;
  surveyNo: string | null;
  newSurveyNo?: string | null;
  rtcExtentAcre: number | null;
  rtcExtentGunta: number | null;
  rtcAKharab?: number | null;
  rtcBKharab?: number | null;
  balanceExtentAcre?: number | null;
  balanceExtentGunta?: number | null;
  leaseExtentAcre: number | null;
  leaseExtentGunta: number | null;
  leaseDeedStampDuty?: number | null;
  leaseDeedRegCharges?: number | null;
  rentPerAcre?: number | null;
  landConversion?: number | null;
  podiFee?: number | null;
  otherRecoveries?: number | null;
  atlTotal?: number | null;
  paoTotal?: number | null;
  aesAdvanceChequeNo?: string | null;
  aesAdvanceDate?: string | null;
  aesAdvanceChequeAmount?: number | null;
  aesAdvanceBankName?: string | null;
  state: string | null;
  district: string | null;
  taluk: string | null;
  hobbli: string | null;
  village: string | null;
};

export type LandConversionRow = {
  farmerId: number | null;
  farmerName: string;
  surveyNo: string;
  acres: number | null;
  guntas: number | null;
  rtcAcre: number | null;
  rtcGunta: number | null;
  leaseAcre: number | null;
  leaseGunta: number | null;
  landConversionChallanRefNo: string;
  landConversionFee: number;
  podiChallanRefNo: string;
  podiFee: number;
  recoveryChallanRefNo: string;
  recoveryFee: number;
  total: number;
  remarks: string;
  /** Display-only snapshot fields (not stored separately in DB). */
  changedFarmerName?: string;
  vendorCode?: string;
  newSurveyNo?: string;
  balanceAcre?: number | null;
  balanceGunta?: number | null;
  rtcAKharab?: number | null;
  rtcBKharab?: number | null;
  totalGunta?: number | null;
  totalCents?: number | null;
};

export type AtlPoaRow = {
  farmerId: number | null;
  farmerName: string;
  surveyNo: string;
  rtcAcre: number | null;
  rtcGunta: number | null;
  leaseAcre: number | null;
  leaseGunta: number | null;
  atlCharges: number;
  poaCharges: number;
  chequeNo: string;
  chequeDate: string;
  chequeAmount: number;
  bankName: string;
  cashAmount: number;
  total: number;
  remarks: string;
};

export type DebitNotePayload = {
  id?: number;
  type: DebitNoteType;
  debitNoteNo: string;
  date: string;
  customerId: number;
  state: string;
  district: string;
  taluk: string;
  village: string;
  hobbli: string;
  remarks: string;
  subtotal: number;
  gst: number;
  total: number;
  status: "DRAFT" | "FINAL";
  rows: (LandConversionRow | AtlPoaRow)[];
  bank: BankDetailsSnapshot;
};
