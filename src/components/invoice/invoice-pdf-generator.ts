"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  formatInvoiceMoney,
  invoiceLineTaxableAmount,
} from "@/lib/invoice-calculations";
import { buildBillToLines } from "@/lib/invoice-customer-format";
import {
  hasInvoiceLocation,
  invoiceLocationEntries,
  type InvoiceLocationFields,
} from "@/lib/invoice-location";
import { drawCompanyBrandHeaderPdf } from "@/lib/company-brand-header-pdf";
import { drawCompanyDocumentFooterPdf } from "@/lib/company-document-footer-pdf";
import type { BankDetailsSnapshot } from "@/lib/bank-details-types";
import { COMPANY_INVOICE_HEADER, INVOICE_LOGO_PDF_MM } from "@/lib/invoice-config";
import {
  closingBlockHeight,
  drawClosingSection,
  drawFootersOnAllPages,
  ensureVerticalSpace,
  PDF_A4_PORTRAIT,
  PDF_FONT,
  PDF_MARGIN,
  PDF_TABLE_BOTTOM_MARGIN,
  pdfContentWidth,
  pdfFooterY,
} from "@/lib/company-document-pdf-shared";
import {
  buildNaInvoiceTableBody,
  buildNaInvoiceTableFoot,
  buildNaInvoiceTableHead,
  NA_INVOICE_CONTENT_WIDTH_MM,
  NA_INVOICE_TABLE_COLUMN_STYLES,
  naInvoiceAmountInWords,
  prepareNaInvoiceDocument,
} from "@/lib/na-invoice-layout";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

const PAGE_W = PDF_A4_PORTRAIT.width;
const PAGE_H = PDF_A4_PORTRAIT.height;
const CONTENT_W = NA_INVOICE_CONTENT_WIDTH_MM;
const TEXT_LINE_H = 3.5;

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

function formatInvoiceDateDisplay(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoDate;
}

let logoDataUrlPromise: Promise<string> | null = null;

function loadInvoiceLogoDataUrl(): Promise<string> {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch("/company-logo.png")
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }),
      );
  }
  return logoDataUrlPromise;
}

function drawBrandHeader(
  pdf: jsPDF,
  logoDataUrl: string,
  startY: number = PDF_MARGIN.top,
): number {
  return drawCompanyBrandHeaderPdf({
    pdf,
    logoDataUrl,
    documentTitle: "INVOICE",
    pageWidth: PAGE_W,
    leftMargin: PDF_MARGIN.left,
    rightMargin: PDF_MARGIN.right,
    startY,
  });
}

async function drawCompanyHeader(
  pdf: jsPDF,
  invoiceDate: string,
  invoiceNumber: string,
  logoDataUrl: string,
  startY: number = PDF_MARGIN.top,
): Promise<number> {
  const rightX = PAGE_W - PDF_MARGIN.right;
  const leftX = PDF_MARGIN.left;
  let y = drawBrandHeader(pdf, logoDataUrl, startY);

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(8);
  pdf.text(`Invoice No: ${invoiceNumber}`, leftX, y);
  y += 3.5;
  pdf.text(`GST: ${COMPANY_INVOICE_HEADER.gstin}`, leftX, y);
  pdf.text(`Date: ${formatInvoiceDateDisplay(invoiceDate)}`, rightX, y, { align: "right" });
  y += 4;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.line(leftX, y, rightX, y);
  return y + 4;
}

function drawBillToSection(pdf: jsPDF, document: InvoiceDocumentData, startY: number): number {
  const leftX = PDF_MARGIN.left;
  const rightX = PAGE_W - PDF_MARGIN.right;
  const colMid = PAGE_W / 2 + 2;
  let leftY = startY;
  let rightY = startY;
  const lineHeight = 3.4;

  pdf.setFontSize(7);
  pdf.setFont(PDF_FONT, "normal");

  const billLines = buildBillToLines(document.customer);
  for (const row of billLines) {
    if (!row.label && row.value === "To,") {
      pdf.text("To,", leftX, leftY);
      leftY += lineHeight;
      continue;
    }
    if (!row.label && row.value) {
      pdf.setFont(PDF_FONT, "bold");
      pdf.text(row.value, leftX, leftY, { maxWidth: colMid - leftX - 4 });
      pdf.setFont(PDF_FONT, "normal");
      leftY += lineHeight;
      continue;
    }
    if (row.label) {
      pdf.text(row.label, leftX, leftY);
      leftY += lineHeight;
      if (row.value) {
        pdf.text(row.value, leftX, leftY, { maxWidth: colMid - leftX - 4 });
        leftY += lineHeight;
      }
    }
  }

  if (document.invoiceType === "na") {
    pdf.setFont(PDF_FONT, "bold");
    pdf.text("Type:", colMid, rightY);
    pdf.setFont(PDF_FONT, "normal");
    pdf.text(document.subType, colMid + 22, rightY, { maxWidth: rightX - colMid - 22 });
    rightY += lineHeight;
  }

  const location: InvoiceLocationFields = {
    hobbli: document.hobbli?.trim() ?? "",
    village: document.village?.trim() ?? "",
    taluk: document.taluk?.trim() ?? "",
    district: document.district?.trim() ?? "",
    state: document.state?.trim() ?? "",
  };

  let y = Math.max(leftY, rightY);
  if (hasInvoiceLocation(location)) {
    const metaY = y + 2.5;
    const entries = invoiceLocationEntries(location);
    const quarter = CONTENT_W / Math.max(entries.length, 1);
    entries.forEach(({ label, value }, index) => {
      pdf.text(`${label}: ${value}`, PDF_MARGIN.left + quarter * index, metaY, {
        maxWidth: quarter - 2,
      });
    });
    y = metaY + lineHeight + 1;
  } else {
    y += 2;
  }

  y = Math.max(y, rightY);
  pdf.setLineWidth(0.2);
  pdf.line(PDF_MARGIN.left, y + 1, PAGE_W - PDF_MARGIN.right, y + 1);
  return y + 5;
}

function drawAddressFooter(pdf: jsPDF, pageNumber: number, pageCount: number) {
  drawCompanyDocumentFooterPdf({
    pdf,
    pageWidth: PAGE_W,
    pageHeight: PAGE_H,
    contentWidth: CONTENT_W,
    pageNumber,
    pageCount,
  });
}

function textBlockHeight(pdf: jsPDF, text: string, maxWidth: number): number {
  return pdf.splitTextToSize(text, maxWidth).length * TEXT_LINE_H;
}

function finishInvoicePdf(
  pdf: jsPDF,
  contentEndY: number,
  bank: BankDetailsSnapshot | undefined,
) {
  drawClosingSection(pdf, PAGE_W, contentEndY, bank);
  drawFootersOnAllPages(pdf, (pageNumber, pageCount) => {
    drawAddressFooter(pdf, pageNumber, pageCount);
  });
}

const TABLE_STYLES = {
  font: PDF_FONT,
  fontSize: 7,
  cellPadding: 1.2,
  overflow: "linebreak" as const,
  valign: "middle" as const,
  lineWidth: 0.1,
  lineColor: [0, 0, 0] as [number, number, number],
  fillColor: [255, 255, 255] as [number, number, number],
  fontStyle: "normal" as const,
};

const TABLE_MARGINS = {
  left: PDF_MARGIN.left,
  right: PDF_MARGIN.right,
  top: INVOICE_LOGO_PDF_MM.repeatHeaderHeight,
  bottom: PDF_TABLE_BOTTOM_MARGIN,
};

async function generateNaInvoicePdf(document: InvoiceDocumentData): Promise<jsPDF> {
  const prepared = prepareNaInvoiceDocument(document);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as JsPdfWithAutoTable;

  const logoDataUrl = await loadInvoiceLogoDataUrl();
  let y = await drawCompanyHeader(
    pdf,
    prepared.invoiceDate,
    prepared.invoiceNumber,
    logoDataUrl,
    PDF_MARGIN.top,
  );
  y = drawBillToSection(pdf, prepared, y);

  autoTable(pdf, {
    startY: y,
    margin: TABLE_MARGINS,
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawBrandHeader(pdf, logoDataUrl, PDF_MARGIN.top);
      }
    },
    tableWidth: CONTENT_W,
    head: buildNaInvoiceTableHead(prepared),
    body: buildNaInvoiceTableBody(prepared),
    foot: buildNaInvoiceTableFoot(prepared),
    styles: TABLE_STYLES,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.2,
      fontStyle: "bold",
      halign: "center",
      fontSize: 7,
    },
    footStyles: {
      fontSize: 8,
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "normal",
    },
    bodyStyles: {
      lineWidth: 0.1,
      fontSize: 7,
      fontStyle: "normal",
    },
    columnStyles: NA_INVOICE_TABLE_COLUMN_STYLES,
    theme: "grid",
    showHead: "everyPage",
    horizontalPageBreak: false,
    rowPageBreak: "auto",
  });

  let endY = (pdf.lastAutoTable?.finalY ?? y) + 4;
  const words = naInvoiceAmountInWords(prepared);
  const wordsH = textBlockHeight(pdf, words, CONTENT_W);
  const totalAfterTable = 4 + wordsH + closingBlockHeight(prepared.bank);

  endY = ensureVerticalSpace(pdf, endY, totalAfterTable);

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(8);
  pdf.text("Value of Invoice:", PDF_MARGIN.left, endY);
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(7.5);
  const wordLines = pdf.splitTextToSize(words, CONTENT_W);
  pdf.text(wordLines, PDF_MARGIN.left, endY + 4);
  const wordsEndY = endY + 4 + wordLines.length * TEXT_LINE_H;

  finishInvoicePdf(pdf, wordsEndY, prepared.bank);
  return pdf;
}

async function generateServiceInvoicePdf(document: InvoiceDocumentData): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as JsPdfWithAutoTable;

  const logoDataUrl = await loadInvoiceLogoDataUrl();
  let y = await drawCompanyHeader(
    pdf,
    document.invoiceDate,
    document.invoiceNumber,
    logoDataUrl,
    PDF_MARGIN.top,
  );
  y = drawBillToSection(pdf, document, y);

  const tableBody = document.lines.map((line, index) => [
    String(index + 1),
    line.description || line.farmerName || "",
    formatInvoiceMoney(invoiceLineTaxableAmount(line)),
  ]);

  autoTable(pdf, {
    startY: y,
    margin: TABLE_MARGINS,
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawBrandHeader(pdf, logoDataUrl, PDF_MARGIN.top);
      }
    },
    tableWidth: CONTENT_W,
    head: [["Sl No", "Description", "Amount"]],
    body: tableBody,
    foot: [
      [
        { content: "", colSpan: 1 },
        { content: "Subtotal", styles: { halign: "right", fontStyle: "bold" } },
        {
          content: formatInvoiceMoney(document.totals.subtotal),
          styles: { halign: "right", fontStyle: "normal" },
        },
      ],
      [
        { content: "", colSpan: 1 },
        { content: "SGST (9%)", styles: { halign: "right", fontStyle: "bold" } },
        {
          content: formatInvoiceMoney(document.totals.sgst),
          styles: { halign: "right", fontStyle: "normal" },
        },
      ],
      [
        { content: "", colSpan: 1 },
        { content: "CGST (9%)", styles: { halign: "right", fontStyle: "bold" } },
        {
          content: formatInvoiceMoney(document.totals.cgst),
          styles: { halign: "right", fontStyle: "normal" },
        },
      ],
      [
        { content: "", colSpan: 1 },
        { content: "Grand Total", styles: { halign: "right", fontStyle: "bold" } },
        {
          content: formatInvoiceMoney(document.totals.grandTotal),
          styles: { halign: "right", fontStyle: "bold" },
        },
      ],
    ],
    styles: TABLE_STYLES,
    headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" },
    bodyStyles: { fontStyle: "normal" },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: CONTENT_W - 50 },
      2: { cellWidth: 36, halign: "right" },
    },
    theme: "grid",
    showHead: "everyPage",
    rowPageBreak: "auto",
  });

  let endY = (pdf.lastAutoTable?.finalY ?? y) + 4;
  if (document.totalAmountWords) {
    const wordsH = textBlockHeight(pdf, document.totalAmountWords, CONTENT_W) + 4;
    const totalNeed = wordsH + closingBlockHeight(document.bank);
    endY = ensureVerticalSpace(pdf, endY, totalNeed);

    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(7.5);
    const lines = pdf.splitTextToSize(
      `Total Amount in Words: ${document.totalAmountWords}`,
      CONTENT_W,
    );
    pdf.text(lines, PDF_MARGIN.left, endY);
    endY += lines.length * TEXT_LINE_H + 2;
  } else {
    endY = ensureVerticalSpace(pdf, endY, closingBlockHeight(document.bank));
  }

  finishInvoicePdf(pdf, endY, document.bank);
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
