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
import { COMPANY_INVOICE_HEADER, INVOICE_LOGO_PDF_MM } from "@/lib/invoice-config";
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

async function drawCompanyHeader(
  pdf: jsPDF,
  invoiceDate: string,
  invoiceNumber: string,
  startY: number,
): Promise<number> {
  const rightX = PAGE_W - MARGIN.right;
  const leftX = MARGIN.left;
  const { size: logoMm, gap: gapMm, metadataMargin: metaMarginMm } = INVOICE_LOGO_PDF_MM;

  const logoDataUrl = await loadInvoiceLogoDataUrl();
  pdf.addImage(logoDataUrl, "PNG", leftX, startY, logoMm, logoMm);

  const textX = leftX + logoMm + gapMm;
  let textY = startY + 6;
  pdf.setFont(PDF_FONT, "bold");
  pdf.setTextColor(242, 140, 42);
  pdf.setFontSize(20);
  pdf.text(COMPANY_INVOICE_HEADER.name, textX, textY);
  textY += 7;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.text("INVOICE", textX, textY);

  const brandBlockH = Math.max(logoMm, textY - startY + 2);
  let y = startY + brandBlockH + metaMarginMm;

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(8);
  pdf.text(`Invoice No: ${invoiceNumber}`, leftX, y);
  y += 3.5;
  pdf.text(`GST: ${COMPANY_INVOICE_HEADER.gstin}`, leftX, y);
  pdf.text(`Date: ${formatInvoiceDateDisplay(invoiceDate)}`, rightX, y, { align: "right" });
  y += 4;

  pdf.setLineWidth(0.3);
  pdf.line(leftX, y, PAGE_W - MARGIN.right, y);
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

  if (document.invoiceType === "na") {
    pdf.setFont(PDF_FONT, "bold");
    pdf.text("Type:", colMid, rightY);
    pdf.setFont(PDF_FONT, "normal");
    pdf.text(document.subType, colMid + 22, rightY, { maxWidth: rightX - colMid - 22 });
    rightY += lineHeight;
  }

  const location: InvoiceLocationFields = {
    district: document.district?.trim() ?? "",
    taluk: document.taluk?.trim() ?? "",
    village: document.village?.trim() ?? "",
    hobbli: document.hobbli?.trim() ?? "",
  };

  let y = Math.max(leftY, rightY);
  if (hasInvoiceLocation(location)) {
    const metaY = y + 2.5;
    const entries = invoiceLocationEntries(location);
    const quarter = CONTENT_W / Math.max(entries.length, 1);
    entries.forEach(({ label, value }, index) => {
      pdf.text(`${label}: ${value}`, MARGIN.left + quarter * index, metaY, {
        maxWidth: quarter - 2,
      });
    });
    y = metaY + lineHeight + 1;
  } else {
    y += 2;
  }

  y = Math.max(y, rightY);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN.left, y + 1, PAGE_W - MARGIN.right, y + 1);
  return y + 5;
}

function drawPageFooter(pdf: jsPDF, pageNumber: number, pageCount: number) {
  const footerY = PAGE_H - MARGIN.bottom;
  pdf.setFontSize(7);
  pdf.setFont(PDF_FONT, "normal");
  pdf.setTextColor(0, 0, 0);
  const footerStartY = footerY - 6.5;
  COMPANY_INVOICE_HEADER.footerAddressLines.forEach((line, index) => {
    pdf.text(line, PAGE_W / 2, footerStartY + index * 2.6, {
      align: "center",
      maxWidth: CONTENT_W,
    });
  });
  if (pageCount > 1) {
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${pageNumber} of ${pageCount}`, PAGE_W - MARGIN.right, footerY, {
      align: "right",
    });
    pdf.setTextColor(0, 0, 0);
  }
}

async function generateNaInvoicePdf(document: InvoiceDocumentData) {
  const prepared = prepareNaInvoiceDocument(document);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as JsPdfWithAutoTable;

  let y = await drawCompanyHeader(pdf, prepared.invoiceDate, prepared.invoiceNumber, MARGIN.top);
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

/** Service invoice PDF — aligned with on-screen print layout (no type/status). */
async function generateServiceInvoicePdf(document: InvoiceDocumentData) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as JsPdfWithAutoTable;

  let y = await drawCompanyHeader(pdf, document.invoiceDate, document.invoiceNumber, MARGIN.top);
  y = drawBillToSection(pdf, document, y);

  const tableBody = document.lines.map((line, index) => [
    String(index + 1),
    line.description || line.farmerName || "",
    formatInvoiceMoney(invoiceLineTaxableAmount(line)),
  ]);

  autoTable(pdf, {
    startY: y,
    margin: { left: MARGIN.left, right: MARGIN.right, top: MARGIN.top, bottom: 22 },
    tableWidth: CONTENT_W,
    head: [["Sl No", "Description", "Amount"]],
    body: tableBody,
    foot: [
      [
        { content: "", colSpan: 1 },
        { content: "Subtotal", styles: { halign: "right", fontStyle: "bold" } },
        { content: formatInvoiceMoney(document.totals.subtotal), styles: { halign: "right" } },
      ],
      [
        { content: "", colSpan: 1 },
        { content: "SGST (9%)", styles: { halign: "right" } },
        { content: formatInvoiceMoney(document.totals.sgst), styles: { halign: "right" } },
      ],
      [
        { content: "", colSpan: 1 },
        { content: "CGST (9%)", styles: { halign: "right" } },
        { content: formatInvoiceMoney(document.totals.cgst), styles: { halign: "right" } },
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
    styles: {
      font: PDF_FONT,
      fontSize: 8,
      cellPadding: 1.5,
      overflow: "linebreak",
    },
    headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 130 },
      2: { cellWidth: 36, halign: "right" },
    },
    theme: "grid",
  });

  let endY = (pdf.lastAutoTable?.finalY ?? y) + 4;
  if (document.totalAmountWords) {
    pdf.setFontSize(7.5);
    pdf.text(`Total Amount in Words: ${document.totalAmountWords}`, MARGIN.left, endY, {
      maxWidth: CONTENT_W,
    });
    endY += 6;
  }

  const signY = Math.min(endY + 12, PAGE_H - MARGIN.bottom - 28);
  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(8);
  pdf.text(`For ${COMPANY_INVOICE_HEADER.signatureName}`, PAGE_W - MARGIN.right, signY, {
    align: "right",
  });
  pdf.setFont(PDF_FONT, "normal");
  pdf.text("Authorized Signatory", PAGE_W - MARGIN.right, signY + 5, { align: "right" });

  drawPageFooter(pdf, 1, 1);
  pdf.save(`${document.invoiceNumber}.pdf`);
}

export async function generateInvoicePdf(document: InvoiceDocumentData) {
  if (document.invoiceType === "na") {
    await generateNaInvoicePdf(document);
    return;
  }
  await generateServiceInvoicePdf(document);
}
