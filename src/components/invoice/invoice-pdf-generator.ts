"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  INVOICE_AUTOTABLE_LAYOUT,
  INVOICE_CONTENT_W,
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
import { ensureVerticalSpace, PDF_MARGIN } from "@/lib/company-document-pdf-shared";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

function buildAutoTableOptions(
  pdf: jsPDF,
  prepared: InvoiceDocumentData,
  logoDataUrl: string,
  startY: number,
  head: ReturnType<typeof buildNaInvoiceTableHead>,
  body: string[][],
  foot: ReturnType<typeof buildNaInvoiceTableFoot>,
  columnStyles: Record<number, { cellWidth: number; halign?: "left" | "center" | "right" }>,
) {
  return {
    startY,
    margin: INVOICE_TABLE_MARGINS,
    didDrawPage: (data: { pageNumber: number }) => {
      if (data.pageNumber > 1) {
        renderInvoiceContinuationHeader(pdf, logoDataUrl, prepared);
      }
    },
    tableWidth: INVOICE_CONTENT_W,
    head,
    body,
    foot,
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
  };
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

  autoTable(
    pdf,
    buildAutoTableOptions(
      pdf,
      prepared,
      logoDataUrl,
      y,
      buildNaInvoiceTableHead(prepared),
      buildNaInvoiceTableBody(prepared),
      buildNaInvoiceTableFoot(prepared),
      NA_INVOICE_TABLE_COLUMN_STYLES,
    ),
  );

  let endY = (pdf.lastAutoTable?.finalY ?? y) + 4;
  const words = naInvoiceAmountInWords(prepared);
  const wordsH = invoiceTextBlockHeight(pdf, words, INVOICE_CONTENT_W);
  const totalAfterTable = 4 + wordsH + invoiceClosingBlockHeight(prepared.bank);

  endY = ensureVerticalSpace(pdf, endY, totalAfterTable);
  const wordsEndY = renderInvoiceAmountInWords(pdf, words, endY);
  renderInvoiceFooter(pdf, wordsEndY, prepared.bank);
  return pdf;
}

async function generateServiceInvoicePdf(document: InvoiceDocumentData): Promise<jsPDF> {
  const prepared = prepareServiceInvoiceDocument(document);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as JsPdfWithAutoTable;

  const logoDataUrl = await loadInvoiceLogoDataUrl();
  let y = await renderInvoiceHeader(pdf, prepared, logoDataUrl, PDF_MARGIN.top);
  y = renderInvoiceCustomerSection(pdf, prepared, y);

  autoTable(
    pdf,
    buildAutoTableOptions(
      pdf,
      prepared,
      logoDataUrl,
      y,
      buildServiceInvoiceTableHead(prepared),
      buildServiceInvoiceTableBody(prepared),
      buildServiceInvoiceTableFoot(prepared),
      getServiceInvoiceTableColumnStyles(),
    ),
  );

  let endY = (pdf.lastAutoTable?.finalY ?? y) + 4;
  const words = serviceInvoiceAmountInWords(prepared);
  const wordsH = invoiceTextBlockHeight(pdf, words, INVOICE_CONTENT_W);
  const totalAfterTable = 4 + wordsH + invoiceClosingBlockHeight(prepared.bank);

  endY = ensureVerticalSpace(pdf, endY, totalAfterTable);
  const wordsEndY = renderInvoiceAmountInWords(pdf, words, endY);
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
