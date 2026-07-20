import type { jsPDF } from "jspdf";
import { drawCompanyBrandHeaderPdf } from "@/lib/company-brand-header-pdf";
import { drawCompanyDocumentFooterPdf } from "@/lib/company-document-footer-pdf";
import type { BankDetailsSnapshot } from "@/lib/bank-details-types";
import { toDisplayDate } from "@/lib/date-format";
import { buildBillToLines } from "@/lib/invoice-customer-format";
import {
  formatInvoiceLocationLine,
  hasInvoiceLocation,
  type InvoiceLocationFields,
} from "@/lib/invoice-location";
import { COMPANY_INVOICE_HEADER, INVOICE_LOGO_PDF_MM } from "@/lib/invoice-config";
import {
  closingBlockHeight,
  drawClosingSection,
  drawFootersOnAllPages,
  PDF_A4_PORTRAIT,
  PDF_FONT,
  PDF_MARGIN,
  PDF_TABLE_BOTTOM_MARGIN,
  pdfContentWidth,
} from "@/lib/company-document-pdf-shared";
import type { InvoiceDocumentData } from "@/lib/invoice-types";
import { NA_INVOICE_CONTENT_WIDTH_MM } from "@/lib/na-invoice-layout";

export const INVOICE_PAGE_W = PDF_A4_PORTRAIT.width;
export const INVOICE_PAGE_H = PDF_A4_PORTRAIT.height;
export const INVOICE_CONTENT_W = NA_INVOICE_CONTENT_WIDTH_MM;
export const INVOICE_TEXT_LINE_H = 3.5;

export const INVOICE_TABLE_STYLES = {
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

export const INVOICE_TABLE_MARGINS = {
  left: PDF_MARGIN.left,
  right: PDF_MARGIN.right,
  top: INVOICE_LOGO_PDF_MM.repeatHeaderHeight,
  bottom: PDF_TABLE_BOTTOM_MARGIN,
};

export const INVOICE_AUTOTABLE_LAYOUT = {
  theme: "grid" as const,
  showHead: "everyPage" as const,
  showFoot: "lastPage" as const,
  horizontalPageBreak: false,
  rowPageBreak: "avoid" as const,
};

export const INVOICE_TABLE_HEAD_STYLES = {
  fillColor: [255, 255, 255] as [number, number, number],
  textColor: [0, 0, 0] as [number, number, number],
  lineWidth: 0.2,
  fontStyle: "bold" as const,
  halign: "center" as const,
  fontSize: 7,
};

let logoDataUrlPromise: Promise<string> | null = null;

export function loadInvoiceLogoDataUrl(): Promise<string> {
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

export function formatInvoiceDateDisplay(isoDate: string): string {
  return toDisplayDate(isoDate) || isoDate;
}

export function getInvoiceBrandTitle(document: InvoiceDocumentData): string {
  return document.invoiceType === "service" ? "SERVICE INVOICE" : "NA INVOICE";
}

export function drawInvoiceBrandHeader(
  pdf: jsPDF,
  logoDataUrl: string,
  documentTitle: string,
  startY: number = PDF_MARGIN.top,
): number {
  return drawCompanyBrandHeaderPdf({
    pdf,
    logoDataUrl,
    documentTitle,
    pageWidth: INVOICE_PAGE_W,
    leftMargin: PDF_MARGIN.left,
    rightMargin: PDF_MARGIN.right,
    startY,
  });
}

/** Logo + company name + document title — repeated at top of continuation pages. */
export function renderInvoiceContinuationHeader(
  pdf: jsPDF,
  logoDataUrl: string,
  document: InvoiceDocumentData,
): void {
  drawInvoiceBrandHeader(pdf, logoDataUrl, getInvoiceBrandTitle(document), PDF_MARGIN.top);
}

/** Shared invoice PDF header: logo, company name, green line, INVOICE title, invoice meta. */
export async function renderInvoiceHeader(
  pdf: jsPDF,
  document: InvoiceDocumentData,
  logoDataUrl: string,
  startY: number = PDF_MARGIN.top,
): Promise<number> {
  const rightX = INVOICE_PAGE_W - PDF_MARGIN.right;
  const leftX = PDF_MARGIN.left;
  let y = drawInvoiceBrandHeader(pdf, logoDataUrl, getInvoiceBrandTitle(document), startY);

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(8);
  pdf.text(`Invoice No: ${document.invoiceNumber}`, leftX, y);
  pdf.setFont(PDF_FONT, "bold");
  pdf.text(`Type: ${document.subType}`, rightX, y, { align: "right" });
  pdf.setFont(PDF_FONT, "normal");
  y += 3.5;
  pdf.text(`GST: ${COMPANY_INVOICE_HEADER.gstin}`, leftX, y);
  pdf.text(`Date: ${formatInvoiceDateDisplay(document.invoiceDate)}`, rightX, y, { align: "right" });
  y += 3.5;
  const poNumber = document.poNumber?.trim() ?? "";
  const poDate = document.poDate?.trim() ?? "";
  if (poNumber || poDate) {
    if (poNumber) {
      pdf.text(`P.O No: ${poNumber}`, leftX, y);
    }
    if (poDate) {
      pdf.text(`P.O Date: ${formatInvoiceDateDisplay(poDate)}`, rightX, y, { align: "right" });
    }
    y += 3.5;
  }
  y += 0.5;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.line(leftX, y, rightX, y);
  return y + 4;
}

/** Shared bill-to and location block for NA and service invoices. Type is in the header. */
export function renderInvoiceCustomerSection(
  pdf: jsPDF,
  document: InvoiceDocumentData,
  startY: number,
): number {
  const leftX = PDF_MARGIN.left;
  let leftY = startY;
  const lineHeight = 3.4;
  const maxWidth = INVOICE_CONTENT_W * 0.62;

  pdf.setFontSize(7);
  pdf.setFont(PDF_FONT, "normal");

  const billLines = buildBillToLines(document.customer);
  for (const row of billLines) {
    if (!row.value) continue;
    if (row.value === "To,") {
      pdf.text("To,", leftX, leftY);
      leftY += lineHeight;
      continue;
    }
    const isName = row.value === document.customer.companyName;
    pdf.setFont(PDF_FONT, isName ? "bold" : "normal");
    pdf.text(row.value, leftX, leftY, { maxWidth });
    pdf.setFont(PDF_FONT, "normal");
    leftY += lineHeight;
  }

  const location: InvoiceLocationFields = {
    hobbli: document.hobbli?.trim() ?? "",
    village: document.village?.trim() ?? "",
    taluk: document.taluk?.trim() ?? "",
    district: document.district?.trim() ?? "",
    state: document.state?.trim() ?? "",
  };

  let y = leftY;
  if (hasInvoiceLocation(location)) {
    y += 2.5;
    const line = formatInvoiceLocationLine(location);
    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(7);
    const wrapped = pdf.splitTextToSize(line, INVOICE_CONTENT_W);
    pdf.text(wrapped, leftX, y);
    y += wrapped.length * lineHeight + 1;
    pdf.setFont(PDF_FONT, "normal");
  } else {
    y += 2;
  }

  pdf.setLineWidth(0.2);
  pdf.line(PDF_MARGIN.left, y + 1, INVOICE_PAGE_W - PDF_MARGIN.right, y + 1);
  return y + 5;
}

export function invoiceTextBlockHeight(pdf: jsPDF, text: string, maxWidth: number): number {
  return pdf.splitTextToSize(text, maxWidth).length * INVOICE_TEXT_LINE_H;
}

export function renderInvoiceAmountInWords(
  pdf: jsPDF,
  words: string,
  startY: number,
): number {
  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(8);
  pdf.text("Value of Invoice:", PDF_MARGIN.left, startY);
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(7.5);
  const wordLines = pdf.splitTextToSize(words, INVOICE_CONTENT_W);
  pdf.text(wordLines, PDF_MARGIN.left, startY + 4);
  return startY + 4 + wordLines.length * INVOICE_TEXT_LINE_H;
}

function drawInvoiceAddressFooter(pdf: jsPDF, pageNumber: number, pageCount: number): void {
  drawCompanyDocumentFooterPdf({
    pdf,
    pageWidth: INVOICE_PAGE_W,
    pageHeight: INVOICE_PAGE_H,
    contentWidth: pdfContentWidth(INVOICE_PAGE_W),
    pageNumber,
    pageCount,
    showPageNumbers: true,
  });
}

/** Shared closing: signature, bank details, and green-line footer on all pages. */
export function renderInvoiceFooter(
  pdf: jsPDF,
  contentEndY: number,
  bank: BankDetailsSnapshot | undefined,
): void {
  drawClosingSection(pdf, INVOICE_PAGE_W, contentEndY, bank);
  drawFootersOnAllPages(pdf, (pageNumber, pageCount) => {
    drawInvoiceAddressFooter(pdf, pageNumber, pageCount);
  });
}

export function invoiceClosingBlockHeight(bank?: BankDetailsSnapshot | null): number {
  return closingBlockHeight(bank);
}
