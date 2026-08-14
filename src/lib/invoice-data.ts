import type { Invoice, InvoiceItem, GstCustomer } from "@prisma/client";
import { snapshotFromRecord } from "@/lib/bank-details-types";
import { gstCustomerToInvoiceCustomer } from "@/lib/invoice-customer-format";
import { normalizeNaSubtype, normalizeServiceSubtype } from "@/lib/invoice-config";
import type { InvoiceDocumentData, InvoiceLineInput } from "@/lib/invoice-types";
import {
  computeInvoiceTotals,
  invoiceLineTaxableAmount,
  lineAmountFromExtent,
  toFiniteNumber,
  toOptionalNumber,
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
            toOptionalNumber(line.amount) ??
            (lineAmountFromExtent(line.acres, line.gunta, ratePerAcre) || null);
          return { ...line, amount };
        })
      : lines;

  const totals = computeInvoiceTotals(normalizedLines);
  const invoiceType = record.invoiceType as "na" | "service";
  const subType =
    invoiceType === "na"
      ? normalizeNaSubtype(record.subType)
      : normalizeServiceSubtype(record.subType);

  return {
    id: record.id,
    invoiceType,
    subType,
    invoiceNumber: record.invoiceNumber,
    invoiceDate: record.invoiceDate,
    poNumber: (record as { poNumber?: string | null }).poNumber ?? "",
    poDate: (record as { poDate?: string | null }).poDate ?? "",
    district: (record as { district?: string | null }).district ?? "",
    taluk: (record as { taluk?: string | null }).taluk ?? "",
    village: (record as { village?: string | null }).village ?? "",
    hobbli: (record as { hobbli?: string | null }).hobbli ?? "",
    state: (record as { state?: string | null }).state ?? "",
    status: record.status,
    ratePerAcre: record.ratePerAcre ?? 0,
    hsnSacCode: (record as { hsnSacCode?: string | null }).hsnSacCode ?? "",
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
    bank: snapshotFromRecord(record),
  };
}

export function documentToTotals(data: Pick<InvoiceDocumentData, "lines">) {
  return computeInvoiceTotals(data.lines);
}
