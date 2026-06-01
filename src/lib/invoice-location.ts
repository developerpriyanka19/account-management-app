/** District / taluk / village / hobli on invoice documents. */
export type InvoiceLocationFields = {
  district: string;
  taluk: string;
  village: string;
  hobbli: string;
};

export type CustomerLocationSource = {
  district?: string | null;
  taluk?: string | null;
  village?: string | null;
  hobbli?: string | null;
};

function trimOrEmpty(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function locationFromCustomer(source: CustomerLocationSource): InvoiceLocationFields {
  return {
    district: trimOrEmpty(source.district),
    taluk: trimOrEmpty(source.taluk),
    village: trimOrEmpty(source.village),
    hobbli: trimOrEmpty(source.hobbli),
  };
}

export function hasInvoiceLocation(fields: InvoiceLocationFields): boolean {
  return Boolean(
    fields.district || fields.taluk || fields.village || fields.hobbli,
  );
}

export function invoiceLocationEntries(
  fields: InvoiceLocationFields,
): { label: string; value: string }[] {
  const entries: { label: string; value: string }[] = [];
  if (fields.district) entries.push({ label: "District", value: fields.district });
  if (fields.taluk) entries.push({ label: "Taluk", value: fields.taluk });
  if (fields.village) entries.push({ label: "Village", value: fields.village });
  if (fields.hobbli) entries.push({ label: "Hobli", value: fields.hobbli });
  return entries;
}
