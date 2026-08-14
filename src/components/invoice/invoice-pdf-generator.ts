"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  INVOICE_AUTOTABLE_LAYOUT,
  INVOICE_CONTENT_W,
  INVOICE_PAGE_W,
  INVOICE_TABLE_HEAD_STYLES,
  INVOICE_TABLE_MARGINS,
  INVOICE_TABLE_STYLES,
  invoiceClosingBlockHeight,
  invoiceTextBlockHeight,
  loadInvoiceLogoDataUrl,
  renderInvoiceAmountInWords,
  renderInvoiceContinuationHeader,
  renderInvoiceCustomerSection,
  renderInvoiceFooter,
  renderInvoiceHeader,
} from "@/lib/invoice-pdf-shared";
import {
  buildNaInvoiceTableBody,
  buildNaInvoiceTableFoot,
  buildNaInvoiceTableHead,
  NA_INVOICE_TABLE_COLUMN_STYLES,
  naInvoiceAmountInWords,
  prepareNaInvoiceDocument,
} from "@/lib/na-invoice-layout";
import {
  buildServiceInvoiceTableBody,
  buildServiceInvoiceTableFoot,
  buildServiceInvoiceTableHead,
  getServiceInvoiceTableColumnStyles,
  prepareServiceInvoiceDocument,
  serviceInvoiceAmountInWords,
} from "@/lib/service-invoice-layout";
import {
  ensureVerticalSpace,
  PDF_MARGIN,
} from "@/lib/company-document-pdf-shared";
import { DOCUMENT_PDF_ROWS_PER_PAGE } from "@/lib/invoice-location";
import { chunkPdfRows } from "@/lib/pdf-table-rows";
import { INVOICE_LOGO_PDF_MM } from "@/lib/invoice-config";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

function sumColumnWidths(
  columnStyles: Record<number, { cellWidth: number }>,
): number {
  return Object.values(columnStyles).reduce((sum, col) => sum + (col.cellWidth || 0), 0);
}

/** Scale relative column weights to exactly fill the shared invoice content width. */
function scaleColumnStylesToWidth<T extends { cellWidth: number; halign?: "left" | "center" | "right" }>(
  columnStyles: Record<number, T>,
  targetWidth: number,
): Record<number, T> {
  const keys = Object.keys(columnStyles)
    .map(Number)
    .sort((a, b) => a - b);
  const weightSum = sumColumnWidths(columnStyles);
  if (weightSum <= 0) return columnStyles;

  const scaled: Record<number, T> = {};
  let used = 0;
  keys.forEach((index, i) => {
    const col = columnStyles[index]!;
    const isLast = i === keys.length - 1;
    const cellWidth = isLast
      ? Math.max(targetWidth - used, 4)
      : Math.floor(((col.cellWidth / weightSum) * targetWidth) * 10) / 10;
    used += cellWidth;
    scaled[index] = { ...col, cellWidth };
  });
  return scaled;
}

function drawPagedInvoiceTable(
  pdf: JsPdfWithAutoTable,
  prepared: InvoiceDocumentData,
  logoDataUrl: string,
  startY: number,
  head: ReturnType<typeof buildNaInvoiceTableHead>,
  body: string[][],
  foot: ReturnType<typeof buildNaInvoiceTableFoot>,
  columnStyles: Record<number, { cellWidth: number; halign?: "left" | "center" | "right" }>,
): number {
  const tableWidth = INVOICE_CONTENT_W;
  const margin = INVOICE_TABLE_MARGINS;
  const scaledColumns = scaleColumnStylesToWidth(columnStyles, tableWidth);
  const chunks = chunkPdfRows(body, DOCUMENT_PDF_ROWS_PER_PAGE);
  let y = startY;

  chunks.forEach((chunk, index) => {
    const isLast = index === chunks.length - 1;
    if (index > 0) {
      pdf.addPage("a4", "portrait");
      renderInvoiceContinuationHeader(pdf, logoDataUrl, prepared);
      y = PDF_MARGIN.top + INVOICE_LOGO_PDF_MM.repeatHeaderHeight;
    }

    autoTable(pdf, {
      startY: y,
      margin,
      tableWidth,
      head,
      body: chunk,
      foot: isLast ? foot : undefined,
      styles: INVOICE_TABLE_STYLES,
      headStyles: INVOICE_TABLE_HEAD_STYLES,
      footStyles: {
        fontSize: 10,
        fillColor: [255, 255, 255] as [number, number, number],
        textColor: [0, 0, 0] as [number, number, number],
        fontStyle: "normal" as const,
      },
      bodyStyles: {
        lineWidth: 0.1,
        fontSize: 10,
        fontStyle: "normal" as const,
        minCellHeight: 7,
      },
      columnStyles: scaledColumns,
      ...INVOICE_AUTOTABLE_LAYOUT,
      showFoot: isLast ? "lastPage" : "never",
      didDrawPage: (data: { pageNumber: number }) => {
        if (data.pageNumber > 1 && index === 0) {
          renderInvoiceContinuationHeader(pdf, logoDataUrl, prepared);
        }
      },
    });

    y = (pdf.lastAutoTable?.finalY ?? y) + 4;
  });

  return y;
}

async function generateNaInvoicePdf(document: InvoiceDocumentData): Promise<jsPDF> {
  const prepared = prepareNaInvoiceDocument(document);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as JsPdfWithAutoTable;

  const logoDataUrl = await loadInvoiceLogoDataUrl();
  let y = await renderInvoiceHeader(pdf, prepared, logoDataUrl, PDF_MARGIN.top);
  y = renderInvoiceCustomerSection(pdf, prepared, y);

  y = drawPagedInvoiceTable(
    pdf,
    prepared,
    logoDataUrl,
    y,
    buildNaInvoiceTableHead(prepared),
    buildNaInvoiceTableBody(prepared),
    buildNaInvoiceTableFoot(prepared),
    NA_INVOICE_TABLE_COLUMN_STYLES,
  );

  const words = naInvoiceAmountInWords(prepared);
  const wordsH = invoiceTextBlockHeight(pdf, words, INVOICE_CONTENT_W);
  const grandBlockH = 12;
  const totalAfterTable = 4 + grandBlockH + wordsH + invoiceClosingBlockHeight(prepared.bank);

  y = ensureVerticalSpace(pdf, y, totalAfterTable);
  const wordsEndY = renderInvoiceAmountInWords(pdf, words, y, {
    grandTotalLabel: "Grand Total",
    grandTotalDisplay: `Rs ${new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(prepared.totals.grandTotal)}`,
  });
  renderInvoiceFooter(pdf, wordsEndY, prepared.bank);
  return pdf;
}

async function generateServiceInvoicePdf(document: InvoiceDocumentData): Promise<jsPDF> {
  const prepared = prepareServiceInvoiceDocument(document);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as JsPdfWithAutoTable;

  const logoDataUrl = await loadInvoiceLogoDataUrl();
  let y = await renderInvoiceHeader(pdf, prepared, logoDataUrl, PDF_MARGIN.top);
  y = renderInvoiceCustomerSection(pdf, prepared, y);

  y = drawPagedInvoiceTable(
    pdf,
    prepared,
    logoDataUrl,
    y,
    buildServiceInvoiceTableHead(prepared),
    buildServiceInvoiceTableBody(prepared),
    buildServiceInvoiceTableFoot(prepared),
    getServiceInvoiceTableColumnStyles(),
  );

  const words = serviceInvoiceAmountInWords(prepared);
  const wordsH = invoiceTextBlockHeight(pdf, words, INVOICE_CONTENT_W);
  const grandBlockH = 12;
  const totalAfterTable = 4 + grandBlockH + wordsH + invoiceClosingBlockHeight(prepared.bank);

  y = ensureVerticalSpace(pdf, y, totalAfterTable);
  const wordsEndY = renderInvoiceAmountInWords(pdf, words, y, {
    grandTotalLabel: "Grand Total",
    grandTotalDisplay: `Rs ${new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(prepared.totals.grandTotal)}`,
  });
  renderInvoiceFooter(pdf, wordsEndY, prepared.bank);
  return pdf;
}

async function buildInvoicePdf(document: InvoiceDocumentData): Promise<jsPDF> {
  if (document.invoiceType === "na") {
    return generateNaInvoicePdf(document);
  }
  return generateServiceInvoicePdf(document);
}

export async function getInvoicePdfBlob(document: InvoiceDocumentData): Promise<Blob> {
  const pdf = await buildInvoicePdf(document);
  return pdf.output("blob");
}

export async function generateInvoicePdf(document: InvoiceDocumentData) {
  const pdf = await buildInvoicePdf(document);
  pdf.save(`${document.invoiceNumber}.pdf`);
}

export async function printInvoicePdf(document: InvoiceDocumentData) {
  const { openPdfBlobInNewTab } = await import("@/lib/pdf-print");
  const blob = await getInvoicePdfBlob(document);
  openPdfBlobInNewTab(blob, `${document.invoiceNumber}.pdf`);
}

export {
  formatInvoiceDateDisplay,
  loadInvoiceLogoDataUrl,
  renderInvoiceCustomerSection,
  renderInvoiceFooter,
  renderInvoiceHeader,
} from "@/lib/invoice-pdf-shared";

export {
  buildServiceInvoiceTableBody,
  buildServiceInvoiceTableFoot,
  buildServiceInvoiceTableHead,
  calculateServiceInvoiceTotals,
  computeServiceLineAmounts,
  prepareServiceInvoiceDocument,
} from "@/lib/service-invoice-layout";
