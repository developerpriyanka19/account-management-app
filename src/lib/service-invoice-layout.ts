import { roundToThreeDecimals } from "@/lib/customer-computed-totals";
import {
  amountToIndianWords,
  computeInvoiceTotals,
  formatInvoiceDecimal,
  formatInvoiceMoney,
  formatInvoiceTotalCents,
  invoiceLineTaxableAmount,
  lineAmountFromExtent,
  lineExtentAcres,
  toFiniteNumber,
  type InvoiceTotals,
} from "@/lib/invoice-calculations";
import { getServiceInvoiceSubtypeConfig } from "@/lib/invoice-config";
import { NA_INVOICE_CONTENT_WIDTH_MM } from "@/lib/na-invoice-layout";
import type { InvoiceDocumentData, InvoiceLineInput } from "@/lib/invoice-types";
import type { CellDef, RowInput } from "jspdf-autotable";

export const SERVICE_INVOICE_COLUMN_COUNT = 8;

export const SERVICE_INVOICE_COLUMN_WIDTHS_MM = {
  slNo: 10,
  farmersName: 28,
  hsn: 16,
  syNo: 14,
  acres: 12,
  guntas: 12,
  totalCents: 16,
  service: 82,
} as const;

export const SERVICE_INVOICE_TABLE_COLUMN_STYLES: Record<
  number,
  { cellWidth: number; halign?: "left" | "center" | "right" }
> = {
  0: { cellWidth: SERVICE_INVOICE_COLUMN_WIDTHS_MM.slNo, halign: "center" },
  1: { cellWidth: SERVICE_INVOICE_COLUMN_WIDTHS_MM.farmersName },
  2: { cellWidth: SERVICE_INVOICE_COLUMN_WIDTHS_MM.hsn, halign: "center" },
  3: { cellWidth: SERVICE_INVOICE_COLUMN_WIDTHS_MM.syNo },
  4: { cellWidth: SERVICE_INVOICE_COLUMN_WIDTHS_MM.acres, halign: "center" },
  5: { cellWidth: SERVICE_INVOICE_COLUMN_WIDTHS_MM.guntas, halign: "center" },
  6: { cellWidth: SERVICE_INVOICE_COLUMN_WIDTHS_MM.totalCents, halign: "right" },
  7: { cellWidth: SERVICE_INVOICE_COLUMN_WIDTHS_MM.service, halign: "right" },
};

const SERVICE_TOTALS_LABEL_COL_SPAN = 6;

/** Total Cents = decimal acres × 100 (3 decimal places). */
export function lineTotalCentsFromExtent(
  acres: number | null | undefined,
  gunta: number | null | undefined,
): number {
  const extent = lineExtentAcres(acres, gunta);
  if (extent == null || extent <= 0) return 0;
  return roundToThreeDecimals(extent * 100);
}

export function formatServiceRatePerAcreDisplay(rate: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rate);
  return `₹${formatted}/- Per Acre`;
}

export function resolveServiceRatePerAcre(document: InvoiceDocumentData): number {
  const config = getServiceInvoiceSubtypeConfig(document.subType);
  return document.ratePerAcre > 0 ? document.ratePerAcre : config.ratePerAcre;
}

export function resolveServiceHsnSacCode(document: InvoiceDocumentData): string {
  return document.hsnSacCode?.trim() ?? "";
}

export function serviceLineAmount(line: InvoiceLineInput, _ratePerAcre: number): number {
  return invoiceLineTaxableAmount(line);
}

export function computeServiceLineAmounts(
  lines: InvoiceLineInput[],
  ratePerAcre: number,
  subType: string,
): InvoiceLineInput[] {
  const config = getServiceInvoiceSubtypeConfig(subType);
  const rate = toFiniteNumber(ratePerAcre) || config.ratePerAcre;

  return lines.map((line) => {
    const amount = lineAmountFromExtent(line.acres, line.gunta, rate);
    return {
      ...line,
      description: config.serviceName,
      totalCents: lineTotalCentsFromExtent(line.acres, line.gunta),
      amount: amount > 0 ? amount : 0,
    };
  });
}

export function calculateServiceInvoiceTotals(lines: InvoiceLineInput[]): InvoiceTotals {
  return computeInvoiceTotals(lines);
}

export function prepareServiceInvoiceDocument(document: InvoiceDocumentData): InvoiceDocumentData {
  const rate = resolveServiceRatePerAcre(document);
  const lines = computeServiceLineAmounts(document.lines, rate, document.subType);
  const totals = calculateServiceInvoiceTotals(lines);
  return {
    ...document,
    ratePerAcre: rate,
    lines,
    totals,
    totalAmountWords: amountToIndianWords(totals.grandTotal),
  };
}

export function serviceInvoiceAmountInWords(document: InvoiceDocumentData): string {
  const prepared = prepareServiceInvoiceDocument(document);
  return prepared.totalAmountWords?.trim() || amountToIndianWords(prepared.totals.grandTotal);
}

export function buildServiceInvoiceTableHead(document: InvoiceDocumentData): RowInput[] {
  const prepared = prepareServiceInvoiceDocument(document);
  const config = getServiceInvoiceSubtypeConfig(prepared.subType);
  const rateLabel = formatServiceRatePerAcreDisplay(prepared.ratePerAcre);

  const mainRow: CellDef[] = [
    { content: "SL NO", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Name Of Farmers", rowSpan: 2, styles: { valign: "middle" } },
    { content: "HSN/SAC Code", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Sy No", rowSpan: 2, styles: { valign: "middle" } },
    { content: "Acres", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Guntas", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Total Cents", rowSpan: 2, styles: { halign: "right", valign: "middle" } },
    {
      content: config.serviceName,
      styles: { halign: "center", fontSize: 7, fontStyle: "bold" },
    },
  ];

  const subRow: CellDef[] = [
    {
      content: rateLabel,
      styles: { halign: "center", fontSize: 7, fontStyle: "normal" },
    },
  ];

  return [mainRow, subRow];
}

export function buildServiceInvoiceTableBody(document: InvoiceDocumentData): string[][] {
  const prepared = prepareServiceInvoiceDocument(document);
  const hsn = resolveServiceHsnSacCode(prepared);
  const rate = prepared.ratePerAcre;

  return prepared.lines.map((line, index) => [
    String(index + 1),
    line.farmerName || line.description || "—",
    hsn || "—",
    line.surveyNo || "—",
    line.acres != null ? formatInvoiceDecimal(line.acres) : "—",
    line.gunta != null ? formatInvoiceDecimal(line.gunta) : "—",
    line.totalCents != null ? formatInvoiceTotalCents(line.totalCents) : "—",
    formatInvoiceMoney(serviceLineAmount(line, rate)),
  ]);
}

export function buildServiceInvoiceTableFoot(document: InvoiceDocumentData): RowInput[] {
  const prepared = prepareServiceInvoiceDocument(document);
  const { totals } = prepared;
  const labelStyle = { halign: "right" as const, fontStyle: "bold" as const };
  const valueStyle = { halign: "right" as const, fontStyle: "normal" as const };

  return [
    [
      { content: "", colSpan: SERVICE_TOTALS_LABEL_COL_SPAN },
      { content: "Sub Total", styles: labelStyle },
      { content: formatInvoiceMoney(totals.subtotal), styles: valueStyle },
    ],
    [
      { content: "", colSpan: SERVICE_TOTALS_LABEL_COL_SPAN },
      { content: "SGST @ 9% on", styles: labelStyle },
      { content: formatInvoiceMoney(totals.sgst), styles: valueStyle },
    ],
    [
      { content: "", colSpan: SERVICE_TOTALS_LABEL_COL_SPAN },
      { content: "CGST @ 9% on", styles: labelStyle },
      { content: formatInvoiceMoney(totals.cgst), styles: valueStyle },
    ],
    [
      { content: "", colSpan: SERVICE_TOTALS_LABEL_COL_SPAN },
      {
        content: "Grand Total",
        styles: { ...labelStyle, fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      },
      {
        content: formatInvoiceMoney(totals.grandTotal),
        styles: {
          ...valueStyle,
          fillColor: [30, 30, 30],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      },
    ],
  ];
}

export function getServiceInvoiceTableColumnStyles(): Record<
  number,
  { cellWidth: number; halign?: "left" | "center" | "right" }
> {
  return SERVICE_INVOICE_TABLE_COLUMN_STYLES;
}

export { NA_INVOICE_CONTENT_WIDTH_MM as SERVICE_INVOICE_CONTENT_WIDTH_MM };
