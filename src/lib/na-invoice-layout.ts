import {
  amountToIndianWords,
  computeInvoiceTotals,
  formatInvoiceDecimal,
  formatInvoiceMoney,
  formatInvoiceTotalCents,
  lineAmountFromExtent,
} from "@/lib/invoice-calculations";
import { getNaInvoiceSubtypeConfig } from "@/lib/invoice-config";
import { PDF_A4_PORTRAIT, PDF_MARGIN } from "@/lib/company-document-pdf-shared";
import type { InvoiceDocumentData, InvoiceLineInput } from "@/lib/invoice-types";
import type { CellDef, RowInput } from "jspdf-autotable";

/** Printable width inside A4 with current side margins (mm). */
export const NA_INVOICE_CONTENT_WIDTH_MM =
  PDF_A4_PORTRAIT.width - PDF_MARGIN.left - PDF_MARGIN.right;

export const NA_INVOICE_COLUMN_COUNT = 11;

/** Column widths (mm) — scaled to fill content width. */
export const NA_INVOICE_COLUMN_WIDTHS_MM = {
  slNo: 8,
  farmersName: 22,
  hsn: 14,
  syNo: 12,
  newSyNo: 12,
  acres: 11,
  guntas: 11,
  affidavitId: 16,
  requestId: 16,
  totalCents: 14,
  amount: 24,
} as const;

export const NA_INVOICE_TABLE_COLUMN_STYLES: Record<
  number,
  { cellWidth: number; halign?: "left" | "center" | "right" }
> = {
  0: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.slNo, halign: "center" },
  1: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.farmersName,halign: "center" },
  2: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.hsn, halign: "center" },
  3: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.syNo, halign: "center" },
  4: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.newSyNo, halign: "center" },
  5: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.acres, halign: "center" },
  6: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.guntas, halign: "center" },
  7: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.affidavitId, halign: "center" },
  8: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.requestId, halign: "center" },
  9: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.totalCents, halign: "center" },
  10: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.amount,halign: "center" },
};

export function resolveNaRatePerAcre(document: InvoiceDocumentData): number {
  const config = getNaInvoiceSubtypeConfig(document.subType);
  return document.ratePerAcre > 0 ? document.ratePerAcre : config.defaultRatePerAcre;
}

export function formatRatePerAcreDisplay(rate: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rate);
  return `${formatted}/- per acre`;
}

export function naLineAmount(line: InvoiceLineInput, ratePerAcre: number): number {
  if (line.debitNote > 0) return line.debitNote;
  return lineAmountFromExtent(line.acres, line.gunta, ratePerAcre);
}

export function prepareNaInvoiceDocument(document: InvoiceDocumentData): InvoiceDocumentData {
  const rate = resolveNaRatePerAcre(document);
  const lines = document.lines.map((line) => ({
    ...line,
    amount: naLineAmount(line, rate),
  }));
  const totals = computeInvoiceTotals(lines);
  return {
    ...document,
    ratePerAcre: rate,
    lines,
    totals,
    totalAmountWords: amountToIndianWords(totals.grandTotal),
  };
}

export function resolveNaHsnSacCode(document: InvoiceDocumentData): string {
  return document.hsnSacCode?.trim() ?? "";
}

export function sumNaInvoiceExtentTotals(lines: InvoiceLineInput[]): {
  acres: number;
  guntas: number;
  totalCents: number;
} {
  return lines.reduce(
    (acc, line) => ({
      acres: acc.acres + (line.acres ?? 0),
      guntas: acc.guntas + (line.gunta ?? 0),
      totalCents: acc.totalCents + (line.totalCents ?? 0),
    }),
    { acres: 0, guntas: 0, totalCents: 0 },
  );
}

export function buildNaInvoiceTableBody(document: InvoiceDocumentData): string[][] {
  const prepared = prepareNaInvoiceDocument(document);
  const rate = prepared.ratePerAcre;
  const hsn = resolveNaHsnSacCode(prepared);

  return prepared.lines.map((line, index) => [
    String(index + 1),
    line.farmerName || line.description || "—",
    hsn || "—",
    line.surveyNo || "—",
    line.newSurveyNo || "—",
    line.acres != null ? formatInvoiceDecimal(line.acres) : "—",
    line.gunta != null ? formatInvoiceDecimal(line.gunta) : "—",
    line.affidavitId || "—",
    line.requestId || "—",
    line.totalCents != null ? formatInvoiceTotalCents(line.totalCents) : "—",
    formatInvoiceMoney(naLineAmount(line, rate)),
  ]);
}

/** Grouped multi-row header for jspdf-autotable. */
export function buildNaInvoiceTableHead(document: InvoiceDocumentData): RowInput[] {
  const config = getNaInvoiceSubtypeConfig(document.subType);
  const rate = resolveNaRatePerAcre(document);
  const rateLabel = formatRatePerAcreDisplay(rate);

  const mainRow: CellDef[] = [
    { content: "Sl No", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Farmers Name", rowSpan: 2, styles: {halign: "center", valign: "middle" } },
    { content: "HSN / SAAC code", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Syr No", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "New Syr No", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "NA Extent", colSpan: 2, styles: { halign: "center" } },
    { content: "Affidavit ID", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Request ID", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Total Cents", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    {
      content: config.amountColumnTitle,
      rowSpan: 1,
      styles: { halign: "center", fontSize: 9 },
    },
  ];

  const subRow: CellDef[] = [
    { content: "Acres", styles: { halign: "center", fontSize: 9 } },
    { content: "Guntas", styles: { halign: "center", fontSize: 9 } },
    { content: rateLabel, styles: { halign: "center", fontSize: 9, fontStyle: "normal" } },
  ];

  return [mainRow, subRow];
}

/** Totals rows appended as table foot (traditional invoice grid). */
export function buildNaInvoiceTableFoot(document: InvoiceDocumentData): RowInput[] {
  const prepared = prepareNaInvoiceDocument(document);
  const { totals } = prepared;
  const extent = sumNaInvoiceExtentTotals(prepared.lines);
  const labelStyle = {halign: "center" as const, fontStyle: "bold" as const, valign: "middle" as const };
  const valueStyle = {halign: "center" as const, fontStyle: "normal" as const, valign: "middle" as const };
  const totalCenterBold = {
    halign: "center" as const,
    fontStyle: "bold" as const,
    valign: "middle" as const,
  };

  return [
    [
      { content: "Total", colSpan: 5, styles: totalCenterBold },
      { content: formatInvoiceDecimal(extent.acres), styles: totalCenterBold },
      { content: formatInvoiceDecimal(extent.guntas), styles: totalCenterBold },
      { content: "", styles: totalCenterBold },
      { content: "", styles: totalCenterBold },
      { content: formatInvoiceTotalCents(extent.totalCents), styles: totalCenterBold },
      { content: "", styles: totalCenterBold },
    ],
    [
      { content: "", colSpan: 9 },
      { content: "Sub Total", styles: labelStyle },
      { content: formatInvoiceMoney(totals.subtotal), styles: valueStyle },
    ],
    [
      { content: "", colSpan: 9 },
      { content: "SGST @ 9% on", styles: labelStyle },
      { content: formatInvoiceMoney(totals.sgst), styles: valueStyle },
    ],
    [
      { content: "", colSpan: 9 },
      { content: "CGST @ 9% on", styles: labelStyle },
      { content: formatInvoiceMoney(totals.cgst), styles: valueStyle },
    ],
    [
      { content: "", colSpan: 9 },
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

export function naInvoiceAmountInWords(document: InvoiceDocumentData): string {
  const prepared = prepareNaInvoiceDocument(document);
  return (
    prepared.totalAmountWords?.trim() ||
    amountToIndianWords(prepared.totals.grandTotal)
  );
}
