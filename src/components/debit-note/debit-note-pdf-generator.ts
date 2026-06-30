"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { jsPDF as JsPDFType } from "jspdf";
import { drawCompanyBrandHeaderPdf } from "@/lib/company-brand-header-pdf";
import { drawCompanyDocumentFooterPdf } from "@/lib/company-document-footer-pdf";
import {
  closingBlockHeight,
  drawClosingSection,
  drawFootersOnAllPages,
  ensureVerticalSpace,
  PDF_A4_LANDSCAPE,
  PDF_A4_PORTRAIT,
  PDF_FONT,
  PDF_MARGIN,
  PDF_TABLE_BOTTOM_MARGIN,
  pdfContentWidth,
} from "@/lib/company-document-pdf-shared";
import type {
  AtlPoaRow,
  DebitNotePayload,
  LandConversionRow,
} from "@/lib/debit-note-types";
import { DebitNoteType } from "@/lib/debit-note-types";

type JsPdfWithAutoTable = JsPDFType & { lastAutoTable?: { finalY: number } };

const TEXT_LINE_H = 3.5;

let logoDataUrlPromise: Promise<string> | null = null;

function loadLogoDataUrl(): Promise<string> {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch("/company-logo.png")
      .then((r) => r.blob())
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

function formatPdfMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatPdfNum(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

type DebitNoteContext = {
  customerName: string;
  gstNumber: string;
  address: string;
};

function drawBrandHeader(
  pdf: JsPDFType,
  logoDataUrl: string,
  pageWidth: number,
  startY: number = PDF_MARGIN.top,
): number {
  return drawCompanyBrandHeaderPdf({
    pdf,
    logoDataUrl,
    documentTitle: "DEBIT NOTE",
    pageWidth,
    leftMargin: PDF_MARGIN.left,
    rightMargin: PDF_MARGIN.right,
    startY,
  });
}

function drawDebitMeta(
  pdf: JsPDFType,
  data: DebitNotePayload,
  ctx: DebitNoteContext,
  pageWidth: number,
  startY: number,
): number {
  const leftX = PDF_MARGIN.left;
  const rightX = pageWidth - PDF_MARGIN.right;
  const contentW = pdfContentWidth(pageWidth);
  let y = startY;

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(7);
  pdf.text(`Debit Note No: ${data.debitNoteNo}`, leftX, y);
  pdf.text(`Date: ${data.date}`, rightX, y, { align: "right" });
  y += 3.5;
  pdf.text(`Customer Name: ${ctx.customerName || "—"}`, leftX, y, { maxWidth: contentW * 0.55 });
  y += 3.5;
  pdf.text(`GST: ${ctx.gstNumber || "—"}`, leftX, y);
  y += 3.5;
  pdf.text(`Address: ${ctx.address || "—"}`, leftX, y, { maxWidth: contentW });
  y += 4;

  const colW = contentW / 4;
  const loc = [
    `Hobli: ${data.hobbli || "—"}`,
    `Village: ${data.village || "—"}`,
    `Taluk: ${data.taluk || "—"}`,
    `District: ${data.district || "—"}`,
  ];
  loc.forEach((text, i) => {
    pdf.text(text, leftX + colW * i, y, { maxWidth: colW - 2 });
  });
  y += 4;

  pdf.setLineWidth(0.2);
  pdf.line(leftX, y, rightX, y);
  return y + 4;
}

function tableBaseStyles(fontSize: number) {
  return {
    font: PDF_FONT,
    fontSize,
    cellPadding: 1,
    overflow: "linebreak" as const,
    valign: "middle" as const,
    lineWidth: 0.1,
    lineColor: [0, 0, 0] as [number, number, number],
    fillColor: [255, 255, 255] as [number, number, number],
    fontStyle: "normal" as const,
  };
}

function drawAddressFooter(pdf: JsPDFType, pageNumber: number, pageCount: number) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  drawCompanyDocumentFooterPdf({
    pdf,
    pageWidth,
    pageHeight,
    contentWidth: pdfContentWidth(pageWidth),
    pageNumber,
    pageCount,
  });
}

function remarksHeight(pdf: JsPDFType, remarks: string | null | undefined, maxWidth: number): number {
  const text = remarks?.trim();
  if (!text) return 0;
  return 4 + pdf.splitTextToSize(text, maxWidth).length * TEXT_LINE_H + 2;
}

function drawRemarks(
  pdf: JsPDFType,
  remarks: string | null | undefined,
  startY: number,
  maxWidth: number,
): number {
  const text = remarks?.trim();
  if (!text) return startY;
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(7);
  pdf.text("Remark:", PDF_MARGIN.left, startY);
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, PDF_MARGIN.left, startY + 3.5);
  return startY + 3.5 + lines.length * TEXT_LINE_H + 2;
}

function finishDebitNotePdf(pdf: JsPDFType, contentEndY: number, pageWidth: number, data: DebitNotePayload) {
  drawClosingSection(pdf, pageWidth, contentEndY, data.bank);
  drawFootersOnAllPages(pdf, (pageNumber, pageCount) => {
    drawAddressFooter(pdf, pageNumber, pageCount);
  });
}

async function generateLandConversionDebitNotePdf(
  data: DebitNotePayload,
  ctx: DebitNoteContext,
  logoDataUrl: string,
): Promise<JsPDFType> {
  const rows = data.rows as LandConversionRow[];
  const totalLc = rows.reduce((s, r) => s + (r.landConversionFee || 0), 0);
  const totalPodi = rows.reduce((s, r) => s + (r.podiFee || 0), 0);
  const totalRecovery = rows.reduce((s, r) => s + (r.recoveryFee || 0), 0);
  const totalAcre = rows.reduce((s, r) => s + (r.acres || 0), 0);
  const totalGunta = rows.reduce((s, r) => s + (r.guntas || 0), 0);
  const hasDetail = rows.length > 0;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as JsPdfWithAutoTable;

  const pageW = PDF_A4_PORTRAIT.width;
  const contentW = pdfContentWidth(pageW);

  let y = drawBrandHeader(pdf, logoDataUrl, pageW);
  y = drawDebitMeta(pdf, data, ctx, pageW, y);

  autoTable(pdf, {
    startY: y,
    margin: {
      left: PDF_MARGIN.left,
      right: PDF_MARGIN.right,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    tableWidth: contentW,
    head: [["Sl No", "Description", "Amount"]],
    body: [
      ["1", "Total Amount of Land Conversion Fee", formatPdfMoney(totalLc)],
      ["2", "Total Amount of Podi Fee", formatPdfMoney(totalPodi)],
      ["3", "Total Amount of Other Recoveries Fee", formatPdfMoney(totalRecovery)],
    ],
    foot: [
      [
        { content: "", colSpan: 1 },
        { content: "Grand Total", styles: { halign: "center", fontStyle: "bold" } },
        {
          content: formatPdfMoney(data.total),
          styles: { halign: "right", fontStyle: "bold" },
        },
      ],
    ],
    styles: tableBaseStyles(8),
    headStyles: { fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: contentW - 50 },
      2: { cellWidth: 36, halign: "right" },
    },
    theme: "grid",
    rowPageBreak: "auto",
  });

  y = (pdf.lastAutoTable?.finalY ?? y) + 4;

  if (!hasDetail) {
    const remarksH = remarksHeight(pdf, data.remarks, contentW);
    y = ensureVerticalSpace(pdf, y, remarksH + closingBlockHeight(data.bank));
    y = drawRemarks(pdf, data.remarks, y, contentW);
    finishDebitNotePdf(pdf, y, pageW, data);
    return pdf;
  }

  if (data.remarks?.trim()) {
    y = drawRemarks(pdf, data.remarks, y, contentW);
  }

  pdf.addPage("a4", "landscape");
  const landW = PDF_A4_LANDSCAPE.width;
  const landContentW = pdfContentWidth(landW);
  let ly = drawBrandHeader(pdf, logoDataUrl, landW);

  const detailBody = rows.map((r, i) => [
    String(i + 1),
    r.farmerName || "—",
    r.surveyNo || "—",
    formatPdfNum(r.acres),
    formatPdfNum(r.guntas),
    r.landConversionChallanRefNo || "—",
    formatPdfMoney(r.landConversionFee || 0),
    r.podiChallanRefNo || "—",
    formatPdfMoney(r.podiFee || 0),
    r.recoveryChallanRefNo || "—",
    formatPdfMoney(r.recoveryFee || 0),
  ]);

  detailBody.push([
    "",
    "",
    "Totals",
    formatPdfNum(totalAcre),
    formatPdfNum(totalGunta),
    "",
    formatPdfMoney(totalLc),
    "",
    formatPdfMoney(totalPodi),
    "",
    formatPdfMoney(totalRecovery),
  ]);

  autoTable(pdf, {
    startY: ly,
    margin: {
      left: PDF_MARGIN.left,
      right: PDF_MARGIN.right,
      top: 28,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    didDrawPage: (hook) => {
      if (hook.pageNumber > 1) {
        drawBrandHeader(pdf, logoDataUrl, landW, PDF_MARGIN.top);
      }
    },
    tableWidth: landContentW,
    head: [
      [
        "Sl No",
        "Farmer Name",
        "Survey No",
        "NA Extent Acre",
        "Gunta",
        "Land Conversion Fee Challan Ref No",
        "Fee",
        "Podi Fee Challan Ref No",
        "Fee",
        "Other Recoveries Challan Ref No",
        "Fee",
      ],
    ],
    body: detailBody,
    styles: tableBaseStyles(6),
    headStyles: { fontStyle: "bold", fontSize: 5.5, halign: "center" },
    bodyStyles: { fontSize: 6 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 22 },
      2: { cellWidth: 14 },
      3: { cellWidth: 14, halign: "right" },
      4: { cellWidth: 12, halign: "right" },
      5: { cellWidth: 28 },
      6: { cellWidth: 16, halign: "right" },
      7: { cellWidth: 22 },
      8: { cellWidth: 14, halign: "right" },
      9: { cellWidth: 28 },
      10: { cellWidth: 14, halign: "right" },
    },
    theme: "grid",
    showHead: "everyPage",
    rowPageBreak: "auto",
  });

  let endY = (pdf.lastAutoTable?.finalY ?? ly) + 4;
  const closingNeed = 6 + closingBlockHeight(data.bank);
  endY = ensureVerticalSpace(pdf, endY, closingNeed);

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(8);
  pdf.text(`Grand Total: ${formatPdfMoney(data.total)}`, landW - PDF_MARGIN.right, endY, {
    align: "right",
  });
  endY += 6;

  finishDebitNotePdf(pdf, endY, landW, data);
  return pdf;
}

async function generateAtlPoaDebitNotePdf(
  data: DebitNotePayload,
  ctx: DebitNoteContext,
  logoDataUrl: string,
): Promise<JsPDFType> {
  const rows = data.rows as AtlPoaRow[];
  const totalAtl = rows.reduce((s, r) => s + (r.atlCharges || 0), 0);
  const totalPoa = rows.reduce((s, r) => s + (r.poaCharges || 0), 0);
  const totalCheque = rows.reduce((s, r) => s + (r.chequeAmount || 0), 0);
  const totalCash = rows.reduce((s, r) => s + (r.cashAmount || 0), 0);
  const hasDetail = rows.length > 0;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as JsPdfWithAutoTable;

  const pageW = PDF_A4_PORTRAIT.width;
  const contentW = pdfContentWidth(pageW);

  let y = drawBrandHeader(pdf, logoDataUrl, pageW);
  y = drawDebitMeta(pdf, data, ctx, pageW, y);

  autoTable(pdf, {
    startY: y,
    margin: {
      left: PDF_MARGIN.left,
      right: PDF_MARGIN.right,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    tableWidth: contentW,
    head: [["SL No", "Executed of ATL & POA (GPA)", "Amount"]],
    body: [
      ["1", "Total Amount of ATL", formatPdfMoney(totalAtl)],
      ["2", "Total Amount of POA OR GPA", formatPdfMoney(totalPoa)],
      ["3", "AES Pay To Farmers Cheque And Cash", formatPdfMoney(totalCheque + totalCash)],
    ],
    foot: [
      [
        { content: "", colSpan: 1 },
        { content: "TOTAL AMOUNT", styles: { halign: "center", fontStyle: "bold" } },
        {
          content: formatPdfMoney(data.total),
          styles: { halign: "right", fontStyle: "bold" },
        },
      ],
    ],
    styles: tableBaseStyles(8),
    headStyles: { fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: contentW - 50 },
      2: { cellWidth: 36, halign: "right" },
    },
    theme: "grid",
    rowPageBreak: "auto",
  });

  y = (pdf.lastAutoTable?.finalY ?? y) + 4;

  if (!hasDetail) {
    const remarksH = remarksHeight(pdf, data.remarks, contentW);
    y = ensureVerticalSpace(pdf, y, remarksH + closingBlockHeight(data.bank));
    y = drawRemarks(pdf, data.remarks, y, contentW);
    finishDebitNotePdf(pdf, y, pageW, data);
    return pdf;
  }

  if (data.remarks?.trim()) {
    y = drawRemarks(pdf, data.remarks, y, contentW);
  }

  pdf.addPage("a4", "landscape");
  const landW = PDF_A4_LANDSCAPE.width;
  let ly = drawBrandHeader(pdf, logoDataUrl, landW);

  const detailBody = rows.map((r, i) => [
    String(i + 1),
    r.farmerName || "—",
    r.surveyNo || "—",
    formatPdfNum(r.rtcAcre),
    formatPdfNum(r.rtcGunta),
    formatPdfNum(r.leaseAcre),
    formatPdfNum(r.leaseGunta),
    formatPdfMoney(r.atlCharges || 0),
    formatPdfMoney(r.poaCharges || 0),
    r.chequeNo || "—",
    r.chequeDate || "—",
    formatPdfMoney(r.chequeAmount || 0),
    r.bankName || "—",
    formatPdfMoney(r.cashAmount || 0),
  ]);

  const sumRtcAcre = rows.reduce((s, r) => s + (r.rtcAcre || 0), 0);
  const sumRtcGunta = rows.reduce((s, r) => s + (r.rtcGunta || 0), 0);
  const sumLeaseAcre = rows.reduce((s, r) => s + (r.leaseAcre || 0), 0);
  const sumLeaseGunta = rows.reduce((s, r) => s + (r.leaseGunta || 0), 0);

  detailBody.push([
    "",
    "",
    "Totals",
    formatPdfNum(sumRtcAcre),
    formatPdfNum(sumRtcGunta),
    formatPdfNum(sumLeaseAcre),
    formatPdfNum(sumLeaseGunta),
    formatPdfMoney(totalAtl),
    formatPdfMoney(totalPoa),
    "",
    "",
    formatPdfMoney(totalCheque),
    "",
    formatPdfMoney(totalCash),
  ]);

  autoTable(pdf, {
    startY: ly,
    margin: {
      left: PDF_MARGIN.left,
      right: PDF_MARGIN.right,
      top: 28,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    didDrawPage: (hook) => {
      if (hook.pageNumber > 1) {
        drawBrandHeader(pdf, logoDataUrl, landW, PDF_MARGIN.top);
      }
    },
    tableWidth: pdfContentWidth(landW),
    head: [
      [
        { content: "Sl No", rowSpan: 2 },
        { content: "Farmer Name", rowSpan: 2 },
        { content: "Survey No", rowSpan: 2 },
        { content: "RTC Extent", colSpan: 2 },
        { content: "Lease Extent", colSpan: 2 },
        { content: "ATL Charges", rowSpan: 2 },
        { content: "POA Charges", rowSpan: 2 },
        { content: "AES Pay To Farmers Cheque And Cash", colSpan: 5 },
      ],
      ["Acre", "Gunta", "Acre", "Gunta", "Cheque No", "Date", "Amount", "Bank Name", "Cash"],
    ],
    body: detailBody,
    styles: tableBaseStyles(5.5),
    headStyles: { fontStyle: "bold", fontSize: 5, halign: "center" },
    bodyStyles: { fontSize: 5.5 },
    theme: "grid",
    showHead: "everyPage",
    rowPageBreak: "auto",
  });

  let endY = (pdf.lastAutoTable?.finalY ?? ly) + 4;
  const closingNeed = 6 + closingBlockHeight(data.bank);
  endY = ensureVerticalSpace(pdf, endY, closingNeed);

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(8);
  pdf.text(`TOTAL AMOUNT: ${formatPdfMoney(data.total)}`, landW - PDF_MARGIN.right, endY, {
    align: "right",
  });
  endY += 6;

  finishDebitNotePdf(pdf, endY, landW, data);
  return pdf;
}

export async function buildDebitNotePdf(
  data: DebitNotePayload,
  ctx: DebitNoteContext,
): Promise<JsPDFType> {
  const logoDataUrl = await loadLogoDataUrl();
  if (data.type === DebitNoteType.LAND_CONVERSION) {
    return generateLandConversionDebitNotePdf(data, ctx, logoDataUrl);
  }
  return generateAtlPoaDebitNotePdf(data, ctx, logoDataUrl);
}

export async function getDebitNotePdfBlob(
  data: DebitNotePayload,
  ctx: DebitNoteContext,
): Promise<Blob> {
  const pdf = await buildDebitNotePdf(data, ctx);
  return pdf.output("blob");
}

export async function generateDebitNotePdf(
  data: DebitNotePayload,
  ctx: DebitNoteContext,
): Promise<void> {
  const pdf = await buildDebitNotePdf(data, ctx);
  pdf.save(`${data.debitNoteNo || "debit-note"}.pdf`);
}

export async function printDebitNotePdf(
  data: DebitNotePayload,
  ctx: DebitNoteContext,
): Promise<void> {
  const { openPdfBlobInNewTab } = await import("@/lib/pdf-print");
  const blob = await getDebitNotePdfBlob(data, ctx);
  openPdfBlobInNewTab(blob, `${data.debitNoteNo || "debit-note"}.pdf`);
}
