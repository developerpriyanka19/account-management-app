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
  taluk?: string | null;
  hobbli?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  companyAddress?: string | null;
  panNumber?: string | null;
};

/** Bill To field keys (legacy) — prefer `formatNaturalCustomerAddress` for display. */
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

/**
 * Quotation-style natural address lines (no Road:/Street: labels).
 * Example:
 *   Sy. No. 76/7
 *   Challakere Taluk
 *   Parashurampura Hobli
 *   Channammanagathihalli
 *   Chitradurga
 *   Karnataka - 577538
 */
export function formatNaturalCustomerAddressLines(
  customer: Pick<
    InvoiceDocumentCustomer,
    | "buildingNumber"
    | "street"
    | "locality"
    | "village"
    | "district"
    | "state"
    | "pincode"
  > & { companyAddress?: string | null; taluk?: string | null; hobbli?: string | null },
): string[] {
  const companyAddress = customer.companyAddress?.trim();
  if (companyAddress) {
    return companyAddress.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  }

  const lines: string[] = [];
  const line1 = [customer.buildingNumber, customer.street]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
  if (line1) lines.push(line1);

  if (customer.locality?.trim()) lines.push(customer.locality.trim());

  const taluk = customer.taluk?.trim();
  if (taluk) lines.push(/taluk/i.test(taluk) ? taluk : `${taluk} Taluk`);

  const hobbli = customer.hobbli?.trim();
  if (hobbli) lines.push(/hobbli|hobli/i.test(hobbli) ? hobbli : `${hobbli} Hobli`);

  if (customer.village?.trim()) lines.push(customer.village.trim());
  if (customer.district?.trim()) lines.push(customer.district.trim());

  const state = customer.state?.trim() ?? "";
  const pin = customer.pincode?.trim() ?? "";
  if (state && pin) lines.push(`${state} - ${pin}`);
  else if (state) lines.push(state);
  else if (pin) lines.push(pin);

  return lines;
}

/** Lines for PDF / HTML Bill To block — natural address, no field labels. */
export function buildBillToLines(customer: InvoiceDocumentCustomer): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = [
    { label: "", value: "To," },
    { label: "", value: customer.companyName },
  ];

  for (const line of formatNaturalCustomerAddressLines(customer)) {
    lines.push({ label: "", value: line });
  }

  if (customer.gstNumber?.trim()) {
    lines.push({ label: "", value: `GST: ${customer.gstNumber.trim()}` });
  }

  return lines;
}
