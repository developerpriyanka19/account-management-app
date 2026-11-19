"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  INVOICE_CONTENT_W,
  INVOICE_TABLE_MARGINS,
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
  PDF_A4_PORTRAIT,
  PDF_MARGIN,
} from "@/lib/company-document-pdf-shared";
import {
  buildPdfColumnStyles,
  drawPagedPdfTable,
  PDF_TABLE_GROUPED_HEAD_HEIGHT_MM,
  PDF_TABLE_MIN_CELL_HEIGHT,
  withCenteredPdfColumns,
  type JsPdfWithAutoTable,
} from "@/lib/pdf-table-shared";
import { INVOICE_LOGO_PDF_MM } from "@/lib/invoice-config";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

/** Total / Subtotal / SGST / CGST / Grand Total foot ≈ 5 body rows. */
const INVOICE_FOOT_RESERVE_ROWS = 5;

function drawPagedInvoiceTable(
  pdf: JsPdfWithAutoTable,
  prepared: InvoiceDocumentData,
  logoDataUrl: string,
  startY: number,
  head: ReturnType<typeof buildNaInvoiceTableHead>,
  body: string[][],
  foot: ReturnType<typeof buildNaInvoiceTableFoot>,
  columnStyles: Record<number, { cellWidth: number;halign?: "left" | "center" | "right" }>,
): number {
  const tableWidth = INVOICE_CONTENT_W;
  const widths = Object.keys(columnStyles)
    .map(Number)
    .sort((a, b) => a - b)
    .map((i) => columnStyles[i]!.cellWidth);
  const centeredColumns = withCenteredPdfColumns(
    buildPdfColumnStyles(widths, tableWidth),
  );
  // Absolute Y from page top — must match autoTable margin.top / header clearance.
  const continuationStartY = INVOICE_LOGO_PDF_MM.repeatHeaderHeight;

  return drawPagedPdfTable(pdf, autoTable as never, {
    startY,
    tableWidth,
    margin: INVOICE_TABLE_MARGINS,
    head,
    body,
    foot,
    columnStyles: centeredColumns,
    continuationStartY,
    pageHeight: PDF_A4_PORTRAIT.height,
    orientation: "portrait",
    tableHeadHeightMm: PDF_TABLE_GROUPED_HEAD_HEIGHT_MM,
    rowHeightMm: PDF_TABLE_MIN_CELL_HEIGHT,
    footReserveRows: foot.length > 0 ? INVOICE_FOOT_RESERVE_ROWS : 0,
    onNewPage: () =>
      renderInvoiceContinuationHeader(pdf, logoDataUrl, prepared),
  });
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
