"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatInvoiceMoney } from "@/lib/invoice-calculations";
import { drawCompanyBrandHeaderPdf } from "@/lib/company-brand-header-pdf";
import { drawCompanyDocumentFooterPdf } from "@/lib/company-document-footer-pdf";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import {
  closingBlockHeight,
  drawFootersOnAllPages,
  ensureVerticalSpace,
  PDF_A4_PORTRAIT,
  PDF_FONT,
  PDF_MARGIN,
  PDF_SIGNATURE_GAP,
  PDF_SIGNATURE_HEIGHT,
  PDF_TABLE_BOTTOM_MARGIN,
  pdfContentWidth,
} from "@/lib/company-document-pdf-shared";
import { downloadPdfBlob, openPdfBlobInNewTab } from "@/lib/pdf-print";
import { formatQuotationDateDisplay } from "@/lib/quotation-calculations";
import type { QuotationDocument } from "@/lib/quotation-types";
import {
  formatInvoiceLocationLine,
  hasInvoiceLocation,
  locationFromCustomer,
} from "@/lib/invoice-location";

const PAGE_W = PDF_A4_PORTRAIT.width;
const PAGE_H = PDF_A4_PORTRAIT.height;
const CONTENT_W = pdfContentWidth(PAGE_W);

const BODY_FONT = 10;
const META_FONT = 10;
const TABLE_FONT = 10;
const TABLE_PADDING = 2.4;
const TEXT_LINE_H = 4.8;
const BODY_LINE_H = 5;
const SUBJECT_GAP = 8;
const WORDS_GAP = 8;
const SIGNATURE_EXTRA_GAP = 14;

const SL_COL_W = 18;
const AMOUNT_COL_W = 42;
const DESC_COL_W = CONTENT_W - SL_COL_W - AMOUNT_COL_W;

const TABLE_MARGINS = {
  left: PDF_MARGIN.left,
  right: PDF_MARGIN.right,
  top: PDF_MARGIN.top,
  bottom: PDF_TABLE_BOTTOM_MARGIN,
};

const TABLE_STYLES = {
  font: PDF_FONT,
  fontSize: TABLE_FONT,
  cellPadding: TABLE_PADDING,
  overflow: "linebreak" as const,
  valign: "middle" as const,
  lineColor: [0, 0, 0] as [number, number, number],
  lineWidth: 0.2,
  fillColor: [255, 255, 255] as [number, number, number],
  fontStyle: "normal" as const,
};

const WHITE_TABLE_HEAD = {
  fillColor: [255, 255, 255] as [number, number, number],
  textColor: [0, 0, 0] as [number, number, number],
  fontStyle: "bold" as const,
  halign: "center" as const,
  fontSize: TABLE_FONT,
  lineWidth: 0.2,
};

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

let logoDataUrlPromise: Promise<string> | null = null;

function loadLogoDataUrl(): Promise<string> {
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

function drawQuotationBrandHeader(pdf: jsPDF, logoDataUrl: string, startY: number = PDF_MARGIN.top): number {
  return drawCompanyBrandHeaderPdf({
    pdf,
    logoDataUrl,
    documentTitle: "",
    pageWidth: PAGE_W,
    leftMargin: PDF_MARGIN.left,
    rightMargin: PDF_MARGIN.right,
    startY,
    includeDocumentTitle: false,
    logoWidthMm: 32,
    companyFontSize: 24,
    headerRowHeightMm: 16,
    afterLineGapMm: 7,
  });
}

function drawRefHeader(pdf: jsPDF, document: QuotationDocument, startY: number): number {
  const leftX = PDF_MARGIN.left;
  const rightX = PAGE_W - PDF_MARGIN.right;

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(META_FONT);
  pdf.text(`Ref. No. ${document.refNo}`, leftX, startY);
  pdf.text(`Reference Date: ${formatQuotationDateDisplay(document.referenceDate)}`, rightX, startY, {
    align: "right",
  });
  return startY + 9;
}

function drawCustomerBlock(pdf: jsPDF, document: QuotationDocument, startY: number): number {
  const leftX = PDF_MARGIN.left;
  const rightX = PAGE_W - PDF_MARGIN.right;
  const addressWidth = CONTENT_W * 0.62;
  let leftY = startY;

  pdf.setFontSize(BODY_FONT);
  pdf.setFont(PDF_FONT, "normal");
  pdf.text("To,", leftX, leftY);
  leftY += BODY_LINE_H;

  pdf.setFont(PDF_FONT, "bold");
  pdf.text(document.customerName, leftX, leftY, { maxWidth: addressWidth });
  leftY += BODY_LINE_H;
  pdf.setFont(PDF_FONT, "normal");

  const addressLines = pdf.splitTextToSize(document.customerAddress, addressWidth);
  pdf.text(addressLines, leftX, leftY);
  leftY += addressLines.length * BODY_LINE_H;

  if (document.customerGst.trim()) {
    pdf.text(`GST: ${document.customerGst}`, leftX, leftY);
    leftY += BODY_LINE_H;
  }

  pdf.setFontSize(META_FONT);
  pdf.text(`Quotation Date: ${formatQuotationDateDisplay(document.quotationDate)}`, rightX, startY, {
    align: "right",
  });

  const location = locationFromCustomer({
    village: document.village,
    hobbli: document.hobbli,
    taluk: document.taluk,
    district: document.district,
    state: document.state,
  });
  if (hasInvoiceLocation(location)) {
    leftY += 3;
    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(8);
    const locLines = pdf.splitTextToSize(formatInvoiceLocationLine(location), CONTENT_W);
    pdf.text(locLines, leftX, leftY);
    leftY += locLines.length * BODY_LINE_H;
    pdf.setFont(PDF_FONT, "normal");
  }

  const subjectY = leftY + SUBJECT_GAP;
  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(BODY_FONT);
  pdf.text(`Subject – Quotation for ${document.subject}`, leftX, subjectY, {
    maxWidth: CONTENT_W,
  });

  return subjectY + 10;
}

function drawAddressFooter(pdf: jsPDF): void {
  drawCompanyDocumentFooterPdf({
    pdf,
    pageWidth: PAGE_W,
    pageHeight: PAGE_H,
    contentWidth: CONTENT_W,
    pageNumber: pdf.getCurrentPageInfo().pageNumber,
    pageCount: pdf.getNumberOfPages(),
    showPageNumbers: false,
  });
}

function textBlockHeight(pdf: jsPDF, text: string, maxWidth: number, fontSize: number): number {
  pdf.setFontSize(fontSize);
  return pdf.splitTextToSize(text, maxWidth).length * TEXT_LINE_H;
}

function drawWordsBox(pdf: jsPDF, words: string, startY: number): number {
  const boxPadding = 3;
  const label = "Grand Total In Words";
  const innerWidth = CONTENT_W - boxPadding * 2;
  pdf.setFontSize(BODY_FONT);
  const bodyLines = pdf.splitTextToSize(words, innerWidth);
  const boxHeight = 10 + bodyLines.length * TEXT_LINE_H;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.25);
  pdf.rect(PDF_MARGIN.left, startY, CONTENT_W, boxHeight);

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(BODY_FONT);
  pdf.text(label, PDF_MARGIN.left + boxPadding, startY + 5);
  pdf.setFont(PDF_FONT, "normal");
  pdf.text(bodyLines, PDF_MARGIN.left + boxPadding, startY + 10);

  return startY + boxHeight;
}

function drawQuotationSignature(pdf: jsPDF, contentEndY: number): number {
  const blockH = closingBlockHeight(null);
  const y = ensureVerticalSpace(pdf, contentEndY, blockH);
  const blockTop = y + PDF_SIGNATURE_GAP;
  const rightX = PAGE_W - PDF_MARGIN.right;

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(10);
  pdf.text(`For ${COMPANY_INVOICE_HEADER.signatureName}`, rightX, blockTop, { align: "right" });
  pdf.setFontSize(9);
  pdf.text("Authorized Signatory", rightX, blockTop + 6, { align: "right" });

  return blockTop + PDF_SIGNATURE_HEIGHT;
}

function finishQuotationPdf(pdf: jsPDF, contentEndY: number): void {
  drawQuotationSignature(pdf, contentEndY);
  drawFootersOnAllPages(pdf, () => {
    drawAddressFooter(pdf);
  });
}

function buildTableFoot(document: QuotationDocument) {
  const subtotalLabel = formatInvoiceMoney(document.totals.subtotal);
  const rightLabel = { halign: "right" as const, fontSize: TABLE_FONT };
  return [
    [
      { content: "", colSpan: 1 },
      { content: "Total", styles: { ...rightLabel, fontStyle: "bold" as const } },
      {
        content: formatInvoiceMoney(document.totals.subtotal),
        styles: { ...rightLabel, fontStyle: "normal" as const },
      },
    ],
    [
      { content: "", colSpan: 1 },
      {
        content: `SGST 9% on ${subtotalLabel}`,
        styles: { ...rightLabel, fontStyle: "normal" as const },
      },
      {
        content: formatInvoiceMoney(document.totals.sgst),
        styles: { ...rightLabel, fontStyle: "normal" as const },
      },
    ],
    [
      { content: "", colSpan: 1 },
      {
        content: `CGST 9% on ${subtotalLabel}`,
        styles: { ...rightLabel, fontStyle: "normal" as const },
      },
      {
        content: formatInvoiceMoney(document.totals.cgst),
        styles: { ...rightLabel, fontStyle: "normal" as const },
      },
    ],
    [
      { content: "", colSpan: 1 },
      { content: "Grand Total", styles: { ...rightLabel, fontStyle: "bold" as const } },
      {
        content: formatInvoiceMoney(document.totals.grandTotal),
        styles: { ...rightLabel, fontStyle: "bold" as const },
      },
    ],
  ];
}

async function buildQuotationPdf(document: QuotationDocument): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as JsPdfWithAutoTable;
  const logoDataUrl = await loadLogoDataUrl();

  let y = drawQuotationBrandHeader(pdf, logoDataUrl, PDF_MARGIN.top);
  y = drawRefHeader(pdf, document, y);
  y = drawCustomerBlock(pdf, document, y);

  const tableBody = document.items.map((item, index) => [
    String(index + 1),
    item.description,
    formatInvoiceMoney(item.amount),
  ]);
  const { DOCUMENT_PDF_ROWS_PER_PAGE } = await import("@/lib/invoice-location");
  const chunks: string[][][] = [];
  for (let i = 0; i < tableBody.length; i += DOCUMENT_PDF_ROWS_PER_PAGE) {
    chunks.push(tableBody.slice(i, i + DOCUMENT_PDF_ROWS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);

  chunks.forEach((chunk, index) => {
    const isLast = index === chunks.length - 1;
    if (index > 0) {
      pdf.addPage("a4", "portrait");
      y = drawQuotationBrandHeader(pdf, logoDataUrl, PDF_MARGIN.top);
    }
    autoTable(pdf, {
      startY: y,
      margin: TABLE_MARGINS,
      tableWidth: CONTENT_W,
      head: [["Sl No", "Description", "Amount"]],
      body: chunk,
      foot: isLast ? buildTableFoot(document) : undefined,
      styles: TABLE_STYLES,
      headStyles: WHITE_TABLE_HEAD,
      bodyStyles: {
        fontStyle: "normal",
        fontSize: TABLE_FONT,
        fillColor: [255, 255, 255],
      },
      footStyles: {
        fontStyle: "normal",
        fontSize: TABLE_FONT,
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: SL_COL_W, halign: "center" },
        1: { cellWidth: DESC_COL_W, halign: "left" },
        2: { cellWidth: AMOUNT_COL_W, halign: "right" },
      },
      theme: "grid",
      showHead: "everyPage",
      showFoot: isLast ? "lastPage" : "never",
      rowPageBreak: "avoid",
    });
    y = (pdf.lastAutoTable?.finalY ?? y) + WORDS_GAP;
  });

  let endY = y;
  const wordsBoxH = textBlockHeight(pdf, document.grandTotalInWords, CONTENT_W - 6, BODY_FONT) + 14;
  const closingH = closingBlockHeight(null) + SIGNATURE_EXTRA_GAP;
  endY = ensureVerticalSpace(pdf, endY, wordsBoxH + closingH);

  endY = drawWordsBox(pdf, document.grandTotalInWords, endY) + SIGNATURE_EXTRA_GAP;
  finishQuotationPdf(pdf, endY);

  return pdf;
}

export async function getQuotationPdfBlob(document: QuotationDocument): Promise<Blob> {
  const pdf = await buildQuotationPdf(document);
  return pdf.output("blob");
}

export async function generateQuotationPdf(document: QuotationDocument): Promise<void> {
  const pdf = await buildQuotationPdf(document);
  pdf.save(`${document.refNo}.pdf`);
}

export async function printQuotationPdf(document: QuotationDocument): Promise<void> {
  const blob = await getQuotationPdfBlob(document);
  openPdfBlobInNewTab(blob, `${document.refNo}.pdf`);
}

export async function downloadQuotationPdf(document: QuotationDocument): Promise<void> {
  const blob = await getQuotationPdfBlob(document);
  downloadPdfBlob(blob, `${document.refNo}.pdf`);
}
