/**
 * Estimate how many farmer/item body rows fit on a PDF page given measured layout.
 * Used by invoice, debit-note, and quotation generators instead of a fixed row count.
 */
export function estimatePdfFarmerRowsPerPage(opts: {
  pageHeight: number;
  contentStartY: number;
  bottomMargin: number;
  tableHeadHeight: number;
  rowHeight: number;
  /** Space to reserve below the body (e.g. foot / closing) on this page. */
  reservedBelowTable?: number;
}): number {
  const reserved = opts.reservedBelowTable ?? 0;
  const available =
    opts.pageHeight -
    opts.contentStartY -
    opts.bottomMargin -
    opts.tableHeadHeight -
    reserved;
  if (available <= 0 || opts.rowHeight <= 0) return 1;
  return Math.max(1, Math.floor(available / opts.rowHeight));
}

/**
 * Split rows using a (possibly smaller) first-page capacity and a larger
 * capacity for continuation pages.
 */
export function chunkPdfRowsByCapacities<T>(
  rows: T[],
  firstPageCapacity: number,
  nextPageCapacity: number,
): T[][] {
  if (rows.length === 0) return [[]];
  const first = Math.max(1, Math.floor(firstPageCapacity));
  const next = Math.max(1, Math.floor(nextPageCapacity));
  const chunks: T[][] = [];
  let offset = 0;
  chunks.push(rows.slice(offset, offset + first));
  offset += first;
  while (offset < rows.length) {
    chunks.push(rows.slice(offset, offset + next));
    offset += next;
  }
  return chunks;
}

/**
 * Pack table body rows so the last page always has room for totals/foot rows.
 * Capacities are measured in body-row units from available page height.
 *
 * Rules:
 * - Fill each page with as many complete rows as fit.
 * - Never split a single row across pages (chunking is whole rows only).
 * - Reserve space on the final page for Subtotal / GST / Grand Total.
 * - If body + foot cannot fit together, move the final few body rows with the foot.
 */
export function packPdfTableRowsWithFoot<T>(opts: {
  rows: T[];
  firstPageCapacity: number;
  nextPageCapacity: number;
  /**
   * How many body-row units the foot/totals need on the final page.
   * Those units are reserved so totals stay with the last items.
   */
  lastPageFootReserveRows?: number;
}): T[][] {
  const rows = opts.rows;
  if (rows.length === 0) return [[]];

  const first = Math.max(1, Math.floor(opts.firstPageCapacity));
  const next = Math.max(1, Math.floor(opts.nextPageCapacity));
  const footReserve = Math.max(0, Math.floor(opts.lastPageFootReserveRows ?? 0));
  const firstWithFoot = Math.max(1, first - footReserve);
  const nextWithFoot = Math.max(1, next - footReserve);

  // Everything fits on page 1 including foot.
  if (rows.length <= firstWithFoot) {
    return [rows];
  }

  // Body fits on page 1, but not with foot — move a tail onto page 2 with the foot.
  if (rows.length <= first) {
    const page2Count = Math.min(nextWithFoot, rows.length);
    const page1Count = rows.length - page2Count;
    if (page1Count <= 0) {
      return [rows.slice(0, firstWithFoot), rows.slice(firstWithFoot)];
    }
    return [rows.slice(0, page1Count), rows.slice(page1Count)];
  }

  const chunks: T[][] = [];
  let offset = 0;

  chunks.push(rows.slice(0, first));
  offset = first;

  while (offset < rows.length) {
    const left = rows.length - offset;
    if (left <= nextWithFoot) {
      chunks.push(rows.slice(offset));
      break;
    }
    if (left <= next) {
      // Body fits on one more page, but not with foot — split so foot has room.
      const forLast = nextWithFoot;
      const forThis = left - forLast;
      if (forThis <= 0) {
        chunks.push(rows.slice(offset));
        break;
      }
      chunks.push(rows.slice(offset, offset + forThis));
      offset += forThis;
      chunks.push(rows.slice(offset));
      break;
    }
    chunks.push(rows.slice(offset, offset + next));
    offset += next;
  }

  return chunks;
}

/**
 * @deprecated Prefer {@link packPdfTableRowsWithFoot} with measured capacities.
 */
export function chunkPdfRows<T>(rows: T[], pageSize: number): T[][] {
  return chunkPdfRowsByCapacities(rows, pageSize, pageSize);
}

/** Legacy default — only used as a fallback when height cannot be measured. */
export const PDF_FARMER_ROWS_PER_PAGE = 10;
