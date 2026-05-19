import type { Invoice, InvoiceItem, GstCustomer } from "@prisma/client";
import type { InvoiceDocumentData, InvoiceLineInput } from "@/lib/invoice-types";
import { computeInvoiceTotals } from "@/lib/invoice-calculations";

export type InvoiceWithRelations = Invoice & {
  customer: GstCustomer;
  items: InvoiceItem[];
};

export function invoiceRecordToDocument(record: InvoiceWithRelations): InvoiceDocumentData {
  const lines: InvoiceLineInput[] = record.items.map((item) => ({
    farmerId: item.farmerId,
    village: item.village ?? "",
    surveyNo: item.surveyNo ?? "",
    naExtent: item.naExtent ?? "",
    acres: item.acres,
    gunta: item.gunta,
    totalCents: item.totalCents,
    affidavitId: item.affidavitId ?? "",
    requestId: item.requestId ?? "",
    amount: item.amount,
    description: item.description ?? "",
  }));

  return {
    id: record.id,
    invoiceType: record.invoiceType as "na" | "service",
    subType: record.subType,
    invoiceNumber: record.invoiceNumber,
    invoiceDate: record.invoiceDate,
    status: record.status,
    ratePerAcre: record.ratePerAcre ?? 0,
    notes: record.notes ?? "",
    customer: {
      id: record.customer.id,
      companyName: record.customer.companyName ?? `${record.customer.firstName} ${record.customer.lastName}`,
      companyAddress: record.customer.companyAddress ?? "",
      gstNumber: record.customer.gstNumber,
      state: record.customer.state ?? "",
      panNumber: record.customer.panNumber ?? "",
    },
    lines,
    totals: {
      subtotal: record.subtotal,
      sgst: record.sgst,
      cgst: record.cgst,
      grandTotal: record.grandTotal,
    },
  };
}

export function documentToTotals(data: Pick<InvoiceDocumentData, "lines">) {
  return computeInvoiceTotals(data.lines);
}
