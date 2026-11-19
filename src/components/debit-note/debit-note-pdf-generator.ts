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
import {
  buildPdfColumnStyles,
  drawPagedPdfTable,
  PDF_TABLE_BASE_STYLES,
  PDF_TABLE_MIN_CELL_HEIGHT,
  type PdfHAlign,
} from "@/lib/pdf-table-shared";
import type { BankDetailsSnapshot } from "@/lib/bank-details-types";
import { toDisplayDate } from "@/lib/date-format";
import type {
  AtlPoaRow,
  DebitNotePayload,
  LandConversionRow,
} from "@/lib/debit-note-types";
import {
  DebitNoteType,
  isK2ChallanModule,
  isLandConversionLayout,
} from "@/lib/debit-note-types";
import { k2RowFee } from "@/lib/farmer-debit-note-row";
import {
  formatInvoiceLocationLine,
  hasInvoiceLocation,
  locationFromCustomer,
} from "@/lib/invoice-location";
import { amountToIndianWords } from "@/lib/invoice-calculations";
import type { CellDef, RowInput } from "jspdf-autotable";

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
    case DebitNoteType.K2_CHALLAN:
      return `Reimbursement of amount ${place} Farmers K2 Challan Fee and Stamp Duty Charges.`;
    case DebitNoteType.LAND_CONVERSION:
    default:
      return `Reimbursement of ${place} Land Conversions Fee, Podi Fee and Other Recoveries Fee`;
  }
}

/** Fee labels for Land Conversion layout vs K2 Challan module clone. */
function landConversionFeeLabels(type: DebitNoteType) {
  if (isK2ChallanModule(type)) {
    return {
      primaryFeeShort: "K2 Challan Fee",
      primaryFeeLong: "K2 Challan Fee",
      primaryChallan: "K2 Challan Ref No",
      primaryFeeCol: "K2 Challan Fee",
      summaryExecuted:
        "Executed of K2 Challan Fee, Podi Fee and Other Recoveries Fee",
      summaryLine1: "Total Amount of K2 Challan Fee",
    };
  }
  return {
    primaryFeeShort: "Land Conversion Fee",
    primaryFeeLong: "Land Conversions Fee",
    primaryChallan: "Land Conversion Fee Challan Ref No",
    primaryFeeCol: "Land Conversion Fee",
    summaryExecuted:
      "Executed of Land Conversions Fee, Podi Fee and Other Recoveries Fee",
    summaryLine1: "Total Amount of Land Conversions Fee",
  };
}

/** NA Invoice–style single location line (no bordered boxes). */
function drawLocationTable(
  pdf: JsPdfWithAutoTable,
  data: DebitNotePayload,
  pageWidth: number,
  startY: number,
  fontSize = 10,
): number {
  const location = locationFromCustomer({
    village: data.village,
    hobbli: data.hobbli,
    taluk: data.taluk,
    district: data.district,
    state: data.state,
  });
  if (!hasInvoiceLocation(location)) return startY;

  const leftX = pdfContentLeftX();
  const rightX = pdfContentRightX(pageWidth);
  const contentW = pdfContentWidth(pageWidth);
  const line = formatInvoiceLocationLine(location);
  const lineHeight = fontSize * 0.4;

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(fontSize);
  const wrapped = pdf.splitTextToSize(line, contentW);
  pdf.text(wrapped, leftX, startY);
  let y = startY + wrapped.length * lineHeight + 1;
  pdf.setFont(PDF_FONT, "normal");

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.2);
  pdf.line(leftX, y + 1, rightX, y + 1);
  return y + 5;
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
    ...PDF_TABLE_BASE_STYLES,
    fontSize,
    cellPadding: 1.8,
    minCellHeight: PDF_TABLE_MIN_CELL_HEIGHT,
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

type ColumnAlign = PdfHAlign;

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


/** Absolute mm column widths scaled to fill the printable table width. */
function buildAbsoluteColumnStyles(
  widthsMm: number[],
  totalWidth: number,
  alignments: (ColumnAlign | undefined)[] = [],
): Record<number, { cellWidth: number; halign?: ColumnAlign; minCellHeight: number }> {
  const weightSum = widthsMm.reduce((a, b) => a + b, 0);
  return buildScaledColumnStyles(
    widthsMm.map((w) => (weightSum > 0 ? w : 1)),
    totalWidth,
    alignments,
  );
}

/** Land Conversion / K2 detail table column widths (mm) for portrait A4. */
function landConversionDetailWidthsMm(): number[] {
  // Sl, Farmer, Syr, Acres, Guntas, Fee Ref, Fee, Podi Ref, Podi, Other Ref, Other Fee
  // Tuned so Sl No / Acres / Guntas never character-wrap on portrait.
  return [11, 28, 14, 13, 13, 22, 16, 20, 14, 22, 17];
}


/** Two-row detail head height used for capacity estimates. */
const DETAIL_TABLE_HEAD_HEIGHT_MM = 18;
/**
 * Absolute Y where detail tables may start on continuation pages
 * (logo + purpose lines + location line). Kept generous so wrapped purpose
 * text never collides with the table when autoTable page-breaks internally.
 */
const DETAIL_CONTINUATION_TABLE_START_Y_MM = PDF_MARGIN.top + 36 + 18 + 14;

function drawPagedDetailTables(
  pdf: JsPdfWithAutoTable,
  opts: {
    pageWidth: number;
    contentWidth: number;
    startY: number;
    logoDataUrl: string;
    head: RowInput[];
    dataRows: string[][];
    foot?: RowInput[];
    columnStyles: Record<
      number,
      { cellWidth: number;halign?: PdfHAlign; minCellHeight?: number }
    >;
    onPageHeader?: (pageStartY: number) => number;
  },
): number {
  const continuationStartY = DETAIL_CONTINUATION_TABLE_START_Y_MM;
  // Force project-wide center alignment on every detail column.
  const widths = Object.keys(opts.columnStyles)
    .map(Number)
    .sort((a, b) => a - b)
    .map((i) => opts.columnStyles[i]!.cellWidth);
  const centeredColumns = buildPdfColumnStyles(widths, opts.contentWidth);

  return drawPagedPdfTable(pdf, autoTable as never, {
    startY: opts.startY,
    tableWidth: opts.contentWidth,
    margin: {
      left: pdfContentLeftX(),
      right: PDF_MARGIN.right,
      top: continuationStartY,
      bottom: PDF_TABLE_BOTTOM_MARGIN,
    },
    head: opts.head,
    body: opts.dataRows,
    foot: opts.foot,
    columnStyles: centeredColumns,
    continuationStartY,
    pageHeight: PDF_A4_PORTRAIT.height,
    orientation: "portrait",
    tableHeadHeightMm: DETAIL_TABLE_HEAD_HEIGHT_MM,
    rowHeightMm: DETAIL_TABLE_MIN_CELL_HEIGHT,
    footReserveRows: opts.foot?.length ? Math.max(2, opts.foot.length + 1) : 0,
    onNewPage: () => {
      let y = drawContinuationLogoHeader(pdf, opts.logoDataUrl, opts.pageWidth);
      if (opts.onPageHeader) y = opts.onPageHeader(y);
      return y;
    },
  });
}

/** Grand total + amount in words + bank + signature — stays on current page when space allows. */
function drawDebitNoteClosingSummary(
  pdf: JsPdfWithAutoTable,
  opts: {
    pageWidth: number;
    contentWidth: number;
    startY: number;
    totalAmount: number;
    bank?: BankDetailsSnapshot | null;
  },
): number {
  const words = amountToIndianWords(opts.totalAmount);
  const wordLines = pdf.splitTextToSize(words, opts.contentWidth);
  const blockH = 10 + 20 + wordLines.length * 4.5 + closingBlockHeight(opts.bank);
  let y = ensureVerticalSpace(pdf, opts.startY, blockH);

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
  {
    const nameWrapped = pdf.splitTextToSize(
      (ctx.customerName || "—").toUpperCase(),
      contentW,
    ) as string[];
    pdf.text(nameWrapped, leftX, y);
    y += Math.max(1, nameWrapped.length) * 5;
  }

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(INTRO_BODY_FONT);
  const addressLines =
    ctx.addressLines && ctx.addressLines.length > 0
      ? ctx.addressLines
      : (ctx.address || "—").split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
  const addressLineH = 4.5;
  for (const line of addressLines) {
    const wrapped = pdf.splitTextToSize(line, contentW) as string[];
    pdf.text(wrapped, leftX, y);
    y += Math.max(1, wrapped.length) * addressLineH;
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
  const labels = landConversionFeeLabels(data.type);
  const centerBold: CellDef["styles"] = {
    halign: "center",
    valign: "middle",
    fontStyle: "bold",
  };

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
          content: labels.summaryExecuted,
          styles: { halign: "center", fontStyle: "bold" },
        },
        { content: "Amount", styles: { halign: "center", fontStyle: "bold" } },
      ],
    ],
    body: [
      ["1", labels.summaryLine1, formatPdfMoney(totalLc)],
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
      0: { cellWidth: 18,halign: "center" },
      1: { cellWidth: contentW - 55,halign: "center" },
      2: { cellWidth: 37,halign: "center" },
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

  const landW = PDF_A4_PORTRAIT.width;
  const landContentW = pdfContentWidth(landW);
  pdf.addPage("a4", "portrait");
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

  const totalsFoot: RowInput[] = [
    [
      { content: "", styles: centerBold },
      { content: "Total", styles: centerBold },
      { content: "", styles: centerBold },
      { content: formatPdfNum(totalAcre), styles: centerBold },
      { content: formatPdfNum(totalGunta), styles: centerBold },
      { content: "", styles: centerBold },
      { content: formatPdfMoney(totalLc), styles: centerBold },
      { content: "", styles: centerBold },
      { content: formatPdfMoney(totalPodi), styles: centerBold },
      { content: "", styles: centerBold },
      { content: formatPdfMoney(totalRecovery), styles: centerBold },
    ],
  ];

  const centerHead = {halign: "center" as const, valign: "middle" as const };
  let endY = drawPagedDetailTables(pdf, {
    pageWidth: landW,
    contentWidth: landContentW,
    startY: ly,
    logoDataUrl,
    head: [
      [
        { content: "Sl No", rowSpan: 2, styles: centerHead },
        { content: "Farmer Name", rowSpan: 2, styles: centerHead },
        { content: "Syr No", rowSpan: 2, styles: centerHead },
        { content: "NA Extent", colSpan: 2, styles: centerHead },
        { content: labels.primaryChallan, rowSpan: 2, styles: centerHead },
        { content: labels.primaryFeeCol, rowSpan: 2, styles: centerHead },
        { content: "Podi Fee Challan Ref No", rowSpan: 2, styles: centerHead },
        { content: "Podi Fee", rowSpan: 2, styles: centerHead },
        { content: "Other Recoveries Challan Ref No", rowSpan: 2, styles: centerHead },
        { content: "Other Recoveries Fee", rowSpan: 2, styles: centerHead },
      ],
      [
        { content: "Acres", styles: centerHead },
        { content: "Guntas", styles: centerHead },
      ],
    ],
    dataRows: detailRows,
    foot: totalsFoot,
    columnStyles: buildAbsoluteColumnStyles(
      landConversionDetailWidthsMm(),
      landContentW,
      Array(11).fill("center") as ColumnAlign[],
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
      1: { cellWidth: contentW - 55,halign: "center" },
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
        { content: "Syr\nNo", rowSpan: 2, styles: {halign: "center", valign: "middle"} },
        { content: "RTC Extent", colSpan: 2, styles: {halign: "center", valign: "middle"} },
        { content: "Lease Extent", colSpan: 2, styles: {halign: "center", valign: "middle"} },
        { content: "Lease Deeds k2\nChallan Govt Fees", rowSpan: 2, styles: {halign: "center", valign: "middle"} },
      ],
      ["Acres", "Guntas", "Acres", "Guntas"],
    ],
    dataRows: detailRows,
    columnStyles: buildScaledColumnStyles(
      [1.2, 5, 2.2, 1.5, 1.5, 1.5, 1.5, 2.5],
      contentW,
      ["center", "center", "center", "center", "center", "center", "center", "center"],
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

  drawDebitNoteClosingSummary(pdf, {
    pageWidth: pageW,
    contentWidth: contentW,
    startY: endY,
    totalAmount: totalFee || data.total,
    bank: data.bank,
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
      ["3", "AES Pay To Farmers Cheque", formatPdfMoney(totalCheque)],
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
      1: { cellWidth: contentW - 55,halign: "center" },
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
  ]);

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
        { content: "Syr\nNo", rowSpan: 2, styles: {halign: "center", valign: "middle"} },
        { content: "RTC Extent", colSpan: 2, styles: {halign: "center", valign: "middle"} },
        { content: "Lease Extent", colSpan: 2, styles: {halign: "center", valign: "middle"} },
        { content: "ATL\nCharges", rowSpan: 2, styles: {halign: "center", valign: "middle"} },
        { content: "POA\nCharges", rowSpan: 2 },
        { content: "AES Pay To Farmers Cheque", colSpan: 4 },
      ],
      ["Acre", "Gunta", "Acre", "Gunta", "Cheque No", "Date", "Amount", "Bank Name"],
    ],
    dataRows: detailRows,
    columnStyles: buildScaledColumnStyles(
      [1, 4.5, 1.8, 1.2, 1.2, 1.2, 1.2, 2, 2, 2.2, 1.8, 2.2, 2.8],
      atlContentW,
      [
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
        "center",
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
  if (isLandConversionLayout(data.type)) {
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
