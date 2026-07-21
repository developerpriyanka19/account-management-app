"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { jsPDF as JsPDFType } from "jspdf";
import { drawCompanyBrandHeaderPdf } from "@/lib/company-brand-header-pdf";
import { drawCompanyDocumentFooterPdf } from "@/lib/company-document-footer-pdf";
import {
  ensureVerticalSpace,
  PDF_A4_PORTRAIT,
  PDF_FONT,
  PDF_MARGIN,
  PDF_TABLE_BOTTOM_MARGIN,
  pdfContentWidth,
  drawFootersOnAllPages,
} from "@/lib/company-document-pdf-shared";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import { toDisplayDate } from "@/lib/date-format";
import type {
  AtlPoaRow,
  DebitNotePayload,
  LandConversionRow,
} from "@/lib/debit-note-types";
import { DebitNoteType, isK2ChallanDebitNote, isLandConversionOnly } from "@/lib/debit-note-types";
import {
  k2RowFee,
  normalizeAcresGuntas,
} from "@/lib/farmer-debit-note-row";
import {
  invoiceLocationEntries,
  locationFromCustomer,
} from "@/lib/invoice-location";

type JsPdfWithAutoTable = JsPDFType & { lastAutoTable?: { finalY: number } };

export type DebitNotePdfContext = {
  customerName: string;
  gstNumber: string;
  address: string;
  addressLines?: string[];
};

function debitNotePurposeTitle(type: DebitNoteType, village: string): string {
  const place = village?.trim() || "—";
  switch (type) {
    case DebitNoteType.LEASE_DEED_EXECUTION:
    case DebitNoteType.SERVICE_ORDER:
      return `Reimbursement of amount ${place} Farmers Lease Deeds Registration Fee and Stamp Duty Charges.`;
    case DebitNoteType.ATL_POA:
      return `Reimbursement of amount ${place} Farmers ATL and POA/GPA Charges.`;
    case DebitNoteType.LAND_CONVERSION:
    default:
      return `Reimbursement of ${place} Land Conversions Fee, Podi Fee and Other Recoveries Fee`;
  }
}

function drawLocationTable(
  pdf: JsPdfWithAutoTable,
  data: DebitNotePayload,
  pageWidth: number,
  startY: number,
  fontSize = 8,
): number {
  const entries = invoiceLocationEntries(
    locationFromCustomer({
      village: data.village,
      hobbli: data.hobbli,
      taluk: data.taluk,
      district: data.district,
      state: data.state,
    }),
  );
  if (entries.length === 0) return startY;

  const contentW = pdfContentWidth(pageWidth);
  autoTable(pdf, {
    startY,
    margin: { left: PDF_MARGIN.left, right: PDF_MARGIN.right },
    tableWidth: contentW,
    body: [entries.map(({ label, value }) => `${label}: ${value}`)],
    styles: {
      font: PDF_FONT,
      fontSize,
      fontStyle: "bold",
      cellPadding: 2.5,
      halign: "center",
      valign: "middle",
      overflow: "linebreak",
      lineWidth: 0.2,
      lineColor: [0, 0, 0] as [number, number, number],
      fillColor: [255, 255, 255] as [number, number, number],
      textColor: [0, 0, 0] as [number, number, number],
    },
    columnStyles: buildScaledColumnStyles(
      entries.map(() => 1),
      contentW,
      entries.map(() => "center"),
    ),
    theme: "grid",
  });

  return (pdf.lastAutoTable?.finalY ?? startY) + 4;
}

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
    minimumFractionDigits: 0,
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

function tableBaseStyles(fontSize: number) {
  return {
    font: PDF_FONT,
    fontSize,
    cellPadding: 1.4,
    overflow: "linebreak" as const,
    valign: "middle" as const,
    lineWidth: 0.2,
    lineColor: [0, 0, 0] as [number, number, number],
    fillColor: [255, 255, 255] as [number, number, number],
    fontStyle: "normal" as const,
  };
}

/** Page 2 farmer detail tables — readable type that fits A4 portrait width. */
const DETAIL_TABLE_BODY_FONT = 7.5;
const DETAIL_TABLE_HEAD_FONT = 7;
const DETAIL_TABLE_CELL_PADDING = 2;
const DETAIL_TABLE_MIN_CELL_HEIGHT = 8;

type ColumnAlign = "left" | "center" | "right";

/** Scale relative column weights to exactly fit the printable table width. */
function buildScaledColumnStyles(
  weights: number[],
  totalWidth: number,
  alignments: (ColumnAlign | undefined)[] = [],
): Record<number, { cellWidth: number; halign?: ColumnAlign; minCellHeight: number }> {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const styles: Record<number, { cellWidth: number; halign?: ColumnAlign; minCellHeight: number }> =
    {};
  let used = 0;
  weights.forEach((weight, index) => {
    const isLast = index === weights.length - 1;
    const cellWidth = isLast
      ? Math.max(totalWidth - used, 4)
      : Math.floor(((weight / weightSum) * totalWidth) * 10) / 10;
    used += cellWidth;
    const align = alignments[index];
    styles[index] = {
      cellWidth,
      minCellHeight: DETAIL_TABLE_MIN_CELL_HEIGHT,
      ...(align ? { halign: align } : {}),
    };
  });
  return styles;
}

function detailTableStyles() {
  return {
    ...tableBaseStyles(DETAIL_TABLE_BODY_FONT),
    cellPadding: DETAIL_TABLE_CELL_PADDING,
    minCellHeight: DETAIL_TABLE_MIN_CELL_HEIGHT,
    overflow: "linebreak" as const,
  };
}

function detailTableHeadStyles() {
  return {
    fontStyle: "bold" as const,
    fontSize: DETAIL_TABLE_HEAD_FONT,
    halign: "center" as const,
    fillColor: [255, 255, 255] as [number, number, number],
    textColor: [0, 0, 0] as [number, number, number],
    valign: "middle" as const,
    overflow: "linebreak" as const,
    cellPadding: DETAIL_TABLE_CELL_PADDING,
  };
}

function detailTableAutoTableOptions(contentWidth: number) {
  return {
    tableWidth: contentWidth,
    styles: detailTableStyles(),
    headStyles: detailTableHeadStyles(),
    bodyStyles: {
      fontSize: DETAIL_TABLE_BODY_FONT,
      overflow: "linebreak" as const,
      cellPadding: DETAIL_TABLE_CELL_PADDING,
    },
    theme: "grid" as const,
    showHead: "everyPage" as const,
    rowPageBreak: "avoid" as const,
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
    showPageNumbers: pageCount > 1,
  });
}

function drawPage1Header(
  pdf: JsPDFType,
  logoDataUrl: string,
  pageWidth: number,
): number {
  return drawCompanyBrandHeaderPdf({
    pdf,
    logoDataUrl,
    documentTitle: "",
    pageWidth,
    leftMargin: PDF_MARGIN.left,
    rightMargin: PDF_MARGIN.right,
    startY: PDF_MARGIN.top,
    includeDocumentTitle: false,
    includeCompanyName: true,
    afterLineGapMm: 5,
  });
}

function drawContinuationLogoHeader(
  pdf: JsPDFType,
  logoDataUrl: string,
  pageWidth: number,
): number {
  return drawCompanyBrandHeaderPdf({
    pdf,
    logoDataUrl,
    documentTitle: "",
    pageWidth,
    leftMargin: PDF_MARGIN.left,
    rightMargin: PDF_MARGIN.right,
    startY: PDF_MARGIN.top,
    includeDocumentTitle: false,
    includeCompanyName: false,
    includeDivider: false,
    afterLineGapMm: 8,
  });
}

function drawDebitNotePage1Intro(
  pdf: JsPDFType,
  data: DebitNotePayload,
  ctx: DebitNotePdfContext,
  pageWidth: number,
  startY: number,
  options?: { showRefNo?: boolean },
): number {
  const leftX = PDF_MARGIN.left;
  const rightX = pageWidth - PDF_MARGIN.right;
  const contentW = pdfContentWidth(pageWidth);
  let y = startY;
  const displayDate = toDisplayDate(data.date) || data.date;
  const purpose = debitNotePurposeTitle(data.type, data.village);

  if (options?.showRefNo !== false) {
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(9);
    pdf.text("Ref. No.", leftX, y);
    pdf.text(`Date : ${displayDate}`, rightX, y, { align: "right" });
    y += 7;
  }

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(14);
  pdf.text("DEBIT NOTE", pageWidth / 2, y, { align: "center" });
  y += 7;

  pdf.setFontSize(10);
  const purposeLines = pdf.splitTextToSize(purpose, contentW);
  pdf.text(purposeLines, pageWidth / 2, y, { align: "center" });
  y += purposeLines.length * 5 + 3;

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(9);
  pdf.text(`Debit Note No: ${data.debitNoteNo}`, leftX, y);
  pdf.text(displayDate, rightX, y, { align: "right" });
  y += 7;

  pdf.text("To,", leftX, y);
  y += 5;
  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(10);
  pdf.text((ctx.customerName || "—").toUpperCase(), leftX, y);
  y += 5;

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(9);
  const addressLines =
    ctx.addressLines && ctx.addressLines.length > 0
      ? ctx.addressLines
      : (ctx.address || "—").split(",").map((s) => s.trim()).filter(Boolean);
  for (const line of addressLines) {
    pdf.text(line, leftX, y);
    y += 4.2;
  }
  y += 4;
  y = drawLocationTable(pdf, data, pageWidth, y, 8);
  y += 2;

  return y;
}

function drawSignatureBlock(
  pdf: JsPDFType,
  pageWidth: number,
  startY: number,
): number {
  const rightX = pageWidth - PDF_MARGIN.right;
  let y = startY + 8;
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(9);
  pdf.text(`For ${COMPANY_INVOICE_HEADER.signatureName}`, rightX, y, { align: "right" });
  y += 16;
  pdf.setFont(PDF_FONT, "bold");
  pdf.text("Proprietor", rightX, y, { align: "right" });
  return y + 4;
}

function finishDebitNotePages(pdf: JsPDFType) {
  drawFootersOnAllPages(pdf, (pageNumber, pageCount) => {
    drawAddressFooter(pdf, pageNumber, pageCount);
  });
}

async function generateLandConversionDebitNotePdf(
  data: DebitNotePayload,
  ctx: DebitNotePdfContext,
  logoDataUrl: string,
): Promise<JsPDFType> {
  const rows = data.rows as LandConversionRow[];
  const totalLc = rows.reduce((s, r) => s + (r.landConversionFee || 0), 0);
  const totalPodi = rows.reduce((s, r) => s + (r.podiFee || 0), 0);
  const totalRecovery = rows.reduce((s, r) => s + (r.recoveryFee || 0), 0);
  const totalAcre = rows.reduce((s, r) => s + (r.acres || 0), 0);
  const totalGunta = rows.reduce((s, r) => s + (r.guntas || 0), 0);
  const hasDetail = rows.length > 0;
  const purpose = debitNotePurposeTitle(data.type, data.village);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as JsPdfWithAutoTable;

  const pageW = PDF_A4_PORTRAIT.width;
  const contentW = pdfContentWidth(pageW);

  let y = drawPage1Header(pdf, logoDataUrl, pageW);
  y = drawDebitNotePage1Intro(pdf, data, ctx, pageW, y);

  autoTable(pdf, {
    startY: y,
    margin: {
      left: PDF_MARGIN.left,
      right: PDF_MARGIN.right,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    tableWidth: contentW,
    head: [
      [
        {
          content: `Debit Note: ${purpose}`,
          colSpan: 3,
          styles: { halign: "center", fontStyle: "bold", fontSize: 8 },
        },
      ],
      [
        { content: "SL. No", styles: { halign: "center", fontStyle: "bold" } },
        {
          content: "Executed of Land Conversions Fee, Podi Fee and Other Recoveries Fee",
          styles: { halign: "center", fontStyle: "bold" },
        },
        { content: "Amount", styles: { halign: "center", fontStyle: "bold" } },
      ],
    ],
    body: [
      ["1", "Total Amount of Land Conversions Fee", formatPdfMoney(totalLc)],
      ["2", "Total Amount of Podi Fee", formatPdfMoney(totalPodi)],
      ["3", "Total Amount of Other Recoveries Fee", formatPdfMoney(totalRecovery)],
      [
        { content: "", styles: { fontStyle: "bold" } },
        { content: "Total Amount", styles: { halign: "center", fontStyle: "bold" } },
        {
          content: `Rs ${formatPdfMoney(data.total)}/-`,
          styles: { halign: "center", fontStyle: "bold" },
        },
      ],
    ],
    styles: tableBaseStyles(9),
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 18, halign: "center" },
      1: { cellWidth: contentW - 55 },
      2: { cellWidth: 37, halign: "center" },
    },
    theme: "grid",
    rowPageBreak: "avoid",
  });

  y = (pdf.lastAutoTable?.finalY ?? y) + 10;
  y = ensureVerticalSpace(pdf, y, 30);
  drawSignatureBlock(pdf, pageW, y);

  if (!hasDetail) {
    finishDebitNotePages(pdf);
    return pdf;
  }

  pdf.addPage("a4", "portrait");
  const landW = PDF_A4_PORTRAIT.width;
  const landContentW = pdfContentWidth(landW);
  let ly = drawContinuationLogoHeader(pdf, logoDataUrl, landW);

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(10);
  const purposeLines = pdf.splitTextToSize(purpose, landContentW);
  pdf.text(purposeLines, landW / 2, ly, { align: "center" });
  ly += purposeLines.length * 5 + 3;
  ly = drawLocationTable(pdf, data, landW, ly, 8);

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
    { content: "Totals", styles: { fontStyle: "bold", halign: "right" } } as unknown as string,
    "",
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
        drawContinuationLogoHeader(pdf, logoDataUrl, landW);
      }
    },
    ...detailTableAutoTableOptions(landContentW),
    head: [
      [
        "Sl\nNo",
        "Farmer\nName",
        "Survey\nNo",
        "NA Extent\nAcre",
        "Gunta",
        "Land Conversion\nChallan Ref No",
        "Land Conversion\nFee",
        "Podi Fee\nChallan Ref No",
        "Podi\nFee",
        "Other Recoveries\nChallan Ref No",
        "Other Recoveries\nFee",
      ],
    ],
    body: detailBody,
    columnStyles: buildScaledColumnStyles(
      [1, 5, 2, 2, 1.5, 4, 2.5, 3.5, 2, 4, 2.5],
      landContentW,
      ["center", "left", "center", "center", "center", "left", "center", "left", "center", "left", "center"],
    ),
  });

  let endY = (pdf.lastAutoTable?.finalY ?? ly) + 6;
  endY = ensureVerticalSpace(pdf, endY, 28);
  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(9);
  pdf.text(
    `TOTAL AMOUNT Rs ${formatPdfMoney(data.total)}/-`,
    landW - PDF_MARGIN.right,
    endY,
    { align: "right" },
  );
  drawSignatureBlock(pdf, landW, endY + 2);
  finishDebitNotePages(pdf);
  return pdf;
}

async function generateLeaseDeedExecutionDebitNotePdf(
  data: DebitNotePayload,
  ctx: DebitNotePdfContext,
  logoDataUrl: string,
): Promise<JsPDFType> {
  const rows = data.rows as LandConversionRow[];
  const totalFee = rows.reduce((s, r) => s + k2RowFee(r), 0);
  const purpose = debitNotePurposeTitle(data.type, data.village);
  const hasDetail = rows.length > 0;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as JsPdfWithAutoTable;

  const pageW = PDF_A4_PORTRAIT.width;
  const contentW = pdfContentWidth(pageW);

  let y = drawPage1Header(pdf, logoDataUrl, pageW);
  y = drawDebitNotePage1Intro(pdf, data, ctx, pageW, y);

  autoTable(pdf, {
    startY: y,
    margin: {
      left: PDF_MARGIN.left,
      right: PDF_MARGIN.right,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    tableWidth: contentW,
    head: [
      [
        {
          content: `Debit Note: ${purpose}`,
          colSpan: 3,
          styles: { halign: "center", fontStyle: "bold", fontSize: 8 },
        },
      ],
      [
        { content: "SL. No", styles: { halign: "center", fontStyle: "bold" } },
        {
          content: "Executed of Lease Deeds",
          styles: { halign: "center", fontStyle: "bold" },
        },
        { content: "Amount", styles: { halign: "center", fontStyle: "bold" } },
      ],
    ],
    body: [
      ["1", "Total Amount of Lease Deeds", formatPdfMoney(totalFee || data.total)],
      [
        { content: "", styles: { fontStyle: "bold" } },
        { content: "Total Amount", styles: { halign: "center", fontStyle: "bold" } },
        {
          content: `Rs ${formatPdfMoney(totalFee || data.total)}/-`,
          styles: { halign: "center", fontStyle: "bold" },
        },
      ],
    ],
    styles: tableBaseStyles(9),
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 18, halign: "center" },
      1: { cellWidth: contentW - 55 },
      2: { cellWidth: 37, halign: "center" },
    },
    theme: "grid",
    rowPageBreak: "avoid",
  });

  y = (pdf.lastAutoTable?.finalY ?? y) + 10;
  y = ensureVerticalSpace(pdf, y, 30);
  drawSignatureBlock(pdf, pageW, y);

  if (!hasDetail) {
    finishDebitNotePages(pdf);
    return pdf;
  }

  pdf.addPage("a4", "portrait");
  let py = drawContinuationLogoHeader(pdf, logoDataUrl, pageW);

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(10);
  const purposeLines = pdf.splitTextToSize(purpose, contentW);
  pdf.text(purposeLines, pageW / 2, py, { align: "center" });
  py += purposeLines.length * 5 + 3;
  py = drawLocationTable(pdf, data, pageW, py, 8);

  const sumRtcAcre = rows.reduce((s, r) => s + (r.rtcAcre ?? r.acres ?? 0), 0);
  const sumRtcGunta = rows.reduce((s, r) => s + (r.rtcGunta ?? r.guntas ?? 0), 0);
  const sumLeaseAcre = rows.reduce((s, r) => s + (r.leaseAcre ?? r.acres ?? 0), 0);
  const sumLeaseGunta = rows.reduce((s, r) => s + (r.leaseGunta ?? r.guntas ?? 0), 0);

  const detailBody = rows.map((r, i) => {
    const fee = k2RowFee(r);
    return [
      String(i + 1),
      r.farmerName || "—",
      r.surveyNo || "—",
      formatPdfNum(r.rtcAcre ?? r.acres),
      formatPdfNum(r.rtcGunta ?? r.guntas),
      formatPdfNum(r.leaseAcre ?? r.acres),
      formatPdfNum(r.leaseGunta ?? r.guntas),
      formatPdfMoney(fee),
    ];
  });

  detailBody.push([
    "",
    { content: "Totals", styles: { fontStyle: "bold", halign: "right" } } as unknown as string,
    "",
    formatPdfNum(sumRtcAcre),
    formatPdfNum(sumRtcGunta),
    formatPdfNum(sumLeaseAcre),
    formatPdfNum(sumLeaseGunta),
    formatPdfMoney(totalFee || data.total),
  ]);

  autoTable(pdf, {
    startY: py,
    margin: {
      left: PDF_MARGIN.left,
      right: PDF_MARGIN.right,
      top: 36,
      bottom: PDF_TABLE_BOTTOM_MARGIN + 4,
    },
    didDrawPage: (hook) => {
      if (hook.pageNumber > 1) {
        let hy = drawContinuationLogoHeader(pdf, logoDataUrl, pageW);
        pdf.setFont(PDF_FONT, "bold");
        pdf.setFontSize(9);
        const pLines = pdf.splitTextToSize(purpose, contentW);
        pdf.text(pLines, pageW / 2, hy, { align: "center" });
        hy += pLines.length * 4.5 + 2;
        drawLocationTable(pdf, data, pageW, hy, 8);
      }
    },
    ...detailTableAutoTableOptions(contentW),
    head: [
      [
        { content: "Sl.\nNo", rowSpan: 2 },
        { content: "Name of\nthe Farmers", rowSpan: 2 },
        { content: "Survey\nNo", rowSpan: 2 },
        { content: "RTC Extent", colSpan: 2 },
        { content: "Lease Extent", colSpan: 2 },
        { content: "Lease Deeds k2\nChallan Govt Fees", rowSpan: 2 },
      ],
      ["Acres", "Guntas", "Acres", "Guntas"],
    ],
    body: detailBody,
    columnStyles: buildScaledColumnStyles(
      [1.2, 5, 2.2, 1.5, 1.5, 1.5, 1.5, 2.5],
      contentW,
      ["center", "left", "center", "center", "center", "center", "center", "center"],
    ),
  });

  let endY = (pdf.lastAutoTable?.finalY ?? py) + 4;
  const normLease = normalizeAcresGuntas(sumLeaseAcre, sumLeaseGunta);
  const summaryText = `TOTAL LEASE LAND EXTENSION ${formatPdfNum(normLease.acres)} ACRES ${String(normLease.gunta).padStart(2, "0")} GUNTAS AND TOTAL AMOUNT ${formatPdfMoney(totalFee || data.total)}/-`;
  const summaryNeed = 10 + 28;
  endY = ensureVerticalSpace(pdf, endY, summaryNeed);

  autoTable(pdf, {
    startY: endY,
    margin: {
      left: PDF_MARGIN.left,
      right: PDF_MARGIN.right,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    tableWidth: contentW,
    body: [[{ content: summaryText, styles: { fontStyle: "bold", halign: "center", fontSize: 8 } }]],
    styles: tableBaseStyles(8),
    theme: "grid",
    rowPageBreak: "avoid",
  });

  endY = (pdf.lastAutoTable?.finalY ?? endY) + 4;
  endY = ensureVerticalSpace(pdf, endY, 28);
  drawSignatureBlock(pdf, pageW, endY);
  finishDebitNotePages(pdf);
  return pdf;
}

async function generateAtlPoaDebitNotePdf(
  data: DebitNotePayload,
  ctx: DebitNotePdfContext,
  logoDataUrl: string,
): Promise<JsPDFType> {
  const rows = data.rows as AtlPoaRow[];
  const totalAtl = rows.reduce((s, r) => s + (r.atlCharges || 0), 0);
  const totalPoa = rows.reduce((s, r) => s + (r.poaCharges || 0), 0);
  const totalCheque = rows.reduce((s, r) => s + (r.chequeAmount || 0), 0);
  const totalCash = rows.reduce((s, r) => s + (r.cashAmount || 0), 0);
  const hasDetail = rows.length > 0;
  const purpose = debitNotePurposeTitle(data.type, data.village);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as JsPdfWithAutoTable;

  const pageW = PDF_A4_PORTRAIT.width;
  const contentW = pdfContentWidth(pageW);

  let y = drawPage1Header(pdf, logoDataUrl, pageW);
  y = drawDebitNotePage1Intro(pdf, data, ctx, pageW, y);

  autoTable(pdf, {
    startY: y,
    margin: {
      left: PDF_MARGIN.left,
      right: PDF_MARGIN.right,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    tableWidth: contentW,
    head: [
      [
        {
          content: `Debit Note: ${purpose}`,
          colSpan: 3,
          styles: {halign: "center", fontStyle: "bold", fontSize: 8 },
        },
      ],
      [
        { content: "SL. No", styles: {halign: "center", fontStyle: "bold" } },
        {
          content: "Executed of ATL & POA (GPA)",
          styles: {halign: "center", fontStyle: "bold" },
        },
        { content: "Amount", styles: {halign: "center", fontStyle: "bold" } },
      ],
    ],
    body: [
      ["1", "Total Amount of ATL", formatPdfMoney(totalAtl)],
      ["2", "Total Amount of POA OR GPA", formatPdfMoney(totalPoa)],
      ["3", "AES Pay To Farmers Cheque And Cash", formatPdfMoney(totalCheque + totalCash)],
      [
        { content: "", styles: { fontStyle: "bold" } },
        { content: "Total Amount", styles: {halign: "center", fontStyle: "bold" } },
        {
          content: `Rs ${formatPdfMoney(data.total)}/-`,
          styles: { halign: "center", fontStyle: "bold" },
        },
      ],
    ],
    styles: tableBaseStyles(9),
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 18,halign: "center" },
      1: { cellWidth: contentW - 55 },
      2: { cellWidth: 37, halign: "center" },
    },
    theme: "grid",
    rowPageBreak: "avoid",
  });

  y = (pdf.lastAutoTable?.finalY ?? y) + 10;
  y = ensureVerticalSpace(pdf, y, 30);
  drawSignatureBlock(pdf, pageW, y);

  if (!hasDetail) {
    finishDebitNotePages(pdf);
    return pdf;
  }

  pdf.addPage("a4", "portrait");
  const landW = PDF_A4_PORTRAIT.width;
  let ly = drawContinuationLogoHeader(pdf, logoDataUrl, landW);

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(10);
  const purposeLines = pdf.splitTextToSize(purpose, pdfContentWidth(landW));
  pdf.text(purposeLines, landW / 2, ly, { align: "center" });
  ly += purposeLines.length * 5 + 3;
  ly = drawLocationTable(pdf, data, landW, ly, 8);

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
    toDisplayDate(r.chequeDate) || r.chequeDate || "—",
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

  const atlContentW = pdfContentWidth(landW);

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
        drawContinuationLogoHeader(pdf, logoDataUrl, landW);
      }
    },
    ...detailTableAutoTableOptions(atlContentW),
    head: [
      [
        { content: "Sl\nNo", rowSpan: 2 },
        { content: "Farmer\nName", rowSpan: 2 },
        { content: "Survey\nNo", rowSpan: 2 },
        { content: "RTC Extent", colSpan: 2 },
        { content: "Lease Extent", colSpan: 2 },
        { content: "ATL\nCharges", rowSpan: 2 },
        { content: "POA\nCharges", rowSpan: 2 },
        { content: "AES Pay To Farmers Cheque And Cash", colSpan: 5 },
      ],
      ["Acre", "Gunta", "Acre", "Gunta", "Cheque No", "Date", "Amount", "Bank Name", "Cash"],
    ],
    body: detailBody,
    columnStyles: buildScaledColumnStyles(
      [1, 4.5, 1.8, 1.2, 1.2, 1.2, 1.2, 2, 2, 2, 1.8, 2, 2.5, 1.5],
      atlContentW,
      [
        "center",
        "left",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "left",
        "center",
        "center",
        "left",
        "center",
      ],
    ),
  });

  let endY = (pdf.lastAutoTable?.finalY ?? ly) + 4;
  endY = ensureVerticalSpace(pdf, endY, 28);
  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(8);
  pdf.text(`TOTAL AMOUNT: Rs ${formatPdfMoney(data.total)}/-`, landW - PDF_MARGIN.right, endY, {
    align: "right",
  });
  drawSignatureBlock(pdf, landW, endY + 2);
  finishDebitNotePages(pdf);
  return pdf;
}

export async function buildDebitNotePdf(
  data: DebitNotePayload,
  ctx: DebitNotePdfContext,
): Promise<JsPDFType> {
  const logoDataUrl = await loadLogoDataUrl();
  if (data.type === DebitNoteType.LEASE_DEED_EXECUTION || data.type === DebitNoteType.SERVICE_ORDER) {
    return generateLeaseDeedExecutionDebitNotePdf(data, ctx, logoDataUrl);
  }
  if (isLandConversionOnly(data.type)) {
    return generateLandConversionDebitNotePdf(data, ctx, logoDataUrl);
  }
  return generateAtlPoaDebitNotePdf(data, ctx, logoDataUrl);
}

export async function getDebitNotePdfBlob(
  data: DebitNotePayload,
  ctx: DebitNotePdfContext,
): Promise<Blob> {
  const pdf = await buildDebitNotePdf(data, ctx);
  return pdf.output("blob");
}

export async function generateDebitNotePdf(
  data: DebitNotePayload,
  ctx: DebitNotePdfContext,
): Promise<void> {
  const pdf = await buildDebitNotePdf(data, ctx);
  pdf.save(`${data.debitNoteNo || "debit-note"}.pdf`);
}

export async function printDebitNotePdf(
  data: DebitNotePayload,
  ctx: DebitNotePdfContext,
): Promise<void> {
  const { openPdfBlobInNewTab } = await import("@/lib/pdf-print");
  const blob = await getDebitNotePdfBlob(data, ctx);
  openPdfBlobInNewTab(blob, `${data.debitNoteNo || "debit-note"}.pdf`);
}
