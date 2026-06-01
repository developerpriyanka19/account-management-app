import type { Invoice, InvoiceItem, GstCustomer } from "@prisma/client";
import { gstCustomerToInvoiceCustomer } from "@/lib/invoice-customer-format";
import type { InvoiceDocumentData, InvoiceLineInput } from "@/lib/invoice-types";
import {
  computeInvoiceTotals,
  invoiceLineTaxableAmount,
  toFiniteNumber,
} from "@/lib/invoice-calculations";

export type InvoiceWithRelations = Invoice & {
  customer: GstCustomer;
  items: InvoiceItem[];
};

export function invoiceRecordToDocument(record: InvoiceWithRelations): InvoiceDocumentData {
  const lines: InvoiceLineInput[] = record.items.map((item) => ({
    farmerId: item.farmerId,
    farmerName: item.description ?? "",
    district: (item as { district?: string | null }).district ?? "",
    taluk: (item as { taluk?: string | null }).taluk ?? "",
    village: item.village ?? "",
    hobbli: (item as { hobbli?: string | null }).hobbli ?? "",
    surveyNo: item.surveyNo ?? "",
    naExtent: item.naExtent ?? "",
    acres: item.acres,
    gunta: item.gunta,
    totalCents: item.totalCents,
    affidavitId: item.affidavitId ?? "",
    requestId: item.requestId ?? "",
    debitNote: toFiniteNumber((item as { debitNote?: number | null }).debitNote ?? item.amount),
    remark: (item as { remark?: string | null }).remark ?? "",
    amount: toFiniteNumber(item.amount),
    description: item.description ?? "",
  }));

  const ratePerAcre = toFiniteNumber(record.ratePerAcre);
  const category = record.invoiceType as "na" | "service";
  const normalizedLines =
    category === "service"
      ? lines.map((line) => {
          const acres = toFiniteNumber(line.acres);
          const amount =
            acres > 0 && ratePerAcre > 0
              ? Math.round(acres * ratePerAcre * 100) / 100
              : invoiceLineTaxableAmount(line);
          return { ...line, amount };
        })
      : lines;

  const totals = computeInvoiceTotals(normalizedLines);

  return {
    id: record.id,
    invoiceType: record.invoiceType as "na" | "service",
    subType: record.subType,
    invoiceNumber: record.invoiceNumber,
    invoiceDate: record.invoiceDate,
    district: (record as { district?: string | null }).district ?? "",
    taluk: (record as { taluk?: string | null }).taluk ?? "",
    village: (record as { village?: string | null }).village ?? "",
    hobbli: (record as { hobbli?: string | null }).hobbli ?? "",
    status: record.status,
    ratePerAcre: record.ratePerAcre ?? 0,
    notes: record.notes ?? "",
    totalAmountWords: (record as { totalAmountWords?: string | null }).totalAmountWords ?? undefined,
    pdfUrl: (record as { pdfUrl?: string | null }).pdfUrl ?? undefined,
    customer: gstCustomerToInvoiceCustomer({
      id: record.customer.id,
      firstName: record.customer.firstName,
      lastName: record.customer.lastName,
      gstNumber: record.customer.gstNumber,
      companyName: record.customer.companyName,
      buildingNumber: record.customer.buildingNumber,
      street: record.customer.street,
      locality: record.customer.locality,
      village: record.customer.village,
      district: record.customer.district,
      pincode: record.customer.pincode,
      state: record.customer.state,
      panNumber: record.customer.panNumber,
    }),
    lines: normalizedLines,
    totals,
  };
}

export function documentToTotals(data: Pick<InvoiceDocumentData, "lines">) {
  return computeInvoiceTotals(data.lines);
}
