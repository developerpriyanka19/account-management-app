import {
  PDF_A4_PORTRAIT,
  PDF_FONT,
  PDF_MARGIN,
  PDF_TABLE_BOTTOM_MARGIN,
  pdfAutoTableMargins,
  pdfContentWidth,
} from "@/lib/company-document-pdf-shared";
import {
  estimatePdfFarmerRowsPerPage,
  packPdfTableRowsWithFoot,
} from "@/lib/pdf-table-rows";
import type { CellDef, RowInput } from "jspdf-autotable";
import type { jsPDF } from "jspdf";

export type PdfHAlign = "left" | "center" | "right";

export type PdfColumnStyle = {
  cellWidth: number;
  halign?: PdfHAlign;
  valign?: "top" | "middle" | "bottom";
  minCellHeight?: number;
  overflow?: "linebreak" | "ellipsize" | "visible" | "hidden";
};

export type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

/** Shared print typography for all invoice / debit-note / quotation tables. */
export const PDF_TABLE_BODY_FONT = 10;
export const PDF_TABLE_HEAD_FONT = 9;
export const PDF_TABLE_CELL_PADDING = 1.8;
export const PDF_TABLE_MIN_CELL_HEIGHT = 8;
export const PDF_TABLE_GROUPED_HEAD_HEIGHT_MM = 16;
/** Gap between continuation-page header content and the table top. */
export const PDF_TABLE_AFTER_HEADER_GAP_MM = 3;
/**
 * Default absolute Y (from page top) where continuation-page tables may start.
 * Callers should prefer the measured Y returned by `onNewPage`.
 */
export const PDF_TABLE_CONTINUATION_TOP_MM = PDF_MARGIN.top + 40;

export const PDF_TABLE_BASE_STYLES = {
  font: PDF_FONT,
  fontSize: PDF_TABLE_BODY_FONT,
  cellPadding: PDF_TABLE_CELL_PADDING,
  overflow: "linebreak" as const,
  valign: "middle" as const,
  halign: "center" as const,
  lineWidth: 0.15,
  lineColor: [0, 0, 0] as [number, number, number],
  fillColor: [255, 255, 255] as [number, number, number],
  fontStyle: "normal" as const,
  minCellHeight: PDF_TABLE_MIN_CELL_HEIGHT,
};

export const PDF_TABLE_HEAD_STYLES = {
  fillColor: [255, 255, 255] as [number, number, number],
  textColor: [0, 0, 0] as [number, number, number],
  lineWidth: 0.2,
  fontStyle: "bold" as const,
  fontSize: PDF_TABLE_HEAD_FONT,
  halign: "center" as const,
  valign: "middle" as const,
  overflow: "linebreak" as const,
  cellPadding: PDF_TABLE_CELL_PADDING,
};

export const PDF_TABLE_BODY_STYLES = {
  fontSize: PDF_TABLE_BODY_FONT,
  fontStyle: "normal" as const,
  halign: "center" as const,
  valign: "middle" as const,
  overflow: "linebreak" as const,
  cellPadding: PDF_TABLE_CELL_PADDING,
  minCellHeight: PDF_TABLE_MIN_CELL_HEIGHT,
  lineWidth: 0.15,
};

export const PDF_TABLE_FOOT_STYLES = {
  fontSize: PDF_TABLE_BODY_FONT,
  fontStyle: "bold" as const,
  halign: "center" as const,
  valign: "middle" as const,
  overflow: "linebreak" as const,
  fillColor: [255, 255, 255] as [number, number, number],
  textColor: [0, 0, 0] as [number, number, number],
  cellPadding: PDF_TABLE_CELL_PADDING,
  minCellHeight: PDF_TABLE_MIN_CELL_HEIGHT,
};

export const PDF_TABLE_AUTOTABLE_LAYOUT = {
  theme: "grid" as const,
  showHead: "everyPage" as const,
  showFoot: "lastPage" as const,
  horizontalPageBreak: false,
  rowPageBreak: "avoid" as const,
};

export function pdfTableContentWidth(pageWidth: number = PDF_A4_PORTRAIT.width): number {
  return pdfContentWidth(pageWidth);
}

export function pdfTableMargins(topMm?: number) {
  return pdfAutoTableMargins(topMm);
}

/** Scale relative weights or absolute mm widths to exactly fill `totalWidth`. */
export function scalePdfColumnWidths(
  widthsOrWeights: number[],
  totalWidth: number,
): number[] {
  const sum = widthsOrWeights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || totalWidth <= 0) {
    return widthsOrWeights.map(() => Math.max(totalWidth / Math.max(widthsOrWeights.length, 1), 4));
  }
  const scaled: number[] = [];
  let used = 0;
  widthsOrWeights.forEach((w, index) => {
    const isLast = index === widthsOrWeights.length - 1;
    const cellWidth = isLast
      ? Math.max(totalWidth - used, 4)
      : Math.floor(((w / sum) * totalWidth) * 10) / 10;
    used += cellWidth;
    scaled.push(cellWidth);
  });
  return scaled;
}

/**
 * Build jspdf-autotable columnStyles. Default alignment is center for every column
 * (project-wide PDF table rule).
 */
export function buildPdfColumnStyles(
  widthsOrWeights: number[],
  totalWidth: number,
  alignments?: (PdfHAlign | undefined)[],
  minCellHeight: number = PDF_TABLE_MIN_CELL_HEIGHT,
): Record<number, PdfColumnStyle> {
  const widths = scalePdfColumnWidths(widthsOrWeights, totalWidth);
  const styles: Record<number, PdfColumnStyle> = {};
  widths.forEach((cellWidth, index) => {
    styles[index] = {
      cellWidth,
      minCellHeight,
      halign: alignments?.[index] ?? "center",
      valign: "middle",
      overflow: "linebreak",
    };
  });
  return styles;
}

/** Force every column style to center (preserves widths). */
export function withCenteredPdfColumns(
  columnStyles: Record<number, { cellWidth: number; halign?: PdfHAlign; minCellHeight?: number }>,
): Record<number, PdfColumnStyle> {
  const out: Record<number, PdfColumnStyle> = {};
  for (const [key, col] of Object.entries(columnStyles)) {
    out[Number(key)] = {
      cellWidth: col.cellWidth,
      minCellHeight: col.minCellHeight ?? PDF_TABLE_MIN_CELL_HEIGHT,
      halign: "center",
      valign: "middle",
      overflow: "linebreak",
    };
  }
  return out;
}

/** Centered cell helper for heads / feet / totals. */
export function centerPdfCell(
  content: string | number,
  extra?: CellDef["styles"],
): CellDef {
  return {
    content: String(content),
    styles: {
      halign: "center",
      valign: "middle",
      overflow: "linebreak",
      ...extra,
    },
  };
}

export function centerPdfHeadCell(
  content: string,
  opts?: { rowSpan?: number; colSpan?: number; fontSize?: number; fontStyle?: "bold" | "normal" },
): CellDef {
  const cell: CellDef = {
    content,
    styles: {
      halign: "center",
      valign: "middle",
      overflow: "linebreak",
      fontStyle: opts?.fontStyle ?? "bold",
      ...(opts?.fontSize != null ? { fontSize: opts.fontSize } : {}),
    },
  };
  if (opts?.rowSpan) cell.rowSpan = opts.rowSpan;
  if (opts?.colSpan) cell.colSpan = opts.colSpan;
  return cell;
}

export type DrawPagedPdfTableOptions = {
  startY: number;
  tableWidth: number;
  margin: { left: number; right: number; top?: number; bottom?: number };
  head: RowInput[];
  body: string[][] | RowInput[];
  foot?: RowInput[];
  columnStyles: Record<number, PdfColumnStyle>;
  /** Y after continuation header on subsequent pages. */
  continuationStartY: number;
  pageHeight?: number;
  orientation?: "portrait" | "landscape";
  tableHeadHeightMm?: number;
  rowHeightMm?: number;
  footReserveRows?: number;
  /** Called when a new page is added (after page 1). Return start Y for the table. */
  onNewPage?: () => number;
  /** Optional didDrawPage hook (e.g. continuation header when autotable overflows a chunk). */
  didDrawPage?: (data: { pageNumber: number }) => void;
};

/**
 * Shared paged autoTable draw: height-based packing, repeated heads, foot on last page only.
 * Used by invoices, debit notes, and quotations.
 *
 * Continuation pages always reserve `continuationStartY` (and the measured `onNewPage`
 * return value) so the table never overlaps logos/titles. `margin.top` is forced to that
 * reserved band so any internal autoTable page-break also clears the header.
 */
export function drawPagedPdfTable(
  pdf: JsPdfWithAutoTable,
  autoTableFn: (doc: JsPdfWithAutoTable, opts: Record<string, unknown>) => void,
  opts: DrawPagedPdfTableOptions,
): number {
  const pageHeight = opts.pageHeight ?? PDF_A4_PORTRAIT.height;
  const orientation = opts.orientation ?? "portrait";
  const headH = opts.tableHeadHeightMm ?? PDF_TABLE_GROUPED_HEAD_HEIGHT_MM;
  const rowH = opts.rowHeightMm ?? PDF_TABLE_MIN_CELL_HEIGHT;
  const footReserve = opts.footReserveRows ?? (opts.foot?.length ? opts.foot.length + 1 : 0);
  /** Absolute Y from page top — never start table content above this on continuation pages. */
  const reservedTopMm = Math.max(
    opts.continuationStartY,
    opts.margin.top ?? 0,
    PDF_MARGIN.top + PDF_TABLE_AFTER_HEADER_GAP_MM,
  );

  const firstPageCapacity = estimatePdfFarmerRowsPerPage({
    pageHeight,
    contentStartY: opts.startY,
    bottomMargin: PDF_TABLE_BOTTOM_MARGIN,
    tableHeadHeight: headH,
    rowHeight: rowH,
  });
  const nextPageCapacity = estimatePdfFarmerRowsPerPage({
    pageHeight,
    contentStartY: reservedTopMm,
    bottomMargin: PDF_TABLE_BOTTOM_MARGIN,
    tableHeadHeight: headH,
    rowHeight: rowH,
  });

  const chunks = packPdfTableRowsWithFoot({
    rows: opts.body as unknown[],
    firstPageCapacity,
    nextPageCapacity,
    lastPageFootReserveRows: footReserve,
  }) as typeof opts.body[];

  let y = opts.startY;

  chunks.forEach((chunk, index) => {
    const isLast = index === chunks.length - 1;
    if (index > 0) {
      pdf.addPage("a4", orientation);
      const headerEndY = opts.onNewPage ? opts.onNewPage() : reservedTopMm;
      y = Math.max(headerEndY + PDF_TABLE_AFTER_HEADER_GAP_MM, reservedTopMm);
    }

    autoTableFn(pdf, {
      startY: y,
      margin: {
        left: opts.margin.left,
        right: opts.margin.right,
        // Critical: internal autoTable page-breaks use margin.top — must clear the header.
        top: reservedTopMm,
        bottom: opts.margin.bottom ?? PDF_TABLE_BOTTOM_MARGIN,
      },
      tableWidth: opts.tableWidth,
      head: opts.head,
      body: chunk,
      foot: isLast && opts.foot ? opts.foot : undefined,
      styles: PDF_TABLE_BASE_STYLES,
      headStyles: PDF_TABLE_HEAD_STYLES,
      bodyStyles: PDF_TABLE_BODY_STYLES,
      footStyles: PDF_TABLE_FOOT_STYLES,
      columnStyles: opts.columnStyles,
      ...PDF_TABLE_AUTOTABLE_LAYOUT,
      showFoot: isLast && opts.foot ? "lastPage" : "never",
      didDrawPage: (data: { pageNumber: number }) => {
        // autoTable created an extra page inside this chunk — redraw continuation header.
        if (data.pageNumber > 1 && opts.onNewPage) {
          opts.onNewPage();
        }
        opts.didDrawPage?.(data);
      },
    });

    y = (pdf.lastAutoTable?.finalY ?? y) + 4;
  });

  return y;
}
