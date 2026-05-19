/** Invoice builder and template types. */

export type InvoiceBillingCustomerOption = {
  id: number;
  label: string;
  gstNumber: string;
  companyName: string | null;
  companyAddress: string | null;
  state: string | null;
  panNumber: string | null;
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
  village: string;
  surveyNo: string;
  naExtent: string;
  acres: number | null;
  gunta: number | null;
  totalCents: number | null;
  affidavitId: string;
  requestId: string;
  amount: number;
  description: string;
};

export type InvoiceDocumentData = {
  id?: number;
  invoiceType: "na" | "service";
  subType: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: string;
  ratePerAcre: number;
  notes: string;
  customer: {
    id: number;
    companyName: string;
    companyAddress: string;
    gstNumber: string;
    state: string;
    panNumber: string;
  };
  lines: InvoiceLineInput[];
  totals: {
    subtotal: number;
    sgst: number;
    cgst: number;
    grandTotal: number;
  };
};

export function farmerToInvoiceLine(
  farmer: InvoiceFarmerOption,
  ratePerAcre: number,
): InvoiceLineInput {
  const acres = farmer.balanceExtentAcre ?? farmer.rtcExtentAcre ?? null;
  const gunta = farmer.balanceExtentGunta ?? farmer.rtcExtentGunta ?? null;
  const naParts: string[] = [];
  if (acres != null) naParts.push(`${acres} A`);
  if (gunta != null) naParts.push(`${gunta} G`);

  return {
    farmerId: farmer.id,
    village: farmer.newSurveyNo?.trim() || "—",
    surveyNo: farmer.surveyNo?.trim() || "—",
    naExtent: naParts.length > 0 ? naParts.join(" · ") : "—",
    acres,
    gunta,
    totalCents: farmer.totalCents,
    affidavitId: "",
    requestId: farmer.vendorCode?.trim() || "",
    amount: acres != null ? Math.round(acres * ratePerAcre * 100) / 100 : 0,
    description: farmer.label,
  };
}
