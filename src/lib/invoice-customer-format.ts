import type { InvoiceDocumentCustomer } from "@/lib/invoice-types";

export type GstCustomerAddressSource = {
  companyName?: string | null;
  firstName?: string;
  lastName?: string;
  gstNumber: string;
  buildingNumber?: string | null;
  street?: string | null;
  locality?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  companyAddress?: string | null;
  panNumber?: string | null;
};

/** Bill To field labels matching reference invoice layout. */
export const BILL_TO_ADDRESS_FIELDS = [
  { key: "buildingNumber" as const, label: "Building No./Flat No:" },
  { key: "street" as const, label: "Road/Street:" },
  { key: "locality" as const, label: "Locality/Sub Locality:" },
  { key: "village" as const, label: "City/Town/Village:" },
  { key: "district" as const, label: "District:" },
  { key: "state" as const, label: "State:" },
  { key: "pincode" as const, label: "PIN Code:" },
] as const;

export function resolveCustomerCompanyName(source: GstCustomerAddressSource): string {
  const company = source.companyName?.trim();
  if (company) return company;
  return `${source.firstName ?? ""} ${source.lastName ?? ""}`.trim() || "—";
}

export function gstCustomerToInvoiceCustomer(
  source: GstCustomerAddressSource & { id: number },
): InvoiceDocumentCustomer {
  return {
    id: source.id,
    companyName: resolveCustomerCompanyName(source),
    gstNumber: source.gstNumber.trim(),
    buildingNumber: source.buildingNumber?.trim() ?? "",
    street: source.street?.trim() ?? "",
    locality: source.locality?.trim() ?? "",
    village: source.village?.trim() ?? "",
    district: source.district?.trim() ?? "",
    state: source.state?.trim() ?? "",
    pincode: source.pincode?.trim() ?? "",
    panNumber: source.panNumber?.trim() ?? "",
  };
}

/** Lines for PDF / HTML Bill To block (label + value per field). */
export function buildBillToLines(customer: InvoiceDocumentCustomer): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = [
    { label: "", value: "To," },
    { label: "", value: customer.companyName },
  ];

  for (const field of BILL_TO_ADDRESS_FIELDS) {
    lines.push({
      label: field.label,
      value: customer[field.key] || "",
    });
  }

  lines.push({
    label: "GST No:",
    value: customer.gstNumber,
  });

  return lines;
}
