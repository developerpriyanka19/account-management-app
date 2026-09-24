"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { jsPDF as JsPDFType } from "jspdf";
import { drawCompanyBrandHeaderPdf } from "@/lib/company-brand-header-pdf";
import { drawCompanyDocumentFooterPdf } from "@/lib/company-document-footer-pdf";
import {
  closingBlockHeight,
  drawClosingSection,
  ensureVerticalSpace,
  PDF_A4_PORTRAIT,
  PDF_FONT,
  PDF_MARGIN,
  PDF_TABLE_BOTTOM_MARGIN,
  pdfContentLeftX,
  pdfContentRightX,
  pdfContentWidth,
  drawFootersOnAllPages,
} from "@/lib/company-document-pdf-shared";
import type { BankDetailsSnapshot } from "@/lib/bank-details-types";
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
import { amountToIndianWords } from "@/lib/invoice-calculations";
import {
  chunkPdfRows,
  PDF_FARMER_ROWS_PER_PAGE,
} from "@/lib/pdf-table-rows";
import type { RowInput } from "jspdf-autotable";

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
  fontSize = 10,
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
    margin: { left: pdfContentLeftX(), right: PDF_MARGIN.right },
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
    cellPadding: 1.8,
    overflow: "linebreak" as const,
    valign: "middle" as const,
    lineWidth: 0.2,
    lineColor: [0, 0, 0] as [number, number, number],
    fillColor: [255, 255, 255] as [number, number, number],
    fontStyle: "normal" as const,
    minCellHeight: 8,
  };
}

/** Readable body/table type that fits A4 portrait width (~10px equivalent). */
const DETAIL_TABLE_BODY_FONT = 10;
const DETAIL_TABLE_HEAD_FONT = 9;
const DETAIL_TABLE_CELL_PADDING = 2.2;
const DETAIL_TABLE_MIN_CELL_HEIGHT = 9;
const SUMMARY_TABLE_FONT = 10;
const INTRO_BODY_FONT = 10;
const INTRO_TITLE_FONT = 14;

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
      minCellHeight: DETAIL_TABLE_MIN_CELL_HEIGHT,
    },
    theme: "grid" as const,
    showHead: "everyPage" as const,
    rowPageBreak: "avoid" as const,
  };
}

function drawPagedDetailTables(
  pdf: JsPdfWithAutoTable,
  opts: {
    pageWidth: number;
    contentWidth: number;
    startY: number;
    logoDataUrl: string;
    head: RowInput[];
    dataRows: string[][];
    columnStyles: Record<
      number,
      { cellWidth: number; halign?: "left" | "center" | "right"; minCellHeight: number }
    >;
    onPageHeader?: (pageStartY: number) => number;
  },
): number {
  const chunks = chunkPdfRows(opts.dataRows, PDF_FARMER_ROWS_PER_PAGE);
  let y = opts.startY;

  chunks.forEach((chunk, index) => {
    if (index > 0) {
      pdf.addPage("a4", "portrait");
      y = drawContinuationLogoHeader(pdf, opts.logoDataUrl, opts.pageWidth);
      if (opts.onPageHeader) {
        y = opts.onPageHeader(y);
      }
    }

    autoTable(pdf, {
      startY: y,
      margin: {
        left: pdfContentLeftX(),
        right: PDF_MARGIN.right,
        top: 28,
        bottom: PDF_TABLE_BOTTOM_MARGIN,
      },
      ...detailTableAutoTableOptions(opts.contentWidth),
      head: opts.head,
      body: chunk,
      columnStyles: opts.columnStyles,
    });

    y = (pdf.lastAutoTable?.finalY ?? y) + 4;
  });

  return y;
}

/** Totals + amount in words + bank + signature — stays on current page when space allows. */
function drawDebitNoteClosingSummary(
  pdf: JsPdfWithAutoTable,
  opts: {
    pageWidth: number;
    contentWidth: number;
    startY: number;
    totalAmount: number;
    summaryLines?: string[];
    bank?: BankDetailsSnapshot | null;
  },
): number {
  const words = amountToIndianWords(opts.totalAmount);
  const wordLines = pdf.splitTextToSize(words, opts.contentWidth);
  const summaryH = (opts.summaryLines?.length ?? 0) * 5.5;
  const blockH = 10 + summaryH + 20 + wordLines.length * 4.5 + closingBlockHeight(opts.bank);
  let y = ensureVerticalSpace(pdf, opts.startY, blockH);

  if (opts.summaryLines?.length) {
    pdf.setFont(PDF_FONT, "bold");
    pdf.setFontSize(SUMMARY_TABLE_FONT);
    for (const line of opts.summaryLines) {
      pdf.text(line, opts.pageWidth / 2, y, { align: "center" });
      y += 5.5;
    }
    y += 2;
  }

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(SUMMARY_TABLE_FONT);
  pdf.text("Grand Total", pdfContentLeftX(), y);
  pdf.setFontSize(SUMMARY_TABLE_FONT + 1);
  pdf.text(`Rs ${formatPdfMoney(opts.totalAmount)}`, pdfContentLeftX(), y + 5.5);
  y += 13;

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(SUMMARY_TABLE_FONT);
  pdf.text("Amount in Words", pdfContentLeftX(), y);
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(SUMMARY_TABLE_FONT);
  pdf.text(wordLines, pdfContentLeftX(), y + 4.5);
  y += 4.5 + wordLines.length * 4.5 + 4;

  return drawClosingSection(pdf, opts.pageWidth, y, opts.bank, {
    signatoryTitle: "Proprietor",
  });
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
  const leftX = pdfContentLeftX();
  const rightX = pdfContentRightX(pageWidth);
  const contentW = pdfContentWidth(pageWidth);
  let y = startY;
  const displayDate = toDisplayDate(data.date) || data.date;
  const purpose = debitNotePurposeTitle(data.type, data.village);

  if (options?.showRefNo !== false) {
    pdf.setFont(PDF_FONT, "normal");
    pdf.setFontSize(INTRO_BODY_FONT);
    pdf.text("Ref. No.", leftX, y);
    pdf.text(`Date : ${displayDate}`, rightX, y, { align: "right" });
    y += 7;
  }

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(INTRO_TITLE_FONT);
  pdf.text("DEBIT NOTE", pageWidth / 2, y, { align: "center" });
  y += 8;

  pdf.setFontSize(INTRO_BODY_FONT);
  const purposeLines = pdf.splitTextToSize(purpose, contentW);
  pdf.text(purposeLines, pageWidth / 2, y, { align: "center" });
  y += purposeLines.length * 5 + 3;

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(INTRO_BODY_FONT);
  pdf.text(`Debit Note No: ${data.debitNoteNo}`, leftX, y);
  y += 7;

  pdf.text("To,", leftX, y);
  y += 5;
  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(INTRO_BODY_FONT);
  pdf.text((ctx.customerName || "—").toUpperCase(), leftX, y);
  y += 5;

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(INTRO_BODY_FONT);
  const addressLines =
    ctx.addressLines && ctx.addressLines.length > 0
      ? ctx.addressLines
      : (ctx.address || "—").split(",").map((s) => s.trim()).filter(Boolean);
  for (const line of addressLines) {
    pdf.text(line, leftX, y);
    y += 4.5;
  }
  y += 4;
  y = drawLocationTable(pdf, data, pageWidth, y, INTRO_BODY_FONT);
  y += 2;

  return y;
}

function drawDebitNotePage1Closing(
  pdf: JsPDFType,
  pageWidth: number,
  startY: number,
  bank?: BankDetailsSnapshot | null,
): number {
  const y = ensureVerticalSpace(pdf, startY, closingBlockHeight(bank));
  return drawClosingSection(pdf, pageWidth, y, bank, { signatoryTitle: "Proprietor" });
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
      left: pdfContentLeftX(),
      right: PDF_MARGIN.right,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    tableWidth: contentW,
    head: [
      [
        {
          content: `Debit Note: ${purpose}`,
          colSpan: 3,
          styles: { halign: "center", fontStyle: "bold", fontSize: SUMMARY_TABLE_FONT },
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
    styles: tableBaseStyles(SUMMARY_TABLE_FONT),
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
  drawDebitNotePage1Closing(pdf, pageW, y, data.bank);

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
  ly = drawLocationTable(pdf, data, landW, ly, INTRO_BODY_FONT);

  const detailRows = rows.map((r, i) => [
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

  let endY = drawPagedDetailTables(pdf, {
    pageWidth: landW,
    contentWidth: landContentW,
    startY: ly,
    logoDataUrl,
    head: [
      [
        { content: "Sl\nNo", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "Farmer\nName", rowSpan: 2, styles: { valign: "middle" } },
        { content: "Survey\nNo", rowSpan: 2, styles: { valign: "middle" } },
        { content: "NA Extent", colSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "Land Conversion\nChallan Ref No", rowSpan: 2, styles: { valign: "middle" } },
        { content: "Land Conversion\nFee", rowSpan: 2, styles: { valign: "middle" } },
        { content: "Podi Fee\nChallan Ref No", rowSpan: 2, styles: { valign: "middle" } },
        { content: "Podi\nFee", rowSpan: 2, styles: { valign: "middle" } },
        { content: "Other Recoveries\nChallan Ref No", rowSpan: 2, styles: { valign: "middle" } },
        { content: "Other Recoveries\nFee", rowSpan: 2, styles: { valign: "middle" } },
      ],
      [
        { content: "Acres", styles: { halign: "center" } },
        { content: "Guntas", styles: { halign: "center" } },
      ],
    ],
    dataRows: detailRows,
    columnStyles: buildScaledColumnStyles(
      [1, 5, 2, 2, 2, 4, 2.5, 3.5, 2, 4, 2.5],
      landContentW,
      ["center", "left", "center", "center", "center", "left", "center", "left", "center", "left", "center"],
    ),
    onPageHeader: (pageStartY) => {
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(10);
      const pLines = pdf.splitTextToSize(purpose, landContentW);
      pdf.text(pLines, landW / 2, pageStartY, { align: "center" });
      return drawLocationTable(
        pdf,
        data,
        landW,
        pageStartY + pLines.length * 5 + 3,
        INTRO_BODY_FONT,
      );
    },
  });

  drawDebitNoteClosingSummary(pdf, {
    pageWidth: landW,
    contentWidth: landContentW,
    startY: endY,
    totalAmount: data.total,
    bank: data.bank,
    summaryLines: [
      `Total Acres: ${formatPdfNum(totalAcre)}    Total Guntas: ${formatPdfNum(totalGunta)}`,
      `Land Conversion: ${formatPdfMoney(totalLc)}    Podi: ${formatPdfMoney(totalPodi)}    Other Recoveries: ${formatPdfMoney(totalRecovery)}`,
    ],
  });
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
      left: pdfContentLeftX(),
      right: PDF_MARGIN.right,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    tableWidth: contentW,
    head: [
      [
        {
          content: `Debit Note: ${purpose}`,
          colSpan: 3,
          styles: { halign: "center", fontStyle: "bold", fontSize: SUMMARY_TABLE_FONT },
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
    styles: tableBaseStyles(SUMMARY_TABLE_FONT),
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
  drawDebitNotePage1Closing(pdf, pageW, y, data.bank);

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
  py = drawLocationTable(pdf, data, pageW, py, INTRO_BODY_FONT);

  const sumRtcAcre = rows.reduce((s, r) => s + (r.rtcAcre ?? r.acres ?? 0), 0);
  const sumRtcGunta = rows.reduce((s, r) => s + (r.rtcGunta ?? r.guntas ?? 0), 0);
  const sumLeaseAcre = rows.reduce((s, r) => s + (r.leaseAcre ?? r.acres ?? 0), 0);
  const sumLeaseGunta = rows.reduce((s, r) => s + (r.leaseGunta ?? r.guntas ?? 0), 0);

  const detailRows = rows.map((r, i) => {
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

  let endY = drawPagedDetailTables(pdf, {
    pageWidth: pageW,
    contentWidth: contentW,
    startY: py,
    logoDataUrl,
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
    dataRows: detailRows,
    columnStyles: buildScaledColumnStyles(
      [1.2, 5, 2.2, 1.5, 1.5, 1.5, 1.5, 2.5],
      contentW,
      ["center", "left", "center", "center", "center", "center", "center", "center"],
    ),
    onPageHeader: (pageStartY) => {
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(INTRO_BODY_FONT);
      const pLines = pdf.splitTextToSize(purpose, contentW);
      pdf.text(pLines, pageW / 2, pageStartY, { align: "center" });
      return drawLocationTable(
        pdf,
        data,
        pageW,
        pageStartY + pLines.length * 4.5 + 2,
        INTRO_BODY_FONT,
      );
    },
  });

  const normLease = normalizeAcresGuntas(sumLeaseAcre, sumLeaseGunta);
  drawDebitNoteClosingSummary(pdf, {
    pageWidth: pageW,
    contentWidth: contentW,
    startY: endY,
    totalAmount: totalFee || data.total,
    bank: data.bank,
    summaryLines: [
      `TOTAL LEASE LAND EXTENSION ${formatPdfNum(normLease.acres)} ACRES ${String(normLease.gunta).padStart(2, "0")} GUNTAS`,
      `RTC: ${formatPdfNum(sumRtcAcre)} Acres / ${formatPdfNum(sumRtcGunta)} Guntas`,
    ],
  });
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
      left: pdfContentLeftX(),
      right: PDF_MARGIN.right,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    tableWidth: contentW,
    head: [
      [
        {
          content: `Debit Note: ${purpose}`,
          colSpan: 3,
          styles: { halign: "center", fontStyle: "bold", fontSize: SUMMARY_TABLE_FONT },
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
    styles: tableBaseStyles(SUMMARY_TABLE_FONT),
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
  drawDebitNotePage1Closing(pdf, pageW, y, data.bank);

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
  ly = drawLocationTable(pdf, data, landW, ly, INTRO_BODY_FONT);

  const detailRows = rows.map((r, i) => [
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

  const atlContentW = pdfContentWidth(landW);

  let endY = drawPagedDetailTables(pdf, {
    pageWidth: landW,
    contentWidth: atlContentW,
    startY: ly,
    logoDataUrl,
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
    dataRows: detailRows,
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
    onPageHeader: (pageStartY) => {
      pdf.setFont(PDF_FONT, "bold");
      pdf.setFontSize(10);
      const pLines = pdf.splitTextToSize(purpose, atlContentW);
      pdf.text(pLines, landW / 2, pageStartY, { align: "center" });
      return drawLocationTable(
        pdf,
        data,
        landW,
        pageStartY + pLines.length * 5 + 3,
        INTRO_BODY_FONT,
      );
    },
  });

  drawDebitNoteClosingSummary(pdf, {
    pageWidth: landW,
    contentWidth: atlContentW,
    startY: endY,
    totalAmount: data.total,
    bank: data.bank,
    summaryLines: [
      `Total Acres (RTC/Lease): ${formatPdfNum(sumRtcAcre)} / ${formatPdfNum(sumLeaseAcre)}    Guntas: ${formatPdfNum(sumRtcGunta)} / ${formatPdfNum(sumLeaseGunta)}`,
      `ATL: ${formatPdfMoney(totalAtl)}    POA: ${formatPdfMoney(totalPoa)}    Cheque+Cash: ${formatPdfMoney(totalCheque + totalCash)}`,
    ],
  });
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
