export const DebitNoteType = {
  LAND_CONVERSION: "LAND_CONVERSION",
  ATL_POA: "ATL_POA",
} as const;

export type DebitNoteType = (typeof DebitNoteType)[keyof typeof DebitNoteType];

export const DEBIT_NOTE_TYPE_OPTIONS: { value: DebitNoteType; label: string }[] = [
  { value: DebitNoteType.LAND_CONVERSION, label: "Land Conversion" },
  { value: DebitNoteType.ATL_POA, label: "ATL and POA/GPA" },
];

/** Normalize legacy stored values to current enum. */
export function normalizeDebitNoteType(type: string): DebitNoteType {
  if (type === DebitNoteType.ATL_POA || type === "atl-poa-gpa") {
    return DebitNoteType.ATL_POA;
  }
  return DebitNoteType.LAND_CONVERSION;
}

export type DebitNoteCustomerOption = {
  id: number;
  label: string;
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
  surveyNo: string | null;
  rtcExtentAcre: number | null;
  rtcExtentGunta: number | null;
  leaseExtentAcre: number | null;
  leaseExtentGunta: number | null;
};

export type LandConversionRow = {
  farmerId: number | null;
  farmerName: string;
  surveyNo: string;
  acres: number | null;
  guntas: number | null;
  landConversionChallanRefNo: string;
  landConversionFee: number;
  podiChallanRefNo: string;
  podiFee: number;
  recoveryChallanRefNo: string;
  recoveryFee: number;
  total: number;
  remarks: string;
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
};
