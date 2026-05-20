"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatInvoiceMoney } from "@/lib/invoice-calculations";
import { buildBillToLines } from "@/lib/invoice-customer-format";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
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

const MARGIN = { top: 10, left: 10, right: 10, bottom: 10 };
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = NA_INVOICE_CONTENT_WIDTH_MM;
const PDF_FONT = "times";

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

function drawCompanyHeader(pdf: jsPDF, invoiceDate: string, startY: number): number {
  let y = startY;
  const centerX = PAGE_W / 2;
  const rightX = PAGE_W - MARGIN.right;

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(14);
  pdf.text(COMPANY_INVOICE_HEADER.name, centerX, y, { align: "center" });
  y += 7;

  pdf.setFontSize(16);
  pdf.text("INVOICE", centerX, y, { align: "center" });
  y += 7;

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(8);
  pdf.text(`GSTIN: ${COMPANY_INVOICE_HEADER.gstin}`, MARGIN.left, y);
  pdf.text(`Date: ${formatInvoiceDateDisplay(invoiceDate)}`, rightX, y, { align: "right" });
  y += 4;

  pdf.setLineWidth(0.3);
  pdf.line(MARGIN.left, y, PAGE_W - MARGIN.right, y);
  return y + 4;
}

function drawBillToSection(pdf: jsPDF, document: InvoiceDocumentData, startY: number): number {
  const leftX = MARGIN.left;
  const rightX = PAGE_W - MARGIN.right;
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

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(7.5);
  pdf.text("Invoice No:", colMid, rightY);
  pdf.setFont(PDF_FONT, "normal");
  pdf.text(document.invoiceNumber, colMid + 22, rightY);
  rightY += lineHeight;

  const metaLines = [
    ["District:", document.district || "—"],
    ["Taluk:", document.taluk || "—"],
    ["Village:", document.village || "—"],
    ["Hobli:", document.hobbli || "—"],
    ["Type:", document.subType],
  ] as const;

  for (const [label, value] of metaLines) {
    pdf.setFont(PDF_FONT, "bold");
    pdf.text(label, colMid, rightY);
    pdf.setFont(PDF_FONT, "normal");
    pdf.text(value, colMid + 22, rightY, { maxWidth: rightX - colMid - 22 });
    rightY += lineHeight;
  }

  const y = Math.max(leftY, rightY);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN.left, y + 1, PAGE_W - MARGIN.right, y + 1);
  return y + 5;
}

function drawPageFooter(pdf: jsPDF, pageNumber: number, pageCount: number) {
  const footerY = PAGE_H - MARGIN.bottom;
  pdf.setFontSize(7);
  pdf.setFont(PDF_FONT, "normal");
  pdf.setTextColor(0, 0, 0);
  pdf.text(COMPANY_INVOICE_HEADER.footerAddress, PAGE_W / 2, footerY - 5, {
    align: "center",
    maxWidth: CONTENT_W,
  });
  pdf.text(COMPANY_INVOICE_HEADER.phone, PAGE_W / 2, footerY - 1, { align: "center" });
  if (pageCount > 1) {
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${pageNumber} of ${pageCount}`, PAGE_W - MARGIN.right, footerY, {
      align: "right",
    });
    pdf.setTextColor(0, 0, 0);
  }
}

function generateNaInvoicePdf(document: InvoiceDocumentData) {
  const prepared = prepareNaInvoiceDocument(document);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as JsPdfWithAutoTable;

  let y = drawCompanyHeader(pdf, prepared.invoiceDate, MARGIN.top);
  y = drawBillToSection(pdf, prepared, y);

  autoTable(pdf, {
    startY: y,
    margin: { left: MARGIN.left, right: MARGIN.right, top: MARGIN.top, bottom: 22 },
    tableWidth: CONTENT_W,
    head: buildNaInvoiceTableHead(prepared),
    body: buildNaInvoiceTableBody(prepared),
    foot: buildNaInvoiceTableFoot(prepared),
    styles: {
      font: PDF_FONT,
      fontSize: 7,
      cellPadding: 1.5,
      overflow: "linebreak",
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      fillColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: 0.2,
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    footStyles: {
      fontSize: 9,
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
    },
    bodyStyles: {
      lineWidth: 0.1,
      fontSize: 7,
    },
    columnStyles: NA_INVOICE_TABLE_COLUMN_STYLES,
    theme: "grid",
    showHead: "everyPage",
    horizontalPageBreak: false,
  });

  let endY = (pdf.lastAutoTable?.finalY ?? y) + 6;
  const pageH = PAGE_H - MARGIN.bottom - 28;

  if (endY > pageH - 35) {
    pdf.addPage();
    endY = MARGIN.top + 6;
  }

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(8);
  pdf.text("Value of Invoice:", MARGIN.left, endY);
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(7.5);
  const words = naInvoiceAmountInWords(prepared);
  pdf.text(words, MARGIN.left, endY + 4, { maxWidth: CONTENT_W });

  const signY = Math.min(endY + 20, PAGE_H - MARGIN.bottom - 30);
  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(8);
  pdf.text(`For ${COMPANY_INVOICE_HEADER.signatureName}`, PAGE_W - MARGIN.right, signY, {
    align: "right",
  });
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(7);
  pdf.text("Authorized Signatory", PAGE_W - MARGIN.right, signY + 5, { align: "right" });

  const pageCount = pdf.getNumberOfPages();
  for (let p = 1; p <= pageCount; p += 1) {
    pdf.setPage(p);
    drawPageFooter(pdf, p, pageCount);
  }

  pdf.save(`${prepared.invoiceNumber}.pdf`);
}

/** Minimal service invoice PDF (NA uses full A4 tax layout). */
function generateServiceInvoicePdf(document: InvoiceDocumentData) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pdf.setFontSize(12);
  pdf.text(`Service Invoice - ${document.invoiceNumber}`, 10, 15);
  autoTable(pdf, {
    startY: 22,
    head: [["Description", "Amount"]],
    body: document.lines.map((line) => [
      line.description || line.farmerName || "",
      formatInvoiceMoney(line.amount ?? 0),
    ]),
    margin: { left: 10, right: 10 },
    tableWidth: 190,
    styles: { fontSize: 8, cellPadding: 2 },
    theme: "grid",
  });
  pdf.save(`${document.invoiceNumber}.pdf`);
}

export function generateInvoicePdf(document: InvoiceDocumentData) {
  if (document.invoiceType === "na") {
    generateNaInvoicePdf(document);
    return;
  }
  generateServiceInvoicePdf(document);
}
