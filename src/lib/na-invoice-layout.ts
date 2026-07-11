import {
  amountToIndianWords,
  computeInvoiceTotals,
  formatInvoiceDecimal,
  formatInvoiceMoney,
  formatInvoiceTotalCents,
  lineAmountFromExtent,
} from "@/lib/invoice-calculations";
import { getNaInvoiceSubtypeConfig } from "@/lib/invoice-config";
import type { InvoiceDocumentData, InvoiceLineInput } from "@/lib/invoice-types";
import type { CellDef, RowInput } from "jspdf-autotable";

/** Printable width inside A4 with 10mm side margins (mm). */
export const NA_INVOICE_CONTENT_WIDTH_MM = 190;

export const NA_INVOICE_COLUMN_COUNT = 10;

/** Column widths (mm) — sum ≈ 168, table stretches to CONTENT_WIDTH. */
export const NA_INVOICE_COLUMN_WIDTHS_MM = {
  slNo: 10,
  farmersName: 25,
  hsn: 18,
  syNo: 14,
  acres: 12,
  guntas: 12,
  affidavitId: 18,
  requestId: 18,
  totalCents: 16,
  amount: 25,
} as const;

export const NA_INVOICE_TABLE_COLUMN_STYLES: Record<
  number,
  { cellWidth: number; halign?: "left" | "center" | "right" }
> = {
  0: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.slNo, halign: "center" },
  1: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.farmersName },
  2: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.hsn, halign: "center" },
  3: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.syNo },
  4: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.acres, halign: "center" },
  5: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.guntas, halign: "center" },
  6: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.affidavitId },
  7: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.requestId },
  8: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.totalCents, halign: "right" },
  9: { cellWidth: NA_INVOICE_COLUMN_WIDTHS_MM.amount, halign: "right" },
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

export function buildNaInvoiceTableBody(document: InvoiceDocumentData): string[][] {
  const prepared = prepareNaInvoiceDocument(document);
  const rate = prepared.ratePerAcre;
  const hsn = resolveNaHsnSacCode(prepared);

  return prepared.lines.map((line, index) => [
    String(index + 1),
    line.farmerName || line.description || "—",
    hsn || "—",
    line.surveyNo || "—",
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

  const titleRow: CellDef[] = [
    {
      content: "NA INVOICE",
      colSpan: NA_INVOICE_COLUMN_COUNT,
      styles: { halign: "center", fontSize: 16, fontStyle: "bold", fillColor: [255, 255, 255] },
    },
  ];

  const mainRow: CellDef[] = [
    { content: "Sl No", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Farmers Name", rowSpan: 2, styles: { valign: "middle" } },
    { content: "HSN / SAAC code", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
    { content: "Sy No", rowSpan: 2, styles: { valign: "middle" } },
    { content: "NA XTENT", colSpan: 2, styles: { halign: "center" } },
    { content: "Affidavit ID", rowSpan: 2, styles: { valign: "middle" } },
    { content: "Request ID", rowSpan: 2, styles: { valign: "middle" } },
    { content: "Total Cents", rowSpan: 2, styles: { halign: "right", valign: "middle" } },
    {
      content: config.amountColumnTitle,
      rowSpan: 1,
      styles: { halign: "center", fontSize: 7 },
    },
  ];

  const subRow: CellDef[] = [
    { content: "Acres", styles: { halign: "center", fontSize: 7 } },
    { content: "Guntas", styles: { halign: "center", fontSize: 7 } },
    { content: rateLabel, styles: { halign: "center", fontSize: 7, fontStyle: "normal" } },
  ];

  return [titleRow, mainRow, subRow];
}

/** Totals rows appended as table foot (traditional invoice grid). */
export function buildNaInvoiceTableFoot(document: InvoiceDocumentData): RowInput[] {
  const prepared = prepareNaInvoiceDocument(document);
  const { totals } = prepared;
  const labelStyle = { halign: "right" as const, fontStyle: "bold" as const };
  const valueStyle = { halign: "right" as const, fontStyle: "normal" as const };

  return [
    [
      { content: "", colSpan: 8 },
      { content: "Sub Total", styles: labelStyle },
      { content: formatInvoiceMoney(totals.subtotal), styles: valueStyle },
    ],
    [
      { content: "", colSpan: 8 },
      { content: "SGST @ 9% on", styles: labelStyle },
      { content: formatInvoiceMoney(totals.sgst), styles: valueStyle },
    ],
    [
      { content: "", colSpan: 8 },
      { content: "CGST @ 9% on", styles: labelStyle },
      { content: formatInvoiceMoney(totals.cgst), styles: valueStyle },
    ],
    [
      { content: "", colSpan: 8 },
      {
        content: "Grand Total",
        styles: { ...labelStyle, fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      },
      {
        content: formatInvoiceMoney(totals.grandTotal),
        styles: { ...valueStyle, fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: "bold" },
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
