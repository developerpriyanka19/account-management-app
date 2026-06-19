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

/** Display order: Hobli, Village, Taluk, District, State. */
export function invoiceLocationEntries(
  fields: InvoiceLocationFields,
): { label: string; value: string }[] {
  const entries: { label: string; value: string }[] = [];
  if (fields.hobbli) entries.push({ label: "Hobli", value: fields.hobbli });
  if (fields.village) entries.push({ label: "Village", value: fields.village });
  if (fields.taluk) entries.push({ label: "Taluk", value: fields.taluk });
  if (fields.district) entries.push({ label: "District", value: fields.district });
  if (fields.state) entries.push({ label: "State", value: fields.state });
  return entries;
}

export const INVOICE_LOCATION_FIELD_ORDER = [
  { key: "hobbli" as const, label: "Hobli" },
  { key: "village" as const, label: "Village" },
  { key: "taluk" as const, label: "Taluk" },
  { key: "district" as const, label: "District" },
  { key: "state" as const, label: "State" },
];
