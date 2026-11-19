/** Hobli / village / taluk / district / state on invoice documents. */
export type InvoiceLocationFields = {
  hobbli: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
};

export type CustomerLocationSource = {
  hobbli?: string | null;
  village?: string | null;
  taluk?: string | null;
  district?: string | null;
  state?: string | null;
};

function trimOrEmpty(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function locationFromCustomer(source: CustomerLocationSource): InvoiceLocationFields {
  return {
    hobbli: trimOrEmpty(source.hobbli),
    village: trimOrEmpty(source.village),
    taluk: trimOrEmpty(source.taluk),
    district: trimOrEmpty(source.district),
    state: trimOrEmpty(source.state),
  };
}

export function hasInvoiceLocation(fields: InvoiceLocationFields): boolean {
  return Boolean(
    fields.hobbli || fields.village || fields.taluk || fields.district || fields.state,
  );
}

/** Display order for PDFs: Village, Hobli, Taluk, District, State. */
export function invoiceLocationEntries(
  fields: InvoiceLocationFields,
): { label: string; value: string }[] {
  if (!hasInvoiceLocation(fields)) return [];
  // Always include State alongside the other location fields when any value exists.
  return [
    { label: "Village", value: fields.village || "—" },
    { label: "Hobli", value: fields.hobbli || "—" },
    { label: "Taluk", value: fields.taluk || "—" },
    { label: "District", value: fields.district || "—" },
    { label: "State", value: fields.state || "—" },
  ];
}

/**
 * Compact single-row location line for PDFs / previews:
 * `Village: X     Hobli: Y     Taluk: Z     District: D     State: S`
 */
export function formatInvoiceLocationLine(
  fields: InvoiceLocationFields,
  separator = "     ",
): string {
  return invoiceLocationEntries(fields)
    .map(({ label, value }) => `${label}: ${value}`)
    .join(separator);
}

export const INVOICE_LOCATION_FIELD_ORDER = [
  { key: "village" as const, label: "Village" },
  { key: "hobbli" as const, label: "Hobli" },
  { key: "taluk" as const, label: "Taluk" },
  { key: "district" as const, label: "District" },
  { key: "state" as const, label: "State" },
] as const;

/** Max farmer/item rows per PDF page before continuing. */
export { PDF_FARMER_ROWS_PER_PAGE as DOCUMENT_PDF_ROWS_PER_PAGE } from "@/lib/pdf-table-rows";

