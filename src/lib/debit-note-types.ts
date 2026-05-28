export type DebitNoteType = "land-conversion" | "atl-poa-gpa";

export const DEBIT_NOTE_TYPE_OPTIONS: { value: DebitNoteType; label: string }[] = [
  { value: "land-conversion", label: "Land Conversion" },
  { value: "atl-poa-gpa", label: "ATL and POA/GPA" },
];

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
