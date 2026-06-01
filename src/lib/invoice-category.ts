/** Database invoice category (NA vs Service). */
export type InvoiceCategoryCode = "NA" | "SERVICE";

export type InvoiceTypeCode = "na" | "service";

export function invoiceCategoryFromType(type: InvoiceTypeCode): InvoiceCategoryCode {
  return type === "service" ? "SERVICE" : "NA";
}

export function invoiceTypeFromCategory(category: InvoiceCategoryCode): InvoiceTypeCode {
  return category === "SERVICE" ? "service" : "na";
}

export function parseInvoiceCategoryParam(
  value: string | null | undefined,
): InvoiceCategoryCode | null {
  const v = value?.trim().toUpperCase();
  if (v === "NA") return "NA";
  if (v === "SERVICE") return "SERVICE";
  return null;
}

export function invoiceListViewPath(category: InvoiceCategoryCode, id: number): string {
  return category === "NA" ? `/invoice/na/${id}` : `/invoice/${id}`;
}

export function invoiceListEditPath(category: InvoiceCategoryCode, id: number): string {
  return category === "NA"
    ? `/invoice/na/${id}/edit`
    : `/invoice/service/create?edit=${id}`;
}

export function invoiceListDownloadPath(category: InvoiceCategoryCode, id: number): string {
  return category === "NA"
    ? `/invoice/na/${id}?download=1`
    : `/invoice/${id}?download=1`;
}
