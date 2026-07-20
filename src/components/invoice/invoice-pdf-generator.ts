"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  INVOICE_AUTOTABLE_LAYOUT,
  INVOICE_CONTENT_W,
  INVOICE_PAGE_W,
  INVOICE_TABLE_HEAD_STYLES,
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
  NA_INVOICE_COLUMN_WIDTHS_MM,
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
  PDF_TABLE_BOTTOM_MARGIN,
} from "@/lib/company-document-pdf-shared";
import { DOCUMENT_PDF_ROWS_PER_PAGE } from "@/lib/invoice-location";
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

function centeredTableMargins(tableWidth: number) {
  const side = Math.max((INVOICE_PAGE_W - tableWidth) / 2, PDF_MARGIN.left);
  return {
    left: side,
    right: side,
    top: INVOICE_LOGO_PDF_MM.repeatHeaderHeight,
    bottom: PDF_TABLE_BOTTOM_MARGIN,
  };
}

function chunkRows<T>(rows: T[], size: number): T[][] {
  if (rows.length === 0) return [[]];
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
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
  const tableWidth = Math.min(sumColumnWidths(columnStyles), INVOICE_CONTENT_W);
  const margin = centeredTableMargins(tableWidth);
  const chunks = chunkRows(body, DOCUMENT_PDF_ROWS_PER_PAGE);
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
        fontSize: 8,
        fillColor: [255, 255, 255] as [number, number, number],
        textColor: [0, 0, 0] as [number, number, number],
        fontStyle: "normal" as const,
      },
      bodyStyles: {
        lineWidth: 0.1,
        fontSize: 7,
        fontStyle: "normal" as const,
        minCellHeight: 6,
      },
      columnStyles,
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
  const totalAfterTable = 4 + wordsH + invoiceClosingBlockHeight(prepared.bank);

  y = ensureVerticalSpace(pdf, y, totalAfterTable);
  const wordsEndY = renderInvoiceAmountInWords(pdf, words, y);
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
  const totalAfterTable = 4 + wordsH + invoiceClosingBlockHeight(prepared.bank);

  y = ensureVerticalSpace(pdf, y, totalAfterTable);
  const wordsEndY = renderInvoiceAmountInWords(pdf, words, y);
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

// Keep widths export referenced for centered NA table sizing.
void NA_INVOICE_COLUMN_WIDTHS_MM;
