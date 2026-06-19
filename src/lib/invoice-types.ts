import type { BankDetailsSnapshot } from "@/lib/bank-details-types";

import { lineAmountFromExtent } from "@/lib/invoice-calculations";

export type InvoiceBillingCustomerOption = {
  id: number;
  label: string;
  firstName: string;
  lastName: string;
  gstNumber: string;
  companyName: string | null;
  buildingNumber: string | null;
  street: string | null;
  locality: string | null;
  village: string | null;
  taluk: string | null;
  district: string | null;
  hobbli: string | null;
  state: string | null;
  pincode: string | null;
  companyAddress: string | null;
  panNumber: string | null;
};

export type InvoiceDocumentCustomer = {
  id: number;
  companyName: string;
  gstNumber: string;
  buildingNumber: string;
  street: string;
  locality: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  panNumber: string;
};

export type InvoiceFarmerOption = {
  id: number;
  label: string;
  vendorCode: string | null;
  surveyNo: string | null;
  newSurveyNo: string | null;
  rtcExtentAcre: number | null;
  rtcExtentGunta: number | null;
  balanceExtentAcre: number | null;
  balanceExtentGunta: number | null;
  totalCents: number | null;
};

export type InvoiceLineInput = {
  farmerId: number | null;
  farmerName: string;
  district: string;
  taluk: string;
  village: string;
  hobbli: string;
  surveyNo: string;
  naExtent: string;
  acres: number | null;
  gunta: number | null;
  totalCents: number | null;
  affidavitId: string;
  requestId: string;
  debitNote: number;
  remark: string;
  amount: number | null;
  description: string;
};

export type InvoiceDocumentData = {
  id?: number;
  invoiceType: "na" | "service";
  subType: string;
  invoiceNumber: string;
  invoiceDate: string;
  district: string;
  taluk: string;
  village: string;
  hobbli: string;
  state: string;
  status: string;
  ratePerAcre: number;
  notes: string;
  totalAmountWords?: string;
  pdfUrl?: string;
  customer: InvoiceDocumentCustomer;
  lines: InvoiceLineInput[];
  totals: {
    subtotal: number;
    sgst: number;
    cgst: number;
    grandTotal: number;
  };
  bank: BankDetailsSnapshot;
};

export function farmerToInvoiceLine(
  farmer: InvoiceFarmerOption,
  ratePerAcre: number,
): InvoiceLineInput {
  const acres = farmer.rtcExtentAcre ?? farmer.balanceExtentAcre ?? null;
  const gunta = farmer.rtcExtentGunta ?? farmer.balanceExtentGunta ?? null;
  const naParts: string[] = [];
  if (acres != null) naParts.push(`${acres} A`);
  if (gunta != null) naParts.push(`${gunta} G`);

  return {
    farmerId: farmer.id,
    farmerName: farmer.label,
    district: "",
    taluk: "",
    village: farmer.newSurveyNo?.trim() || "—",
    hobbli: "",
    surveyNo: farmer.surveyNo?.trim() || "—",
    naExtent: naParts.length > 0 ? naParts.join(" · ") : "—",
    acres,
    gunta,
    totalCents: farmer.totalCents,
    affidavitId: "",
    requestId: farmer.vendorCode?.trim() || "",
    debitNote: 0,
    remark: "",
    amount:
      ratePerAcre > 0
        ? lineAmountFromExtent(acres, gunta, ratePerAcre) || null
        : null,
    description: farmer.label,
  };
}
